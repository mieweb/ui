package com.mieweb.ui.native

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class MieColors(
    val background: Color,
    val foreground: Color,
    val surface: Color,
    val muted: Color,
    val mutedForeground: Color,
    val border: Color,
    val primary: Color,
    val onPrimary: Color,
    val brand: Color,
    val danger: Color,
    val primaryContainer: Color = brand.copy(alpha = 0.42f).compositeOver(background),
    val onPrimaryContainer: Color = foreground,
)

@Composable
fun MieTheme(
    dark: Boolean = isSystemInDarkTheme(),
    colors: MieColors = if (dark) BlueHiveTokens.dark else BlueHiveTokens.light,
    fontFamily: FontFamily = FontFamily.Default,
    content: @Composable () -> Unit,
) {
    val base = if (dark) darkColorScheme() else lightColorScheme()
    val scheme = base.copy(
        primary = colors.primary, onPrimary = colors.onPrimary,
        primaryContainer = colors.primaryContainer, onPrimaryContainer = colors.onPrimaryContainer,
        secondary = colors.primary, onSecondary = colors.onPrimary,
        secondaryContainer = colors.muted, onSecondaryContainer = colors.foreground,
        background = colors.background, onBackground = colors.foreground,
        surface = colors.surface, onSurface = colors.foreground,
        surfaceVariant = colors.muted, onSurfaceVariant = colors.mutedForeground,
        surfaceContainer = colors.surface, surfaceContainerHigh = colors.muted,
        surfaceContainerHighest = colors.muted, surfaceContainerLow = colors.surface,
        surfaceContainerLowest = colors.background,
        outline = colors.border, outlineVariant = colors.border,
        error = colors.danger, onError = colors.onPrimary,
        errorContainer = colors.danger.copy(alpha = 0.12f), onErrorContainer = colors.danger,
        surfaceTint = colors.primary,
    )
    val typography = Typography()
    MaterialTheme(
        colorScheme = scheme,
        typography = typography.copy(
            headlineMedium = typography.headlineMedium.copy(fontFamily = fontFamily, fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            headlineSmall = typography.headlineSmall.copy(fontFamily = fontFamily, fontWeight = FontWeight.Bold, letterSpacing = 0.sp),
            titleLarge = typography.titleLarge.copy(fontFamily = fontFamily, fontWeight = FontWeight.Bold, fontSize = 20.sp, lineHeight = 26.sp, letterSpacing = 0.sp),
            titleMedium = typography.titleMedium.copy(fontFamily = fontFamily, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 22.sp, letterSpacing = 0.sp),
            titleSmall = typography.titleSmall.copy(fontFamily = fontFamily, letterSpacing = 0.sp),
            bodyLarge = typography.bodyLarge.copy(fontFamily = fontFamily, letterSpacing = 0.sp),
            bodyMedium = typography.bodyMedium.copy(fontFamily = fontFamily, letterSpacing = 0.sp),
            bodySmall = typography.bodySmall.copy(fontFamily = fontFamily, letterSpacing = 0.sp),
            labelLarge = typography.labelLarge.copy(fontFamily = fontFamily, letterSpacing = 0.sp),
            labelMedium = typography.labelMedium.copy(fontFamily = fontFamily, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.sp),
            labelSmall = typography.labelSmall.copy(fontFamily = fontFamily, letterSpacing = 0.sp),
        ),
        shapes = Shapes(
            small = RoundedCornerShape(8.dp), medium = RoundedCornerShape(8.dp),
            large = RoundedCornerShape(8.dp), extraLarge = RoundedCornerShape(16.dp),
        ),
        content = content,
    )
}