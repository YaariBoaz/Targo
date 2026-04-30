package com.adl.targo.data.udp

import android.content.Context
import android.net.wifi.WifiManager
import android.util.Log
import com.adl.targo.data.connection.ConnectionRepository
import com.adl.targo.data.settings.SettingsRepository
import com.adl.targo.domain.model.ShotData
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.SocketException
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "UdpShotRepository"
private const val UDP_PORT = 23456
private const val BUFFER_SIZE = 256

@Singleton
class UdpShotRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val connectionRepository: ConnectionRepository,
    private val settingsRepository: SettingsRepository
) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _shots = MutableSharedFlow<ShotData>(extraBufferCapacity = 64)
    val shots: SharedFlow<ShotData> = _shots.asSharedFlow()

    @Volatile private var activeSocket: DatagramSocket? = null
    private var listenerJob: Job? = null

    fun startListening() {
        if (listenerJob?.isActive == true) {
            Log.d(TAG, "startListening() — already active, skipping")
            return
        }
        Log.d(TAG, "startListening()")
        listenerJob = scope.launch { receiveLoop() }
    }

    fun restartListening() {
        Log.d(TAG, "restartListening()")
        listenerJob?.cancel()
        activeSocket?.close()
        activeSocket = null
        listenerJob = scope.launch { receiveLoop() }
    }

    fun stopListening() {
        Log.d(TAG, "stopListening()")
        listenerJob?.cancel()
        listenerJob = null
        activeSocket?.close()
        activeSocket = null
    }

    private suspend fun receiveLoop() {
        val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val multicastLock = wifiManager.createMulticastLock("targo_udp_lock").apply {
            setReferenceCounted(true)
            acquire()
        }

        Log.d(TAG, "Opening UDP socket on port $UDP_PORT")
        val socket = try {
            DatagramSocket(UDP_PORT)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open socket: ${e.message}")
            if (multicastLock.isHeld) multicastLock.release()
            return
        }
        activeSocket = socket
        Log.d(TAG, "Listening on UDP port $UDP_PORT")

        val buf = ByteArray(BUFFER_SIZE)
        val packet = DatagramPacket(buf, buf.size)
        try {
            while (true) {
                socket.receive(packet)
                val raw = String(packet.data, 0, packet.length).trim()
                Log.d(TAG, "Raw packet from ${packet.address}: \"$raw\"")
                if (raw.startsWith("ka", ignoreCase = true)) {
                    val camFilter = settingsRepository.cameraNumber.value
                    val kaParts = raw.split(",")
                    val kaCam = if (kaParts.size >= 2) kaParts[1].trim().toIntOrNull() else null
                    if (camFilter > 0 && kaCam != camFilter) continue
                    connectionRepository.onKeepaliveReceived()
                    continue
                }
                val camFilter = settingsRepository.cameraNumber.value
                val shot = parse(raw, camFilter) ?: continue
                Log.d(TAG, "Shot received: $shot")
                _shots.emit(shot)
            }
        } catch (e: SocketException) {
            Log.d(TAG, "Socket closed")
        } finally {
            socket.close()
            if (activeSocket === socket) activeSocket = null
            if (multicastLock.isHeld) multicastLock.release()
        }
    }

    private fun parse(raw: String, cameraFilter: Int): ShotData? {
        val parts = raw.split(",")
        if (parts.size < 3) return null
        val targetId = parts[2].trim().toIntOrNull() ?: 0
        if (cameraFilter > 0) {
            val camNum = parts[2].trim().toIntOrNull()
            if (camNum != cameraFilter) return null
        }
        val targetType = if (parts.size >= 5) parts[4].trim().toIntOrNull() ?: 2 else 2
        return try {
            ShotData(
                x = parts[0].trim().toFloat(),
                y = parts[1].trim().toFloat(),
                shotNumber = targetId,
                targetType = targetType,
                timestamp = System.currentTimeMillis()
            )
        } catch (e: NumberFormatException) {
            Log.w(TAG, "Failed to parse packet: $raw")
            null
        }
    }
}
