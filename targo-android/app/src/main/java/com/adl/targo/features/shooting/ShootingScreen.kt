package com.adl.targo.features.shooting

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.Image
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.adl.targo.R
import com.adl.targo.data.connection.TargetStatus
import com.adl.targo.domain.model.CompletionResult
import com.adl.targo.domain.model.ShotRecord
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.TargoGold
import kotlin.math.roundToInt

@Composable
fun ShootingScreen(
    viewModel: ShootingViewModel = hiltViewModel(),
    onFinished: () -> Unit,
) {
    val shots by viewModel.shots.collectAsState()
    val totalTime by viewModel.totalTime.collectAsState()
    val grouping by viewModel.grouping.collectAsState()
    val isDrillStopped by viewModel.isDrillStopped.collectAsState()
    val confirmingFinish by viewModel.confirmingFinish.collectAsState()
    val isDemoMode by viewModel.isDemoMode.collectAsState()
    val completionResult by viewModel.completionResult.collectAsState()
    val isSaving by viewModel.isSaving.collectAsState()
    val error by viewModel.error.collectAsState()
    val targetStatus by viewModel.targetStatus.collectAsState()

    val setup = viewModel.setup
    val totalShots = setup?.numberOfBullets ?: 0

    var showExitDialog by remember { mutableStateOf(false) }
    var isStatsExpanded by remember { mutableStateOf(false) }

    // If in-memory state was lost (process killed while backgrounded), go back
    LaunchedEffect(Unit) {
        if (viewModel.setup == null) { onFinished(); return@LaunchedEffect }
        viewModel.startShooting()
    }

    // Back handler — pause drill and show exit dialog
    BackHandler(enabled = completionResult == null && !showExitDialog) {
        viewModel.pauseDrill()
        showExitDialog = true
    }

    // Show error snackbar
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(error) {
        error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandDark),
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // ── Top bar ──────────────────────────────────────────────────────
            TopBar(
                shotsFired = shots.size,
                totalShots = totalShots,
                isDemoMode = isDemoMode,
                isDrillStopped = isDrillStopped,
                confirmingFinish = confirmingFinish,
                totalTime = totalTime,
                grouping = grouping,
                targetStatus = targetStatus,
                onStopFinish = { viewModel.handleStopFinish() },
                viewModel = viewModel,
            )

            // ── Target (centered) ─────────────────────────────────────────────
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                contentAlignment = Alignment.Center,
            ) {
                TargetWithShots(shots = shots)
            }

            // ── Bottom stats sheet ────────────────────────────────────────────
            BottomStatsSheet(
                shots = shots,
                isExpanded = isStatsExpanded,
                onToggle = { isStatsExpanded = !isStatsExpanded },
                viewModel = viewModel,
            )
        }

        // ── Snackbar ──────────────────────────────────────────────────────────
        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter),
        )

        // ── Saving overlay ────────────────────────────────────────────────────
        if (isSaving) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.6f)),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = TargoGold)
            }
        }

        // ── Exit dialog ───────────────────────────────────────────────────────
        if (showExitDialog) {
            ExitDialog(
                onContinue = {
                    showExitDialog = false
                    viewModel.resumeDrill()
                },
                onSaveExit = {
                    showExitDialog = false
                    viewModel.saveAndExit()
                },
                onExitWithoutSaving = {
                    showExitDialog = false
                    viewModel.exitWithoutSaving()
                    onFinished()
                },
            )
        }

        // ── Completion modal ──────────────────────────────────────────────────
        completionResult?.let { result ->
            CompletionModal(
                result = result,
                formattedTime = viewModel.formattedTime(result.totalTime),
                onDone = {
                    viewModel.clearCompletion()
                    onFinished()
                },
            )
        }
    }
}

// ── Top bar ───────────────────────────────────────────────────────────────────

