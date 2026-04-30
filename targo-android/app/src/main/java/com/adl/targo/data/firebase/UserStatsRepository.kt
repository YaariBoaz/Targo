package com.adl.targo.data.firebase

import com.adl.targo.domain.model.UserProfile
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserStatsRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
) {
    suspend fun getUserProfile(uid: String): UserProfile = coroutineScope {
        // Load user doc, drills, and bullets in parallel
        val userDocDeferred = async {
            firestore.collection("users").document(uid).get().await()
        }
        val drillsDeferred = async {
            firestore.collection("users").document(uid)
                .collection("drills").get().await()
        }
        val bulletsDeferred = async {
            firestore.collection("userBullets").document(uid).get().await()
        }

        val userDoc = userDocDeferred.await()
        val drillsSnap = drillsDeferred.await()
        val bulletsDoc = bulletsDeferred.await()

        // ── User identity ─────────────────────────────────────────────────
        val displayName = userDoc.getString("displayName") ?: ""
        val photoURL = userDoc.getString("photoURL") ?: ""
        val nickname = userDoc.getString("nickname") ?: ""
        val email = userDoc.getString("email") ?: ""
        val shooterLevel = userDoc.getString("shooterLevel") ?: "recruit"

        // ── Bullets ───────────────────────────────────────────────────────
        val bullets = (bulletsDoc.getLong("bulletCount") ?: 0L).toInt()

        // ── Drill statistics ──────────────────────────────────────────────
        val drills = drillsSnap.documents
        val totalDrills = drills.size

        var totalBulletsPlanned = 0L
        var totalShotsFired = 0L
        var totalScore = 0.0
        var scoredDrills = 0
        var totalDistance = 0.0
        var distanceDrills = 0

        drills.forEach { doc ->
            // numberOfBullets planned
            val setup = doc.get("drillSetup") as? Map<*, *>
            val planned = (setup?.get("numberOfBullets") as? Long) ?: 0L
            totalBulletsPlanned += planned

            // shots fired (shots array length)
            val shots = doc.get("shots") as? List<*>
            totalShotsFired += (shots?.size ?: 0).toLong()

            // ADL score
            val score = doc.getDouble("score")
            if (score != null) {
                totalScore += score
                scoredDrills++
            }

            // avg distance from center
            val stats = doc.get("statistics") as? Map<*, *>
            val dist = (stats?.get("avgDistance") as? Number)?.toDouble()
            if (dist != null && dist > 0) {
                totalDistance += dist
                distanceDrills++
            }
        }

        val avgHitRatio = if (totalBulletsPlanned > 0)
            (totalShotsFired.toDouble() / totalBulletsPlanned) * 100.0
        else 0.0

        val avgScore = if (scoredDrills > 0) totalScore / scoredDrills else 0.0
        val avgDistance = if (distanceDrills > 0) totalDistance / distanceDrills else 0.0

        UserProfile(
            uid = uid,
            email = email,
            displayName = displayName,
            photoURL = photoURL,
            nickname = nickname,
            shooterLevel = shooterLevel,
            bullets = bullets,
            totalDrills = totalDrills,
            avgHitRatio = avgHitRatio,
            avgScore = avgScore,
            avgDistance = avgDistance,
        )
    }
}
