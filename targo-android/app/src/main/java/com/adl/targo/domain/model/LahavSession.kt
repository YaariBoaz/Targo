package com.adl.targo.domain.model

import com.google.firebase.Timestamp

data class LahavSession(
    val sessionId: String = "",
    val drillType: String = "",
    val instructorName: String = "",
    val lane: String = "",
    val totalSteps: Int = 1,
    val bulletsPerStep: Int = 20,
    val shooters: List<LahavShooterRef> = emptyList(),
    val completedTurns: List<String> = emptyList(),
    val scheduledTime: Timestamp? = null
)

data class LahavShooterRef(
    val id: String = "",
    val name: String = "",
    val email: String = ""
)
