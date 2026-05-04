package com.adl.targo.features.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.adl.targo.core.FeatureFlags
import com.adl.targo.domain.model.HomeChallenge
import com.adl.targo.domain.model.HomeStats
import com.adl.targo.domain.model.UserProfile
import com.adl.targo.ui.theme.*

@Composable
fun HomeScreen(
    onStartDrill: () -> Unit,
    onLogout: () -> Unit,
    onSeeMoreStats: () -> Unit,
    onGoToChallenges: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val userProfile by viewModel.userProfile.collectAsState()
    val homeStats by viewModel.homeStats.collectAsState()
    val challenges by viewModel.challenges.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A0A))
            .verticalScroll(rememberScrollState()),
    ) {
        // ── Header ───────────────────────────────────────────────────────────
        HomeHeader(
            profile = userProfile,
            score = homeStats?.adlScore ?: 0,
            rank = homeStats?.globalRank ?: 0,
        )

        Spacer(Modifier.height(8.dp))

        // ── CHALLENGES section ────────────────────────────────────────────────
        if (FeatureFlags.HOME_CHALLENGES) {
            SectionHeader(
                title = "CHALLENGES",
                onSeeMore = onGoToChallenges,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
            Spacer(Modifier.height(12.dp))
            ChallengesRow(
                challenges = challenges,
                isLoading = isLoading,
                onChallengeTap = onGoToChallenges,
            )
            Spacer(Modifier.height(20.dp))
        }

        // ── SPECIAL OFFERS section ────────────────────────────────────────────
        if (FeatureFlags.HOME_SPECIAL_OFFERS) {
            SectionHeader(
                title = "SPECIAL OFFERS",
                onSeeMore = null,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
            Spacer(Modifier.height(12.dp))
            SpecialOffersBanner(modifier = Modifier.padding(horizontal = 16.dp))
            Spacer(Modifier.height(20.dp))
        }

        // ── STATISTICS section ────────────────────────────────────────────────
        if (FeatureFlags.HOME_STATISTICS) {
            SectionHeader(
                title = "STATISTICS",
                onSeeMore = onSeeMoreStats,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
            Spacer(Modifier.height(12.dp))
            StatisticsRow(
                stats = homeStats,
                isLoading = isLoading,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }

        Spacer(Modifier.height(32.dp))
    }
}

// ── Header ────────────────────────────────────────────────────────────────────

@Composable
private fun HomeHeader(
    profile: UserProfile?,
    score: Int,
    rank: Int,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Avatar
        AvatarCircle(
            photoURL = profile?.photoURL ?: "",
            displayName = profile?.bestName ?: "",
            size = 56.dp,
        )

        Spacer(Modifier.width(12.dp))

        // Center: name + score/rank
        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Salute ${profile?.bestName ?: "Shooter"}.",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
            )
            Spacer(Modifier.height(2.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Score: ",
                    fontSize = 13.sp,
                    color = Color.White.copy(alpha = 0.6f),
                )
                Text(
                    text = "$score",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White.copy(alpha = 0.6f),
                )
                Text(
                    text = "Rank: ",
                    fontSize = 13.sp,
                    color = Color.White.copy(alpha = 0.6f),
                )
                Text(
                    text = if (rank > 0) "$rank" else "-",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White.copy(alpha = 0.6f),
                )
            }
        }

    }
}

@Composable
private fun AvatarCircle(photoURL: String, displayName: String, size: Dp = 48.dp) {
    val context = LocalContext.current
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .border(2.dp, Color.White, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        if (photoURL.isNotBlank()) {
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(photoURL)
                    .crossfade(true)
                    .build(),
                contentDescription = displayName,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )
        } else {
            Box(
                modifier = Modifier.fillMaxSize().background(TargoGold.copy(alpha = 0.25f)),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = displayName.firstOrNull()?.uppercase() ?: "?",
                    fontSize = (size.value * 0.35f).sp,
                    fontWeight = FontWeight.Bold,
                    color = TargoGold,
                )
            }
        }
    }
}

// ── Section header ────────────────────────────────────────────────────────────

@Composable
private fun SectionHeader(title: String, onSeeMore: (() -> Unit)?, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Gold vertical bar
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(18.dp)
                    .background(TargoGold),
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                letterSpacing = 0.5.sp,
            )
        }
        if (onSeeMore != null) {
            Text(
                text = "SEE MORE",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = TargoGold,
                modifier = Modifier.clickable(onClick = onSeeMore),
            )
        }
    }
}

// ── Challenges horizontal scroll ──────────────────────────────────────────────

@Composable
private fun ChallengesRow(
    challenges: List<HomeChallenge>,
    isLoading: Boolean,
    onChallengeTap: () -> Unit,
) {
    if (isLoading) {
        Box(
            modifier = Modifier.fillMaxWidth().height(200.dp).padding(horizontal = 16.dp),
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator(color = TargoGold, modifier = Modifier.size(24.dp))
        }
        return
    }

    Row(
        modifier = Modifier
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        challenges.forEach { challenge ->
            ChallengeCard(challenge = challenge, onClick = onChallengeTap)
        }
    }
}

