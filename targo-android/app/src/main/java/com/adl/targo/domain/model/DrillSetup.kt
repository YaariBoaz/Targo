package com.adl.targo.domain.model

data class DrillSetup(
    val distance: Int = 50,
    val weaponCategory: String = "pistol",
    val weaponType: String = "glock-19",
    val weaponName: String = "Glock 19",
    val numberOfBullets: Int = 15,
    val source: String = "training",       // "training" | "challenge"
    val challengeId: String? = null,
    val challengeDrillId: String? = null,
    val scoringCriteria: ScoringCriteria? = null,
)

data class WeaponType(
    val id: String,
    val name: String,
    val category: String,
)

val ALL_WEAPONS = listOf(
    // Pistols
    WeaponType("glock-19",    "Glock 19",      "pistol"),
    WeaponType("glock-17",    "Glock 17",      "pistol"),
    WeaponType("m1911",       "M1911",         "pistol"),
    WeaponType("sig-p320",    "SIG P320",      "pistol"),
    WeaponType("beretta-92",  "Beretta 92",    "pistol"),
    // Rifles
    WeaponType("ar-15",       "AR-15",         "rifle"),
    WeaponType("ak-47",       "AK-47",         "rifle"),
    WeaponType("m4",          "M4 Carbine",    "rifle"),
    WeaponType("scar",        "SCAR-L",        "rifle"),
    // Snipers
    WeaponType("remington-700", "Remington 700", "sniper"),
    WeaponType("barrett-50",  "Barrett M82",   "sniper"),
    WeaponType("awp",         "AWP",           "sniper"),
    WeaponType("dragunov",    "Dragunov SVD",  "sniper"),
)
