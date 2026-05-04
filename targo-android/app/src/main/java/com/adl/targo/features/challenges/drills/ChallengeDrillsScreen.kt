package com.adl.targo.features.challenges.drills

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarOutline
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
import com.adl.targo.domain.model.ChallengeDrill
import com.adl.targo.domain.model.DrillStatus
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

@Composable
fun ChallengeDrillsScreen(
    challenge: Challenge,
    onBack: () -> Unit,
    onStartDrill: () -> Unit,
    viewModel: ChallengeDrillsViewModel = hiltViewModel(),
) {
    LaunchedEffect(challenge.id) {
        viewModel.setChallenge(challenge)
        viewModel.load(challenge.id)
    }

    val drills by viewModel.drills.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val drillStartResult by viewModel.drillStartResult.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(drillStartResult) {
        when (val result = drillStartResult) {
            is DrillStartResult.Success -> {
                viewModel.clearDrillResult()
                onStartDrill()
            }
            is DrillStartResult.Error -> {
                snackbarHostState.showSnackbar(result.message)
                viewModel.clearDrillResult()
            }
            null -> {}
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = Color(0xFF0a0a0a),
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Brush.verticalGradient(listOf(Color(0xFF0a0a0a), Color(0xFF1a1a1a)))),
        ) {
            ChallengeDrillsHeader(
                title = challenge.title,
                drillsCount = challenge.drillsCount,
                onBack = onBack,
            )

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = TargoGold)
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    itemsIndexed(drills) { _, drill ->
                        DrillCard(
                            drill = drill,
                            onClick = { viewModel.onDrillClick(drill, challenge.id) },
                        )
                    }
                    item { Spacer(Modifier.height(16.dp)) }
                }
            }
        }
    }
}

@Composable
private fun ChallengeDrillsHeader(title: String, drillsCount: Int, onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(listOf(Color(0xFF0a0a0a), Color(0xFF0a0a0a).copy(alpha = 0f)))
            )
            .padding(horizontal = 20.dp, vertical = 16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack, modifier = Modifier.size(36.dp)) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
            }
            Spacer(Modifier.width(4.dp))
            Text("BACK", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color.White, letterSpacing = 1.sp)
        }
        Spacer(Modifier.height(8.dp))
        Text(
            text = title.uppercase(),
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            letterSpacing = 1.sp,
        )
        Text(
            text = "Complete $drillsCount drills to earn the badge",
            fontSize = 12.sp,
            color = Color.White.copy(alpha = 0.5f),
            modifier = Modifier.padding(top = 2.dp),
        )
    }
}

@Composable
private fun DrillCard(drill: ChallengeDrill, onClick: () -> Unit) {
    val context = LocalContext.current
    val resolvedUrl = resolveImageUrl(drill.imageUrl)
    val isLocked = drill.status == DrillStatus.LOCKED
    val isCompleted = drill.status == DrillStatus.COMPLETED

    Card(
        modifier = Modifier.fillMaxWidth().clickable(enabled = !isLocked) { onClick() },
        shape = RoundedCornerShape(2.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isLocked) Color(0xFF181818) else Color(0xFF202020)
        ),
    ) {
        Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
            // Image with overlays
            Box(modifier = Modifier.width(120.dp).fillMaxHeight()) {
                if (resolvedUrl.isNotBlank()) {
                    AsyncImage(
                        model = ImageRequest.Builder(context).data(resolvedUrl).crossfade(true).build(),
                        contentDescription = drill.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop,
                        alpha = if (isLocked) 0.4f else 1f,
                    )
                } else {
                    Box(modifier = Modifier.fillMaxSize().background(Color.White.copy(alpha = 0.05f)))
                }
                // Lock overlay
                if (isLocked) {
                    Box(
                        modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.5f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Filled.Lock, contentDescription = "Locked",
                            tint = Color.White.copy(alpha = 0.7f), modifier = Modifier.size(28.dp))
                    }
                }
                // Stars overlay for completed
                if (isCompleted && drill.bestStars > 0) {
                    Row(
                        modifier = Modifier.align(Alignment.TopEnd).padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(1.dp),
                    ) {
                        repeat(3) { i ->
                            Icon(
                                imageVector = if (i < drill.bestStars) Icons.Filled.Star else Icons.Outlined.StarOutline,
                                contentDescription = null,
                                tint = TargoGold,
                                modifier = Modifier.size(14.dp),
                            )
                        }
                    }
                }
            }

            // Details
            Column(
                modifier = Modifier.weight(1f).padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = "DRILL ${drill.order}",
                    fontSize = 10.sp,
                    color = TargoGold.copy(alpha = 0.8f),
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.sp,
                )
                Text(
                    text = drill.title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isLocked) Color.White.copy(alpha = 0.4f) else Color.White,
                )
                if (drill.description.isNotBlank()) {
                    Text(
                        text = drill.description,
                        fontSize = 11.sp,
                        color = Color.White.copy(alpha = 0.5f),
                        lineHeight = 15.sp,
                        maxLines = 2,
                    )
                }
                if (isCompleted && drill.bestScore > 0) {
                    Text(
                        text = "Score: ${drill.bestScore}",
                        fontSize = 11.sp,
                        color = TargoGold,
                        fontWeight = FontWeight.SemiBold,
                    )
                }

                Spacer(Modifier.height(4.dp))

                val btnLabel = when (drill.status) {
                    DrillStatus.LOCKED -> "LOCKED"
                    DrillStatus.COMPLETED -> "REPLAY"
                    DrillStatus.AVAILABLE -> "LET'S GO"
                }
                Button(
                    onClick = onClick,
                    enabled = !isLocked,
                    modifier = Modifier.fillMaxWidth().height(32.dp),
                    shape = RoundedCornerShape(6.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = when (drill.status) {
                            DrillStatus.LOCKED -> Color.White.copy(alpha = 0.06f)
                            DrillStatus.COMPLETED -> Color.White.copy(alpha = 0.12f)
                            DrillStatus.AVAILABLE -> TargoGold
                        },
                        contentColor = when (drill.status) {
                            DrillStatus.LOCKED -> Color.White.copy(alpha = 0.3f)
                            DrillStatus.COMPLETED -> Color.White.copy(alpha = 0.6f)
                            DrillStatus.AVAILABLE -> Color.Black
                        },
                    ),
                    contentPadding = PaddingValues(0.dp),
                ) {
                    Text(btnLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                }
            }
        }
    }
}

