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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
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
import com.adl.targo.domain.model.ChallengeLeaderboardEntry
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
    val dailyChallenge by viewModel.dailyChallenge.collectAsState()
    val leaderboard by viewModel.leaderboard.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A0A))
            .statusBarsPadding()
            .verticalScroll(rememberScrollState()),
    ) {
        // ── Header ───────────────────────────────────────────────────────────
        HomeHeader(
            profile = userProfile,
            score = homeStats?.adlScore ?: 0,
            rank = homeStats?.globalRank ?: 0,
        )

        Spacer(Modifier.height(4.dp))

        // ── STREAK ────────────────────────────────────────────────────────────
        val topStreak by viewModel.topStreakHolder.collectAsState()
        StreakCard(
            weeklyStreak = homeStats?.weeklyStreak ?: 0,
            daysLeftInWeek = homeStats?.daysLeftInWeek ?: 0,
            topStreakHolder = topStreak,
            modifier = Modifier.padding(horizontal = 16.dp),
        )

        Spacer(Modifier.height(16.dp))

        // ── BEAT YOUR BEST CTA ────────────────────────────────────────────────
        BeatYourBestCard(
            bestGrouping = homeStats?.bestGrouping ?: 0.0,
            isLoading = isLoading,
            onStartDrill = onStartDrill,
            modifier = Modifier.padding(horizontal = 16.dp),
        )

        Spacer(Modifier.height(20.dp))

        // ── LEADERBOARD STRIP ─────────────────────────────────────────────────
        SectionHeader(
            title = "LEADERBOARD",
            onSeeMore = null,
            modifier = Modifier.padding(horizontal = 16.dp),
        )
        Spacer(Modifier.height(12.dp))
        LeaderboardStrip(
            entries = leaderboard.take(5),
            currentUid = userProfile?.uid ?: "",
            currentRank = homeStats?.globalRank ?: 0,
            isLoading = isLoading,
        )

        Spacer(Modifier.height(20.dp))

        // ── DAILY CHALLENGE ───────────────────────────────────────────────────
        SectionHeader(
            title = "TODAY'S CHALLENGE",
            onSeeMore = onGoToChallenges,
            modifier = Modifier.padding(horizontal = 16.dp),
        )
        Spacer(Modifier.height(12.dp))
        DailyChallengeCard(
            challenge = dailyChallenge,
            isLoading = isLoading,
            onAccept = onGoToChallenges,
            modifier = Modifier.padding(horizontal = 16.dp),
        )

        Spacer(Modifier.height(20.dp))

        // ── STATISTICS ────────────────────────────────────────────────────────
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
            .padding(horizontal = 16.dp)
            .padding(top = 20.dp, bottom = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        AvatarCircle(
            photoURL = profile?.photoURL ?: "",
            displayName = profile?.bestName ?: "",
            size = 52.dp,
        )
        Spacer(Modifier.width(12.dp))
        Column {
            Text(
                text = "Salute, ${profile?.bestName ?: "Shooter"}.",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
            )
            Spacer(Modifier.height(3.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Score $score",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.45f),
                )
                Text("·", fontSize = 12.sp, color = Color.White.copy(alpha = 0.25f))
                Text(
                    text = if (rank > 0) "Rank #$rank" else "Unranked",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.45f),
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

// ── Streak card ───────────────────────────────────────────────────────────────

@Composable
private fun StreakCard(
    weeklyStreak: Int,
    daysLeftInWeek: Int,
    topStreakHolder: Pair<String, Int>?,
    modifier: Modifier = Modifier,
) {
    val isUrgent = weeklyStreak > 0 && daysLeftInWeek <= 1

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF141414))
            .border(1.dp, Color.White.copy(alpha = 0.07f), RoundedCornerShape(12.dp))
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Left: user streak
        Column {
            Text(
                text = "YOUR STREAK",
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White.copy(alpha = 0.35f),
                letterSpacing = 1.sp,
            )
            Spacer(Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "🔥",
                    fontSize = 22.sp,
                )
                Text(
                    text = "$weeklyStreak ${if (weeklyStreak == 1) "week" else "weeks"}",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    color = when {
                        isUrgent -> Color(0xFFE63946)
                        weeklyStreak > 0 -> TargoGold
                        else -> Color.White.copy(alpha = 0.3f)
                    },
                )
            }
            Spacer(Modifier.height(2.dp))
            Text(
                text = when {
                    weeklyStreak == 0 -> "Start shooting this week!"
                    daysLeftInWeek == 0 -> "⚠ Shoot today to keep it!"
                    isUrgent -> "⚠ ${daysLeftInWeek}d left — don't break it!"
                    else -> "${daysLeftInWeek} days left this week"
                },
                fontSize = 11.sp,
                color = if (isUrgent) Color(0xFFE63946) else Color.White.copy(alpha = 0.45f),
            )
        }

        // Divider
        Box(
            modifier = Modifier
                .width(1.dp)
                .height(52.dp)
                .background(Color.White.copy(alpha = 0.08f))
        )

        // Right: all-time best streak
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = "ALL-TIME BEST",
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White.copy(alpha = 0.35f),
                letterSpacing = 1.sp,
            )
            Spacer(Modifier.height(4.dp))
            if (topStreakHolder != null) {
                Text(
                    text = "${topStreakHolder.second} ${if (topStreakHolder.second == 1) "week" else "weeks"}",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = "by ${topStreakHolder.first.split(" ").firstOrNull() ?: topStreakHolder.first}",
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.45f),
                )
            } else {
                Text(
                    text = "—",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White.copy(alpha = 0.2f),
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = "Be the first!",
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.3f),
                )
            }
        }
    }
}

