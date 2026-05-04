package com.adl.targo.features.shooter

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.adl.targo.data.connection.WifiStatus
import com.adl.targo.domain.model.LahavShooter
import com.adl.targo.features.drill.DrillViewModel
import com.adl.targo.features.lahav.LahavViewModel
import com.adl.targo.features.settings.SettingsModal
import com.adl.targo.features.settings.SettingsViewModel
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.BrandSuccessGreen
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold

@Composable
fun ShooterSelectorScreen(
    lahavViewModel: LahavViewModel,
    drillViewModel: DrillViewModel,
    settingsViewModel: SettingsViewModel,
    onBack: () -> Unit,
    onConfirm: () -> Unit
) {
    val session by lahavViewModel.activeSession.collectAsState()
    val progressMap by lahavViewModel.shooterProgressMap.collectAsState()
    val totalSteps by lahavViewModel.totalSteps.collectAsState()
    val isSimulator by drillViewModel.isSimulatorMode.collectAsState()
    val wifiStatus by drillViewModel.wifiStatus.collectAsState()
    val cameraNumber by settingsViewModel.cameraNumber.collectAsState()
    val wifiSsid by settingsViewModel.wifiSsid.collectAsState()
    var showSettings by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { drillViewModel.refreshWifiStatus() }

    LaunchedEffect(Unit) {
        lahavViewModel.refreshProgressMap()
        drillViewModel.startUdpListening()
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            permissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        } else {
            drillViewModel.refreshWifiStatus()
        }
    }

    val isWifiOk = wifiStatus == WifiStatus.CONNECTED_TO_TARGO || isSimulator

    Box(modifier = Modifier.fillMaxSize()) {
    Column(modifier = Modifier.fillMaxSize().background(BrandDark)) {

        // Session banner
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(BrandSurface)
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = onBack, contentPadding = PaddingValues(0.dp)) {
                    Text("→ חזור", color = TargoGold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }

                Text(
                    text = session?.drillType ?: "",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = TargoGold,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center
                )

                // SIM toggle
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = if (isSimulator) Color(0xFFFF9800) else Color(0xFF2A2A2A),
                    modifier = Modifier.clickable { drillViewModel.toggleSimulatorMode() }
                ) {
                    Text(
                        text = "SIM",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSimulator) Color.Black else Color(0xFF555555)
                    )
                }

                Spacer(Modifier.width(8.dp))

                // Settings gear icon
                Text(
                    text = "⚙",
                    fontSize = 20.sp,
                    color = Color(0xFF888888),
                    modifier = Modifier
                        .clickable { showSettings = true }
                        .padding(4.dp)
                )
            }
            if (session?.instructorName?.isNotEmpty() == true) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "מדריך: ${session?.instructorName}  •  נתיב ${session?.lane}",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.White
                )
            }
            session?.let { s ->
                val completedCount = s.shooters.count { ref ->
                    (progressMap[ref.id] ?: 0) >= totalSteps
                }
                Spacer(Modifier.height(10.dp))
                val progress = if (s.shooters.isNotEmpty()) completedCount.toFloat() / s.shooters.size else 0f
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth().height(4.dp),
                    color = TargoGold,
                    trackColor = Color(0xFF2A2A2A)
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "$completedCount / ${s.shooters.size} הושלמו",
                    fontSize = 12.sp,
                    color = Color(0xFF888888)
                )
            }
        }

        // WiFi status banner
        if (!isSimulator) {
            val (bannerColor, bannerText) = when (wifiStatus) {
                WifiStatus.CONNECTED_TO_TARGO -> Color(0xFF1A3A1A) to "● מחובר לרשת $wifiSsid"
                WifiStatus.WRONG_NETWORK      -> Color(0xFF3A1A1A) to "● רשת שגויה — התחבר לרשת $wifiSsid"
                WifiStatus.DISCONNECTED       -> Color(0xFF3A1A1A) to "● לא מחובר לרשת WiFi"
            }
            val textColor = if (wifiStatus == WifiStatus.CONNECTED_TO_TARGO) BrandSuccessGreen
                            else Color(0xFFE63946)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(bannerColor)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(bannerText, fontSize = 13.sp, color = textColor, fontWeight = FontWeight.Medium)
            }
        }

        // Shooters list
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            val shooters = session?.shooters ?: emptyList()
            items(shooters, key = { it.id }) { ref ->
                val steps = progressMap[ref.id] ?: 0
                val isCompleted = steps >= totalSteps

                ListItem(
                    headlineContent = {
                        Text(
                            text = ref.name,
                            fontWeight = FontWeight.Medium,
                            color = if (isCompleted) Color(0xFF666666) else Color.White
                        )
                    },
                    supportingContent = {
                        Column {
                            Text(
                                text = "ת.ז: ${ref.id}",
                                fontSize = 12.sp,
                                color = Color(0xFF888888)
                            )
                            Text(
                                text = "$steps / $totalSteps שלבים",
                                fontSize = 12.sp,
                                color = if (isCompleted) Color(0xFF555555) else Color(0xFFAAAAAA)
                            )
                        }
                    },
                    trailingContent = {
                        if (isCompleted) {
                            Surface(
                                shape = MaterialTheme.shapes.small,
                                color = Color(0xFF0D2A1A)
                            ) {
                                Text(
                                    "✓ הושלם",
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    fontSize = 12.sp,
                                    color = BrandSuccessGreen
                                )
                            }
                        } else {
                            Text("←", color = TargoGold, fontSize = 18.sp)
                        }
                    },
                    colors = ListItemDefaults.colors(containerColor = BrandSurface),
                    modifier = Modifier
                        .padding(horizontal = 16.dp, vertical = 5.dp)
                        .clip(MaterialTheme.shapes.medium)
                        .alpha(if (isCompleted) 0.5f else if (!isWifiOk) 0.4f else 1f)
                        .then(
                            if (!isCompleted && isWifiOk) Modifier.clickable {
                                val shooter = LahavShooter(ref.id, ref.name, ref.email)
                                lahavViewModel.selectShooter(shooter)
                                drillViewModel.setup(shooter.name, session?.bulletsPerStep ?: 20)
                                onConfirm()
                            } else Modifier
                        )
                )
                HorizontalDivider(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    color = Color(0xFF1E1E1E)
                )
            }
        }
    }

    if (showSettings) {
        SettingsModal(
            currentCameraNumber = cameraNumber,
            currentWifiSsid = wifiSsid,
            onSave = { number, ssid ->
                settingsViewModel.saveCameraNumber(number)
                settingsViewModel.saveWifiSsid(ssid)
                showSettings = false
            },
            onDismiss = { showSettings = false }
        )
    }
    } // Box
}
