package com.adl.targo.features.statistics

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.ArrowDropUp
import androidx.compose.material.icons.outlined.*
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
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.adl.targo.R
import com.adl.targo.domain.model.DrillSessionSummary
import com.adl.targo.domain.model.LeaderboardEntry
import com.adl.targo.domain.model.ShotPoint
import com.adl.targo.domain.model.UserStatistics
import com.adl.targo.ui.theme.TargoGold
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.*

private val dateFormat = SimpleDateFormat("M/d/yyyy", Locale.getDefault())

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun StatisticsScreen(
    viewModel: StatisticsViewModel = hiltViewModel(),
    onStartShooting: () -> Unit = {},
) {
    val stats by viewModel.stats.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("STATS", "INSIGHTS", "HISTORY")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0E0E0E))
            .statusBarsPadding(),
    ) {
        // Tab bar — plain text, active = gold
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 20.dp, end = 20.dp, top = 36.dp, bottom = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            tabs.forEachIndexed { i, label ->
                Text(
                    text = label,
                    modifier = Modifier.clickable { selectedTab = i },
                    fontSize = 14.sp,
                    fontWeight = if (selectedTab == i) FontWeight.Bold else FontWeight.Normal,
                    color = if (selectedTab == i) TargoGold else Color.White.copy(alpha = 0.4f),
                    letterSpacing = 1.sp,
                )
            }
        }

        if (isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = TargoGold)
            }
            return@Column
        }

        val s = stats ?: UserStatistics()

        when (selectedTab) {
            0 -> StatsTab(s = s, onStartShooting = onStartShooting)
            1 -> InsightsTab(s = s)
            2 -> HistoryTab(s = s)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS TAB
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun StatsTab(s: UserStatistics, onStartShooting: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Spacer(Modifier.height(4.dp))

        // Rating & Rank card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "${s.adlScore} RP",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        color = TargoGold,
                    )
                    Text(
                        "#${s.globalRank}",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        color = TargoGold,
                    )
                }
                Text(
                    "Rating Points / Global Rank",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.5f),
                )
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    if (s.rpChange > 0) {
                        Text(
                            "↗ +${s.rpChange} RP",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF10B981),
                        )
                    }
                    if (s.rankChange > 0) {
                        Text(
                            "+${s.rankChange} Positions",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF10B981),
                        )
                    }
                }
            }
        }

        // Leaderboard
        if (s.leaderboard.isNotEmpty()) {
            Text(
                "Leaderboard",
                fontSize = 11.sp,
                color = Color.White.copy(alpha = 0.5f),
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.5.sp,
            )
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                s.leaderboard.forEach { entry -> LeaderboardRow(entry) }
            }
        }

        // Stats grid
        // Row 1: Hit Ratio donut | Accuracy mini chart
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            HitRatioCard(
                hitRatio = s.hitRatio,
                hitRatioChange = s.hitRatioChange,
                modifier = Modifier.weight(1f).height(160.dp),
            )
            AccuracyMiniChartCard(
                accuracy = s.avgAccuracy,
                accuracyChange = s.accuracyChange,
                history = s.accuracyHistory,
                modifier = Modifier.weight(1f).height(160.dp),
            )
        }

        // Row 2: Reaction Time | Grouping Tightness
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            StatMetricCard(
                icon = Icons.Outlined.AccessTime,
                value = String.format("%.2fs", s.reactionTime),
                label = "Reaction Time",
                change = "${String.format("%.2f", abs(s.reactionTimeChange))}s",
                isImproved = s.reactionTimeChange <= 0,
                modifier = Modifier.weight(1f),
            )
            StatMetricCard(
                icon = Icons.Outlined.MyLocation,
                value = String.format("%.1fcm", s.avgGrouping),
                label = "Grouping Tightness",
                change = "${String.format("%.1f", abs(s.groupingChange))}cm",
                isImproved = s.groupingChange <= 0,
                modifier = Modifier.weight(1f),
            )
        }

        // Row 3: Split Times | Session Variance
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            StatMetricCard(
                icon = Icons.Outlined.Timer,
                value = String.format("%.2fs", s.splitTimes),
                label = "Split Times (avg)",
                change = "${if (s.splitTimesChange > 0) "+" else ""}${String.format("%.2f", s.splitTimesChange)}s",
                isImproved = s.splitTimesChange <= 0,
                modifier = Modifier.weight(1f),
            )
            StatMetricCard(
                icon = Icons.Outlined.BarChart,
                value = "${if (s.sessionVariance >= 0) "+" else ""}${String.format("%.1f", s.sessionVariance)}",
                label = "Session Variance",
                change = s.sessionVarianceChange,
                isImproved = s.sessionVarianceChange == "More Consistent",
                modifier = Modifier.weight(1f),
            )
        }

        // Challenge Complete Rate
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Icon(
                    imageVector = Icons.Outlined.EmojiEvents,
                    contentDescription = "Challenge",
                    tint = TargoGold,
                    modifier = Modifier.size(52.dp),
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "${s.challengeCompletionPct.toInt()}%",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Black,
                    color = TargoGold,
                )
                Text(
                    "Challenges Complete Rate",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.5f),
                )
                if (s.challengeCompleteRateChange != 0.0) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "${if (s.challengeCompleteRateChange >= 0) "↗ +" else "↘ "}${String.format("%.1f", abs(s.challengeCompleteRateChange))}% This Month",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (s.challengeCompleteRateChange >= 0) Color(0xFF10B981) else Color(0xFFEF4444),
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))
    }
}

