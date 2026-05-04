package com.adl.targo.features.auth

import android.app.Activity
import androidx.activity.result.ActivityResultRegistryOwner
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold
import com.facebook.CallbackManager
import com.facebook.FacebookCallback
import com.facebook.FacebookException
import com.facebook.login.LoginManager
import com.facebook.login.LoginResult
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException

private const val GOOGLE_WEB_CLIENT_ID =
    "385051031881-leean8bo1m9oghf6ocbhrgera8q3j0hk.apps.googleusercontent.com"

@Composable
fun WelcomeScreen(
    onLoginClick: () -> Unit,
    onRegisterClick: () -> Unit,
    onAuthSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) onAuthSuccess()
    }

    // ── Google Sign-In launcher ───────────────────────────────────────────
    val googleSignInClient = remember {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(GOOGLE_WEB_CLIENT_ID)
            .requestEmail()
            .build()
        GoogleSignIn.getClient(context, gso)
    }

    val googleLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            try {
                val account = GoogleSignIn.getSignedInAccountFromIntent(result.data)
                    .getResult(ApiException::class.java)
                viewModel.handleGoogleSignInResult(account)
            } catch (e: ApiException) {
                viewModel.handleGoogleSignInResult(null)
            }
        } else {
            viewModel.clearError()
        }
    }

    // ── Facebook Sign-In ─────────────────────────────────────────────────
    val facebookCallbackManager = remember { CallbackManager.Factory.create() }

    DisposableEffect(facebookCallbackManager) {
        LoginManager.getInstance().registerCallback(
            facebookCallbackManager,
            object : FacebookCallback<LoginResult> {
                override fun onSuccess(loginResult: LoginResult) {
                    viewModel.handleFacebookAccessToken(loginResult.accessToken)
                }
                override fun onCancel() { viewModel.clearError() }
                override fun onError(error: FacebookException) { viewModel.clearError() }
            }
        )
        onDispose { LoginManager.getInstance().unregisterCallback(facebookCallbackManager) }
    }

    // ── UI ───────────────────────────────────────────────────────────────
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0D0D), BrandDark))),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(modifier = Modifier.height(64.dp))

            CrosshairIcon(modifier = Modifier.size(120.dp))

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

            Spacer(modifier = Modifier.height(56.dp))

            // Email login — dark fill with gold border + gold text
            OutlinedButton(
                onClick = onLoginClick,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = Color(0xFF1A1A1A),
                    contentColor = TargoGold,
                ),
                border = BorderStroke(1.5.dp, TargoGold),
            ) {
                Text("LOGIN", fontWeight = FontWeight.Bold, fontSize = 16.sp, letterSpacing = 2.sp)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Google
            SocialButton(
                text = "Continue with Google",
                icon = { GoogleIcon() },
                containerColor = Color.White,
                contentColor = Color(0xFF1F1F1F),
                onClick = {
                    // Sign out first so account picker always shows
                    googleSignInClient.signOut().addOnCompleteListener {
                        googleLauncher.launch(googleSignInClient.signInIntent)
                    }
                },
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Facebook
            SocialButton(
                text = "Continue with Facebook",
                icon = { FacebookIcon() },
                containerColor = Color(0xFF1877F2),
                contentColor = Color.White,
                onClick = {
                    LoginManager.getInstance().logInWithReadPermissions(
                        context as ActivityResultRegistryOwner,
                        facebookCallbackManager,
                        listOf("email", "public_profile"),
                    )
                },
            )

            Spacer(modifier = Modifier.height(16.dp))

            HorizontalDividerWithText(text = "OR")

            Spacer(modifier = Modifier.height(16.dp))

            // Register
            OutlinedButton(
                onClick = onRegisterClick,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TargoGold),
                border = BorderStroke(1.dp, TargoGold),
            ) {
                Text("REGISTER", fontWeight = FontWeight.Bold, fontSize = 16.sp, letterSpacing = 2.sp)
            }

            if (uiState is AuthUiState.Error) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = (uiState as AuthUiState.Error).message,
                    color = Color(0xFFE63946),
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                )
            }

            if (uiState is AuthUiState.Loading) {
                Spacer(modifier = Modifier.height(16.dp))
                CircularProgressIndicator(color = TargoGold, modifier = Modifier.size(28.dp))
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Continue as Guest
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "CONTINUE AS GUEST",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White.copy(alpha = 0.6f),
                    letterSpacing = 1.sp,
                    modifier = Modifier.clickable { /* guest mode not yet implemented */ },
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "No Data Will Be Saved!",
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.3f),
                )
            }

            Spacer(modifier = Modifier.height(48.dp))
        }
    }
}

