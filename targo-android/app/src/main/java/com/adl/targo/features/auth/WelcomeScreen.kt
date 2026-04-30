package com.adl.targo.features.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold

@Composable
fun WelcomeScreen(
    onLoginClick: () -> Unit,
    onRegisterClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF0D0D0D), BrandDark)
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            Spacer(modifier = Modifier.height(64.dp))

            // Crosshair icon drawn with Canvas
            CrosshairIcon(
                modifier = Modifier.size(120.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "TARGO",
                fontSize = 48.sp,
                fontWeight = FontWeight.Black,
                color = TargoGold,
                letterSpacing = 8.sp,
            )

            Text(
                text = "TACTICAL SHOOTING TRAINER",
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White.copy(alpha = 0.6f),
                letterSpacing = 3.sp,
                textAlign = TextAlign.Center,
            )

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = onLoginClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TargoGold,
                    contentColor = BrandDark,
                ),
            ) {
                Text(
                    text = "LOGIN",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    letterSpacing = 2.sp,
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            HorizontalDividerWithText(text = "OR")

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedButton(
                onClick = onRegisterClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = TargoGold,
                ),
                border = androidx.compose.foundation.BorderStroke(1.dp, TargoGold),
            ) {
                Text(
                    text = "REGISTER",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    letterSpacing = 2.sp,
                )
            }

            Spacer(modifier = Modifier.height(64.dp))
        }
    }
}

@Composable
private fun CrosshairIcon(modifier: Modifier = Modifier) {
    val gold = TargoGold
    val white = Color.White

    Box(
        modifier = modifier.drawBehind {
            val cx = size.width / 2f
            val cy = size.height / 2f
            val outerR = size.minDimension * 0.40f
            val innerR = size.minDimension * 0.15f
            val lineGap = size.minDimension * 0.12f
            val lineLen = size.minDimension * 0.14f
            val strokeW = size.minDimension * 0.025f

            // Outer circle (white, broken into 4 arcs)
            drawArc(
                color = white,
                startAngle = 10f, sweepAngle = 70f, useCenter = false,
                topLeft = Offset(cx - outerR, cy - outerR),
                size = androidx.compose.ui.geometry.Size(outerR * 2, outerR * 2),
                style = Stroke(strokeW, cap = StrokeCap.Round)
            )
            drawArc(
                color = white,
                startAngle = 100f, sweepAngle = 70f, useCenter = false,
                topLeft = Offset(cx - outerR, cy - outerR),
                size = androidx.compose.ui.geometry.Size(outerR * 2, outerR * 2),
                style = Stroke(strokeW, cap = StrokeCap.Round)
            )
            drawArc(
                color = white,
                startAngle = 190f, sweepAngle = 70f, useCenter = false,
                topLeft = Offset(cx - outerR, cy - outerR),
                size = androidx.compose.ui.geometry.Size(outerR * 2, outerR * 2),
                style = Stroke(strokeW, cap = StrokeCap.Round)
            )
            drawArc(
                color = white,
                startAngle = 280f, sweepAngle = 70f, useCenter = false,
                topLeft = Offset(cx - outerR, cy - outerR),
                size = androidx.compose.ui.geometry.Size(outerR * 2, outerR * 2),
                style = Stroke(strokeW, cap = StrokeCap.Round)
            )

            // Center gold circle
            drawCircle(
                color = gold,
                radius = innerR,
                center = Offset(cx, cy),
                style = Stroke(strokeW, cap = StrokeCap.Round)
            )

            // Crosshair lines
            drawLine(white, Offset(cx, cy - outerR - lineLen), Offset(cx, cy - outerR + lineGap * 0.3f), strokeW, StrokeCap.Round)
            drawLine(white, Offset(cx, cy + outerR - lineGap * 0.3f), Offset(cx, cy + outerR + lineLen), strokeW, StrokeCap.Round)
            drawLine(white, Offset(cx - outerR - lineLen, cy), Offset(cx - outerR + lineGap * 0.3f, cy), strokeW, StrokeCap.Round)
            drawLine(white, Offset(cx + outerR - lineGap * 0.3f, cy), Offset(cx + outerR + lineLen, cy), strokeW, StrokeCap.Round)
        }
    )
}

@Composable
private fun HorizontalDividerWithText(text: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        HorizontalDivider(modifier = Modifier.weight(1f), color = Color.White.copy(alpha = 0.2f))
        Text(text = text, color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp)
        HorizontalDivider(modifier = Modifier.weight(1f), color = Color.White.copy(alpha = 0.2f))
    }
}
