package com.adl.targo.features.training

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.adl.targo.ui.theme.BrandDark
import com.adl.targo.ui.theme.BrandSurface
import com.adl.targo.ui.theme.TargoGold

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrainingScreen(
    onStartDrill: () -> Unit,
    viewModel: TrainingViewModel = hiltViewModel(),
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF000000), Color(0xFF1a1a1a))))
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Spacer(modifier = Modifier.height(20.dp))

        // Title
        Text(
            text = "🎯 Drill Setup",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp,
            color = Color.White,
            modifier = Modifier.fillMaxWidth(),
        )

        // Distance
        FormGroup(label = "DISTANCE") {
            NumberField(
                value = viewModel.distance,
                placeholder = "50",
                onValueChange = { viewModel.distance = it },
            )
        }

        // Weapon Category
        FormGroup(label = "WEAPON CATEGORY") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                listOf("pistol", "rifle", "sniper").forEach { cat ->
                    CategoryButton(
                        label = cat.uppercase(),
                        selected = viewModel.selectedCategory == cat,
                        modifier = Modifier.weight(1f),
                        onClick = { viewModel.selectCategory(cat) },
                    )
                }
            }
        }

        // Weapon Type
        FormGroup(label = "WEAPON TYPE") {
            WeaponDropdown(
                weapons = viewModel.filteredWeapons,
                selectedId = viewModel.selectedWeapon,
                onSelect = { viewModel.selectedWeapon = it },
            )
        }

        // Number of Bullets
        FormGroup(label = "NUMBER OF BULLETS") {
            NumberField(
                value = viewModel.numberOfBullets,
                placeholder = "15",
                onValueChange = { viewModel.numberOfBullets = it },
            )
        }

        // Tip Box
        TipBox(tip = viewModel.currentTip)

        // Start Drill Button
        Button(
            onClick = {
                if (viewModel.prepareStartDrill()) onStartDrill()
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(4.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = TargoGold,
                contentColor = Color.Black,
            ),
        ) {
            Text(
                text = "🚀 Start Drill",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                letterSpacing = 0.5.sp,
            )
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun FormGroup(label: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.5.sp,
            color = Color.White.copy(alpha = 0.6f),
        )
        content()
    }
}

@Composable
private fun NumberField(value: Int, placeholder: String, onValueChange: (Int) -> Unit) {
    val text = remember(value) { if (value == 0) "" else value.toString() }
    var fieldText by remember(value) { mutableStateOf(text) }

    OutlinedTextField(
        value = fieldText,
        onValueChange = { raw ->
            fieldText = raw
            onValueChange(raw.filter { it.isDigit() }.toIntOrNull() ?: 0)
        },
        modifier = Modifier.fillMaxWidth(),
        placeholder = { Text(placeholder, color = Color.White.copy(alpha = 0.3f)) },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        singleLine = true,
        shape = RoundedCornerShape(4.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = Color.White,
            unfocusedTextColor = Color.White,
            focusedContainerColor = Color.White.copy(alpha = 0.08f),
            unfocusedContainerColor = Color.White.copy(alpha = 0.05f),
            focusedBorderColor = TargoGold,
            unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
            cursorColor = TargoGold,
        ),
    )
}

@Composable
private fun CategoryButton(
    label: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(44.dp),
        shape = RoundedCornerShape(4.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (selected) TargoGold else Color.White.copy(alpha = 0.05f),
            contentColor = if (selected) Color.Black else Color.White.copy(alpha = 0.6f),
        ),
        border = if (!selected) androidx.compose.foundation.BorderStroke(
            1.dp, Color.White.copy(alpha = 0.1f)
        ) else null,
        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp),
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.5.sp,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WeaponDropdown(
    weapons: List<com.adl.targo.domain.model.WeaponType>,
    selectedId: String,
    onSelect: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedName = weapons.find { it.id == selectedId }?.name ?: weapons.firstOrNull()?.name ?: ""

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = it },
        modifier = Modifier.fillMaxWidth(),
    ) {
        OutlinedTextField(
            value = selectedName,
            onValueChange = {},
            readOnly = true,
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor(MenuAnchorType.PrimaryNotEditable),
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            shape = RoundedCornerShape(4.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedContainerColor = Color.White.copy(alpha = 0.08f),
                unfocusedContainerColor = Color.White.copy(alpha = 0.05f),
                focusedBorderColor = TargoGold,
                unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                focusedTrailingIconColor = Color.White,
                unfocusedTrailingIconColor = Color.White.copy(alpha = 0.5f),
            ),
        )

        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.background(BrandDark),
        ) {
            weapons.forEach { weapon ->
                DropdownMenuItem(
                    text = {
                        Text(
                            weapon.name,
                            color = if (weapon.id == selectedId) TargoGold else Color.White,
                            fontWeight = if (weapon.id == selectedId) FontWeight.SemiBold else FontWeight.Normal,
                        )
                    },
                    onClick = {
                        onSelect(weapon.id)
                        expanded = false
                    },
                    modifier = Modifier.background(
                        if (weapon.id == selectedId) TargoGold.copy(alpha = 0.08f) else Color.Transparent
                    ),
                )
            }
        }
    }
}

@Composable
private fun TipBox(tip: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1A1A1A), RoundedCornerShape(8.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = "💡 Tip",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp,
            color = TargoGold,
        )
        Text(
            text = tip,
            fontSize = 13.sp,
            lineHeight = 20.sp,
            color = Color.White.copy(alpha = 0.7f),
        )
    }
}
