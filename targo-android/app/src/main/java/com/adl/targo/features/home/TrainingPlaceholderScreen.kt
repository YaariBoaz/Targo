package com.adl.targo.features.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.TargoGold

@Composable
fun TrainingPlaceholderScreen(onStartDrill: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0D0D), BrandDark))),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("TRAINING", fontSize = 28.sp, fontWeight = FontWeight.Black, color = TargoGold, letterSpacing = 4.sp)
            Text("Coming soon", fontSize = 14.sp, color = Color.White.copy(alpha = 0.4f))
        }
    }
}

@Composable
fun ChallengesPlaceholderScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0D0D), BrandDark))),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("CHALLENGES", fontSize = 28.sp, fontWeight = FontWeight.Black, color = TargoGold, letterSpacing = 4.sp)
            Text("Coming soon", fontSize = 14.sp, color = Color.White.copy(alpha = 0.4f))
        }
    }
}

@Composable
fun StatisticsPlaceholderScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0D0D), BrandDark))),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("STATISTICS", fontSize = 28.sp, fontWeight = FontWeight.Black, color = TargoGold, letterSpacing = 4.sp)
            Text("Coming soon", fontSize = 14.sp, color = Color.White.copy(alpha = 0.4f))
        }
    }
}