@Composable
private fun LeaderboardRow(entry: LeaderboardEntry) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .border(
                width = if (entry.isCurrentUser) 1.5.dp else 0.5.dp,
                color = if (entry.isCurrentUser) TargoGold else Color.White.copy(alpha = 0.12f),
                shape = RoundedCornerShape(8.dp),
            )
            .padding(horizontal = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            "${entry.rank}",
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White.copy(alpha = 0.6f),
            modifier = Modifier.width(28.dp),
        )
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(Color.White.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                entry.displayName.firstOrNull()?.uppercase() ?: "?",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White.copy(alpha = 0.7f),
            )
        }
        Text(
            entry.displayName,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White,
            modifier = Modifier.weight(1f),
        )
        Text(
            "${entry.points} pts",
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White.copy(alpha = 0.6f),
        )
    }
}

@Composable
private fun HitRatioCard(
    hitRatio: Double,
    hitRatioChange: Double,
    modifier: Modifier = Modifier,
) {
    val blue = Color(0xFF3B82F6)
    Box(
        modifier = modifier
            .background(Color(0xFF1E1E1E), RoundedCornerShape(8.dp))
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
            val improved = hitRatioChange >= 0
            Text(
                "${if (improved) "↗ +" else "↘ "}${String.format("%.1f", abs(hitRatioChange))}%",
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (improved) Color(0xFF10B981) else Color(0xFFEF4444),
            )
        }
    }
}

@Composable
private fun AccuracyMiniChartCard(
    accuracy: Double,
    accuracyChange: Double,
    history: List<Double>,
    modifier: Modifier = Modifier,
) {
    val green = Color(0xFF10B981)
    Column(
        modifier = modifier
            .background(Color(0xFF1E1E1E), RoundedCornerShape(8.dp))
            .padding(10.dp),
    ) {
        Text("Accuracy", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
        Spacer(Modifier.height(2.dp))
        Text(
            String.format("%.1fcm", accuracy),
            fontSize = 18.sp,
            fontWeight = FontWeight.Black,
            color = green,
        )
        val isImproved = accuracyChange <= 0
        Text(
            "${if (isImproved) "↘" else "↗"} ${String.format("%.1f", abs(accuracyChange))}cm",
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isImproved) Color(0xFFEF4444) else Color(0xFF10B981),
        )
        Spacer(Modifier.height(6.dp))
        Row(modifier = Modifier.fillMaxWidth().weight(1f)) {
            Column(
                modifier = Modifier.width(16.dp).fillMaxHeight(),
                verticalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("10", fontSize = 8.sp, color = Color.White.copy(alpha = 0.35f))
                Text("0", fontSize = 8.sp, color = Color.White.copy(alpha = 0.35f))
            }
            SparklineChart(
                data = history.ifEmpty {
                    listOf(5.0, 4.0, 6.0, 3.5, 5.5, 3.0, accuracy)
                },
                lineColor = green,
                modifier = Modifier.weight(1f).fillMaxHeight(),
            )
        }
    }
}

