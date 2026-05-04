package com.adl.targo.features.wifi

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.HourglassEmpty
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.adl.targo.data.connection.TargetStatus
import com.adl.targo.ui.theme.TargoGold

@Composable
fun WifiConnectionScreen(
    onBack: () -> Unit,
    onContinue: () -> Unit,
    viewModel: WifiConnectionViewModel = hiltViewModel(),
) {
    val currentSsid by viewModel.currentSsid.collectAsState()
    val targetStatus by viewModel.targetStatus.collectAsState()
    val savedCameraNumber by viewModel.cameraNumber.collectAsState()

    // Local editable fields — seeded from live values once available
    var ssidInput by remember { mutableStateOf("") }
    var laneInput by remember { mutableStateOf("") }
    // Track the last "confirmed" WiFi name so we know when user has changed it
    var confirmedSsid by remember { mutableStateOf("") }
    val ssidChanged = ssidInput.isNotBlank() && ssidInput != confirmedSsid

    // Auto-fill WiFi name from system the first time it arrives
    LaunchedEffect(currentSsid) {
        if (ssidInput.isEmpty() && currentSsid.isNotEmpty()) {
            ssidInput = currentSsid
            confirmedSsid = currentSsid
        }
    }

    // Pre-fill saved lane number
    LaunchedEffect(savedCameraNumber) {
        if (laneInput.isEmpty() && savedCameraNumber > 0) {
            laneInput = savedCameraNumber.toString()
        }
    }

    val context = LocalContext.current
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ ->
        // Whether granted or denied, re-check WiFi — system will return what it can
        viewModel.onEnter()
    }
    LaunchedEffect(Unit) {
        val alreadyGranted = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        if (alreadyGranted) {
            viewModel.onEnter()
        } else {
            permissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    val laneNumber = laneInput.toIntOrNull() ?: 0
    val wifiNameMatches = ssidInput.isNotBlank() && !ssidChanged &&
            (currentSsid.isEmpty() || ssidInput == currentSsid)
    val canContinue = wifiNameMatches && laneNumber > 0 &&
            targetStatus == TargetStatus.CONNECTED

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0E0E0E))
            .statusBarsPadding()
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // Top bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp, bottom = 32.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = {
                viewModel.onBack()
                onBack()
            }) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White,
                )
            }
            Spacer(Modifier.weight(1f))
            Text(
                "Connect to Target",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
            )
            Spacer(Modifier.weight(1f))
            // Balance the back button
            Spacer(Modifier.size(48.dp))
        }

        Icon(
            Icons.Filled.Wifi,
            contentDescription = null,
            tint = if (ssidInput.isNotBlank()) TargoGold else Color(0xFF6B7280),
            modifier = Modifier.size(64.dp),
        )

        Spacer(Modifier.height(32.dp))

        // WiFi name field
        Text(
            "WiFi Network Name",
            fontSize = 13.sp,
            color = Color.White.copy(alpha = 0.5f),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
        )
        OutlinedTextField(
            value = ssidInput,
            onValueChange = { ssidInput = it },
            placeholder = { Text("e.g. ADL-Range-5", color = Color(0xFF555555)) },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = TargoGold,
                unfocusedBorderColor = Color(0xFF333333),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                cursorColor = TargoGold,
            ),
            modifier = Modifier.fillMaxWidth(),
        )

        if (ssidChanged) {
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    confirmedSsid = ssidInput
                    viewModel.updateWifiName(ssidInput.trim())
                },
                modifier = Modifier.fillMaxWidth().height(44.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2A2A2A)),
            ) {
                Text(
                    "Update & Check Connection",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TargoGold,
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        // Lane number field
        Text(
            "Lane / Target Number",
            fontSize = 13.sp,
            color = Color.White.copy(alpha = 0.5f),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
        )
        OutlinedTextField(
            value = laneInput,
            onValueChange = { value ->
                if (value.all { it.isDigit() } && value.length <= 3) laneInput = value
            },
            placeholder = { Text("e.g. 3", color = Color(0xFF555555)) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = TargoGold,
                unfocusedBorderColor = Color(0xFF333333),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                cursorColor = TargoGold,
            ),
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(Modifier.height(24.dp))

        // ── Checklist ────────────────────────────────────────────────────────
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                // Step 1 — WiFi name
                // Green only when filled, not changed, AND phone is on that exact network
                val wifiStepState = when {
                    ssidInput.isBlank()                                    -> CheckState.PENDING
                    ssidChanged                                            -> CheckState.WARNING
                    currentSsid.isNotEmpty() && ssidInput != currentSsid  -> CheckState.ERROR
                    else                                                   -> CheckState.DONE
                }
                ChecklistItem(
                    state = wifiStepState,
                    title = "WiFi network name",
                    subtitle = when (wifiStepState) {
                        CheckState.DONE    -> "Phone is connected to \"$ssidInput\""
                        CheckState.WARNING -> "Tap \"Update & Check Connection\" to apply"
                        CheckState.ERROR   -> "Phone is on \"$currentSsid\" — connect to \"$ssidInput\" first"
                        CheckState.PENDING -> "Enter the WiFi name shown at the range"
                        CheckState.WAITING -> ""
                    },
                )

                // Step 2 — Lane number
                val laneStepState = if (laneNumber > 0) CheckState.DONE else CheckState.PENDING
                ChecklistItem(
                    state = laneStepState,
                    title = "Lane / target number",
                    subtitle = if (laneStepState == CheckState.DONE) "Lane $laneNumber selected"
                               else "Enter the number on your target lane",
                )

                // Step 3 — Target connection
                val targetStepState = when (targetStatus) {
                    TargetStatus.CONNECTED    -> CheckState.DONE
                    TargetStatus.UNKNOWN      -> CheckState.WAITING
                    TargetStatus.DISCONNECTED -> CheckState.ERROR
                }
                ChecklistItem(
                    state = targetStepState,
                    title = "Target connection",
                    subtitle = when (targetStatus) {
                        TargetStatus.CONNECTED    -> "Target is responding"
                        TargetStatus.UNKNOWN      -> "Waiting for target signal…"
                        TargetStatus.DISCONNECTED -> "No signal — check WiFi and make sure the target is powered on"
                    },
                )
            }
        }

        Spacer(Modifier.weight(1f))

        // Continue button
        Button(
            onClick = {
                viewModel.onConfirm(ssidInput.trim(), laneNumber)
                onContinue()
            },
            enabled = canContinue,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = TargoGold,
                disabledContainerColor = Color(0xFF2A2A2A),
            ),
        ) {
            Text(
                "CONTINUE",
                fontSize = 15.sp,
                fontWeight = FontWeight.Black,
                color = if (canContinue) Color.Black else Color(0xFF555555),
                letterSpacing = 1.sp,
            )
        }

        Spacer(Modifier.height(12.dp))

        TextButton(
            onClick = {
                viewModel.onBack()
                onContinue()
            },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                "Skip — Demo Mode",
                fontSize = 13.sp,
                color = Color.White.copy(alpha = 0.4f),
            )
        }

        Spacer(Modifier.height(24.dp))
    }
}

