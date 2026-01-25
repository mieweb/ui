// Main AG Grid Component with enhanced brand support
export { AGGrid, AgGridReact } from './AGGrid';
export type {
  AGGridProps,
  ColDef,
  AGColDef,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
  CellClickedEvent,
  CellValueChangedEvent,
  SelectionChangedEvent,
  FilterChangedEvent,
  SortChangedEvent,
  RowSelectedEvent,
  FirstDataRenderedEvent,
} from './AGGrid';

// Original Cell Renderers (backward compatibility)
export {
  CellRenderers,
  // Individual renderers
  AvatarNameRenderer,
  StatusBadgeRenderer,
  EngagementScoreRenderer,
  EmailRenderer,
  PhoneRenderer,
  LinkedInRenderer,
  DomainRenderer,
  CurrencyRenderer,
  NumberRenderer,
  DateRenderer,
  BooleanRenderer,
  CompanyRenderer,
  ProgressRenderer,
  TagsRenderer,
  // Memoized renderers (recommended)
  MemoizedAvatarNameRenderer,
  MemoizedStatusBadgeRenderer,
  MemoizedEngagementScoreRenderer,
  MemoizedEmailRenderer,
  MemoizedPhoneRenderer,
  MemoizedLinkedInRenderer,
  MemoizedDomainRenderer,
  MemoizedCurrencyRenderer,
  MemoizedNumberRenderer,
  MemoizedDateRenderer,
  MemoizedBooleanRenderer,
  MemoizedCompanyRenderer,
  MemoizedProgressRenderer,
  MemoizedTagsRenderer,
  // Utilities
  formatPhoneDisplay,
  statusColors,
} from './CellRenderers';

export type {
  StatusConfig,
  StatusBadgeRendererProps,
  DateRendererProps,
  ProgressRendererProps,
} from './CellRenderers';

// Enhanced Cell Renderers with Design System Integration
export {
  EnhancedAvatarNameRenderer,
  EnhancedStatusBadgeRenderer,
  EnhancedActionsRenderer,
  EnhancedBooleanRenderer,
  EnhancedCurrencyRenderer,
  EnhancedDateRenderer,
  EnhancedProgressRenderer,
  EnhancedTagsRenderer,
  enhancedCellRenderers,
} from './EnhancedCellRenderers';

export type {
  ActionsRendererProps,
  EnhancedCellRendererType,
} from './EnhancedCellRenderers';

// Brand Theme Utilities
export {
  agGridBrandThemes,
  generateAGGridBrandCSS,
  generateAGGridDarkBrandCSS,
  useAGGridBrandTheme,
  injectAGGridBrandStyles,
  createBrandAwareColumnDef,
  applyBrandThemeToColumns,
  createResponsiveColumn,
  getBrandAwareGridOptions,
} from './brand-theme-utils';

export type {
  AGGridBrandName,
  AGGridBrandTheme,
  UseAGGridBrandThemeOptions,
  ResponsiveColumnOptions,
} from './brand-theme-utils';
