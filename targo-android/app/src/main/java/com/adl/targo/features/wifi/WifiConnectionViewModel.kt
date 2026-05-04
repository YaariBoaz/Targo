package com.adl.targo.features.wifi

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.connection.ConnectionRepository
import com.adl.targo.data.connection.TargetStatus
import com.adl.targo.data.settings.SettingsRepository
import com.adl.targo.data.udp.UdpShotRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class WifiConnectionViewModel @Inject constructor(
    private val connectionRepository: ConnectionRepository,
    private val udpShotRepository: UdpShotRepository,
    private val settingsRepository: SettingsRepository,
) : ViewModel() {

    val currentSsid: StateFlow<String> = connectionRepository.currentSsid
        .stateIn(viewModelScope, SharingStarted.Eagerly, "")

    val targetStatus: StateFlow<TargetStatus> = connectionRepository.targetStatus
        .stateIn(viewModelScope, SharingStarted.Eagerly, TargetStatus.UNKNOWN)

    val cameraNumber: StateFlow<Int> = settingsRepository.cameraNumber
        .stateIn(viewModelScope, SharingStarted.Eagerly, 0)

    fun onEnter() {
        connectionRepository.checkWifi()
        connectionRepository.startKeepaliveMonitoring()
        udpShotRepository.startListening()
    }

    fun updateWifiName(ssid: String) {
        settingsRepository.saveWifiSsid(ssid)
        // Reset and restart so the dot starts fresh with the new network name
        connectionRepository.stopKeepaliveMonitoring()
        udpShotRepository.restartListening()
        connectionRepository.startKeepaliveMonitoring()
    }

    fun onConfirm(ssid: String, cameraNumber: Int) {
        settingsRepository.saveWifiSsid(ssid)
        settingsRepository.saveCameraNumber(cameraNumber)
        connectionRepository.isSessionConnected = true
        // Keep keepalive monitoring running for the entire session
    }

    fun onBack() {
        // User cancelled — stop everything
        connectionRepository.stopKeepaliveMonitoring()
        udpShotRepository.stopListening()
    }
}
