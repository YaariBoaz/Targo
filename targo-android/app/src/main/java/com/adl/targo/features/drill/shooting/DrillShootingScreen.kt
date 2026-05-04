package com.adl.targo.features.drill.shooting

import androidx.activity.compose.BackHandler
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.adl.targo.R
import com.adl.targo.domain.model.ShotData
import com.adl.targo.data.connection.TargetStatus
import com.adl.targo.features.drill.DrillViewModel
import com.adl.targo.features.lahav.LahavViewModel
import com.adl.targo.features.settings.SettingsViewModel
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold
import kotlin.math.sqrt

@Composable
fun DrillShootingScreen(
    drillViewModel: DrillViewModel,
    lahavViewModel: LahavViewModel,
    settingsViewModel: SettingsViewModel,
    onBack: () -> Unit,
    onNextStep: () -> Unit = {}
) {
    val state by drillViewModel.state.collectAsState()
    val currentStep by lahavViewModel.currentStep.collectAsState()
    val totalSteps by lahavViewModel.totalSteps.collectAsState()
    val activeShooter by lahavViewModel.activeShooter.collectAsState()
    val isSimulator by drillViewModel.isSimulatorMode.collectAsState()
    val targetStatus by drillViewModel.targetStatus.collectAsState()
    val cameraNumber by settingsViewModel.cameraNumber.collectAsState()
    var showStepModal by remember { mutableStateOf(false) }
    var showExitDialog by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    var statsExpanded by remember { mutableStateOf(false) }
    var wasRunningBeforeDialog by remember { mutableStateOf(false) }

    val saveAndGoBack: () -> Unit = {
        if (isSimulator) {
            drillViewModel.resetDrill()
            onBack()
        } else {
            isSaving = true
            lahavViewModel.completeStep(state.shots, state.startTimestamp, state.elapsedMs) {
                drillViewModel.resetDrill()
                onBack()
            }
        }
    }

    BackHandler {
        if (showStepModal || showExitDialog) return@BackHandler
        wasRunningBeforeDialog = state.isRunning
        if (state.isRunning) drillViewModel.pauseDrill()
        showExitDialog = true
    }

    Box(modifier = Modifier.fillMaxSize().background(BrandDark)) {
        Column(modifier = Modifier.fillMaxSize()) {

            // ── Top bar: SHOTS | SHOOTER NAME | STOP button ──────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(BrandSurface)
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                StatColumn(
                    label = "SHOTS",
                    value = if (isSimulator) "${state.shots.size}" else "${state.shots.size} / ${state.totalBullets}",
                    valueColor = TargoGold,
                    valueFontSize = 22
                )

                Column(
                    modifier = Modifier.weight(1f).padding(horizontal = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = (activeShooter?.name ?: state.shooterName).uppercase(),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        letterSpacing = 1.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (isSimulator) {
                            Surface(shape = RoundedCornerShape(4.dp), color = Color(0xFFFF9800)) {
                                Text(
                                    "● SIM",
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black
                                )
                            }
                        } else {
                            val (dotColor, connText) = when (targetStatus) {
                                TargetStatus.CONNECTED    -> Color(0xFF06D6A0) to "● מחובר"
                                TargetStatus.DISCONNECTED -> Color(0xFFE63946) to "● מנותק"
                                TargetStatus.UNKNOWN      -> Color(0xFF888888) to "● ממתין"
                            }
                            Surface(shape = RoundedCornerShape(4.dp), color = Color(0xFF1A1A1A)) {
                                Text(
                                    connText,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    fontSize = 10.sp, fontWeight = FontWeight.Bold, color = dotColor
                                )
                            }
                            Surface(shape = RoundedCornerShape(4.dp), color = Color(0xFF1A1A1A)) {
                                Text(
                                    if (cameraNumber == 0) "מצלמה: הכל" else "מצלמה: $cameraNumber",
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF888888)
                                )
                            }
                        }
                    }
                }

                if (state.isRunning) {
                    Button(
                        onClick = { drillViewModel.pauseDrill() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF9800)),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("עצור", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                } else {
                    Button(
                        onClick = { showStepModal = true },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD32F2F)),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("סיים שלב", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }

            // ── Time + Grouping row (always visible, below top bar) ──
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF111111))
                    .padding(horizontal = 20.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                StatColumn(label = "TOTAL TIME", value = formatElapsed(state.elapsedMs))
                StatColumn(label = "GROUPING", value = groupingText(state.shots, state.targetType))
            }

            // ── Target image + shot overlay ──────────────────────────
            val drillDone = state.shots.size >= state.totalBullets && state.totalBullets > 0
            val textMeasurer = rememberTextMeasurer()

            Column(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Done banner above target
                if (drillDone) {
                    Row(
                        modifier = Modifier
                            .padding(horizontal = 20.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text("✓", fontSize = 20.sp, color = TargoGold, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.width(8.dp))
                        Column {
                            Text(
                                "כל הכדורים נורו",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                "לחץ \"סיים שלב\" לסיום",
                                fontSize = 11.sp,
                                color = Color(0xFFAAAAAA)
                            )
                        }
                    }
                }

                Box(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight(0.97f)
                            .aspectRatio(2f / 3f)
                            .then(
                                if (drillDone) Modifier.border(2.dp, TargoGold, RoundedCornerShape(8.dp))
                                else Modifier
                            )
                    ) {
                        val targetDrawable = if (state.targetType == 1) R.drawable.target_8050 else R.drawable.target_6040
                        Image(
                            painter = painterResource(targetDrawable),
                            contentDescription = "Target",
                            contentScale = ContentScale.FillBounds,
                            modifier = Modifier.fillMaxSize()
                        )

                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val w = size.width
                            val h = size.height
                            val markerR = 8.dp.toPx()

                            state.shots.forEachIndexed { index, shot ->
                                val sx = (shot.x * w).coerceIn(markerR, w - markerR)
                                val sy = (shot.y * h).coerceIn(markerR, h - markerR)
                                val pos = Offset(sx, sy)
                                drawCircle(Color.Black.copy(alpha = 0.4f), 10.dp.toPx(), pos)
                                drawCircle(TargoGold, 8.dp.toPx(), pos)
                                drawCircle(Color.Black, 8.dp.toPx(), pos, style = Stroke(1.5.dp.toPx()))
                                val measured = textMeasurer.measure(
                                    text = "${index + 1}",
                                    style = TextStyle(
                                        color = Color.Black,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                )
                                drawText(
                                    textLayoutResult = measured,
                                    topLeft = Offset(
                                        sx - measured.size.width / 2f,
                                        sy - measured.size.height / 2f
                                    )
                                )
                            }
                        }
                    }
                }
            }

            // ── Bottom expandable stats sheet ─────────────────────────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(BrandSurface)
                    .animateContentSize()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { statsExpanded = !statsExpanded }
                        .padding(horizontal = 24.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    SplitStat("ספליט אחרון", lastSplitText(state.shots, state.startTimestamp))
                    SplitStat("ספליט ממוצע", avgSplitText(state.shots, state.elapsedMs))
                    Text(if (statsExpanded) "▼" else "▲", color = Color(0xFF666666), fontSize = 12.sp)
                }

                if (statsExpanded && state.shots.isNotEmpty()) {
                    HorizontalDivider(color = Color(0xFF222222))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("#", fontSize = 11.sp, color = Color(0xFF555555))
                        Text("ניקוד", fontSize = 11.sp, color = Color(0xFF555555))
                        Text("ספליט", fontSize = 11.sp, color = Color(0xFF555555))
                    }
                    state.shots.forEachIndexed { idx, shot ->
                        val splitMs = if (idx == 0) shot.timestamp - state.startTimestamp
                        else shot.timestamp - state.shots[idx - 1].timestamp
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp, vertical = 2.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("${idx + 1}", fontSize = 13.sp, color = Color.White)
                            Text("${shotScore(shot)}", fontSize = 13.sp, color = TargoGold)
                            Text("%.2fs".format(splitMs / 1000f), fontSize = 13.sp, color = Color(0xFFAAAAAA))
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }
        }

        // ── Lahav step modal ─────────────────────────────────────────
        if (showStepModal) {
            val isLastStep = (currentStep + 1) >= totalSteps
            val shooterName = activeShooter?.name ?: state.shooterName

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.85f)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth(0.9f)
                        .padding(horizontal = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141414)),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        if (isLastStep) {
                            Text("🎯", fontSize = 48.sp)
                            Text("כל הכבוד!", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text(
                                "$shooterName סיים את כל $totalSteps השלבים",
                                fontSize = 15.sp,
                                color = Color(0xFF999999),
                                textAlign = TextAlign.Center
                            )
                        } else {
                            Text(
                                "שלב ${currentStep + 1} / $totalSteps",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TargoGold.copy(alpha = 0.8f),
                                letterSpacing = 1.sp
                            )
                            Text("השלב הושלם", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text(
                                "מוכן לשלב ${currentStep + 2}?",
                                fontSize = 15.sp,
                                color = Color(0xFF999999)
                            )
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 4.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            ModalStat("ירי", "${state.shots.size}")
                            ModalStat("ניקוד", "${state.shots.sumOf { shotScore(it) }}")
                            ModalStat("זמן", formatElapsed(state.elapsedMs))
                        }

                        Spacer(Modifier.height(4.dp))

                        // Primary confirm button
                        Button(
                            onClick = {
                                if (isLastStep) {
                                    saveAndGoBack()
                                } else {
                                    isSaving = true
                                    lahavViewModel.completeStepAndContinue(
                                        state.shots, state.startTimestamp, state.elapsedMs
                                    ) {
                                        drillViewModel.resetDrill()
                                        showStepModal = false
                                        isSaving = false
                                        onNextStep()
                                    }
                                }
                            },
                            enabled = !isSaving,
                            modifier = Modifier.fillMaxWidth().height(64.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = TargoGold),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            if (isSaving) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(22.dp),
                                    color = Color(0xFF0A0A0A),
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text(
                                    if (isLastStep) "סיום" else "התחל שלב הבא",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF0A0A0A)
                                )
                            }
                        }

                        // Save and go back to list
                        TextButton(
                            onClick = { saveAndGoBack() },
                            enabled = !isSaving,
                            modifier = Modifier.fillMaxWidth().height(52.dp)
                        ) {
                            Text(
                                "חזור לרשימה ושמור",
                                fontSize = 15.sp,
                                color = TargoGold.copy(alpha = 0.8f)
                            )
                        }

                        // Discard and go back to list
                        TextButton(
                            onClick = {
                                showStepModal = false
                                lahavViewModel.resetStep()
                                drillViewModel.resetDrill()
                                onBack()
                            },
                            modifier = Modifier.fillMaxWidth().height(44.dp)
                        ) {
                            Text(
                                "חזור לרשימה ללא שמירה",
                                fontSize = 13.sp,
                                color = Color(0xFF555555)
                            )
                        }
                    }
                }
            }
        }

        // ── Disconnection overlay ────────────────────────────────────
        if (!isSimulator && targetStatus == TargetStatus.DISCONNECTED) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xCC000000)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text("⚠", fontSize = 64.sp)
                    Text(
                        "אין קשר עם המטרה",
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFE63946),
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "האימון מושהה",
                        fontSize = 20.sp,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "ממתין לחיבור מחדש...",
                        fontSize = 16.sp,
                        color = Color(0xFF888888),
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(8.dp))
                    CircularProgressIndicator(color = Color(0xFFE63946), strokeWidth = 3.dp)
                }
            }
        }

        // ── Exit dialog ──────────────────────────────────────────────
        if (showExitDialog) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.85f)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(0.9f),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF141414)),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text("אימון מושהה", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("מה תרצה לעשות?", fontSize = 14.sp, color = Color(0xFF888888))
                        Spacer(Modifier.height(4.dp))

                        Button(
                            onClick = {
                                showExitDialog = false
                                if (wasRunningBeforeDialog) drillViewModel.resumeDrill()
                            },
                            modifier = Modifier.fillMaxWidth().height(64.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = TargoGold),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("המשך אימון", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0A0A0A))
                        }

                        Button(
                            onClick = {
                                showExitDialog = false
                                saveAndGoBack()
                            },
                            enabled = !isSaving,
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0x12FFFFFF)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            if (isSaving) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                            else Text("סיים ושמור", fontSize = 15.sp, color = Color(0xFFCCCCCC))
                        }

                        TextButton(
                            onClick = {
                                showExitDialog = false
                                lahavViewModel.resetStep()
                                drillViewModel.resetDrill()
                                onBack()
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("צא ללא שמירה", fontSize = 15.sp, color = Color(0xFFE63946))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatColumn(
    label: String,
    value: String,
    valueColor: Color = Color.White,
    valueFontSize: Int = 16
) {
    Column(horizontalAlignment = Alignment.Start) {
        Text(label, fontSize = 10.sp, color = Color(0xFF666666), letterSpacing = 1.5.sp)
        Text(value, fontSize = valueFontSize.sp, fontWeight = FontWeight.Bold, color = valueColor)
    }
}

@Composable
private fun SplitStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, fontSize = 10.sp, color = Color(0xFF666666), letterSpacing = 1.sp)
        Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
    }
}

