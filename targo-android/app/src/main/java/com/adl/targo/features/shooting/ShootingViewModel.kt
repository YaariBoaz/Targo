package com.adl.targo.features.shooting

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.DrillSetupRepository
import com.adl.targo.data.connection.ConnectionRepository
import com.adl.targo.data.connection.TargetStatus
import com.adl.targo.data.connection.WifiStatus
import com.adl.targo.data.firebase.AuthRepository
import com.adl.targo.data.firebase.DrillSessionRepository
import com.adl.targo.data.udp.UdpShotRepository
import com.adl.targo.domain.model.CompletionResult
import com.adl.targo.domain.model.DrillSessionRecord
import com.adl.targo.domain.model.DrillSetup
import com.adl.targo.domain.model.ScoringCriteria
import com.adl.targo.domain.model.ShotRecord
import com.adl.targo.simulator.SimulatedShotRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

private const val TAG = "ShootingViewModel"
private const val PHYSICAL_W = 50f  // cm
private const val PHYSICAL_H = 80f  // cm

@HiltViewModel
class ShootingViewModel @Inject constructor(
    val drillSetupRepository: DrillSetupRepository,
    private val authRepository: AuthRepository,
    private val drillSessionRepository: DrillSessionRepository,
    private val udpShotRepository: UdpShotRepository,
    private val simulatedShotRepository: SimulatedShotRepository,
    private val connectionRepository: ConnectionRepository,
) : ViewModel() {

    val setup: DrillSetup? get() = drillSetupRepository.currentSetup

    private val _shots = MutableStateFlow<List<ShotRecord>>(emptyList())
    val shots: StateFlow<List<ShotRecord>> = _shots.asStateFlow()

    private val _totalTime = MutableStateFlow(0)
    val totalTime: StateFlow<Int> = _totalTime.asStateFlow()

    private val _grouping = MutableStateFlow(0f)
    val grouping: StateFlow<Float> = _grouping.asStateFlow()

    private val _isDrillStopped = MutableStateFlow(false)
    val isDrillStopped: StateFlow<Boolean> = _isDrillStopped.asStateFlow()

    private val _confirmingFinish = MutableStateFlow(false)
    val confirmingFinish: StateFlow<Boolean> = _confirmingFinish.asStateFlow()

    private val _isDemoMode = MutableStateFlow(false)
    val isDemoMode: StateFlow<Boolean> = _isDemoMode.asStateFlow()

    private val _completionResult = MutableStateFlow<CompletionResult?>(null)
    val completionResult: StateFlow<CompletionResult?> = _completionResult.asStateFlow()

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    val targetStatus: StateFlow<TargetStatus> = connectionRepository.targetStatus

    private var timerJob: Job? = null
    private var shotJob: Job? = null
    private var simulatorJob: Job? = null
    private var isDrillPaused = false
    private var startTimeMs = 0L
    private var elapsedAtPause = 0  // seconds stored when paused

    // ── Lifecycle ────────────────────────────────────────────────────────────

    fun startShooting() {
        _shots.value = emptyList()
        _totalTime.value = 0
        _grouping.value = 0f
        _isDrillStopped.value = false
        _confirmingFinish.value = false
        _completionResult.value = null
        isDrillPaused = false
        elapsedAtPause = 0

        startTimer()

        val demoMode = connectionRepository.wifiStatus.value != WifiStatus.CONNECTED_TO_TARGO
        _isDemoMode.value = demoMode

        if (!demoMode) {
            // Listening was already started on WifiConnectionScreen; this is a no-op if active
            udpShotRepository.startListening()
            collectUdpShots()
        } else {
            Log.d(TAG, "Demo mode — starting simulator")
            collectSimulatorShots()
        }
    }

    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
        shotJob?.cancel()
        simulatorJob?.cancel()
        udpShotRepository.stopListening()
    }

    // ── Timer ─────────────────────────────────────────────────────────────────

    private fun startTimer() {
        startTimeMs = System.currentTimeMillis()
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (true) {
                delay(500L)
                if (!isDrillPaused && !_isDrillStopped.value) {
                    _totalTime.value = ((System.currentTimeMillis() - startTimeMs) / 1000).toInt()
                }
            }
        }
    }

    // ── Shot collection ───────────────────────────────────────────────────────

    private fun collectUdpShots() {
        shotJob?.cancel()
        shotJob = viewModelScope.launch {
            udpShotRepository.shots.collect { shotData ->
                if (!isDrillPaused && !_isDrillStopped.value) {
                    onShotReceived(shotData.x, shotData.y)
                }
            }
        }
    }

    private fun collectSimulatorShots() {
        simulatorJob?.cancel()
        simulatorJob = viewModelScope.launch {
            simulatedShotRepository.shotFlow().collect { shotData ->
                if (!isDrillPaused && !_isDrillStopped.value) {
                    onShotReceived(shotData.x, shotData.y)
                }
            }
        }
    }

    private fun onShotReceived(x: Float, y: Float) {
        val currentShots = _shots.value
        val setup = setup ?: return

        if (currentShots.size >= setup.numberOfBullets) return

        val shotNumber = currentShots.size + 1
        val currentTime = _totalTime.value
        val prevTime = currentShots.lastOrNull()?.timestamp ?: 0
        val splitTime = currentTime - prevTime
        val dist = distanceFromCenter(x, y)

        val record = ShotRecord(
            id = shotNumber,
            x = x,
            y = y,
            timestamp = currentTime,
            splitTime = splitTime,
            distanceFromCenter = dist,
        )

        val updatedShots = currentShots + record
        _shots.value = updatedShots
        _grouping.value = calculateGrouping(updatedShots)

        if (updatedShots.size >= setup.numberOfBullets) {
            completeDrill()
        }
    }

    // ── Controls ──────────────────────────────────────────────────────────────

    fun handleStopFinish() {
        if (_isDrillStopped.value || _confirmingFinish.value) {
            completeDrill()
        } else {
            stopTimer()
            _isDrillStopped.value = true
            _confirmingFinish.value = true
        }
    }

    private fun stopTimer() {
        timerJob?.cancel()
        shotJob?.cancel()
        simulatorJob?.cancel()
    }

    fun pauseDrill() {
        if (isDrillPaused || _isDrillStopped.value) return
        elapsedAtPause = _totalTime.value
        timerJob?.cancel()
        simulatorJob?.cancel()
        isDrillPaused = true
    }

    fun resumeDrill() {
        if (!isDrillPaused) return
        isDrillPaused = false
        // Restart timer from where we left off
        startTimeMs = System.currentTimeMillis() - elapsedAtPause * 1000L
        startTimer()
        if (_isDemoMode.value) collectSimulatorShots()
    }

    fun saveAndExit() {
        completeDrill()
    }

    fun exitWithoutSaving() {
        stopTimer()
        _isDrillStopped.value = true
    }

    fun clearError() { _error.value = null }

    fun clearCompletion() { _completionResult.value = null }

    // ── Completion ────────────────────────────────────────────────────────────

    private fun completeDrill() {
        stopTimer()
        _isDrillStopped.value = true

        val setup = setup ?: return
        val shots = _shots.value
        val totalTime = _totalTime.value
        val grouping = _grouping.value

        val avgSplitTime = if (shots.isEmpty()) 0f
            else shots.sumOf { it.splitTime.toDouble() }.toFloat() / shots.size
        val avgDistance = if (shots.isEmpty()) 0f
            else shots.sumOf { it.distanceFromCenter.toDouble() }.toFloat() / shots.size

        val isChallenge = setup.source == "challenge"
        val criteria = setup.scoringCriteria

        val (score, stars) = if (isChallenge && criteria != null && totalTime > 0) {
            calculateAdlScore(totalTime, avgDistance, grouping, criteria)
        } else {
            Pair(0, 0)
        }

        val record = DrillSessionRecord(
            setup = setup,
            shots = shots,
            totalShots = shots.size,
            totalTime = totalTime,
            avgSplitTime = avgSplitTime,
            avgDistance = avgDistance,
            grouping = grouping,
            source = setup.source,
            score = if (isChallenge) score else null,
            stars = if (isChallenge) stars else null,
            challengeId = setup.challengeId,
            challengeDrillId = setup.challengeDrillId,
        )

        viewModelScope.launch {
            _isSaving.value = true
            try {
                val uid = authRepository.currentUser?.uid ?: throw Exception("Not logged in")
                val sessionId = drillSessionRepository.saveDrillSession(uid, record)
                Log.d(TAG, "Drill saved: $sessionId")

                if (isChallenge && setup.challengeId != null && setup.challengeDrillId != null) {
                    drillSessionRepository.updateDrillAttempt(
                        uid = uid,
                        challengeId = setup.challengeId,
                        drillId = setup.challengeDrillId,
                        drillSessionId = sessionId,
                        score = score,
                        stars = stars,
                    )
                }

                _completionResult.value = CompletionResult(
                    totalShots = shots.size,
                    totalTime = totalTime,
                    avgDistance = (avgDistance * 10).roundToInt() / 10f,
                    grouping = (grouping * 10).roundToInt() / 10f,
                    score = score,
                    stars = stars,
                    isChallenge = isChallenge,
                )
            } catch (e: Exception) {
                Log.e(TAG, "Failed to save drill", e)
                _error.value = "Failed to save drill: ${e.message}"
                // Still show completion even if save fails
                _completionResult.value = CompletionResult(
                    totalShots = shots.size,
                    totalTime = totalTime,
                    avgDistance = (avgDistance * 10).roundToInt() / 10f,
                    grouping = (grouping * 10).roundToInt() / 10f,
                    score = score,
                    stars = stars,
                    isChallenge = isChallenge,
                )
            } finally {
                _isSaving.value = false
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun distanceFromCenter(x: Float, y: Float): Float {
        val dx = (x - 0.5f) * PHYSICAL_W
        val dy = (y - 0.5f) * PHYSICAL_H
        return sqrt(dx * dx + dy * dy)
    }

    private fun calculateGrouping(shots: List<ShotRecord>): Float {
        if (shots.size < 2) return 0f
        var maxDist = 0f
        for (i in shots.indices) {
            for (j in i + 1 until shots.size) {
                val dx = (shots[i].x - shots[j].x) * PHYSICAL_W
                val dy = (shots[i].y - shots[j].y) * PHYSICAL_H
                maxDist = max(maxDist, sqrt(dx * dx + dy * dy))
            }
        }
        return maxDist
    }

    private fun calculateAdlScore(
        totalTime: Int,
        avgDistance: Float,
        grouping: Float,
        criteria: ScoringCriteria,
    ): Pair<Int, Int> {
        val timeScore = min(400, (400 * criteria.perfectTime.toFloat() / totalTime).roundToInt())
        val accuracyRatio = max(0f, 1f - avgDistance / criteria.maxAcceptableDistance)
        val accuracyScore = (400 * accuracyRatio).roundToInt()
        val groupingRatio = max(0f, 1f - grouping / criteria.maxAcceptableGrouping)
        val groupingScore = (200 * groupingRatio).roundToInt()
        val total = timeScore + accuracyScore + groupingScore

        val stars = when {
            total >= criteria.threeStars -> 3
            total >= criteria.twoStars   -> 2
            total >= criteria.oneStar    -> 1
            else                         -> 0
        }
        return Pair(total, stars)
    }

    fun formattedTime(seconds: Int): String {
        val m = seconds / 60
        val s = seconds % 60
        return "%d:%02d".format(m, s)
    }
}
