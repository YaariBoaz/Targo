package com.adl.targo.data.connection

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.wifi.WifiManager
import android.util.Log
import com.adl.targo.data.settings.SettingsRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "ConnectionRepository"
private const val KEEPALIVE_TIMEOUT_MS = 10000L

enum class WifiStatus { CONNECTED_TO_TARGO, WRONG_NETWORK, DISCONNECTED }
enum class TargetStatus { UNKNOWN, CONNECTED, DISCONNECTED }

@Singleton
class ConnectionRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val settingsRepository: SettingsRepository
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val _wifiStatus = MutableStateFlow(WifiStatus.DISCONNECTED)
    val wifiStatus: StateFlow<WifiStatus> = _wifiStatus.asStateFlow()

    private val _targetStatus = MutableStateFlow(TargetStatus.UNKNOWN)
    val targetStatus: StateFlow<TargetStatus> = _targetStatus.asStateFlow()

    @Volatile private var lastKeepaliveMs = 0L
    private var keepaliveJob: Job? = null

    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) { checkWifi() }
        override fun onLost(network: Network) { _wifiStatus.value = WifiStatus.DISCONNECTED }
        override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) { checkWifi() }
    }

    init {
        try {
            val request = NetworkRequest.Builder()
                .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                .build()
            connectivityManager.registerNetworkCallback(request, networkCallback)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register network callback", e)
        }
        checkWifi()
    }

    fun checkWifi() {
        val network = connectivityManager.activeNetwork
        val caps = connectivityManager.getNetworkCapabilities(network)

        if (caps == null || !caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            _wifiStatus.value = WifiStatus.DISCONNECTED
            return
        }

        val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
        @Suppress("DEPRECATION")
        val ssid = wifiManager.connectionInfo?.ssid?.removeSurrounding("\"") ?: ""
        Log.d(TAG, "Current WiFi SSID: $ssid")

        _wifiStatus.value = if (ssid == settingsRepository.wifiSsid.value) WifiStatus.CONNECTED_TO_TARGO
                            else WifiStatus.WRONG_NETWORK
    }

    fun onKeepaliveReceived() {
        lastKeepaliveMs = System.currentTimeMillis()
        _targetStatus.value = TargetStatus.CONNECTED
    }

    fun startKeepaliveMonitoring() {
        lastKeepaliveMs = System.currentTimeMillis() // grace period on start
        _targetStatus.value = TargetStatus.UNKNOWN
        keepaliveJob?.cancel()
        keepaliveJob = scope.launch {
            delay(KEEPALIVE_TIMEOUT_MS) // wait before first check
            while (true) {
                val elapsed = System.currentTimeMillis() - lastKeepaliveMs
                _targetStatus.value = if (elapsed <= KEEPALIVE_TIMEOUT_MS) TargetStatus.CONNECTED
                                      else TargetStatus.DISCONNECTED
                delay(1000L)
            }
        }
    }

    fun stopKeepaliveMonitoring() {
        keepaliveJob?.cancel()
        _targetStatus.value = TargetStatus.UNKNOWN
    }
}
