package com.adl.targo.navigation

sealed class Screen(val route: String) {
    // Auth
    object Welcome : Screen("welcome")
    object Login : Screen("login")
    object Register : Screen("register")
    object ForgotPassword : Screen("forgot_password")

    // Main app with bottom tabs
    object MainTabs : Screen("main_tabs")

    // Drill flow (launched from tabs)
    object SessionSelector : Screen("session_selector")
    object ShooterSelector : Screen("shooter_selector")
    object DrillPrepare : Screen("drill_prepare")
    object DrillCountdown : Screen("drill_countdown")
    object DrillShooting : Screen("drill_shooting")

    companion object {
        const val AUTH_GRAPH = "auth_graph"
        const val DRILL_FLOW = "drill_flow"
    }
}
