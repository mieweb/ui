import React from 'react';
import { addons, types } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';
import { IconButton } from 'storybook/internal/components';
import { ShareAltIcon } from '@storybook/icons';

// Brand theme configurations for the Storybook manager UI
const brandThemes = {
  bluehive: {
    name: 'BlueHive',
    primary: '#27aae1',
    secondary: '#1f98ca',
    appBg: '#f0f9ff',
    appBgDark: '#0c1929',
    borderColor: '#b3e6f6',
    borderColorDark: '#1e4a6e',
  },
  ccme: {
    name: 'ccMe',
    primary: '#9ed0c4',
    secondary: '#7ab8ac',
    appBg: '#eef8f6',
    appBgDark: '#0a1f1c',
    borderColor: '#b9e2dc',
    borderColorDark: '#2b6b60',
  },
  mieweb: {
    name: 'MIE Web',
    primary: '#27ae60',
    secondary: '#219c55',
    appBg: '#f0fdf4',
    appBgDark: '#0a1f12',
    borderColor: '#bbf7d0',
    borderColorDark: '#166534',
  },
  webchart: {
    name: 'WebChart',
    primary: '#f5841f',
    secondary: '#ea580c',
    appBg: '#fff7ed',
    appBgDark: '#1c1007',
    borderColor: '#fed7aa',
    borderColorDark: '#7c2d12',
  },
  'enterprise-health': {
    name: 'Enterprise Health',
    primary: '#9333ea',
    secondary: '#7c3aed',
    appBg: '#faf5ff',
    appBgDark: '#1a0a2e',
    borderColor: '#e9d5ff',
    borderColorDark: '#581c87',
  },
  default: {
    name: 'Default',
    primary: '#6b7280',
    secondary: '#4b5563',
    appBg: '#f9fafb',
    appBgDark: '#18181b',
    borderColor: '#e5e7eb',
    borderColorDark: '#3f3f46',
  },
};

type BrandKey = keyof typeof brandThemes;

// Create a theme for a specific brand
function createBrandTheme(brandKey: BrandKey, isDark = false) {
  const brand = brandThemes[brandKey] || brandThemes.bluehive;
  
  if (isDark) {
    return create({
      base: 'dark',

      // Brand
      brandTitle: `MIE Web UI • ${brand.name}`,
      brandUrl: 'https://github.com/mieweb/ui',
      brandImage: 'https://mieweb.org/wp-content/uploads/2024/03/MIE-NEW-1.png',
      brandTarget: '_blank',

      // Colors
      colorPrimary: brand.primary,
      colorSecondary: brand.secondary,

      // UI - Dark mode
      appBg: brand.appBgDark,
      appContentBg: '#18181b',
      appPreviewBg: '#18181b',
      appBorderColor: brand.borderColorDark,
      appBorderRadius: 8,

      // Text colors - Dark mode
      textColor: '#fafafa',
      textInverseColor: '#18181b',
      textMutedColor: '#a1a1aa',

      // Toolbar - Dark mode
      barTextColor: '#d4d4d8',
      barSelectedColor: brand.primary,
      barHoverColor: brand.secondary,
      barBg: '#27272a',

      // Form colors - Dark mode
      inputBg: '#27272a',
      inputBorder: '#3f3f46',
      inputTextColor: '#fafafa',
      inputBorderRadius: 6,

      // Buttons
      buttonBg: brand.primary,
      buttonBorder: brand.secondary,

      // Typography
      fontBase: '"Inter", "Segoe UI", "Roboto", sans-serif',
      fontCode: '"SF Mono", "Monaco", "Consolas", monospace',
    });
  }
  
  return create({
    base: 'light',

    // Brand
    brandTitle: `MIE Web UI • ${brand.name}`,
    brandUrl: 'https://github.com/mieweb/ui',
    brandImage: 'https://mieweb.org/wp-content/uploads/2024/03/MIE-NEW-1.png',
    brandTarget: '_blank',

    // Colors
    colorPrimary: brand.primary,
    colorSecondary: brand.secondary,

    // UI
    appBg: brand.appBg,
    appContentBg: '#ffffff',
    appPreviewBg: '#ffffff',
    appBorderColor: brand.borderColor,
    appBorderRadius: 8,

    // Text colors
    textColor: '#171717',
    textInverseColor: '#ffffff',
    textMutedColor: '#6b7280',

    // Toolbar
    barTextColor: '#525252',
    barSelectedColor: brand.primary,
    barHoverColor: brand.secondary,
    barBg: '#ffffff',

    // Form colors
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
    inputTextColor: '#171717',
    inputBorderRadius: 6,

    // Buttons
    buttonBg: brand.primary,
    buttonBorder: brand.secondary,

    // Typography
    fontBase: '"Inter", "Segoe UI", "Roboto", sans-serif',
    fontCode: '"SF Mono", "Monaco", "Consolas", monospace',
  });
}

