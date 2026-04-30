package com.adl.targo.domain.model

data class UserProfile(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoURL: String = "",
    val nickname: String = "",
    val shooterLevel: String = "Recruit",   // 'recruit' | 'marksman' | 'pro'
    val bullets: Int = 0,
    val totalDrills: Int = 0,
    val avgHitRatio: Double = 0.0,
    val avgScore: Double = 0.0,
    val avgDistance: Double = 0.0,
) {
    /** Display name priority: nickname → displayName → email prefix */
    val bestName: String get() =
        nickname.ifBlank { displayName }.ifBlank { email.substringBefore('@') }

    /** Human-readable rank label */
    val rankLabel: String get() = when (shooterLevel.lowercase()) {
        "pro" -> "Pro"
        "marksman" -> "Marksman"
        else -> "Recruit"
    }
}
