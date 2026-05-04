package com.adl.targo.features.drill

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.connection.ConnectionRepository
import com.adl.targo.data.udp.UdpShotRepository
import com.adl.targo.domain.model.DrillState
import com.adl.targo.simulator.SimulatedShotRepository
import com.adl.targo.simulator.SimulatorModeManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val TAG = "DrillViewModel"

@HiltViewModel
class DrillViewModel @Inject constructor(
    private val udpRepository: UdpShotRepository,
    private val simulatedRepository: SimulatedShotRepository,
    private val simulatorModeManager: SimulatorModeManager,
    private val connectionRepository: ConnectionRepository
) : ViewModel() {

    val isSimulatorMode = simulatorModeManager.isSimulatorMode
    val wifiStatus = connectionRepository.wifiStatus
    val targetStatus = connectionRepository.targetStatus

    fun toggleSimulatorMode() = simulatorModeManager.toggle()
    fun refreshWifiStatus() = connectionRepository.checkWifi()
    fun startUdpListening() { if (!simulatorModeManager.isSimulatorMode.value) udpRepository.startListening() }
    fun stopUdpListening() { udpRepository.stopListening() }

    private val _state = MutableStateFlow(DrillState())
    val state: StateFlow<DrillState> = _state.asStateFlow()

    private var shotJob: Job? = null
    private var timerJob: Job? = null

    fun setup(shooterName: String, totalBullets: Int) {
        _state.update { it.copy(shooterName = shooterName, totalBullets = totalBullets) }
    }

    fun startDrill() {
        val now = System.currentTimeMillis()
        _state.update {
            it.copy(
                isRunning = true,
                shots = emptyList(),
                elapsedMs = 0L,
                startTimestamp = now,
                isDrillComplete = false
            )
        }
        if (!simulatorModeManager.isSimulatorMode.value) connectionRepository.startKeepaliveMonitoring()
        startTimer()
        startCollecting()
    }

    fun resetDrill() {
        shotJob?.cancel()
        timerJob?.cancel()
        connectionRepository.stopKeepaliveMonitoring()
        _state.value = DrillState()
    }

    fun pauseDrill() {
        Log.d(TAG, "pauseDrill called", Throwable())
        timerJob?.cancel()
        // Do NOT cancel shotJob — the UDP socket must stay open so keepalives keep flowing.
        // Shots received while paused are ignored by the isRunning check in startCollecting().
        _state.update { it.copy(isRunning = false) }
    }

    fun resumeDrill() {
        _state.update { it.copy(isRunning = true) }
        startTimer()
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (_state.value.isRunning) {
                delay(100L)
                _state.update { it.copy(elapsedMs = it.elapsedMs + 100L) }
            }
        }
    }

    private fun startCollecting() {
        shotJob?.cancel()
        val isSimMode = simulatorModeManager.isSimulatorMode.value
        val flow = if (isSimMode) simulatedRepository.shotFlow() else udpRepository.shots
        shotJob = viewModelScope.launch {
            flow.collect { shot ->
                val current = _state.value
                if (!current.isRunning) return@collect
                // Ignore shots outside the target coordinate space
                if (shot.x < 0f || shot.x > 1f || shot.y < 0f || shot.y > 1f) return@collect
                // In sim mode ignore bullet count limit; real mode stops at totalBullets
                if (!isSimMode && current.shots.size >= current.totalBullets) return@collect
                val updated = current.copy(shots = current.shots + shot, targetType = shot.targetType)
                _state.value = updated
                if (!isSimMode && updated.shots.size >= updated.totalBullets) {
                    timerJob?.cancel()
                    // Do NOT cancel shotJob — socket must stay open for keepalives
                    _state.update { it.copy(isRunning = false) }
                }
            }
            // Sim flow exhausted — stop timer
            if (isSimMode) {
                timerJob?.cancel()
                _state.update { it.copy(isRunning = false) }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
    }
}
