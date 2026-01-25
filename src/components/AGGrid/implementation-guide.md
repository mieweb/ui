# AG Grid Design System Implementation Guide

This guide shows how to use the enhanced AG Grid components with full design system integration.

## 🚀 Quick Start

### Basic Usage

```typescript
import { AGGrid, EnhancedStatusBadgeRenderer, EnhancedActionsRenderer } from '@mieweb/ui';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/agGridQuartzFont.css';

const columnDefs = [
  { headerName: 'Name', field: 'name' },
  { 
    headerName: 'Status', 
    field: 'status', 
    cellRenderer: EnhancedStatusBadgeRenderer 
  },
  {
    headerName: 'Actions',
    colId: 'actions',
    cellRenderer: EnhancedActionsRenderer,
    cellRendererParams: {
      onEdit: (data) => console.log('Edit:', data),
      onDelete: (data) => console.log('Delete:', data),
    }
  }
];

const MyComponent = () => (
  <AGGrid
    columnDefs={columnDefs}
    rowData={data}
    brand="mieweb"
    variant="bordered"
    size="md"
    height={400}
  />
);
```

### Brand-Aware Grid

```typescript
import { AGGrid, useAGGridBrandTheme } from '@mieweb/ui';

const BrandAwareGrid = ({ brand = 'mieweb' }) => {
  const { brandConfig, cssClass, cssVariables } = useAGGridBrandTheme({
    brand,
    darkMode: false,
  });

  return (
    <AGGrid
      columnDefs={columnDefs}
      rowData={data}
      brand={brand}
      brandConfig={brandConfig}
      className={cssClass}
      style={cssVariables}
    />
  );
};
```

## 🎨 Brand Support

