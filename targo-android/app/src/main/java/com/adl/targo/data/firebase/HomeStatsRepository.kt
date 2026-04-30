package com.adl.targo.data.firebase

import com.adl.targo.domain.model.HomeChallenge
import com.adl.targo.domain.model.HomeStats
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HomeStatsRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
) {

    suspend fun getHomeStats(uid: String): HomeStats {
        val snap = firestore.collection("users").document(uid)
            .collection("drills")
            .orderBy("completedAt", Query.Direction.DESCENDING)
            .get().await()

        val docs = snap.documents
        if (docs.isEmpty()) return HomeStats()

        // ── Per-session extraction ────────────────────────────────────────
        data class Session(
            val numberOfBullets: Int,
            val shotsFired: Int,
            val avgSplitTime: Double,
            val avgDistance: Double,
            val grouping: Double,
            val score: Double?,
            val shots: List<Double>, // distanceFromCenter
        )

        val sessions = docs.mapNotNull { doc ->
            val setup = doc.get("drillSetup") as? Map<*, *> ?: return@mapNotNull null
            val stats = doc.get("statistics") as? Map<*, *> ?: return@mapNotNull null
            val shotsList = doc.get("shots") as? List<*> ?: emptyList<Any>()
            val distances = shotsList.mapNotNull { shot ->
                (shot as? Map<*, *>)?.get("distanceFromCenter") as? Number
            }.map { it.toDouble() }

            Session(
                numberOfBullets = (setup["numberOfBullets"] as? Long)?.toInt() ?: 0,
                shotsFired = shotsList.size,
                avgSplitTime = (stats["avgSplitTime"] as? Number)?.toDouble() ?: 0.0,
                avgDistance = (stats["avgDistance"] as? Number)?.toDouble() ?: 0.0,
                grouping = (stats["grouping"] as? Number)?.toDouble() ?: 0.0,
                score = doc.getDouble("score"),
                shots = distances,
            )
        }

        if (sessions.isEmpty()) return HomeStats()

        // ── Aggregate (last 10 for trend, all for overall) ────────────────
        val recent = sessions.take(10)

        var totalBullets = 0; var totalHits = 0
        var totalSplit = 0.0; var splitCount = 0
        var totalDist = 0.0; var distCount = 0
        var totalGrouping = 0.0; var groupCount = 0
        var totalScore = 0.0; var scoreCount = 0

        sessions.forEach { s ->
            totalBullets += s.numberOfBullets
            totalHits += s.shotsFired
            if (s.avgSplitTime > 0) { totalSplit += s.avgSplitTime; splitCount++ }
            if (s.avgDistance > 0)  { totalDist += s.avgDistance;   distCount++ }
            if (s.grouping > 0)     { totalGrouping += s.grouping;  groupCount++ }
            s.score?.let { totalScore += it; scoreCount++ }
        }

        val hitRatio = if (totalBullets > 0) (totalHits.toDouble() / totalBullets) * 100.0 else 0.0
        val avgSplitTime = if (splitCount > 0) totalSplit / splitCount else 0.0
        val avgAccuracy = if (distCount > 0) totalDist / distCount else 0.0
        val avgGrouping = if (groupCount > 0) totalGrouping / groupCount else 0.0
        val adlScore = if (scoreCount > 0) (totalScore / scoreCount).toInt() else 0

        // Sparkline history: oldest→newest
        val splitHistory = recent.reversed().map { it.avgSplitTime }
        val accuracyHistory = recent.reversed().map { it.avgDistance }

        // All shot distances from last 10 sessions for radial heatmap
        val groupingShots = recent.flatMap { it.shots }

        return HomeStats(
            hitRatio = hitRatio,
            avgSplitTime = avgSplitTime,
            avgAccuracy = avgAccuracy,
            avgGrouping = avgGrouping,
            adlScore = adlScore,
            splitTimeHistory = splitHistory,
            accuracyHistory = accuracyHistory,
            groupingShots = groupingShots,
        )
    }

    suspend fun getChallenges(uid: String): List<HomeChallenge> = coroutineScope {
        val globalDeferred = async {
            firestore.collection("challenges")
                .whereIn("type", listOf("global", "heroes"))
                .get().await()
        }
        val progressDeferred = async {
            firestore.collection("users").document(uid)
                .collection("challengeProgress").get().await()
        }

        val challengesDocs = globalDeferred.await().documents
        val progressDocs = progressDeferred.await().documents

        val progressMap = progressDocs.associate { doc ->
            doc.id to (doc.getLong("completedDrills") ?: 0L).toInt()
        }

        val all = challengesDocs.map { doc ->
            HomeChallenge(
                id = doc.id,
                title = doc.getString("title") ?: "",
                imageUrl = doc.getString("imageUrl") ?: "",
                completedDrills = progressMap[doc.id] ?: 0,
                totalDrills = (doc.getLong("drillsCount") ?: 0L).toInt(),
            )
        }

        // Most progressed first, then unstarted shuffled — max 4 shown
        val started = all.filter { progressMap.containsKey(it.id) }
            .sortedByDescending { it.completedDrills }
        val unstarted = all.filter { !progressMap.containsKey(it.id) }.shuffled()

        (started + unstarted).take(4)
    }
}
