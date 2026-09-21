import { readFileSync, writeFileSync } from 'node:fs';
import { bluehiveBrand } from '../src/brands/bluehive.ts';

const output = new URL('./src/commonMain/kotlin/com/mieweb/ui/native/BlueHiveTokens.kt', import.meta.url);
const color = (hex) => `Color(0xFF${hex.slice(1).toUpperCase()})`;
function palette(mode) {
  const source = bluehiveBrand.colors[mode];
  return `    val ${mode} = MieColors(
        background = ${color(source.background)},
        foreground = ${color(source.foreground)},
        surface = ${color(source.card)},
        muted = ${color(source.muted)},
        mutedForeground = ${color(source.mutedForeground)},
        border = ${color(source.border)},
        primary = ${color(bluehiveBrand.colors.primary[mode === 'light' ? 800 : 300])},
        onPrimary = ${color(mode === 'light' ? source.card : source.background)},
        brand = ${color(bluehiveBrand.colors.primary[500])},
        danger = ${color(source.destructive)},
    )`;
}
const content = `package com.mieweb.ui.native

import androidx.compose.ui.graphics.Color

object BlueHiveTokens {
${palette('light')}
${palette('dark')}
}
`;
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== content) {
    throw new Error('Native tokens are stale. Run node --experimental-strip-types native/generate-tokens.mjs.');
  }
  console.log('Native BlueHive tokens match the canonical brand.');
} else {
  writeFileSync(output, content);
  console.log('Generated native BlueHive tokens.');
}