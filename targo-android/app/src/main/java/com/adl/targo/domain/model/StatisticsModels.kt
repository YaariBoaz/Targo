package com.adl.targo.domain.model

data class ShotPoint(
    val x: Float,
    val y: Float,
    val distanceFromCenter: Float,
)

data class DrillSessionSummary(
    val id: String,
    val weaponName: String,
    val weaponCategory: String,
    val distance: Int,
    val totalShots: Int,
    val numberOfBullets: Int,
    val totalTime: Int,
    val avgSplitTime: Float,
    val avgDistance: Float,
    val grouping: Float,
    val score: Int?,
    val stars: Int?,
    val source: String,
    val challengeId: String?,
    val completedAt: Long,
    val shots: List<ShotPoint>,
)

data class LeaderboardEntry(
    val rank: Int,
    val uid: String,
    val displayName: String,
    val avatarUrl: String?,
    val points: Int,
    val isCurrentUser: Boolean,
)

data class UserStatistics(
    val hitRatio: Double = 0.0,
    val hitRatioChange: Double = 0.0,

    val avgAccuracy: Double = 0.0,
    val accuracyChange: Double = 0.0,

    val avgGrouping: Double = 0.0,
    val groupingChange: Double = 0.0,

    val avgSplitTime: Double = 0.0,
    val reactionTime: Double = 0.0,
    val reactionTimeChange: Double = 0.0,
    val splitTimes: Double = 0.0,
    val splitTimesChange: Double = 0.0,

    val sessionVariance: Double = 0.0,
    val sessionVarianceChange: String = "No Data",

    val adlScore: Int = 0,
    val globalRank: Int = 0,
    val rankChange: Int = 0,
    val rpChange: Int = 0,

    val totalSessions: Int = 0,
    val totalBulletsFired: Int = 0,

    val challengeCompletionPct: Double = 0.0,
    val challengeCompleteRateChange: Double = 0.0,

    val leaderboard: List<LeaderboardEntry> = emptyList(),

    val splitTimeHistory: List<Double> = emptyList(),
    val accuracyHistory: List<Double> = emptyList(),
    val groupingHistory: List<Double> = emptyList(),
    val hitRatioHistory: List<Double> = emptyList(),
    val reactionTimeHistory: List<Double> = emptyList(),

    val allShots: List<ShotPoint> = emptyList(),
    val sessionHistory: List<DrillSessionSummary> = emptyList(),
)
