package com.adl.targo.features.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.adl.targo.domain.model.HomeChallenge
import com.adl.targo.domain.model.HomeStats
import com.adl.targo.domain.model.UserProfile
import com.adl.targo.ui.theme.*
import kotlin.math.min

@Composable
fun HomeScreen(
    onStartDrill: () -> Unit,
    onLogout: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val userProfile by viewModel.userProfile.collectAsState()
    val homeStats by viewModel.homeStats.collectAsState()
    val challenges by viewModel.challenges.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0D0D), BrandDark)))
            .verticalScroll(rememberScrollState()),
    ) {
        // ── User Header ───────────────────────────────────────────────────
        UserHeader(
            profile = userProfile,
            homeStats = homeStats,
            isLoading = isLoading,
            onLogout = { viewModel.logout(); onLogout() },
        )

        Spacer(modifier = Modifier.height(20.dp))

        // ── Start Drill CTA ───────────────────────────────────────────────
        Button(
            onClick = onStartDrill,
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .padding(horizontal = 20.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = TargoGold, contentColor = BrandDark),
        ) {
            Text("START DRILL", fontWeight = FontWeight.Black, fontSize = 18.sp, letterSpacing = 3.sp)
        }

        Spacer(modifier = Modifier.height(28.dp))

        // ── Challenges Section ────────────────────────────────────────────
        if (!isLoading) {
            ChallengesSection(challenges = challenges)
            Spacer(modifier = Modifier.height(28.dp))
        }

        // ── Statistics Section ────────────────────────────────────────────
        StatisticsSection(stats = homeStats, isLoading = isLoading)

        Spacer(modifier = Modifier.height(32.dp))
    }
}

// ────────────────────────────────────────────────────────────────────────────
// User Header
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun UserHeader(
    profile: UserProfile?,
    homeStats: HomeStats?,
    isLoading: Boolean,
    onLogout: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 20.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Avatar
        AvatarImage(
            photoURL = profile?.photoURL ?: "",
            displayName = profile?.bestName ?: "",
            modifier = Modifier.size(52.dp),
        )

        // Name + stats
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = if (isLoading) "Loading..." else (profile?.bestName ?: "Shooter"),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
            )
            if (!isLoading && homeStats != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Score: ${homeStats.adlScore}",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.5f),
                    )
                    Text(
                        text = profile?.rankLabel ?: "Recruit",
                        fontSize = 12.sp,
                        color = TargoGold,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
        }

        IconButton(onClick = onLogout) {
            Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Logout", tint = Color.White.copy(alpha = 0.5f))
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
        Box(
            modifier = modifier.clip(CircleShape).background(TargoGold.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = displayName.firstOrNull()?.uppercase() ?: "?",
                fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TargoGold,
            )
        }
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Challenges Section
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun ChallengesSection(challenges: List<HomeChallenge>) {
    Column {
        SectionHeader(title = "CHALLENGES")
        Spacer(modifier = Modifier.height(12.dp))

        if (challenges.isEmpty()) {
            Text(
                text = "No challenges available",
                color = Color.White.copy(alpha = 0.3f),
                fontSize = 13.sp,
                modifier = Modifier.padding(horizontal = 20.dp),
            )
        } else {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(challenges) { challenge ->
                    ChallengeCard(challenge = challenge)
                }
            }
        }
    }
}

