package com.adl.targo.simulator

import android.content.Context
import android.util.Log
import com.adl.targo.domain.model.ShotData
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "SimulatedShotRepository"
private const val SHOT_INTERVAL_MS = 3000L

@Singleton
class SimulatedShotRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    fun shotFlow(): Flow<ShotData> = flow {
        val shots = loadShots()
        Log.d(TAG, "Starting simulation with ${shots.size} shots, interval ${SHOT_INTERVAL_MS}ms")
        shots.forEachIndexed { index, shot ->
            delay(SHOT_INTERVAL_MS)
            Log.d(TAG, "Simulated shot ${index + 1}: x=${shot.x}, y=${shot.y}")
            emit(shot)
        }
        Log.d(TAG, "Simulation complete — all shots emitted")
    }.flowOn(Dispatchers.IO)

    private fun loadShots(): List<ShotData> {
        return try {
            context.assets.open("simulator_shots.csv")
                .bufferedReader()
                .readLines()
                .mapIndexedNotNull { index, line ->
                    val parts = line.split(",")
                    if (parts.size < 2) return@mapIndexedNotNull null
                    try {
                        ShotData(
                            x = parts[0].trim().toFloat(),
                            y = parts[1].trim().toFloat(),
                            shotNumber = index + 1,
                            timestamp = System.currentTimeMillis()
                        )
                    } catch (e: NumberFormatException) {
                        Log.w(TAG, "Skipping malformed line: $line")
                        null
                    }
                }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load simulator_shots.csv", e)
            emptyList()
        }
    }
}
