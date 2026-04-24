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
import type { OzwellAnimatedButtonProps } from './OzwellAnimatedButton';
import type {
  OzwellChatProps,
  OzwellTool,
  OzwellToolFunction,
  OzwellToolParameter,
  OzwellError,
  UseOzwellReturn,
} from '@ozwell/react';

/** Lazy-load OzwellAnimatedButton so @rive-app/react-canvas is only pulled in when animated=true */
const OzwellAnimatedButton = React.lazy(() =>
  import('./OzwellAnimatedButton').then((m) => ({
    default: m.OzwellAnimatedButton,
  }))
);

/** Default Ozwell dev reference server base */
const DEV_SERVER = 'https://ozwell-dev-refserver.opensource.mieweb.org';

/** Default chat completions endpoint */
const DEFAULT_ENDPOINT = `${DEV_SERVER}/v1/chat/completions`;

/** Default widget URL — the loader script is derived from this */
const DEFAULT_WIDGET_URL = `${DEV_SERVER}/embed/ozwell-chat.html`;

/** Ozwell brand primary color */
const OZWELL_PRIMARY = '#27aae1';

/**
 * Inline fallback icon — a lightweight Ozwell "O" circle in brand blue.
 * The full 900 KB mascot SVG cannot be inlined; this simple glyph is used
 * when the loader's default /favicon.ico 404s and no custom iconSrc is given.
 */
const OZWELL_ICON_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%2327aae1'/%3E%3Ctext x='32' y='44' text-anchor='middle' font-size='36' font-family='system-ui,sans-serif' font-weight='700' fill='white'%3EO%3C/text%3E%3C/svg%3E";

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

/**
 * Reads the current --mieweb-* design-token values from the parent page
 * and returns CSS text that maps the widget's hardcoded colors to the
 * active brand + dark/light mode. Injected into the iframe's <head>.
 */
