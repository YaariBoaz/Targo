package com.adl.targo.domain.model

data class ShotData(
    val x: Float,
    val y: Float,
    val shotNumber: Int,
    val targetType: Int = 2,
    val timestamp: Long
)
