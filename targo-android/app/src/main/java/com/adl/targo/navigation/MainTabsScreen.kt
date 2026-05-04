package com.adl.targo.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.EmojiEvents
import androidx.compose.material.icons.outlined.FitnessCenter
import androidx.compose.material.icons.outlined.LocalFireDepartment
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.adl.targo.features.challenges.ChallengesScreen
import com.adl.targo.features.challenges.ChallengesViewModel
import com.adl.targo.features.challenges.drills.ChallengeDrillsScreen
import com.adl.targo.features.challenges.drills.ChallengeDrillsViewModel
import com.adl.targo.features.home.HomeScreen
import com.adl.targo.features.statistics.StatisticsScreen
import com.adl.targo.features.training.TrainingScreen
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold

private val tabRoutes = setOf("tab_home", "tab_training", "tab_challenges", "tab_statistics")

@Composable
fun MainTabsScreen(
    onLogout: () -> Unit,
    onStartDrill: () -> Unit,
) {
    val tabNavController = rememberNavController()
    val currentBackStack by tabNavController.currentBackStackEntryAsState()
    val currentRoute = currentBackStack?.destination?.route

    val showBottomBar = currentRoute in tabRoutes || currentRoute == null

    fun navigateToTab(route: String) {
        tabNavController.navigate(route) {
            popUpTo(tabNavController.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    Scaffold(
        containerColor = BrandDark,
        bottomBar = {
            if (showBottomBar) {
                TargoBottomBar(
                    currentRoute = currentRoute ?: "tab_home",
                    onNavigate = ::navigateToTab,
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            NavHost(
                navController = tabNavController,
                startDestination = "tab_home",
            ) {
                composable("tab_home") {
                    HomeScreen(
                        onStartDrill = onStartDrill,
                        onLogout = onLogout,
                        onSeeMoreStats = { navigateToTab("tab_statistics") },
                        onGoToChallenges = { navigateToTab("tab_challenges") },
                    )
                }
                composable("tab_training") {
                    TrainingScreen(onStartDrill = onStartDrill)
                }
                composable("tab_challenges") {
                    val challengesVm = hiltViewModel<ChallengesViewModel>()
                    ChallengesScreen(
                        viewModel = challengesVm,
                        onChallengeClick = { challenge ->
                            challengesVm.selectChallenge(challenge)
                            tabNavController.navigate("challenge_drills")
                        },
                    )
                }
                composable("challenge_drills") {
                    val drillsVm = hiltViewModel<ChallengeDrillsViewModel>()
                    val challengesVm = hiltViewModel<ChallengesViewModel>(
                        tabNavController.getBackStackEntry("tab_challenges")
                    )
                    LaunchedEffect(Unit) { drillsVm.loadFromRepository() }
                    val drillChallenge by drillsVm.challenge.collectAsState()

                    LaunchedEffect(drillChallenge) {
                        if (drillChallenge == null) tabNavController.popBackStack()
                    }

                    drillChallenge?.let { ch ->
                        ChallengeDrillsScreen(
                            challenge = ch,
                            viewModel = drillsVm,
                            onBack = { tabNavController.popBackStack() },
                            onStartDrill = onStartDrill,
                        )
                    }
                }
                composable("tab_statistics") {
                    StatisticsScreen()
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom 5-item bottom bar
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun TargoBottomBar(
    currentRoute: String,
    onNavigate: (String) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(BrandSurface)
            .navigationBarsPadding()
            .height(60.dp)
            .padding(horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        TabNavItem(
            icon = Icons.Filled.Home,
            label = "Home",
            selected = currentRoute == "tab_home",
            modifier = Modifier.weight(1f),
            onClick = { onNavigate("tab_home") },
        )
        TabNavItem(
            icon = Icons.Outlined.FitnessCenter,
            label = "Training",
            selected = currentRoute == "tab_training",
            modifier = Modifier.weight(1f),
            onClick = { onNavigate("tab_training") },
        )
        TabNavItem(
            icon = Icons.Outlined.EmojiEvents,
            label = "Challenges",
            selected = currentRoute == "tab_challenges",
            modifier = Modifier.weight(1f),
            onClick = { onNavigate("tab_challenges") },
        )
        TabNavItem(
            icon = Icons.Filled.BarChart,
            label = "Statistics",
            selected = currentRoute == "tab_statistics",
            modifier = Modifier.weight(1f),
            onClick = { onNavigate("tab_statistics") },
        )
    }
}

@Composable
private fun TabNavItem(
    icon: ImageVector,
    label: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (selected) TargoGold else Color.White.copy(alpha = 0.4f),
            modifier = Modifier.size(22.dp),
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = label,
            fontSize = 9.sp,
            color = if (selected) TargoGold else Color.White.copy(alpha = 0.4f),
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
        )
    }
}

@Composable
private fun BulletsNavItem(
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(22.dp))
                .background(TargoGold),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Outlined.LocalFireDepartment,
                contentDescription = "Bullets",
                tint = Color.Black,
                modifier = Modifier.size(22.dp),
            )
        }
    }
}
