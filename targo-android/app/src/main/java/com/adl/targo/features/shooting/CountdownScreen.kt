package com.adl.targo.features.shooting

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.adl.targo.R
import com.adl.targo.ui.theme.TargoGold
import kotlinx.coroutines.delay

@Composable
fun CountdownScreen(onReady: () -> Unit) {
    var count by remember { mutableIntStateOf(3) }

    LaunchedEffect(Unit) {
        while (count > 0) {
            delay(1000L)
            count--
        }
        delay(700L)
        onReady()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Target image background
        Image(
            painter = painterResource(R.drawable.target_8050),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.FillBounds,
        )
        // Dark scrim
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.55f))
        )

        // Countdown number centered
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            AnimatedContent(
                targetState = count,
                transitionSpec = {
                    (scaleIn(tween(300), initialScale = 0.5f) + fadeIn(tween(300)))
                        .togetherWith(scaleOut(tween(200), targetScale = 1.5f) + fadeOut(tween(200)))
                },
                label = "countdown",
            ) { target ->
                if (target > 0) {
                    Text(
                        text = target.toString(),
                        fontSize = 160.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White.copy(alpha = 0.9f),
                    )
                } else {
                    Text(
                        text = "GO!",
                        fontSize = 96.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF4CAF50),
                        letterSpacing = 4.sp,
                    )
                }
            }
        }

        // Bottom stats bar
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(Color(0xFF1A1A1A)),
            contentAlignment = Alignment.Center,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                CountdownStatCell(label = "Shots", value = "0")
                StatDivider()
                CountdownStatCell(label = "Avg Split", value = "0.00s")
                StatDivider()
                CountdownStatCell(label = "Avg Dist", value = "0cm")
                StatDivider()
                CountdownStatCell(label = "Total Time", value = "00:00")
            }
        }
    }
}

@Composable
private fun CountdownStatCell(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text(label, fontSize = 9.sp, color = Color.White.copy(alpha = 0.4f))
    }
}

@Composable
private fun StatDivider() {
    Box(
        modifier = Modifier
            .width(1.dp)
            .height(24.dp)
            .background(Color.White.copy(alpha = 0.15f))
    )
}
