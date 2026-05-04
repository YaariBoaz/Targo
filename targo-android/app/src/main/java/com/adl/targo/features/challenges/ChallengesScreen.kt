package com.adl.targo.features.challenges

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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.adl.targo.domain.model.Challenge
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.TargoGold

private fun resolveImageUrl(imageUrl: String): String {
    if (imageUrl.isBlank()) return ""
    if (imageUrl.contains("/challenges/")) {
        val fileName = imageUrl.substringAfterLast("/")
        return "file:///android_asset/challenges/$fileName"
    }
    if (imageUrl.startsWith("http")) return imageUrl
    return ""
}

private fun difficultyColor(difficulty: String): Color = when (difficulty.lowercase()) {
    "easy"   -> Color(0xFF4CAF50)
    "medium" -> Color(0xFFFF9800)
    "hard"   -> Color(0xFFf44336)
    else     -> Color.White
}

@Composable
fun ChallengesScreen(
    onChallengeClick: (Challenge) -> Unit,
    viewModel: ChallengesViewModel = hiltViewModel(),
) {
    val challenges by viewModel.challenges.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0a0a0a), Color(0xFF1a1a1a)))),
    ) {
        // Title bar
        Text(
            text = "CHALLENGES",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
            color = Color.White,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp),
        )

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = TargoGold)
            }
            return@Column
        }

        if (challenges.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No challenges available yet.", color = Color.White.copy(alpha = 0.5f))
            }
            return@Column
        }

        val sorted = remember(challenges) {
            val started = challenges.filter { it.completedDrills > 0 }
                .sortedByDescending { it.completedDrills }
            val unstarted = challenges.filter { it.completedDrills == 0 }
            started + unstarted
        }

        LazyColumn(
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            items(sorted) { challenge ->
                ChallengeCard(challenge = challenge, onClick = { onChallengeClick(challenge) })
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun ChallengeCard(challenge: Challenge, onClick: () -> Unit) {
    val context = LocalContext.current
    val resolvedUrl = resolveImageUrl(challenge.imageUrl)
    val progress = if (challenge.drillsCount > 0)
        challenge.completedDrills.toFloat() / challenge.drillsCount else 0f

    val buttonLabel = when {
        challenge.completedDrills >= challenge.drillsCount && challenge.drillsCount > 0 -> "COMPLETED"
        challenge.completedDrills > 0 -> "CONTINUE"
        else -> "START"
    }
    val isCompleted = buttonLabel == "COMPLETED"

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(2.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF202020)),
    ) {
        Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
            // Image — 140dp wide, fills card height
            Box(modifier = Modifier.width(140.dp).fillMaxHeight()) {
                if (resolvedUrl.isNotBlank()) {
                    AsyncImage(
                        model = ImageRequest.Builder(context).data(resolvedUrl).crossfade(true).build(),
                        contentDescription = challenge.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop,
                    )
                } else {
                    Box(modifier = Modifier.fillMaxSize().background(Color.White.copy(alpha = 0.05f)))
                }
            }

            // Details
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 0.dp, top = 12.dp, end = 12.dp, bottom = 12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = challenge.title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    lineHeight = 20.sp,
                )

                Row {
                    Text("Difficulty: ", fontSize = 13.sp, color = Color.White.copy(alpha = 0.7f), fontWeight = FontWeight.SemiBold)
                    Text(
                        text = challenge.difficulty.uppercase(),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = difficultyColor(challenge.difficulty),
                    )
                }

                if (challenge.description.isNotBlank()) {
                    Text(
                        text = challenge.description,
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.6f),
                        lineHeight = 20.sp,
                        maxLines = 3,
                    )
                }

                Spacer(Modifier.height(4.dp))

                // Progress
                if (challenge.drillsCount > 0) {
                    Text(
                        text = "${challenge.completedDrills} / ${challenge.drillsCount} drills",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White.copy(alpha = 0.6f),
                    )
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier.fillMaxWidth().height(3.dp).padding(top = 2.dp),
                        color = TargoGold,
                        trackColor = Color.White.copy(alpha = 0.1f),
                    )
                }

                Spacer(Modifier.height(6.dp))

                Button(
                    onClick = onClick,
                    modifier = Modifier.fillMaxWidth().height(34.dp),
                    shape = RoundedCornerShape(6.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isCompleted) Color.White.copy(alpha = 0.1f) else TargoGold,
                        contentColor = if (isCompleted) Color.White.copy(alpha = 0.5f) else Color.Black,
                    ),
                    enabled = !isCompleted,
                    contentPadding = PaddingValues(0.dp),
                ) {
                    Text(buttonLabel, fontWeight = FontWeight.Bold, fontSize = 12.sp, letterSpacing = 1.sp)
                }
            }
        }
    }
}
