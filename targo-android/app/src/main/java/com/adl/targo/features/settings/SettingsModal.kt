package com.adl.targo.features.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold

@Composable
fun SettingsModal(
    currentCameraNumber: Int,
    currentWifiSsid: String,
    onSave: (Int, String) -> Unit,
    onDismiss: () -> Unit
) {
    var cameraInput by remember { mutableStateOf(if (currentCameraNumber > 0) currentCameraNumber.toString() else "") }
    var ssidInput by remember { mutableStateOf(currentWifiSsid) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.85f)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .padding(horizontal = 8.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF141414)),
            shape = RoundedCornerShape(24.dp)
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    "הגדרות",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Text("מספר מטרה", fontSize = 14.sp, color = Color(0xFF999999))

                OutlinedTextField(
                    value = cameraInput,
                    onValueChange = { value ->
                        if (value.all { it.isDigit() } && value.length <= 4) cameraInput = value
                    },
                    placeholder = { Text("הכנס מספר מטרה", color = Color(0xFF555555)) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TargoGold,
                        unfocusedBorderColor = Color(0xFF333333),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        cursorColor = TargoGold
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Text("שם רשת WiFi", fontSize = 14.sp, color = Color(0xFF999999))

                OutlinedTextField(
                    value = ssidInput,
                    onValueChange = { ssidInput = it },
                    placeholder = { Text("הכנס שם רשת", color = Color(0xFF555555)) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TargoGold,
                        unfocusedBorderColor = Color(0xFF333333),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        cursorColor = TargoGold
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(Modifier.height(4.dp))

                Button(
                    onClick = {
                        val number = cameraInput.toIntOrNull() ?: 0
                        onSave(number, ssidInput.trim())
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TargoGold),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("שמור", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0A0A0A))
                }

                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("ביטול", fontSize = 14.sp, color = Color(0xFF666666))
                }
            }
        }
    }
}
