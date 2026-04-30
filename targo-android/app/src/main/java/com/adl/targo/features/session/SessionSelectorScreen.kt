package com.adl.targo.features.session

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.adl.targo.domain.model.LahavSession
import com.adl.targo.domain.model.LahavShooterRef
import com.adl.targo.features.lahav.LahavViewModel
import com.adl.targo.features.settings.SettingsModal
import com.adl.targo.features.settings.SettingsViewModel
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.BrandSuccessGreen
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold

@Composable
fun SessionSelectorScreen(
    lahavViewModel: LahavViewModel,
    settingsViewModel: SettingsViewModel,
    onSessionSelected: () -> Unit
) {
    val sessions by lahavViewModel.sessions.collectAsState()
    val isLoading by lahavViewModel.isLoading.collectAsState()
    val cameraNumber by settingsViewModel.cameraNumber.collectAsState()
    val wifiSsid by settingsViewModel.wifiSsid.collectAsState()
    var showSettings by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
    Column(modifier = Modifier.fillMaxSize().background(BrandDark)) {
        // Title bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(BrandSurface)
                .padding(horizontal = 16.dp, vertical = 20.dp)
        ) {


            Text(
                text = "אימונים פעילים",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = TargoGold,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            Text(
                text = "⚙",
                fontSize = 22.sp,
                color = Color(0xFF888888),
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .clickable { showSettings = true }
                    .padding(4.dp)
            )
        }

        when {
            isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = TargoGold)
            }
            sessions.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("אין אימונים זמינים", color = Color(0xFF888888), fontSize = 16.sp)
            }
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(sessions, key = { it.sessionId }) { session ->
                    SessionCard(session = session, onClick = {
                        lahavViewModel.selectSession(session)
                        onSessionSelected()
                    })
                }
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

@Composable
private fun SessionCard(session: LahavSession, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = BrandSurface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = session.drillType,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            if (session.instructorName.isNotEmpty()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "מדריך: ${session.instructorName}  •  נתיב ${session.lane}",
                    fontSize = 13.sp,
                    color = Color(0xFFAAAAAA)
                )
            }
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                InfoChip("${session.totalSteps} שלבים")
                InfoChip("${session.shooters.size} מתאמנים")
                if (session.completedTurns.isNotEmpty()) {
                    InfoChip(
                        text = "✓ ${session.completedTurns.size} הושלמו",
                        textColor = BrandSuccessGreen,
                        bgColor = Color(0xFF0D2A1A)
                    )
                }
            }
        }
    }
}

@Composable
private fun InfoChip(
    text: String,
    textColor: Color = Color(0xFFAAAAAA),
    bgColor: Color = Color(0xFF2A2A2A)
) {
    Surface(shape = MaterialTheme.shapes.small, color = bgColor) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            fontSize = 12.sp,
            color = textColor
        )
    }
}