@Composable
private fun AuthButton(
    text: String,
    containerColor: Color,
    contentColor: Color,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = containerColor, contentColor = contentColor),
    ) {
        Text(text, fontWeight = FontWeight.Bold, fontSize = 16.sp, letterSpacing = 2.sp)
    }
}

@Composable
private fun SocialButton(
    text: String,
    icon: @Composable () -> Unit,
    containerColor: Color,
    contentColor: Color,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = containerColor, contentColor = contentColor),
    ) {
        Row(
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth(),
        ) {
            icon()
            Spacer(modifier = Modifier.width(12.dp))
            Text(text, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
        }
    }
}

@Composable
private fun GoogleIcon() {
    val s = 20.dp
    Box(modifier = Modifier.size(s).drawBehind {
        val w = size.width; val h = size.height
        drawArc(Color(0xFF4285F4), -90f, 180f, false,
            Offset(0f, 0f), Size(w, h), style = Stroke(w * 0.2f))
        drawArc(Color(0xFFEA4335), -90f, -90f, false,
            Offset(0f, 0f), Size(w, h), style = Stroke(w * 0.2f))
        drawArc(Color(0xFF34A853), 90f, 90f, false,
            Offset(0f, 0f), Size(w, h), style = Stroke(w * 0.2f))
        drawArc(Color(0xFFFBBC05), 0f, 90f, false,
            Offset(0f, 0f), Size(w, h), style = Stroke(w * 0.2f))
        // White center fill
        drawCircle(Color.White, radius = w * 0.3f, center = Offset(w / 2f, h / 2f))
        // Blue horizontal bar (the G crossbar)
        drawRect(Color(0xFF4285F4),
            topLeft = Offset(w * 0.5f, h * 0.38f),
            size = Size(w * 0.5f, h * 0.24f))
    })
}

@Composable
private fun FacebookIcon() {
    Box(modifier = Modifier.size(20.dp).drawBehind {
        val w = size.width; val h = size.height
        drawCircle(Color.White, radius = w * 0.42f, center = Offset(w / 2f, h / 2f))
        // f letter approximation
        drawRect(Color(0xFF1877F2),
            topLeft = Offset(w * 0.44f, h * 0.28f),
            size = Size(w * 0.18f, h * 0.62f))
        drawRect(Color(0xFF1877F2),
            topLeft = Offset(w * 0.30f, h * 0.44f),
            size = Size(w * 0.40f, h * 0.14f))
    })
}

@Composable
private fun CrosshairIcon(modifier: Modifier = Modifier) {
    val gold = TargoGold
    val white = Color.White
    Box(modifier = modifier.drawBehind {
        val cx = size.width / 2f; val cy = size.height / 2f
        val outerR = size.minDimension * 0.40f
        val innerR = size.minDimension * 0.15f
        val lineLen = size.minDimension * 0.14f
        val lineGap = size.minDimension * 0.12f
        val strokeW = size.minDimension * 0.025f
        listOf(10f, 100f, 190f, 280f).forEach { angle ->
            drawArc(white, angle, 70f, false,
                Offset(cx - outerR, cy - outerR),
                Size(outerR * 2, outerR * 2),
                style = Stroke(strokeW, cap = StrokeCap.Round))
        }
        drawCircle(gold, radius = innerR, center = Offset(cx, cy),
            style = Stroke(strokeW, cap = StrokeCap.Round))
        drawLine(white, Offset(cx, cy - outerR - lineLen), Offset(cx, cy - outerR + lineGap * 0.3f), strokeW, StrokeCap.Round)
        drawLine(white, Offset(cx, cy + outerR - lineGap * 0.3f), Offset(cx, cy + outerR + lineLen), strokeW, StrokeCap.Round)
        drawLine(white, Offset(cx - outerR - lineLen, cy), Offset(cx - outerR + lineGap * 0.3f, cy), strokeW, StrokeCap.Round)
        drawLine(white, Offset(cx + outerR - lineGap * 0.3f, cy), Offset(cx + outerR + lineLen, cy), strokeW, StrokeCap.Round)
    })
}

@Composable
private fun HorizontalDividerWithText(text: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        HorizontalDivider(modifier = Modifier.weight(1f), color = Color.White.copy(alpha = 0.2f))
        Text(text = text, color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp)
        HorizontalDivider(modifier = Modifier.weight(1f), color = Color.White.copy(alpha = 0.2f))
    }
}
