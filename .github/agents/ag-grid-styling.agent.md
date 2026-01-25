# AG Grid Comprehensive Styling Guide for Design System Integration

## Overview

AG Grid provides a comprehensive theming system built around **themes**, **parameters**, and **parts**. This system is designed to be highly customizable while maintaining performance and consistency across different applications.

### Key Concepts

- **Themes**: Pre-configured sets of styles with parameters and parts
- **Parameters**: Configuration values affecting grid appearance (colors, spacing, fonts)
- **Parts**: Modular style components for specific features (icons, inputs, colors)
- **CSS Variables**: Runtime-customizable styling via CSS custom properties

## Built-in Themes & Foundation

### Available Themes

1. **Quartz** (Default)
   - High contrast, generous padding
   - Uses IBM Plex Sans font if available
   - Modern design with excellent readability

2. **Balham**
   - Traditional spreadsheet-like appearance
   - More compact design
   - Business-focused aesthetic

3. **Material**
   - Google Material Design v2 compliant
   - Uses Roboto font if available
   - Clean, minimal design with lots of white space

4. **Alpine**
   - Legacy default theme (pre-Quartz)
   - Maintained for migration compatibility

### Theme Implementation

```typescript
import { themeQuartz, themeBalham, themeMaterial } from 'ag-grid-community';

const gridOptions = {
    theme: themeQuartz,
    // ... other options
};
```

### Font Loading

```typescript
const gridOptions = {
    theme: themeQuartz,
    loadThemeGoogleFonts: true, // Automatically loads theme fonts from Google CDN
};
```

## Theme Parameters System

### Parameter Types & Extended Syntax

Parameters follow a suffix-based type system for validation and IDE support:

#### Length Values
- **Suffixes**: Width, Height, Padding, Spacing (or no suffix)
- **Supported values**:
  ```typescript
  {
    spacing: 4,                           // Number = pixels
    headerHeight: '30px',                 // CSS length value
    rowHeight: { ref: 'spacing' },        // Reference other parameters
    cellPadding: { calc: '2 * spacing' }  // CSS calc with parameters
  }
  ```

#### Color Values
- **Suffix**: Color
- **Supported values**:
  ```typescript
  {
    accentColor: '#2196F3',                    // CSS color
    backgroundColor: { ref: 'accentColor' },    // Reference
    hoverColor: { ref: 'accentColor', mix: 0.25 }, // Mix with transparency
    borderColor: { ref: 'foregroundColor', mix: 0.15, onto: 'backgroundColor' }
  }
  ```

#### Border Values
- **Suffix**: Border
- **Supported values**:
  ```typescript
  {
    rowBorder: true,                        // Default border
    columnBorder: false,                    // No border
    headerBorder: '1px solid red',          // CSS border
    cellBorder: {                           // Object notation
      width: 2,
      style: 'dashed',
      color: 'blue'
    }
  }
  ```

### Key Parameters for Design Systems

#### Core Colors
```typescript
const myTheme = themeQuartz.withParams({
  backgroundColor: 'rgb(249, 245, 227)',    // Page background
  foregroundColor: 'rgb(126, 46, 132)',     // Text color
  accentColor: '#2196F3',                   // Brand/highlight color
  borderColor: 'rgba(0, 0, 0, 0.12)',      // Default border color
});
```

#### Layout & Spacing
```typescript
const myTheme = themeQuartz.withParams({
  spacing: 8,                               // Base spacing unit
  rowHeight: '48px',                        // Fixed row height
  headerHeight: '56px',                     // Header height
  rowVerticalPaddingScale: 1.2,             // Scale padding
});
```

#### Typography
```typescript
const myTheme = themeQuartz.withParams({
  fontFamily: ['Inter', 'system-ui', 'sans-serif'],
  fontSize: '14px',
  headerFontSize: '16px',
  headerFontWeight: '600',
});
```

### Finding Parameters