@Composable
private fun StatMetricCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    value: String,
    label: String,
    change: String,
    isImproved: Boolean,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .background(Color(0xFF1E1E1E), RoundedCornerShape(8.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(icon, contentDescription = label, tint = Color.White.copy(alpha = 0.55f), modifier = Modifier.size(26.dp))
        Spacer(Modifier.height(6.dp))
        Text(value, fontSize = 22.sp, fontWeight = FontWeight.Black, color = TargoGold)
        Spacer(Modifier.height(2.dp))
        Text(label, fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f), textAlign = TextAlign.Center)
        Spacer(Modifier.height(2.dp))
        Text(
            "${if (isImproved) "↗" else "↘"} $change",
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isImproved) Color(0xFF10B981) else Color(0xFFEF4444),
            textAlign = TextAlign.Center,
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHTS TAB
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun InsightsTab(s: UserStatistics) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Spacer(Modifier.height(4.dp))

        // Overall Performance
        Text(
            "Overall Preformance",
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White,
        )

        // ADL Score gauge card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(
                        "ADL SCORE",
                        fontSize = 10.sp,
                        color = Color.White.copy(alpha = 0.4f),
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.sp,
                    )
                    Text(
                        "#${s.globalRank}",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TargoGold,
                    )
                }
                Spacer(Modifier.height(8.dp))
                AdlGauge(
                    adlScore = s.adlScore,
                    modifier = Modifier.fillMaxWidth().height(160.dp),
                )
            }
        }

        // Shot Effectiveness
        Text(
            "Shot Effectiveness",
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White,
        )

        // Grouping + Accuracy mini charts (2 columns)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            MiniChartCard(
                title = "GROUPING",
                value = String.format("%.1fcm", s.avgGrouping),
                change = String.format("%.1fcm", abs(s.groupingChange)),
                isImproved = s.groupingChange <= 0,
                data = s.groupingHistory,
                lineColor = Color(0xFFF97316),
                modifier = Modifier.weight(1f),
            )
            MiniChartCard(
                title = "ACCURACY",
                value = String.format("%.1fcm", s.avgAccuracy),
                change = String.format("%.1fcm", abs(s.accuracyChange)),
                isImproved = s.accuracyChange <= 0,
                data = s.accuracyHistory,
                lineColor = Color(0xFF14B8A6),
                modifier = Modifier.weight(1f),
            )
        }

        // Hit Ratio area chart
        AreaChartCard(
            label = "HIT RATIO",
            value = "${s.hitRatio.toInt()}%",
            valueColor = Color(0xFF3B82F6),
            data = s.hitRatioHistory.ifEmpty { listOf(70.0, 75.0, 72.0, 80.0, 78.0, 82.0, 83.0) },
            lineColor = Color(0xFF3B82F6),
        )

        // Reaction Time area chart
        AreaChartCard(
            label = "REACTION TIME",
            value = "${s.reactionTime.toInt()} Seconds",
            valueColor = Color(0xFF84CC16),
            data = s.reactionTimeHistory.ifEmpty { listOf(2.5, 2.3, 2.6, 2.2, 2.4, 2.1, 2.0) },
            lineColor = Color(0xFF84CC16),
        )

        // Split Time area chart
        AreaChartCard(
            label = "SPLIT TIME",
            value = "${s.splitTimes.toInt()} Seconds",
            valueColor = Color(0xFF14B8A6),
            data = s.splitTimeHistory.ifEmpty { listOf(5.5, 5.8, 5.2, 6.0, 5.7, 6.2, 6.0) },
            lineColor = Color(0xFF14B8A6),
        )

        // Weak Points
        Text(
            "Weak Points",
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White,
        )

        WeakPointsCard()

        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun AdlGauge(adlScore: Int, modifier: Modifier = Modifier) {
    val scoreNorm = adlScore.coerceIn(0, 1000)
    Box(
        modifier = modifier.drawBehind {
            val cx = size.width / 2f
            val cy = size.height * 0.82f
            val r = size.width * 0.36f
            val strokeW = 18.dp.toPx()
            val inset = strokeW / 2f

            // Track
            drawArc(
                color = Color.White.copy(alpha = 0.08f),
                startAngle = 180f, sweepAngle = 180f, useCenter = false,
                topLeft = Offset(cx - r + inset, cy - r + inset),
                size = Size((r - inset) * 2, (r - inset) * 2),
                style = Stroke(strokeW, cap = StrokeCap.Round),
            )

            // Colored zones (5 segments)
            val zones = listOf(
                Color(0xFFE63946), Color(0xFFF97316),
                Color(0xFFF6BA16), Color(0xFF84CC16), Color(0xFF10B981),
            )
            val zoneSweep = 180f / zones.size
            zones.forEachIndexed { i, color ->
                val sweep = if (scoreNorm / 200 > i)
                    if (scoreNorm / 200 > i + 1) zoneSweep else ((scoreNorm % 200).toFloat() / 200f) * zoneSweep
                else 0f
                if (sweep > 0f) {
                    drawArc(
                        color = color,
                        startAngle = 180f + i * zoneSweep, sweepAngle = sweep, useCenter = false,
                        topLeft = Offset(cx - r + inset, cy - r + inset),
                        size = Size((r - inset) * 2, (r - inset) * 2),
                        style = Stroke(strokeW, cap = StrokeCap.Round),
                    )
                }
            }

            // Needle
            val needleAngleRad = Math.toRadians(180.0 + (scoreNorm / 1000.0) * 180.0)
            val needleLen = r - strokeW - 4.dp.toPx()
            val nx = (cx + needleLen * cos(needleAngleRad)).toFloat()
            val ny = (cy + needleLen * sin(needleAngleRad)).toFloat()
            drawLine(Color.White, Offset(cx, cy), Offset(nx, ny), 2.5.dp.toPx(), StrokeCap.Round)
            drawCircle(Color.White, 6.dp.toPx(), Offset(cx, cy))
        },
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(top = 48.dp),
        ) {
            Text(
                "$adlScore",
                fontSize = 38.sp,
                fontWeight = FontWeight.Black,
                color = TargoGold,
            )
        }
    }
}

