package com.adl.targo.features.settings

import androidx.lifecycle.ViewModel
import com.adl.targo.data.settings.SettingsRepository
import com.adl.targo.data.udp.UdpShotRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val udpRepository: UdpShotRepository
) : ViewModel() {

    val cameraNumber: StateFlow<Int> = settingsRepository.cameraNumber
    val wifiSsid: StateFlow<String> = settingsRepository.wifiSsid

    fun saveCameraNumber(number: Int) = settingsRepository.saveCameraNumber(number)

    fun saveWifiSsid(ssid: String) {
        settingsRepository.saveWifiSsid(ssid)
        udpRepository.restartListening()
    }
}
