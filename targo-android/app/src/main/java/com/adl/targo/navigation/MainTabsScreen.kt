package com.adl.targo.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.adl.targo.features.home.ChallengesPlaceholderScreen
import com.adl.targo.features.home.HomeScreen
import com.adl.targo.features.home.StatisticsPlaceholderScreen
import com.adl.targo.features.home.TrainingPlaceholderScreen
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold

private data class TabItem(val route: String, val label: String, val icon: ImageVector)

private val tabs = listOf(
    TabItem("tab_home", "Home", Icons.Filled.Home),
    TabItem("tab_training", "Training", Icons.Filled.FitnessCenter),
    TabItem("tab_challenges", "Challenges", Icons.Filled.Star),
    TabItem("tab_statistics", "Statistics", Icons.Filled.BarChart),
)

@Composable
fun MainTabsScreen(
    onLogout: () -> Unit,
    onStartDrill: () -> Unit,
) {
    val tabNavController = rememberNavController()
    val currentBackStack by tabNavController.currentBackStackEntryAsState()
    val currentRoute = currentBackStack?.destination?.route

    Scaffold(
        containerColor = BrandDark,
        bottomBar = {
            NavigationBar(
                containerColor = BrandSurface,
                contentColor = TargoGold,
            ) {
                tabs.forEach { tab ->
                    NavigationBarItem(
                        selected = currentRoute == tab.route,
                        onClick = {
                            tabNavController.navigate(tab.route) {
                                popUpTo(tabNavController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = TargoGold,
                            selectedTextColor = TargoGold,
                            unselectedIconColor = Color.White.copy(alpha = 0.4f),
                            unselectedTextColor = Color.White.copy(alpha = 0.4f),
                            indicatorColor = TargoGold.copy(alpha = 0.15f),
                        ),
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            NavHost(
                navController = tabNavController,
                startDestination = "tab_home",
            ) {
                composable("tab_home") {
                    HomeScreen(onStartDrill = onStartDrill, onLogout = onLogout)
                }
                composable("tab_training") {
                    TrainingPlaceholderScreen(onStartDrill = onStartDrill)
                }
                composable("tab_challenges") {
                    ChallengesPlaceholderScreen()
                }
                composable("tab_statistics") {
                    StatisticsPlaceholderScreen()
                }
            }
        }
    }
}