// ── Beat Your Best CTA ────────────────────────────────────────────────────────

@Composable
private fun BeatYourBestCard(
    bestGrouping: Double,
    isLoading: Boolean,
    onStartDrill: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(Color(0xFF1A1200), Color(0xFF2A1E00))
                )
            )
            .border(1.dp, TargoGold.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
            .clickable(onClick = onStartDrill)
            .padding(horizontal = 18.dp, vertical = 16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (bestGrouping > 0) "YOUR BEST GROUPING" else "FIRST DRILL AWAITS",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = TargoGold.copy(alpha = 0.7f),
                    letterSpacing = 1.sp,
                )
                Spacer(Modifier.height(4.dp))
                if (isLoading) {
                    Text("Loading…", fontSize = 22.sp, color = Color.White.copy(alpha = 0.3f), fontWeight = FontWeight.Black)
                } else if (bestGrouping > 0) {
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            text = "${"%.1f".format(bestGrouping)}cm",
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Black,
                            color = TargoGold,
                            lineHeight = 34.sp,
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = "grouping",
                            fontSize = 13.sp,
                            color = Color.White.copy(alpha = 0.4f),
                            modifier = Modifier.padding(bottom = 4.dp),
                        )
                    }
                    Text(
                        text = "Can you tighten it?",
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.6f),
                    )
                } else {
                    Text(
                        text = "Set your first PB",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                    )
                    Text(
                        text = "Start shooting to track your progress",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.5f),
                    )
                }
            }

            Spacer(Modifier.width(12.dp))

            Button(
                onClick = onStartDrill,
                colors = ButtonDefaults.buttonColors(containerColor = TargoGold),
                shape = RoundedCornerShape(10.dp),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
            ) {
                Text(
                    text = "START",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.Black,
                    letterSpacing = 1.sp,
                )
            }
        }
    }
}

// ── Leaderboard strip ─────────────────────────────────────────────────────────