@Composable
private fun MiniChartCard(
    title: String,
    value: String,
    change: String,
    isImproved: Boolean,
    data: List<Double>,
    lineColor: Color,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(title, fontSize = 9.sp, color = Color.White.copy(alpha = 0.4f), letterSpacing = 1.sp, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(4.dp))
            Text(value, fontSize = 16.sp, fontWeight = FontWeight.Black, color = lineColor)
            Text(
                "${if (isImproved) "↗" else "↘"} $change",
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (isImproved) Color(0xFF10B981) else Color(0xFFEF4444),
            )
            Spacer(Modifier.height(8.dp))
            SparklineChart(
                data = data.ifEmpty { listOf(4.0, 3.0, 5.0, 2.5, 4.5, 3.0) },
                lineColor = lineColor,
                modifier = Modifier.fillMaxWidth().height(50.dp),
            )
        }
    }
}

@Composable
private fun AreaChartCard(
    label: String,
    value: String,
    valueColor: Color,
    data: List<Double>,
    lineColor: Color,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(label, fontSize = 10.sp, color = Color.White.copy(alpha = 0.4f), letterSpacing = 1.sp, fontWeight = FontWeight.SemiBold)
                    Text(value, fontSize = 16.sp, fontWeight = FontWeight.Black, color = valueColor)
                }
                Text("SEE MORE", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TargoGold, letterSpacing = 1.sp)
            }
            Spacer(Modifier.height(12.dp))
            AreaChart(
                data = data,
                lineColor = lineColor,
                modifier = Modifier.fillMaxWidth().height(160.dp),
            )
        }
    }
}