@Composable
private fun ChallengeCard(challenge: HomeChallenge) {
    Card(
        modifier = Modifier.width(180.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = BrandSurface),
    ) {
        Column {
            // Challenge image
            Box(
                modifier = Modifier.fillMaxWidth().height(110.dp)
                    .background(Color.White.copy(alpha = 0.05f)),
            ) {
                if (challenge.imageUrl.isNotBlank()) {
                    AsyncImage(
                        model = challenge.imageUrl,
                        contentDescription = challenge.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop,
                    )
                }
                // Overlay gradient
                Box(
                    modifier = Modifier.fillMaxSize().background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, Color.Black.copy(alpha = 0.5f))
                        )
                    )
                )
            }

            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = challenge.title,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White,
                    maxLines = 2,
                )
                Spacer(modifier = Modifier.height(6.dp))

                // Progress bar
                val progress = if (challenge.totalDrills > 0)
                    challenge.completedDrills.toFloat() / challenge.totalDrills else 0f
                Text(
                    text = "Drills: ${challenge.completedDrills} / ${challenge.totalDrills}",
                    fontSize = 10.sp,
                    color = Color.White.copy(alpha = 0.5f),
                )
                Spacer(modifier = Modifier.height(4.dp))
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth().height(4.dp).clip(RoundedCornerShape(2.dp)),
                    color = TargoGold,
                    trackColor = Color.White.copy(alpha = 0.1f),
                )
                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = {},
                    modifier = Modifier.fillMaxWidth().height(34.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TargoGold, contentColor = BrandDark),
                    contentPadding = PaddingValues(0.dp),
                ) {
                    Text("LET'S GO", fontWeight = FontWeight.Bold, fontSize = 12.sp, letterSpacing = 1.sp)
                }
            }
        }
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Statistics Section
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun StatisticsSection(stats: HomeStats?, isLoading: Boolean) {
    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        SectionHeader(title = "STATISTICS")
        Spacer(modifier = Modifier.height(12.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = TargoGold)
            }
            return
        }

        val s = stats ?: HomeStats()

        // 2×2 grid
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            // Hit Ratio — arc/donut chart
            StatCard(modifier = Modifier.weight(1f), label = "HIT RATIO") {
                HitRatioChart(hitRatio = s.hitRatio)
            }
            // Avg Split Time — sparkline
            StatCard(modifier = Modifier.weight(1f), label = "AVG SPLIT TIME",
                value = String.format("%.2fs", s.avgSplitTime)) {
                SparklineChart(data = s.splitTimeHistory, lineColor = BrandSuccessGreen)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            // Avg Accuracy — sparkline
            StatCard(modifier = Modifier.weight(1f), label = "AVG ACCURACY",
                value = String.format("%.1fcm", s.avgAccuracy)) {
                SparklineChart(data = s.accuracyHistory, lineColor = TargoGold)
            }
            // Avg Grouping — radial heatmap
            StatCard(modifier = Modifier.weight(1f), label = "AVG GROUPING",
                value = String.format("%.1fcm", s.avgGrouping)) {
                GroupingChart(shots = s.groupingShots)
            }
        }
    }
}

@Composable
private fun StatCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String = "",
    chart: @Composable BoxScope.() -> Unit,
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = BrandSurface),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(text = label, fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f),
                fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
            if (value.isNotBlank()) {
                Text(text = value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Box(modifier = Modifier.fillMaxWidth().height(80.dp)) {
                chart()
            }
        }
    }
}

// ── Hit Ratio Arc Chart ───────────────────────────────────────────────────

@Composable
private fun HitRatioChart(hitRatio: Double) {
    val ratio = (hitRatio / 100.0).coerceIn(0.0, 1.0).toFloat()
    val gold = TargoGold
    val green = BrandSuccessGreen
    val bg = Color.White.copy(alpha = 0.08f)

    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier.fillMaxWidth().height(70.dp).drawBehind {
                val stroke = size.minDimension * 0.12f
                val inset = stroke / 2f
                val arcSize = Size(size.width - inset * 2, (size.height - inset) * 2)
                val topLeft = Offset(inset, inset / 2)

                // Background track (180° arc)
                drawArc(bg, 180f, 180f, false, topLeft, arcSize, style = Stroke(stroke, cap = StrokeCap.Round))
                // Progress arc
                drawArc(gold, 180f, 180f * ratio, false, topLeft, arcSize, style = Stroke(stroke, cap = StrokeCap.Round))
            },
            contentAlignment = Alignment.BottomCenter,
        ) {
            Text(
                text = "${hitRatio.toInt()}%",
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                color = TargoGold,
            )
        }
    }
}

// ── Sparkline Chart ───────────────────────────────────────────────────────

