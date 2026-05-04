package com.adl.targo.data.firebase

import android.util.Log
import com.adl.targo.domain.model.Challenge
import com.adl.targo.domain.model.ChallengeDrill
import com.adl.targo.domain.model.DrillStatus
import com.adl.targo.domain.model.ChallengeLeaderboardEntry
import com.adl.targo.domain.model.ScoringCriteria
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "ChallengeRepository"

@Singleton
class ChallengeRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
) {

    // ── Challenges list ──────────────────────────────────────────────────────

    suspend fun getChallenges(uid: String): List<Challenge> = coroutineScope {
        val challengesDeferred = async {
            // Only single-field filter — combining whereIn + whereEqualTo requires a composite index
            firestore.collection("challenges")
                .whereIn("type", listOf("global", "heroes"))
                .get().await()
        }
        val progressDeferred = async {
            firestore.collection("users").document(uid)
                .collection("challengeProgress").get().await()
        }

        val challengeDocs = challengesDeferred.await().documents
        Log.d(TAG, "getChallenges: found ${challengeDocs.size} challenge docs for uid=$uid")
        challengeDocs.forEach { Log.d(TAG, "  challenge: id=${it.id} type=${it.getString("type")} title=${it.getString("title")}") }
        val progressMap = progressDeferred.await().documents.associate { doc ->
            doc.id to (doc.getLong("completedDrills") ?: 0L).toInt()
        }

        challengeDocs.map { doc ->
            Challenge(
                id = doc.id,
                type = doc.getString("type") ?: "global",
                title = doc.getString("title") ?: "",
                description = doc.getString("description") ?: "",
                imageUrl = doc.getString("imageUrl") ?: "",
                difficulty = doc.getString("difficulty") ?: "easy",
                category = doc.getString("category") ?: "",
                drillsCount = (doc.getLong("drillsCount") ?: 0L).toInt(),
                isActive = doc.getBoolean("isActive") ?: true,
                completedDrills = progressMap[doc.id] ?: 0,
            )
        }
    }

    // ── Challenge drills ─────────────────────────────────────────────────────

    suspend fun getChallengeDrills(uid: String, challengeId: String): List<ChallengeDrill> =
        coroutineScope {
            val drillsDeferred = async {
                firestore.collection("challenges").document(challengeId)
                    .collection("drills")
                    .orderBy("order", Query.Direction.ASCENDING)
                    .get().await()
            }
            val attemptsDeferred = async {
                firestore.collection("users").document(uid)
                    .collection("challengeProgress").document(challengeId)
                    .collection("drillAttempts").get().await()
            }

            val drillDocs = drillsDeferred.await().documents
            val attemptMap = attemptsDeferred.await().documents.associate { doc ->
                doc.id to doc
            }

            drillDocs.mapIndexed { idx, doc ->
                val req = doc.get("requirements") as? Map<*, *>
                val info = doc.get("challengeInfo") as? Map<*, *>
                val attempt = attemptMap[doc.id]
                val prevDrillId = if (idx > 0) drillDocs[idx - 1].id else null
                val prevAttempt = prevDrillId?.let { attemptMap[it] }

                val status = when {
                    idx == 0 -> {
                        if (attempt?.getString("status") == "completed") DrillStatus.COMPLETED
                        else DrillStatus.AVAILABLE
                    }
                    attempt?.getString("status") == "completed" -> DrillStatus.COMPLETED
                    prevAttempt?.getString("status") == "completed" -> DrillStatus.AVAILABLE
                    else -> DrillStatus.LOCKED
                }

                val sc = doc.get("scoringCriteria") as? Map<*, *>
                val scoringCriteria = ScoringCriteria(
                    perfectTime = (sc?.get("perfectTime") as? Long)?.toInt() ?: 60,
                    maxAcceptableDistance = (sc?.get("maxAcceptableDistance") as? Number)?.toFloat() ?: 20f,
                    maxAcceptableGrouping = (sc?.get("maxAcceptableGrouping") as? Number)?.toFloat() ?: 30f,
                    threeStars = (sc?.get("threeStars") as? Long)?.toInt() ?: 900,
                    twoStars = (sc?.get("twoStars") as? Long)?.toInt() ?: 750,
                    oneStar = (sc?.get("oneStar") as? Long)?.toInt() ?: 600,
                )

                ChallengeDrill(
                    id = doc.id,
                    challengeId = challengeId,
                    order = (doc.getLong("order") ?: (idx + 1).toLong()).toInt(),
                    title = doc.getString("title") ?: "",
                    description = doc.getString("description") ?: "",
                    imageUrl = doc.getString("imageUrl") ?: "",
                    objective = (info?.get("objective") as? String) ?: "",
                    focusArea = (info?.get("focusArea") as? String) ?: "",
                    numberOfBullets = (req?.get("numberOfBullets") as? Long)?.toInt() ?: 15,
                    distance = (req?.get("distance") as? Long)?.toInt() ?: 50,
                    targetType = (req?.get("targetType") as? String) ?: "standard",
                    weaponCategory = (req?.get("weaponCategory") as? String) ?: "pistol",
                    weaponType = (req?.get("weaponType") as? String) ?: "glock-19",
                    weaponName = (req?.get("weaponName") as? String) ?: "Glock 19",
                    status = status,
                    bestScore = (attempt?.getLong("bestScore") ?: 0L).toInt(),
                    bestStars = (attempt?.getLong("bestStars") ?: 0L).toInt(),
                    scoringCriteria = scoringCriteria,
                )
            }
        }

    // ── Leaderboard ──────────────────────────────────────────────────────────

    suspend fun getChallengeLeaderboard(challengeId: String): List<ChallengeLeaderboardEntry> {
        val snap = firestore.collection("challenges").document(challengeId)
            .collection("leaderboard")
            .orderBy("totalScore", Query.Direction.DESCENDING)
            .limit(20)
            .get().await()

        return snap.documents.map { doc ->
            ChallengeLeaderboardEntry(
                uid = doc.id,
                displayName = doc.getString("displayName") ?: "Unknown",
                photoURL = doc.getString("photoURL") ?: "",
                totalScore = (doc.getLong("totalScore") ?: 0L).toInt(),
                completedDrills = (doc.getLong("completedDrills") ?: 0L).toInt(),
            )
        }
    }

    // ── Start challenge (create progress doc if absent) ──────────────────────

    suspend fun ensureChallengeStarted(uid: String, challengeId: String) {
        val ref = firestore.collection("users").document(uid)
            .collection("challengeProgress").document(challengeId)
        val snap = ref.get().await()
        if (!snap.exists()) {
            ref.set(mapOf("completedDrills" to 0, "startedAt" to com.google.firebase.Timestamp.now())).await()
        }
    }
}