@Composable
private fun WeakPointsCard() {
    val labels = listOf(
        "Breaking\nWrist Up",
        "Heeling:\nAnticipating\nRecoil",
        "Thumbing",
        "Tightening Grip\nWhile Pulling\nthe Trigger",
        "Breaking\nWrist Down\nDropping\nthe Head",
        "Jerking",
        "Finger Not On\nTrigger Correctly",
        "Pushing:\nAnticipating\nRecoil",
    )
    val highlightedIndex = 2
    val dotIndices = setOf(0, 1, 2, 6)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            WeakPointsPieChart(
                labels = labels,
                highlightedIndex = highlightedIndex,
                dotIndices = dotIndices,
                modifier = Modifier.fillMaxWidth().aspectRatio(1f),
            )
            Spacer(Modifier.height(16.dp))
            Text(
                "Thumbing",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF00FF6A),
            )
            Spacer(Modifier.height(6.dp))
            Text(
                "Too much thumb pressure that drives the barrel toward the side of the strong hand.",
                fontSize = 13.sp,
                color = Color.White.copy(alpha = 0.6f),
                textAlign = TextAlign.Center,
                lineHeight = 20.sp,
            )
        }
    }
}

@Composable
private fun WeakPointsPieChart(
    labels: List<String>,
    highlightedIndex: Int,
    dotIndices: Set<Int>,
    modifier: Modifier = Modifier,
) {
    val n = labels.size
    val sliceAngle = 360f / n
    val startOffset = -90f - sliceAngle / 2f

    Canvas(modifier = modifier) {
        val cx = size.width / 2f
        val cy = size.height / 2f
        val outerR = minOf(cx, cy) * 0.92f
        val innerR = outerR * 0.22f

        for (i in 0 until n) {
            val isHighlighted = i == highlightedIndex
            val sAngle = startOffset + i * sliceAngle

            // Slice fill
            drawArc(
                color = if (isHighlighted) Color(0xFF142A1E) else Color(0xFF252525),
                startAngle = sAngle + 0.5f,
                sweepAngle = sliceAngle - 1f,
                useCenter = true,
                topLeft = Offset(cx - outerR, cy - outerR),
                size = Size(outerR * 2, outerR * 2),
            )

            // Green border for highlighted
            if (isHighlighted) {
                drawArc(
                    color = Color(0xFF00FF6A),
                    startAngle = sAngle + 0.5f,
                    sweepAngle = sliceAngle - 1f,
                    useCenter = true,
                    topLeft = Offset(cx - outerR, cy - outerR),
                    size = Size(outerR * 2, outerR * 2),
                    style = Stroke(3.dp.toPx()),
                )
            }
        }

        // Divider lines
        for (i in 0 until n) {
            val lineAngle = Math.toRadians((startOffset + i * sliceAngle).toDouble())
            drawLine(
                color = Color(0xFF3A3A3A),
                start = Offset(cx, cy),
                end = Offset(cx + (outerR * cos(lineAngle)).toFloat(), cy + (outerR * sin(lineAngle)).toFloat()),
                strokeWidth = 1.5.dp.toPx(),
            )
        }

        // Outer ring
        drawCircle(Color(0xFF3A3A3A), outerR, Offset(cx, cy), style = Stroke(1.dp.toPx()))

        // Center circle
        drawCircle(Color(0xFF1A1A1A), innerR, Offset(cx, cy))
        drawCircle(Color(0xFF3A3A3A), innerR, Offset(cx, cy), style = Stroke(1.dp.toPx()))

        // Orange dots at outer tips
        for (i in dotIndices) {
            val dotAngle = Math.toRadians((startOffset + (i + 0.5f) * sliceAngle).toDouble())
            val dotR = outerR * 0.82f
            drawCircle(
                color = Color(0xFFF97316),
                radius = 5.dp.toPx(),
                center = Offset(cx + (dotR * cos(dotAngle)).toFloat(), cy + (dotR * sin(dotAngle)).toFloat()),
            )
        }

        // Labels (using nativeCanvas for text)
        drawIntoCanvas { canvas ->
            for (i in 0 until n) {
                val isHighlighted = i == highlightedIndex
                val labelAngle = Math.toRadians((startOffset + (i + 0.5f) * sliceAngle).toDouble())
                val labelR = outerR * 0.62f
                val labelX = cx + (labelR * cos(labelAngle)).toFloat()
                val labelY = cy + (labelR * sin(labelAngle)).toFloat()

                val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                    textAlign = android.graphics.Paint.Align.CENTER
                    textSize = 8.5.sp.toPx()
                    color = if (isHighlighted) 0xFF00FF6A.toInt() else 0xCCFFFFFF.toInt()
                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                }

                val lines = labels[i].split("\n")
                val lineH = paint.textSize * 1.3f
                val totalH = (lines.size - 1) * lineH

                lines.forEachIndexed { li, line ->
                    canvas.nativeCanvas.drawText(
                        line,
                        labelX,
                        labelY - totalH / 2f + li * lineH + paint.textSize / 3f,
                        paint,
                    )
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY TAB
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun HistoryTab(s: UserStatistics) {
    var filter by remember { mutableStateOf("Training") }
    val filterOptions = listOf("Training", "Challenges", "League")

    val filtered = remember(s.sessionHistory, filter) {
        when (filter) {
            "Training" -> s.sessionHistory.filter { it.source == "training" || it.source.isEmpty() }
            "Challenges" -> s.sessionHistory.filter { it.source == "challenge" }
            "League" -> s.sessionHistory.filter { it.source == "league" }
            else -> s.sessionHistory
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // "Filter:" label + buttons
        Column(
            modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 12.dp),
        ) {
            Text(
                "Filter:",
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White.copy(alpha = 0.8f),
            )
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                filterOptions.forEach { f ->
                    val selected = filter == f
                    Box(
                        modifier = Modifier
                            .height(34.dp)
                            .clip(RoundedCornerShape(7.dp))
                            .background(if (selected) Color(0xFF3B82F6) else Color(0xFF252525))
                            .border(
                                1.dp,
                                if (selected) Color(0xFF3B82F6) else Color.White.copy(alpha = 0.15f),
                                RoundedCornerShape(7.dp),
                            )
                            .clickable { filter = f }
                            .padding(horizontal = 18.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            f,
                            fontSize = 13.sp,
                            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                            color = if (selected) Color.White else Color.White.copy(alpha = 0.5f),
                        )
                    }
                }
            }
        }

        if (filtered.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    "No ${filter.lowercase()} sessions found",
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.4f),
                )
            }
            return@Column
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(filtered, key = { it.id }) { session ->
                SessionCard(session)
            }
            item { Spacer(Modifier.height(12.dp)) }
        }
    }
}