1. **Theme Builder**: Use the [online theme builder](https://ag-grid.com/theme-builder/) to explore all parameters
2. **TypeScript Autocomplete**: IDE shows available parameters with documentation
3. **Developer Tools**: CSS custom properties in browser dev tools (e.g., `--ag-spacing`)

## Theme Parts & Modularity

### Part System Overview

Parts are modular components that handle specific features:

```typescript
import { 
  themeQuartz, 
  colorSchemeDark, 
  iconSetMaterial,
  inputStyleUnderlined 
} from 'ag-grid-community';

const myTheme = themeQuartz
  .withPart(colorSchemeDark)        // Dark color scheme
  .withPart(iconSetMaterial)        // Material icons
  .withPart(inputStyleUnderlined);  // Material-style inputs
```

### Available Parts by Feature

#### Color Schemes
- `colorSchemeVariable` - Default, mode-responsive
- `colorSchemeLight` - Neutral light
- `colorSchemeLightWarm`/`colorSchemeLightCold` - Tinted light schemes
- `colorSchemeDark` - Neutral dark
- `colorSchemeDarkBlue` - Blue-tinted dark (used on AG Grid website)

#### Icon Sets
- `iconSetQuartz` - Default icons (customizable stroke width)
- `iconSetMaterial` - Material Design icons
- `iconSetAlpine` - Alpine theme icons
- `iconSetBalham` - Balham theme icons

#### Input Styles
- `inputStyleBase` - Unstyled base
- `inputStyleBordered` - Bordered inputs
- `inputStyleUnderlined` - Material Design style

#### Button & UI Styles
- `buttonStyleQuartz`, `buttonStyleAlpine`, `buttonStyleBalham`
- `tabStyleQuartz`, `tabStyleMaterial`, `tabStyleRolodex`
- `checkboxStyleDefault`

### Creating Custom Parts

```typescript
import { createPart } from 'ag-grid-community';

const customCheckboxPart = createPart({
  feature: 'checkboxStyle',
  params: {
    checkboxBorderRadius: '4px',
    checkboxSelectedColor: { ref: 'accentColor' },
  },
  css: `
    .ag-checkbox-input-wrapper {
      border-radius: var(--ag-checkbox-border-radius);
      transition: all 0.2s ease;
    }
    .ag-checkbox-input-wrapper.ag-checked {
      background-color: var(--ag-checkbox-selected-color);
    }
  `
});
```

## CSS Variables & Custom Properties

### Runtime Customization

All theme parameters are implemented as CSS custom properties with `--ag-` prefix and kebab-case naming:

```css
:root {
  /* Override theme parameters globally */
  --ag-background-color: #ffffff;
  --ag-foreground-color: #333333;
  --ag-accent-color: #2196f3;
  --ag-spacing: 8px;
  --ag-row-height: 48px;
  --ag-header-height: 56px;
}

/* Target specific grid instances */
.my-custom-grid {
  --ag-accent-color: #ff5722;
  --ag-spacing: 12px;
}
```

### Integration with App Variables

```css
:root {
  /* Your design system variables */
  --primary-color: #2196f3;
  --text-color: #333;
  --spacing-unit: 8px;
  
  /* Map to AG Grid variables */
  --ag-accent-color: var(--primary-color);
  --ag-foreground-color: var(--text-color);
  --ag-spacing: var(--spacing-unit);
}
```

## Advanced Styling Techniques

### Custom CSS Rules

Target grid elements using CSS class selectors:

```css
/* Header customization */
.ag-theme-quartz .ag-header {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.ag-theme-quartz .ag-header-cell-text {
  font-weight: 600;
  text-transform: uppercase;
}

/* Row styling */
.ag-theme-quartz .ag-row-even {
  background-color: rgba(0, 0, 0, 0.02);
}

.ag-theme-quartz .ag-row-hover {
  background-color: rgba(33, 150, 243, 0.1);
}
```

### Dynamic Styling Classes

```css
/* Conditional styling based on data */
.ag-theme-quartz .ag-cell.cell-error {
  background-color: #ffebee;
  color: #c62828;
  border-left: 3px solid #f44336;
}

.ag-theme-quartz .ag-cell.cell-success {
  background-color: #e8f5e8;
  color: #2e7d32;
}

/* Status-based row styling */
.ag-theme-quartz .ag-row.row-inactive {
  opacity: 0.6;
}
```

### Responsive Design Patterns

```css
.ag-theme-quartz {
  /* Mobile optimization */
  @media (max-width: 768px) {
    --ag-row-height: 56px;
    --ag-header-height: 64px;
    --ag-spacing: 12px;
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  /* Tablet adjustments */
  @media (min-width: 769px) and (max-width: 1024px) {
    --ag-spacing: 10px;
  }
  
  /* Desktop optimizations */
  @media (min-width: 1025px) {
    --ag-spacing: 8px;
  }
}

/* Hide/show columns based on screen size */
@media (max-width: 768px) {
  .ag-theme-quartz .ag-header-cell[col-id="description"],
  .ag-theme-quartz .ag-cell[col-id="description"] {
    display: none;
  }
}
```

## Color Management & Dark Mode

### Theme Modes

Use `data-ag-theme-mode` attribute for dynamic theme switching:

```html
<body data-ag-theme-mode="dark">
  <!-- Grid will use dark colors automatically -->
</body>
```

```typescript
// Custom theme modes
const myTheme = themeQuartz
  .withParams({
    backgroundColor: '#ffffff',
    foregroundColor: '#333333',
    accentColor: '#2196f3',
  }, 'light')
  .withParams({
    backgroundColor: '#1a1a1a',
    foregroundColor: '#ffffff',
    accentColor: '#64b5f6',
  }, 'dark');
```

```javascript
// Runtime theme switching
function toggleTheme(isDark) {
  document.body.setAttribute('data-ag-theme-mode', isDark ? 'dark' : 'light');
}
```

### Color System Best Practices

```typescript
const designSystemTheme = themeQuartz.withParams({
  // Primary brand colors
  backgroundColor: 'var(--ds-surface-primary)',
  foregroundColor: 'var(--ds-text-primary)',
  accentColor: 'var(--ds-color-primary)',
  
  // Semantic colors
  dataBackgroundColor: 'var(--ds-surface-secondary)',
  headerBackgroundColor: 'var(--ds-surface-elevated)',
  
  // Interactive states
  cellHoverBackgroundColor: 'var(--ds-surface-hover)',
  rowHoverBackgroundColor: 'var(--ds-surface-hover)',
  selectedBackgroundColor: 'var(--ds-surface-selected)',
  
  // Borders and dividers
  borderColor: 'var(--ds-border-default)',
  headerColumnBorder: 'var(--ds-border-subtle)',
  
  // Status colors
  invalidColor: 'var(--ds-color-error)',
  successColor: 'var(--ds-color-success)',
  warningColor: 'var(--ds-color-warning)',
});
```

## Headers, Cells, Filters & Components

### Header Customization

```typescript
const headerTheme = themeQuartz.withParams({
  // Header dimensions
  headerHeight: '56px',
  headerVerticalPaddingScale: 1.5,
  
  // Header colors
  headerBackgroundColor: '#f5f5f5',
  headerTextColor: '#333',
  headerCellHoverBackgroundColor: 'rgba(0, 0, 0, 0.05)',
  
  // Header borders and separators
  headerColumnBorder: { width: 1, style: 'solid', color: '#e0e0e0' },
  headerColumnBorderHeight: '60%',
  headerColumnResizeHandleColor: '#2196f3',
  headerColumnResizeHandleWidth: '3px',
  
  // Header typography
  headerFontWeight: '600',
  headerFontSize: '14px',
});
```

### Cell Styling

```css
/* Cell states */
.ag-theme-quartz .ag-cell-focus {
  border: 2px solid var(--ag-accent-color);
  outline: none;
}

.ag-theme-quartz .ag-cell-inline-editing {
  background-color: #fff3e0;
  padding: 0;
}

.ag-theme-quartz .ag-cell-data-changed {
  background-color: rgba(76, 175, 80, 0.1);
}

/* Cell content alignment */
.ag-theme-quartz .ag-cell.number-cell {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ag-theme-quartz .ag-cell.center-align {
  text-align: center;
}
```

### Filter Styling

```css
/* Filter panel */
.ag-theme-quartz .ag-filter-panel {
  background: var(--ag-background-color);
  border: 1px solid var(--ag-border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Filter active indicators */
.ag-theme-quartz .ag-header-cell-filtered {
  position: relative;
}

.ag-theme-quartz .ag-header-cell-filtered::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--ag-accent-color);
}

/* Set filter styling */
.ag-theme-quartz .ag-set-filter-item {
  padding: 8px 12px;
  border-radius: 4px;
}

.ag-theme-quartz .ag-set-filter-item:hover {
  background-color: var(--ag-row-hover-color);
}
```

### Menu & Overlay Components

```css
/* Context menu */
.ag-theme-quartz .ag-menu {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--ag-border-color);
}

.ag-theme-quartz .ag-menu-option {
  padding: 12px 16px;
}

.ag-theme-quartz .ag-menu-option:hover {
  background-color: var(--ag-row-hover-color);
}

/* Tool panels */
.ag-theme-quartz .ag-tool-panel {
  background: var(--ag-chrome-background-color);
  border-left: 1px solid var(--ag-border-color);
}

.ag-theme-quartz .ag-tool-panel-title-bar {
  padding: 16px;
  border-bottom: 1px solid var(--ag-border-color);
  font-weight: 600;
}
```

## Icons & Custom Icon Systems

### Icon Set Integration

```typescript
import { iconSetMaterial, iconOverrides } from 'ag-grid-community';

// Use Material Design icons
const materialTheme = themeQuartz
  .withPart(iconSetMaterial)
  .withParams({
    iconSize: 18, // Material icons work best at 18, 24, 36, 48px
  });

// Custom icon font integration
const fontAwesomeIcons = iconOverrides({
  type: 'font',
  family: 'Font Awesome 6 Pro',
  cssImports: ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'],
  weight: '900',
  icons: {
    asc: '\uf0de',      // fa-sort-up
    desc: '\uf0dd',     // fa-sort-down
    filter: '\uf0b0',   // fa-filter
    menu: '\uf0c9',     // fa-bars
  },
});
```

### SVG Icon System

```typescript
const svgIconOverrides = iconOverrides({
  type: 'image',
  mask: true, // Use grid colors
  icons: {
    filter: {
      svg: `<svg viewBox="0 0 24 24">
        <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"/>
      </svg>`
    },
    // Add more icons as needed
  },
});
```

### Icon Styling with CSS

```css
/* Style provided icons */
.ag-theme-quartz .ag-icon {
  color: var(--ag-foreground-color);
  transition: color 0.2s ease;
}

.ag-theme-quartz .ag-icon:hover {
  color: var(--ag-accent-color);
}

/* Custom icon backgrounds */
.ag-theme-quartz .ag-icon-menu {
  background: var(--ag-accent-color);
  border-radius: 4px;
  padding: 4px;
  color: white;
}

/* Icon size variations */
.ag-theme-quartz .ag-header .ag-icon {
  font-size: 16px;
}

.ag-theme-quartz .ag-cell .ag-icon {
  font-size: 14px;
}
```

## Performance Considerations

### DOM Virtualisation Impact

AG Grid uses DOM virtualisation to render only visible elements:

```typescript
const gridOptions = {
  // Virtualization settings
  rowBuffer: 10,                          // Render extra rows for smooth scrolling
  suppressMaxRenderedRowRestriction: true, // Remove 500 row limit if needed
  suppressColumnVirtualisation: false,     // Keep column virtualization
  suppressRowVirtualisation: false,       // Keep row virtualization
};
```

### CSS Performance Best Practices

```css
/* ✅ Good - Simple selectors */
.ag-theme-quartz .ag-cell {
  transition: background-color 0.15s ease;
}

/* ❌ Avoid - Complex selectors that might break */
.ag-theme-quartz .ag-body .ag-row .ag-cell.my-class {
  /* Complex selector, may break with updates */
}

/* ✅ Good - Use CSS custom properties for dynamic values */
.ag-theme-quartz {
  --cell-border-radius: 4px;
}

.ag-theme-quartz .ag-cell {
  border-radius: var(--cell-border-radius);
}

/* ✅ Good - Efficient animations */
.ag-theme-quartz .ag-cell {
  transition: background-color 0.15s ease;
}

/* ❌ Avoid - Expensive animations */
.ag-theme-quartz .ag-cell {
  transition: all 0.5s ease; /* Don't animate 'all' properties */
}
```

### Theme Bundle Size Optimization

```typescript
// Create minimal theme for smaller bundle size
import { createTheme, colorSchemeLight, iconSetQuartz } from 'ag-grid-community';

const minimalTheme = createTheme()
  .withPart(colorSchemeLight)
  .withPart(iconSetQuartz)
  .withParams({
    accentColor: '#2196f3',
    spacing: 8,
  });
```

### Memory Management

```css
/* Avoid memory leaks with animations */
.ag-theme-quartz .ag-cell-data-changed {
  animation: flash 0.5s ease-out;
  animation-fill-mode: both;
}

@keyframes flash {
  0% { background-color: rgba(76, 175, 80, 0.3); }
  100% { background-color: transparent; }
}
```

## Enterprise vs Community Styling

### Community Features (Free)
- All core theming capabilities
- Theme parameters and parts
- CSS customization
- Icon customization
- Color schemes and dark mode
- Basic cell and header styling

### Enterprise Features (Licensed)
- **Advanced Tool Panels**: Column and filter tool panel styling
- **Context Menus**: Enterprise context menu theming
- **Master/Detail**: Nested grid styling
- **Row Grouping**: Group row and hierarchy styling
- **Pivoting**: Pivot mode styling
- **Charts Integration**: Integrated chart theming
- **Advanced Filtering**: Filter tool panel styling
- **Excel Export**: Export styling options

### Enterprise-Specific Styling

```css
/* Enterprise tool panel styling */
.ag-theme-quartz .ag-tool-panel {
  background: var(--ag-chrome-background-color);
}

.ag-theme-quartz .ag-column-tool-panel {
  min-width: 280px;
}

/* Row grouping styles */
.ag-theme-quartz .ag-group-expanded .ag-icon {
  color: var(--ag-accent-color);
}

.ag-theme-quartz .ag-row-group {
  font-weight: 600;
}

/* Master/detail styling */
.ag-theme-quartz .ag-details-wrapper {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid var(--ag-border-color);
  border-radius: 8px;
  margin: 8px;
}

/* Context menu enterprise styling */
.ag-theme-quartz .ag-menu-header {
  background: var(--ag-header-background-color);
  padding: 12px 16px;
  font-weight: 600;
  border-bottom: 1px solid var(--ag-border-color);
}
```

## Browser Compatibility & Responsive Design

### Browser Support

AG Grid themes support all modern browsers:
- Chrome 70+
- Firefox 63+
- Safari 12+
- Edge 79+

### CSS Grid and Flexbox Usage

```css
/* AG Grid uses modern CSS features */
.ag-theme-quartz {
  /* CSS Grid for layout */
  display: grid;
  grid-template-areas: "header header" "sidebar content";
  
  /* CSS Custom Properties */
  --ag-spacing: 8px;
  
  /* Flexbox for component alignment */
}

.ag-theme-quartz .ag-header-row {
  display: flex;
  align-items: center;
}
```

### Responsive Design Patterns

```css
.ag-theme-quartz {
  /* Container queries when supported */
  @container (max-width: 600px) {
    --ag-row-height: 56px;
    --ag-header-height: 64px;
  }
  
  /* Fallback media queries */
  @media (max-width: 600px) {
    --ag-row-height: 56px;
    --ag-header-height: 64px;
    
    /* Hide less important columns */
    .ag-header-cell[col-id="description"],
    .ag-cell[col-id="description"] {
      display: none;
    }
    
    /* Stack filter controls */
    .ag-filter-panel {
      flex-direction: column;
    }
  }
  
  /* High DPI displays */
  @media (-webkit-min-device-pixel-ratio: 2) {
    /* Adjust for retina displays */
    --ag-icon-size: 20px;
  }
}
```

### Touch Device Optimizations

```css
.ag-theme-quartz {
  /* Touch-friendly sizing */
  @media (pointer: coarse) {
    --ag-row-height: 48px;
    --ag-header-height: 56px;
    --ag-spacing: 12px;
    
    /* Larger touch targets */
    .ag-checkbox-input-wrapper {
      width: 20px;
      height: 20px;
    }
    
    /* Easier scrolling */
    .ag-body-viewport {
      -webkit-overflow-scrolling: touch;
    }
  }
}
```

## Design System Integration Patterns

### Design Token Integration

```typescript
// design-tokens.ts
export const designTokens = {
  colors: {
    primary: '#2196f3',
    surface: '#ffffff',
    onSurface: '#333333',
    border: 'rgba(0, 0, 0, 0.12)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: {
      sm: '14px',
      base: '16px',
      lg: '18px',
    },
  },
};

// ag-grid-theme.ts
import { themeQuartz } from 'ag-grid-community';
import { designTokens } from './design-tokens';

export const appGridTheme = themeQuartz.withParams({
  backgroundColor: designTokens.colors.surface,
  foregroundColor: designTokens.colors.onSurface,
  accentColor: designTokens.colors.primary,
  borderColor: designTokens.colors.border,
  spacing: designTokens.spacing.sm,
  fontFamily: designTokens.typography.fontFamily,
  fontSize: designTokens.typography.fontSize.sm,
});
```

### CSS-in-JS Integration

```typescript
// Styled Components example
import styled from 'styled-components';
import { AgGridReact } from 'ag-grid-react';

const StyledGridWrapper = styled.div`
  .ag-theme-quartz {
    --ag-accent-color: ${props => props.theme.colors.primary};
    --ag-background-color: ${props => props.theme.colors.surface};
    --ag-foreground-color: ${props => props.theme.colors.onSurface};
    --ag-spacing: ${props => props.theme.spacing.sm};
  }
`;

// Emotion example
import { css } from '@emotion/react';

const gridStyles = (theme) => css`
  .ag-theme-quartz {
    --ag-accent-color: ${theme.colors.primary};
    --ag-background-color: ${theme.colors.surface};
    --ag-foreground-color: ${theme.colors.onSurface};
    --ag-spacing: ${theme.spacing.sm};
  }
`;
```

### Component Library Integration

```typescript
// Custom theme component
import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { GridOptions } from 'ag-grid-community';

interface DataGridProps {
  variant?: 'default' | 'compact' | 'comfortable';
  colorScheme?: 'light' | 'dark';
  // ... other props
}

export const DataGrid: React.FC<DataGridProps> = ({ 
  variant = 'default',
  colorScheme = 'light',
  ...props 
}) => {
  const theme = useMemo(() => {
    let baseTheme = appGridTheme;
    
    // Apply variant
    if (variant === 'compact') {
      baseTheme = baseTheme.withParams({ spacing: 4, rowHeight: '32px' });
    } else if (variant === 'comfortable') {
      baseTheme = baseTheme.withParams({ spacing: 12, rowHeight: '56px' });
    }
    
    // Apply color scheme
    if (colorScheme === 'dark') {
      baseTheme = baseTheme.withPart(colorSchemeDark);
    }
    
    return baseTheme;
  }, [variant, colorScheme]);

  return (
    <div className={`data-grid-wrapper data-grid-${variant} data-grid-${colorScheme}`}>
      <AgGridReact theme={theme} {...props} />
    </div>
  );
};
```

## Best Practices & Implementation Guidelines

### Theme Organization

```
themes/
├── base/
│   ├── tokens.ts           # Design tokens
│   ├── parameters.ts       # Common parameters
│   └── parts.ts           # Custom parts
├── variants/
│   ├── default.ts         # Default theme variant
│   ├── compact.ts         # Compact variant
│   └── comfortable.ts     # Comfortable variant
├── custom-css/
│   ├── headers.css        # Header customizations
│   ├── cells.css          # Cell customizations
│   └── components.css     # Component customizations
└── index.ts               # Theme exports
```

### CSS Architecture

```css
/* 1. Design system variables */
:root {
  --ds-color-primary: #2196f3;
  --ds-color-surface: #ffffff;
  --ds-spacing-unit: 8px;
}

/* 2. AG Grid variable mapping */
:root {
  --ag-accent-color: var(--ds-color-primary);
  --ag-background-color: var(--ds-color-surface);
  --ag-spacing: var(--ds-spacing-unit);
}

/* 3. Component-specific overrides */
.ag-theme-custom {
  /* Organized by component */
}

/* 4. Utility classes */
.grid-compact { --ag-spacing: 4px; }
.grid-comfortable { --ag-spacing: 12px; }
```

### Development Workflow

1. **Start with a Built-in Theme**: Choose the closest match to your design
2. **Map Design Tokens**: Align AG Grid parameters with your design system
3. **Create Custom Parts**: For reusable component styles
4. **Progressive Enhancement**: Add CSS overrides for specific requirements
5. **Test Across Browsers**: Ensure compatibility and performance
6. **Document Customizations**: Maintain upgrade compatibility

### Testing Strategy

```typescript
// Theme testing utilities
export const themeTestUtils = {
  // Test color contrast ratios
  checkContrast: (backgroundColor: string, textColor: string) => {
    // Implementation for WCAG compliance testing
  },
  
  // Validate responsive breakpoints
  testResponsiveness: (theme: Theme) => {
    // Test theme at different viewport sizes
  },
  
  // Performance benchmarking
  measureRenderTime: (gridOptions: GridOptions) => {
    // Measure initial render and scroll performance
  },
};
```

### Maintenance Guidelines

1. **Version Compatibility**: Test themes with each AG Grid update
2. **CSS Validation**: Avoid overriding critical layout properties
3. **Performance Monitoring**: Watch for style recalculation costs
4. **Documentation**: Keep customization notes for future maintenance
5. **Fallback Strategies**: Provide degraded experiences for older browsers

### Common Pitfalls to Avoid

```css
/* ❌ Don't override critical layout properties */
.ag-theme-quartz .ag-body-viewport {
  overflow: visible; /* Breaks virtualization */
}

/* ❌ Don't use overly complex selectors */
.ag-theme-quartz .ag-root .ag-body .ag-row:nth-child(odd) .ag-cell {
  /* Too complex, may break with updates */
}

/* ❌ Don't animate expensive properties */
.ag-theme-quartz .ag-cell {
  transition: all 0.3s ease; /* Animates layout properties */
}

/* ✅ Do use simple, stable selectors */
.ag-theme-quartz .ag-cell {
  transition: background-color 0.15s ease;
}

/* ✅ Do respect the CSS custom property system */
.ag-theme-quartz {
  --ag-odd-row-background-color: rgba(0, 0, 0, 0.02);
}
```

## Conclusion

AG Grid's theming system provides comprehensive tools for design system integration through its three-pillar approach: **themes**, **parameters**, and **parts**. By leveraging CSS custom properties, modular parts system, and extensive customization options, you can create consistent, maintainable, and performant data grid experiences that align perfectly with your design system.

The key to successful implementation is starting with the appropriate built-in theme, mapping your design tokens to AG Grid parameters, and progressively enhancing with custom CSS while respecting the grid's architecture and performance characteristics.
- `--mieweb-shadow-card` - Card shadow

### Tailwind Preset Mappings

The `tailwind-preset.ts` maps CSS variables to Tailwind classes:

| Tailwind Class | CSS Variable |
|---------------|--------------|
| `primary-500` | `var(--mieweb-primary-500)` |
| `secondary-500` | `var(--mieweb-secondary-500)` |
| `neutral-500` | `var(--mieweb-neutral-500)` |
| `rounded-lg` | `var(--mieweb-radius-lg)` |
| `rounded-2xl` | `var(--mieweb-radius-2xl)` |
| `font-sans` | `var(--mieweb-font-sans)` |

## What to Flag as Issues

### ❌ Hardcoded Colors (BAD)
```tsx
// These bypass the branding system:
className="bg-violet-500"           // Hardcoded violet
className="bg-purple-600"           // Hardcoded purple  
className="bg-blue-500"             // Hardcoded blue
className="text-indigo-600"         // Hardcoded indigo
className="from-violet-500 to-purple-600"  // Hardcoded gradients
```

### ✅ Brand-Aware Colors (GOOD)
```tsx
// These respect the active brand:
className="bg-primary-500"          // Uses brand primary
className="text-primary-600"        // Uses brand primary
className="bg-secondary-500"        // Uses brand secondary
className="text-neutral-700"        // Uses brand neutral
```

### Exceptions - Semantic Colors (OKAY)
These are intentionally hardcoded for consistent meaning across brands:
- `bg-red-*`, `text-red-*` - Error/danger states
- `bg-green-*`, `text-green-*` - Success states  
- `bg-amber-*`, `bg-yellow-*` - Warning states
- `bg-neutral-*` - Only if specifically for UI chrome, not brand expression

### Border Radius Issues
```tsx
// Check if these use brand radius variables:
className="rounded-lg"   // ✅ Mapped to --mieweb-radius-lg
className="rounded-2xl"  // ✅ Mapped to --mieweb-radius-2xl
className="rounded-full" // ✅ OK for circular elements (avatars, pills)
className="rounded-[20px]" // ❌ Hardcoded - should use brand token
```

## Audit Process

When auditing a component or directory:

1. **Search for hardcoded color patterns:**
   - `bg-violet-`, `bg-purple-`, `bg-blue-`, `bg-indigo-`
   - `text-violet-`, `text-purple-`, `text-blue-`, `text-indigo-`
   - `from-violet-`, `from-purple-`, `to-violet-`, `to-purple-`
   - `border-violet-`, `border-purple-`, `ring-violet-`, `ring-purple-`

2. **Verify brand color usage:**
   - Primary actions should use `primary-*`
   - Secondary actions should use `secondary-*`
   - Text should use `neutral-*` for body text

3. **Check border radius consistency:**
   - Look for hardcoded pixel values like `rounded-[16px]`
   - Verify modal/card containers use `rounded-2xl` or `rounded-xl`

4. **Review gradients:**
   - Gradients with hardcoded colors should be converted to solid `primary-*` colors
   - Or use CSS variables directly

## Output Format

When reporting issues, use this format:

### 🔍 Audit Results for `ComponentName`

**File:** `src/components/ComponentName/ComponentName.tsx`

| Line | Issue | Current | Recommended |
|------|-------|---------|-------------|
| 45 | Hardcoded color | `bg-violet-500` | `bg-primary-500` |
| 67 | Hardcoded gradient | `from-violet-500 to-purple-600` | `bg-primary-500` |

**Summary:**
- ✅ Border radius: Using brand tokens correctly
- ❌ Colors: 2 hardcoded colors found
- ✅ Typography: Using font-sans correctly

## Brand Reference

| Brand | Primary Color | Example |
|-------|---------------|---------|
| BlueHive | Blue `#27aae1` | Healthcare/Medical |
| MIEWeb | Purple | Enterprise |
| WebChart | Blue | Clinical |
| Enterprise Health | Teal | Corporate |
| Waggleline | Orange | Consumer |

## Key Files to Reference

- `src/tailwind-preset.ts` - Tailwind class mappings
- `src/brands/*.css` - Brand-specific CSS variables
- `src/brands/types.ts` - TypeScript brand definitions
