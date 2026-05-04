package com.adl.targo.domain.model

data class HomeStats(
    val hitRatio: Double = 0.0,
    val avgSplitTime: Double = 0.0,
    val avgAccuracy: Double = 0.0,
    val avgGrouping: Double = 0.0,
    val adlScore: Int = 0,
    val globalRank: Int = 0,
    // Last 10 sessions oldest→newest for sparklines
    val splitTimeHistory: List<Double> = emptyList(),
    val accuracyHistory: List<Double> = emptyList(),
    // All shot distances from center for radial grouping chart
    val groupingShots: List<Double> = emptyList(),
    // Shots per day Mon–Sun of the current week
    val weeklyShots: List<Int> = List(7) { 0 },
    // Social / competitive
    val weeklyStreak: Int = 0,       // consecutive weeks with ≥1 drill
    val daysLeftInWeek: Int = 0,     // days until end of Sunday
    val bestGrouping: Double = 0.0,  // personal best grouping in cm (lower = better)
)

data class HomeChallenge(
    val id: String = "",
    val title: String = "",
    val imageUrl: String = "",
    val localAssetIndex: Int = 1, // 1-4 → challenges/ch1.png … ch4.png
    val completedDrills: Int = 0,
    val totalDrills: Int = 0,
)

