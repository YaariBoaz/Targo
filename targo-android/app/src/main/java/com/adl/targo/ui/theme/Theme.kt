package com.adl.targo.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val TargoColorScheme = darkColorScheme(
    primary = TargoGold,
    onPrimary = BrandDark,
    background = BrandDark,
    onBackground = BrandOnSurface,
    surface = BrandSurface,
    onSurface = BrandOnSurface,
    error = BrandShootingRed,
)

@Composable
fun TargoTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = TargoColorScheme,
        typography = Typography,
        content = content
    )
}
