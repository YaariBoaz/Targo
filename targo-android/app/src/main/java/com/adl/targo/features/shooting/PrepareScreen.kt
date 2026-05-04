package com.adl.targo.features.shooting

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.adl.targo.domain.model.DrillSetup
import com.adl.targo.ui.theme.TargoGold

@Composable
fun PrepareScreen(
    setup: DrillSetup?,
    onBack: () -> Unit,
    onBegin: () -> Unit,
) {
    // If in-memory state was lost (process killed while backgrounded), go back
    LaunchedEffect(setup) {
        if (setup == null) onBack()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Background soldiers image (matches Capacitor app)
        Image(
            painter = painterResource(R.drawable.soldiers),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
        // Light scrim so background image is clearly visible
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.2f))
        )

        // Close button
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
                .size(40.dp)
                .background(Color.White.copy(alpha = 0.1f), CircleShape)
                .clickable { onBack() },
            contentAlignment = Alignment.Center,
        ) {
            Text("✕", color = Color.White, fontSize = 18.sp)
        }

        if (setup == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = TargoGold)
            }
        } else {
            // Center card overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 28.dp),
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(16.dp))
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(
                        text = if (setup.source == "challenge") "CHALLENGE DRILL" else "TRAINING DRILL",
                        fontSize = 11.sp,
                        color = TargoGold,
                        letterSpacing = 2.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = setup.weaponName,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text = "${setup.weaponCategory.uppercase()}  ·  ${setup.distance}m  ·  ${setup.numberOfBullets} bullets",
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.5f),
                        letterSpacing = 0.5.sp,
                    )
                    Spacer(Modifier.height(4.dp))
                    Button(
                        onClick = onBegin,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = TargoGold),
                        shape = RoundedCornerShape(8.dp),
                    ) {
                        Text(
                            "Start Shooting",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF0A0A0A),
                            letterSpacing = 1.sp,
                        )
                    }
                }
            }
        }
    }
}