@Composable
private fun SparklineChart(data: List<Double>, lineColor: Color) {
    if (data.size < 2) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("—", color = Color.White.copy(alpha = 0.2f), fontSize = 20.sp)
        }
        return
    }

    val fillColor = lineColor.copy(alpha = 0.25f)

    Box(modifier = Modifier.fillMaxSize().drawBehind {
        val pts = data.map { it.toFloat() }
        val minV = pts.min()
        val maxV = pts.max()
        val range = (maxV - minV).coerceAtLeast(0.001f)
        val w = size.width; val h = size.height

        fun x(i: Int) = i.toFloat() / (pts.size - 1) * w
        fun y(v: Float) = h - ((v - minV) / range) * h * 0.85f - h * 0.075f

        // Fill path
        val fillPath = Path().apply {
            moveTo(x(0), h)
            pts.forEachIndexed { i, v -> lineTo(x(i), y(v)) }
            lineTo(x(pts.size - 1), h)
            close()
        }
        drawPath(fillPath, Brush.verticalGradient(listOf(fillColor, Color.Transparent)))

        // Line
        val linePath = Path().apply {
            moveTo(x(0), y(pts[0]))
            pts.forEachIndexed { i, v -> if (i > 0) lineTo(x(i), y(v)) }
        }
        drawPath(linePath, lineColor, style = Stroke(2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
    })
}

// ── Grouping Radial Chart ─────────────────────────────────────────────────

@Composable
private fun GroupingChart(shots: List<Double>) {
    val bands = listOf(8f, 18f, 30f, 45f, Float.MAX_VALUE)
    val colors = listOf(
        Color(0xFFF6BA16), Color(0xFFF59E0B),
        Color(0xFFF97316), Color(0xFFEF4444), Color(0xFF991B1B),
    )
    val radiiPct = listOf(0.20f, 0.38f, 0.58f, 0.78f, 1.0f)

    Box(modifier = Modifier.fillMaxSize().drawBehind {
        val cx = size.width / 2f; val cy = size.height / 2f
        val maxR = min(cx, cy) - 2f

        val counts = IntArray(bands.size)
        shots.forEach { d ->
            val df = d.toFloat()
            for (i in bands.indices) { if (df < bands[i]) { counts[i]++; break } }
        }
        val maxCount = counts.max().coerceAtLeast(1)

        // Draw rings outer→inner
        for (i in bands.indices.reversed()) {
            val outerR = radiiPct[i] * maxR
            val innerR = if (i == 0) 0f else radiiPct[i - 1] * maxR
            val density = counts[i].toFloat() / maxCount
            val alpha = if (shots.isEmpty()) 0.08f else 0.08f + density * 0.88f
            val c = colors[i]

            val path = Path().apply {
                addOval(androidx.compose.ui.geometry.Rect(cx - outerR, cy - outerR, cx + outerR, cy + outerR))
                if (innerR > 0) {
                    addOval(androidx.compose.ui.geometry.Rect(cx - innerR, cy - innerR, cx + innerR, cy + innerR))
                }
            }
            drawPath(path, color = c.copy(alpha = alpha), blendMode = BlendMode.SrcOver)
        }

        // Ring borders
        for (i in 0 until bands.size - 1) {
            val r = radiiPct[i] * maxR
            drawCircle(Color.White.copy(alpha = 0.06f), radius = r, center = Offset(cx, cy), style = Stroke(0.5.dp.toPx()))
        }

        // Center crosshair
        val ch = maxR * 0.08f
        val crossColor = Color(0x66F6BA16)
        val sw = 0.5.dp.toPx()
        drawLine(crossColor, Offset(cx - ch, cy), Offset(cx + ch, cy), sw)
        drawLine(crossColor, Offset(cx, cy - ch), Offset(cx, cy + ch), sw)
    })
}

// ── Shared ────────────────────────────────────────────────────────────────

@Composable
private fun SectionHeader(title: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            fontSize = 14.sp,
            fontWeight = FontWeight.Black,
            color = Color.White,
            letterSpacing = 2.sp,
        )
        Text(
            text = "SEE MORE",
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = TargoGold,
            letterSpacing = 1.sp,
        )
    }
}
