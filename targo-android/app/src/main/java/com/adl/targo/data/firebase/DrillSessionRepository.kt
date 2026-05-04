package com.adl.targo.data.firebase

import android.util.Log
import com.adl.targo.domain.model.DrillSessionRecord
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "DrillSessionRepository"

@Singleton
class DrillSessionRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
) {
    /** Saves a drill session and returns the generated document ID. */
    suspend fun saveDrillSession(uid: String, record: DrillSessionRecord): String {
        val docRef = firestore.collection("users").document(uid).collection("drills").document()

        val data = buildMap<String, Any> {
            put("drillSetup", mapOf(
                "numberOfBullets" to record.setup.numberOfBullets,
                "distance" to record.setup.distance,
                "weaponName" to record.setup.weaponName,
                "weaponType" to record.setup.weaponType,
                "weaponCategory" to record.setup.weaponCategory,
            ))
            put("shots", record.shots.map { s ->
                mapOf(
                    "id" to s.id,
                    "x" to s.x,
                    "y" to s.y,
                    "timestamp" to s.timestamp,
                    "splitTime" to s.splitTime,
                    "distanceFromCenter" to s.distanceFromCenter,
                )
            })
            put("statistics", mapOf(
                "totalShots" to record.totalShots,
                "totalTime" to record.totalTime,
                "avgSplitTime" to record.avgSplitTime,
                "avgDistance" to record.avgDistance,
                "grouping" to record.grouping,
            ))
            put("completedAt", Timestamp.now())
            put("uid", uid)
            put("source", record.source)
            record.score?.let { put("score", it) }
            record.stars?.let { put("stars", it) }
            record.challengeId?.let { put("challengeId", it) }
            record.challengeDrillId?.let { put("challengeDrillId", it) }
        }

        docRef.set(data).await()
        Log.d(TAG, "Saved drill session: ${docRef.id}")
        return docRef.id
    }

    /** Updates the global leaderboard entry for this user (matches Ionic schema). */
    suspend fun updateUserScore(
        uid: String,
        displayName: String,
        photoURL: String,
        ratingPointsToAdd: Int,
    ) {
        val ref = firestore.collection("user-scores").document(uid)
        ref.set(
            mapOf(
                "displayName" to displayName,
                "photoURL" to photoURL,
                "ratingPoints" to FieldValue.increment(ratingPointsToAdd.toLong()),
                "totalDrills" to FieldValue.increment(1L),
            ),
            com.google.firebase.firestore.SetOptions.merge()
        ).await()
        Log.d(TAG, "Updated user-scores for $uid +$ratingPointsToAdd ratingPoints")
    }

    /** Updates challenge progress after a challenge drill completion. */
    suspend fun updateDrillAttempt(
        uid: String,
        challengeId: String,
        drillId: String,
        drillSessionId: String,
        score: Int,
        stars: Int,
    ) {
        val progressRef = firestore.collection("users").document(uid)
            .collection("challengeProgress").document(challengeId)
        val attemptRef = progressRef.collection("drillAttempts").document(drillId)

        val existingSnap = runCatching { attemptRef.get().await() }.getOrNull()
        val wasCompleted = existingSnap?.getString("status") == "completed"
        val existingBestScore = (existingSnap?.getLong("bestScore") ?: 0L).toInt()
        val existingBestStars = (existingSnap?.getLong("bestStars") ?: 0L).toInt()

        attemptRef.set(mapOf(
            "status" to "completed",
            "score" to score,
            "stars" to stars,
            "bestScore" to maxOf(existingBestScore, score),
            "bestStars" to maxOf(existingBestStars, stars),
            "completedAt" to Timestamp.now(),
            "drillSessionId" to drillSessionId,
        )).await()

        if (!wasCompleted) {
            // Ensure progress doc exists, then increment
            val progressSnap = runCatching { progressRef.get().await() }.getOrNull()
            if (progressSnap?.exists() == true) {
                progressRef.update("completedDrills", FieldValue.increment(1)).await()
            } else {
                progressRef.set(mapOf(
                    "completedDrills" to 1,
                    "startedAt" to Timestamp.now(),
                )).await()
            }
        }

        Log.d(TAG, "Updated drill attempt for challenge=$challengeId drill=$drillId score=$score stars=$stars")
    }
}
