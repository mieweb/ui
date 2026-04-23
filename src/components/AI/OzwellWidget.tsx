/**
 * OzwellWidget - MIE-branded wrapper around @ozwell/react's OzwellChat
 *
 * Provides the official Ozwell AI chat widget with MIE brand defaults.
 * This is a real, working AI chat — not a mock. It requires a valid
 * API endpoint and key to function.
 *
 * @example
 * ```tsx
 * // Agent key mode (recommended)
 * <OzwellWidget apiKey="agnt_key-your-agent-key" />
 *
 * // Custom endpoint mode
 * <OzwellWidget
 *   endpoint="https://ozwell-dev-refserver.opensource.mieweb.org/v1/chat/completions"
 *   apiKey="agnt_key-your-key"
 *   onToolCall={(tool, args, sendResult) => {
 *     sendResult({ success: true });
 *   }}
 * />
 * ```
 */
import * as React from 'react';
import { OzwellChat, useOzwell } from '@ozwell/react';
import type {
  OzwellChatProps,
  OzwellTool,
  OzwellToolFunction,
  OzwellToolParameter,
  OzwellError,
  UseOzwellReturn,
} from '@ozwell/react';

/** Default Ozwell dev reference server base */
const DEV_SERVER = 'https://ozwell-dev-refserver.opensource.mieweb.org';

/** Default chat completions endpoint */
const DEFAULT_ENDPOINT = `${DEV_SERVER}/v1/chat/completions`;

/** Default widget URL — the loader script is derived from this */
const DEFAULT_WIDGET_URL = `${DEV_SERVER}/embed/ozwell-chat.html`;

/** Ozwell brand primary color */
const OZWELL_PRIMARY = '#27aae1';

/** Ozwell icon path (served from Storybook public dir) */
const OZWELL_ICON_SRC = '/ozwell/icon.svg';

/**
 * Theme-aware CSS overrides for the ozwell-loader's default UI.
 * The loader injects hardcoded colors (#0066ff). These overrides
 * bind to --mieweb-* CSS custom properties so the widget automatically
 * inherits the active brand theme and dark/light mode.
 */
const THEME_OVERRIDES_ID = 'ozwell-mieweb-theme-overrides';
const THEME_OVERRIDES_CSS = `
  /* ============================
     Ozwell Widget – MIE UI Theme Overrides
     Uses --mieweb-* design tokens for brand + dark mode support.
     ============================ */

  /* --- Floating chat button --- */
  .ozwell-chat-button {
    background: color-mix(in srgb, var(--mieweb-primary-500, #27aae1) 45%, transparent) !important;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--mieweb-primary-500, #27aae1) 30%, transparent) !important;
  }
  .ozwell-chat-button:hover {
    background: color-mix(in srgb, var(--mieweb-primary-500, #27aae1) 65%, transparent) !important;
    box-shadow: 0 6px 20px color-mix(in srgb, var(--mieweb-primary-500, #27aae1) 40%, transparent) !important;
  }

  /* --- Unread badge --- */
  .ozwell-unread-badge {
    background: var(--mieweb-destructive, #ef4444) !important;
    border-color: var(--mieweb-background, #ffffff) !important;
  }

  /* --- Chat window wrapper --- */
  .ozwell-chat-wrapper {
    background: var(--mieweb-card, #ffffff) !important;
    border-color: var(--mieweb-border, #e5e7eb) !important;
    box-shadow: var(--mieweb-shadow-modal, 0 10px 15px -3px rgb(0 0 0 / 0.1)) !important;
  }

  /* --- Header bar --- */
  .ozwell-chat-header {
    background: var(--mieweb-primary-500, #27aae1) !important;
    color: var(--mieweb-primary-foreground, #ffffff) !important;
  }

  /* --- Header title --- */
  .ozwell-chat-title {
    color: inherit !important;
    font-family: var(--mieweb-font-sans, inherit) !important;
  }

  /* --- Hide / minimize button --- */
  .ozwell-hide-btn {
    color: var(--mieweb-primary-foreground, #ffffff) !important;
    opacity: 0.85;
  }
  .ozwell-hide-btn:hover {
    opacity: 1;
    background: color-mix(in srgb, var(--mieweb-primary-foreground, #ffffff) 15%, transparent) !important;
  }

  /* --- Chat icon size --- */
  .ozwell-chat-icon {
    width: 56px !important;
    height: 56px !important;
  }
`;

export type OzwellWidgetProps = OzwellChatProps;

export function OzwellWidget({
  endpoint = DEFAULT_ENDPOINT,
  widgetUrl = DEFAULT_WIDGET_URL,
  primaryColor = OZWELL_PRIMARY,
  theme = 'auto',
  ...rest
}: OzwellWidgetProps) {
  // Inject MIE UI theme overrides so the widget inherits brand tokens.
  // This <style> tag overrides the ozwell-loader's hardcoded colors
  // with --mieweb-* CSS custom properties, enabling brand + dark mode.
  React.useEffect(() => {
    if (document.getElementById(THEME_OVERRIDES_ID)) return;
    const style = document.createElement('style');
    style.id = THEME_OVERRIDES_ID;
    style.textContent = THEME_OVERRIDES_CSS;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  // Fix broken launcher icon — the loader hardcodes src="/favicon.ico" which
  // 404s when hosted on a different origin (e.g. Storybook). Replace with the
  // Ozwell brand icon from the design system.
  React.useEffect(() => {
    const fixIcon = () => {
      const img = document.querySelector(
        '#ozwell-chat-button .ozwell-chat-icon'
      ) as HTMLImageElement | null;
      if (img && img.tagName === 'IMG') {
        img.onerror = () => {
          img.src = OZWELL_ICON_SRC;
          img.onerror = null; // prevent infinite loop
        };
        // If already broken (naturalWidth 0), fix immediately
        if (img.complete && img.naturalWidth === 0) {
          img.src = OZWELL_ICON_SRC;
        }
      }
    };
    // The button is created asynchronously by the loader script, so poll briefly
    const timer = setInterval(fixIcon, 200);
    const timeout = setTimeout(() => clearInterval(timer), 5000);
    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <OzwellChat
      endpoint={endpoint}
      widgetUrl={widgetUrl}
      primaryColor={primaryColor}
      theme={theme}
      {...rest}
    />
  );
}

// Re-export hook and types for convenience
export { useOzwell };
export type {
  OzwellChatProps,
  OzwellTool,
  OzwellToolFunction,
  OzwellToolParameter,
  OzwellError,
  UseOzwellReturn,
};