### Available Brands
- `mieweb` - Medical Informatics Engineering (Green #27ae60)
- `bluehive` - BlueHive (Blue #17aeed) 
- `waggleline` - Waggleline (Green #009c4e)
- `webchart` - WebChart (Blue #3b82f6)
- `enterprise-health` - Enterprise Health (Emerald #059669)

### Dynamic Brand Switching

```typescript
import { injectAGGridBrandStyles } from '@mieweb/ui';

// Inject custom brand styles
const switchBrand = (brandConfig) => {
  injectAGGridBrandStyles(brandConfig, 'my-custom-brand');
};
```

## 📊 Enhanced Cell Renderers

### Status Badge Renderer
```typescript
{
  headerName: 'Status',
  field: 'status',
  cellRenderer: EnhancedStatusBadgeRenderer,
  // Automatically maps: active->success, pending->warning, inactive->destructive
}
```

### Avatar Name Renderer
```typescript
{
  headerName: 'User',
  field: 'name', // Also reads data.email and data.avatar
  cellRenderer: EnhancedAvatarNameRenderer,
}
```

### Actions Renderer
```typescript
{
  headerName: 'Actions',
  colId: 'actions',
  cellRenderer: EnhancedActionsRenderer,
  cellRendererParams: {
    showEdit: true,
    showDelete: true,
    showView: false,
    onEdit: (data) => handleEdit(data),
    onDelete: (data) => handleDelete(data),
    customActions: [
      {
        label: 'Export',
        onClick: (data) => handleExport(data),
        variant: 'outline',
      }
    ]
  }
}
```

### Currency Renderer
```typescript
{
  headerName: 'Salary',
  field: 'salary',
  cellRenderer: EnhancedCurrencyRenderer,
  cellRendererParams: { currency: 'USD' },
}
```

### Date Renderer
```typescript
{
  headerName: 'Created',
  field: 'createdAt',
  cellRenderer: EnhancedDateRenderer,
  cellRendererParams: { 
    format: 'medium' // 'short', 'medium', 'long', 'time'
  },
}
```

### Progress Renderer
```typescript
{
  headerName: 'Progress',
  field: 'progress', // 0-100
  cellRenderer: EnhancedProgressRenderer,
}
```

### Boolean Renderer
```typescript
{
  headerName: 'Active',
  field: 'isActive',
  cellRenderer: EnhancedBooleanRenderer, // Shows ✓/✕ with colors
}
```

### Tags Renderer
```typescript
{
  headerName: 'Skills',
  field: 'skills', // string[]
  cellRenderer: EnhancedTagsRenderer, // Shows badges, +N more
}
```

## 🎛️ Component Variants

### Visual Variants
```typescript
// Default - clean, minimal styling
<AGGrid variant="default" />

// Bordered - adds border around grid
<AGGrid variant="bordered" />

// Striped - alternating row backgrounds
<AGGrid variant="striped" />

// Card - elevated appearance with shadow
<AGGrid variant="card" />
```

### Size Variants
```typescript
// Extra small - very compact
<AGGrid size="xs" />

// Small - compact for dense data
<AGGrid size="sm" />

// Medium - default comfortable size
<AGGrid size="md" />

// Large - spacious for readability
<AGGrid size="lg" />

// Extra large - maximum spacing
<AGGrid size="xl" />
```

## 📱 Responsive Features

### Mobile Optimization
The grid automatically adjusts for mobile devices:
- Touch-friendly row heights (56px)
- Larger font size (16px) to prevent iOS zoom
- Optimized scrollbars
- Reduced padding on smaller screens

### Column Priority System
```typescript
import { createResponsiveColumn } from '@mieweb/ui';

const responsiveColumns = [
  createResponsiveColumn(
    { headerName: 'Name', field: 'name' },
    { priority: 'high' } // Always visible
  ),
  createResponsiveColumn(
    { headerName: 'Email', field: 'email' },
    { priority: 'medium', hideOnMobile: true }
  ),
  createResponsiveColumn(
    { headerName: 'Notes', field: 'notes' },
    { priority: 'low', hideOnTablet: true }
  ),
];
```

## 🔧 Advanced Customization

### Custom Theme CSS Variables
```css
.my-custom-ag-grid {
  --ag-primary-color: #your-brand-color;
  --ag-font-family: 'Your Font', sans-serif;
  --ag-row-height: 60px;
  --ag-border-radius: 12px;
}
```

### Brand-Aware Column Definitions
```typescript
import { createBrandAwareColumnDef, applyBrandThemeToColumns } from '@mieweb/ui';

// Single column
const brandColumn = createBrandAwareColumnDef(
  { headerName: 'Name', field: 'name' },
  brandConfig
);

// All columns
const brandColumns = applyBrandThemeToColumns(columnDefs, brandConfig);
```

### Performance Optimization
```typescript
// Pre-load cell renderers for better performance
import { enhancedCellRenderers } from '@mieweb/ui';

const frameworkComponents = {
  statusRenderer: enhancedCellRenderers.statusBadge,
  avatarRenderer: enhancedCellRenderers.avatarName,
  // ... other renderers
};

<AGGrid
  columnDefs={columnDefs}
  frameworkComponents={frameworkComponents}
/>
```

## ♿ Accessibility

### High Contrast Mode
Automatically detected via `prefers-contrast: high`:
- Stronger border colors
- Increased focus indicator thickness
- Better color contrast ratios

### Reduced Motion
Respects `prefers-reduced-motion: reduce`:
- Disables animations
- Reduces transition durations

### Keyboard Navigation
- Full keyboard navigation support
- Focus indicators with brand colors
- Screen reader friendly labels

## 🎯 Best Practices

### 1. Always Import Required Styles
```typescript
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/agGridQuartzFont.css';
// Add your grid component's CSS import here
```

### 2. Use Memoized Renderers
```typescript
// ✅ Good - uses React.memo
import { EnhancedStatusBadgeRenderer } from '@mieweb/ui';

// ❌ Avoid - creates new component on every render
const StatusRenderer = (params) => <Badge>{params.value}</Badge>;
```

### 3. Set Appropriate Column Widths
```typescript
const columnDefs = [
  { field: 'id', width: 80, flex: 0 }, // Fixed width
  { field: 'name', minWidth: 150, flex: 1 }, // Flexible
  { field: 'actions', width: 120, flex: 0, pinned: 'right' }, // Fixed, pinned
];
```

### 4. Handle Loading States
```typescript
<AGGrid
  loading={isLoading}
  loadingMessage="Loading your data..."
  noDataMessage="No records found"
  rowData={data}
/>
```

### 5. Use Brand Context
```typescript
const MyApp = () => (
  <BrandProvider brand="mieweb">
    <AGGrid
      brand="mieweb" // or read from context
      columnDefs={columns}
      rowData={data}
    />
  </BrandProvider>
);
```

## 🚧 Migration from Basic AG Grid

### Step 1: Update Imports
```typescript
// Before
import { AGGrid } from '@mieweb/ui';

// After
import { 
  AGGrid, 
  EnhancedStatusBadgeRenderer,
  useAGGridBrandTheme 
} from '@mieweb/ui';
```

### Step 2: Add Brand Support
```typescript
// Before
<AGGrid columnDefs={columns} rowData={data} />

// After
<AGGrid 
  columnDefs={columns} 
  rowData={data}
  brand="mieweb"
  variant="bordered"
/>
```

### Step 3: Replace Custom Renderers
```typescript
// Before - custom implementation
const StatusCell = ({ value }) => (
  <span className={getStatusClass(value)}>{value}</span>
);

// After - enhanced renderer
{
  field: 'status',
  cellRenderer: EnhancedStatusBadgeRenderer
}
```

This implementation provides a complete, brand-aware, accessible AG Grid solution that integrates seamlessly with your design system while maintaining all of AG Grid's powerful features.