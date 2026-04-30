package com.adl.targo.features.drill.prepare

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.adl.targo.features.drill.DrillViewModel
import com.adl.targo.features.lahav.LahavViewModel
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.TargoGold

@Composable
fun DrillPrepareScreen(
    drillViewModel: DrillViewModel,
    lahavViewModel: LahavViewModel,
    onBack: () -> Unit,
    onBegin: () -> Unit
) {
    val session by lahavViewModel.activeSession.collectAsState()
    val currentStep by lahavViewModel.currentStep.collectAsState()
    val totalSteps by lahavViewModel.totalSteps.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF1C1C2E), BrandDark)
                )
            )
    ) {
        // X close button — top end
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
                .size(40.dp)
                .background(Color.White.copy(alpha = 0.1f), shape = CircleShape)
                .clickable { onBack() },
            contentAlignment = Alignment.Center
        ) {
            Text("✕", color = Color.White, fontSize = 18.sp)
        }

        // Center content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "שלב ${currentStep + 1} / $totalSteps",
                fontSize = 14.sp,
                color = Color(0xFFAAAAAA),
                letterSpacing = 1.sp
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = session?.drillType ?: "",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(16.dp))
            Text(
                text = "מוכן לירות?",
                fontSize = 22.sp,
                fontWeight = FontWeight.Medium,
                color = TargoGold,
                textAlign = TextAlign.Center
            )
        }

        // Begin button — bottom center
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(horizontal = 32.dp, vertical = 48.dp)
        ) {
            Button(
                onClick = onBegin,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = TargoGold),
                shape = MaterialTheme.shapes.medium
            ) {
                Text(
                    "התחל לירות",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF0A0A0A)
                )
            }
        }
    }
}