// ── Checklist helpers ─────────────────────────────────────────────────────────

private enum class CheckState { DONE, WARNING, WAITING, PENDING, ERROR }

@Composable
private fun ChecklistItem(
    state: CheckState,
    title: String,
    subtitle: String,
) {
    val (icon, iconColor) = when (state) {
        CheckState.DONE    -> Icons.Filled.CheckCircle          to Color(0xFF10B981)
        CheckState.WARNING -> Icons.Filled.Warning              to Color(0xFFF59E0B)
        CheckState.WAITING -> Icons.Filled.HourglassEmpty       to Color(0xFF6B7280)
        CheckState.PENDING -> Icons.Filled.RadioButtonUnchecked to Color(0xFF444444)
        CheckState.ERROR   -> Icons.Filled.Warning              to Color(0xFFEF4444)
    }
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = iconColor,
            modifier = Modifier.size(20.dp).padding(top = 1.dp),
        )
        Column {
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = when (state) {
                    CheckState.PENDING -> Color.White.copy(alpha = 0.4f)
                    CheckState.ERROR   -> Color(0xFFEF4444)
                    else               -> Color.White
                },
            )
            if (subtitle.isNotEmpty()) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = when (state) {
                        CheckState.DONE    -> Color(0xFF10B981)
                        CheckState.WARNING -> Color(0xFFF59E0B)
                        CheckState.WAITING -> Color(0xFF6B7280)
                        CheckState.PENDING -> Color(0xFF555555)
                        CheckState.ERROR   -> Color(0xFFEF4444)
                    },
                    lineHeight = 17.sp,
                )
            }
        }
    }
}
