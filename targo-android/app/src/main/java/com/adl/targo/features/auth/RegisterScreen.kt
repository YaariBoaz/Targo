package com.adl.targo.features.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.BrandShootingRed
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold

@Composable
fun RegisterScreen(
    onBack: () -> Unit,
    onRegisterSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()
    var displayName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var shooterLevel by remember { mutableStateOf("Recruit") }
    val focusManager = LocalFocusManager.current

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) onRegisterSuccess()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0D0D), BrandDark)))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            IconButton(onClick = { viewModel.clearError(); onBack() }) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Title
            Text(
                text = "BUILD YOUR\nSHOOTER IDENTITY",
                fontSize = 26.sp,
                fontWeight = FontWeight.Black,
                color = TargoGold,
                lineHeight = 32.sp,
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Step 1 of 2",
                fontSize = 13.sp,
                color = Color.White.copy(alpha = 0.4f),
            )

            Spacer(modifier = Modifier.height(36.dp))

            // Display Name row
            LabeledField(label = "Name") {
                DarkTextField(
                    value = displayName,
                    onValueChange = { displayName = it; viewModel.clearError() },
                    placeholder = "Your name",
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                    keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Email row
            LabeledField(label = "Email") {
                DarkTextField(
                    value = email,
                    onValueChange = { email = it; viewModel.clearError() },
                    placeholder = "you@example.com",
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next,
                    ),
                    keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Password row
            LabeledField(label = "Password") {
                DarkTextField(
                    value = password,
                    onValueChange = { password = it; viewModel.clearError() },
                    placeholder = "Min. 6 characters",
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                    ),
                    keyboardActions = KeyboardActions(onDone = {
                        focusManager.clearFocus()
                        viewModel.register(email, password, displayName)
                    }),
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.5f),
                            )
                        }
                    }
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Shooter Level chips
            Text(
                text = "SHOOTER LEVEL",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.5.sp,
                color = Color.White.copy(alpha = 0.6f),
            )
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                listOf("Recruit", "Marksman", "Pro").forEach { level ->
                    val selected = shooterLevel == level
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (selected) TargoGold else Color(0xFF1A1A1A))
                            .border(
                                1.dp,
                                if (selected) TargoGold else Color.White.copy(alpha = 0.12f),
                                RoundedCornerShape(8.dp),
                            )
                            .clickable { shooterLevel = level },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = level,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (selected) Color.Black else Color.White.copy(alpha = 0.6f),
                        )
                    }
                }
            }

            if (uiState is AuthUiState.Error) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = (uiState as AuthUiState.Error).message,
                    color = BrandShootingRed,
                    fontSize = 13.sp,
                )
            }

            Spacer(modifier = Modifier.height(36.dp))

            Button(
                onClick = {
                    focusManager.clearFocus()
                    viewModel.register(email, password, displayName)
                },
                enabled = uiState !is AuthUiState.Loading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TargoGold,
                    contentColor = BrandDark,
                    disabledContainerColor = TargoGold.copy(alpha = 0.5f),
                ),
            ) {
                if (uiState is AuthUiState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = BrandDark,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Text("CREATE ACCOUNT", fontWeight = FontWeight.Bold, fontSize = 16.sp, letterSpacing = 2.sp)
                }
            }

            Spacer(modifier = Modifier.height(48.dp))
        }
    }
}

@Composable
private fun LabeledField(
    label: String,
    content: @Composable RowScope.() -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White,
            modifier = Modifier.width(72.dp),
        )
        content()
    }
}

@Composable
private fun RowScope.DarkTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    trailingIcon: (@Composable () -> Unit)? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier.weight(1f),
        placeholder = { Text(placeholder, color = Color.White.copy(alpha = 0.3f), fontSize = 13.sp) },
        singleLine = true,
        shape = RoundedCornerShape(8.dp),
        visualTransformation = visualTransformation,
        keyboardOptions = keyboardOptions,
        keyboardActions = keyboardActions,
        trailingIcon = trailingIcon,
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = Color.White,
            unfocusedTextColor = Color.White,
            focusedContainerColor = Color(0xFF1A1A1A),
            unfocusedContainerColor = Color(0xFF1A1A1A),
            focusedBorderColor = TargoGold,
            unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
            cursorColor = TargoGold,
        ),
    )
}
