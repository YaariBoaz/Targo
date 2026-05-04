package com.adl.targo.domain.model

data class DrillState(
    val shooterName: String = "",
    val totalBullets: Int = 20,
    val shots: List<ShotData> = emptyList(),
    val isRunning: Boolean = false,
    val elapsedMs: Long = 0L,
    val startTimestamp: Long = 0L,
    val isDrillComplete: Boolean = false,
    val targetType: Int = 2  // 1 = 80×50cm, 2 = 60×40cm
)
