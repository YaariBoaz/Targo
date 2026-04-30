package com.adl.targo.features.drill.countdown

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.adl.targo.features.drill.DrillViewModel
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.TargoGold
import kotlinx.coroutines.delay

@Composable
fun DrillCountdownScreen(
    drillViewModel: DrillViewModel,
    onCountdownFinished: () -> Unit
) {
    var count by remember { mutableIntStateOf(3) }

    LaunchedEffect(Unit) {
        while (count > 0) {
            delay(1000L)
            count--
        }
        delay(600L)
        drillViewModel.startDrill()
        onCountdownFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandDark),
        contentAlignment = Alignment.Center
    ) {
        AnimatedContent(
            targetState = count,
            transitionSpec = {
                (scaleIn(tween(300), initialScale = 0.6f) + fadeIn(tween(300)))
                    .togetherWith(scaleOut(tween(200), targetScale = 1.4f) + fadeOut(tween(200)))
            },
            label = "countdown"
        ) { target ->
            if (target > 0) {
                Text(
                    text = target.toString(),
                    fontSize = 160.sp,
                    fontWeight = FontWeight.Bold,
                    color = TargoGold
                )
            } else {
                Text(
                    text = "FIRE!",
                    fontSize = 72.sp,
                    fontWeight = FontWeight.Bold,
                    color = TargoGold,
                    letterSpacing = 8.sp
                )
            }
        }
    }
}
