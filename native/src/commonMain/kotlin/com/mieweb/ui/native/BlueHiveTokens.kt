package com.mieweb.ui.native

import androidx.compose.ui.graphics.Color

object BlueHiveTokens {
    val light = MieColors(
        background = Color(0xFFFFFFFF),
        foreground = Color(0xFF171717),
        surface = Color(0xFFFFFFFF),
        muted = Color(0xFFF5F5F5),
        mutedForeground = Color(0xFF494949),
        border = Color(0xFFE5E7EB),
        primary = Color(0xFF0F749C),
        onPrimary = Color(0xFFFFFFFF),
        brand = Color(0xFF27AAE1),
        danger = Color(0xFFDC2626),
    )
    val dark = MieColors(
        background = Color(0xFF171717),
        foreground = Color(0xFFFAFAFA),
        surface = Color(0xFF262626),
        muted = Color(0xFF404040),
        mutedForeground = Color(0xFFA1A1AA),
        border = Color(0xFF404040),
        primary = Color(0xFF4DC4EA),
        onPrimary = Color(0xFF171717),
        brand = Color(0xFF27AAE1),
        danger = Color(0xFFDC2626),
    )
}