@Composable
private fun TopBar(
    shotsFired: Int,
    totalShots: Int,
    isDemoMode: Boolean,
    isDrillStopped: Boolean,
    confirmingFinish: Boolean,
    totalTime: Int,
    grouping: Float,
    targetStatus: TargetStatus,
    onStopFinish: () -> Unit,
    viewModel: ShootingViewModel,
) {
    val isFinish = (shotsFired >= totalShots && totalShots > 0) || isDrillStopped || confirmingFinish

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF000000))
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        // Timer + connection dot
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            val dotColor = when (targetStatus) {
                TargetStatus.CONNECTED    -> Color(0xFF10B981)
                TargetStatus.DISCONNECTED -> Color(0xFFEF4444)
                TargetStatus.UNKNOWN      -> Color(0xFF6B7280)
            }
            if (!isDemoMode) {
                Box(
                    modifier = Modifier
                        .size(7.dp)
                        .background(dotColor, CircleShape)
                )
            }
            Text(
                text = viewModel.formattedTime(totalTime),
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
            )
        }

        // Shot counter (fired in gold / total in white)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "$shotsFired",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = TargoGold,
            )
            Text(
                text = " / $totalShots",
                fontSize = 15.sp,
                color = Color.White.copy(alpha = 0.6f),
            )
        }

        // Grouping
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "${(grouping * 10).roundToInt() / 10f}cm",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
            )
            Text("Grouping", fontSize = 9.sp, color = Color.White.copy(alpha = 0.4f))
        }

        Spacer(Modifier.width(4.dp))

        // Finish button
        Button(
            onClick = onStopFinish,
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isFinish) TargoGold else Color(0xFFE63946),
            ),
            shape = RoundedCornerShape(4.dp),
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
        ) {
            Text(
                text = if (isFinish) "FINISH" else "STOP",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black,
                letterSpacing = 0.5.sp,
            )
        }
    }
}

// ── Target with shot markers ──────────────────────────────────────────────────

@Composable
private fun TargetWithShots(shots: List<ShotRecord>) {
    BoxWithConstraints(
        modifier = Modifier
            .wrapContentSize()
            .aspectRatio(2f / 3f),
    ) {
        val targetW = maxWidth
        val targetH = maxHeight

        Image(
            painter = painterResource(R.drawable.target_8050),
            contentDescription = "Target",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.FillBounds,
        )

        // Shot markers
        shots.forEach { shot ->
            val markerSize = 22.dp
            val offsetX = targetW * shot.x - markerSize / 2
            val offsetY = targetH * shot.y - markerSize / 2
            val isLatest = shot.id == shots.last().id

            Box(
                modifier = Modifier
                    .offset(x = offsetX, y = offsetY)
                    .size(markerSize)
                    .background(
                        if (isLatest) TargoGold else Color.White.copy(alpha = 0.85f),
                        CircleShape,
                    )
                    .border(1.5.dp, Color.Black.copy(alpha = 0.6f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "${shot.id}",
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black,
                )
            }
        }
    }
}

// ── Bottom stats sheet ────────────────────────────────────────────────────────

@Composable
private fun BottomStatsSheet(
    shots: List<ShotRecord>,
    isExpanded: Boolean,
    onToggle: () -> Unit,
    viewModel: ShootingViewModel,
) {
    val sheetHeight by animateDpAsState(
        targetValue = if (isExpanded) 240.dp else 72.dp,
        label = "sheetHeight",
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .height(sheetHeight)
            .background(Color(0xFF1A1A1A)),
    ) {
        // Header stats row + toggle
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onToggle() },
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                StatsHeaderCell(label = "Shots", value = "${shots.size}")
                StatsHeaderDivider()
                StatsHeaderCell(label = "Avg Split", value = if (shots.isNotEmpty()) {
                    val avgSplit = shots.map { it.splitTime.toDouble() }.average()
                    String.format("%.2fs", avgSplit)
                } else "—")
                StatsHeaderDivider()
                StatsHeaderCell(label = "Avg Dist", value = if (shots.isNotEmpty()) {
                    val avgDist = shots.map { it.distanceFromCenter }.average()
                    "${(avgDist * 10).roundToInt() / 10f}cm"
                } else "—")
                StatsHeaderDivider()
                StatsHeaderCell(label = "Total Time", value = viewModel.formattedTime(
                    shots.lastOrNull()?.timestamp ?: 0
                ))
            }
            // Expand arrow
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = if (isExpanded) Icons.Filled.KeyboardArrowDown else Icons.Filled.KeyboardArrowUp,
                    contentDescription = null,
                    tint = TargoGold,
                    modifier = Modifier.size(18.dp),
                )
            }
        }

        // Expanded content
        if (isExpanded) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                items(shots.reversed()) { shot ->
                    ShotStatRow(shot = shot, viewModel = viewModel)
                }
            }
        }
    }
}

@Composable
private fun StatsHeaderCell(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, fontSize = 9.sp, color = TargoGold, letterSpacing = 0.5.sp, fontWeight = FontWeight.SemiBold)
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
    }
}

@Composable
private fun StatsHeaderDivider() {
    Box(modifier = Modifier.width(1.dp).height(28.dp).background(Color.White.copy(alpha = 0.1f)))
}