function buildIframeThemeCSS(): string {
  const root = document.documentElement;
  const get = (v: string, fallback: string) =>
    getComputedStyle(root).getPropertyValue(v).trim() || fallback;

  const bg = get('--mieweb-background', '#ffffff');
  const fg = get('--mieweb-foreground', '#171717');
  const card = get('--mieweb-card', '#ffffff');
  const cardFg = get('--mieweb-card-foreground', '#171717');
  const muted = get('--mieweb-muted', '#f5f5f5');
  const mutedFg = get('--mieweb-muted-foreground', '#737373');
  const border = get('--mieweb-border', '#e5e7eb');
  const input = get('--mieweb-input', '#e5e7eb');
  const primary = get('--mieweb-primary-500', '#27aae1');
  const primaryFg = get('--mieweb-primary-foreground', '#ffffff');
  const ring = get('--mieweb-ring', '#27aae1');
  const fontSans = get(
    '--mieweb-font-sans',
    "'Nunito', ui-sans-serif, system-ui, sans-serif"
  );

  return `
    /* MIE UI iframe theme overrides — regenerated on theme change */

    /* --- Layout --- */
    body, .chat-container {
      background: ${bg} !important;
      color: ${fg} !important;
      font-family: ${fontSans} !important;
    }

    /* --- Status strip --- */
    .status-strip {
      background: ${muted} !important;
      border-color: ${border} !important;
    }
    .status { color: ${mutedFg} !important; }

    /* --- Reasoning controls --- */
    .reasoning-capsule {
      background: ${muted} !important;
      color: ${fg} !important;
      border-color: ${border} !important;
    }
    .reasoning-seg {
      background: ${card} !important;
      border-color: ${border} !important;
    }
    .reasoning-seg-btn {
      color: ${mutedFg} !important;
    }
    .reasoning-seg-btn.active {
      background: ${primary} !important;
      color: ${primaryFg} !important;
    }

    /* --- Messages --- */
    .messages { background: ${bg} !important; }

    .message.user {
      background: ${primary} !important;
      color: ${primaryFg} !important;
    }
    .message.assistant {
      background: ${card} !important;
      color: ${cardFg} !important;
      border: 1px solid ${border} !important;
    }
    .message.system {
      background: ${muted} !important;
      color: ${fg} !important;
    }
    .message.welcome {
      background: ${card} !important;
      color: ${mutedFg} !important;
      border-color: ${border} !important;
    }
    .message.queued {
      border-color: ${border} !important;
      color: ${mutedFg} !important;
    }

    /* --- Input area --- */
    .chat-form {
      background: ${bg} !important;
      border-top: 1px solid ${border} !important;
    }
    .chat-input {
      background: ${input} !important;
      color: ${fg} !important;
      border-color: ${border} !important;
      font-family: ${fontSans} !important;
    }
    .chat-input::placeholder { color: ${mutedFg} !important; }
    .chat-input:focus {
      border-color: ${ring} !important;
      box-shadow: 0 0 0 2px ${ring}33 !important;
    }

    /* --- Send button --- */
    .chat-submit {
      background: ${primary} !important;
      color: ${primaryFg} !important;
    }
    .chat-submit:hover {
      filter: brightness(1.1) !important;
    }
    .chat-submit:disabled {
      background: ${muted} !important;
      color: ${mutedFg} !important;
      filter: none !important;
    }

    /* --- Footer --- */
    .chat-footer {
      background: ${muted} !important;
      color: ${mutedFg} !important;
      border-color: ${border} !important;
    }

    /* --- Tool pills (debug mode) --- */
    .tool-pill {
      background: color-mix(in srgb, ${primary} 15%, ${bg}) !important;
      color: ${fg} !important;
      border-color: ${border} !important;
    }
    .tool-details {
      background: ${card} !important;
      border-color: ${border} !important;
    }
    .tool-details-header {
      background: ${muted} !important;
      color: ${fg} !important;
    }
    .tool-details-content {
      color: ${cardFg} !important;
    }

    /* --- Thinking bubble --- */
    .thinking-bubble { color: ${fg} !important; }
    .thinking-content {
      background: ${muted} !important;
      border-color: ${border} !important;
      color: ${mutedFg} !important;
    }

    /* --- Queued message actions --- */
    .queued-input {
      background: ${input} !important;
      color: ${fg} !important;
      border-color: ${border} !important;
    }

    /* --- Scrollbar (WebKit) --- */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${bg}; }
    ::-webkit-scrollbar-thumb {
      background: ${border};
      border-radius: 3px;
    }
  `;
}

export type OzwellWidgetProps = OzwellChatProps & {
  /** Render an animated Rive mascot as the chat launcher button */
  animated?: boolean;
  /**
   * URL to the .riv animation file. **Required when `animated` is true.**
   * The asset is not bundled with the library — host it yourself and pass the URL.
   * @example rivSrc="/assets/ozwell.riv"
   */
  rivSrc?: OzwellAnimatedButtonProps['rivSrc'];
  /** Size of the animated button in pixels (default: 80) */
  animatedSize?: OzwellAnimatedButtonProps['size'];
  /**
   * Custom icon URL for the static (non-animated) chat launcher button.
   * Used as a fallback when the loader's default icon fails to load.
   * Defaults to a lightweight inline Ozwell "O" glyph.
   */
  iconSrc?: string;
};

