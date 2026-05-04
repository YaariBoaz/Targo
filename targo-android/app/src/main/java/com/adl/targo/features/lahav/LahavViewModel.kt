package com.adl.targo.features.lahav

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.firebase.LahavSessionRepository
import com.adl.targo.domain.model.LahavSession
import com.adl.targo.domain.model.LahavShooter
import com.adl.targo.domain.model.ShotData
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers
import javax.inject.Inject

private const val TAG = "LahavViewModel"

@HiltViewModel
class LahavViewModel @Inject constructor(
    private val repository: LahavSessionRepository
) : ViewModel() {

    private val _sessions = MutableStateFlow<List<LahavSession>>(emptyList())
    val sessions: StateFlow<List<LahavSession>> = _sessions.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _activeSession = MutableStateFlow<LahavSession?>(null)
    val activeSession: StateFlow<LahavSession?> = _activeSession.asStateFlow()

    private val _activeShooter = MutableStateFlow<LahavShooter?>(null)
    val activeShooter: StateFlow<LahavShooter?> = _activeShooter.asStateFlow()

    /** 0-based: number of steps already completed by the active shooter */
    private val _currentStep = MutableStateFlow(0)
    val currentStep: StateFlow<Int> = _currentStep.asStateFlow()

    private val _totalSteps = MutableStateFlow(1)
    val totalSteps: StateFlow<Int> = _totalSteps.asStateFlow()

    /** completedSteps per shooterId, loaded when a session is selected */
    private val _shooterProgressMap = MutableStateFlow<Map<String, Int>>(emptyMap())
    val shooterProgressMap: StateFlow<Map<String, Int>> = _shooterProgressMap.asStateFlow()

    private var sessionWatchJob: Job? = null

    init { watchSessions() }

    private fun watchSessions() {
        viewModelScope.launch {
            repository.watchSessions()
                .catch { e -> Log.e(TAG, "watchSessions error", e); _isLoading.value = false }
                .collect { list -> _sessions.value = list; _isLoading.value = false }
        }
    }

    fun selectSession(session: LahavSession) {
        _activeSession.value = session
        _totalSteps.value = session.totalSteps
        _shooterProgressMap.value = emptyMap()
        loadProgressMap(session)
        sessionWatchJob?.cancel()
        sessionWatchJob = viewModelScope.launch {
            repository.watchSession(session.sessionId)
                .catch { e -> Log.e(TAG, "watchSession error", e) }
                .collect { updated -> _activeSession.value = updated }
        }
    }

    fun refreshProgressMap() {
        _activeSession.value?.let { loadProgressMap(it) }
    }

    private fun loadProgressMap(session: LahavSession) {
        viewModelScope.launch {
            val map = mutableMapOf<String, Int>()
            session.shooters.forEach { ref ->
                map[ref.id] = try {
                    repository.loadShooterProgress(session.sessionId, ref.id)
                } catch (e: Exception) { 0 }
            }
            _shooterProgressMap.value = map
        }
    }

    fun selectShooter(shooter: LahavShooter) {
        _activeShooter.value = shooter
        viewModelScope.launch {
            val steps = try {
                repository.loadShooterProgress(
                    _activeSession.value?.sessionId ?: return@launch,
                    shooter.shooterId
                )
            } catch (e: Exception) { 0 }
            _currentStep.value = steps
            _shooterProgressMap.update { it + (shooter.shooterId to steps) }
        }
    }

    private suspend fun saveDrillResult(shots: List<ShotData>, startTimestamp: Long, totalTimeMs: Long) {
        val session = _activeSession.value
        val shooter = _activeShooter.value
        Log.d(TAG, "saveDrillResult called — session=$session shooter=$shooter shots=${shots.size} currentStep=${_currentStep.value}")
        if (session == null) { Log.e(TAG, "ABORT: session is null"); return }
        if (shooter == null) { Log.e(TAG, "ABORT: shooter is null"); return }
        val newStep = _currentStep.value + 1
        Log.d(TAG, "Writing step $newStep for shooter=${shooter.shooterId} session=${session.sessionId}")
        try {
            repository.saveShooterProgress(
                sessionId = session.sessionId,
                shooterId = shooter.shooterId,
                shooterName = shooter.name,
                instructorName = session.instructorName,
                stepNumber = newStep,
                stepName = session.drillType,
                shots = shots,
                startTimestamp = startTimestamp,
                totalTimeMs = totalTimeMs
            )
            _shooterProgressMap.update { it + (shooter.shooterId to newStep) }
            Log.d(TAG, "SUCCESS: step $newStep saved")
        } catch (e: Exception) {
            Log.e(TAG, "FAILED to save step", e)
        }
    }

    fun completeStep(shots: List<ShotData>, startTimestamp: Long, totalTimeMs: Long, onDone: () -> Unit) {
        Log.d(TAG, "completeStep called with ${shots.size} shots")
        viewModelScope.launch {
            saveDrillResult(shots, startTimestamp, totalTimeMs)
            resetStep()
            withContext(Dispatchers.Main) { onDone() }
        }
    }

    fun completeStepAndContinue(shots: List<ShotData>, startTimestamp: Long, totalTimeMs: Long, onDone: () -> Unit) {
        Log.d(TAG, "completeStepAndContinue called with ${shots.size} shots")
        viewModelScope.launch {
            saveDrillResult(shots, startTimestamp, totalTimeMs)
            incrementStep()
            withContext(Dispatchers.Main) { onDone() }
        }
    }

    fun incrementStep() { _currentStep.value++ }
    fun resetStep() { _currentStep.value = 0; _activeShooter.value = null }

    override fun onCleared() {
        super.onCleared()
        sessionWatchJob?.cancel()
    }
}