@Composable
private fun LeaderboardStrip(
    entries: List<ChallengeLeaderboardEntry>,
    currentUid: String,
    currentRank: Int,
    isLoading: Boolean,
    modifier: Modifier = Modifier,
) {
    if (isLoading) {
        Box(
            modifier = Modifier.fillMaxWidth().height(90.dp),
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator(color = TargoGold, modifier = Modifier.size(20.dp))
        }
        return
    }

    val userInTop5 = entries.any { it.uid == currentUid }

    Row(
        modifier = Modifier
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        entries.forEachIndexed { index, entry ->
            val isMe = entry.uid == currentUid
            LeaderboardEntry(rank = index + 1, entry = entry, isMe = isMe)
        }
        // Always anchor user at end if not in top 5
        if (!userInTop5 && currentRank > 0) {
            Box(
                modifier = Modifier
                    .height(72.dp)
                    .width(1.dp)
                    .background(Color.White.copy(alpha = 0.1f))
            )
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .background(TargoGold.copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                    .border(1.dp, TargoGold.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                    .padding(horizontal = 12.dp, vertical = 8.dp),
            ) {
                Text("#$currentRank", fontSize = 10.sp, color = TargoGold, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                Text("YOU", fontSize = 12.sp, fontWeight = FontWeight.Black, color = TargoGold)
            }
        }
    }
}

@Composable
private fun LeaderboardEntry(
    rank: Int,
    entry: ChallengeLeaderboardEntry,
    isMe: Boolean,
) {
    val rankColor = when (rank) {
        1 -> Color(0xFFFFD700) // gold
        2 -> Color(0xFFB0B8C1) // silver
        3 -> Color(0xFFCD7F32) // bronze
        else -> Color.White.copy(alpha = 0.35f)
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .then(
                if (isMe) Modifier
                    .background(TargoGold.copy(alpha = 0.1f), RoundedCornerShape(10.dp))
                    .border(1.dp, TargoGold.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                    .padding(horizontal = 8.dp, vertical = 6.dp)
                else Modifier.padding(horizontal = 4.dp, vertical = 6.dp)
            ),
    ) {
        // Rank badge — colored circle with number
        Box(
            modifier = Modifier
                .size(22.dp)
                .background(rankColor.copy(alpha = 0.15f), CircleShape)
                .border(1.dp, rankColor.copy(alpha = 0.6f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "$rank",
                fontSize = 10.sp,
                fontWeight = FontWeight.Black,
                color = rankColor,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
        }
        Spacer(Modifier.height(6.dp))
        AvatarCircle(
            photoURL = entry.photoURL,
            displayName = entry.displayName,
            size = 44.dp,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = entry.displayName.split(" ").firstOrNull() ?: entry.displayName,
            fontSize = 11.sp,
            fontWeight = if (isMe) FontWeight.Bold else FontWeight.Normal,
            color = if (isMe) TargoGold else Color.White,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Text(
            text = "${entry.totalScore}",
            fontSize = 10.sp,
            color = Color.White.copy(alpha = 0.4f),
        )
    }
}

// ── Daily Challenge card ──────────────────────────────────────────────────────

@Composable
private fun DailyChallengeCard(
    challenge: HomeChallenge?,
    isLoading: Boolean,
    onAccept: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val hoursLeft = remember {
        val now = java.util.Calendar.getInstance()
        val midnight = java.util.Calendar.getInstance().apply {
            add(java.util.Calendar.DAY_OF_YEAR, 1)
            set(java.util.Calendar.HOUR_OF_DAY, 0)
            set(java.util.Calendar.MINUTE, 0)
            set(java.util.Calendar.SECOND, 0)
        }
        ((midnight.timeInMillis - now.timeInMillis) / 3_600_000).toInt()
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFF111111))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(14.dp))
            .clickable(onClick = onAccept),
    ) {
        if (isLoading || challenge == null) {
            Box(
                modifier = Modifier.fillMaxWidth().height(110.dp),
                contentAlignment = Alignment.Center,
            ) {
                if (isLoading) CircularProgressIndicator(color = TargoGold, modifier = Modifier.size(20.dp))
                else Text("No challenge today", color = Color.White.copy(alpha = 0.4f), fontSize = 14.sp)
            }
            return@Box
        }

        Column(modifier = Modifier.padding(16.dp)) {
            // Top row: image + info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                val context = LocalContext.current
                val bitmap = remember(challenge.localAssetIndex) {
                    runCatching {
                        context.assets.open("challenges/ch${challenge.localAssetIndex}.png")
                            .use { BitmapFactory.decodeStream(it) }?.asImageBitmap()
                    }.getOrNull()
                }
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFF2A2A2A)),
                ) {
                    bitmap?.let {
                        Image(
                            bitmap = it,
                            contentDescription = challenge.title,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop,
                        )
                    }
                }

                Column(modifier = Modifier.weight(1f)) {
                    // Resets in label
                    Text(
                        text = "Resets in ${hoursLeft}h",
                        fontSize = 10.sp,
                        color = if (hoursLeft <= 3) Color(0xFFE63946) else Color.White.copy(alpha = 0.4f),
                        fontWeight = FontWeight.SemiBold,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = challenge.title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Complete ${challenge.totalDrills} drills to finish",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.45f),
                    )
                }
            }

            // Progress bar
            if (challenge.totalDrills > 0) {
                Spacer(Modifier.height(12.dp))
                val progress = (challenge.completedDrills.toFloat() / challenge.totalDrills).coerceIn(0f, 1f)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "${challenge.completedDrills} / ${challenge.totalDrills} drills",
                        fontSize = 11.sp,
                        color = Color.White.copy(alpha = 0.5f),
                    )
                    Text(
                        text = "${(progress * 100).toInt()}%",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TargoGold,
                    )
                }
                Spacer(Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(2.dp)),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(progress)
                            .fillMaxHeight()
                            .background(TargoGold, RoundedCornerShape(2.dp)),
                    )
                }
            }

            Spacer(Modifier.height(12.dp))
            Button(
                onClick = onAccept,
                colors = ButtonDefaults.buttonColors(containerColor = TargoGold),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth().height(42.dp),
            ) {
                Text(
                    text = if (challenge.completedDrills > 0) "CONTINUE CHALLENGE" else "START CHALLENGE",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black,
                    letterSpacing = 0.5.sp,
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

    // Row 1: Hit Ratio arc + Accuracy sparkline
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        HomeHitRatioCard(
            hitRatio = s.hitRatio,
            modifier = Modifier.weight(1f).height(140.dp),
        )
        HomeAccuracyCard(
            accuracy = s.avgAccuracy,
            history = s.accuracyHistory,
            modifier = Modifier.weight(1f).height(140.dp),
        )
    }

    Spacer(Modifier.height(10.dp))

    // Row 2: Weekly shots bar chart
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(Color(0xFF1A1A1A), RoundedCornerShape(8.dp))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .padding(12.dp),
    ) {
        Text(
            text = "Weekly Shots",
            fontSize = 11.sp,
            color = Color.White.copy(alpha = 0.6f),
        )
        Spacer(Modifier.height(8.dp))
        WeeklyBarsChart(weeklyShots = s.weeklyShots)
    }
}

