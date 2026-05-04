package com.adl.targo.domain.model

data class ScoringCriteria(
    val perfectTime: Int = 60,
    val maxAcceptableDistance: Float = 20f,
    val maxAcceptableGrouping: Float = 30f,
    val threeStars: Int = 900,
    val twoStars: Int = 750,
    val oneStar: Int = 600,
)

data class Challenge(
    val id: String = "",
    val type: String = "global",          // "global" | "heroes"
    val title: String = "",
    val description: String = "",
    val imageUrl: String = "",
    val difficulty: String = "easy",      // "easy" | "medium" | "hard"
    val category: String = "",
    val drillsCount: Int = 0,
    val isActive: Boolean = true,
    val completedDrills: Int = 0,         // user progress
)

data class ChallengeDrill(
    val id: String = "",
    val challengeId: String = "",
    val order: Int = 1,
    val title: String = "",
    val description: String = "",
    val imageUrl: String = "",
    val objective: String = "",
    val focusArea: String = "",
    // Requirements
    val numberOfBullets: Int = 15,
    val distance: Int = 50,
    val targetType: String = "standard",
    val weaponCategory: String = "pistol",
    val weaponType: String = "glock-19",
    val weaponName: String = "Glock 19",
    // User data (filled at runtime)
    val status: DrillStatus = DrillStatus.LOCKED,
    val bestScore: Int = 0,
    val bestStars: Int = 0,
    val scoringCriteria: ScoringCriteria = ScoringCriteria(),
)

enum class DrillStatus { LOCKED, AVAILABLE, COMPLETED }

data class ChallengeLeaderboardEntry(
    val uid: String = "",
    val displayName: String = "",
    val photoURL: String = "",
    val totalScore: Int = 0,
    val completedDrills: Int = 0,
)