@Composable
private fun ChallengeCard(challenge: HomeChallenge, onClick: () -> Unit) {
    val context = LocalContext.current
    val assetBitmap = remember(challenge.localAssetIndex) {
        runCatching {
            context.assets.open("challenges/ch${challenge.localAssetIndex}.png")
                .use { BitmapFactory.decodeStream(it) }
                ?.asImageBitmap()
        }.getOrNull()
    }

    Column(
        modifier = Modifier
            .width(160.dp)
            .clip(RoundedCornerShape(8.dp))
            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
            .background(Color(0xFF1A1A1A))
            .clickable(onClick = onClick),
    ) {
        // Image
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(110.dp)
                .background(Color(0xFF2A2A2A)),
        ) {
            assetBitmap?.let {
                Image(
                    bitmap = it,
                    contentDescription = challenge.title,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                )
            }
            // Gradient overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, Color.Black.copy(alpha = 0.5f))
                        )
                    )
            )
        }

        // Info
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = challenge.title,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(2.dp))
            val progressLabel = if (challenge.totalDrills > 0) "Drills" else "Hits"
            Row {
                Text(
                    text = "$progressLabel: ",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.6f),
                )
                Text(
                    text = "${challenge.completedDrills} / ${challenge.totalDrills}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TargoGold,
                )
            }
        }

        // LET'S GO button
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(TargoGold)
                .clickable(onClick = onClick)
                .padding(vertical = 10.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "LET'S GO",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black,
                letterSpacing = 0.5.sp,
            )
        }
    }
}

// ── Special Offers banner ─────────────────────────────────────────────────────

@Composable
private fun SpecialOffersBanner(modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
                .background(Color(0xFF1A1A1A), RoundedCornerShape(12.dp))
                .border(1.dp, TargoGold.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                .clip(RoundedCornerShape(12.dp)),
        ) {
            // Dark overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.horizontalGradient(
                            listOf(Color.Black.copy(alpha = 0.7f), Color.Black.copy(alpha = 0.3f))
                        )
                    )
            )
            // Content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.Center,
            ) {
                Text(
                    text = "UNLOCK MORE!",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    color = TargoGold,
                    letterSpacing = 0.5.sp,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Buy 100 bullets and",
                    fontSize = 13.sp,
                    color = Color.White,
                )
                Row {
                    Text(
                        text = "get 30 extra",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TargoGold,
                    )
                    Text(
                        text = " today only!",
                        fontSize = 13.sp,
                        color = Color.White,
                    )
                }
            }
        }

        // Pagination dots
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        ) {
            repeat(3) { i ->
                Box(
                    modifier = Modifier
                        .padding(horizontal = 3.dp)
                        .size(if (i == 0) 8.dp else 6.dp)
                        .background(
                            if (i == 0) TargoGold else Color.White.copy(alpha = 0.25f),
                            CircleShape,
                        ),
                )
            }
        }
    }
}

// ── Statistics 2-column row ───────────────────────────────────────────────────

@Composable
private fun StatisticsRow(
    stats: HomeStats?,
    isLoading: Boolean,
    modifier: Modifier = Modifier,
) {
    val s = stats ?: HomeStats()

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        // Left: Targo Score card
        Column(
            modifier = Modifier
                .weight(1f)
                .background(Color(0xFF1A1A1A), RoundedCornerShape(8.dp))
                .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                .padding(12.dp),
        ) {
            Text(
                text = "Your Targo Score:",
                fontSize = 11.sp,
                color = Color.White.copy(alpha = 0.6f),
            )
            Spacer(Modifier.height(2.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = "${s.adlScore}",
                    fontSize = 42.sp,
                    fontWeight = FontWeight.Black,
                    color = TargoGold,
                    lineHeight = 44.sp,
                )
                Text(
                    text = "/100",
                    fontSize = 18.sp,
                    color = Color.White.copy(alpha = 0.3f),
                    modifier = Modifier.padding(bottom = 6.dp),
                )
            }
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                StatMetric(label = "ACCURACY", value = String.format("%.2fcm", s.avgAccuracy))
                StatMetric(label = "SPEED", value = String.format("%.0f", s.avgSplitTime * 100))
                StatMetric(label = "CONSISTENCY", value = String.format("%.0f", s.avgGrouping * 10))
            }
        }

        // Right: Weekly Shots card
        Column(
            modifier = Modifier
                .weight(1f)
                .background(Color(0xFF1A1A1A), RoundedCornerShape(8.dp))
                .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                .padding(12.dp),
        ) {
            Text(
                text = "Weekly Shots:",
                fontSize = 11.sp,
                color = Color.White.copy(alpha = 0.6f),
            )
            Spacer(Modifier.height(8.dp))
            WeeklyBarsChart(weeklyShots = s.weeklyShots)
        }
    }
}

@Composable
private fun StatMetric(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = label,
            fontSize = 8.sp,
            color = Color.White.copy(alpha = 0.4f),
            letterSpacing = 0.3.sp,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = value,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
        )
    }
}

@Composable
private fun WeeklyBarsChart(weeklyShots: List<Int>) {
    val days = listOf("M", "T", "W", "T", "F", "S", "S")
    val maxShots = weeklyShots.maxOrNull()?.coerceAtLeast(1) ?: 1
    val todayIndex = run {
        val dow = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK)
        (dow - java.util.Calendar.MONDAY + 7) % 7
    }

    Column {
        Row(
            modifier = Modifier.fillMaxWidth().height(80.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.Bottom,
        ) {
            weeklyShots.forEachIndexed { i, shots ->
                val fraction = shots.toFloat() / maxShots
                val barHeight = (fraction * 64).dp.coerceAtLeast(4.dp)
                Box(
                    modifier = Modifier
                        .width(16.dp)
                        .height(barHeight)
                        .background(
                            color = if (i == todayIndex) Color(0xFFFF9500) else Color.White.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(topStart = 3.dp, topEnd = 3.dp),
                        ),
                )
            }
        }
        Spacer(Modifier.height(4.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            days.forEach { day ->
                Text(
                    text = day,
                    fontSize = 9.sp,
                    color = Color.White.copy(alpha = 0.4f),
                    fontWeight = FontWeight.Medium,
                )
            }
        }
    }
}