// Set initial theme (BlueHive as default)
addons.setConfig({
  theme: createBrandTheme('bluehive'),
  sidebar: {
    showRoots: true,
    collapsedRoots: ['examples'],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});

// Inject CSS custom properties for dynamic theming
const styleId = 'mieweb-manager-theme';

function injectBrandCSS(brandKey: BrandKey, isDark = false) {
  const brand = brandThemes[brandKey] || brandThemes.bluehive;
  
  // Remove existing style
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Dark mode colors
  const bgColor = isDark ? brand.appBgDark : brand.appBg;
  const borderColor = isDark ? brand.borderColorDark : brand.borderColor;
  const contentBg = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#fafafa' : '#171717';
  const textMuted = isDark ? '#a1a1aa' : '#6b7280';
  const barBg = isDark ? '#27272a' : '#ffffff';
  const inputBg = isDark ? '#27272a' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#d1d5db';
  
  // Create new style with brand colors
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Dynamic brand theming for Storybook manager */
    :root {
      --mieweb-manager-primary: ${brand.primary};
      --mieweb-manager-secondary: ${brand.secondary};
      --mieweb-manager-bg: ${bgColor};
      --mieweb-manager-border: ${borderColor};
      --mieweb-manager-content-bg: ${contentBg};
      --mieweb-manager-text: ${textColor};
      --mieweb-manager-text-muted: ${textMuted};
    }
    
    /* Selected story item highlight */
    [data-selected="true"] {
      background-color: ${isDark ? `${brand.primary}30` : `${brand.primary}15`} !important;
      border-right: none !important;
    }
    
    [data-selected="true"]::before {
      background-color: ${brand.primary} !important;
    }
    
    /* Selected sidebar item text styling */
    [data-selected="true"] span,
    [data-selected="true"] a,
    [data-selected="true"] button {
      color: ${textColor} !important;
      font-weight: 700 !important;
    }
    
    [data-selected="true"] svg {
      color: ${isDark ? textColor : textMuted} !important;
    }
    
    /*
     * Context menu (3-dot) buttons - transparent bg, no box-shadow.
     * The doubled attribute selector [attr][attr] is intentional: Storybook uses
     * emotion-generated class selectors (e.g. .css-1eylbss) with high specificity
     * that override single attribute selectors even with !important. Doubling the
     * attribute selector raises our specificity to match.
     */
    [data-testid="context-menu"][data-testid="context-menu"],
    [data-testid="context-menu"][data-testid="context-menu"]:hover,
    [data-testid="context-menu"][data-testid="context-menu"]:active,
    [data-testid="context-menu"][data-testid="context-menu"]:focus {
      background: transparent !important;
      box-shadow: none !important;
      outline: none !important;
      border: none !important;
    }
    
    /* Restore keyboard focus indicator for accessibility */
    [data-testid="context-menu"][data-testid="context-menu"]:focus-visible {
      outline: 2px solid ${isDark ? '#e5e7eb' : brand.primary} !important;
      outline-offset: 2px;
    }
    
    /* Sidebar item hover - row level so hovering 3-dot also highlights the row */
    [data-nodetype]:not([data-selected="true"]):hover {
      background-color: ${isDark ? `${brand.primary}20` : `${brand.primary}10`} !important;
    }
    
    /* Toolbar selected button */
    [role="toolbar"] button[aria-pressed="true"],
    [role="toolbar"] button[data-active="true"] {
      color: ${brand.primary} !important;
    }

    /* Brand-theme switcher reflects the active brand (higher specificity than
       the generic muted toolbar-button rule, so it wins in both light/dark). */
    [role="toolbar"] button[aria-label*="brand themes"],
    [class*="toolbar"] button[aria-label*="brand themes"],
    [class*="bar"] button[aria-label*="brand themes"] {
      color: ${brand.primary} !important;
    }
    
    /* Links */
    a[href]:hover {
      color: ${brand.primary} !important;
    }
    
    /* Focus rings */
    *:focus-visible {
      outline-color: ${brand.primary} !important;
    }
    
    /* Control buttons in addon panel (args table) */
    .docblock-argstable button,
    .docblock-argstable-body button {
      background-color: ${brand.primary} !important;
      border-color: ${brand.secondary} !important;
      color: #ffffff !important;
    }
    
    /* Ensure hover state also has white text */
    .docblock-argstable button:hover,
    .docblock-argstable-body button:hover {
      color: #ffffff !important;
    }
    
    /* Progress indicators and spinners */
    [role="progressbar"] {
      background-color: ${brand.primary} !important;
    }
    
    /* Onboarding checklist progress */
    [class*="progress"] {
      stroke: ${brand.primary} !important;
    }
    
    /* Tab underline */
    [role="tab"][aria-selected="true"]::after {
      background-color: ${brand.primary} !important;
    }
    
    /* ============================================
       DARK MODE OVERRIDES FOR MANAGER UI
       ============================================ */
    ${isDark ? `
    /*
     * Sidebar background - The :not() exclusions are necessary because
     * sidebar-item elements also match [class*="sidebar"] (they have
     * class="sidebar-item"). Without these, the !important bg override
     * would clobber both the selected state and hover highlights.
     */
    [class*="sidebar"]:not([data-selected="true"]):not(:hover) {
      background-color: ${bgColor} !important;
    }
    
    /* Main content area */
    [class*="main"] {
      background-color: ${contentBg} !important;
    }
    
    /* Panel/addons area */
    [class*="panel"] {
      background-color: ${barBg} !important;
    }
    
    /* All text in sidebar */
    [class*="sidebar"] span,
    [class*="sidebar"] button,
    [class*="sidebar"] a {
      color: ${textColor} !important;
    }
    
    /* Toolbar */
    [role="toolbar"],
    [class*="toolbar"] {
      background-color: ${barBg} !important;
      border-color: ${borderColor} !important;
    }
    
    [role="toolbar"] button,
    [class*="toolbar"] button {
      color: ${textMuted} !important;
    }
    
    /* Input fields */
    input, select, textarea {
      background-color: ${inputBg} !important;
      border-color: ${inputBorder} !important;
      color: ${textColor} !important;
    }
    
    /* Dividers */
    hr, [class*="separator"], [class*="divider"] {
      border-color: ${borderColor} !important;
      background-color: ${borderColor} !important;
    }
    
    /* ============================================
       BOOLEAN TOGGLE CONTROL FIX
       The toggle has dark bg that hides text
       ============================================ */
    /* Toggle switch background */
    label[for^="control-"] {
      background-color: #52525b !important;
    }
    
    /* "False" span (left side, selected by default) */
    label[for^="control-"] > span:first-of-type {
      color: #e4e4e7 !important;
      background-color: #71717a !important;
    }
    
    /* "True" span (right side, unselected by default) */
    label[for^="control-"] > span:last-of-type {
      color: #a1a1aa !important;
    }
    
    /* When checked: "True" becomes active */
    label[for^="control-"] input:checked ~ span:last-of-type {
      color: #e4e4e7 !important;
      background-color: #71717a !important;
    }
    
    label[for^="control-"] input:checked ~ span:first-of-type {
      background-color: transparent !important;
      color: #a1a1aa !important;
    }
    
    /* Make checkbox input transparent so it doesn't cover text */
    label[for^="control-"] input[type="checkbox"] {
      background: transparent !important;
    }
    ` : ''}
  `;
  
  document.head.appendChild(style);
}

// Listen for global changes to update manager theme
addons.register('mieweb-brand-sync', (api) => {
  // Get initial brand from URL or use default
  const initialGlobals = api.getGlobals();
  const initialBrand = (initialGlobals?.brand || 'bluehive') as BrandKey;
  const initialDark = initialGlobals?.theme === 'dark';
  
  // Apply initial theme
  injectBrandCSS(initialBrand, initialDark);
  if (initialDark) {
    api.setOptions({ theme: createBrandTheme(initialBrand, true) });
  }
  
  // Listen for global changes
  api.on('globalsUpdated', ({ globals }) => {
    const brand = (globals?.brand || 'bluehive') as BrandKey;
    const isDark = globals?.theme === 'dark';
    
    // Update CSS and theme
    injectBrandCSS(brand, isDark);
    api.setOptions({ theme: createBrandTheme(brand, isDark) });
  });
});

// Redirect old/broken story bookmarks to the Introduction page
addons.register('mieweb-404-redirect', (api) => {
  const FALLBACK_ID = 'introduction--docs';

  const selectFallbackIfAvailable = () => {
    const fallbackStory = api.getData?.(FALLBACK_ID as any);
    if (fallbackStory) {
      api.selectStory(FALLBACK_ID);
    }
  };

  api.on('storyMissing', () => {
    selectFallbackIfAvailable();
  });

  // Poll for a limited time on initial load so slower environments
  // don't trigger an unnecessary redirect.
  const MAX_WAIT_MS = 5000;
  const POLL_INTERVAL_MS = 200;
  let elapsedMs = 0;

  const pollForStory = setInterval(() => {
    const current = api.getCurrentStoryData();

    if (current) {
      clearInterval(pollForStory);
      return;
    }

    elapsedMs += POLL_INTERVAL_MS;

    if (elapsedMs >= MAX_WAIT_MS) {
      clearInterval(pollForStory);
      selectFallbackIfAvailable();
    }
  }, POLL_INTERVAL_MS);
});

// Storybook 10 moved "Open canvas in new tab" into the Share menu; restore a
// one-click toolbar button that opens the bare story iframe (current globals
// preserved) in a new tab.
addons.register('mieweb-open-in-new-tab', (api) => {
  addons.add('mieweb-open-in-new-tab/tool', {
    type: types.TOOLEXTRA,
    title: 'Open canvas in new tab',
    match: ({ viewMode, tabId }) => viewMode === 'story' && !tabId,
    render: () =>
      React.createElement(
        IconButton,
        {
          key: 'mieweb-open-in-new-tab',
          title: 'Open canvas in new tab',
          'aria-label': 'Open canvas in new tab',
          onClick: () => {
            const { storyId } = api.getUrlState();
            if (!storyId) return;
            const url = new URL('iframe.html', window.location.href);
            url.searchParams.set('id', storyId);
            url.searchParams.set('viewMode', 'story');
            // Only forward this project's toolbar globals (see preview.tsx
            // globalTypes); tool globals (measure/outline) and object-valued
            // globals (viewport, backgrounds, a11y) must not follow the story
            // into the popped-out tab.
            const FORWARDED_GLOBALS = new Set([
              'brand',
              'theme',
              'density',
              'locale',
            ]);
            const globalsParam = Object.entries(api.getGlobals() ?? {})
              .filter(([key]) => FORWARDED_GLOBALS.has(key))
              .map(([key, value]) => `${key}:${value}`)
              .join(';');
            if (globalsParam) url.searchParams.set('globals', globalsParam);
            window.open(url.toString(), '_blank', 'noopener,noreferrer');
          },
        },
        React.createElement(ShareAltIcon)
      ),
  });
});
