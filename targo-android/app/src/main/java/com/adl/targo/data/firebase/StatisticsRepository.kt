package com.adl.targo.data.firebase

import com.adl.targo.domain.model.DrillSessionSummary
import com.adl.targo.domain.model.LeaderboardEntry
import com.adl.targo.domain.model.ShotPoint
import com.adl.targo.domain.model.UserStatistics
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.pow
import kotlin.math.sqrt

@Singleton
class StatisticsRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
) {

    suspend fun getStatistics(uid: String): UserStatistics = coroutineScope {
        val drillsDeferred = async {
            firestore.collection("users").document(uid)
                .collection("drills")
                .orderBy("completedAt", Query.Direction.DESCENDING)
                .get().await()
        }
        val rankDeferred = async {
            runCatching {
                firestore.collection("user-scores").document(uid).get().await()
            }.getOrNull()
        }
        val progressDeferred = async {
            runCatching {
                firestore.collection("users").document(uid)
                    .collection("challengeProgress").get().await()
            }.getOrNull()
        }
        val totalChallengesDeferred = async {
            runCatching {
                firestore.collection("challenges")
                    .whereIn("type", listOf("global", "heroes"))
                    .get().await()
            }.getOrNull()
        }
        val leaderboardDeferred = async {
            runCatching {
                firestore.collection("user-scores")
                    .orderBy("ratingPoints", Query.Direction.DESCENDING)
                    .limit(100)
                    .get().await()
            }.getOrNull()
        }

        val drillSnap = drillsDeferred.await()
        val rankDoc = rankDeferred.await()
        val progressSnap = progressDeferred.await()
        val challengesSnap = totalChallengesDeferred.await()
        val lbSnap = leaderboardDeferred.await()

        // Parse sessions
        val sessions = drillSnap.documents.mapNotNull { doc ->
            val setup = doc.get("drillSetup") as? Map<*, *> ?: return@mapNotNull null
            val stats = doc.get("statistics") as? Map<*, *> ?: return@mapNotNull null
            val shotsList = doc.get("shots") as? List<*> ?: emptyList<Any>()
            val completedAtTs = doc.getTimestamp("completedAt")?.toDate()?.time ?: 0L

            val shots = shotsList.mapNotNull { s ->
                val sm = s as? Map<*, *> ?: return@mapNotNull null
                ShotPoint(
                    x = (sm["x"] as? Number)?.toFloat() ?: 0f,
                    y = (sm["y"] as? Number)?.toFloat() ?: 0f,
                    distanceFromCenter = (sm["distanceFromCenter"] as? Number)?.toFloat() ?: 0f,
                )
            }

            DrillSessionSummary(
                id = doc.id,
                weaponName = (setup["weaponName"] as? String) ?: "Unknown",
                weaponCategory = (setup["weaponCategory"] as? String) ?: "pistol",
                distance = (setup["distance"] as? Long)?.toInt() ?: 0,
                numberOfBullets = (setup["numberOfBullets"] as? Long)?.toInt() ?: 0,
                totalShots = (stats["totalShots"] as? Long)?.toInt() ?: shotsList.size,
                totalTime = (stats["totalTime"] as? Long)?.toInt() ?: 0,
                avgSplitTime = (stats["avgSplitTime"] as? Number)?.toFloat() ?: 0f,
                avgDistance = (stats["avgDistance"] as? Number)?.toFloat() ?: 0f,
                grouping = (stats["grouping"] as? Number)?.toFloat() ?: 0f,
                score = doc.getLong("score")?.toInt(),
                stars = doc.getLong("stars")?.toInt(),
                source = doc.getString("source") ?: "training",
                challengeId = doc.getString("challengeId"),
                completedAt = completedAtTs,
                shots = shots,
            )
        }

        if (sessions.isEmpty()) return@coroutineScope UserStatistics()

        // Aggregate totals
        var totalBullets = 0; var totalHits = 0
        var totalSplit = 0.0; var splitCount = 0
        var totalDist = 0.0; var distCount = 0
        var totalGrouping = 0.0; var groupCount = 0
        var totalScore = 0.0; var scoreCount = 0

        sessions.forEach { s ->
            totalBullets += s.numberOfBullets
            totalHits += s.totalShots
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

        // Change values: recent 5 vs previous 5
        val recentSessions = sessions.take(5)
        val prevSessions = sessions.drop(5).take(5)

        fun sessionHitRatio(list: List<DrillSessionSummary>): Double {
            val b = list.sumOf { it.numberOfBullets }
            val h = list.sumOf { it.totalShots }
            return if (b > 0) h.toDouble() / b * 100.0 else 0.0
        }

        fun avg(list: List<DrillSessionSummary>, get: (DrillSessionSummary) -> Float): Double =
            if (list.isEmpty()) 0.0 else list.sumOf { get(it).toDouble() } / list.size

        fun computeVariance(list: List<DrillSessionSummary>): Double {
            if (list.isEmpty()) return 0.0
            val values = list.map { it.avgDistance.toDouble() }
            val mean = values.average()
            return sqrt(values.map { (it - mean).pow(2) }.average())
        }

        val recentHR = sessionHitRatio(recentSessions)
        val prevHR = sessionHitRatio(prevSessions)
        val recentAcc = avg(recentSessions) { it.avgDistance }
        val prevAcc = avg(prevSessions) { it.avgDistance }
        val recentGroup = avg(recentSessions) { it.grouping }
        val prevGroup = avg(prevSessions) { it.grouping }
        val recentSplit = avg(recentSessions) { it.avgSplitTime }
        val prevSplit = avg(prevSessions) { it.avgSplitTime }
        val recentVariance = computeVariance(recentSessions)
        val prevVariance = computeVariance(prevSessions)
        val recentScore = avg(recentSessions) { it.score?.toFloat() ?: 0f }
        val prevScore = avg(prevSessions) { it.score?.toFloat() ?: 0f }

        val sessionVarianceChange = when {
            prevVariance == 0.0 -> "No Data"
            recentVariance <= prevVariance -> "More Consistent"
            else -> "Less Consistent"
        }

        // History lists (oldest → newest, up to 10 points)
        val recent10 = sessions.take(10).reversed()
        val splitHistory = recent10.map { it.avgSplitTime.toDouble() }
        val accuracyHistory = recent10.map { it.avgDistance.toDouble() }
        val groupingHistory = recent10.map { it.grouping.toDouble() }
        val hitRatioHistory = recent10.map { s ->
            if (s.numberOfBullets > 0) s.totalShots.toDouble() / s.numberOfBullets * 100.0 else 0.0
        }
        val reactionTimeHistory = recent10.map { it.avgSplitTime.toDouble() }

        val allShots = sessions.take(20).flatMap { it.shots }

        // Rank
        val globalRank = (rankDoc?.getLong("globalRank") ?: rankDoc?.getLong("rank") ?: 0L).toInt()

        // Challenge completion
        val totalChallengeCount = challengesSnap?.size() ?: 0
        val progressCount = progressSnap?.size() ?: 0
        val challengeCompletionPct = if (totalChallengeCount > 0)
            (progressCount.toDouble() / totalChallengeCount) * 100.0
        else 0.0

        // Leaderboard: rank1 + current user + one below
        val lbDocs = lbSnap?.documents ?: emptyList()
        val userIdx = lbDocs.indexOfFirst { it.id == uid }
        val leaderboard = buildList {
            if (lbDocs.isNotEmpty()) {
                val doc = lbDocs[0]
                add(LeaderboardEntry(
                    rank = 1,
                    uid = doc.id,
                    displayName = doc.getString("displayName") ?: "Player",
                    avatarUrl = doc.getString("photoURL"),
                    points = (doc.getLong("ratingPoints") ?: 0L).toInt(),
                    isCurrentUser = doc.id == uid,
                ))
            }
            if (userIdx > 0) {
                val doc = lbDocs[userIdx]
                add(LeaderboardEntry(
                    rank = userIdx + 1,
                    uid = doc.id,
                    displayName = doc.getString("displayName") ?: "Player",
                    avatarUrl = doc.getString("photoURL"),
                    points = (doc.getLong("ratingPoints") ?: 0L).toInt(),
                    isCurrentUser = true,
                ))
            }
            if (userIdx >= 0 && userIdx + 1 < lbDocs.size) {
                val doc = lbDocs[userIdx + 1]
                add(LeaderboardEntry(
                    rank = userIdx + 2,
                    uid = doc.id,
                    displayName = doc.getString("displayName") ?: "Player",
                    avatarUrl = doc.getString("photoURL"),
                    points = (doc.getLong("ratingPoints") ?: 0L).toInt(),
                    isCurrentUser = false,
                ))
            }
        }

        UserStatistics(
            hitRatio = hitRatio,
            hitRatioChange = recentHR - prevHR,
            avgAccuracy = avgAccuracy,
            accuracyChange = recentAcc - prevAcc,
            avgGrouping = avgGrouping,
            groupingChange = recentGroup - prevGroup,
            avgSplitTime = avgSplitTime,
            reactionTime = avgSplitTime,
            reactionTimeChange = recentSplit - prevSplit,
            splitTimes = avgSplitTime,
            splitTimesChange = recentSplit - prevSplit,
            sessionVariance = recentVariance,
            sessionVarianceChange = sessionVarianceChange,
            adlScore = adlScore,
            globalRank = globalRank,
            rankChange = 0,
            rpChange = if (prevScore > 0) (recentScore - prevScore).toInt() else 0,
            totalSessions = sessions.size,
            totalBulletsFired = totalHits,
            challengeCompletionPct = challengeCompletionPct,
            challengeCompleteRateChange = 0.0,
            leaderboard = leaderboard,
            splitTimeHistory = splitHistory,
            accuracyHistory = accuracyHistory,
            groupingHistory = groupingHistory,
            hitRatioHistory = hitRatioHistory,
            reactionTimeHistory = reactionTimeHistory,
            allShots = allShots,
            sessionHistory = sessions,
        )
    }
}
