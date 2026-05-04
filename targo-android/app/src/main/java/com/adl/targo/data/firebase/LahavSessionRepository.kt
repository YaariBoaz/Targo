package com.adl.targo.data.firebase

import android.util.Log
import com.adl.targo.domain.model.LahavSession
import com.adl.targo.domain.model.LahavShooter
import com.adl.targo.domain.model.LahavShooterRef
import com.adl.targo.domain.model.ShotData
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlin.math.sqrt
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.Calendar
import javax.inject.Inject
import javax.inject.Named
import javax.inject.Singleton

private const val TAG = "LahavSessionRepository"

@Singleton
class LahavSessionRepository @Inject constructor(
    @Named("lahav") private val db: FirebaseFirestore
) {

    fun watchSessions(): Flow<List<LahavSession>> = callbackFlow {
        val (start, end) = todayRange()
        Log.d(TAG, "watchSessions: querying range $start → $end")
        val listener = db.collection("sessions")
            .whereGreaterThanOrEqualTo("scheduledTime", start)
            .whereLessThanOrEqualTo("scheduledTime", end)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "watchSessions error", error)
                    close(error)
                    return@addSnapshotListener
                }
                val sessions = snapshot?.documents?.mapNotNull { it.toSession() } ?: emptyList()
                Log.d(TAG, "watchSessions: ${sessions.size} sessions received (${snapshot?.documents?.size} raw docs)")
                trySend(sessions)
            }
        awaitClose { listener.remove() }
    }

    fun watchSession(sessionId: String): Flow<LahavSession> = callbackFlow {
        val listener = db.collection("sessions").document(sessionId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "watchSession error", error)
                    close(error)
                    return@addSnapshotListener
                }
                val session = snapshot?.toSession() ?: return@addSnapshotListener
                trySend(session)
            }
        awaitClose { listener.remove() }
    }

    suspend fun loadShooterProgress(sessionId: String, shooterId: String): Int {
        val doc = db.collection("sessions").document(sessionId)
            .collection("shooterProgress").document(shooterId)
            .get().await()
        return doc.getLong("completedSteps")?.toInt() ?: 0
    }

    suspend fun saveShooterProgress(
        sessionId: String,
        shooterId: String,
        shooterName: String,
        instructorName: String,
        stepNumber: Int,
        stepName: String,
        shots: List<ShotData>,
        startTimestamp: Long,
        totalTimeMs: Long
    ) {
        val shotMaps = shots.mapIndexed { idx, shot ->
            val splitMs = if (idx == 0) shot.timestamp - startTimestamp
                          else shot.timestamp - shots[idx - 1].timestamp
            val dx = (shot.x - 0.5f) * 40f
            val dy = (shot.y - 0.5f) * 60f
            mapOf(
                "shotNumber" to (idx + 1),
                "x" to shot.x,
                "y" to shot.y,
                "timeElapsed" to formatMs(shot.timestamp - startTimestamp),
                "splitTime" to (splitMs / 1000f),
                "grouping" to sqrt(dx * dx + dy * dy)
            )
        }

        val avgSplitTime = if (shots.isNotEmpty()) totalTimeMs / shots.size / 1000f else 0f
        val avgGrouping = if (shots.isNotEmpty()) shots.map { shot ->
            val dx = (shot.x - 0.5f) * 40f
            val dy = (shot.y - 0.5f) * 60f
            sqrt(dx * dx + dy * dy)
        }.average().toFloat() else 0f

        val drillData = mapOf(
            "stepNumber" to stepNumber,
            "stepName" to stepName,
            "date" to Timestamp.now(),
            "instructorName" to instructorName,
            "totalTime" to formatMs(totalTimeMs),
            "totalTimeMs" to totalTimeMs,
            "avgSplitTime" to avgSplitTime,
            "avgGrouping" to avgGrouping,
            "shots" to shotMaps
        )

        val docRef = db.collection("sessions").document(sessionId)
            .collection("shooterProgress").document(shooterId)

        try {
            docRef.update(
                mapOf(
                    "shooterId" to shooterId,
                    "shooterName" to shooterName,
                    "completedSteps" to stepNumber,
                    "updatedAt" to Timestamp.now(),
                    "drills.$stepNumber" to drillData
                )
            ).await()
        } catch (e: Exception) {
            // Document doesn't exist yet — create it
            docRef.set(
                mapOf(
                    "shooterId" to shooterId,
                    "shooterName" to shooterName,
                    "completedSteps" to stepNumber,
                    "updatedAt" to Timestamp.now(),
                    "drills" to mapOf(stepNumber.toString() to drillData)
                )
            ).await()
        }
    }

    private fun formatMs(ms: Long): String {
        val totalSec = ms / 1000
        val min = totalSec / 60
        val sec = totalSec % 60
        val centis = (ms % 1000) / 10
        return "%02d:%02d.%02d".format(min, sec, centis)
    }

    private fun todayRange(): Pair<Timestamp, Timestamp> {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0); cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0); cal.set(Calendar.MILLISECOND, 0)
        val start = Timestamp(cal.time)
        cal.set(Calendar.HOUR_OF_DAY, 23); cal.set(Calendar.MINUTE, 59)
        cal.set(Calendar.SECOND, 59); cal.set(Calendar.MILLISECOND, 999)
        return start to Timestamp(cal.time)
    }

    @Suppress("UNCHECKED_CAST")
    private fun DocumentSnapshot.toSession(): LahavSession? = try {
        val shooters = (get("shooters") as? List<Map<String, Any>>)?.map { m ->
            LahavShooterRef(
                id    = m["id"] as? String ?: "",
                name  = m["name"] as? String ?: "",
                email = m["email"] as? String ?: ""
            )
        } ?: emptyList()
        val completedTurns = (get("completedTurns") as? List<String>) ?: emptyList()
        LahavSession(
            sessionId     = id,
            drillType     = getString("drillType") ?: getString("drill_type") ?: "—",
            instructorName = getString("instructorName") ?: getString("instructor_name") ?: "",
            lane          = get("lane")?.toString() ?: "",
            totalSteps    = getLong("totalSteps")?.toInt() ?: getLong("total_steps")?.toInt() ?: 1,
            bulletsPerStep = getLong("bulletsPerStep")?.toInt() ?: getLong("bullets_per_step")?.toInt() ?: 20,
            shooters      = shooters,
            completedTurns = completedTurns,
            scheduledTime = getTimestamp("scheduledTime")
        )
    } catch (e: Exception) {
        Log.w(TAG, "Failed to parse session $id", e)
        null
    }
}