@Composable
private fun SessionCard(session: DrillSessionSummary) {
    var expanded by remember { mutableStateOf(false) }
    val hitRate = if (session.numberOfBullets > 0)
        (session.totalShots.toFloat() / session.numberOfBullets * 100).toInt()
    else 0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { expanded = !expanded },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Collapsed header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        dateFormat.format(Date(session.completedAt)),
                        fontSize = 11.sp,
                        color = Color.White.copy(alpha = 0.4f),
                    )
                    Spacer(Modifier.height(2.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "${session.weaponName} - ${session.distance}m ",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White,
                        )
                        Text(
                            "$hitRate.0%",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF3B82F6),
                        )
                    }
                    Spacer(Modifier.height(2.dp))
                    Text(
                        "Bullets: ${session.numberOfBullets} | Hits: ${session.totalShots}",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.5f),
                    )
                }
                Icon(
                    imageVector = if (expanded) Icons.Filled.ArrowDropUp else Icons.Filled.ArrowDropDown,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.4f),
                    modifier = Modifier.size(24.dp),
                )
            }

            // Expanded content
            if (expanded) {
                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
                Spacer(Modifier.height(12.dp))

                // Stats row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround,
                ) {
                    SessionStat(label = "ACCURACY:", value = "$hitRate.0%", valueColor = Color(0xFF3B82F6))
                    SessionStat(label = "AVG. SPLIT:", value = String.format("%.2fs", session.avgSplitTime), valueColor = Color(0xFFF97316))
                    SessionStat(label = "HIT RATIO:", value = "${session.totalShots}/${session.numberOfBullets}", valueColor = Color(0xFF3B82F6))
                }

                // Target with numbered shots
                if (session.shots.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    ShotOnTarget(
                        shots = session.shots,
                        numbered = true,
                        modifier = Modifier.fillMaxWidth().height(260.dp),
                    )
                }

                // Share icon
                Spacer(Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Share,
                        contentDescription = "Share",
                        tint = Color.White.copy(alpha = 0.45f),
                        modifier = Modifier.size(20.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun SessionStat(label: String, value: String, valueColor: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, fontSize = 9.sp, color = Color.White.copy(alpha = 0.4f), letterSpacing = 0.5.sp)
        Spacer(Modifier.height(2.dp))
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = valueColor)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shot-on-target overlay (numbered or colored dots)
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun ShotOnTarget(
    shots: List<ShotPoint>,
    numbered: Boolean = false,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        BoxWithConstraints(modifier = Modifier.wrapContentSize().aspectRatio(1f)) {
            val targetW = maxWidth
            val targetH = maxHeight
            val dotSize = if (numbered) 20.dp else 12.dp

            Image(
                painter = painterResource(R.drawable.target_8050),
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.FillBounds,
            )

            shots.forEachIndexed { index, shot ->
                if (numbered) {
                    Box(
                        modifier = Modifier
                            .offset(
                                x = targetW * shot.x - dotSize / 2,
                                y = targetH * shot.y - dotSize / 2,
                            )
                            .size(dotSize)
                            .background(Color(0xFF1691F6), CircleShape)
                            .border(1.dp, Color.Black.copy(alpha = 0.25f), CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            "${index + 1}",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF0E0E0E),
                        )
                    }
                } else {
                    val dist = shot.distanceFromCenter
                    val dotColor = when {
                        dist < 8f -> Color(0xFF4CAF50)
                        dist < 20f -> TargoGold
                        else -> Color(0xFFEF4444)
                    }
                    Box(
                        modifier = Modifier
                            .offset(x = targetW * shot.x - dotSize / 2, y = targetH * shot.y - dotSize / 2)
                            .size(dotSize)
                            .background(dotColor.copy(alpha = 0.85f), CircleShape)
                            .border(1.dp, Color.Black.copy(alpha = 0.4f), CircleShape),
                    )
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart primitives
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun SparklineChart(
    data: List<Double>,
    lineColor: Color,
    modifier: Modifier = Modifier,
) {
    if (data.size < 2) {
        Box(modifier = modifier, contentAlignment = Alignment.Center) {
            Text("—", color = Color.White.copy(alpha = 0.15f), fontSize = 20.sp)
        }
        return
    }
    Box(modifier = modifier.drawBehind {
        val pts = data.map { it.toFloat() }
        val minV = pts.min(); val maxV = pts.max()
        val range = (maxV - minV).coerceAtLeast(0.001f)
        val w = size.width; val h = size.height

        fun xAt(i: Int) = i.toFloat() / (pts.size - 1) * w
        fun yAt(v: Float) = h - ((v - minV) / range) * h

        val linePath = Path().apply {
            moveTo(xAt(0), yAt(pts[0]))
            pts.forEachIndexed { i, v -> if (i > 0) lineTo(xAt(i), yAt(v)) }
        }
        drawPath(linePath, lineColor, style = Stroke(2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))

        // End dot
        drawCircle(lineColor, 4.dp.toPx(), Offset(xAt(pts.size - 1), yAt(pts.last())))
    })
}

@Composable
private fun AreaChart(
    data: List<Double>,
    lineColor: Color,
    modifier: Modifier = Modifier,
) {
    if (data.size < 2) {
        Box(modifier = modifier, contentAlignment = Alignment.Center) {
            Text("No data", color = Color.White.copy(alpha = 0.3f), fontSize = 12.sp)
        }
        return
    }

    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val padL = 34.dp.toPx()
        val padR = 8.dp.toPx()
        val padT = 8.dp.toPx()
        val padB = 22.dp.toPx()
        val chartW = w - padL - padR
        val chartH = h - padT - padB

        val minV = data.min()
        val maxV = data.max()
        val range = (maxV - minV).coerceAtLeast(0.001)

        fun xAt(i: Int) = padL + i.toFloat() / (data.size - 1) * chartW
        fun yAt(v: Double) = (padT + chartH - ((v - minV) / range * chartH)).toFloat()

        // Horizontal grid lines
        repeat(4) { g ->
            val gy = padT + (g.toFloat() / 3f) * chartH
            drawLine(Color.White.copy(alpha = 0.07f), Offset(padL, gy), Offset(w - padR, gy), 1.dp.toPx())
        }

        // Filled area
        val fillPath = Path().apply {
            moveTo(xAt(0), h - padB)
            data.forEachIndexed { i, v -> lineTo(xAt(i), yAt(v)) }
            lineTo(xAt(data.size - 1), h - padB)
            close()
        }
        drawPath(
            fillPath,
            Brush.verticalGradient(
                colors = listOf(lineColor.copy(alpha = 0.45f), Color.Transparent),
                startY = padT,
                endY = h - padB,
            ),
        )

        // Line
        val linePath = Path().apply {
            data.forEachIndexed { i, v ->
                if (i == 0) moveTo(xAt(i), yAt(v)) else lineTo(xAt(i), yAt(v))
            }
        }
        drawPath(linePath, lineColor, style = Stroke(2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))

        // Marker at index 1
        val markerIdx = minOf(1, data.size - 1)
        val mx = xAt(markerIdx)
        val my = yAt(data[markerIdx])
        drawLine(Color.White.copy(alpha = 0.4f), Offset(mx, padT), Offset(mx, h - padB), 1.dp.toPx())
        drawCircle(lineColor, 5.dp.toPx(), Offset(mx, my))
        drawCircle(Color(0xFF1A1A1A), 2.5.dp.toPx(), Offset(mx, my))

        // X-axis labels
        drawIntoCanvas { canvas ->
            val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.WHITE
                alpha = 80
                textSize = 9.sp.toPx()
                textAlign = android.graphics.Paint.Align.CENTER
            }
            data.indices.forEach { i ->
                canvas.nativeCanvas.drawText("T${i + 1}", xAt(i), h - 4.dp.toPx(), paint)
            }
        }

        // Y-axis labels
        drawIntoCanvas { canvas ->
            val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.WHITE
                alpha = 80
                textSize = 9.sp.toPx()
                textAlign = android.graphics.Paint.Align.RIGHT
            }
            canvas.nativeCanvas.drawText(String.format("%.0f", maxV), padL - 4.dp.toPx(), padT + 10.sp.toPx(), paint)
            canvas.nativeCanvas.drawText(String.format("%.0f", minV), padL - 4.dp.toPx(), h - padB, paint)
        }
    }
}

private fun lerp(a: Color, b: Color, t: Float): Color {
    val ct = t.coerceIn(0f, 1f)
    return Color(
        red = a.red + (b.red - a.red) * ct,
        green = a.green + (b.green - a.green) * ct,
        blue = a.blue + (b.blue - a.blue) * ct,
        alpha = 1f,
    )
}
