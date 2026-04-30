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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
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
                if (isLoading) {
                    Text("Loading...", fontSize = 13.sp, color = Color.White.copy(alpha = 0.5f))
                } else {
                    Text(
                        text = "Welcome back, ${userProfile?.bestName ?: "Shooter"}",
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.6f),
                    )
                }
            }

            IconButton(onClick = { viewModel.logout(); onLogout() }) {
                Icon(
                    Icons.AutoMirrored.Filled.ExitToApp,
                    contentDescription = "Logout",
                    tint = Color.White.copy(alpha = 0.6f),
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = TargoGold)
            }
        } else {
            ProfileCard(profile = userProfile ?: UserProfile())
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Start Drill CTA
        Button(
            onClick = onStartDrill,
            modifier = Modifier.fillMaxWidth().height(64.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = TargoGold, contentColor = BrandDark),
        ) {
            Text("START DRILL", fontWeight = FontWeight.Black, fontSize = 18.sp, letterSpacing = 3.sp)
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Stats row
        val profile = userProfile
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            StatTile(modifier = Modifier.weight(1f), label = "Drills", value = "${profile?.totalDrills ?: 0}")
            StatTile(
                modifier = Modifier.weight(1f),
                label = "Hit Ratio",
                value = "${(profile?.avgHitRatio ?: 0.0).toInt()}%",
            )
            StatTile(
                modifier = Modifier.weight(1f),
                label = "Avg Score",
                value = "${(profile?.avgScore ?: 0.0).toInt()}",
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            StatTile(
                modifier = Modifier.weight(1f),
                label = "Avg Distance",
                value = "${String.format("%.1f", profile?.avgDistance ?: 0.0)} cm",
            )
            StatTile(
                modifier = Modifier.weight(1f),
                label = "Bullets Left",
                value = "${profile?.bullets ?: 0}",
                valueColor = TargoGold,
            )
            Spacer(modifier = Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun ProfileCard(profile: UserProfile) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = BrandSurface),
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Avatar
            AvatarImage(
                photoURL = profile.photoURL,
                displayName = profile.bestName,
                modifier = Modifier.size(60.dp),
            )

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = profile.bestName,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                if (profile.email.isNotBlank()) {
                    Text(
                        text = profile.email,
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.4f),
                    )
                }
            }

            // Shooter level badge
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(TargoGold.copy(alpha = 0.15f))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            ) {
                Text(
                    text = profile.rankLabel,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TargoGold,
                )
            }
        }
    }
}

@Composable
private fun AvatarImage(photoURL: String, displayName: String, modifier: Modifier = Modifier) {
    if (photoURL.isNotBlank()) {
        AsyncImage(
            model = photoURL,
            contentDescription = displayName,
            modifier = modifier.clip(CircleShape),
            contentScale = ContentScale.Crop,
        )
    } else {
        // Fallback: initials circle
        Box(
            modifier = modifier
                .clip(CircleShape)
                .background(TargoGold.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = displayName.firstOrNull()?.uppercase() ?: "?",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = TargoGold,
            )
        }
    }
}

@Composable
private fun StatTile(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    valueColor: Color = BrandSuccessGreen,
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = BrandSurface),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(text = value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = valueColor)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = label,
                fontSize = 10.sp,
                color = Color.White.copy(alpha = 0.5f),
                textAlign = TextAlign.Center,
            )
        }
    }
}
