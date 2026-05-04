package com.adl.targo.domain.model

data class UserProfile(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoURL: String = "",
    val nickname: String = "",
    val rank: String = "Rookie",
    val bullets: Int = 0,
    val totalDrills: Int = 0,
    val avgHitRatio: Double = 0.0,
    val avgScore: Double = 0.0,
)
