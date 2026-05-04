package com.adl.targo.domain.model

data class ShotRecord(
    val id: Int,
    val x: Float,
    val y: Float,
    val timestamp: Int,           // seconds from drill start
    val splitTime: Int,           // seconds since previous shot
    val distanceFromCenter: Float, // cm from target center
)

data class DrillSessionRecord(
    val setup: DrillSetup,
    val shots: List<ShotRecord>,
    val totalShots: Int,
    val totalTime: Int,           // seconds
    val avgSplitTime: Float,
    val avgDistance: Float,       // cm
    val grouping: Float,          // cm (max spread between any two shots)
    val source: String,
    val score: Int? = null,
    val stars: Int? = null,
    val challengeId: String? = null,
    val challengeDrillId: String? = null,
)

data class CompletionResult(
    val totalShots: Int,
    val totalTime: Int,
    val avgDistance: Float,
    val grouping: Float,
    val score: Int,
    val stars: Int,
    val isChallenge: Boolean,
)