@Composable
private fun HomeHitRatioCard(hitRatio: Double, modifier: Modifier = Modifier) {
    val blue = Color(0xFF3B82F6)
    Box(
        modifier = modifier
            .background(Color(0xFF1A1A1A), RoundedCornerShape(8.dp))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .drawBehind {
                val cx = size.width / 2f
                val cy = size.height / 2f
                val r = minOf(cx, cy) * 0.78f
                val strokeW = 14.dp.toPx()
                val inset = strokeW / 2f
                val startAngle = -225f
                val sweepTotal = 270f
                val hitSweep = (hitRatio.toFloat() / 100f).coerceIn(0f, 1f) * sweepTotal
                drawArc(
                    color = Color.White.copy(alpha = 0.1f),
                    startAngle = startAngle,
                    sweepAngle = sweepTotal,
                    useCenter = false,
                    topLeft = Offset(cx - r + inset, cy - r + inset),
                    size = Size((r - inset) * 2, (r - inset) * 2),
                    style = Stroke(strokeW, cap = StrokeCap.Round),
                )
                if (hitSweep > 0f) {
                    drawArc(
                        color = blue,
                        startAngle = startAngle,
                        sweepAngle = hitSweep,
                        useCenter = false,
                        topLeft = Offset(cx - r + inset, cy - r + inset),
                        size = Size((r - inset) * 2, (r - inset) * 2),
                        style = Stroke(strokeW, cap = StrokeCap.Round),
                    )
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Hit Ratio", fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f))
            Text(
                String.format("%.1f%%", hitRatio),
                fontSize = 22.sp,
                fontWeight = FontWeight.Black,
                color = blue,
            )
        }
    }
}

@Composable
private fun HomeAccuracyCard(accuracy: Double, history: List<Double>, modifier: Modifier = Modifier) {
    val green = Color(0xFF10B981)
    Column(
        modifier = modifier
            .background(Color(0xFF1A1A1A), RoundedCornerShape(8.dp))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
            .padding(12.dp),
    ) {
        Text("Accuracy", fontSize = 11.sp, color = Color.White.copy(alpha = 0.6f))
        Spacer(Modifier.height(2.dp))
        Text(
            String.format("%.1fcm", accuracy),
            fontSize = 22.sp,
            fontWeight = FontWeight.Black,
            color = green,
        )
        Text(
            "avg distance from center",
            fontSize = 9.sp,
            color = Color.White.copy(alpha = 0.3f),
        )
        Spacer(Modifier.height(8.dp))
        HomeSparkline(
            data = history,
            lineColor = green,
            modifier = Modifier.fillMaxWidth().weight(1f),
        )
    }
}

@Composable
private fun HomeSparkline(data: List<Double>, lineColor: Color, modifier: Modifier = Modifier) {
    if (data.size < 2) {
        Box(modifier = modifier, contentAlignment = Alignment.Center) {
            Text("—", color = Color.White.copy(alpha = 0.15f), fontSize = 20.sp)
        }
        return
    }
    Box(modifier = modifier.drawBehind {
        val pts = data.map { it.toFloat() }
        val minV = pts.min()
        val maxV = pts.max()
        val range = (maxV - minV).coerceAtLeast(0.001f)
        val w = size.width
        val h = size.height
        fun xAt(i: Int) = i.toFloat() / (pts.size - 1) * w
        fun yAt(v: Float) = h - ((v - minV) / range) * h
        val path = Path().apply {
            moveTo(xAt(0), yAt(pts[0]))
            pts.forEachIndexed { i, v -> if (i > 0) lineTo(xAt(i), yAt(v)) }
        }
        drawPath(path, lineColor, style = Stroke(2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
        drawCircle(lineColor, 4.dp.toPx(), Offset(xAt(pts.size - 1), yAt(pts.last())))
    })
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