@Composable
private fun ModalStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, fontSize = 11.sp, color = Color(0xFF888888))
        Text(value, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
    }
}

private fun shotScore(shot: ShotData): Int {
    val dx = (shot.x - 0.5f) * 2f
    val dy = (shot.y - 0.5f) * 2f
    val dist = sqrt(dx * dx + dy * dy)
    return (10 - (dist * 10).toInt()).coerceIn(0, 10)
}

private fun groupingText(shots: List<ShotData>, targetType: Int): String {
    if (shots.size < 2) return "—"
    val widthCm  = if (targetType == 1) 50f else 40f
    val heightCm = if (targetType == 1) 80f else 60f
    var maxDist = 0f
    for (i in shots.indices) {
        for (j in i + 1 until shots.size) {
            val dx = (shots[i].x - shots[j].x) * widthCm
            val dy = (shots[i].y - shots[j].y) * heightCm
            val d = sqrt(dx * dx + dy * dy)
            if (d > maxDist) maxDist = d
        }
    }
    return "%.1f cm".format(maxDist)
}

private fun lastSplitText(shots: List<ShotData>, startTimestamp: Long): String {
    if (shots.isEmpty()) return "—"
    val splitMs = if (shots.size == 1) shots[0].timestamp - startTimestamp
    else shots.last().timestamp - shots[shots.size - 2].timestamp
    return "%.2fs".format(splitMs / 1000f)
}

private fun avgSplitText(shots: List<ShotData>, elapsedMs: Long): String {
    if (shots.isEmpty()) return "—"
    return "%.2fs".format(elapsedMs / shots.size / 1000f)
}

private fun formatElapsed(ms: Long): String {
    val totalSec = ms / 1000
    val min = totalSec / 60
    val sec = totalSec % 60
    val centis = (ms % 1000) / 10
    return "%02d:%02d.%02d".format(min, sec, centis)
}
