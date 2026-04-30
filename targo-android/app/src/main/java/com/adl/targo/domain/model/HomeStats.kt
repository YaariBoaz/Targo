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
)

data class HomeChallenge(
    val id: String = "",
    val title: String = "",
    val imageUrl: String = "",
    val completedDrills: Int = 0,
    val totalDrills: Int = 0,
)
