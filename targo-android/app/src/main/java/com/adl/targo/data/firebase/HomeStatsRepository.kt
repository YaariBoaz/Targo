package com.adl.targo.data.firebase

import com.adl.targo.domain.model.HomeChallenge
import com.adl.targo.domain.model.HomeStats
import com.adl.targo.domain.model.ChallengeLeaderboardEntry
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.tasks.await
import java.util.Calendar
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
            val completedAt: com.google.firebase.Timestamp?,
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
                completedAt = doc.getTimestamp("completedAt"),
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

        // Weekly shots: Mon=0 … Sun=6 of the current week
        val weeklyShots = MutableList(7) { 0 }
        val cal = Calendar.getInstance()
        // Monday of this week at midnight
        val today = Calendar.getInstance()
        val dayOfWeek = today.get(Calendar.DAY_OF_WEEK) // Sun=1, Mon=2 … Sat=7
        val daysFromMonday = (dayOfWeek - Calendar.MONDAY + 7) % 7
        val monday = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, -daysFromMonday)
            set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
        }
        val mondayMs = monday.timeInMillis
        sessions.forEach { s ->
            val ts = s.completedAt ?: return@forEach
            val diffDays = ((ts.toDate().time - mondayMs) / 86_400_000L).toInt()
            if (diffDays in 0..6) weeklyShots[diffDays] += s.shotsFired
        }

        return HomeStats(
            hitRatio = hitRatio,
            avgSplitTime = avgSplitTime,
            avgAccuracy = avgAccuracy,
            avgGrouping = avgGrouping,
            adlScore = adlScore,
            splitTimeHistory = splitHistory,
            accuracyHistory = accuracyHistory,
            groupingShots = groupingShots,
            weeklyShots = weeklyShots,
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

        val all = challengesDocs.mapIndexed { index, doc ->
            HomeChallenge(
                id = doc.id,
                title = doc.getString("title") ?: "",
                imageUrl = doc.getString("imageUrl") ?: "",
                localAssetIndex = (index % 4) + 1,
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

    suspend fun getLeaderboard(): List<ChallengeLeaderboardEntry> {
        val snap = firestore.collection("user-scores")
            .orderBy("score", Query.Direction.DESCENDING)
            .limit(10)
            .get().await()
        return snap.documents.map { doc ->
            ChallengeLeaderboardEntry(
                uid = doc.id,
                displayName = doc.getString("displayName") ?: "Shooter",
                photoURL = doc.getString("photoURL") ?: "",
                totalScore = (doc.getLong("score") ?: 0L).toInt(),
            )
        }
    }
}
