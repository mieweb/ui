import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

// Brand theme configurations for the Storybook manager UI
const brandThemes = {
  bluehive: {
    name: 'BlueHive',
    primary: '#27aae1',
    secondary: '#1f98ca',
    appBg: '#f0f9ff',
    borderColor: '#b3e6f6',
  },
  mieweb: {
    name: 'MIE Web',
    primary: '#27ae60',
    secondary: '#219c55',
    appBg: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  webchart: {
    name: 'WebChart',
    primary: '#f5841f',
    secondary: '#ea580c',
    appBg: '#fff7ed',
    borderColor: '#fed7aa',
  },
  'enterprise-health': {
    name: 'Enterprise Health',
    primary: '#9333ea',
    secondary: '#7c3aed',
    appBg: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  default: {
    name: 'Default',
    primary: '#6b7280',
    secondary: '#4b5563',
    appBg: '#f9fafb',
    borderColor: '#e5e7eb',
  },
};

type BrandKey = keyof typeof brandThemes;

// Create a theme for a specific brand
function createBrandTheme(brandKey: BrandKey) {
  const brand = brandThemes[brandKey] || brandThemes.bluehive;
  
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

function injectBrandCSS(brandKey: BrandKey) {
  const brand = brandThemes[brandKey] || brandThemes.bluehive;
  
  // Remove existing style
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create new style with brand colors
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Dynamic brand theming for Storybook manager */
    :root {
      --mieweb-manager-primary: ${brand.primary};
      --mieweb-manager-secondary: ${brand.secondary};
      --mieweb-manager-bg: ${brand.appBg};
      --mieweb-manager-border: ${brand.borderColor};
    }
    
    /* Selected story item highlight */
    [data-selected="true"] {
      background-color: ${brand.primary}15 !important;
    }
    
    [data-selected="true"]::before {
      background-color: ${brand.primary} !important;
    }
    
    /* Sidebar item hover */
    [data-nodetype] button:hover,
    [data-nodetype] a:hover {
      background-color: ${brand.primary}10 !important;
    }
    
    /* Toolbar selected button */
    [role="toolbar"] button[aria-pressed="true"],
    [role="toolbar"] button[data-active="true"] {
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
    
    /* Control buttons */
    [data-testid="controls-panel"] button {
      background-color: ${brand.primary} !important;
      border-color: ${brand.secondary} !important;
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
  `;
  
  document.head.appendChild(style);
}

// Listen for global changes to update manager theme
addons.register('mieweb-brand-sync', (api) => {
  // Get initial brand from URL or use default
  const initialGlobals = api.getGlobals();
  const initialBrand = (initialGlobals?.brand || 'bluehive') as BrandKey;
  injectBrandCSS(initialBrand);
  
  // Listen for global changes
  api.on('globalsUpdated', ({ globals }) => {
    const brand = (globals?.brand || 'bluehive') as BrandKey;
    injectBrandCSS(brand);
  });
});
