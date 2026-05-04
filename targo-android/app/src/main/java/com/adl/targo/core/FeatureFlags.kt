package com.adl.targo.core

/**
 * Feature Flags — toggle UI sections on/off without touching component logic.
 * Set a flag to [false] to hide that element from the UI.
 * Set it back to [true] to restore it.
 */
object FeatureFlags {

    // ── Home Screen ───────────────────────────────────────────────────────────
    const val HOME_SPECIAL_OFFERS   = false   // "SPECIAL OFFERS" banner on home
    const val HOME_CHALLENGES       = true    // "CHALLENGES" horizontal scroll
    const val HOME_STATISTICS       = true    // "STATISTICS" section

    // ── Bottom Tab Bar ────────────────────────────────────────────────────────
    const val TAB_TRAINING          = true
    const val TAB_CHALLENGES        = true
    const val TAB_STATISTICS        = true

}
