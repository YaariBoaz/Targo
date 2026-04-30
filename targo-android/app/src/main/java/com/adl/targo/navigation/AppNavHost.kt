package com.adl.targo.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import androidx.navigation.compose.rememberNavController
import com.adl.targo.data.firebase.AuthRepository
import com.adl.targo.features.auth.AuthViewModel
import com.adl.targo.features.auth.ForgotPasswordScreen
import com.adl.targo.features.auth.LoginScreen
import com.adl.targo.features.auth.RegisterScreen
import com.adl.targo.features.auth.WelcomeScreen
import com.adl.targo.features.drill.DrillViewModel
import com.adl.targo.features.drill.countdown.DrillCountdownScreen
import com.adl.targo.features.drill.prepare.DrillPrepareScreen
import com.adl.targo.features.drill.shooting.DrillShootingScreen
import com.adl.targo.features.lahav.LahavViewModel
import com.adl.targo.features.session.SessionSelectorScreen
import com.adl.targo.features.settings.SettingsViewModel
import com.adl.targo.features.shooter.ShooterSelectorScreen
import javax.inject.Inject

@Composable
fun AppNavHost(
    authRepository: AuthRepository,
) {
    val navController = rememberNavController()

    // Determine start destination based on current auth state
    val startDestination = if (authRepository.currentUser != null) {
        Screen.MainTabs.route
    } else {
        Screen.AUTH_GRAPH
    }

    // Listen for auth state changes to handle logout
    val authStateFlow = authRepository.authStateFlow
    val authUser by authStateFlow.collectAsState(initial = authRepository.currentUser)

    LaunchedEffect(authUser) {
        if (authUser == null) {
            // User logged out — navigate to auth and clear back stack
            navController.navigate(Screen.AUTH_GRAPH) {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
    ) {

        // ── Auth Graph ──────────────────────────────────────────────────────
        navigation(
            startDestination = Screen.Welcome.route,
            route = Screen.AUTH_GRAPH,
        ) {
            composable(Screen.Welcome.route) {
                WelcomeScreen(
                    onLoginClick = { navController.navigate(Screen.Login.route) },
                    onRegisterClick = { navController.navigate(Screen.Register.route) },
                )
            }

            composable(Screen.Login.route) { entry ->
                val authVm = hiltViewModel<AuthViewModel>(entry)
                LoginScreen(
                    onBack = { navController.popBackStack() },
                    onLoginSuccess = {
                        navController.navigate(Screen.MainTabs.route) {
                            popUpTo(Screen.AUTH_GRAPH) { inclusive = true }
                        }
                    },
                    onForgotPassword = { navController.navigate(Screen.ForgotPassword.route) },
                    viewModel = authVm,
                )
            }

            composable(Screen.Register.route) { entry ->
                val authVm = hiltViewModel<AuthViewModel>(entry)
                RegisterScreen(
                    onBack = { navController.popBackStack() },
                    onRegisterSuccess = {
                        navController.navigate(Screen.MainTabs.route) {
                            popUpTo(Screen.AUTH_GRAPH) { inclusive = true }
                        }
                    },
                    viewModel = authVm,
                )
            }

            composable(Screen.ForgotPassword.route) { entry ->
                val authVm = hiltViewModel<AuthViewModel>(entry)
                ForgotPasswordScreen(
                    onBack = { navController.popBackStack() },
                    viewModel = authVm,
                )
            }
        }

        // ── Main Tabs ───────────────────────────────────────────────────────
        composable(Screen.MainTabs.route) {
            MainTabsScreen(
                onLogout = {
                    navController.navigate(Screen.AUTH_GRAPH) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onStartDrill = {
                    navController.navigate(Screen.DRILL_FLOW)
                },
            )
        }

        // ── Drill Flow ──────────────────────────────────────────────────────
        navigation(
            startDestination = Screen.SessionSelector.route,
            route = Screen.DRILL_FLOW,
        ) {
            composable(Screen.SessionSelector.route) { entry ->
                val parentEntry = remember(entry) {
                    navController.getBackStackEntry(Screen.DRILL_FLOW)
                }
                val lahavViewModel = hiltViewModel<LahavViewModel>(parentEntry)
                val settingsViewModel = hiltViewModel<SettingsViewModel>(parentEntry)
                SessionSelectorScreen(
                    lahavViewModel = lahavViewModel,
                    settingsViewModel = settingsViewModel,
                    onSessionSelected = { navController.navigate(Screen.ShooterSelector.route) }
                )
            }

            composable(Screen.ShooterSelector.route) { entry ->
                val parentEntry = remember(entry) {
                    navController.getBackStackEntry(Screen.DRILL_FLOW)
                }
                val drillViewModel = hiltViewModel<DrillViewModel>(parentEntry)
                val lahavViewModel = hiltViewModel<LahavViewModel>(parentEntry)
                val settingsViewModel = hiltViewModel<SettingsViewModel>(parentEntry)
                ShooterSelectorScreen(
                    lahavViewModel = lahavViewModel,
                    drillViewModel = drillViewModel,
                    settingsViewModel = settingsViewModel,
                    onBack = { navController.popBackStack() },
                    onConfirm = { navController.navigate(Screen.DrillPrepare.route) }
                )
            }

            composable(Screen.DrillPrepare.route) { entry ->
                val parentEntry = remember(entry) {
                    navController.getBackStackEntry(Screen.DRILL_FLOW)
                }
                val drillViewModel = hiltViewModel<DrillViewModel>(parentEntry)
                val lahavViewModel = hiltViewModel<LahavViewModel>(parentEntry)
                DrillPrepareScreen(
                    drillViewModel = drillViewModel,
                    lahavViewModel = lahavViewModel,
                    onBack = { navController.popBackStack() },
                    onBegin = { navController.navigate(Screen.DrillCountdown.route) }
                )
            }

            composable(Screen.DrillCountdown.route) { entry ->
                val parentEntry = remember(entry) {
                    navController.getBackStackEntry(Screen.DRILL_FLOW)
                }
                val drillViewModel = hiltViewModel<DrillViewModel>(parentEntry)
                DrillCountdownScreen(
                    drillViewModel = drillViewModel,
                    onCountdownFinished = {
                        navController.navigate(Screen.DrillShooting.route) {
                            popUpTo(Screen.DrillCountdown.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.DrillShooting.route) { entry ->
                val parentEntry = remember(entry) {
                    navController.getBackStackEntry(Screen.DRILL_FLOW)
                }
                val drillViewModel = hiltViewModel<DrillViewModel>(parentEntry)
                val lahavViewModel = hiltViewModel<LahavViewModel>(parentEntry)
                val settingsViewModel = hiltViewModel<SettingsViewModel>(parentEntry)
                DrillShootingScreen(
                    drillViewModel = drillViewModel,
                    lahavViewModel = lahavViewModel,
                    settingsViewModel = settingsViewModel,
                    onBack = {
                        drillViewModel.resetDrill()
                        navController.popBackStack(Screen.MainTabs.route, false)
                    },
                    onNextStep = {
                        navController.navigate(Screen.DrillPrepare.route) {
                            popUpTo(Screen.DrillPrepare.route) { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
