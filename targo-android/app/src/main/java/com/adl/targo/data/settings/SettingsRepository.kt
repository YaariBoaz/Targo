package com.adl.targo.data.settings

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

private const val PREFS_NAME = "targo_settings"
private const val KEY_CAMERA_NUMBER = "camera_number"
private const val KEY_WIFI_SSID = "wifi_ssid"
private const val DEFAULT_WIFI_SSID = "adl4"

@Singleton
class SettingsRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _cameraNumber = MutableStateFlow(prefs.getInt(KEY_CAMERA_NUMBER, 0))
    val cameraNumber: StateFlow<Int> = _cameraNumber.asStateFlow()

    private val _wifiSsid = MutableStateFlow(prefs.getString(KEY_WIFI_SSID, DEFAULT_WIFI_SSID) ?: DEFAULT_WIFI_SSID)
    val wifiSsid: StateFlow<String> = _wifiSsid.asStateFlow()

    fun saveCameraNumber(number: Int) {
        prefs.edit().putInt(KEY_CAMERA_NUMBER, number).apply()
        _cameraNumber.value = number
    }

    fun saveWifiSsid(ssid: String) {
        prefs.edit().putString(KEY_WIFI_SSID, ssid).apply()
        _wifiSsid.value = ssid
    }
}
