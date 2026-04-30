package com.adl.targo.features.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.adl.targo.domain.model.UserProfile
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.BrandSuccessGreen
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold

@Composable
fun HomeScreen(
    onStartDrill: () -> Unit,
    onLogout: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val userProfile by viewModel.userProfile.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0D0D), BrandDark)))
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp),
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = "TARGO",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    color = TargoGold,
                    letterSpacing = 4.sp,
                )
                Text(
                    text = if (isLoading) "Loading..." else "Welcome back, ${userProfile?.nickname?.ifBlank { userProfile?.displayName } ?: "Shooter"}",
                    fontSize = 13.sp,
                    color = Color.White.copy(alpha = 0.6f),
                )
            }

            IconButton(onClick = { viewModel.logout(); onLogout() }) {
                Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Logout", tint = Color.White.copy(alpha = 0.6f))
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Stats card
        if (userProfile != null) {
            StatsCard(profile = userProfile!!)
        } else if (!isLoading) {
            StatsCard(profile = UserProfile())
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Start Drill CTA
        Button(
            onClick = onStartDrill,
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = TargoGold,
                contentColor = BrandDark,
            ),
        ) {
            Text(
                text = "START DRILL",
                fontWeight = FontWeight.Black,
                fontSize = 18.sp,
                letterSpacing = 3.sp,
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Quick stats row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            StatTile(
                modifier = Modifier.weight(1f),
                label = "Total Drills",
                value = "${userProfile?.totalDrills ?: 0}",
            )
            StatTile(
                modifier = Modifier.weight(1f),
                label = "Avg Hit Ratio",
                value = "${((userProfile?.avgHitRatio ?: 0.0) * 100).toInt()}%",
            )
            StatTile(
                modifier = Modifier.weight(1f),
                label = "Avg Score",
                value = "${(userProfile?.avgScore ?: 0.0).toInt()}",
            )
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun StatsCard(profile: UserProfile) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = BrandSurface),
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(
                        text = profile.nickname.ifBlank { profile.displayName }.ifBlank { "Shooter" },
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                    )
                    Text(
                        text = profile.email,
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.4f),
                    )
                }

                // Rank badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(TargoGold.copy(alpha = 0.15f))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                ) {
                    Text(
                        text = profile.rank,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TargoGold,
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            HorizontalDivider(color = Color.White.copy(alpha = 0.08f))

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                ProfileStat(label = "Bullets", value = "${profile.bullets}")
            }
        }
    }
}

@Composable
private fun ProfileStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TargoGold)
        Text(text = label, fontSize = 11.sp, color = Color.White.copy(alpha = 0.4f))
    }
}

@Composable
private fun StatTile(modifier: Modifier = Modifier, label: String, value: String) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = BrandSurface),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(text = value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = BrandSuccessGreen)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = label,
                fontSize = 10.sp,
                color = Color.White.copy(alpha = 0.5f),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
        }
    }
}