export function OzwellWidget({
  endpoint = DEFAULT_ENDPOINT,
  widgetUrl = DEFAULT_WIDGET_URL,
  primaryColor = OZWELL_PRIMARY,
  theme = 'auto',
  animated = false,
  rivSrc,
  animatedSize,
  iconSrc = OZWELL_ICON_FALLBACK,
  ...rest
}: OzwellWidgetProps) {
  // Clean up ozwell-loader DOM artifacts on unmount.
  // The vanilla loader injects a fixed-position button, chat wrapper, iframe,
  // and style tags directly into document.body — none of which get removed
  // when the React component unmounts. Without this, the button persists
  // across Storybook story navigation (or any SPA route change).
  React.useEffect(() => {
    return () => {
      // Remove loader-injected DOM elements
      for (const id of [
        'ozwell-chat-button',
        'ozwell-chat-wrapper',
        'ozwell-default-ui-styles',
      ]) {
        document.getElementById(id)?.remove();
      }
      // Remove the loader script tag so it can be re-injected fresh
      document.querySelector('script[src*="ozwell-loader.js"]')?.remove();
      // Remove the iframe (may not have an ID)
      document
        .querySelector(
          'iframe[title="Ozwell Chat"], iframe[title="Ozwell Assistant"]'
        )
        ?.remove();
      // Clear global state so next mount starts fresh
      delete (window as unknown as Record<string, unknown>).OzwellChat;
      delete (window as unknown as Record<string, unknown>).OzwellChatConfig;
    };
  }, []);

  // Inject MIE UI theme overrides so the widget inherits brand tokens.
  // This <style> tag overrides the ozwell-loader's hardcoded colors
  // with --mieweb-* CSS custom properties, enabling brand + dark mode.
  // Not removed on unmount — idempotent CSS safe to leave in place,
  // prevents multi-instance bugs when one widget unmounts while another is live.
  React.useEffect(() => {
    if (document.getElementById(THEME_OVERRIDES_ID)) return;
    const style = document.createElement('style');
    style.id = THEME_OVERRIDES_ID;
    style.textContent = THEME_OVERRIDES_CSS;
    document.head.appendChild(style);
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
          img.src = iconSrc;
          img.onerror = null; // prevent infinite loop
        };
        // If already broken (naturalWidth 0), fix immediately
        if (img.complete && img.naturalWidth === 0) {
          img.src = iconSrc;
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
  }, [iconSrc]);

  // Inject theme-aware CSS into the Ozwell iframe. The iframe content has
  // hardcoded colors (#0066ff, #ffffff, etc.) with no dark mode or theming.
  // Since it uses srcdoc it is same-origin, so we can access contentDocument.
  // We read --mieweb-* token values from the parent and inject them as
  // literal colors, then re-inject whenever the parent theme changes.
  React.useEffect(() => {
    const IFRAME_STYLE_ID = 'ozwell-mieweb-iframe-theme';

    /** Find the ozwell iframe in the parent DOM */
    const findIframe = () =>
      document.querySelector(
        'iframe[title="Ozwell Chat"], iframe[title="Ozwell Assistant"]'
      ) as HTMLIFrameElement | null;

    /** Inject (or replace) the theme CSS inside the iframe */
    const injectTheme = () => {
      const iframe = findIframe();
      const doc = iframe?.contentDocument;
      if (!doc) return;
      let style = doc.getElementById(
        IFRAME_STYLE_ID
      ) as HTMLStyleElement | null;
      if (!style) {
        style = doc.createElement('style');
        style.id = IFRAME_STYLE_ID;
        doc.head.appendChild(style);
      }
      style.textContent = buildIframeThemeCSS();
    };

    // Poll until the iframe is ready, then inject
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      const iframe = findIframe();
      if (iframe?.contentDocument?.body) {
        clearInterval(poll);
        injectTheme();
      }
      if (attempts > 50) clearInterval(poll); // give up after 10s
    }, 200);

    // Watch for theme changes on <html> (class or data-theme attribute)
    const observer = new MutationObserver(() => {
      // Small delay so CSS variables have settled
      setTimeout(injectTheme, 50);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    return () => {
      clearInterval(poll);
      observer.disconnect();
    };
  }, []);

  // Toggle chat via the global OzwellChat API (used by animated button).
  // The loader exposes open() / close() / isOpen but no toggle().
  const handleAnimatedClick = React.useCallback(() => {
    const ozwell = (window as unknown as Record<string, unknown>).OzwellChat as
      | { open?: () => void; close?: () => void; isOpen?: boolean }
      | undefined;
    if (ozwell) {
      if (ozwell.isOpen) {
        ozwell.close?.();
      } else {
        ozwell.open?.();
      }
    }
  }, []);

  return (
    <>
      <OzwellChat
        endpoint={endpoint}
        widgetUrl={widgetUrl}
        primaryColor={primaryColor}
        theme={theme}
        {...rest}
      />
      {animated && (
        <React.Suspense fallback={null}>
          <OzwellAnimatedButton
            rivSrc={rivSrc}
            size={animatedSize}
            onClick={handleAnimatedClick}
          />
        </React.Suspense>
      )}
    </>
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