@Composable
private fun ShotStatRow(shot: ShotRecord, viewModel: ShootingViewModel) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.04f), RoundedCornerShape(6.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text("#${shot.id}", fontSize = 13.sp, color = TargoGold, fontWeight = FontWeight.Bold)
        Text(
            "${(shot.distanceFromCenter * 10).roundToInt() / 10f}cm",
            fontSize = 13.sp, color = Color.White,
        )
        Text(
            "t+${shot.splitTime}s",
            fontSize = 12.sp, color = Color.White.copy(alpha = 0.5f),
        )
        Text(
            viewModel.formattedTime(shot.timestamp),
            fontSize = 12.sp, color = Color.White.copy(alpha = 0.5f),
        )
    }
}

// ── Exit dialog ───────────────────────────────────────────────────────────────

@Composable
private fun ExitDialog(
    onContinue: () -> Unit,
    onSaveExit: () -> Unit,
    onExitWithoutSaving: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.75f)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .background(Color(0xFF1E1E1E), RoundedCornerShape(16.dp))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                "DRILL PAUSED",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = TargoGold,
                letterSpacing = 2.sp,
            )
            Text(
                "What would you like to do?",
                fontSize = 14.sp,
                color = Color.White.copy(alpha = 0.6f),
            )
            Spacer(Modifier.height(4.dp))
            Button(
                onClick = onContinue,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = TargoGold),
                shape = RoundedCornerShape(8.dp),
            ) {
                Text("CONTINUE DRILL", fontWeight = FontWeight.Bold, color = Color.Black, letterSpacing = 1.sp)
            }
            Button(
                onClick = onSaveExit,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(8.dp),
            ) {
                Text("SAVE & EXIT", fontWeight = FontWeight.Bold, color = Color.White, letterSpacing = 1.sp)
            }
            TextButton(onClick = onExitWithoutSaving) {
                Text("EXIT WITHOUT SAVING", color = Color.White.copy(alpha = 0.4f), fontSize = 13.sp)
            }
        }
    }
}

// ── Completion modal ──────────────────────────────────────────────────────────

@Composable
private fun CompletionModal(
    result: CompletionResult,
    formattedTime: String,
    onDone: () -> Unit,
) {
    Box(modifier = Modifier.fillMaxSize()) {
        // Soldiers background
        Image(
            painter = painterResource(R.drawable.soldiers),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
        // Dark scrim
        Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.55f)))

        // Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "DRILL COMPLETE!",
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                letterSpacing = 2.sp,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "Keep Pushing!",
                fontSize = 16.sp,
                color = Color.White.copy(alpha = 0.6f),
            )

            Spacer(Modifier.height(28.dp))

            // Score
            Text(
                text = if (result.isChallenge) "${result.score}" else "${result.totalShots}",
                fontSize = 72.sp,
                fontWeight = FontWeight.Black,
                color = TargoGold,
            )
            Text(
                text = if (result.isChallenge) "SCORE" else "SHOTS FIRED",
                fontSize = 12.sp,
                color = Color.White.copy(alpha = 0.5f),
                letterSpacing = 2.sp,
            )

            // Stars (challenge only)
            if (result.isChallenge) {
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    repeat(3) { i ->
                        Icon(
                            imageVector = if (i < result.stars) Icons.Filled.Star else Icons.Outlined.StarOutline,
                            contentDescription = null,
                            tint = TargoGold,
                            modifier = Modifier.size(32.dp),
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // Stats row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                CompletionStat("TIME", formattedTime)
                CompletionStat("AVG DIST", "${result.avgDistance}cm")
                CompletionStat("GROUPING", "${result.grouping}cm")
            }

            Spacer(Modifier.height(32.dp))

            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Button(
                    onClick = onDone,
                    modifier = Modifier.weight(1f).height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TargoGold),
                    shape = RoundedCornerShape(8.dp),
                ) {
                    Text("Start Now", fontWeight = FontWeight.Bold, color = Color.Black, fontSize = 13.sp)
                }
                OutlinedButton(
                    onClick = onDone,
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color(0xFF1A1A1A),
                        contentColor = Color.White,
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                ) {
                    Text("Retry", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
                OutlinedButton(
                    onClick = onDone,
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color(0xFF1A1A1A),
                        contentColor = Color.White,
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                ) {
                    Text("Exit", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun CompletionStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text(label, fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f), letterSpacing = 1.sp)
    }
}
