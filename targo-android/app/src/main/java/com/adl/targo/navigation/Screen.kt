package com.adl.targo.navigation

sealed class Screen(val route: String) {
    // Auth
    object Welcome : Screen("welcome")
    object Login : Screen("login")
    object Register : Screen("register")
    object ForgotPassword : Screen("forgot_password")

    // Main app with bottom tabs
    object MainTabs : Screen("main_tabs")

    // Training flow (Prepare → Countdown → Shooting)
    object Prepare : Screen("prepare")
    object Countdown : Screen("countdown")
    object Shooting : Screen("shooting")

    // Lahav drill flow (legacy)
    object SessionSelector : Screen("session_selector")
    object ShooterSelector : Screen("shooter_selector")
    object DrillPrepare : Screen("drill_prepare")
    object DrillCountdown : Screen("drill_countdown")
    object DrillShooting : Screen("drill_shooting")

    // WiFi connection gate (shown before any drill flow)
    object WifiConnection : Screen("wifi_connection")

    companion object {
        const val AUTH_GRAPH = "auth_graph"
        const val TRAINING_FLOW = "training_flow"
        const val DRILL_FLOW = "drill_flow"
    }
}
