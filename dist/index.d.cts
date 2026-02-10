import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React$1 from 'react';
import React__default, { ReactNode } from 'react';
import { VariantProps } from 'class-variance-authority';
import { AgGridReactProps, AgGridReact } from 'ag-grid-react';
export { AgGridReact } from 'ag-grid-react';
import { RowClickedEvent, RowSelectionOptions, ColDef as ColDef$1, ICellRendererParams } from 'ag-grid-community';
export { ColDef as AGColDef, CellClickedEvent, CellValueChangedEvent, FilterChangedEvent, FirstDataRenderedEvent, GridApi, GridReadyEvent, RowClickedEvent, RowSelectedEvent, SelectionChangedEvent, SortChangedEvent } from 'ag-grid-community';
import { BrandConfig } from './brands/types.cjs';
export { BrandBorderRadius, BrandBoxShadow, BrandColors, BrandTypography, ColorScale, SemanticColors, createBrandPreset, generateBrandCSS, generateTailwindTheme } from './brands/types.cjs';
export { Alert, AlertDescription, AlertProps, AlertTitle, alertVariants } from './components/Alert/index.cjs';
export { AudioPlayer, AudioPlayerProps, AudioPlayerState, ProgressBar, audioPlayerVariants, formatAudioTime, playButtonVariants } from './components/AudioPlayer/index.cjs';
export { AudioRecorder, AudioRecorderControlsRenderProps, AudioRecorderProps, AudioRecorderState, audioRecorderVariants, controlButtonVariants, formatTime, waveformContainerVariants } from './components/AudioRecorder/index.cjs';
export { Avatar, AvatarGroup, AvatarGroupProps, AvatarProps, avatarVariants, getInitials } from './components/Avatar/index.cjs';
export { Badge, BadgeProps, badgeVariants } from './components/Badge/index.cjs';
export { Breadcrumb, BreadcrumbItem, BreadcrumbProps, BreadcrumbSlash } from './components/Breadcrumb/index.cjs';
export { Button, ButtonProps, buttonVariants } from './components/Button/index.cjs';
export { Card, CardActions, CardActionsProps, CardBadge, CardBadgeProps, CardCollapsible, CardCollapsibleProps, CardContent, CardDescription, CardDivider, CardFooter, CardHeader, CardMedia, CardMediaProps, CardProps, CardStat, CardStatProps, CardTitle, cardAccentVariants, cardVariants } from './components/Card/index.cjs';
export { Checkbox, CheckboxGroup, CheckboxGroupProps, CheckboxProps, checkboxVariants } from './components/Checkbox/index.cjs';
export { DateInput, DateInputMode, DateInputProps } from './components/DateInput/index.cjs';
export { Dropdown, DropdownContent, DropdownContentProps, DropdownHeader, DropdownHeaderProps, DropdownItem, DropdownItemProps, DropdownLabel, DropdownPlacement, DropdownProps, DropdownSeparator } from './components/Dropdown/index.cjs';
import { InputProps } from './components/Input/index.cjs';
export { Input, inputVariants } from './components/Input/index.cjs';
import { SpinnerProps } from './components/Spinner/index.cjs';
export { FullPageSpinner, FullPageSpinnerProps, Spinner, SpinnerWithLabel, SpinnerWithLabelProps, spinnerVariants } from './components/Spinner/index.cjs';
export { Modal, ModalBody, ModalBodyProps, ModalClose, ModalCloseProps, ModalFooter, ModalFooterProps, ModalHeader, ModalHeaderProps, ModalProps, ModalTitle, ModalTitleProps, modalContentVariants, modalOverlayVariants } from './components/Modal/index.cjs';
export { Pagination, PaginationProps, SimplePagination, SimplePaginationProps, paginationButtonVariants } from './components/Pagination/index.cjs';
export { PhoneEntry, PhoneInput, PhoneInputGroup, PhoneInputGroupProps, PhoneInputProps, PhoneType } from './components/PhoneInput/index.cjs';
export { CircularProgress, CircularProgressProps, Progress, ProgressProps, circularProgressVariants, progressBarFillVariants, progressBarTrackVariants } from './components/Progress/index.cjs';
export { QuickAction, QuickActionColor, QuickActionGroup, QuickActionGroupProps, QuickActionIcons, QuickActionProps, quickActionIconVariants, quickActionVariants } from './components/QuickAction/index.cjs';
export { Radio, RadioGroup, RadioGroupProps, RadioProps, radioVariants } from './components/Radio/index.cjs';
export { RecordButton, RecordButtonProps, RecordButtonSize, RecordButtonState, RecordButtonVariant, TranscriptionResult, TranscriptionState, formatDuration, recordButtonVariants } from './components/RecordButton/index.cjs';
export { DateButton, DateButtonProps, DatePicker, DatePickerProps, RadioOption, RadioOptionProps, SchedulePicker, SchedulePickerProps, TimeButton, TimeButtonProps, TimePicker, TimePickerProps, dateButtonVariants, radioOptionVariants, timeButtonVariants } from './components/SchedulePicker/index.cjs';
export { Select, SelectGroup, SelectOption, SelectProps, selectTriggerVariants } from './components/Select/index.cjs';
export { Skeleton, SkeletonCard, SkeletonCardProps, SkeletonProps, SkeletonTable, SkeletonTableProps, SkeletonText, SkeletonTextProps, skeletonVariants } from './components/Skeleton/index.cjs';
export { Slider, SliderProps, sliderRangeVariants, sliderThumbVariants, sliderTrackVariants } from './components/Slider/index.cjs';
export { Switch, SwitchProps, switchThumbVariants, switchTrackVariants } from './components/Switch/index.cjs';
export { Table, TableBody, TableBodyProps, TableCaption, TableCaptionProps, TableCell, TableCellProps, TableFooter, TableFooterProps, TableHead, TableHeadProps, TableHeader, TableHeaderProps, TableProps, TableRow, TableRowProps } from './components/Table/index.cjs';
export { Tabs, TabsContent, TabsContentProps, TabsList, TabsListProps, TabsProps, TabsTrigger, TabsTriggerProps, tabsListVariants, tabsTriggerVariants } from './components/Tabs/index.cjs';
export { SmallMuted, Text, TextProps, textVariants } from './components/Text/index.cjs';
export { Textarea, TextareaProps, textareaVariants } from './components/Textarea/index.cjs';
export { ThemeProvider, ThemeProviderContext, ThemeProviderContextValue, ThemeProviderProps, ThemeToggle, ThemeToggleProps, themeToggleIconVariants, themeToggleVariants, useThemeContext } from './components/ThemeProvider/index.cjs';
export { Tooltip, TooltipPlacement, TooltipProps } from './components/Tooltip/index.cjs';
export { VisuallyHidden, VisuallyHiddenProps } from './components/VisuallyHidden/index.cjs';
export { R as ResolvedTheme, T as Theme, u as useTheme } from './useTheme-B9SWu6ui.cjs';
export { KeyboardShortcutOptions, useClickOutside, useCommandK, useEscapeKey, useFocusTrap, useIsDesktop, useIsLargeDesktop, useIsMobile, useIsMobileOrTablet, useIsSmallTablet, useIsTablet, useKeyboardShortcut, useMediaQuery, usePrefersReducedMotion } from './hooks/index.cjs';
export { calculateAge, cn, formatDateValue, formatPhoneNumber, isDateEmpty, isDateInFuture, isDateInPast, isPhoneNumberEmpty, isStorybookDocsMode, isValidDate, isValidDrivingAge, isValidPhoneNumber, parseDateValue, unformatPhoneNumber } from './utils/index.cjs';
export { default as miewebUIPreset, miewebUISafelist } from './tailwind-preset.cjs';
export { brands, defaultBrand, enterpriseHealthBrand, miewebBrand, wagglelineBrand, webchartBrand } from './brands/index.cjs';
export { default as bluehiveBrand } from './brands/bluehive.cjs';
import 'clsx';

interface ContactAddress {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}
interface CustomField {
    id?: string;
    name: string;
    value: string;
}
interface ContactFormData {
    id?: string;
    firstName: string;
    lastName: string;
    sex?: 'M' | 'F' | 'N/D' | '';
    positionTitle?: string;
    degree?: string;
    email: string;
    phone?: string;
    address?: ContactAddress;
    customFields?: CustomField[];
}
interface AddContactModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when modal open state changes */
    onOpenChange: (open: boolean) => void;
    /** Callback when contact is saved */
    onSave: (contact: ContactFormData) => void;
    /** Existing contact data for editing (optional) */
    contact?: ContactFormData | null;
    /** Whether save is in progress */
    isSaving?: boolean;
    /** Modal title */
    title?: string;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show address fields */
    showAddress?: boolean;
    /** Whether to show custom fields */
    showCustomFields?: boolean;
    /** Whether to show phone field */
    showPhone?: boolean;
}
/**
 * AddContactModal provides a form for adding or editing provider/employer contacts.
 * Supports fields for name, sex, position, degree, email, address, and custom fields.
 */
declare function AddContactModal({ open, onOpenChange, onSave, contact, isSaving, title, className, showAddress, showCustomFields, showPhone, }: AddContactModalProps): react_jsx_runtime.JSX.Element;

interface KeyValueEntry {
    id: string;
    name: string;
    value: string;
}
interface AdditionalFieldsProps {
    /** Array of key-value entries */
    value: KeyValueEntry[];
    /** Callback when entries change */
    onChange: (entries: KeyValueEntry[]) => void;
    /** Title for the collapsible section */
    title?: string;
    /** Whether the section is initially expanded */
    defaultExpanded?: boolean;
    /** Whether the fields are disabled */
    disabled?: boolean;
    /** Placeholder for the field name input */
    namePlaceholder?: string;
    /** Placeholder for the field value input */
    valuePlaceholder?: string;
    /** Label for the add button */
    addButtonLabel?: string;
    /** Maximum number of entries allowed */
    maxEntries?: number;
    /** Custom className */
    className?: string;
    /** Whether to show as collapsible (default: true) */
    collapsible?: boolean;
}
/**
 * Generate a unique ID for new entries
 */
declare function generateId(): string;
/**
 * A collapsible section for adding custom key-value pairs.
 * Useful for additional/custom fields that don't fit into structured forms.
 *
 * @example
 * ```tsx
 * const [fields, setFields] = useState<KeyValueEntry[]>([]);
 *
 * <AdditionalFields
 *   title="Additional Information (Optional)"
 *   value={fields}
 *   onChange={setFields}
 * />
 * ```
 */
declare function AdditionalFields({ value, onChange, title, defaultExpanded, disabled, namePlaceholder, valuePlaceholder, addButtonLabel, maxEntries, className, collapsible, }: AdditionalFieldsProps): react_jsx_runtime.JSX.Element;
declare namespace AdditionalFields {
    var displayName: string;
}

/**
 * Standard address structure used throughout the application.
 * This is the canonical type for all address data.
 */
interface AddressData {
    /** Primary street address (e.g., "123 Healthcare Way") */
    street1: string;
    /** Secondary address line (e.g., "Suite 500", "Building A") */
    street2?: string;
    /** City name */
    city: string;
    /** State/province code or name (e.g., "IN", "Indiana") */
    state: string;
    /** ZIP/postal code */
    postalCode: string;
    /** Country (optional, defaults to US) */
    country?: string;
}
/**
 * Generates a Google Maps directions URL for an address.
 */
declare function getGoogleMapsUrl(address: AddressData): string;
/**
 * Generates a Google Maps search URL for an address.
 */
declare function getGoogleMapsSearchUrl(address: AddressData): string;
/**
 * Formats an address as a single line string.
 * Example: "123 Healthcare Way, Suite 500, Indianapolis, IN 46220"
 */
declare function formatAddressSingleLine(address: AddressData): string;
/**
 * Formats an address as a multi-line string array.
 * Example: ["123 Healthcare Way", "Suite 500", "Indianapolis, IN 46220"]
 */
declare function formatAddressLines(address: AddressData): string[];
/**
 * Formats just the city, state, and postal code.
 * Example: "Indianapolis, IN 46220"
 */
declare function formatCityStateZip(address: AddressData): string;
/**
 * Formats just the city and state.
 * Example: "Indianapolis, Indiana" or "Indianapolis, IN"
 */
declare function formatCityState(address: AddressData): string;
declare const addressVariants: (props?: ({
    format?: "inline" | "block" | "compact" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface AddressProps extends VariantProps<typeof addressVariants>, Omit<React$1.HTMLAttributes<HTMLElement>, 'children'> {
    /** The address data to display */
    address: AddressData;
    /**
     * Whether to link to Google Maps.
     * - true: Link to directions
     * - 'directions': Link to directions
     * - 'search': Link to search/location
     * - false: No link
     */
    linkToMaps?: boolean | 'directions' | 'search';
    /** Whether to show a map pin icon */
    showIcon?: boolean;
    /** Custom icon to display (overrides default map pin) */
    icon?: React$1.ReactNode;
    /** Whether to hide the street address (show only city/state/zip) */
    hideStreet?: boolean;
    /** Whether to hide the postal code */
    hidePostalCode?: boolean;
}
/**
 * A flexible, reusable address display component.
 *
 * Supports multiple formats:
 * - Block (multi-line) for detail pages
 * - Inline (single-line) for cards and lists
 * - Compact (city/state only) for space-constrained layouts
 *
 * @example
 * ```tsx
 * // Full block address with map link
 * <Address
 *   address={{ street1: "123 Main St", city: "Indianapolis", state: "IN", postalCode: "46220" }}
 *   linkToMaps
 * />
 *
 * // Inline format for cards
 * <Address address={address} format="inline" size="sm" />
 *
 * // Compact city/state only
 * <Address address={address} format="compact" />
 *
 * // With icon
 * <Address address={address} showIcon />
 * ```
 */
declare function Address({ address, format, size, linkToMaps, showIcon, icon, hideStreet, hidePostalCode, className, ...props }: AddressProps): react_jsx_runtime.JSX.Element;
interface AddressCardProps extends AddressProps {
    /** Title/label for the address (e.g., "Main Office", "Mailing Address") */
    title?: string;
    /** Optional phone number to display */
    phoneNumber?: string;
    /** Click handler for phone number */
    onPhoneClick?: (phone: string) => void;
}
/**
 * A card-style address display with optional title and phone number.
 *
 * @example
 * ```tsx
 * <AddressCard
 *   title="Main Office"
 *   address={address}
 *   phoneNumber="(317) 555-1234"
 *   linkToMaps
 * />
 * ```
 */
declare function AddressCard({ title, address, phoneNumber, onPhoneClick, className, ...addressProps }: AddressCardProps): react_jsx_runtime.JSX.Element;
type AddressInlineProps = Omit<AddressProps, 'format'>;
/**
 * Convenience component for inline address display.
 * Shorthand for `<Address format="inline" />`.
 */
declare function AddressInline(props: AddressInlineProps): react_jsx_runtime.JSX.Element;
type AddressCompactProps = Omit<AddressProps, 'format' | 'hideStreet'>;
/**
 * Convenience component for compact city/state display.
 * Shorthand for `<Address format="compact" />`.
 */
declare function AddressCompact(props: AddressCompactProps): react_jsx_runtime.JSX.Element;

declare global {
    interface Window {
        google?: typeof google;
    }
    namespace google.maps {
        namespace places {
            class Autocomplete {
                constructor(input: HTMLInputElement, options?: AutocompleteOptions);
                getPlace(): PlaceResult;
                addListener(event: string, handler: () => void): void;
            }
            interface AutocompleteOptions {
                types?: string[];
                fields?: string[];
                componentRestrictions?: {
                    country: string | string[];
                };
            }
            interface PlaceResult {
                address_components?: AddressComponent[];
                geometry?: {
                    location: {
                        lat(): number;
                        lng(): number;
                    };
                };
                formatted_address?: string;
            }
            interface AddressComponent {
                long_name: string;
                short_name: string;
                types: string[];
            }
        }
        namespace event {
            function clearInstanceListeners(instance: object): void;
        }
    }
}
/**
 * Address data with optional geocoding coordinates and county.
 */
interface AddressFormData extends AddressData {
    /** County name (optional) */
    county?: string;
    /** Latitude from geocoding */
    lat?: number;
    /** Longitude from geocoding */
    lng?: number;
}
interface AddressFormProps {
    /** Current address values */
    value: Partial<AddressFormData>;
    /** Callback when address values change */
    onChange: (address: Partial<AddressFormData>) => void;
    /** Whether the form is disabled */
    disabled?: boolean;
    /** Whether fields are required */
    required?: boolean;
    /** Field errors keyed by field name */
    errors?: Partial<Record<keyof AddressFormData, string>>;
    /** ID prefix for form fields */
    id?: string;
    /** Whether to show country field (default: true) */
    showCountry?: boolean;
    /** Whether to show county field (default: false) */
    showCounty?: boolean;
    /** Default country value (default: 'US') */
    defaultCountry?: string;
    /** Labels for i18n */
    labels?: {
        street1?: string;
        street2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        county?: string;
        country?: string;
    };
    /** Placeholder texts */
    placeholders?: {
        street1?: string;
        street2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        county?: string;
        country?: string;
    };
    /** Custom className for the container */
    className?: string;
    /** Google Places autocomplete options (requires Google Maps API) */
    googlePlaces?: {
        /** Whether to enable autocomplete on street1 field */
        enabled: boolean;
        /** Callback when place is selected */
        onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
        /** Country restrictions for autocomplete */
        componentRestrictions?: {
            country: string | string[];
        };
        /** Types of places to return */
        types?: string[];
    };
}
/**
 * A complete address form with support for Google Places autocomplete.
 *
 * Features:
 * - Standard US address fields (street, city, state, zip)
 * - Optional county and country fields
 * - Google Places autocomplete integration
 * - Responsive grid layout
 * - Form validation support
 * - Internationalization support via labels/placeholders props
 *
 * @example
 * ```tsx
 * const [address, setAddress] = useState<Partial<AddressFormData>>({});
 *
 * <AddressForm
 *   value={address}
 *   onChange={setAddress}
 *   required
 *   showCounty
 * />
 * ```
 *
 * @example With Google Places
 * ```tsx
 * <AddressForm
 *   value={address}
 *   onChange={setAddress}
 *   googlePlaces={{
 *     enabled: true,
 *     componentRestrictions: { country: 'us' },
 *     onPlaceSelect: (place) => console.log('Selected:', place),
 *   }}
 * />
 * ```
 */
declare function AddressForm({ value, onChange, disabled, required, errors, id, showCountry, showCounty, defaultCountry, labels, placeholders, className, googlePlaces, }: AddressFormProps): react_jsx_runtime.JSX.Element;
declare namespace AddressForm {
    var displayName: string;
}

declare const agGridVariants: (props?: ({
    variant?: "default" | "bordered" | "striped" | "card" | null | undefined;
    size?: "sm" | "md" | "lg" | "xl" | "xs" | null | undefined;
    brand?: "default" | "mieweb" | "bluehive" | "waggleline" | "webchart" | "enterprise-health" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface AGGridProps<TData = unknown> extends Omit<AgGridReactProps<TData>, 'className' | 'rowSelection'>, VariantProps<typeof agGridVariants> {
    /** Additional CSS classes for the grid container */
    className?: string;
    /** Height of the grid container */
    height?: string | number;
    /** Loading state */
    loading?: boolean;
    /** Callback when a row is clicked */
    onRowClick?: (event: RowClickedEvent<TData>) => void;
    /** Reference to access the grid API */
    gridRef?: React$1.RefObject<AgGridReact<TData> | null>;
    /** Row selection configuration (v35+ object format or legacy string) */
    rowSelection?: RowSelectionOptions | 'single' | 'multiple';
    /** Brand configuration for theming */
    brandConfig?: BrandConfig;
    /** Show pagination controls */
    pagination?: boolean;
    /** Enable column resizing */
    resizable?: boolean;
    /** Enable sorting */
    sortable?: boolean;
    /** Enable filtering */
    filterable?: boolean;
    /** Custom empty state message */
    noDataMessage?: string;
    /** Custom loading message */
    loadingMessage?: string;
}
declare const AGGrid: <TData = unknown>(props: AGGridProps<TData> & {
    ref?: React$1.ForwardedRef<AgGridReact<TData>>;
}) => React$1.ReactElement;

type ColDef<TData = unknown, TValue = unknown> = ColDef$1<TData, TValue>;

/**
 * AG Grid Cell Renderers
 *
 * Rich, visually appealing cell renderers for AG Grid tables.
 * Based on Waggleline's production-tested implementations with
 * full dark mode support and design system integration.
 *
 * All renderers are memoized with React.memo for performance optimization.
 */

/**
 * Format a phone number with dashes for display
 */
declare function formatPhoneDisplay(phone: string | null | undefined): string;
interface StatusConfig {
    label: string;
    bgClass: string;
    textClass: string;
    iconName?: string;
}
declare const statusColors: Record<string, StatusConfig>;
interface AvatarNameRendererProps extends ICellRendererParams {
    avatarField?: string;
    domainField?: string;
}
/**
 * Renders an avatar with name, suitable for contact/owner columns
 */
declare function AvatarNameRenderer(props: AvatarNameRendererProps): React$1.ReactElement;
interface StatusBadgeRendererProps extends ICellRendererParams {
    /** Custom status color configuration */
    statusConfig?: Record<string, StatusConfig>;
}
/**
 * Renders a colorful status badge
 */
declare function StatusBadgeRenderer(props: StatusBadgeRendererProps): React$1.ReactElement;
/**
 * Renders engagement score with color-coded progress bar
 */
declare function EngagementScoreRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders email with mailto link
 */
declare function EmailRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders phone with click-to-call
 */
declare function PhoneRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders a domain/website URL with icon
 */
declare function DomainRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders a LinkedIn URL with icon
 */
declare function LinkedInRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders currency with proper formatting
 */
declare function CurrencyRenderer(props: ICellRendererParams): React$1.ReactElement;
/**
 * Renders number with comma formatting
 */
declare function NumberRenderer(props: ICellRendererParams): React$1.ReactElement;
interface DateRendererProps extends ICellRendererParams {
    format?: 'short' | 'medium' | 'long' | 'relative' | 'datetime';
}
/**
 * Renders date with formatting options
 */
declare function DateRenderer(props: DateRendererProps): React$1.ReactElement;
/**
 * Renders boolean as styled Yes/No badge
 */
declare function BooleanRenderer(props: ICellRendererParams): React$1.ReactElement;
interface CompanyRendererProps extends ICellRendererParams {
    companyIdField?: string;
    domainField?: string;
}
/**
 * Renders company name with favicon
 */
declare function CompanyRenderer(props: CompanyRendererProps): React$1.ReactElement;
interface ProgressRendererProps extends ICellRendererParams {
    /** Color of the progress bar */
    barColor?: string;
    /** Maximum value (default 100) */
    max?: number;
}
/**
 * Renders a progress bar
 */
declare function ProgressRenderer(props: ProgressRendererProps): React$1.ReactElement;
/**
 * Renders an array of tags as badges
 */
declare function TagsRenderer(props: ICellRendererParams): React$1.ReactElement;
declare const MemoizedAvatarNameRenderer: React$1.MemoExoticComponent<typeof AvatarNameRenderer>;
declare const MemoizedStatusBadgeRenderer: React$1.MemoExoticComponent<typeof StatusBadgeRenderer>;
declare const MemoizedEngagementScoreRenderer: React$1.MemoExoticComponent<typeof EngagementScoreRenderer>;
declare const MemoizedEmailRenderer: React$1.MemoExoticComponent<typeof EmailRenderer>;
declare const MemoizedPhoneRenderer: React$1.MemoExoticComponent<typeof PhoneRenderer>;
declare const MemoizedLinkedInRenderer: React$1.MemoExoticComponent<typeof LinkedInRenderer>;
declare const MemoizedDomainRenderer: React$1.MemoExoticComponent<typeof DomainRenderer>;
declare const MemoizedCurrencyRenderer: React$1.MemoExoticComponent<typeof CurrencyRenderer>;
declare const MemoizedNumberRenderer: React$1.MemoExoticComponent<typeof NumberRenderer>;
declare const MemoizedDateRenderer: React$1.MemoExoticComponent<typeof DateRenderer>;
declare const MemoizedBooleanRenderer: React$1.MemoExoticComponent<typeof BooleanRenderer>;
declare const MemoizedCompanyRenderer: React$1.MemoExoticComponent<typeof CompanyRenderer>;
declare const MemoizedProgressRenderer: React$1.MemoExoticComponent<typeof ProgressRenderer>;
declare const MemoizedTagsRenderer: React$1.MemoExoticComponent<typeof TagsRenderer>;
declare const CellRenderers: {
    AvatarNameRenderer: typeof AvatarNameRenderer;
    StatusBadgeRenderer: typeof StatusBadgeRenderer;
    EngagementScoreRenderer: typeof EngagementScoreRenderer;
    EmailRenderer: typeof EmailRenderer;
    PhoneRenderer: typeof PhoneRenderer;
    LinkedInRenderer: typeof LinkedInRenderer;
    DomainRenderer: typeof DomainRenderer;
    CurrencyRenderer: typeof CurrencyRenderer;
    NumberRenderer: typeof NumberRenderer;
    DateRenderer: typeof DateRenderer;
    BooleanRenderer: typeof BooleanRenderer;
    CompanyRenderer: typeof CompanyRenderer;
    ProgressRenderer: typeof ProgressRenderer;
    TagsRenderer: typeof TagsRenderer;
    MemoizedAvatarNameRenderer: React$1.MemoExoticComponent<typeof AvatarNameRenderer>;
    MemoizedStatusBadgeRenderer: React$1.MemoExoticComponent<typeof StatusBadgeRenderer>;
    MemoizedEngagementScoreRenderer: React$1.MemoExoticComponent<typeof EngagementScoreRenderer>;
    MemoizedEmailRenderer: React$1.MemoExoticComponent<typeof EmailRenderer>;
    MemoizedPhoneRenderer: React$1.MemoExoticComponent<typeof PhoneRenderer>;
    MemoizedLinkedInRenderer: React$1.MemoExoticComponent<typeof LinkedInRenderer>;
    MemoizedDomainRenderer: React$1.MemoExoticComponent<typeof DomainRenderer>;
    MemoizedCurrencyRenderer: React$1.MemoExoticComponent<typeof CurrencyRenderer>;
    MemoizedNumberRenderer: React$1.MemoExoticComponent<typeof NumberRenderer>;
    MemoizedDateRenderer: React$1.MemoExoticComponent<typeof DateRenderer>;
    MemoizedBooleanRenderer: React$1.MemoExoticComponent<typeof BooleanRenderer>;
    MemoizedCompanyRenderer: React$1.MemoExoticComponent<typeof CompanyRenderer>;
    MemoizedProgressRenderer: React$1.MemoExoticComponent<typeof ProgressRenderer>;
    MemoizedTagsRenderer: React$1.MemoExoticComponent<typeof TagsRenderer>;
    formatPhoneDisplay: typeof formatPhoneDisplay;
};

/**
 * AI Component Types
 *
 * Type definitions for AI-related components including MCP (Model Context Protocol)
 * interactions, tool calls, and chat messages.
 */
/**
 * Status of an MCP tool invocation
 */
type MCPToolStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled';
/**
 * MCP Tool parameter definition
 */
interface MCPToolParameter {
    name: string;
    type: string;
    value: unknown;
    description?: string;
}
/**
 * MCP Tool invocation
 */
interface MCPToolCall {
    /** Unique identifier for this tool call */
    id: string;
    /** Name of the tool being invoked */
    toolName: string;
    /** Human-readable description of what the tool does */
    description?: string;
    /** Parameters passed to the tool */
    parameters: MCPToolParameter[];
    /** Current status of the tool execution */
    status: MCPToolStatus;
    /** Timestamp when tool was invoked */
    startedAt: Date | string;
    /** Timestamp when tool completed */
    completedAt?: Date | string;
    /** Duration in milliseconds */
    duration?: number;
    /** Result data if successful */
    result?: MCPToolResult;
    /** Error message if failed */
    error?: string;
}
/**
 * Result from an MCP tool execution
 */
interface MCPToolResult {
    /** Type of result data */
    type: 'text' | 'json' | 'link' | 'resource' | 'error';
    /** The result data */
    data: unknown;
    /** Human-readable summary of the result */
    summary?: string;
    /** Link to a resource (for link type) */
    link?: MCPResourceLink;
    /** Resources created or modified */
    resources?: MCPResource[];
}
/**
 * Link to a resource
 */
interface MCPResourceLink {
    /** URL or path to the resource */
    href: string;
    /** Display text for the link */
    label: string;
    /** Type of resource */
    type?: 'patient' | 'document' | 'appointment' | 'order' | 'provider' | 'external' | 'internal';
    /** Icon name or component */
    icon?: string;
}
/**
 * MCP Resource definition
 */
interface MCPResource {
    /** Unique identifier */
    id: string;
    /** Resource type (e.g., 'patient', 'appointment', 'document') */
    type: string;
    /** Display name */
    name: string;
    /** URL to access the resource */
    uri?: string;
    /** Brief description */
    description?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Role of the message sender
 */
type AIMessageRole = 'user' | 'assistant' | 'system' | 'tool';
/**
 * Status of an AI message
 */
type AIMessageStatus = 'pending' | 'streaming' | 'complete' | 'error';
/**
 * Content block within a message
 */
interface AIMessageContent {
    /** Type of content */
    type: 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'code';
    /** Text content */
    text?: string;
    /** Tool call reference */
    toolCall?: MCPToolCall;
    /** Language for code blocks */
    language?: string;
    /** Whether this content is collapsed by default */
    collapsed?: boolean;
}
/**
 * AI Chat Message
 */
interface AIMessage {
    /** Unique identifier */
    id: string;
    /** Role of sender */
    role: AIMessageRole;
    /** Message content blocks */
    content: AIMessageContent[];
    /** Timestamp */
    timestamp: Date | string;
    /** Current status */
    status: AIMessageStatus;
    /** Model used (for assistant messages) */
    model?: string;
    /** Token usage info */
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Suggested action/prompt
 */
interface AISuggestedAction {
    /** Unique identifier */
    id: string;
    /** Display label */
    label: string;
    /** Full prompt text */
    prompt: string;
    /** Icon name */
    icon?: string;
    /** Category for grouping */
    category?: string;
}
/**
 * AI Chat session
 */
interface AIChatSession {
    /** Unique session identifier */
    id: string;
    /** Session title */
    title?: string;
    /** Messages in the session */
    messages: AIMessage[];
    /** Available tools */
    availableTools?: MCPToolInfo[];
    /** Created timestamp */
    createdAt: Date | string;
    /** Last updated timestamp */
    updatedAt: Date | string;
    /** Whether the assistant is currently generating */
    isGenerating: boolean;
    /** Context information */
    context?: {
        /** Current page/location */
        page?: string;
        /** Selected entity */
        entity?: MCPResource;
        /** Additional context */
        custom?: Record<string, unknown>;
    };
}
/**
 * Information about an available MCP tool
 */
interface MCPToolInfo {
    /** Tool name */
    name: string;
    /** Human-readable description */
    description: string;
    /** Input schema */
    inputSchema?: Record<string, unknown>;
    /** Category for grouping */
    category?: string;
    /** Whether the tool is enabled */
    enabled?: boolean;
}
interface AIChatCallbacks {
    /** Called when user sends a message */
    onSendMessage?: (message: string) => void | Promise<void>;
    /** Called when a tool call is initiated */
    onToolCall?: (toolCall: MCPToolCall) => void | Promise<void>;
    /** Called when a tool call completes */
    onToolComplete?: (toolCall: MCPToolCall, result: MCPToolResult) => void;
    /** Called when user clicks a resource link */
    onResourceClick?: (resource: MCPResource | MCPResourceLink) => void;
    /** Called when user selects a suggested action */
    onSuggestedAction?: (action: AISuggestedAction) => void;
    /** Called when user wants to cancel generation */
    onCancel?: () => void;
    /** Called when user wants to retry */
    onRetry?: () => void;
    /** Called when session is cleared */
    onClear?: () => void;
}

/**
 * AI Component Icons
 *
 * Shared icon components for AI features to follow DRY principles.
 */
interface SparklesIconProps {
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}
/**
 * Sparkles icon - the modern symbol for AI features
 * Used by ChatGPT, GitHub Copilot, Google Gemini, etc.
 */
declare function SparklesIcon({ className, size }: SparklesIconProps): react_jsx_runtime.JSX.Element;
interface AILogoIconProps {
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}
/**
 * The AI assistant logo - a stacked layers/prism icon
 * @deprecated Use SparklesIcon for a more recognizable AI symbol
 */
declare function AILogoIcon({ className, size }: AILogoIconProps): react_jsx_runtime.JSX.Element;
interface CloseIconProps {
    className?: string;
}
declare function CloseIcon({ className }: CloseIconProps): react_jsx_runtime.JSX.Element;
interface RefreshIconProps {
    className?: string;
}
declare function RefreshIcon({ className }: RefreshIconProps): react_jsx_runtime.JSX.Element;
interface ChevronIconProps {
    className?: string;
    direction?: 'up' | 'down' | 'left' | 'right';
}
declare function ChevronIcon({ className, direction, }: ChevronIconProps): react_jsx_runtime.JSX.Element;
interface SendIconProps {
    className?: string;
}
declare function SendIcon({ className }: SendIconProps): react_jsx_runtime.JSX.Element;
interface SpinnerIconProps {
    className?: string;
}
declare function SpinnerIcon({ className }: SpinnerIconProps): react_jsx_runtime.JSX.Element;

interface ToolStatusIconProps {
    status: MCPToolStatus;
    className?: string;
}
declare function ToolStatusIcon({ status, className }: ToolStatusIconProps): react_jsx_runtime.JSX.Element;
declare function getToolIcon(toolName: string): React$1.ReactNode;
interface ResourceLinkProps {
    link: MCPResourceLink;
    onClick?: (link: MCPResourceLink) => void;
    className?: string;
}
declare function ResourceLink({ link, onClick, className }: ResourceLinkProps): react_jsx_runtime.JSX.Element;
declare const toolCallVariants: (props?: ({
    status?: "error" | "running" | "pending" | "success" | "cancelled" | null | undefined;
    compact?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface MCPToolCallDisplayProps extends VariantProps<typeof toolCallVariants> {
    /** The tool call to display */
    toolCall: MCPToolCall;
    /** Whether to show parameters (in detailed view) */
    showParameters?: boolean;
    /** Whether the component is collapsible to show details */
    collapsible?: boolean;
    /** Default collapsed state (true = hide details) */
    defaultCollapsed?: boolean;
    /** Callback when a resource link is clicked */
    onLinkClick?: (link: MCPResourceLink) => void;
    /** Additional class name */
    className?: string;
}
/**
 * Displays an MCP tool call with its status, parameters, and results.
 * Shows a user-friendly summary by default, with technical details available on expand.
 */
declare function MCPToolCallDisplay({ toolCall, showParameters, collapsible, defaultCollapsed, compact, onLinkClick, className, }: MCPToolCallDisplayProps): react_jsx_runtime.JSX.Element;

declare const avatarVariants: (props?: ({
    role?: "user" | "assistant" | "system" | "tool" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface MessageAvatarProps extends VariantProps<typeof avatarVariants> {
    userName?: string;
    className?: string;
}
declare function MessageAvatar({ role, size, userName, className, }: MessageAvatarProps): react_jsx_runtime.JSX.Element;
declare function AITypingIndicator({ className }: {
    className?: string;
}): react_jsx_runtime.JSX.Element;
interface AIMessageDisplayProps {
    /** The message to display */
    message: AIMessage;
    /** User name for user messages */
    userName?: string;
    /** Whether to show the avatar */
    showAvatar?: boolean;
    /** Whether to show timestamp */
    showTimestamp?: boolean;
    /** Callback when a resource link is clicked */
    onLinkClick?: (link: MCPResourceLink) => void;
    /** Additional class name */
    className?: string;
}
/**
 * Displays an AI chat message with support for text, tool calls, and streaming.
 */
declare function AIMessageDisplay({ message, userName, showAvatar, showTimestamp, onLinkClick, className, }: AIMessageDisplayProps): react_jsx_runtime.JSX.Element;

/**
 * Messaging Component Types
 *
 * Core type definitions for the messaging system, designed to be
 * backend-agnostic and extensible for various use cases including
 * SMS, MMS, and enterprise messaging.
 */
/**
 * Message delivery and read status.
 */
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
/**
 * Visual indicators for message status (checkmarks style).
 */
interface MessageStatusIndicator {
    status: MessageStatus;
    /** Timestamp when status was achieved */
    timestamp?: Date | string;
}
/**
 * Supported attachment/media types.
 */
type AttachmentType = 'image' | 'video' | 'audio' | 'document' | 'file';
/**
 * Attachment loading/upload state.
 */
type AttachmentState = 'pending' | 'uploading' | 'uploaded' | 'failed' | 'downloading';
/**
 * Attachment/media associated with a message.
 */
interface MessageAttachment {
    /** Unique identifier for the attachment */
    id: string;
    /** Type of attachment */
    type: AttachmentType;
    /** URL to the attachment (can be blob URL for pending uploads) */
    url: string;
    /** Thumbnail URL for images/videos */
    thumbnailUrl?: string;
    /** Original filename */
    filename: string;
    /** File size in bytes */
    size: number;
    /** MIME type */
    mimeType: string;
    /** Image/video dimensions */
    dimensions?: {
        width: number;
        height: number;
    };
    /** Duration in seconds for audio/video */
    duration?: number;
    /** Upload/download progress (0-100) */
    progress?: number;
    /** Current state of the attachment */
    state: AttachmentState;
    /** Alt text for accessibility */
    alt?: string;
}
/**
 * A participant in a conversation.
 */
interface MessageParticipant {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Avatar image URL */
    avatarUrl?: string;
    /** Phone number (for SMS/MMS) */
    phoneNumber?: string;
    /** Email address */
    email?: string;
    /** Whether this participant is the current user */
    isCurrentUser?: boolean;
    /** Whether this participant is online */
    isOnline?: boolean;
    /** Last seen timestamp */
    lastSeen?: Date | string;
}
/**
 * Read receipt for a message.
 */
interface ReadReceipt {
    /** Participant who read the message */
    participant: MessageParticipant;
    /** Timestamp when the message was read */
    readAt: Date | string;
}
/**
 * Type of message content.
 */
type MessageType = 'text' | 'media' | 'system' | 'typing';
/**
 * System message types for special notifications.
 */
type SystemMessageType = 'user-joined' | 'user-left' | 'conversation-created' | 'name-changed' | 'info' | 'warning' | 'error';
/**
 * Core message interface.
 */
interface Message {
    /** Unique identifier */
    id: string;
    /** Message type */
    type: MessageType;
    /** Text content */
    content: string;
    /** Message sender */
    sender: MessageParticipant;
    /** Timestamp when message was created */
    timestamp: Date | string;
    /** Current delivery/read status */
    status: MessageStatus;
    /** Attachments/media */
    attachments?: MessageAttachment[];
    /** Read receipts (for group conversations) */
    readReceipts?: ReadReceipt[];
    /** For system messages, the specific type */
    systemMessageType?: SystemMessageType;
    /** Reply-to message reference */
    replyTo?: {
        id: string;
        content: string;
        sender: MessageParticipant;
    };
    /** Reactions to the message */
    reactions?: MessageReaction[];
    /** Whether the message has been edited */
    isEdited?: boolean;
    /** Edit timestamp */
    editedAt?: Date | string;
    /** Whether the message is deleted (soft delete) */
    isDeleted?: boolean;
    /** Custom metadata for extensibility */
    metadata?: Record<string, unknown>;
}
/**
 * Message reaction.
 */
interface MessageReaction {
    /** Emoji or reaction type */
    emoji: string;
    /** Participants who reacted */
    participants: MessageParticipant[];
    /** Count of reactions */
    count: number;
}
/**
 * Type of conversation.
 */
type ConversationType = 'direct' | 'group' | 'channel' | 'broadcast';
/**
 * Conversation/thread interface.
 */
interface Conversation {
    /** Unique identifier */
    id: string;
    /** Conversation type */
    type: ConversationType;
    /** Conversation name (for groups/channels) */
    name?: string;
    /** Participants */
    participants: MessageParticipant[];
    /** Last message preview */
    lastMessage?: Message;
    /** Unread message count */
    unreadCount: number;
    /** Whether the conversation is muted */
    isMuted?: boolean;
    /** Whether the conversation is pinned */
    isPinned?: boolean;
    /** Whether the conversation is archived */
    isArchived?: boolean;
    /** Avatar/image URL for the conversation */
    avatarUrl?: string;
    /** Timestamp of last activity */
    lastActivityAt: Date | string;
    /** Created timestamp */
    createdAt: Date | string;
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
/**
 * New message to be sent (before ID is assigned).
 */
interface NewMessage {
    /** Text content */
    content: string;
    /** Attachments to include */
    attachments?: File[];
    /** Reply-to message ID */
    replyToId?: string;
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Message action type for context menus.
 */
type MessageAction = 'copy' | 'reply' | 'forward' | 'edit' | 'delete' | 'react' | 'resend' | 'report';
/**
 * Event handlers for messaging components.
 */
interface MessagingEventHandlers {
    /** Called when a message is sent */
    onSendMessage?: (message: NewMessage) => void | Promise<void>;
    /** Called when a failed message should be retried */
    onRetryMessage?: (messageId: string) => void | Promise<void>;
    /** Called when an attachment is added */
    onAttachmentAdded?: (files: File[]) => void;
    /** Called when an attachment is removed */
    onAttachmentRemoved?: (attachmentId: string) => void;
    /** Called when a read receipt is triggered */
    onReadReceipt?: (messageId: string) => void;
    /** Called when the user starts typing */
    onTypingStart?: () => void;
    /** Called when the user stops typing */
    onTypingStop?: () => void;
    /** Called when a message action is triggered */
    onMessageAction?: (action: MessageAction, message: Message) => void;
    /** Called when scrolling to load more history */
    onLoadMore?: () => void | Promise<void>;
    /** Called when an attachment is clicked */
    onAttachmentClick?: (attachment: MessageAttachment, message: Message) => void;
    /** Called when a participant is clicked */
    onParticipantClick?: (participant: MessageParticipant) => void;
    /** Called when a reaction is toggled */
    onReactionToggle?: (messageId: string, emoji: string) => void;
}
/**
 * Loading states for the messaging interface.
 */
interface MessagingLoadingState {
    /** Initial loading of messages */
    isLoadingMessages: boolean;
    /** Loading more history */
    isLoadingMore: boolean;
    /** Sending a message */
    isSending: boolean;
    /** Uploading attachments */
    isUploadingAttachments: boolean;
}
/**
 * Typing indicator state.
 */
interface TypingState {
    /** Participants currently typing */
    participants: MessageParticipant[];
    /** Timestamp of last typing activity */
    lastUpdated?: Date | string;
}
/**
 * Date grouping for message lists.
 */
interface MessageGroup {
    /** Date label (e.g., "Today", "Yesterday", "January 21, 2026") */
    label: string;
    /** Date key for grouping */
    date: string;
    /** Messages in this group */
    messages: Message[];
}

interface CharacterCounterProps {
    current: number;
    max: number;
    showWarningAt?: number;
    className?: string;
}
/**
 * Displays character count with warning colors.
 */
declare function CharacterCounter({ current, max, showWarningAt, className, }: CharacterCounterProps): react_jsx_runtime.JSX.Element;
declare namespace CharacterCounter {
    var displayName: string;
}
declare const sendButtonVariants: (props?: ({
    variant?: "primary" | "subtle" | null | undefined;
    canSend?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SendButtonProps extends React$1.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof sendButtonVariants> {
    isLoading?: boolean;
}
/**
 * Send button with loading state.
 */
declare const SendButton: React$1.ForwardRefExoticComponent<SendButtonProps & React$1.RefAttributes<HTMLButtonElement>>;
interface MessageComposerProps {
    /** Called when a message is sent */
    onSend: (message: NewMessage) => void | Promise<void>;
    /** Called when the user starts typing */
    onTypingStart?: () => void;
    /** Called when the user stops typing */
    onTypingStop?: () => void;
    /** Placeholder text */
    placeholder?: string;
    /** Maximum message length */
    maxLength?: number;
    /** Show character count */
    showCharacterCount?: boolean;
    /** Whether the composer is disabled */
    disabled?: boolean;
    /** Whether a message is currently being sent */
    isSending?: boolean;
    /** Show attachment picker */
    showAttachmentPicker?: boolean;
    /** Show camera button (mobile) */
    showCameraButton?: boolean;
    /** Accepted file types */
    acceptedFileTypes?: string[];
    /** Maximum file size */
    maxFileSize?: number;
    /** Maximum number of attachments */
    maxAttachments?: number;
    /** Called when an error occurs */
    onError?: (error: string) => void;
    /** Auto-focus the input */
    autoFocus?: boolean;
    /** Reply-to message reference */
    replyTo?: {
        id: string;
        content: string;
        senderName: string;
    } | null;
    /** Called when reply is cancelled */
    onCancelReply?: () => void;
    /** Visual variant - 'default' shows border-t, 'minimal' has no border */
    variant?: 'default' | 'minimal';
    /** Additional class name */
    className?: string;
}
/**
 * A message input component with attachment support and send button.
 *
 * @example
 * ```tsx
 * <MessageComposer
 *   onSend={handleSend}
 *   placeholder="Type a message..."
 *   showAttachmentPicker
 *   maxLength={1600}
 * />
 * ```
 */
declare const MessageComposer: React$1.ForwardRefExoticComponent<MessageComposerProps & React$1.RefAttributes<HTMLTextAreaElement>>;

interface SuggestedActionsProps {
    /** Available suggested actions */
    actions: AISuggestedAction[];
    /** Callback when an action is selected */
    onSelect: (action: AISuggestedAction) => void;
    /** Additional class name */
    className?: string;
}
declare function SuggestedActions({ actions, onSelect, className, }: SuggestedActionsProps): react_jsx_runtime.JSX.Element;
declare const chatVariants: (props?: ({
    variant?: "default" | "embedded" | "floating" | null | undefined;
    size?: "sm" | "md" | "lg" | "xl" | "full" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface AIChatProps extends VariantProps<typeof chatVariants>, AIChatCallbacks {
    /** Chat session data */
    session?: AIChatSession;
    /** Messages to display (alternative to session) */
    messages?: AIMessage[];
    /** Whether the AI is generating */
    isGenerating?: boolean;
    /** Current user name */
    userName?: string;
    /** Title for the chat header */
    title?: string;
    /** Suggested actions */
    suggestions?: AISuggestedAction[];
    /** Whether to show the header */
    showHeader?: boolean;
    /** Whether to show timestamps */
    showTimestamps?: boolean;
    /** Placeholder for input */
    inputPlaceholder?: string;
    /** Height constraint */
    height?: string | number;
    /** Props to pass to the MessageComposer */
    composerProps?: Partial<MessageComposerProps>;
    /** Callback when close button is clicked (shows close button when provided) */
    onClose?: () => void;
    /** Additional class name */
    className?: string;
}
/**
 * A complete AI chat interface with message history, input, and tool call support.
 * Reuses MessageComposer from the Messaging components for consistent UX.
 */
declare function AIChat({ session, messages: messagesProp, isGenerating: isGeneratingProp, userName, title, suggestions, showHeader, showTimestamps, inputPlaceholder, variant, size, height, composerProps, className, onSendMessage, onToolCall: _onToolCall, onResourceClick, onSuggestedAction, onCancel, onClear, onClose, }: AIChatProps): react_jsx_runtime.JSX.Element;

interface AIChatTriggerProps {
    /** Whether the chat is open */
    isOpen?: boolean;
    /** Callback when clicked */
    onClick?: () => void;
    /** Pulse animation to draw attention */
    pulse?: boolean;
    /** Badge count for notifications */
    badge?: number;
    /** Position of the button */
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    /** Additional class name */
    className?: string;
}
declare function AIChatTrigger({ isOpen, onClick, pulse, badge, position, className, }: AIChatTriggerProps): react_jsx_runtime.JSX.Element;
interface AIChatModalProps extends Omit<AIChatProps, 'variant' | 'size'> {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when the modal should close */
    onOpenChange: (open: boolean) => void;
    /** Position of the modal */
    position?: 'bottom-right' | 'bottom-left' | 'center';
    /** Width of the modal */
    width?: string | number;
    /** Height of the modal */
    height?: string | number;
    /** Additional class name for the modal */
    modalClassName?: string;
}
/**
 * A modal chat window that can be positioned in the corner or center.
 */
declare function AIChatModal({ open, onOpenChange, position, width, height, modalClassName, ...chatProps }: AIChatModalProps): react_jsx_runtime.JSX.Element | null;
interface FloatingAIChatProps extends Omit<AIChatModalProps, 'open' | 'onOpenChange'> {
    /** Initial open state */
    defaultOpen?: boolean;
    /** Controlled open state */
    open?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Button position */
    buttonPosition?: AIChatTriggerProps['position'];
    /** Show pulse animation */
    pulse?: boolean;
}
/**
 * A complete floating AI chat with trigger button and modal.
 */
declare function FloatingAIChat({ defaultOpen, open: controlledOpen, onOpenChange: controlledOnOpenChange, buttonPosition, position, pulse, ...chatProps }: FloatingAIChatProps): react_jsx_runtime.JSX.Element;

interface AppHeaderProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Whether the header is sticky (default: true) */
    sticky?: boolean;
    /** Whether to show border (default: true) */
    bordered?: boolean;
    /** Custom height class (default: 'h-16') */
    height?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeader({ children, className, sticky, bordered, height, 'data-testid': testId, }: AppHeaderProps): React__default.JSX.Element;
interface AppHeaderSectionProps {
    children: ReactNode;
    /** Section alignment */
    align?: 'left' | 'center' | 'right';
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderSection({ children, align, className, }: AppHeaderSectionProps): React__default.JSX.Element;
interface AppHeaderTitleProps {
    children: ReactNode;
    /** Optional subtitle */
    subtitle?: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderTitle({ children, subtitle, className, }: AppHeaderTitleProps): React__default.JSX.Element;
interface AppHeaderActionsProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderActions({ children, className, }: AppHeaderActionsProps): React__default.JSX.Element;
interface AppHeaderDividerProps {
    /** Additional CSS classes */
    className?: string;
}
declare function AppHeaderDivider({ className, }: AppHeaderDividerProps): React__default.JSX.Element;
interface AppHeaderIconButtonProps {
    /** Button icon */
    icon: ReactNode;
    /** Accessible label */
    label: string;
    /** Click handler */
    onClick?: () => void;
    /** Badge count */
    badge?: number;
    /** Whether the button is active */
    isActive?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeaderIconButton({ icon, label, onClick, badge, isActive, className, 'data-testid': testId, }: AppHeaderIconButtonProps): React__default.JSX.Element;
interface AppHeaderSearchProps {
    /** Click handler to open search */
    onClick?: () => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether to show on mobile (default: false) */
    showOnMobile?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeaderSearch({ onClick, placeholder, showOnMobile, className, 'data-testid': testId, }: AppHeaderSearchProps): React__default.JSX.Element;
interface AppHeaderUserMenuProps {
    /** User's name */
    name: string;
    /** User's email or subtitle */
    email?: string;
    /** User's avatar URL */
    avatarUrl?: string;
    /** Fallback initials when no avatar */
    initials?: string;
    /** Whether the menu is open */
    isOpen?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function AppHeaderUserMenu({ name, email, avatarUrl, initials, isOpen, onClick, className, 'data-testid': testId, }: AppHeaderUserMenuProps): React__default.JSX.Element;

type AuthMode = 'login' | 'signup' | 'forgotPassword' | 'resetPassword' | 'verify';
interface SocialProvider {
    id: string;
    name: string;
    icon?: React$1.ReactNode;
    color?: string;
}
declare const DEFAULT_SOCIAL_PROVIDERS: SocialProvider[];
interface AuthDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Callback to close the dialog */
    onClose: () => void;
    /** Current auth mode */
    mode?: AuthMode;
    /** Callback when mode changes */
    onModeChange?: (mode: AuthMode) => void;
    /** Login handler */
    onLogin?: (email: string, password: string) => Promise<void>;
    /** Signup handler */
    onSignup?: (data: SignupData) => Promise<void>;
    /** Social login handler */
    onSocialLogin?: (providerId: string) => Promise<void>;
    /** Forgot password handler */
    onForgotPassword?: (email: string) => Promise<void>;
    /** Reset password handler */
    onResetPassword?: (password: string, confirmPassword: string) => Promise<void>;
    /** Available social providers */
    socialProviders?: SocialProvider[];
    /** App name for branding */
    appName?: string;
    /** Logo URL */
    logoUrl?: string;
    /** Terms URL */
    termsUrl?: string;
    /** Privacy URL */
    privacyUrl?: string;
    /** Whether email verification is required */
    requireEmailVerification?: boolean;
    /** Additional className */
    className?: string;
}
/**
 * A comprehensive authentication dialog with login, signup, and password reset flows.
 *
 * @example
 * ```tsx
 * <AuthDialog
 *   isOpen={showAuth}
 *   onClose={() => setShowAuth(false)}
 *   onLogin={async (email, password) => { ... }}
 *   onSignup={async (data) => { ... }}
 *   onSocialLogin={async (provider) => { ... }}
 * />
 * ```
 */
declare function AuthDialog({ isOpen, onClose, mode: controlledMode, onModeChange, onLogin, onSignup, onSocialLogin, onForgotPassword, onResetPassword, socialProviders, appName, logoUrl, termsUrl, privacyUrl, requireEmailVerification, className, }: AuthDialogProps): react_jsx_runtime.JSX.Element | null;
interface SignupData {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    acceptedTerms: boolean;
}

interface BookingService {
    id: string;
    slug: string;
    name: string;
}
interface BookingProvider {
    id: string;
    name: string;
    address: {
        street1: string;
        street2?: string;
        city: string;
        state: string;
        postalCode: string;
    };
    phoneNumber?: string;
}
interface BookingFormData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    selectedServices: string[];
    allowAlternateProviders: boolean;
    consentEmail: boolean;
    consentSms: boolean;
}
interface BookingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: BookingFormData) => void;
    onCall?: (phoneNumber: string) => void;
    provider: BookingProvider;
    services?: BookingService[];
    defaultValues?: Partial<BookingFormData>;
    isLoading?: boolean;
    className?: string;
}
declare const inputVariants: (props?: ({
    state?: "error" | "default" | "success" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface FloatingInputProps extends React$1.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {
    label: string;
    error?: string;
}
declare function FloatingInput({ label, state, error, id, className, ...props }: FloatingInputProps): react_jsx_runtime.JSX.Element;
interface ServiceSelectProps {
    services: BookingService[];
    selectedServices: string[];
    onChange: (services: string[]) => void;
    placeholder?: string;
    error?: string;
    className?: string;
}
declare function ServiceSelect({ services, selectedServices, onChange, placeholder, error, className, }: ServiceSelectProps): react_jsx_runtime.JSX.Element;
interface ConsentSwitchProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
    className?: string;
}
declare function ConsentSwitch({ id, checked, onChange, label, description, className, }: ConsentSwitchProps): react_jsx_runtime.JSX.Element;
interface DialogOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    children: React$1.ReactNode;
    className?: string;
}
declare function DialogOverlay({ isOpen, onClose, children, className, }: DialogOverlayProps): react_jsx_runtime.JSX.Element | null;
declare function BookingDialog({ isOpen, onClose, onSubmit, onCall, provider, services, defaultValues, isLoading, className, }: BookingDialogProps): react_jsx_runtime.JSX.Element;
interface InlineBookingFormProps {
    provider: BookingProvider;
    services?: BookingService[];
    onSubmit: (data: BookingFormData) => void;
    defaultValues?: Partial<BookingFormData>;
    isLoading?: boolean;
    className?: string;
}
declare function InlineBookingForm({ provider: _provider, services, onSubmit, defaultValues, isLoading, className, }: InlineBookingFormProps): react_jsx_runtime.JSX.Element;
interface QuickBookCardProps {
    provider: BookingProvider;
    onBook: () => void;
    onCall?: (phoneNumber: string) => void;
    className?: string;
}
declare function QuickBookCard({ provider, onBook, onCall, className, }: QuickBookCardProps): react_jsx_runtime.JSX.Element;

/**
 * Time range for a business day
 */
interface TimeRange {
    /** Start time in HH:MM format (24-hour) or ISO time string */
    start?: string;
    /** End time in HH:MM format (24-hour) or ISO time string */
    end?: string;
    /** Optional description (e.g., "By appointment only") */
    description?: string;
}
/**
 * Day of the week with hours
 */
interface DayHours {
    /** Day of week (0-6, where 0 is Sunday) or day name */
    day: number | string;
    /** Array of time ranges (supports multiple shifts per day) */
    hours: TimeRange[];
}
/**
 * Full business hours schedule
 */
interface BusinessHoursSchedule {
    /** Structured hours by day */
    officeHours?: DayHours[];
    /** Free-form text hours (used when structured hours not available) */
    officeHoursText?: string;
    /** Timezone for displaying hours */
    timezone?: string;
}
declare const containerVariants$1: (props?: ({
    variant?: "inline" | "default" | "compact" | "card" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface OpenStatusBadgeProps {
    isOpen: boolean;
    className?: string;
}
declare function OpenStatusBadge({ isOpen, className }: OpenStatusBadgeProps): react_jsx_runtime.JSX.Element;
interface BusinessHoursProps extends VariantProps<typeof containerVariants$1> {
    /** Business hours schedule data */
    schedule: BusinessHoursSchedule;
    /** Show open/closed status badge */
    showStatus?: boolean;
    /** Highlight the current day */
    highlightToday?: boolean;
    /** Use short day names (Mon, Tue, etc.) */
    useShortDayNames?: boolean;
    /** Use 24-hour time format */
    use24Hour?: boolean;
    /** Show header with icon */
    showHeader?: boolean;
    /** Custom header text */
    headerText?: string;
    /** Additional CSS classes */
    className?: string;
}
declare function BusinessHours({ schedule, variant, size, showStatus, highlightToday, useShortDayNames, use24Hour, showHeader, headerText, className, }: BusinessHoursProps): react_jsx_runtime.JSX.Element;
interface CompactHoursProps {
    /** Business hours schedule data */
    schedule: BusinessHoursSchedule;
    /** Show open/closed status badge */
    showStatus?: boolean;
    /** Use 24-hour time format */
    use24Hour?: boolean;
    /** Additional CSS classes */
    className?: string;
}
declare function CompactHours({ schedule, showStatus, use24Hour, className, }: CompactHoursProps): react_jsx_runtime.JSX.Element;
interface HoursSummaryProps {
    /** Business hours schedule data */
    schedule: BusinessHoursSchedule;
    /** Use 24-hour time format */
    use24Hour?: boolean;
    /** Start expanded */
    defaultExpanded?: boolean;
    /** Additional CSS classes */
    className?: string;
}
declare function HoursSummary({ schedule, use24Hour, defaultExpanded, className, }: HoursSummaryProps): react_jsx_runtime.JSX.Element;

interface TimeSlot {
    id?: string;
    start: string;
    end: string;
    description?: string;
}
interface DaySchedule {
    day: number;
    hours: TimeSlot[];
}
interface BusinessHoursEditorProps {
    /** Current schedule data */
    value: DaySchedule[];
    /** Callback when schedule changes */
    onChange: (schedule: DaySchedule[]) => void;
    /** Whether the editor is disabled */
    disabled?: boolean;
    /** Whether to show description field for each time slot */
    showDescription?: boolean;
    /** Use 24-hour format */
    use24Hour?: boolean;
    /** Starting day of week (0 = Sunday, 1 = Monday) */
    weekStartsOn?: 0 | 1;
    /** Additional CSS classes */
    className?: string;
    /** Label for add hours button */
    addHoursLabel?: string;
}
/**
 * BusinessHoursEditor provides an editable interface for managing business hours.
 * Supports multiple time slots per day with optional descriptions.
 */
declare function BusinessHoursEditor({ value, onChange, disabled, showDescription, use24Hour: _use24Hour, weekStartsOn, className, addHoursLabel, }: BusinessHoursEditorProps): react_jsx_runtime.JSX.Element;
declare function createDefaultSchedule(): DaySchedule[];
declare function create24HourSchedule(): DaySchedule[];
declare function createWeekdaySchedule(start?: string, end?: string): DaySchedule[];

interface BackgroundCheckCandidate {
    /** Candidate ID */
    id: string;
    /** Candidate name */
    name: string;
    /** Email address */
    email: string;
    /** Phone number */
    phone?: string;
}
interface BackgroundCheckReport {
    /** Report ID */
    id: string;
    /** Candidate info */
    candidate: BackgroundCheckCandidate;
    /** Report status */
    status: 'pending' | 'running' | 'complete' | 'failed' | 'expired';
    /** Created date */
    createdAt: Date | string;
    /** Completed date */
    completedAt?: Date | string;
    /** Package/tier name */
    packageName?: string;
    /** Result (if complete) */
    result?: 'clear' | 'consider' | 'adverse_action';
    /** URL to view full report (external) */
    reportUrl?: string;
}
interface CheckrIntegrationProps {
    /** Whether Checkr is connected */
    connected?: boolean;
    /** Account info */
    account?: {
        name?: string;
        plan?: string;
    };
    /** Pending/completed reports */
    reports?: BackgroundCheckReport[];
    /** Available packages */
    packages?: Array<{
        id: string;
        name: string;
        description?: string;
    }>;
    /** Callback to connect Checkr */
    onConnect?: () => void;
    /** Callback to disconnect Checkr */
    onDisconnect?: () => void;
    /** Callback to invite a candidate */
    onInviteCandidate?: (candidate: Omit<BackgroundCheckCandidate, 'id'>, packageId: string) => void;
    /** Callback to view a report */
    onViewReport?: (report: BackgroundCheckReport) => void;
    /** Callback to view selected reports */
    onViewSelected?: (reports: BackgroundCheckReport[]) => void;
    /** Callback to export selected reports */
    onExportSelected?: (reports: BackgroundCheckReport[]) => void;
    /** Callback to refresh reports */
    onRefresh?: () => void;
    /** Loading state */
    loading?: boolean;
    /** Error message */
    error?: string;
    /** Custom class name */
    className?: string;
    /** Labels */
    labels?: {
        connect?: string;
        disconnect?: string;
        inviteCandidate?: string;
        viewReports?: string;
        noReports?: string;
        refresh?: string;
        pending?: string;
        running?: string;
        complete?: string;
        failed?: string;
        expired?: string;
        clear?: string;
        consider?: string;
        adverseAction?: string;
        name?: string;
        email?: string;
        phone?: string;
        package?: string;
        submit?: string;
        cancel?: string;
        exportSelected?: string;
        viewDetails?: string;
        noReportsSelected?: string;
    };
}
declare function CheckrIntegration({ connected, account, reports, packages, onConnect, onDisconnect, onInviteCandidate, onViewReport, onViewSelected, onExportSelected, onRefresh, loading, error, className, labels, }: CheckrIntegrationProps): react_jsx_runtime.JSX.Element;

interface CommandPaletteItem {
    /** Unique identifier */
    id: string;
    /** Display label */
    label: string;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Optional description text */
    description?: string;
    /** Category/group for grouping items */
    category?: string;
    /** Custom icon element */
    icon?: ReactNode;
    /** Keyboard shortcut hint */
    shortcut?: string;
    /** Whether the item is disabled */
    disabled?: boolean;
    /** Additional metadata for filtering/display */
    metadata?: Record<string, unknown>;
}
interface CommandPaletteCategory {
    /** Unique identifier for the category */
    id: string;
    /** Display label */
    label: string;
    /** Optional icon */
    icon?: ReactNode;
    /** Optional color class for styling */
    colorClass?: string;
}
interface CommandPaletteContextValue {
    /** Whether the palette is currently open */
    isOpen: boolean;
    /** Open the command palette */
    open: () => void;
    /** Close the command palette */
    close: () => void;
    /** Toggle the command palette */
    toggle: () => void;
    /** Current search query */
    query: string;
    /** Set the search query */
    setQuery: (query: string) => void;
    /** Currently selected item index */
    selectedIndex: number;
    /** Set the selected item index */
    setSelectedIndex: (index: number) => void;
    /** Active category filter */
    activeCategory: string | null;
    /** Set the active category filter */
    setActiveCategory: (category: string | null) => void;
    /** Register items (used by consumers) */
    items: CommandPaletteItem[];
    /** Register categories (used by consumers) */
    categories: CommandPaletteCategory[];
    /** Set items */
    setItems: (items: CommandPaletteItem[]) => void;
    /** Set categories */
    setCategories: (categories: CommandPaletteCategory[]) => void;
}
interface CommandPaletteProviderProps {
    children: ReactNode;
    /** Whether to enable the Cmd/Ctrl+K shortcut (default: true) */
    enableShortcut?: boolean;
    /** Custom event name for opening (for integration with other systems) */
    customEventName?: string;
}
declare function CommandPaletteProvider({ children, enableShortcut, customEventName, }: CommandPaletteProviderProps): React__default.JSX.Element;
/**
 * Hook to access the command palette context.
 * Must be used within a CommandPaletteProvider.
 *
 * @example
 * ```tsx
 * function SearchButton() {
 *   const { open } = useCommandPalette();
 *   return <button onClick={open}>Search (⌘K)</button>;
 * }
 * ```
 */
declare function useCommandPalette(): CommandPaletteContextValue;

interface CommandPaletteProps {
    /** Placeholder text for search input */
    placeholder?: string;
    /** Whether search is loading */
    isLoading?: boolean;
    /** Called when an item is selected */
    onSelect?: (item: CommandPaletteItem) => void;
    /** Custom empty state content */
    emptyState?: React__default.ReactNode;
    /** Custom render function for items */
    renderItem?: (item: CommandPaletteItem, options: {
        isSelected: boolean;
        index: number;
    }) => React__default.ReactNode;
    /** Custom footer content */
    footer?: React__default.ReactNode;
    /** Additional CSS classes for the modal */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function CommandPalette({ placeholder, isLoading, onSelect, emptyState, renderItem, footer, className, 'data-testid': testId, }: CommandPaletteProps): React__default.JSX.Element | null;
interface CommandPaletteTriggerProps {
    /** Button content (default shows search icon and keyboard hint) */
    children?: React__default.ReactNode;
    /** Placeholder text to show in the trigger */
    placeholder?: string;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function CommandPaletteTrigger({ children, placeholder, className, 'data-testid': testId, }: CommandPaletteTriggerProps): React__default.JSX.Element;

type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'waiting';
interface ConnectionInfo {
    /** Current connection state */
    status: ConnectionState;
    /** Number of retry attempts */
    retryCount?: number;
    /** Time until next retry (Date or timestamp) */
    retryTime?: Date | number;
    /** Reason for disconnection */
    reason?: string;
}
interface UpdateInfo {
    /** Whether an update is available */
    available: boolean;
    /** Version string */
    version?: string;
    /** Release notes or description */
    description?: string;
}
declare const overlayVariants: (props?: ({
    animate?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ConnectionStatusOverlayProps extends VariantProps<typeof overlayVariants> {
    /** Connection information */
    connection: ConnectionInfo;
    /** Whether to show the overlay */
    isVisible?: boolean;
    /** Callback when reload button is clicked */
    onReload?: () => void;
    /** Custom message to display */
    message?: string;
    /** App logo URL */
    logoUrl?: string;
    /** Additional className */
    className?: string;
}
/**
 * Full-screen overlay shown when connection is lost.
 *
 * @example
 * ```tsx
 * <ConnectionStatusOverlay
 *   isVisible={isOffline}
 *   connection={{ status: 'waiting', retryCount: 3 }}
 *   onReload={() => window.location.reload()}
 * />
 * ```
 */
declare function ConnectionStatusOverlay({ connection, isVisible, animate, onReload, message, logoUrl: _logoUrl, className, }: ConnectionStatusOverlayProps): react_jsx_runtime.JSX.Element | null;
interface UpdateAvailableOverlayProps {
    /** Update information */
    update: UpdateInfo;
    /** Whether to show the overlay */
    isVisible?: boolean;
    /** Callback when update now button is clicked */
    onUpdateNow?: () => void;
    /** Callback when later button is clicked */
    onLater?: () => void;
    /** App logo URL */
    logoUrl?: string;
    /** App name */
    appName?: string;
    /** Additional className */
    className?: string;
}
/**
 * Full-screen overlay shown when an app update is available.
 *
 * @example
 * ```tsx
 * <UpdateAvailableOverlay
 *   isVisible={updateAvailable}
 *   update={{ available: true, version: '2.0.0' }}
 *   onUpdateNow={() => installUpdate()}
 *   onLater={() => dismissUpdate()}
 * />
 * ```
 */
declare function UpdateAvailableOverlay({ update, isVisible, onUpdateNow, onLater, logoUrl, appName, className, }: UpdateAvailableOverlayProps): react_jsx_runtime.JSX.Element | null;
interface ConnectionStatusBadgeProps {
    /** Current connection status */
    status: ConnectionState;
    /** Whether to show text label */
    showLabel?: boolean;
    /** Additional className */
    className?: string;
}
/**
 * Small badge showing current connection status.
 *
 * @example
 * ```tsx
 * <ConnectionStatusBadge status="connected" showLabel />
 * ```
 */
declare function ConnectionStatusBadge({ status, showLabel, className, }: ConnectionStatusBadgeProps): react_jsx_runtime.JSX.Element;
interface ConnectionStatusBarProps {
    /** Connection information */
    connection: ConnectionInfo;
    /** Whether to show the bar */
    isVisible?: boolean;
    /** Position of the bar */
    position?: 'top' | 'bottom';
    /** Additional className */
    className?: string;
}
/**
 * Non-blocking status bar for connection issues.
 *
 * @example
 * ```tsx
 * <ConnectionStatusBar
 *   isVisible={!isConnected}
 *   connection={{ status: 'connecting', retryCount: 1 }}
 * />
 * ```
 */
declare function ConnectionStatusBar({ connection, isVisible, position, className, }: ConnectionStatusBarProps): react_jsx_runtime.JSX.Element | null;
interface UseConnectionStatusOptions {
    /** Callback when connection is lost */
    onDisconnect?: () => void;
    /** Callback when connection is restored */
    onReconnect?: () => void;
}
interface UseConnectionStatusReturn {
    /** Whether currently online */
    isOnline: boolean;
    /** Connection state info */
    connection: ConnectionInfo;
}
/**
 * Hook for monitoring browser online/offline status.
 *
 * @example
 * ```tsx
 * const { isOnline, connection } = useConnectionStatus();
 *
 * return (
 *   <ConnectionStatusOverlay
 *     isVisible={!isOnline}
 *     connection={connection}
 *   />
 * );
 * ```
 */
declare function useConnectionStatus(options?: UseConnectionStatusOptions): UseConnectionStatusReturn;

interface CookieConsentLink {
    /** Label for the link */
    label: string;
    /** URL for the link */
    href: string;
}
declare const bannerVariants: (props?: ({
    position?: "bottom" | "top" | "bottom-right" | "bottom-left" | null | undefined;
    variant?: "default" | "minimal" | "branded" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface CookieConsentBannerProps extends VariantProps<typeof bannerVariants> {
    /** Whether the banner is visible */
    isVisible?: boolean;
    /** Callback when user accepts cookies */
    onAccept: () => void;
    /** Callback when user declines cookies (optional) */
    onDecline?: () => void;
    /** Callback when user wants to customize settings (optional) */
    onCustomize?: () => void;
    /** Main message text */
    message?: string;
    /** Link to terms and conditions */
    termsLink?: CookieConsentLink;
    /** Link to privacy policy */
    privacyLink?: CookieConsentLink;
    /** Link to cookie policy */
    cookieLink?: CookieConsentLink;
    /** Text for the accept button */
    acceptText?: string;
    /** Text for the decline button */
    declineText?: string;
    /** Text for the customize button */
    customizeText?: string;
    /** Whether to show the decline button */
    showDecline?: boolean;
    /** Whether to show the customize button */
    showCustomize?: boolean;
    /** App name to display in message */
    appName?: string;
    /** Whether this is a mobile/app context */
    isMobileApp?: boolean;
    /** Additional className */
    className?: string;
}
/**
 * A cookie consent banner component for GDPR compliance.
 *
 * Supports multiple layouts and customization options.
 *
 * @example
 * ```tsx
 * <CookieConsentBanner
 *   isVisible={!hasConsented}
 *   onAccept={() => setConsented(true)}
 *   termsLink={{ label: "Terms", href: "/terms" }}
 *   privacyLink={{ label: "Privacy", href: "/privacy" }}
 * />
 * ```
 */
declare function CookieConsentBanner({ isVisible, position, variant, onAccept, onDecline, onCustomize, message, termsLink, privacyLink, cookieLink, acceptText, declineText, customizeText, showDecline, showCustomize, appName, isMobileApp, className, }: CookieConsentBannerProps): react_jsx_runtime.JSX.Element | null;
interface CompactCookieBannerProps {
    isVisible?: boolean;
    onAccept: () => void;
    privacyHref?: string;
    className?: string;
}
/**
 * A minimal cookie banner for less intrusive consent collection.
 */
declare function CompactCookieBanner({ isVisible, onAccept, privacyHref, className, }: CompactCookieBannerProps): react_jsx_runtime.JSX.Element | null;
interface UseCookieConsentOptions {
    /** Storage key for consent */
    storageKey?: string;
    /** Callback when consent is given */
    onConsent?: () => void;
}
interface UseCookieConsentReturn {
    /** Whether user has consented */
    hasConsented: boolean;
    /** Whether the banner should be shown */
    showBanner: boolean;
    /** Accept cookies */
    acceptCookies: () => void;
    /** Decline cookies */
    declineCookies: () => void;
    /** Reset consent (for testing) */
    resetConsent: () => void;
}
/**
 * Hook for managing cookie consent state.
 *
 * @example
 * ```tsx
 * const { showBanner, acceptCookies } = useCookieConsent();
 *
 * return (
 *   <CookieConsentBanner
 *     isVisible={showBanner}
 *     onAccept={acceptCookies}
 *   />
 * );
 * ```
 */
declare function useCookieConsent(options?: UseCookieConsentOptions): UseCookieConsentReturn;

interface CSVColumn {
    /** Original column name from CSV */
    name: string;
    /** Sample value from the first data row */
    sampleValue?: string;
    /** Mapped field type (e.g., 'firstName', 'email', 'phone.mobile') */
    mappedTo?: string;
    /** Child field for nested types (e.g., 'type' for phone) */
    childField?: string;
    /** Whether this column should be ignored */
    ignored?: boolean;
    /** Whether mapping is required but missing */
    hasError?: boolean;
}
interface FieldOption {
    /** Field value (e.g., 'firstName', 'phone') */
    value: string;
    /** Display text */
    label: string;
    /** Whether this field is already mapped to another column */
    disabled?: boolean;
    /** Whether this field has child options */
    hasChildren?: boolean;
}
interface CSVColumnMapperProps {
    /** Parsed CSV columns with sample data */
    columns: CSVColumn[];
    /** Available field options for mapping */
    fieldOptions: FieldOption[];
    /** Child field options by parent field */
    childFieldOptions?: Record<string, FieldOption[]>;
    /** Callback when column mapping changes */
    onColumnChange?: (columnIndex: number, mappedTo: string, childField?: string) => void;
    /** Callback when column is ignored/included */
    onIgnoreToggle?: (columnIndex: number, ignored: boolean) => void;
    /** Callback for bulk actions */
    onBulkAction?: (action: 'ignoreAll' | 'includeAll' | 'ignoreUncompleted') => void;
    /** Callback when import is triggered */
    onImport?: () => void;
    /** Whether import is in progress */
    importing?: boolean;
    /** Import progress (0-100) */
    importProgress?: number;
    /** Custom class name */
    className?: string;
    /** Labels */
    labels?: {
        ignoreAll?: string;
        includeAll?: string;
        ignoreUncompleted?: string;
        import?: string;
        ensureAccurateData?: string;
        ensureAccurateDataDescription?: string;
        instructions?: string;
    };
}
declare function CSVColumnMapper({ columns, fieldOptions, childFieldOptions, onColumnChange, onIgnoreToggle, onBulkAction, onImport, importing, importProgress, className, labels, }: CSVColumnMapperProps): react_jsx_runtime.JSX.Element;
interface CSVFileUploadProps {
    /** Callback when file is selected */
    onFileSelect?: (file: File) => void;
    /** Whether file is being processed */
    processing?: boolean;
    /** Accepted file types */
    accept?: string;
    /** Custom class name */
    className?: string;
    /** Labels */
    labels?: {
        selectFile?: string;
        dragAndDrop?: string;
        selectButton?: string;
    };
}
declare function CSVFileUpload({ onFileSelect, processing, accept, className, labels, }: CSVFileUploadProps): react_jsx_runtime.JSX.Element;

type DateRangePresetKey = 'today' | 'this-week' | 'this-month' | 'last-month' | 'last-15-min' | 'last-30-min' | 'last-hour' | 'last-24-hours' | 'last-7-days' | 'last-30-days' | 'last-90-days' | 'year-to-date' | 'this-year' | 'last-year';
interface DateRangePreset {
    key: DateRangePresetKey | string;
    label: string;
}
interface DateRange$1 {
    start: Date | null;
    end: Date | null;
}
interface DateRangePickerProps {
    /** Current date range value */
    value?: DateRange$1;
    /** Callback when date range changes */
    onChange: (range: DateRange$1, presetKey?: string) => void;
    /** Custom presets (uses default if not provided) */
    presets?: DateRangePreset[];
    /** Currently active preset key */
    activePreset?: string;
    /** Whether to show print button */
    showPrint?: boolean;
    /** Callback when print is clicked */
    onPrint?: () => void;
    /** Whether to show export button */
    showExport?: boolean;
    /** Callback when export is clicked */
    onExport?: () => void;
    /** Placeholder text for the date input */
    placeholder?: string;
    /** Date format for display */
    dateFormat?: string;
    /** Custom className */
    className?: string;
    /** Labels for i18n */
    labels?: {
        today?: string;
        thisWeek?: string;
        thisMonth?: string;
        lastMonth?: string;
        last15Min?: string;
        last30Min?: string;
        lastHour?: string;
        last24Hours?: string;
        last7Days?: string;
        last30Days?: string;
        last90Days?: string;
        yearToDate?: string;
        thisYear?: string;
        lastYear?: string;
        filter?: string;
        print?: string;
        export?: string;
    };
}
/**
 * Date range picker with preset filters, print, and export buttons.
 * Commonly used for report filtering in dashboard views.
 *
 * @example
 * ```tsx
 * const [range, setRange] = useState<DateRange>({ start: null, end: null });
 * const [preset, setPreset] = useState<string>();
 *
 * <DateRangePicker
 *   value={range}
 *   onChange={(newRange, presetKey) => {
 *     setRange(newRange);
 *     setPreset(presetKey);
 *   }}
 *   activePreset={preset}
 *   showPrint
 *   showExport
 *   onPrint={() => window.print()}
 *   onExport={() => exportToCSV()}
 * />
 * ```
 */
declare function DateRangePicker({ value, onChange, presets, activePreset, showPrint, onPrint, showExport, onExport, placeholder, dateFormat, className, labels, }: DateRangePickerProps): react_jsx_runtime.JSX.Element;
interface DateRangeFilterProps {
    /** Current date range value */
    value?: DateRange$1;
    /** Callback when date range changes */
    onChange: (range: DateRange$1, presetKey?: string) => void;
    /** Custom presets */
    presets?: DateRangePreset[];
    /** Currently active preset */
    activePreset?: string;
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    /** Custom className */
    className?: string;
    /** Labels for i18n */
    labels?: DateRangePickerProps['labels'];
}
/**
 * Standalone date range filter dropdown button.
 *
 * @example
 * ```tsx
 * <DateRangeFilter
 *   value={range}
 *   onChange={setRange}
 *   activePreset={preset}
 * />
 * ```
 */
declare function DateRangeFilter({ value: _value, onChange, presets, activePreset, variant, className, labels, }: DateRangeFilterProps): react_jsx_runtime.JSX.Element;

/**
 * Types for the DocumentScanner component
 */
/**
 * Accepted file types for document scanning
 */
declare const DEFAULT_ACCEPTED_FILE_TYPES: readonly ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp", "application/pdf"];
/**
 * Default maximum file size in MB
 */
declare const DEFAULT_MAX_FILE_SIZE_MB = 10;
/**
 * Scanner source type
 */
type ScannerSource = 'upload' | 'camera' | 'webcam';
/**
 * Scanner state
 */
type ScannerState = 'idle' | 'capturing' | 'preview' | 'processing' | 'success' | 'error';
/**
 * File with preview URL
 */
interface PreviewFile {
    /** The actual file object */
    file: File;
    /** Generated preview URL for display */
    previewUrl: string;
    /** Source of the file (upload, camera, or webcam) */
    source: ScannerSource;
    /** Unique ID for the file */
    id: string;
}
/**
 * Validation error
 */
interface ValidationError {
    /** File that caused the error */
    file: File;
    /** Error type */
    type: 'size' | 'type' | 'unknown';
    /** Human-readable error message */
    message: string;
}
/**
 * Camera permissions state
 */
type CameraPermission = 'prompt' | 'granted' | 'denied' | 'unavailable';
/**
 * DocumentScanner component props
 */
interface DocumentScannerProps {
    /**
     * Callback function that processes the scanned files.
     * Should return extracted data from the AI vision endpoint.
     */
    onScan: (files: File[]) => Promise<unknown>;
    /**
     * Callback function called with the extracted data after successful processing.
     */
    onResult: (data: unknown) => void;
    /**
     * Allow multiple file selection/capture.
     * @default false
     */
    multiple?: boolean;
    /**
     * Accepted file MIME types.
     * @default ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp', 'application/pdf']
     */
    acceptedFileTypes?: string[];
    /**
     * Maximum file size in megabytes.
     * @default 10
     */
    maxFileSizeMb?: number;
    /**
     * Disable the entire scanner.
     * @default false
     */
    disabled?: boolean;
    /**
     * Enable webcam capture on desktop.
     * @default true
     */
    enableWebcam?: boolean;
    /**
     * Enable camera capture on mobile.
     * @default true
     */
    enableCamera?: boolean;
    /**
     * Custom title text.
     * @default "Scan your document"
     */
    title?: string;
    /**
     * Custom description text.
     * @default "Upload a file, take a photo, or use your webcam"
     */
    description?: string;
    /**
     * Additional CSS classes.
     */
    className?: string;
    /**
     * Callback when an error occurs during file validation.
     */
    onValidationError?: (errors: ValidationError[]) => void;
    /**
     * Callback when the scanner state changes.
     */
    onStateChange?: (state: ScannerState) => void;
}
/**
 * WebcamModal component props
 */
interface WebcamModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback to close the modal */
    onOpenChange: (open: boolean) => void;
    /** Callback when a photo is captured */
    onCapture: (file: File) => void;
    /** Camera permission state */
    permission: CameraPermission;
    /** Request camera permission */
    onRequestPermission: () => Promise<void>;
    /** Enable auto-capture when document is detected (default: true) */
    enableAutoCapture?: boolean;
}
/**
 * FilePreview component props
 */
interface FilePreviewProps {
    /** Files to preview */
    files: PreviewFile[];
    /** Callback to remove a file */
    onRemove: (id: string) => void;
    /** Whether removal is disabled */
    disabled?: boolean;
}
/**
 * DropZone component props
 */
interface DropZoneProps {
    /** Callback when files are dropped or selected */
    onFilesSelected: (files: FileList) => void;
    /** Accepted file types */
    acceptedFileTypes: string[];
    /** Allow multiple file selection */
    multiple: boolean;
    /** Whether the dropzone is disabled */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Children content */
    children?: React.ReactNode;
}

/**
 * DropZone component for drag-and-drop file uploads
 *
 * @example
 * ```tsx
 * <DropZone
 *   onFilesSelected={handleFiles}
 *   acceptedFileTypes={['image/jpeg', 'image/png']}
 *   multiple={false}
 * >
 *   <p>Drop files here or click to browse</p>
 * </DropZone>
 * ```
 */
declare function DropZone({ onFilesSelected, acceptedFileTypes, multiple, disabled, className, children, }: DropZoneProps): react_jsx_runtime.JSX.Element;
declare namespace DropZone {
    var displayName: string;
}

/**
 * FilePreview component for displaying uploaded/captured files
 *
 * @example
 * ```tsx
 * <FilePreview
 *   files={previewFiles}
 *   onRemove={(id) => removeFile(id)}
 * />
 * ```
 */
declare function FilePreview({ files, onRemove, disabled }: FilePreviewProps): react_jsx_runtime.JSX.Element | null;
declare namespace FilePreview {
    var displayName: string;
}

/**
 * WebcamModal component for capturing photos using device webcam
 *
 * @example
 * ```tsx
 * <WebcamModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onCapture={(file) => handleCapture(file)}
 *   permission={permission}
 *   onRequestPermission={requestPermission}
 * />
 * ```
 */
declare function WebcamModal({ open, onOpenChange, onCapture, enableAutoCapture, }: Omit<WebcamModalProps, 'permission' | 'onRequestPermission'> & {
    /** Enable auto-capture when document is detected */
    enableAutoCapture?: boolean;
}): react_jsx_runtime.JSX.Element;
declare namespace WebcamModal {
    var displayName: string;
}

/**
 * Hook options for useFileUpload
 */
interface UseFileUploadOptions {
    /** Accepted file MIME types */
    acceptedFileTypes?: string[];
    /** Maximum file size in MB */
    maxFileSizeMb?: number;
    /** Allow multiple files */
    multiple?: boolean;
    /** Callback for validation errors */
    onValidationError?: (errors: ValidationError[]) => void;
}
/**
 * Hook return type for useFileUpload
 */
interface UseFileUploadReturn {
    /** Current preview files */
    files: PreviewFile[];
    /** Add files from FileList */
    addFiles: (fileList: FileList, source?: ScannerSource) => void;
    /** Add a single file */
    addFile: (file: File, source?: ScannerSource) => void;
    /** Remove a file by ID */
    removeFile: (id: string) => void;
    /** Clear all files */
    clearFiles: () => void;
    /** Get raw File objects */
    getFiles: () => File[];
    /** Whether there are files selected */
    hasFiles: boolean;
}
/**
 * Hook for managing file uploads with validation and preview URLs
 *
 * @example
 * ```tsx
 * const {
 *   files,
 *   addFiles,
 *   removeFile,
 *   clearFiles,
 *   hasFiles,
 * } = useFileUpload({
 *   acceptedFileTypes: ['image/jpeg', 'image/png'],
 *   maxFileSizeMb: 5,
 *   multiple: true,
 *   onValidationError: (errors) => console.error(errors),
 * });
 * ```
 */
declare function useFileUpload({ acceptedFileTypes, maxFileSizeMb, multiple, onValidationError, }?: UseFileUploadOptions): UseFileUploadReturn;

/**
 * Hook options for useCamera
 */
interface UseCameraOptions {
    /** Preferred facing mode for mobile cameras */
    facingMode?: 'user' | 'environment';
    /** Ideal video width */
    width?: number;
    /** Ideal video height */
    height?: number;
}
/**
 * Hook return type for useCamera
 */
interface UseCameraReturn {
    /** Current camera permission state */
    permission: CameraPermission;
    /** Video stream */
    stream: MediaStream | null;
    /** Ref to attach to video element */
    videoRef: React$1.RefObject<HTMLVideoElement | null>;
    /** Whether the camera is ready */
    isReady: boolean;
    /** Any error that occurred */
    error: Error | null;
    /** Start the camera */
    startCamera: () => Promise<void>;
    /** Stop the camera */
    stopCamera: () => void;
    /** Capture a photo from the video stream */
    capturePhoto: () => File | null;
    /** Switch between front and back camera */
    switchCamera: () => void;
    /** Current facing mode */
    currentFacingMode: 'user' | 'environment';
}
/**
 * Hook for managing camera access and photo capture
 *
 * @example
 * ```tsx
 * const {
 *   permission,
 *   videoRef,
 *   isReady,
 *   startCamera,
 *   stopCamera,
 *   capturePhoto,
 * } = useCamera({
 *   facingMode: 'environment',
 *   width: 1920,
 *   height: 1080,
 * });
 * ```
 */
declare function useCamera({ facingMode: initialFacingMode, width, height, }?: UseCameraOptions): UseCameraReturn;

/**
 * DocumentScanner - A comprehensive component for scanning documents, IDs, and cards
 *
 * Supports:
 * - File upload (drag-and-drop or click to browse)
 * - Camera capture on mobile devices
 * - Webcam capture on desktop devices
 * - AI-powered document scanning and data extraction
 *
 * @example
 * ```tsx
 * <DocumentScanner
 *   onScan={async (files) => {
 *     const response = await fetch('/api/scan', {
 *       method: 'POST',
 *       body: createFormData(files),
 *     });
 *     return response.json();
 *   }}
 *   onResult={(data) => {
 *     console.log('Extracted data:', data);
 *   }}
 *   title="Scan your driver's license"
 *   description="Upload a photo or use your camera to scan"
 * />
 * ```
 */
declare function DocumentScanner({ onScan, onResult, multiple, acceptedFileTypes, maxFileSizeMb, disabled, enableWebcam, enableCamera, title, description, className, onValidationError, onStateChange, }: DocumentScannerProps): react_jsx_runtime.JSX.Element;
declare namespace DocumentScanner {
    var displayName: string;
}

/**
 * useDocumentDetection hook
 *
 * Provides real-time quality detection for auto-capture functionality.
 * Uses simple focus (blur) detection and stability tracking.
 * Designed to be forgiving and easy to use.
 */
/**
 * Point in 2D space
 */
interface Point {
    x: number;
    y: number;
}
/**
 * Document boundary corners (clockwise from top-left)
 */
interface DocumentBoundary {
    topLeft: Point;
    topRight: Point;
    bottomRight: Point;
    bottomLeft: Point;
}
/**
 * Detection quality metrics
 */
interface DetectionMetrics {
    /** Focus score (Laplacian variance) - higher is sharper */
    focusScore: number;
    /** Whether the image is considered in-focus */
    isInFocus: boolean;
    /** Brightness score (0-255 average) */
    brightness: number;
    /** Whether brightness is acceptable */
    isBrightnessOk: boolean;
    /** Detected document boundary (if found) */
    boundary: DocumentBoundary | null;
    /** Whether a document boundary was detected */
    isDocumentDetected: boolean;
    /** Coverage percentage of detected document (0-100) */
    documentCoverage: number;
    /** Whether the document has been stable for sufficient time */
    isStable: boolean;
    /** Stability duration in milliseconds */
    stabilityDuration: number;
}
/**
 * Detection state
 */
interface DetectionState {
    /** Whether detection is currently running */
    isDetecting: boolean;
    /** Current detection metrics */
    metrics: DetectionMetrics;
    /** Whether all conditions are met for auto-capture */
    isReadyForCapture: boolean;
    /** Auto-capture countdown (seconds remaining, 0 when not counting) */
    captureCountdown: number;
    /** Error message if detection failed */
    error: string | null;
}
/**
 * Detection configuration
 */
interface DetectionConfig {
    /** Minimum focus score to consider in-focus (default: 15) */
    minFocusScore?: number;
    /** Minimum brightness (0-255, default: 30) */
    minBrightness?: number;
    /** Maximum brightness (0-255, default: 240) */
    maxBrightness?: number;
    /** Minimum document coverage percentage (default: 10) - not used in simplified mode */
    minDocumentCoverage?: number;
    /** Maximum document coverage percentage (default: 95) - not used in simplified mode */
    maxDocumentCoverage?: number;
    /** Stability duration required before capture (ms, default: 500) */
    stabilityDuration?: number;
    /** Auto-capture countdown duration (seconds, default: 2) */
    captureCountdown?: number;
    /** Detection frame rate (fps, default: 5) */
    detectionFps?: number;
    /** Whether to enable auto-capture (default: true) */
    enableAutoCapture?: boolean;
}
/**
 * Hook for document detection with auto-capture
 */
declare function useDocumentDetection(videoRef: React.RefObject<HTMLVideoElement | null>, config?: DetectionConfig, onAutoCapture?: () => void): DetectionState & {
    startDetection: () => void;
    stopDetection: () => void;
    resetDetection: () => void;
};

interface DocumentDetectionOverlayProps {
    /** Detection metrics from useDocumentDetection */
    metrics: DetectionMetrics;
    /** Whether all conditions are met for capture */
    isReadyForCapture: boolean;
    /** Countdown value (seconds remaining, 0 when not counting) */
    captureCountdown: number;
    /** Video element dimensions */
    videoDimensions: {
        width: number;
        height: number;
    };
    /** Whether to show detailed metrics (debug mode) */
    showDetailedMetrics?: boolean;
}
/**
 * Main overlay component
 */
declare function DocumentDetectionOverlay({ metrics, isReadyForCapture, captureCountdown, videoDimensions: _videoDimensions, showDetailedMetrics, }: DocumentDetectionOverlayProps): react_jsx_runtime.JSX.Element;

interface DropzoneOverlayProps {
    /** Whether the overlay is visible */
    isVisible: boolean;
    /** Message to display */
    message?: string;
    /** Icon to display */
    icon?: 'upload' | 'file' | 'folder' | React$1.ReactNode;
    /** Custom className */
    className?: string;
    /** Color variant */
    variant?: 'default' | 'primary' | 'success';
    /** Size variant */
    size?: 'default' | 'compact';
}
/**
 * Full-screen overlay shown when dragging files over the upload area.
 *
 * @example
 * ```tsx
 * const [isDragging, setIsDragging] = useState(false);
 *
 * <div
 *   onDragEnter={() => setIsDragging(true)}
 *   onDragLeave={() => setIsDragging(false)}
 *   onDrop={() => setIsDragging(false)}
 * >
 *   <DropzoneOverlay
 *     isVisible={isDragging}
 *     message="Drop files to upload"
 *   />
 *   {// ... rest of content}
 * </div>
 * ```
 */
declare function DropzoneOverlay({ isVisible, message, icon, className, variant, size, }: DropzoneOverlayProps): react_jsx_runtime.JSX.Element | null;
interface UseDropzoneOptions {
    /** Callback when files are dropped */
    onDrop: (files: File[]) => void;
    /** Accepted file types (e.g., 'image/*', '.pdf') */
    accept?: string[];
    /** Whether to allow multiple files */
    multiple?: boolean;
    /** Whether dropzone is disabled */
    disabled?: boolean;
}
interface UseDropzoneReturn {
    /** Whether user is currently dragging over the zone */
    isDragging: boolean;
    /** Props to spread on the drop target element */
    getRootProps: () => {
        onDragEnter: (e: React$1.DragEvent) => void;
        onDragOver: (e: React$1.DragEvent) => void;
        onDragLeave: (e: React$1.DragEvent) => void;
        onDrop: (e: React$1.DragEvent) => void;
    };
    /** Open file picker programmatically */
    open: () => void;
    /** Props for hidden file input */
    getInputProps: () => {
        type: 'file';
        ref: React$1.RefObject<HTMLInputElement | null>;
        onChange: (e: React$1.ChangeEvent<HTMLInputElement>) => void;
        accept?: string;
        multiple?: boolean;
        style: React$1.CSSProperties;
    };
}
/**
 * Hook for handling drag-and-drop file uploads.
 *
 * @example
 * ```tsx
 * const { isDragging, getRootProps, getInputProps, open } = useDropzone({
 *   onDrop: (files) => console.log('Dropped:', files),
 *   accept: ['image/*', '.pdf'],
 *   multiple: true,
 * });
 *
 * return (
 *   <div {...getRootProps()}>
 *     <input {...getInputProps()} />
 *     <DropzoneOverlay isVisible={isDragging} />
 *     <button onClick={open}>Upload Files</button>
 *   </div>
 * );
 * ```
 */
declare function useDropzone({ onDrop, accept, multiple, disabled, }: UseDropzoneOptions): UseDropzoneReturn;

interface ClaimProviderFormProps {
    /** Provider name being claimed */
    providerName?: string;
    /** Provider address being claimed */
    providerAddress?: string;
    /** Available role options */
    roleOptions?: Array<{
        value: string;
        label: string;
    }>;
    /** Available language options */
    languageOptions?: Array<{
        value: string;
        label: string;
    }>;
    /** Handler for form submission */
    onSubmit?: (data: ClaimFormData) => void;
    /** Handler for cancel */
    onCancel?: () => void;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
    /** Error message to display */
    errorMessage?: string;
    /** Terms and conditions link URL */
    termsUrl?: string;
    /** Additional CSS classes */
    className?: string;
}
interface ClaimFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    occupation?: string;
    preferredLanguage?: string;
    agreedToTerms: boolean;
}
/**
 * ClaimProviderForm allows users to claim ownership/access to a provider listing.
 */
declare function ClaimProviderForm({ providerName, providerAddress, roleOptions, languageOptions, onSubmit, onCancel, isSubmitting, errorMessage, termsUrl, className, }: ClaimProviderFormProps): react_jsx_runtime.JSX.Element;

interface EmployerOption {
    id: string;
    name: string;
}
interface OrderOption {
    id: string;
    orderNumber: string;
    employeeName: string;
    serviceName: string;
    date: Date | string;
    amount: number;
    selected?: boolean;
}
interface CreateInvoiceData {
    employerId: string;
    orderIds: string[];
    dueDate: string;
    notes?: string;
}
interface CreateInvoiceModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Handler for closing the modal */
    onOpenChange: (open: boolean) => void;
    /** Handler for creating the invoice */
    onSubmit?: (data: CreateInvoiceData) => void;
    /** Available employers */
    employers: EmployerOption[];
    /** Available orders (filtered by selected employer) */
    orders?: OrderOption[];
    /** Handler for loading orders when employer changes */
    onEmployerChange?: (employerId: string) => void;
    /** Whether orders are loading */
    isLoadingOrders?: boolean;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
    /** Error message to display */
    errorMessage?: string;
    /** Currency symbol */
    currency?: string;
    /** Default due date offset in days */
    defaultDueDays?: number;
}
/**
 * CreateInvoiceModal provides a multi-step wizard for creating invoices.
 */
declare function CreateInvoiceModal({ open, onOpenChange, onSubmit, employers, orders, onEmployerChange, isLoadingOrders, isSubmitting, errorMessage, currency, defaultDueDays, }: CreateInvoiceModalProps): react_jsx_runtime.JSX.Element;

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    dateOfBirth?: string;
    employeeId?: string;
}
interface ServiceOption$1 {
    id: string;
    name: string;
    price: number;
    description?: string;
    selected?: boolean;
}
interface CreateReferralModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Handler for closing the modal */
    onOpenChange: (open: boolean) => void;
    /** Handler for creating the referral */
    onSubmit?: (data: ReferralData) => void;
    /** Employee for the referral */
    employee?: Employee;
    /** Available services to select */
    services?: ServiceOption$1[];
    /** Employer name */
    employerName?: string;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
    /** Error message to display */
    errorMessage?: string;
    /** Currency symbol */
    currency?: string;
}
interface ReferralData {
    employeeId: string;
    serviceIds: string[];
    notes?: string;
    priority?: 'normal' | 'urgent' | 'stat';
}
/**
 * CreateReferralModal allows selecting services and creating a referral for an employee.
 */
declare function CreateReferralModal({ open, onOpenChange, onSubmit, employee, services, employerName, isSubmitting, errorMessage, currency, }: CreateReferralModalProps): react_jsx_runtime.JSX.Element;

interface UserRole {
    id: string;
    name: string;
    description?: string;
    permissions?: string[];
}
interface EditUserRoleModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Handler for closing the modal */
    onOpenChange: (open: boolean) => void;
    /** Handler for saving the role change */
    onSave?: (data: {
        userId: string;
        roleId: string;
    }) => void;
    /** User being edited */
    user?: {
        id: string;
        name: string;
        email: string;
        currentRoleId?: string;
    };
    /** Available roles */
    roles: UserRole[];
    /** Whether submission is in progress */
    isSubmitting?: boolean;
    /** Error message to display */
    errorMessage?: string;
}
/**
 * EditUserRoleModal provides a form to change a user's role.
 */
declare function EditUserRoleModal({ open, onOpenChange, onSave, user, roles, isSubmitting, errorMessage, }: EditUserRoleModalProps): react_jsx_runtime.JSX.Element;

interface Department {
    /** Department ID */
    id: string;
    /** Department name */
    name: string;
}
interface EmployeePhone$1 {
    /** Phone number */
    number: string;
    /** Phone type */
    type: 'cell' | 'landline' | 'home' | 'work' | 'fax';
}
interface EmployeeAddress$1 {
    /** Street address line 1 */
    street1?: string;
    /** Street address line 2 */
    street2?: string;
    /** City */
    city?: string;
    /** State/Province */
    state?: string;
    /** Postal/ZIP code */
    postalCode?: string;
    /** Country */
    country?: string;
}
interface EmployeeFormData {
    /** First name */
    firstName: string;
    /** Last name */
    lastName: string;
    /** Email address */
    email: string;
    /** Date of birth (ISO format) */
    dob: string;
    /** Selected department IDs */
    departments?: string[];
    /** Job title */
    title?: string;
    /** Address */
    address?: EmployeeAddress$1;
    /** Phone numbers */
    phones?: EmployeePhone$1[];
    /** Account active status */
    isActive?: boolean;
    /** Additional information */
    additionalInfo?: string;
    /** Whether to send invite email */
    sendInvite?: boolean;
}
interface EmployeeFormProps {
    /** Initial form data for editing */
    initialData?: Partial<EmployeeFormData>;
    /** Available departments */
    departments?: Department[];
    /** Whether this is a new employee (show invite option) */
    isNew?: boolean;
    /** Whether user is already linked to an account */
    isUserLinked?: boolean;
    /** Mode: create employee or start order */
    mode?: 'create' | 'order';
    /** Callback when form is submitted */
    onSubmit: (data: EmployeeFormData) => void;
    /** Callback when cancelled */
    onCancel?: () => void;
    /** Custom fields component */
    customFields?: React$1.ReactNode;
    /** Labels for i18n */
    labels?: {
        required?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        dob?: string;
        department?: string;
        selectDepartments?: string;
        title?: string;
        address?: string;
        phone?: string;
        accountStatus?: string;
        active?: string;
        inactive?: string;
        additionalInformation?: string;
        inviteEmployee?: string;
        save?: string;
        startOrder?: string;
        cancel?: string;
        firstNameRequired?: string;
        lastNameRequired?: string;
        emailRequired?: string;
        dobRequired?: string;
    };
    /** Custom className */
    className?: string;
}
/**
 * A comprehensive employee form with personal details, departments,
 * address, and phone number fields.
 *
 * @example
 * ```tsx
 * <EmployeeForm
 *   departments={departmentList}
 *   isNew
 *   onSubmit={(data) => createEmployee(data)}
 *   onCancel={() => closeModal()}
 * />
 * ```
 */
declare function EmployeeForm({ initialData, departments, isNew, isUserLinked, mode, onSubmit, onCancel, customFields, labels, className, }: EmployeeFormProps): react_jsx_runtime.JSX.Element;

interface EmployeeAddress {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}
interface EmployeePhone {
    number: string;
    type: 'cell' | 'home' | 'work' | 'fax' | string;
}
interface EmployeeData {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: EmployeePhone[];
    title?: string;
    companyName?: string;
    department?: string[];
    address?: EmployeeAddress;
    photoUrl?: string;
    dateOfBirth?: Date | string;
    isActive?: boolean;
    isPaid?: boolean;
    blurb?: string;
    extendedFields?: Array<{
        name: string;
        value: string;
    }>;
}
interface EmployeeProfileCardProps {
    /** Employee data */
    employee: EmployeeData;
    /** Whether to show the photo edit button */
    showPhotoEdit?: boolean;
    /** Callback when photo edit is clicked */
    onPhotoEdit?: (file: File) => void;
    /** Whether details are initially expanded */
    defaultExpanded?: boolean;
    /** Whether to show payment status */
    showPaymentStatus?: boolean;
    /** Custom className */
    className?: string;
    /** Labels for i18n */
    labels?: {
        moreDetails?: string;
        lessDetails?: string;
        paid?: string;
        paymentPending?: string;
        yearsOld?: string;
    };
}
/**
 * Employee profile card with photo, contact details, and expandable information.
 * Used in order sidebars and employee detail views.
 *
 * @example
 * ```tsx
 * <EmployeeProfileCard
 *   employee={{
 *     id: '1',
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com',
 *     phone: [{ number: '5551234567', type: 'cell' }],
 *     title: 'Software Engineer',
 *     companyName: 'Acme Corp',
 *     isActive: true,
 *     isPaid: true,
 *   }}
 *   showPaymentStatus
 * />
 * ```
 */
declare function EmployeeProfileCard({ employee, showPhotoEdit, onPhotoEdit, defaultExpanded, showPaymentStatus, className, labels, }: EmployeeProfileCardProps): react_jsx_runtime.JSX.Element;
interface OrderSidebarTab {
    id: string;
    label: string;
    dataCy?: string;
}
interface OrderSidebarTabsProps {
    /** Array of tabs */
    tabs: OrderSidebarTab[];
    /** Currently active tab ID */
    activeTab: string;
    /** Callback when tab changes */
    onTabChange: (tabId: string) => void;
    /** Tab orientation */
    orientation?: 'horizontal' | 'vertical';
    /** Custom className */
    className?: string;
}
/**
 * Tab navigation for order sidebars (Timeline, Services, Attachments).
 *
 * @example
 * ```tsx
 * <OrderSidebarTabs
 *   tabs={[
 *     { id: 'timeline', label: 'Timeline' },
 *     { id: 'services', label: 'Services' },
 *     { id: 'attachments', label: 'Attachments' },
 *   ]}
 *   activeTab="timeline"
 *   onTabChange={setActiveTab}
 * />
 * ```
 */
declare function OrderSidebarTabs({ tabs, activeTab, onTabChange, orientation, className, }: OrderSidebarTabsProps): react_jsx_runtime.JSX.Element;
interface OrderDetailSidebarProps {
    /** Employee data for the profile card */
    employee: EmployeeData;
    /** Content for each tab panel */
    children?: React$1.ReactNode;
    /** Tabs configuration */
    tabs?: OrderSidebarTab[];
    /** Currently active tab */
    activeTab?: string;
    /** Callback when tab changes */
    onTabChange?: (tabId: string) => void;
    /** Whether to show photo edit */
    showPhotoEdit?: boolean;
    /** Callback for photo edit */
    onPhotoEdit?: (file: File) => void;
    /** Whether to show payment status */
    showPaymentStatus?: boolean;
    /** Custom className */
    className?: string;
    /** Labels for i18n */
    labels?: EmployeeProfileCardProps['labels'] & {
        timeline?: string;
        services?: string;
        attachments?: string;
    };
}
/**
 * Complete order detail sidebar with employee profile and tab navigation.
 *
 * @example
 * ```tsx
 * <OrderDetailSidebar
 *   employee={employeeData}
 *   activeTab="timeline"
 *   onTabChange={setTab}
 *   showPaymentStatus
 * >
 *   {activeTab === 'timeline' && <TimelineContent />}
 *   {activeTab === 'services' && <ServicesContent />}
 *   {activeTab === 'attachments' && <AttachmentsContent />}
 * </OrderDetailSidebar>
 * ```
 */
declare function OrderDetailSidebar({ employee, children, tabs, activeTab, onTabChange, showPhotoEdit, onPhotoEdit, showPaymentStatus, className, labels, }: OrderDetailSidebarProps): react_jsx_runtime.JSX.Element;

interface Contact {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
}
interface EmployerContactCardProps {
    /** List of contacts */
    contacts: Contact[];
    /** Handler for clicking on a contact */
    onContactClick?: (contact: Contact) => void;
    /** Handler for adding a new contact */
    onAddContact?: () => void;
    /** Handler for emailing a contact */
    onEmail?: (contact: Contact) => void;
    /** Handler for calling a contact */
    onCall?: (contact: Contact) => void;
    /** Whether to show actions */
    showActions?: boolean;
    /** Card title */
    title?: string;
    /** Whether the card is loading */
    isLoading?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * EmployerContactCard displays a list of contacts for an employer.
 */
declare function EmployerContactCard({ contacts, onContactClick, onAddContact, onEmail, onCall, showActions, title, isLoading, className, }: EmployerContactCardProps): react_jsx_runtime.JSX.Element;

interface Employer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    activeEmployees?: number;
    pendingOrders?: number;
    status: 'active' | 'pending' | 'inactive';
    linkedDate?: Date | string;
    logoUrl?: string;
}
interface EmployerListProps {
    /** List of employers */
    employers: Employer[];
    /** Handler for clicking an employer */
    onEmployerClick?: (employer: Employer) => void;
    /** Handler for creating a new employer link */
    onAddEmployer?: () => void;
    /** Handler for searching */
    onSearch?: (query: string) => void;
    /** Whether the list is loading */
    isLoading?: boolean;
    /** Whether to show the search input */
    showSearch?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * EmployerList displays a searchable list of linked employers.
 */
declare function EmployerList({ employers, onEmployerClick, onAddEmployer, onSearch, isLoading, showSearch, emptyMessage, className, }: EmployerListProps): react_jsx_runtime.JSX.Element;

interface PricingTier {
    id: string;
    name: string;
    price: number;
    minQuantity?: number;
    maxQuantity?: number;
    description?: string;
    isDefault?: boolean;
}
interface EmployerPricingCardProps {
    /** Service or product name */
    serviceName: string;
    /** Base price when no tier applies */
    basePrice: number;
    /** Pricing tiers for this service */
    tiers?: PricingTier[];
    /** Currency symbol */
    currency?: string;
    /** Handler for editing pricing */
    onEdit?: () => void;
    /** Handler for removing pricing */
    onRemove?: () => void;
    /** Whether editing is allowed */
    editable?: boolean;
    /** Whether the pricing is active */
    isActive?: boolean;
    /** Custom notes about pricing */
    notes?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * EmployerPricingCard displays service pricing for a specific employer.
 */
declare function EmployerPricingCard({ serviceName, basePrice, tiers, currency, onEdit, onRemove, editable, isActive, notes, className, }: EmployerPricingCardProps): react_jsx_runtime.JSX.Element;

interface EmployerContact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
}
interface EmployerAddress {
    street: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
}
interface EmployerOrder {
    id: string;
    orderNumber: string;
    patientName: string;
    services: string[];
    status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
    createdDate: Date | string;
    scheduledDate?: Date | string;
}
interface EmployerInvoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    dueDate: Date | string;
    paidDate?: Date | string;
}
interface EmployerDetails {
    id: string;
    name: string;
    logoUrl?: string;
    status: 'active' | 'inactive' | 'pending';
    linkedDate: Date | string;
    address?: EmployerAddress;
    contacts: EmployerContact[];
    recentOrders: EmployerOrder[];
    recentInvoices: EmployerInvoice[];
    stats?: {
        totalOrders: number;
        completedOrders: number;
        pendingOrders: number;
        totalRevenue: number;
        outstandingBalance: number;
    };
}
interface EmployerViewProps {
    /** Employer data to display */
    employer: EmployerDetails;
    /** Handler for editing employer */
    onEdit?: () => void;
    /** Handler for contacting employer */
    onContact?: (contact: EmployerContact) => void;
    /** Handler for viewing order */
    onViewOrder?: (order: EmployerOrder) => void;
    /** Handler for viewing invoice */
    onViewInvoice?: (invoice: EmployerInvoice) => void;
    /** Handler for creating new order */
    onCreateOrder?: () => void;
    /** Handler for creating new invoice */
    onCreateInvoice?: () => void;
    /** Whether the view is loading */
    isLoading?: boolean;
    /** Default active tab */
    defaultTab?: 'overview' | 'orders' | 'invoices' | 'contacts';
    /** Additional CSS classes */
    className?: string;
}
/**
 * EmployerView displays detailed employer information with tabs for orders, invoices, and contacts.
 */
declare function EmployerView({ employer, onEdit, onContact, onViewOrder, onViewInvoice, onCreateOrder, onCreateInvoice, isLoading, defaultTab, className, }: EmployerViewProps): react_jsx_runtime.JSX.Element;

interface EmployerServiceModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Handler for closing the modal */
    onOpenChange: (open: boolean) => void;
    /** Handler for saving the configuration */
    onSave?: (data: EmployerServiceConfig) => void;
    /** Employer information */
    employer?: {
        id: string;
        name: string;
    };
    /** Service being configured */
    service?: {
        id: string;
        name: string;
        basePrice: number;
    };
    /** Existing configuration (for editing) */
    existingConfig?: Partial<EmployerServiceConfig>;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
    /** Error message to display */
    errorMessage?: string;
}
interface EmployerServiceConfig {
    serviceId: string;
    employerId: string;
    customPrice?: number;
    useBasePrice: boolean;
    autoAccept: boolean;
    requiresApproval: boolean;
    notifyOnOrder: boolean;
    notificationEmail?: string;
    notes?: string;
    billingCode?: string;
}
/**
 * EmployerServiceModal configures a service for a specific employer.
 */
declare function EmployerServiceModal({ open, onOpenChange, onSave, employer, service, existingConfig, isSubmitting, errorMessage, }: EmployerServiceModalProps): react_jsx_runtime.JSX.Element;

type ErrorType = '404' | '500' | '403' | '401' | 'offline' | 'maintenance' | 'generic';
interface ErrorPageConfig {
    code?: string;
    title: string;
    description: string;
    icon?: React$1.ReactNode;
    illustration?: React$1.ReactNode;
}
declare const DEFAULT_ERROR_CONFIGS: Record<ErrorType, ErrorPageConfig>;
declare const errorPageVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ErrorPageProps extends VariantProps<typeof errorPageVariants> {
    /** Error type to display */
    type?: ErrorType;
    /** Custom error code */
    code?: string;
    /** Custom title (overrides type default) */
    title?: string;
    /** Custom description (overrides type default) */
    description?: string;
    /** Custom illustration/icon */
    illustration?: React$1.ReactNode;
    /** Primary action button */
    primaryAction?: {
        label: string;
        onClick?: () => void;
        href?: string;
    };
    /** Secondary action button */
    secondaryAction?: {
        label: string;
        onClick?: () => void;
        href?: string;
    };
    /** Show home button */
    showHomeButton?: boolean;
    /** Home button href */
    homeHref?: string;
    /** Show back button */
    showBackButton?: boolean;
    /** Additional content */
    children?: React$1.ReactNode;
    /** Additional className */
    className?: string;
}
/**
 * A versatile error page component for displaying various error states.
 *
 * @example
 * ```tsx
 * <ErrorPage
 *   type="404"
 *   showHomeButton
 *   showBackButton
 * />
 * ```
 */
declare function ErrorPage({ type, code, title, description, illustration, primaryAction, secondaryAction, showHomeButton, homeHref, showBackButton, children, size, className, }: ErrorPageProps): react_jsx_runtime.JSX.Element;
type NotFoundPageProps = Omit<ErrorPageProps, 'type'>;
/**
 * A pre-configured 404 Not Found page.
 *
 * @example
 * ```tsx
 * <NotFoundPage showHomeButton showBackButton />
 * ```
 */
declare function NotFoundPage(props: NotFoundPageProps): react_jsx_runtime.JSX.Element;
interface ServerErrorPageProps extends Omit<ErrorPageProps, 'type'> {
    /** Error details for debugging */
    error?: Error | string;
    /** Show error details in development */
    showErrorDetails?: boolean;
}
/**
 * A pre-configured 500 Server Error page.
 *
 * @example
 * ```tsx
 * <ServerErrorPage error={error} showErrorDetails={isDev} />
 * ```
 */
declare function ServerErrorPage({ error, showErrorDetails, children, ...props }: ServerErrorPageProps): react_jsx_runtime.JSX.Element;
interface OfflinePageProps extends Omit<ErrorPageProps, 'type'> {
    /** Retry callback */
    onRetry?: () => void;
}
/**
 * A page displayed when the user is offline.
 *
 * @example
 * ```tsx
 * <OfflinePage onRetry={() => window.location.reload()} />
 * ```
 */
declare function OfflinePage({ onRetry, ...props }: OfflinePageProps): react_jsx_runtime.JSX.Element;
interface MaintenancePageProps extends Omit<ErrorPageProps, 'type'> {
    /** Estimated time until back online */
    estimatedTime?: string;
    /** Status page URL */
    statusUrl?: string;
}
/**
 * A page displayed during maintenance.
 *
 * @example
 * ```tsx
 * <MaintenancePage
 *   estimatedTime="30 minutes"
 *   statusUrl="https://status.example.com"
 * />
 * ```
 */
declare function MaintenancePage({ estimatedTime, statusUrl, description, children, ...props }: MaintenancePageProps): react_jsx_runtime.JSX.Element;
interface AccessDeniedPageProps extends Omit<ErrorPageProps, 'type'> {
    /** Show sign in button for 401 */
    showSignInButton?: boolean;
    /** Sign in callback or URL */
    onSignIn?: () => void;
    signInHref?: string;
}
/**
 * A page displayed when access is denied (403/401).
 *
 * @example
 * ```tsx
 * <AccessDeniedPage showSignInButton onSignIn={handleLogin} />
 * ```
 */
declare function AccessDeniedPage({ showSignInButton, onSignIn, signInHref, ...props }: AccessDeniedPageProps): react_jsx_runtime.JSX.Element;

interface FileItem {
    id: string;
    filename: string;
    fileSize: number;
    fileExtension: string;
    uploadedAt?: Date;
    uploadedBy?: {
        id: string;
        name: string;
    };
    url?: string;
}
interface FileManagerProps {
    /** List of files */
    files: FileItem[];
    /** Total storage used (bytes) */
    totalStorageUsed?: number;
    /** Storage limit (bytes) */
    storageLimit?: number;
    /** Handler for file upload */
    onUpload?: (files: FileList) => void;
    /** Handler for file delete */
    onDelete?: (fileId: string) => void;
    /** Handler for file download */
    onDownload?: (fileId: string) => void;
    /** Handler for file preview */
    onPreview?: (fileId: string) => void;
    /** Upload progress (0-100) */
    uploadProgress?: number;
    /** Whether upload is in progress */
    isUploading?: boolean;
    /** Whether to show drag and drop zone */
    showDropzone?: boolean;
    /** Accepted file types */
    acceptedFileTypes?: string;
    /** Maximum file size in bytes */
    maxFileSize?: number;
    /** Error message to display */
    errorMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * FileManager provides file upload, listing, and management functionality.
 */
declare function FileManager({ files, totalStorageUsed, storageLimit, onUpload, onDelete, onDownload, onPreview, uploadProgress, isUploading, showDropzone, acceptedFileTypes, errorMessage, className, }: FileManagerProps): react_jsx_runtime.JSX.Element;

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category?: string;
}
interface SupportContact {
    type: 'email' | 'phone' | 'chat';
    label: string;
    value: string;
    availability?: string;
}
interface HelpSupportPanelProps {
    /** FAQ items to display */
    faqs?: FAQItem[];
    /** Support contact options */
    contacts?: SupportContact[];
    /** Handler for submitting a support request */
    onSubmitRequest?: (data: {
        subject: string;
        message: string;
        email: string;
    }) => void;
    /** Handler for starting chat */
    onStartChat?: () => void;
    /** Whether chat is available */
    chatAvailable?: boolean;
    /** Help documentation URL */
    docsUrl?: string;
    /** Whether the form is submitting */
    isSubmitting?: boolean;
    /** Success message after submission */
    successMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * HelpSupportPanel provides help documentation, FAQs, and support contact options.
 */
declare function HelpSupportPanel({ faqs, contacts, onSubmitRequest, onStartChat, chatAvailable, docsUrl, isSubmitting, successMessage, className, }: HelpSupportPanelProps): react_jsx_runtime.JSX.Element;

interface HRISProvider {
    /** Provider ID (from Finch) */
    id: string;
    /** Display name */
    displayName: string;
    /** Logo URL */
    logoUrl?: string;
    /** Whether this provider is currently connected */
    connected?: boolean;
    /** Connection status message */
    statusMessage?: string;
    /** Last sync timestamp */
    lastSync?: Date | string;
}
interface HRISProviderSelectorProps {
    /** Available HRIS providers */
    providers: HRISProvider[];
    /** Currently connected provider */
    currentProvider?: HRISProvider;
    /** Callback when provider is selected */
    onProviderSelect?: (provider: HRISProvider) => void;
    /** Callback to disconnect current provider */
    onDisconnect?: () => void;
    /** Callback to reconnect/refresh sync */
    onRefreshSync?: () => void;
    /** Whether providers are loading */
    loading?: boolean;
    /** Search query */
    searchQuery?: string;
    /** Callback when search changes */
    onSearchChange?: (query: string) => void;
    /** Whether to show the CSV import option */
    showCSVOption?: boolean;
    /** Callback for CSV import */
    onCSVImport?: () => void;
    /** Custom class name */
    className?: string;
    /** Labels */
    labels?: {
        search?: string;
        importCSV?: string;
        connected?: string;
        lastSync?: string;
        disconnect?: string;
        refreshSync?: string;
        noProviders?: string;
        syncPending?: string;
        supportEmail?: string;
    };
}
declare function HRISProviderSelector({ providers, currentProvider, onProviderSelect, onDisconnect, onRefreshSync, loading, searchQuery, onSearchChange, showCSVOption, onCSVImport, className, labels, }: HRISProviderSelectorProps): react_jsx_runtime.JSX.Element;

interface InventoryLogEntry {
    id: string;
    createdAt: Date;
    createdBy: {
        id: string;
        name: string;
    };
    type: 'credit' | 'debit';
    amount: number;
    memo?: string;
    balanceAfter?: number;
}
interface InventoryManagerProps {
    /** Service name */
    serviceName: string;
    /** Current inventory count */
    currentInventory: number;
    /** Inventory log entries */
    logEntries?: InventoryLogEntry[];
    /** Whether to show the update modal */
    showUpdateModal?: boolean;
    /** Handler for opening update modal */
    onUpdateClick?: () => void;
    /** Handler for closing update modal */
    onUpdateModalClose?: () => void;
    /** Handler for submitting inventory update */
    onUpdateSubmit?: (data: {
        type: 'credit' | 'debit';
        amount: number;
        memo: string;
    }) => void;
    /** Whether the component is loading */
    isLoading?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * InventoryManager displays inventory status and log with ability to update.
 */
declare function InventoryManager({ serviceName, currentInventory, logEntries, showUpdateModal, onUpdateClick, onUpdateModalClose, onUpdateSubmit, isLoading, className, }: InventoryManagerProps): react_jsx_runtime.JSX.Element;

interface Role {
    id: string;
    name: string;
    description?: string;
}
interface InviteUserModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Handler for closing the modal */
    onOpenChange: (open: boolean) => void;
    /** Handler for submitting the invitation */
    onSubmit?: (data: {
        email: string;
        firstName?: string;
        lastName?: string;
        roleId: string;
        message?: string;
    }) => void;
    /** Available roles to assign */
    roles: Role[];
    /** Default role ID */
    defaultRoleId?: string;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
    /** Entity name (e.g., "provider" or "organization") */
    entityName?: string;
    /** Entity display name */
    entityDisplayName?: string;
    /** Error message to display */
    errorMessage?: string;
    /** Success message to display */
    successMessage?: string;
}
/**
 * InviteUserModal provides a form to invite users with role assignment.
 */
declare function InviteUserModal({ open, onOpenChange, onSubmit, roles, defaultRoleId, isSubmitting, entityName: _entityName, entityDisplayName, errorMessage, successMessage, }: InviteUserModalProps): react_jsx_runtime.JSX.Element;

interface Invoice {
    id: string;
    invoiceNumber: string;
    employerName: string;
    employerId?: string;
    amount: number;
    status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
    issuedDate: Date | string;
    dueDate: Date | string;
    paidDate?: Date | string;
    lineItemCount?: number;
}
interface InvoiceListProps {
    /** List of invoices */
    invoices: Invoice[];
    /** Handler for clicking an invoice */
    onInvoiceClick?: (invoice: Invoice) => void;
    /** Handler for creating a new invoice */
    onCreateInvoice?: () => void;
    /** Handler for searching */
    onSearch?: (query: string) => void;
    /** Handler for filtering by status */
    onFilterStatus?: (status: Invoice['status'] | 'all') => void;
    /** Active status filter */
    statusFilter?: Invoice['status'] | 'all';
    /** Whether the list is loading */
    isLoading?: boolean;
    /** Currency symbol */
    currency?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * InvoiceList displays a filterable list of invoices.
 */
declare function InvoiceList({ invoices, onInvoiceClick, onCreateInvoice, onSearch, onFilterStatus, statusFilter, isLoading, currency, className, }: InvoiceListProps): react_jsx_runtime.JSX.Element;

interface InvoiceLineItem$1 {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}
interface InvoicePaymentDetails {
    invoiceNumber: string;
    status: 'unpaid' | 'paid' | 'overdue' | 'processing';
    issuedDate: Date | string;
    dueDate: Date | string;
    providerName: string;
    providerLogoUrl?: string;
    employerName: string;
    lineItems: InvoiceLineItem$1[];
    subtotal: number;
    tax?: number;
    total: number;
}
interface InvoicePaymentPageProps {
    /** Invoice details */
    invoice?: InvoicePaymentDetails;
    /** Whether the invoice is loading */
    isLoading?: boolean;
    /** Handler for submitting payment */
    onSubmitPayment?: (paymentDetails: PaymentFormData) => void;
    /** Whether payment is processing */
    isProcessing?: boolean;
    /** Error message */
    errorMessage?: string;
    /** Success message (after payment) */
    successMessage?: string;
    /** Currency symbol */
    currency?: string;
    /** Accepted payment methods */
    acceptedMethods?: ('card' | 'ach')[];
    /** Whether to show Stripe branding */
    showStripeBranding?: boolean;
    /** Additional CSS classes */
    className?: string;
}
interface PaymentFormData {
    method: 'card' | 'ach';
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
    name: string;
    email: string;
    routingNumber?: string;
    accountNumber?: string;
}
/**
 * InvoicePaymentPage provides a public-facing invoice payment interface.
 */
declare function InvoicePaymentPage({ invoice, isLoading, onSubmitPayment, isProcessing, errorMessage, successMessage, currency, acceptedMethods, showStripeBranding, className, }: InvoicePaymentPageProps): react_jsx_runtime.JSX.Element;

interface InvoiceLineItem {
    id: string;
    description: string;
    employeeName?: string;
    serviceName?: string;
    date?: Date | string;
    quantity: number;
    unitPrice: number;
    total: number;
}
interface InvoiceDetails {
    id: string;
    invoiceNumber: string;
    status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
    issuedDate: Date | string;
    dueDate: Date | string;
    paidDate?: Date | string;
    providerName: string;
    providerAddress?: string;
    providerPhone?: string;
    providerEmail?: string;
    employerName: string;
    employerAddress?: string;
    employerEmail?: string;
    lineItems: InvoiceLineItem[];
    subtotal: number;
    tax?: number;
    taxRate?: number;
    total: number;
    notes?: string;
    paymentTerms?: string;
}
interface InvoiceViewProps {
    /** Invoice details */
    invoice: InvoiceDetails;
    /** Handler for back button */
    onBack?: () => void;
    /** Handler for editing the invoice */
    onEdit?: () => void;
    /** Handler for sending the invoice */
    onSend?: () => void;
    /** Handler for marking as paid */
    onMarkPaid?: () => void;
    /** Handler for downloading PDF */
    onDownload?: () => void;
    /** Handler for voiding the invoice */
    onVoid?: () => void;
    /** Currency symbol */
    currency?: string;
    /** Provider logo URL */
    providerLogoUrl?: string;
    /** Whether actions are disabled */
    actionsDisabled?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * InvoiceView displays a detailed view of an invoice with actions.
 */
declare function InvoiceView({ invoice, onBack, onEdit, onSend, onMarkPaid, onDownload, onVoid, currency, providerLogoUrl, actionsDisabled, className, }: InvoiceViewProps): react_jsx_runtime.JSX.Element;

interface Language {
    /** Language code (e.g., 'en', 'es', 'fr') */
    code: string;
    /** Display name in the language itself (e.g., 'English', 'Español') */
    name: string;
    /** English name (optional, for searching) */
    englishName?: string;
    /** Flag emoji or icon */
    flag?: string;
    /** Whether this language is RTL */
    rtl?: boolean;
}
declare const DEFAULT_LANGUAGES: Language[];
declare const selectorVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const buttonVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
    variant?: "ghost" | "default" | "minimal" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface LanguageSelectorProps extends VariantProps<typeof selectorVariants>, VariantProps<typeof buttonVariants> {
    /** Currently selected language code */
    value?: string;
    /** Callback when language changes */
    onChange?: (language: Language) => void;
    /** Available languages */
    languages?: Language[];
    /** Placeholder text */
    placeholder?: string;
    /** Whether to show flags */
    showFlags?: boolean;
    /** Whether to show only flag (no text) when collapsed */
    flagOnly?: boolean;
    /** Label for accessibility */
    label?: string;
    /** Whether the selector is disabled */
    disabled?: boolean;
    /** Additional className */
    className?: string;
}
/**
 * A dropdown selector for choosing a language/locale.
 *
 * @example
 * ```tsx
 * const [lang, setLang] = useState('en');
 *
 * <LanguageSelector
 *   value={lang}
 *   onChange={(language) => setLang(language.code)}
 *   showFlags
 * />
 * ```
 */
declare function LanguageSelector({ value, onChange, languages, placeholder, showFlags, flagOnly, label, size, variant, disabled, className, }: LanguageSelectorProps): react_jsx_runtime.JSX.Element;
interface LanguageSelectorNativeProps {
    /** Currently selected language code */
    value?: string;
    /** Callback when language changes */
    onChange?: (language: Language) => void;
    /** Available languages */
    languages?: Language[];
    /** Placeholder text */
    placeholder?: string;
    /** Whether to show flags in options */
    showFlags?: boolean;
    /** Label for accessibility */
    label?: string;
    /** Whether the selector is disabled */
    disabled?: boolean;
    /** Additional className for the select element */
    className?: string;
}
/**
 * A native select element for language selection.
 * Better for mobile and accessibility.
 *
 * @example
 * ```tsx
 * <LanguageSelectorNative
 *   value={lang}
 *   onChange={(language) => setLang(language.code)}
 * />
 * ```
 */
declare function LanguageSelectorNative({ value, onChange, languages, placeholder, showFlags, label, disabled, className, }: LanguageSelectorNativeProps): react_jsx_runtime.JSX.Element;
interface LanguageSelectorInlineProps {
    /** Currently selected language code */
    value?: string;
    /** Callback when language changes */
    onChange?: (language: Language) => void;
    /** Available languages */
    languages?: Language[];
    /** Whether to show flags */
    showFlags?: boolean;
    /** Maximum languages to show (rest in "more" dropdown) */
    maxVisible?: number;
    /** Additional className */
    className?: string;
}
/**
 * Inline language selector showing all options as buttons.
 * Good for small language sets.
 *
 * @example
 * ```tsx
 * <LanguageSelectorInline
 *   value={lang}
 *   onChange={(language) => setLang(language.code)}
 *   languages={[
 *     { code: 'en', name: 'EN', flag: '🇺🇸' },
 *     { code: 'es', name: 'ES', flag: '🇪🇸' },
 *   ]}
 * />
 * ```
 */
declare function LanguageSelectorInline({ value, onChange, languages, showFlags, className, }: LanguageSelectorInlineProps): react_jsx_runtime.JSX.Element;

declare const pageVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface LoadingDotsProps {
    /** Dot size */
    size?: 'sm' | 'md' | 'lg';
    /** Dot color */
    color?: 'primary' | 'secondary' | 'white' | 'current';
    /** Additional className */
    className?: string;
}
/**
 * Animated loading dots indicator.
 *
 * @example
 * ```tsx
 * <LoadingDots size="md" />
 * ```
 */
declare function LoadingDots({ size, color, className, }: LoadingDotsProps): react_jsx_runtime.JSX.Element;
interface LoadingBarProps {
    /** Progress value (0-100). If undefined, shows indeterminate animation */
    progress?: number;
    /** Bar color */
    color?: 'primary' | 'success' | 'warning' | 'error';
    /** Show percentage text */
    showPercentage?: boolean;
    /** Additional className */
    className?: string;
}
/**
 * A horizontal loading/progress bar.
 *
 * @example
 * ```tsx
 * <LoadingBar progress={45} showPercentage />
 * ```
 */
declare function LoadingBar({ progress, color, showPercentage, className, }: LoadingBarProps): react_jsx_runtime.JSX.Element;
interface LoadingPageProps extends VariantProps<typeof pageVariants> {
    /** Loading message */
    message?: string;
    /** Sub-message or additional info */
    subMessage?: string;
    /** Loading indicator type */
    indicator?: 'spinner' | 'dots' | 'bar' | 'pulse';
    /** Spinner size (when indicator is 'spinner') */
    spinnerSize?: SpinnerProps['size'];
    /** Progress value for bar indicator */
    progress?: number;
    /** Custom loading content */
    children?: React$1.ReactNode;
    /** Additional className */
    className?: string;
}
/**
 * A full-page loading state component.
 *
 * @example
 * ```tsx
 * <LoadingPage message="Loading your data..." />
 * ```
 */
declare function LoadingPage({ message, subMessage, indicator, spinnerSize, progress, size, children, className, }: LoadingPageProps): react_jsx_runtime.JSX.Element;
interface LoadingOverlayProps {
    /** Whether the overlay is visible */
    isLoading: boolean;
    /** Loading message */
    message?: string;
    /** Overlay backdrop style */
    backdrop?: 'blur' | 'solid' | 'transparent';
    /** Spinner size */
    spinnerSize?: SpinnerProps['size'];
    /** Additional className */
    className?: string;
    /** Content to overlay */
    children?: React$1.ReactNode;
}
/**
 * An overlay that displays a loading state over content.
 *
 * @example
 * ```tsx
 * <LoadingOverlay isLoading={isSubmitting} message="Saving...">
 *   <YourContent />
 * </LoadingOverlay>
 * ```
 */
declare function LoadingOverlay({ isLoading, message, backdrop, spinnerSize, className, children, }: LoadingOverlayProps): react_jsx_runtime.JSX.Element;
interface LoadingSkeletonProps {
    /** Skeleton variant */
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    /** Width (accepts any CSS value) */
    width?: string | number;
    /** Height (accepts any CSS value) */
    height?: string | number;
    /** Number of repeated skeletons */
    count?: number;
    /** Animation type */
    animation?: 'pulse' | 'wave' | 'none';
    /** Additional className */
    className?: string;
}
/**
 * A skeleton loader placeholder for content.
 *
 * @example
 * ```tsx
 * <LoadingSkeleton variant="text" count={3} />
 * ```
 */
declare function LoadingSkeleton({ variant, width, height, count, animation, className, }: LoadingSkeletonProps): react_jsx_runtime.JSX.Element;
interface CardSkeletonProps {
    /** Show image placeholder */
    hasImage?: boolean;
    /** Number of text lines */
    lines?: number;
    /** Additional className */
    className?: string;
}
/**
 * A card-shaped skeleton loader.
 *
 * @example
 * ```tsx
 * <CardSkeleton hasImage lines={3} />
 * ```
 */
declare function CardSkeleton({ hasImage, lines, className, }: CardSkeletonProps): react_jsx_runtime.JSX.Element;

interface MessageStatusIconProps {
    status: MessageStatus;
    className?: string;
}
/**
 * Visual status indicator for messages (checkmarks).
 */
declare function MessageStatusIcon({ status, className }: MessageStatusIconProps): react_jsx_runtime.JSX.Element;
interface ReadReceiptIndicatorProps {
    /** Read receipts to display */
    receipts: ReadReceipt[];
    /** Maximum avatars to show before +N */
    maxAvatars?: number;
    /** Size of avatars */
    size?: 'xs' | 'sm';
    className?: string;
}
/**
 * Displays read receipt avatars for group conversations.
 */
declare function ReadReceiptIndicator({ receipts, maxAvatars, size, className, }: ReadReceiptIndicatorProps): react_jsx_runtime.JSX.Element | null;
interface AttachmentPreviewProps {
    attachment: MessageAttachment;
    onClick?: () => void;
    className?: string;
}
/**
 * Renders an attachment preview within a message bubble.
 */
declare function AttachmentPreview({ attachment, onClick, className, }: AttachmentPreviewProps): react_jsx_runtime.JSX.Element;
/**
 * Format file size in human-readable format.
 */
declare function formatFileSize(bytes: number): string;
declare const bubbleVariants: (props?: ({
    variant?: "system" | "outgoing" | "incoming" | null | undefined;
    status?: "sending" | "sent" | "delivered" | "read" | "failed" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface MessageBubbleProps extends Omit<React$1.HTMLAttributes<HTMLDivElement>, 'id'>, VariantProps<typeof bubbleVariants> {
    /** The message to display */
    message: Message;
    /** Whether to show the sender's avatar */
    showAvatar?: boolean;
    /** Whether to show the sender's name (for group chats) */
    showSenderName?: boolean;
    /** Whether to show the timestamp */
    showTimestamp?: boolean;
    /** Whether to show message status */
    showStatus?: boolean;
    /** Whether to show read receipts */
    showReadReceipts?: boolean;
    /** Called when retry is clicked for failed messages */
    onRetry?: () => void;
    /** Called when an attachment is clicked */
    onAttachmentClick?: (attachment: MessageAttachment) => void;
    /** Whether this is the current user's message */
    isOutgoing?: boolean;
    /** Custom timestamp formatter */
    formatTimestamp?: (timestamp: Date | string) => string;
}
/**
 * A message bubble component for displaying individual messages.
 *
 * @example
 * ```tsx
 * <MessageBubble
 *   message={message}
 *   isOutgoing={message.sender.isCurrentUser}
 *   showAvatar
 *   showTimestamp
 * />
 * ```
 */
declare const MessageBubble: React$1.ForwardRefExoticComponent<MessageBubbleProps & React$1.RefAttributes<HTMLDivElement>>;

/**
 * Groups messages by date.
 */
declare function groupMessagesByDate(messages: Message[]): MessageGroup[];
/**
 * Format date label for message grouping.
 */
declare function formatDateLabel(date: Date): string;
/**
 * Check if two messages are from the same sender within a time threshold.
 */
declare function isSameSenderGroup(prev: Message | undefined, current: Message, thresholdMinutes?: number): boolean;
interface SkeletonMessageProps {
    isOutgoing?: boolean;
    showAvatar?: boolean;
    className?: string;
}
/**
 * A skeleton placeholder for loading messages.
 */
declare function SkeletonMessage({ isOutgoing, showAvatar, className, }: SkeletonMessageProps): react_jsx_runtime.JSX.Element;
declare namespace SkeletonMessage {
    var displayName: string;
}
interface TypingIndicatorProps {
    typingState: TypingState;
    className?: string;
}
/**
 * Displays who is currently typing.
 */
declare function TypingIndicator({ typingState, className }: TypingIndicatorProps): react_jsx_runtime.JSX.Element | null;
declare namespace TypingIndicator {
    var displayName: string;
}
interface DateSeparatorProps {
    label: string;
    className?: string;
}
/**
 * A visual separator showing the date between message groups.
 */
declare function DateSeparator({ label, className }: DateSeparatorProps): react_jsx_runtime.JSX.Element;
declare namespace DateSeparator {
    var displayName: string;
}
interface EmptyStateProps {
    /** Custom title */
    title?: string;
    /** Custom description */
    description?: string;
    /** Custom icon */
    icon?: React$1.ReactNode;
    /** Action button */
    action?: React$1.ReactNode;
    className?: string;
}
/**
 * Empty state shown when there are no messages.
 */
declare function EmptyState({ title, description, icon, action, className, }: EmptyStateProps): react_jsx_runtime.JSX.Element;
declare namespace EmptyState {
    var displayName: string;
}
interface LoadMoreButtonProps {
    isLoading?: boolean;
    onClick: () => void;
    className?: string;
}
/**
 * Button to load more message history.
 */
declare function LoadMoreButton({ isLoading, onClick, className, }: LoadMoreButtonProps): react_jsx_runtime.JSX.Element;
declare namespace LoadMoreButton {
    var displayName: string;
}
interface MessageListProps {
    /** Array of messages to display */
    messages: Message[];
    /** Current user for determining outgoing messages */
    currentUser: MessageParticipant;
    /** Whether messages are loading */
    isLoading?: boolean;
    /** Whether more messages are available */
    hasMore?: boolean;
    /** Whether more messages are being loaded */
    isLoadingMore?: boolean;
    /** Typing indicator state */
    typingState?: TypingState;
    /** Show avatars for incoming messages */
    showAvatars?: boolean;
    /** Show sender names (for group conversations) */
    showSenderNames?: boolean;
    /** Group messages by date */
    groupByDate?: boolean;
    /** Callback when load more is triggered */
    onLoadMore?: () => void;
    /** Callback when a message action (retry) is triggered */
    onRetryMessage?: (messageId: string) => void;
    /** Callback when an attachment is clicked */
    onAttachmentClick?: (attachment: MessageAttachment, message: Message) => void;
    /** Custom empty state */
    emptyState?: React$1.ReactNode;
    /** Custom timestamp formatter */
    formatTimestamp?: (timestamp: Date | string) => string;
    /** Additional class name */
    className?: string;
    /** Auto-scroll behavior */
    autoScroll?: 'always' | 'onNewMessage' | 'manual';
}
/**
 * A scrollable list of messages with date grouping, auto-scroll, and loading states.
 *
 * @example
 * ```tsx
 * <MessageList
 *   messages={messages}
 *   currentUser={currentUser}
 *   typingState={typingState}
 *   onLoadMore={handleLoadMore}
 *   showAvatars
 *   groupByDate
 * />
 * ```
 */
declare const MessageList: React$1.ForwardRefExoticComponent<MessageListProps & React$1.RefAttributes<HTMLDivElement>>;

/**
 * Get file type from MIME type.
 */
declare function getFileType(mimeType: string): AttachmentType;
/**
 * Validate file type and size.
 */
declare function validateFile(file: File, acceptedTypes?: string[], maxSize?: number): {
    valid: boolean;
    error?: string;
};
/**
 * Generate a unique ID for attachments.
 */
declare function generateAttachmentId(): string;
interface AttachmentPreviewItemProps {
    /** The attachment to preview */
    attachment: {
        id: string;
        file: File;
        previewUrl?: string;
        type: AttachmentType;
        state: AttachmentState;
        progress?: number;
        error?: string;
    };
    /** Called when remove is clicked */
    onRemove: () => void;
    /** Called when retry is clicked */
    onRetry?: () => void;
    className?: string;
}
/**
 * Preview item for a pending attachment.
 */
declare function AttachmentPreviewItem({ attachment, onRemove, onRetry, className, }: AttachmentPreviewItemProps): react_jsx_runtime.JSX.Element;
declare namespace AttachmentPreviewItem {
    var displayName: string;
}
interface AttachmentPickerProps {
    /** Called when files are selected */
    onFilesSelected: (files: File[]) => void;
    /** Accepted file types (MIME types or extensions) */
    acceptedTypes?: string[];
    /** Maximum file size in bytes */
    maxFileSize?: number;
    /** Maximum number of files */
    maxFiles?: number;
    /** Whether multiple files can be selected */
    multiple?: boolean;
    /** Whether the picker is disabled */
    disabled?: boolean;
    /** Called when an error occurs */
    onError?: (error: string) => void;
    className?: string;
    children?: React$1.ReactNode;
}
/**
 * A button/trigger component for selecting attachments.
 */
declare const AttachmentPicker: React$1.ForwardRefExoticComponent<AttachmentPickerProps & React$1.RefAttributes<HTMLInputElement>>;
interface DragDropZoneProps {
    /** Called when files are dropped */
    onFilesDropped: (files: File[]) => void;
    /** Accepted file types */
    acceptedTypes?: string[];
    /** Maximum file size */
    maxFileSize?: number;
    /** Maximum number of files */
    maxFiles?: number;
    /** Whether the zone is disabled */
    disabled?: boolean;
    /** Called when an error occurs */
    onError?: (error: string) => void;
    /** Children to render inside the zone */
    children: React$1.ReactNode;
    className?: string;
}
/**
 * A wrapper component that accepts drag-and-drop files.
 */
declare function DragDropZone({ onFilesDropped, acceptedTypes, maxFileSize, maxFiles, disabled, onError, children, className, }: DragDropZoneProps): react_jsx_runtime.JSX.Element;
declare namespace DragDropZone {
    var displayName: string;
}
interface CameraButtonProps {
    /** Called when a photo is captured */
    onCapture: (file: File) => void;
    /** Whether to use front camera */
    useFrontCamera?: boolean;
    /** Whether the button is disabled */
    disabled?: boolean;
    className?: string;
}
/**
 * Button to capture photos from camera (mobile).
 */
declare function CameraButton({ onCapture, useFrontCamera, disabled, className, }: CameraButtonProps): react_jsx_runtime.JSX.Element;
declare namespace CameraButton {
    var displayName: string;
}

declare const headerVariants$2: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ConversationHeaderProps extends React$1.HTMLAttributes<HTMLElement>, VariantProps<typeof headerVariants$2> {
    /** The conversation to display */
    conversation?: Conversation;
    /** Custom title (overrides conversation name) */
    title?: string;
    /** Custom subtitle */
    subtitle?: string;
    /** Avatar URL */
    avatarUrl?: string;
    /** Participant for direct messages */
    participant?: MessageParticipant;
    /** Show online status indicator */
    showOnlineStatus?: boolean;
    /** Show back button (mobile) */
    showBackButton?: boolean;
    /** Called when back button is clicked */
    onBack?: () => void;
    /** Additional actions (menu, call, etc.) */
    actions?: React$1.ReactNode;
    /** Custom left content */
    leftContent?: React$1.ReactNode;
    /** Custom right content */
    rightContent?: React$1.ReactNode;
}
/**
 * Get display title for a conversation.
 */
declare function getConversationTitle(conversation?: Conversation, participant?: MessageParticipant): string;
/**
 * Get subtitle for a conversation.
 */
declare function getConversationSubtitle(conversation?: Conversation, participant?: MessageParticipant, showOnlineStatus?: boolean): string | undefined;
/**
 * Format last seen time.
 */
declare function formatLastSeen(date: Date): string;
/**
 * Header component for a conversation/message thread.
 *
 * @example
 * ```tsx
 * <ConversationHeader
 *   conversation={conversation}
 *   showBackButton
 *   onBack={() => navigate('/conversations')}
 *   actions={<IconButton icon={<MoreIcon />} />}
 * />
 * ```
 */
declare const ConversationHeader: React$1.ForwardRefExoticComponent<ConversationHeaderProps & React$1.RefAttributes<HTMLElement>>;
interface ConversationListItemProps extends Omit<React$1.HTMLAttributes<HTMLButtonElement>, 'onSelect'> {
    /** The conversation to display */
    conversation: Conversation;
    /** Whether this item is selected */
    isSelected?: boolean;
    /** Called when the item is clicked */
    onSelect?: (conversation: Conversation) => void;
}
/**
 * A list item for displaying a conversation in a list.
 */
declare const ConversationListItem: React$1.ForwardRefExoticComponent<ConversationListItemProps & React$1.RefAttributes<HTMLButtonElement>>;
interface ConversationListSkeletonProps {
    count?: number;
    className?: string;
}
/**
 * Skeleton loading state for conversation list.
 */
declare function ConversationListSkeleton({ count, className, }: ConversationListSkeletonProps): react_jsx_runtime.JSX.Element;
declare namespace ConversationListSkeleton {
    var displayName: string;
}

interface LightboxModalProps {
    /** The attachment to display */
    attachment: MessageAttachment | null;
    /** Called when the modal is closed */
    onClose: () => void;
}
/**
 * Full-screen lightbox for viewing media attachments.
 */
declare function LightboxModal({ attachment, onClose }: LightboxModalProps): react_jsx_runtime.JSX.Element | null;
declare namespace LightboxModal {
    var displayName: string;
}
interface MessageThreadProps {
    /** The conversation being displayed */
    conversation?: Conversation;
    /** Array of messages in the thread */
    messages: Message[];
    /** Current user for determining message direction */
    currentUser: MessageParticipant;
    /** Typing indicator state */
    typingState?: TypingState;
    /** Whether messages are loading */
    isLoading?: boolean;
    /** Whether more messages are available */
    hasMore?: boolean;
    /** Whether more messages are being loaded */
    isLoadingMore?: boolean;
    /** Whether a message is being sent */
    isSending?: boolean;
    /** Event handlers */
    eventHandlers?: MessagingEventHandlers;
    /** Show header */
    showHeader?: boolean;
    /** Show back button in header */
    showBackButton?: boolean;
    /** Called when back is clicked */
    onBack?: () => void;
    /** Custom header actions */
    headerActions?: React$1.ReactNode;
    /** Composer placeholder */
    placeholder?: string;
    /** Maximum message length */
    maxMessageLength?: number;
    /** Show character count */
    showCharacterCount?: boolean;
    /** Show attachment picker */
    showAttachmentPicker?: boolean;
    /** Show camera button */
    showCameraButton?: boolean;
    /** Accepted file types */
    acceptedFileTypes?: string[];
    /** Maximum file size */
    maxFileSize?: number;
    /** Maximum attachments */
    maxAttachments?: number;
    /** Show avatars in message list */
    showAvatars?: boolean;
    /** Show sender names (group chats) */
    showSenderNames?: boolean;
    /** Group messages by date */
    groupByDate?: boolean;
    /** Custom empty state */
    emptyState?: React$1.ReactNode;
    /** Custom timestamp formatter */
    formatTimestamp?: (timestamp: Date | string) => string;
    /** Called when an error occurs */
    onError?: (error: string) => void;
    /** Additional class name */
    className?: string;
}
/**
 * A complete message thread component combining header, message list, and composer.
 *
 * @example
 * ```tsx
 * <MessageThread
 *   conversation={conversation}
 *   messages={messages}
 *   currentUser={currentUser}
 *   typingState={typingState}
 *   eventHandlers={{
 *     onSendMessage: handleSend,
 *     onLoadMore: handleLoadMore,
 *     onRetryMessage: handleRetry,
 *   }}
 *   showHeader
 *   showBackButton
 *   onBack={() => navigate('/conversations')}
 * />
 * ```
 */
declare const MessageThread: React$1.ForwardRefExoticComponent<MessageThreadProps & React$1.RefAttributes<HTMLDivElement>>;
interface MessagingSplitViewProps {
    /** Conversation list content */
    conversationList: React$1.ReactNode;
    /** Message thread content */
    messageThread: React$1.ReactNode;
    /** Whether a conversation is selected */
    hasSelectedConversation?: boolean;
    /** Width of the conversation list on desktop */
    listWidth?: string | number;
    /** Breakpoint for mobile view */
    mobileBreakpoint?: 'sm' | 'md' | 'lg';
    /** Additional class name */
    className?: string;
}
/**
 * Split view container for desktop with responsive mobile behavior.
 *
 * @example
 * ```tsx
 * <MessagingSplitView
 *   conversationList={<ConversationList />}
 *   messageThread={<MessageThread />}
 *   hasSelectedConversation={!!selectedConversation}
 * />
 * ```
 */
declare function MessagingSplitView({ conversationList, messageThread, hasSelectedConversation, listWidth, mobileBreakpoint, className, }: MessagingSplitViewProps): react_jsx_runtime.JSX.Element;
declare namespace MessagingSplitView {
    var displayName: string;
}

interface UseMessagesOptions {
    /** Initial messages */
    initialMessages?: Message[];
    /** Current user */
    currentUser: MessageParticipant;
    /** Called when a message is sent */
    onSend?: (message: NewMessage) => Promise<Message>;
    /** Called when a message is retried */
    onRetry?: (messageId: string) => Promise<void>;
    /** Called when messages need to be loaded */
    onLoadMore?: () => Promise<Message[]>;
}
interface UseMessagesReturn {
    /** Current messages */
    messages: Message[];
    /** Add a new message (from external source) */
    addMessage: (message: Message) => void;
    /** Update a message */
    updateMessage: (messageId: string, updates: Partial<Message>) => void;
    /** Remove a message */
    removeMessage: (messageId: string) => void;
    /** Send a new message */
    sendMessage: (content: NewMessage) => Promise<void>;
    /** Retry a failed message */
    retryMessage: (messageId: string) => Promise<void>;
    /** Load more messages */
    loadMore: () => Promise<void>;
    /** Whether sending is in progress */
    isSending: boolean;
    /** Whether loading more is in progress */
    isLoadingMore: boolean;
    /** Mark a message as read */
    markAsRead: (messageId: string) => void;
    /** Update message status */
    updateStatus: (messageId: string, status: MessageStatus) => void;
}
/**
 * Hook for managing message state with optimistic updates.
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   sendMessage,
 *   isSending,
 * } = useMessages({
 *   currentUser,
 *   onSend: async (msg) => await api.sendMessage(msg),
 * });
 * ```
 */
declare function useMessages(options: UseMessagesOptions): UseMessagesReturn;
interface UseTypingIndicatorOptions {
    /** Current typing participants (from server) */
    typingParticipants?: MessageParticipant[];
    /** Debounce time for typing stop (ms) */
    debounceTime?: number;
    /** Called when local user starts typing */
    onTypingStart?: () => void;
    /** Called when local user stops typing */
    onTypingStop?: () => void;
}
interface UseTypingIndicatorReturn {
    /** Current typing state */
    typingState: TypingState;
    /** Signal that local user is typing */
    startTyping: () => void;
    /** Signal that local user stopped typing */
    stopTyping: () => void;
    /** Update remote typing participants */
    setTypingParticipants: (participants: MessageParticipant[]) => void;
}
/**
 * Hook for managing typing indicator state.
 *
 * @example
 * ```tsx
 * const { typingState, startTyping, stopTyping } = useTypingIndicator({
 *   onTypingStart: () => socket.emit('typing', true),
 *   onTypingStop: () => socket.emit('typing', false),
 * });
 * ```
 */
declare function useTypingIndicator(options?: UseTypingIndicatorOptions): UseTypingIndicatorReturn;
interface UseMessageScrollOptions {
    /** Messages to watch for changes */
    messages: Message[];
    /** Current user ID */
    currentUserId: string;
    /** Threshold from bottom to consider "at bottom" (px) */
    threshold?: number;
}
interface UseMessageScrollReturn {
    /** Ref to attach to scroll container */
    scrollContainerRef: React$1.RefObject<HTMLDivElement | null>;
    /** Ref to attach to bottom anchor element */
    bottomRef: React$1.RefObject<HTMLDivElement | null>;
    /** Whether user has scrolled up from bottom */
    isScrolledUp: boolean;
    /** Scroll to bottom */
    scrollToBottom: (smooth?: boolean) => void;
}
/**
 * Hook for managing message list scroll behavior.
 *
 * @example
 * ```tsx
 * const { scrollContainerRef, bottomRef, isScrolledUp, scrollToBottom } =
 *   useMessageScroll({ messages, currentUserId: user.id });
 * ```
 */
declare function useMessageScroll(options: UseMessageScrollOptions): UseMessageScrollReturn;
interface UseReadReceiptsOptions {
    /** Messages to track */
    messages: Message[];
    /** Current user ID */
    currentUserId: string;
    /** Called when a message should be marked as read */
    onMarkRead?: (messageId: string) => void;
    /** IntersectionObserver threshold */
    threshold?: number;
}
/**
 * Hook for automatically marking messages as read when visible.
 *
 * @example
 * ```tsx
 * const { observeMessage } = useReadReceipts({
 *   messages,
 *   currentUserId: user.id,
 *   onMarkRead: (id) => socket.emit('read', id),
 * });
 * ```
 */
declare function useReadReceipts(options: UseReadReceiptsOptions): {
    observeMessage: (element: HTMLElement | null, message: Message) => void;
};

interface Notification {
    id: string;
    type: 'order' | 'invoice' | 'claim' | 'message' | 'system' | 'alert';
    title: string;
    message: string;
    timestamp: Date | string;
    isRead: boolean;
    actionUrl?: string;
    actionLabel?: string;
    senderName?: string;
    senderAvatar?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
}
interface NotificationCenterProps {
    /** List of notifications */
    notifications: Notification[];
    /** Handler for marking notification as read */
    onMarkRead?: (notificationId: string) => void;
    /** Handler for marking all as read */
    onMarkAllRead?: () => void;
    /** Handler for clicking a notification */
    onNotificationClick?: (notification: Notification) => void;
    /** Handler for dismissing a notification */
    onDismiss?: (notificationId: string) => void;
    /** Handler for clearing all notifications */
    onClearAll?: () => void;
    /** Whether data is loading */
    isLoading?: boolean;
    /** Maximum notifications to show before "See all" */
    maxVisible?: number;
    /** Handler for "See all" click */
    onSeeAll?: () => void;
    /** Empty state message */
    emptyMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * NotificationCenter displays a list of notifications with actions.
 */
declare function NotificationCenter({ notifications, onMarkRead, onMarkAllRead, onNotificationClick, onDismiss, onClearAll, isLoading, maxVisible, onSeeAll, emptyMessage, className, }: NotificationCenterProps): react_jsx_runtime.JSX.Element;

interface OnboardingStep {
    /** Unique step identifier */
    id: string;
    /** Step title */
    title: string;
    /** Optional step description */
    description?: string;
    /** Optional icon class (FontAwesome) */
    icon?: string;
    /** Whether this step can be skipped */
    skippable?: boolean;
    /** Whether this step is complete */
    complete?: boolean;
    /** Step content render function */
    content: React$1.ReactNode;
}
interface OnboardingWizardProps {
    /** Array of onboarding steps */
    steps: OnboardingStep[];
    /** Current step index (0-based) */
    currentStep?: number;
    /** Callback when step changes */
    onStepChange?: (stepIndex: number) => void;
    /** Callback when wizard completes */
    onComplete?: () => void;
    /** Callback when user skips a step */
    onSkip?: (stepIndex: number) => void;
    /** Brand logo URL */
    logoUrl?: string;
    /** Brand name */
    brandName?: string;
    /** Brand subname */
    brandSubname?: string;
    /** Whether the wizard is in loading state */
    loading?: boolean;
    /** Loading message */
    loadingMessage?: string;
    /** Error message to display */
    error?: string;
    /** Custom class name */
    className?: string;
    /** Whether to show the header */
    showHeader?: boolean;
    /** Custom header content */
    headerContent?: React$1.ReactNode;
    /** Labels for buttons */
    labels?: {
        back?: string;
        next?: string;
        skip?: string;
        finish?: string;
    };
    /** Whether back button is enabled */
    backEnabled?: boolean;
    /** Whether next button is enabled */
    nextEnabled?: boolean;
}
declare function OnboardingWizard({ steps, currentStep, onStepChange, onComplete, onSkip, logoUrl, brandName, brandSubname, loading, loadingMessage, error, className, showHeader, headerContent, labels, backEnabled, nextEnabled, }: OnboardingWizardProps): react_jsx_runtime.JSX.Element;
interface OnboardingStepQuestionProps {
    /** Question icon */
    icon?: string;
    /** Question title */
    title: string;
    /** Question description */
    description?: string;
    /** Answer options */
    options?: Array<{
        id: string;
        label: string;
        icon?: string;
        selected?: boolean;
    }>;
    /** Callback when option is selected */
    onSelect?: (optionId: string) => void;
    /** Whether multiple selections are allowed */
    multiple?: boolean;
    /** Additional content below options */
    children?: React$1.ReactNode;
}
declare function OnboardingStepQuestion({ icon, title, description, options, onSelect, multiple: _multiple, children, }: OnboardingStepQuestionProps): react_jsx_runtime.JSX.Element;
interface OnboardingCompletionProps {
    /** Whether setup is complete */
    completed: boolean;
    /** Incomplete steps */
    incompleteSteps?: Array<{
        step: number;
        label: string;
    }>;
    /** Callback to go to a specific step */
    onGoToStep?: (step: number) => void;
    /** Callback to start first order */
    onStartOrder?: () => void;
    /** Callback to go to dashboard */
    onGoToDashboard?: () => void;
    /** Callback to go to employees */
    onGoToEmployees?: () => void;
}
declare function OnboardingCompletion({ completed, incompleteSteps, onGoToStep, onStartOrder, onGoToDashboard, onGoToEmployees, }: OnboardingCompletionProps): react_jsx_runtime.JSX.Element;

type OrderStatus$1 = 'pending' | 'active' | 'scheduled' | 'in-progress' | 'completed' | 'rejected' | 'invoiced' | 'cancelled';
interface OrderService {
    id: string;
    name: string;
    price?: number;
    status?: 'pending' | 'completed' | 'cancelled';
}
interface OrderEmployee {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
}
interface OrderEmployer {
    id: string;
    name: string;
}
interface OrderCardProps {
    /** Unique order ID */
    id: string;
    /** Order number for display */
    orderNumber: string;
    /** Current order status */
    status: OrderStatus$1;
    /** Employee associated with the order */
    employee: OrderEmployee;
    /** Employer who placed the order */
    employer?: OrderEmployer;
    /** Services included in the order */
    services: OrderService[];
    /** Order creation date */
    createdAt: Date;
    /** Scheduled appointment date */
    scheduledDate?: Date;
    /** Completed date */
    completedDate?: Date;
    /** Total order amount */
    totalAmount?: number;
    /** Rejection reason if rejected */
    rejectionReason?: string;
    /** Whether the card is selected */
    selected?: boolean;
    /** Click handler for the card */
    onClick?: (id: string) => void;
    /** Click handler for view action */
    onView?: (id: string) => void;
    /** Click handler for accept action */
    onAccept?: (id: string) => void;
    /** Click handler for reject action */
    onReject?: (id: string) => void;
    /** Additional CSS classes */
    className?: string;
    /** Currency code for formatting */
    currency?: string;
}
/**
 * OrderCard displays a summary of an order/referral with employee info,
 * services, status, and quick actions.
 */
declare function OrderCard({ id, orderNumber, status, employee, employer, services, createdAt, scheduledDate, totalAmount, rejectionReason, selected, onClick, onView, onAccept, onReject, className, currency, }: OrderCardProps): react_jsx_runtime.JSX.Element;

interface OrderDetails {
    id: string;
    orderNumber: string;
    employeeName: string;
    dateOfBirth?: string;
    serviceName: string;
    employerName: string;
    scheduledDate?: Date | string;
    notes?: string;
}
interface ConfirmationResult {
    orderId: string;
    employeeVerified: boolean;
    consentObtained: boolean;
    idVerified: boolean;
    notes?: string;
}
interface OrderConfirmationWizardProps {
    /** Order details to confirm */
    order: OrderDetails;
    /** Handler for completing the confirmation */
    onComplete?: (result: ConfirmationResult) => void;
    /** Handler for canceling */
    onCancel?: () => void;
    /** Handler for step changes */
    onStepChange?: (step: number) => void;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
    /** Initial step (1-based) */
    initialStep?: number;
    /** Custom step titles */
    stepTitles?: [string, string, string];
    /** Additional CSS classes */
    className?: string;
}
/**
 * OrderConfirmationWizard provides a 3-step process for confirming orders.
 */
declare function OrderConfirmationWizard({ order, onComplete, onCancel, onStepChange, isSubmitting, initialStep, stepTitles, className, }: OrderConfirmationWizardProps): react_jsx_runtime.JSX.Element;

type OrderStatus = 'pending' | 'active' | 'scheduled' | 'in-progress' | 'completed' | 'rejected' | 'invoiced' | 'cancelled';
interface OrderListTab {
    /** Unique identifier for the tab */
    id: string;
    /** Display label */
    label: string;
    /** Count badge number */
    count?: number;
    /** Filter status(es) for this tab */
    statuses?: OrderStatus[];
}
interface OrderListProps<T> {
    /** List of orders */
    orders: T[];
    /** Currently active tab ID */
    activeTab: string;
    /** Available tabs */
    tabs: OrderListTab[];
    /** Handler for tab change */
    onTabChange?: (tabId: string) => void;
    /** Render function for each order item */
    renderOrder: (order: T, index: number) => React$1.ReactNode;
    /** Get status from order item */
    getOrderStatus?: (order: T) => OrderStatus;
    /** Loading state */
    isLoading?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Empty state icon */
    emptyIcon?: React$1.ReactNode;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Search value */
    searchValue?: string;
    /** Handler for search change */
    onSearchChange?: (value: string) => void;
    /** Whether to show search */
    showSearch?: boolean;
    /** Additional actions slot */
    actions?: React$1.ReactNode;
    /** Additional class name */
    className?: string;
}
/**
 * OrderList provides a tabbed list view for orders with filtering and search.
 */
declare function OrderList<T>({ orders, activeTab, tabs, onTabChange, renderOrder, getOrderStatus, isLoading, emptyMessage, emptyIcon, searchPlaceholder, searchValue, onSearchChange, showSearch, actions, className, }: OrderListProps<T>): react_jsx_runtime.JSX.Element;
declare const defaultOrderTabs: OrderListTab[];

interface OrderLookupFormProps {
    /** Handler for form submission */
    onSubmit?: (data: OrderLookupData) => void;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
    /** Error message to display */
    errorMessage?: string;
    /** Whether the order was not found */
    notFound?: boolean;
    /** Provider logo URL */
    providerLogo?: string;
    /** Provider name */
    providerName?: string;
    /** Custom welcome message */
    welcomeMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
interface OrderLookupData {
    orderNumber: string;
    dateOfBirth: string;
    lastName: string;
}
/**
 * OrderLookupForm provides a public-facing form to look up an order.
 */
declare function OrderLookupForm({ onSubmit, isSubmitting, errorMessage, notFound, providerLogo, providerName, welcomeMessage, className, }: OrderLookupFormProps): react_jsx_runtime.JSX.Element;

interface OrderSidebarProps {
    /** Order ID */
    orderId?: string;
    /** Current order status */
    status?: string;
    /** Patient/Employee name */
    patientName?: string;
    /** Employer name */
    employerName?: string;
    /** Service name */
    serviceName?: string;
    /** Order creation date */
    createdAt?: Date | string;
    /** Scheduled date */
    scheduledDate?: Date | string;
    /** Priority level */
    priority?: 'normal' | 'urgent' | 'stat';
    /** Notes about the order */
    notes?: string;
    /** Whether the sidebar is open */
    open?: boolean;
    /** Handler for closing the sidebar */
    onClose?: () => void;
    /** Actions available for this order */
    actions?: Array<{
        id: string;
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
        disabled?: boolean;
    }>;
    /** Additional content to render */
    children?: React$1.ReactNode;
    /** Additional CSS classes */
    className?: string;
}
/**
 * OrderSidebar displays order details in a slide-out panel.
 */
declare function OrderSidebar({ orderId, status, patientName, employerName, serviceName, createdAt, scheduledDate, priority, notes, open, onClose, actions, children, className, }: OrderSidebarProps): react_jsx_runtime.JSX.Element | null;

interface PageHeaderProps {
    /** Main title of the page/section */
    title: string;
    /** Optional subtitle or description */
    subtitle?: string;
    /** Optional icon to display before the title */
    icon?: React$1.ReactNode;
    /** Vertical alignment of the icon */
    iconAlign?: 'top' | 'center';
    /** Action buttons or controls to display on the right */
    actions?: React$1.ReactNode;
    /** Additional content below the title (e.g., breadcrumbs, tabs) */
    children?: React$1.ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show a bottom border */
    bordered?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}
/**
 * PageHeader displays a section header with title, subtitle, and action buttons.
 * Used as a consistent header pattern across pages and sections.
 */
declare function PageHeader({ title, subtitle, icon, iconAlign, actions, children, className, bordered, size, }: PageHeaderProps): react_jsx_runtime.JSX.Element;

interface Payment {
    id: string;
    invoiceNumber: string;
    invoiceId?: string;
    employerName: string;
    amount: number;
    method: 'credit_card' | 'ach' | 'check' | 'cash' | 'other';
    status: 'completed' | 'pending' | 'failed' | 'refunded';
    date: Date | string;
    reference?: string;
    cardLast4?: string;
}
interface PaymentHistoryTableProps {
    /** List of payments */
    payments: Payment[];
    /** Handler for clicking a payment */
    onPaymentClick?: (payment: Payment) => void;
    /** Handler for clicking an invoice link */
    onInvoiceClick?: (invoiceId: string) => void;
    /** Handler for issuing a refund */
    onRefund?: (payment: Payment) => void;
    /** Whether the table is loading */
    isLoading?: boolean;
    /** Currency symbol */
    currency?: string;
    /** Empty state message */
    emptyMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * PaymentHistoryTable displays a table of payment transactions.
 */
declare function PaymentHistoryTable({ payments, onPaymentClick, onInvoiceClick, onRefund, isLoading, currency, emptyMessage, className, }: PaymentHistoryTableProps): react_jsx_runtime.JSX.Element;

/**
 * Credit card data for display (masked)
 */
interface CreditCardData {
    /** Payment method ID */
    id: string;
    /** Card brand (visa, mastercard, amex, discover, etc.) */
    brand: string;
    /** Last 4 digits of card number */
    last4: string;
    /** Expiration month (1-12) */
    expMonth: number;
    /** Expiration year (4 digits) */
    expYear: number;
    /** Whether this is the default payment method */
    isDefault?: boolean;
}
/**
 * Bank account data for display (masked)
 */
interface BankAccountData {
    /** Payment method ID */
    id: string;
    /** Bank name */
    bankName?: string;
    /** Last 4 digits of account number */
    last4: string;
    /** Account holder name */
    holderName?: string;
    /** Account type (checking, savings) */
    accountType?: 'checking' | 'savings';
    /** Account holder type */
    holderType?: 'individual' | 'company';
    /** Account status (new, verified, etc.) */
    status?: 'new' | 'verified' | 'errored' | 'verification_failed';
    /** Whether this is the default payment method */
    isDefault?: boolean;
}
interface PaymentMethodCardProps {
    /** Credit card data */
    card: CreditCardData;
    /** Whether the card is selectable */
    selectable?: boolean;
    /** Whether this card is currently selected */
    selected?: boolean;
    /** Callback when card is selected */
    onSelect?: (id: string) => void;
    /** Callback when delete is clicked */
    onDelete?: (id: string) => void;
    /** Whether to show delete button */
    showDelete?: boolean;
    /** Whether the card is disabled */
    disabled?: boolean;
    /** Custom className */
    className?: string;
}
/**
 * Displays a credit card with brand icon, masked number, and expiration.
 *
 * @example
 * ```tsx
 * <PaymentMethodCard
 *   card={{
 *     id: 'pm_123',
 *     brand: 'visa',
 *     last4: '4242',
 *     expMonth: 12,
 *     expYear: 2025,
 *     isDefault: true,
 *   }}
 *   onSelect={(id) => console.log('Selected:', id)}
 *   onDelete={(id) => console.log('Delete:', id)}
 *   showDelete
 * />
 * ```
 */
declare function PaymentMethodCard({ card, selectable, selected, onSelect, onDelete, showDelete, disabled, className, }: PaymentMethodCardProps): react_jsx_runtime.JSX.Element;
declare namespace PaymentMethodCard {
    var displayName: string;
}
interface PaymentMethodBankProps {
    /** Bank account data */
    account: BankAccountData;
    /** Whether the account is selectable */
    selectable?: boolean;
    /** Whether this account is currently selected */
    selected?: boolean;
    /** Callback when account is selected */
    onSelect?: (id: string) => void;
    /** Callback when delete is clicked */
    onDelete?: (id: string) => void;
    /** Whether to show delete button */
    showDelete?: boolean;
    /** Whether the account is disabled */
    disabled?: boolean;
    /** Custom className */
    className?: string;
}
/**
 * Displays a bank account with masked number and account details.
 *
 * @example
 * ```tsx
 * <PaymentMethodBank
 *   account={{
 *     id: 'ba_123',
 *     bankName: 'Chase',
 *     last4: '6789',
 *     holderName: 'John Doe',
 *     accountType: 'checking',
 *     status: 'verified',
 *     isDefault: true,
 *   }}
 *   onSelect={(id) => console.log('Selected:', id)}
 *   onDelete={(id) => console.log('Delete:', id)}
 *   showDelete
 * />
 * ```
 */
declare function PaymentMethodBank({ account, selectable, selected, onSelect, onDelete, showDelete, disabled, className, }: PaymentMethodBankProps): react_jsx_runtime.JSX.Element;
declare namespace PaymentMethodBank {
    var displayName: string;
}
type PaymentMethod = {
    type: 'card';
    data: CreditCardData;
} | {
    type: 'bank';
    data: BankAccountData;
};
interface PaymentMethodListProps {
    /** Array of payment methods */
    methods: PaymentMethod[];
    /** Currently selected method ID */
    selectedId?: string;
    /** Callback when a method is selected */
    onSelect?: (id: string) => void;
    /** Callback when a method is deleted */
    onDelete?: (id: string) => void;
    /** Whether to show delete buttons */
    showDelete?: boolean;
    /** Whether the list is disabled */
    disabled?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Custom className */
    className?: string;
}
/**
 * Displays a grid of payment methods (cards and bank accounts).
 *
 * @example
 * ```tsx
 * <PaymentMethodList
 *   methods={[
 *     { type: 'card', data: { id: '1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2025 } },
 *     { type: 'bank', data: { id: '2', bankName: 'Chase', last4: '6789' } },
 *   ]}
 *   selectedId="1"
 *   onSelect={(id) => console.log('Selected:', id)}
 *   onDelete={(id) => console.log('Delete:', id)}
 *   showDelete
 * />
 * ```
 */
declare function PaymentMethodList({ methods, selectedId, onSelect, onDelete, showDelete, disabled, emptyMessage, className, }: PaymentMethodListProps): react_jsx_runtime.JSX.Element;
declare namespace PaymentMethodList {
    var displayName: string;
}

interface PendingClaim {
    id: string;
    claimantName: string;
    claimantEmail: string;
    claimantRole?: string;
    submittedDate: Date | string;
    message?: string;
    status: 'pending' | 'approved' | 'rejected';
}
interface PendingClaimsTableProps {
    /** List of pending claims */
    claims: PendingClaim[];
    /** Handler for approving a claim */
    onApprove?: (claim: PendingClaim) => void;
    /** Handler for rejecting a claim */
    onReject?: (claim: PendingClaim) => void;
    /** Handler for viewing claim details */
    onViewDetails?: (claim: PendingClaim) => void;
    /** Whether actions are disabled */
    actionsDisabled?: boolean;
    /** Whether the table is loading */
    isLoading?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * PendingClaimsTable displays a table of pending provider claims.
 */
declare function PendingClaimsTable({ claims, onApprove, onReject, onViewDetails, actionsDisabled, isLoading, emptyMessage, className, }: PendingClaimsTableProps): react_jsx_runtime.JSX.Element;

interface Permission {
    /** Unique permission ID */
    id: string;
    /** Display name */
    name: string;
    /** Optional description */
    description?: string;
    /** Parent permission ID (for hierarchy) */
    parentId?: string | null;
    /** Child permissions */
    children?: Permission[];
    /** Whether this permission is currently assigned */
    isAssigned?: boolean;
    /** Project/scope identifier */
    project?: string;
}
interface PermissionGroup {
    /** Group ID */
    id: string;
    /** Group name (e.g., "Admin", "Provider", "Employer") */
    name: string;
    /** Permissions in this group */
    permissions: Permission[];
    /** Whether group is expanded */
    defaultExpanded?: boolean;
}
interface EmployerAccess {
    /** Employer ID */
    id: string;
    /** Employer name */
    name: string;
    /** Address info */
    address?: {
        street1?: string;
        city?: string;
        state?: string;
    };
}
interface PermissionsEditorProps {
    /** User name being edited */
    userName?: string;
    /** Permission groups to display */
    groups: PermissionGroup[];
    /** Currently assigned permission IDs */
    assignedPermissions: string[];
    /** Callback when permissions change */
    onPermissionsChange: (permissionIds: string[]) => void;
    /** Whether to show employer access section */
    showEmployerAccess?: boolean;
    /** Available employers for access selection */
    employers?: EmployerAccess[];
    /** Currently selected employer IDs */
    selectedEmployers?: string[];
    /** Callback when employer selection changes */
    onEmployersChange?: (employerIds: string[]) => void;
    /** Labels for i18n */
    labels?: {
        userRole?: string;
        employerAccess?: string;
        selectEmployer?: string;
        summary?: string;
        all?: string;
        save?: string;
        cancel?: string;
    };
    /** Custom className */
    className?: string;
}
/**
 * A hierarchical permission editor with support for nested permissions,
 * employer access control, and summary display.
 *
 * @example
 * ```tsx
 * const [permissions, setPermissions] = useState(['admin', 'view-orders']);
 * const [employers, setEmployers] = useState([]);
 *
 * <PermissionsEditor
 *   userName="John Doe"
 *   groups={permissionGroups}
 *   assignedPermissions={permissions}
 *   onPermissionsChange={setPermissions}
 *   showEmployerAccess
 *   employers={employerList}
 *   selectedEmployers={employers}
 *   onEmployersChange={setEmployers}
 * />
 * ```
 */
declare function PermissionsEditor({ userName, groups, assignedPermissions, onPermissionsChange, showEmployerAccess, employers, selectedEmployers, onEmployersChange, labels, className, }: PermissionsEditorProps): react_jsx_runtime.JSX.Element;

interface ProductVersionProps {
    /** Product name */
    name: string;
    /** Version string (e.g., "1.2.3", "v2.0.0-beta") */
    version: string;
    /** Build number or commit hash (optional) */
    build?: string;
    /** Environment label (optional) */
    environment?: 'development' | 'staging' | 'production' | string;
    /** Additional copyright text */
    copyright?: string;
    /** Year for copyright (defaults to current year) */
    year?: number | string;
    /** Company or author name for copyright */
    author?: string;
    /** Link to changelog or release notes */
    changelogUrl?: string;
    /** Display variant */
    variant?: 'inline' | 'stacked' | 'minimal';
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Custom className */
    className?: string;
    /** Click handler */
    onClick?: () => void;
}
/**
 * Displays product version information, typically used in footers or settings pages.
 *
 * @example
 * ```tsx
 * // Minimal display
 * <ProductVersion name="BlueHive" version="2.1.0" variant="minimal" />
 *
 * // Full display with all details
 * <ProductVersion
 *   name="BlueHive"
 *   version="2.1.0"
 *   build="abc1234"
 *   environment="production"
 *   author="MIE"
 *   year={2024}
 * />
 * ```
 */
declare function ProductVersion({ name, version, build, environment, copyright, year, author, changelogUrl, variant, size, className, onClick, }: ProductVersionProps): react_jsx_runtime.JSX.Element;
interface ProductVersionBadgeProps {
    /** Version string */
    version: string;
    /** Build number or commit hash */
    build?: string;
    /** Environment label */
    environment?: 'development' | 'staging' | 'production' | string;
    /** Custom className */
    className?: string;
}
/**
 * Compact badge showing version and optional environment.
 *
 * @example
 * ```tsx
 * <ProductVersionBadge version="2.1.0" environment="staging" />
 * ```
 */
declare function ProductVersionBadge({ version, build, environment, className, }: ProductVersionBadgeProps): react_jsx_runtime.JSX.Element;

interface ProviderAddress$1 {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
}
interface ProviderService {
    _id: string;
    name: string;
    slug: string;
}
interface Provider {
    _id: string;
    name: string;
    slug: string;
    logoURL?: string;
    address: ProviderAddress$1;
    workNumber?: string;
    distance?: number;
    services?: ProviderService[];
    verified?: boolean;
    safeFromWildfires?: boolean;
}
declare const providerCardVariants: (props?: ({
    variant?: "list" | "compact" | "featured" | null | undefined;
    interactive?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ProviderCardProps extends VariantProps<typeof providerCardVariants>, Omit<React$1.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    /** Provider data to display */
    provider: Provider;
    /** Click handler - navigates to provider detail */
    onClick?: (provider: Provider) => void;
    /** Phone click handler */
    onPhoneClick?: (phone: string, provider: Provider) => void;
    /** Show services as badges */
    showServices?: boolean;
    /** Maximum number of services to show */
    maxServices?: number;
    /** Custom render for actions */
    renderActions?: (provider: Provider) => React$1.ReactNode;
}
/**
 * A card component for displaying provider information in search results and listings.
 *
 * @example
 * ```tsx
 * <ProviderCard
 *   provider={provider}
 *   variant="compact"
 *   onClick={(p) => navigate(`/provider/${p.slug}`)}
 *   onPhoneClick={(phone) => trackPhoneClick(phone)}
 * />
 * ```
 */
declare const ProviderCard: React$1.ForwardRefExoticComponent<ProviderCardProps & React$1.RefAttributes<HTMLDivElement>>;
interface ProviderCardGridProps {
    /** Array of providers to display */
    providers: Provider[];
    /** Card variant */
    variant?: 'compact' | 'list';
    /** Loading state */
    loading?: boolean;
    /** Number of skeleton cards to show when loading */
    skeletonCount?: number;
    /** Click handler for cards */
    onProviderClick?: (provider: Provider) => void;
    /** Phone click handler */
    onPhoneClick?: (phone: string, provider: Provider) => void;
    /** Show services on cards */
    showServices?: boolean;
    /** Empty state content */
    emptyState?: React$1.ReactNode;
    /** Additional class names */
    className?: string;
}
/**
 * A responsive grid of provider cards with loading and empty states.
 */
declare const ProviderCardGrid: React$1.FC<ProviderCardGridProps>;
interface ProviderCardSkeletonProps {
    variant?: 'compact' | 'list' | 'featured';
}
declare const ProviderCardSkeleton: React$1.FC<ProviderCardSkeletonProps>;

interface ProviderAddress {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
}
interface ProviderUrls {
    website?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    yelp?: string;
    youtube?: string;
    pinterest?: string;
    blog?: string;
}
interface BreadcrumbItem {
    label: string;
    href: string;
}
interface ProviderDetailData {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    address: ProviderAddress;
    phoneNumber?: string;
    urls?: ProviderUrls;
    isVerified?: boolean;
    isClaimed?: boolean;
    lastUpdated?: Date | string;
}
declare const actionButtonVariants: (props?: ({
    variant?: "default" | "active" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ActionButtonProps extends React$1.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof actionButtonVariants> {
    icon: React$1.ReactNode;
    label: string;
    href?: string;
}
declare function ActionButton({ icon, label, variant, href, className, onClick, ...props }: ActionButtonProps): react_jsx_runtime.JSX.Element;
interface ActionButtonsBarProps {
    provider: ProviderDetailData;
    onShare?: () => void;
    onCopyLink?: () => void;
    onCall?: (phoneNumber: string) => void;
    className?: string;
}
declare function ActionButtonsBar({ provider, onShare, onCopyLink, onCall, className, }: ActionButtonsBarProps): react_jsx_runtime.JSX.Element;
interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}
declare function Breadcrumb({ items, className }: BreadcrumbProps): react_jsx_runtime.JSX.Element;
interface MobileBackButtonProps {
    href: string;
    label?: string;
    className?: string;
}
declare function MobileBackButton({ href, label, className, }: MobileBackButtonProps): react_jsx_runtime.JSX.Element;
interface ProviderLogoProps {
    src?: string;
    name: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}
declare function ProviderLogo({ src, name, size, className, }: ProviderLogoProps): react_jsx_runtime.JSX.Element;
interface SocialMediaLinksProps$1 {
    urls: ProviderUrls;
    providerName: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}
declare function SocialMediaLinks$1({ urls, providerName, size, className, }: SocialMediaLinksProps$1): react_jsx_runtime.JSX.Element | null;
interface VerifiedBadgeProps {
    isVerified?: boolean;
    isClaimed?: boolean;
    lastUpdated?: Date | string;
    className?: string;
}
declare function VerifiedBadge({ isVerified, isClaimed, lastUpdated, className, }: VerifiedBadgeProps): react_jsx_runtime.JSX.Element;
interface AddressDisplayProps {
    address: ProviderAddress;
    linkToMaps?: boolean;
    className?: string;
}
declare function AddressDisplay({ address, linkToMaps, className, }: AddressDisplayProps): react_jsx_runtime.JSX.Element;
interface ClaimListingButtonProps {
    slug: string;
    href?: string;
    className?: string;
}
declare function ClaimListingButton({ slug, href, className, }: ClaimListingButtonProps): react_jsx_runtime.JSX.Element;
interface ReportLinkProps {
    slug: string;
    href?: string;
    className?: string;
}
declare function ReportLink({ slug, href, className }: ReportLinkProps): react_jsx_runtime.JSX.Element;
declare const bookButtonVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
    variant?: "primary" | "outline" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BookAppointmentButtonProps extends React$1.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof bookButtonVariants> {
    showIcon?: boolean;
}
declare function BookAppointmentButton({ size, variant, showIcon, className, children, ...props }: BookAppointmentButtonProps): react_jsx_runtime.JSX.Element;
declare const headerVariants$1: (props?: ({
    variant?: "flat" | "default" | "elevated" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ProviderDetailHeaderProps extends VariantProps<typeof headerVariants$1> {
    provider: ProviderDetailData;
    breadcrumbs?: BreadcrumbItem[];
    backButtonHref?: string;
    showActionButtons?: boolean;
    showBreadcrumb?: boolean;
    showSocialLinks?: boolean;
    showVerifiedBadge?: boolean;
    showClaimButton?: boolean;
    showReportLink?: boolean;
    showBookButton?: boolean;
    onShare?: () => void;
    onCopyLink?: () => void;
    onCall?: (phoneNumber: string) => void;
    onBook?: () => void;
    className?: string;
}
declare function ProviderDetailHeader({ provider, breadcrumbs, backButtonHref, variant, showActionButtons, showBreadcrumb, showSocialLinks, showVerifiedBadge, showClaimButton, showReportLink, showBookButton, onShare, onCopyLink, onCall, onBook, className, }: ProviderDetailHeaderProps): react_jsx_runtime.JSX.Element;
interface CompactProviderHeaderProps {
    provider: ProviderDetailData;
    showLogo?: boolean;
    onBook?: () => void;
    className?: string;
}
declare function CompactProviderHeader({ provider, showLogo, onBook, className, }: CompactProviderHeaderProps): react_jsx_runtime.JSX.Element;
interface ProviderDetailHeaderSkeletonProps {
    showActionButtons?: boolean;
    className?: string;
}
declare function ProviderDetailHeaderSkeleton({ showActionButtons, className, }: ProviderDetailHeaderSkeletonProps): react_jsx_runtime.JSX.Element;

interface ProviderStats {
    pendingOrders: number;
    completedToday: number;
    upcomingAppointments: number;
    linkedEmployers: number;
    pendingInvoices?: number;
    revenue?: number;
}
interface QuickAction {
    id: string;
    label: string;
    icon?: React$1.ReactNode;
    href?: string;
    onClick?: () => void;
}
interface RecentActivity {
    id: string;
    type: 'order' | 'appointment' | 'invoice' | 'employer' | 'user';
    title: string;
    description?: string;
    timestamp: Date | string;
    status?: 'pending' | 'completed' | 'cancelled';
}
interface ProviderOverviewProps {
    /** Provider name */
    providerName: string;
    /** Provider logo URL */
    logoUrl?: string;
    /** Statistics to display */
    stats: ProviderStats;
    /** Quick action buttons */
    quickActions?: QuickAction[];
    /** Recent activity items */
    recentActivity?: RecentActivity[];
    /** Handler for clicking a stat */
    onStatClick?: (stat: keyof ProviderStats) => void;
    /** Handler for clicking a quick action */
    onQuickActionClick?: (action: QuickAction) => void;
    /** Handler for clicking an activity item */
    onActivityClick?: (activity: RecentActivity) => void;
    /** Currency symbol for revenue */
    currency?: string;
    /** Whether the data is loading */
    isLoading?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * ProviderOverview displays a dashboard overview for providers.
 */
declare function ProviderOverview({ providerName, logoUrl, stats, quickActions, recentActivity, onStatClick, onQuickActionClick, onActivityClick, currency: _currency, isLoading, className, }: ProviderOverviewProps): react_jsx_runtime.JSX.Element;

interface PostalCodeInfo {
    zipcode: string;
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
    streetName?: string;
}
interface SearchResults {
    count: number;
    postalCode: PostalCodeInfo;
    distance: number;
}
type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error';
declare const searchBarVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
    variant?: "default" | "hero" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SearchResultsMessageProps {
    results?: SearchResults;
    loading?: boolean;
    onResultsClick?: () => void;
    className?: string;
}
declare const SearchResultsMessage: React$1.FC<SearchResultsMessageProps>;
interface ProviderSearchBarProps extends VariantProps<typeof searchBarVariants>, Omit<React$1.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'results'> {
    /** Callback when search is submitted */
    onSearch: (zipCode: string) => void;
    /** Callback when geolocation button is clicked */
    onGeolocate?: () => void;
    /** Current geolocation status */
    geoStatus?: GeolocationStatus;
    /** Total provider count for placeholder */
    providerCount?: number;
    /** Search results to display */
    results?: SearchResults;
    /** Loading state for results */
    resultsLoading?: boolean;
    /** Callback when results message is clicked */
    onResultsClick?: () => void;
    /** Initial ZIP code value */
    defaultValue?: string;
    /** Controlled ZIP code value */
    value?: string;
    /** Controlled value change handler */
    onValueChange?: (value: string) => void;
    /** Placeholder text override */
    placeholder?: string;
    /** Whether the search is currently loading */
    loading?: boolean;
    /** Error message to display */
    error?: string;
    /** Show results message below search */
    showResults?: boolean;
}
/**
 * A search bar component for finding healthcare providers by ZIP code.
 *
 * @example
 * ```tsx
 * <ProviderSearchBar
 *   onSearch={(zip) => searchProviders(zip)}
 *   onGeolocate={handleGeolocate}
 *   geoStatus={geoStatus}
 *   providerCount={17500}
 * />
 * ```
 */
declare const ProviderSearchBar: React$1.ForwardRefExoticComponent<ProviderSearchBarProps & React$1.RefAttributes<HTMLFormElement>>;
interface HeroSearchBarProps extends ProviderSearchBarProps {
    /** Hero title text */
    title?: string;
    /** Hero subtitle text */
    subtitle?: string;
}
/**
 * A hero-style search bar for landing pages with optional title and subtitle.
 */
declare const HeroSearchBar: React$1.FC<HeroSearchBarProps>;

/**
 * Service option for the multi-select filter
 */
interface ServiceOption {
    /** Unique identifier (slug) */
    value: string;
    /** Display name */
    label: string;
    /** Optional category for grouping */
    category?: string;
    /** Number of providers offering this service */
    count?: number;
}
/**
 * Radius option for the distance dropdown
 */
interface RadiusOption {
    /** Distance value in miles */
    value: number;
    /** Display label */
    label: string;
}
/**
 * Filter state object
 */
interface ProviderFilters {
    /** Provider name/search phrase */
    searchPhrase?: string;
    /** ZIP code */
    zipCode?: string;
    /** Search radius in miles */
    radius: number;
    /** Selected service slugs */
    services: string[];
}
/**
 * Default radius options
 */
declare const DEFAULT_RADIUS_OPTIONS: RadiusOption[];
declare const containerVariants: (props?: ({
    layout?: "horizontal" | "vertical" | "compact" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ServiceMultiSelectProps {
    /** Available services to select from */
    services: ServiceOption[];
    /** Currently selected service values */
    selectedServices: string[];
    /** Called when selection changes */
    onSelectionChange: (services: string[]) => void;
    /** Label for the field */
    label?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Disable the select */
    disabled?: boolean;
    /** Show service counts */
    showCounts?: boolean;
}
declare function ServiceMultiSelect({ services, selectedServices, onSelectionChange, label, placeholder, disabled, showCounts, }: ServiceMultiSelectProps): react_jsx_runtime.JSX.Element;
interface ProviderSearchFiltersProps extends VariantProps<typeof containerVariants> {
    /** Current filter values */
    filters: ProviderFilters;
    /** Called when any filter changes */
    onFiltersChange: (filters: ProviderFilters) => void;
    /** Available services for multi-select */
    services?: ServiceOption[];
    /** Available radius options (defaults to DEFAULT_RADIUS_OPTIONS) */
    radiusOptions?: RadiusOption[];
    /** Show provider name search input */
    showNameSearch?: boolean;
    /** Show ZIP code input */
    showZipCode?: boolean;
    /** Show radius selector */
    showRadius?: boolean;
    /** Show service filter */
    showServices?: boolean;
    /** Show service counts in dropdown */
    showServiceCounts?: boolean;
    /** Show field labels */
    showLabels?: boolean;
    /** Form ID for associating with submit button */
    formId?: string;
    /** Called when form is submitted */
    onSubmit?: (filters: ProviderFilters) => void;
    /** Loading state */
    loading?: boolean;
    /** Additional CSS classes */
    className?: string;
}
declare function ProviderSearchFilters({ filters, onFiltersChange, services, radiusOptions, showNameSearch, showZipCode, showRadius, showServices, showServiceCounts, showLabels, layout, formId, onSubmit, loading, className, }: ProviderSearchFiltersProps): react_jsx_runtime.JSX.Element;
interface CompactFilterBarProps {
    /** Current filter values */
    filters: ProviderFilters;
    /** Called when any filter changes */
    onFiltersChange: (filters: ProviderFilters) => void;
    /** Available services */
    services?: ServiceOption[];
    /** Called when search button is clicked */
    onSearch?: () => void;
    /** Loading state */
    loading?: boolean;
    /** Additional CSS classes */
    className?: string;
}
declare function CompactFilterBar({ filters, onFiltersChange, services, onSearch, loading, className, }: CompactFilterBarProps): react_jsx_runtime.JSX.Element;
interface ActiveFiltersProps {
    /** Current filter values */
    filters: ProviderFilters;
    /** Service options for label lookup */
    services?: ServiceOption[];
    /** Called to clear a specific filter */
    onClearFilter: (field: keyof ProviderFilters, value?: string) => void;
    /** Called to clear all filters */
    onClearAll: () => void;
    /** Additional CSS classes */
    className?: string;
}
declare function ActiveFilters({ filters, services, onClearFilter, onClearAll, className, }: ActiveFiltersProps): react_jsx_runtime.JSX.Element | null;

interface ProviderOption {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Short code or abbreviation */
    code?: string;
    /** Location or address */
    location?: string;
    /** Logo URL */
    logoUrl?: string;
    /** Whether this provider is active */
    isActive?: boolean;
    /** Provider type */
    type?: string;
}
interface ProviderSelectorProps {
    /** Currently selected provider */
    selectedProvider?: ProviderOption | null;
    /** Available providers */
    providers: ProviderOption[];
    /** Handler for provider change */
    onSelect?: (provider: ProviderOption) => void;
    /** Label text */
    label?: string;
    /** Placeholder when no provider selected */
    placeholder?: string;
    /** Whether the selector is disabled */
    disabled?: boolean;
    /** Show search input */
    searchable?: boolean;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Loading state */
    isLoading?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional class name */
    className?: string;
}
/**
 * ProviderSelector provides a dropdown to switch between providers/organizations.
 */
declare function ProviderSelector({ selectedProvider, providers, onSelect, label, placeholder, disabled, searchable, searchPlaceholder, isLoading, size, className, }: ProviderSelectorProps): react_jsx_runtime.JSX.Element;

interface ProviderSettingsData {
    /** General settings */
    general: {
        name: string;
        description?: string;
        phone?: string;
        email?: string;
        website?: string;
        npi?: string;
        taxId?: string;
    };
    /** Address settings */
    address: {
        street: string;
        street2?: string;
        city: string;
        state: string;
        zip: string;
        country?: string;
    };
    /** Notification preferences */
    notifications: {
        emailNewOrders: boolean;
        emailOrderUpdates: boolean;
        emailInvoices: boolean;
        smsNewOrders: boolean;
        smsOrderUpdates: boolean;
    };
    /** Scheduling settings */
    scheduling: {
        acceptingNewPatients: boolean;
        requireAppointment: boolean;
        appointmentBuffer: number;
        maxDailyAppointments: number;
    };
    /** Payment settings */
    payments: {
        acceptsCreditCard: boolean;
        acceptsACH: boolean;
        acceptsCash: boolean;
        acceptsCheck: boolean;
        paymentTerms: number;
    };
}
interface ProviderSettingsProps {
    /** Current settings data */
    settings: ProviderSettingsData;
    /** Handler for saving settings */
    onSave?: (settings: ProviderSettingsData) => void;
    /** Whether save is in progress */
    isSaving?: boolean;
    /** Whether settings are loading */
    isLoading?: boolean;
    /** Default active tab */
    defaultTab?: 'general' | 'notifications' | 'scheduling' | 'payments';
    /** Additional CSS classes */
    className?: string;
}
/**
 * ProviderSettings displays and manages provider configuration settings.
 */
declare function ProviderSettings({ settings: initialSettings, onSave, isSaving, isLoading, defaultTab, className, }: ProviderSettingsProps): react_jsx_runtime.JSX.Element;

interface ProviderUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status?: 'active' | 'pending' | 'inactive';
    avatarUrl?: string;
    lastActive?: Date | string;
    invitedAt?: Date | string;
}
interface ProviderUsersTableProps {
    /** List of users to display */
    users: ProviderUser[];
    /** Handler for editing a user's role */
    onEditRole?: (user: ProviderUser) => void;
    /** Handler for removing a user */
    onRemove?: (user: ProviderUser) => void;
    /** Handler for resending invitation */
    onResendInvite?: (user: ProviderUser) => void;
    /** Current user ID (to disable self-removal) */
    currentUserId?: string;
    /** Whether to show the actions column */
    showActions?: boolean;
    /** Whether the table is loading */
    isLoading?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * ProviderUsersTable displays a table of users associated with a provider.
 */
declare function ProviderUsersTable({ users, onEditRole, onRemove, onResendInvite, currentUserId, showActions, isLoading, emptyMessage, className, }: ProviderUsersTableProps): react_jsx_runtime.JSX.Element;

interface QuickLink {
    id: string;
    label: string;
    icon?: React$1.ReactNode;
    href?: string;
    onClick?: () => void;
    badge?: string | number;
    description?: string;
    disabled?: boolean;
}
interface QuickLinksCardProps {
    /** Title of the card */
    title?: string;
    /** Quick links to display */
    links: QuickLink[];
    /** Layout direction */
    layout?: 'vertical' | 'grid';
    /** Number of columns in grid layout */
    columns?: 2 | 3 | 4;
    /** Additional CSS classes */
    className?: string;
}
/**
 * QuickLinksCard displays a set of quick action links.
 */
declare function QuickLinksCard({ title, links, layout, columns, className, }: QuickLinksCardProps): react_jsx_runtime.JSX.Element;

interface RecurringService {
    /** Service ID */
    id: string;
    /** Service name */
    serviceName: string;
    /** Service ID reference */
    serviceId: string;
    /** Provider name (optional, for non-branded portals) */
    providerName?: string;
    /** Provider ID reference */
    providerId?: string;
    /** Occurrence frequency */
    occurrence: 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | string;
    /** Next scheduled order date */
    nextOrder?: Date | string;
    /** Whether consent is overridden (no email to employee) */
    overrideConsent?: boolean;
}
/** Card state variants */
type RecurringServiceCardState = 'default' | 'success' | 'primary' | 'warning' | 'error' | 'disabled';
interface RecurringServiceCardProps {
    /** The recurring service data */
    service: RecurringService;
    /** Callback when delete is clicked */
    onDelete?: (service: RecurringService) => void;
    /** Callback when card is clicked for editing */
    onEdit?: (service: RecurringService) => void;
    /** Whether to show provider name */
    showProvider?: boolean;
    /** Card state - controls border color and status icon */
    state?: RecurringServiceCardState;
    /** Custom class name */
    className?: string;
    /** Labels */
    labels?: {
        provider?: string;
        occurrence?: string;
        nextOrder?: string;
        consentNote?: string;
        delete?: string;
    };
}
declare function RecurringServiceCard({ service, onDelete, onEdit, showProvider, state, className, labels, }: RecurringServiceCardProps): react_jsx_runtime.JSX.Element | null;
interface RecurringServiceAddCardProps {
    /** Callback when clicked */
    onClick?: () => void;
    /** Custom class name */
    className?: string;
    /** Label text */
    label?: string;
}
declare function RecurringServiceAddCard({ onClick, className, label, }: RecurringServiceAddCardProps): react_jsx_runtime.JSX.Element;
interface RecurringServiceSetupModalProps {
    /** Whether modal is open */
    open: boolean;
    /** Callback to close modal */
    onClose: () => void;
    /** Callback when service is saved */
    onSave: (data: RecurringServiceFormData) => void;
    /** Available providers */
    providers?: Array<{
        id: string;
        name: string;
    }>;
    /** Available services */
    services?: Array<{
        id: string;
        name: string;
    }>;
    /** Initial data for editing */
    initialData?: RecurringServiceFormData;
    /** Whether saving is in progress */
    saving?: boolean;
    /** Whether to show provider selector (hide for branded portals) */
    showProviderSelector?: boolean;
    /** Custom class name */
    className?: string;
    /** Labels */
    labels?: {
        title?: string;
        provider?: string;
        service?: string;
        occurrence?: string;
        overrideConsent?: string;
        overrideConsentNote?: string;
        cancel?: string;
        save?: string;
    };
}
interface RecurringServiceFormData {
    providerId?: string;
    serviceId: string;
    occurrence: string;
    overrideConsent: boolean;
}
declare function RecurringServiceSetupModal({ open, onClose, onSave, providers, services, initialData, saving, showProviderSelector, className, labels, }: RecurringServiceSetupModalProps): react_jsx_runtime.JSX.Element | null;
interface RecurringServiceGridProps {
    /** List of recurring services */
    services: RecurringService[];
    /** Callback when service is deleted */
    onDelete?: (service: RecurringService) => void;
    /** Callback when service is edited */
    onEdit?: (service: RecurringService) => void;
    /** Callback when add is clicked */
    onAdd?: () => void;
    /** Whether to show provider names */
    showProvider?: boolean;
    /** Custom class name */
    className?: string;
}
declare function RecurringServiceGrid({ services, onDelete, onEdit, onAdd, showProvider, className, }: RecurringServiceGridProps): react_jsx_runtime.JSX.Element;

interface RejectionReason {
    id: string;
    label: string;
    requiresDetails?: boolean;
}
interface RejectionModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Handler for closing the modal */
    onOpenChange: (open: boolean) => void;
    /** Handler for submitting the rejection */
    onSubmit?: (data: {
        reasonId: string;
        details?: string;
    }) => void;
    /** Title for the modal */
    title?: string;
    /** Description text */
    description?: string;
    /** Item being rejected (for display) */
    itemDescription?: string;
    /** Available rejection reasons */
    reasons?: RejectionReason[];
    /** Whether to show a free-form details field */
    showDetails?: boolean;
    /** Details field label */
    detailsLabel?: string;
    /** Details field placeholder */
    detailsPlaceholder?: string;
    /** Whether details are required */
    requireDetails?: boolean;
    /** Submit button text */
    submitLabel?: string;
    /** Cancel button text */
    cancelLabel?: string;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
    /** Variant for styling */
    variant?: 'default' | 'danger';
}
/**
 * RejectionModal provides a form for rejecting items with reason and details.
 */
declare function RejectionModal({ open, onOpenChange, onSubmit, title, description, itemDescription, reasons, showDetails, detailsLabel, detailsPlaceholder, requireDetails, submitLabel, cancelLabel, isSubmitting, variant, }: RejectionModalProps): react_jsx_runtime.JSX.Element;

interface MetricData {
    label: string;
    value: number | string;
    change?: number;
    changeLabel?: string;
    trend?: 'up' | 'down' | 'neutral';
}
interface ChartDataPoint {
    label: string;
    value: number;
    previousValue?: number;
}
interface TopItem {
    id: string;
    name: string;
    value: number;
    percentage?: number;
}
interface ReportDashboardProps {
    /** Title for the dashboard */
    title?: string;
    /** Date range label */
    dateRangeLabel?: string;
    /** Key metrics to display */
    metrics: MetricData[];
    /** Data for the main chart */
    chartData?: ChartDataPoint[];
    /** Top services by volume */
    topServices?: TopItem[];
    /** Top employers by volume */
    topEmployers?: TopItem[];
    /** Handler for date range change */
    onDateRangeChange?: (range: string) => void;
    /** Handler for export */
    onExport?: () => void;
    /** Date range options */
    dateRangeOptions?: {
        value: string;
        label: string;
    }[];
    /** Current selected date range */
    selectedDateRange?: string;
    /** Whether data is loading */
    isLoading?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * ReportDashboard displays provider analytics and reporting data.
 */
declare function ReportDashboard({ title, dateRangeLabel, metrics, chartData, topServices, topEmployers, onDateRangeChange, onExport, dateRangeOptions, selectedDateRange, isLoading, className, }: ReportDashboardProps): react_jsx_runtime.JSX.Element;

type ResultStatus = 'passed' | 'failed' | null;
interface ProviderContact {
    /** Contact ID */
    id: string;
    /** First name */
    firstName: string;
    /** Last name */
    lastName: string;
    /** Degree (MD, DO, NP, etc.) */
    degree?: string;
    /** Position title */
    positionTitle?: string;
}
interface ResultsEntryData {
    /** Test result status */
    result: ResultStatus;
    /** Alternate results text */
    alternateText?: string;
    /** Date the sample was drawn/collected */
    dateDrawn?: string;
    /** Date testing was completed */
    dateCompleted?: string;
    /** Provider recommendations/notes */
    recommendations?: string;
    /** Uploaded file names */
    files?: File[];
    /** Selected provider contact IDs */
    providerContacts?: string[];
    /** Apply results to all services */
    applyToAllServices?: boolean;
}
/** Ref handle for imperative form control */
interface ResultsEntryFormRef {
    /** Validate and submit the form */
    submit: () => void;
}
interface ResultsEntryFormProps {
    /** Service name (used by modal wrapper, not displayed in form) */
    serviceName?: string;
    /** Employee first name */
    employeeFirstName?: string;
    /** Employee last name */
    employeeLastName?: string;
    /** Initial form data */
    initialData?: Partial<ResultsEntryData>;
    /** Available provider contacts */
    providerContacts?: ProviderContact[];
    /** Whether to show file upload section */
    showFileUpload?: boolean;
    /** Whether to show "apply to all services" option */
    showApplyToAll?: boolean;
    /** Callback when form is submitted */
    onSubmit: (data: ResultsEntryData) => void;
    /** Callback when form is cancelled */
    onCancel?: () => void;
    /** Labels for i18n */
    labels?: {
        testResults?: string;
        passed?: string;
        failed?: string;
        alternateResultsText?: string;
        dateDrawn?: string;
        dateCompleted?: string;
        useResultsForAllServices?: string;
        providerRecommendations?: string;
        results?: string;
        browseFiles?: string;
        provider?: string;
        selectProvider?: string;
        noProviderContacts?: string;
        noProviderContactsMessage?: string;
        addProviderContact?: string;
        submit?: string;
        close?: string;
        pleaseSelectResult?: string;
    };
    /** Custom className */
    className?: string;
}
/**
 * A form for entering test/service results including pass/fail status,
 * dates, recommendations, file uploads, and provider selection.
 *
 * @example
 * ```tsx
 * <ResultsEntryForm
 *   serviceName="Drug Screen - 5 Panel"
 *   employeeFirstName="John"
 *   employeeLastName="Doe"
 *   providerContacts={contacts}
 *   showFileUpload
 *   onSubmit={(data) => saveResults(data)}
 *   onCancel={() => closeModal()}
 * />
 * ```
 */
declare const ResultsEntryForm: React$1.ForwardRefExoticComponent<ResultsEntryFormProps & React$1.RefAttributes<ResultsEntryFormRef>>;
interface ResultsEntryModalProps extends Omit<ResultsEntryFormProps, 'onCancel'> {
    /** Whether modal is open */
    open: boolean;
    /** Handler for closing the modal */
    onOpenChange: (open: boolean) => void;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
}
/**
 * ResultsEntryForm wrapped in a proper Modal component.
 * Follows the same pattern as RejectionModal and InviteUserModal.
 */
declare function ResultsEntryModal({ serviceName, employeeFirstName, employeeLastName, open, onOpenChange, onSubmit, isSubmitting, labels, ...props }: ResultsEntryModalProps): react_jsx_runtime.JSX.Element;
/**
 * @deprecated Use ResultsEntryModal instead. This wrapper provides backward
 * compatibility with the old isOpen/onClose API.
 */
interface ResultsEntryCardProps extends Omit<ResultsEntryModalProps, 'open' | 'onOpenChange'> {
    /** Legacy prop: whether the card/modal is open */
    isOpen: boolean;
    /** Legacy prop: called when the card/modal requests to close */
    onClose: () => void;
}
/**
 * @deprecated Use ResultsEntryModal instead.
 * Legacy wrapper that translates the old isOpen/onClose API to the new open/onOpenChange API.
 * Also maintains the old behavior of auto-closing after submit.
 */
declare function ResultsEntryCard({ isOpen, onClose, onSubmit, ...restProps }: ResultsEntryCardProps): react_jsx_runtime.JSX.Element;

interface CalendarAppointment {
    id: string;
    title: string;
    patientName?: string;
    startTime: Date | string;
    endTime?: Date | string;
    type?: 'scheduled' | 'walk-in' | 'blocked';
    status?: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no-show';
    services?: string[];
}
interface ScheduleCalendarProps {
    /** Appointments to display */
    appointments: CalendarAppointment[];
    /** Currently selected date */
    selectedDate?: Date;
    /** Handler for date selection */
    onDateSelect?: (date: Date) => void;
    /** Handler for appointment click */
    onAppointmentClick?: (appointment: CalendarAppointment) => void;
    /** Handler for adding new appointment */
    onAddAppointment?: (date: Date, time?: string) => void;
    /** View mode */
    view?: 'day' | 'week';
    /** Start hour for day view (0-23) */
    startHour?: number;
    /** End hour for day view (0-23) */
    endHour?: number;
    /** Whether data is loading */
    isLoading?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * ScheduleCalendar displays appointments in a daily or weekly calendar view.
 */
declare function ScheduleCalendar({ appointments, selectedDate, onDateSelect, onAppointmentClick, onAddAppointment, view, startHour, endHour, isLoading, className, }: ScheduleCalendarProps): react_jsx_runtime.JSX.Element;

/**
 * Individual service item
 */
interface ServiceItem {
    /** Service name */
    name: string;
    /** URL-friendly slug */
    slug: string;
    /** Optional description */
    description?: string;
    /** Provider count offering this service */
    providerCount?: number;
    /** Icon name or component */
    icon?: string | React$1.ReactNode;
}
/**
 * Service category with nested sub-services
 */
interface ServiceCategory$1 {
    /** Category name */
    name: string;
    /** URL-friendly slug */
    slug?: string;
    /** Direct services in this category */
    services?: ServiceItem[];
    /** Sub-categories with their own services */
    subCategories?: ServiceSubCategory[];
    /** Icon for the category */
    icon?: string | React$1.ReactNode;
    /** Whether this category is expanded by default */
    defaultExpanded?: boolean;
}
/**
 * Sub-category within a main category
 */
interface ServiceSubCategory {
    /** Sub-category name */
    name: string;
    /** URL-friendly slug */
    slug?: string;
    /** Services in this sub-category */
    services: ServiceItem[];
    /** Whether this sub-category is expanded by default */
    defaultExpanded?: boolean;
}
declare const accordionVariants: (props?: ({
    variant?: "default" | "bordered" | "cards" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ServiceLinkProps {
    service: ServiceItem;
    basePath?: string;
    size?: 'sm' | 'md' | 'lg';
    onClick?: (service: ServiceItem) => void;
}
declare function ServiceLink({ service, basePath, size, onClick, }: ServiceLinkProps): react_jsx_runtime.JSX.Element;
interface ServiceAccordionProps extends VariantProps<typeof accordionVariants> {
    /** Array of service categories */
    categories: ServiceCategory$1[];
    /** Base path for service links */
    basePath?: string;
    /** Called when a service link is clicked */
    onServiceClick?: (service: ServiceItem) => void;
    /** Allow multiple categories to be expanded at once */
    allowMultiple?: boolean;
    /** Controlled expanded categories */
    expandedCategories?: string[];
    /** Called when a category is expanded/collapsed */
    onExpandedChange?: (expanded: string[]) => void;
    /** Additional CSS classes */
    className?: string;
}
declare function ServiceAccordion({ categories, variant, basePath, onServiceClick, allowMultiple, expandedCategories: controlledExpanded, onExpandedChange, className, }: ServiceAccordionProps): react_jsx_runtime.JSX.Element;
interface ServiceTagCloudProps$1 {
    /** Flat list of services */
    services: ServiceItem[];
    /** Base path for service links */
    basePath?: string;
    /** Called when a service is clicked */
    onServiceClick?: (service: ServiceItem) => void;
    /** Show provider counts */
    showCounts?: boolean;
    /** Maximum number of services to display */
    maxItems?: number;
    /** Additional CSS classes */
    className?: string;
}
declare function ServiceTagCloud({ services, basePath, onServiceClick, showCounts, maxItems, className, }: ServiceTagCloudProps$1): react_jsx_runtime.JSX.Element;
interface ServiceListProps {
    /** Array of services */
    services: ServiceItem[];
    /** Base path for service links */
    basePath?: string;
    /** Called when a service is clicked */
    onServiceClick?: (service: ServiceItem) => void;
    /** Display in columns */
    columns?: 1 | 2 | 3 | 4;
    /** Show provider counts */
    showCounts?: boolean;
    /** Additional CSS classes */
    className?: string;
}
declare function ServiceList({ services, basePath, onServiceClick, columns, showCounts, className, }: ServiceListProps): react_jsx_runtime.JSX.Element;

declare const serviceBadgeVariants: (props?: ({
    variant?: "secondary" | "ghost" | "outline" | "danger" | "default" | "success" | "info" | "warning" | null | undefined;
    size?: "sm" | "md" | "lg" | "xl" | "xs" | null | undefined;
    interactive?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ServiceBadgeProps extends Omit<React$1.HTMLAttributes<HTMLSpanElement>, 'onClick'>, VariantProps<typeof serviceBadgeVariants> {
    children: React$1.ReactNode;
    href?: string;
    onClick?: () => void;
    icon?: React$1.ReactNode;
    onRemove?: () => void;
    removable?: boolean;
}
declare function ServiceBadge({ children, variant, size, interactive, href, onClick, icon, onRemove, removable, className, ...props }: ServiceBadgeProps): react_jsx_runtime.JSX.Element;
interface ServiceBadgeGroupProps {
    children: React$1.ReactNode;
    className?: string;
    maxVisible?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    onShowMore?: () => void;
}
declare function ServiceBadgeGroup({ children, className, maxVisible, size, onShowMore, }: ServiceBadgeGroupProps): react_jsx_runtime.JSX.Element;
interface ServiceCategoryBadgeProps extends Omit<ServiceBadgeProps, 'icon'> {
    category?: 'drug-testing' | 'medical' | 'occupational' | 'wellness' | 'lab' | 'other';
}
declare function ServiceCategoryBadge({ category, children, ...props }: ServiceCategoryBadgeProps): react_jsx_runtime.JSX.Element;
interface ServiceTagCloudProps {
    services: Array<{
        id: string;
        name: string;
        slug: string;
        count?: number;
    }>;
    variant?: 'default' | 'secondary' | 'outline';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    onServiceClick?: (slug: string) => void;
    maxVisible?: number;
    showCounts?: boolean;
    className?: string;
}
declare function ServiceTagCloudBadges({ services, variant, size, onServiceClick, maxVisible, showCounts, className, }: ServiceTagCloudProps): react_jsx_runtime.JSX.Element;
interface SelectedServicesBadgesProps {
    services: Array<{
        id: string;
        name: string;
        slug: string;
    }>;
    onRemove: (slug: string) => void;
    onClearAll?: () => void;
    variant?: 'default' | 'secondary' | 'outline';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}
declare function SelectedServicesBadges({ services, onRemove, onClearAll, variant, size, className, }: SelectedServicesBadgesProps): react_jsx_runtime.JSX.Element | null;
interface DOTBadgeProps extends Omit<ServiceBadgeProps, 'variant' | 'children'> {
    type: 'dot-certified' | 'non-dot' | 'fmcsa' | 'faa' | 'uscg' | 'phmsa' | 'fra';
    children?: React$1.ReactNode;
}
declare function DOTBadge({ type, children, className, size, ...props }: DOTBadgeProps): react_jsx_runtime.JSX.Element;

interface ServiceCardProps {
    /** Service ID */
    id: string;
    /** Service name */
    name: string;
    /** Service description */
    description?: string;
    /** Base price */
    price?: number;
    /** Currency code */
    currency?: string;
    /** Whether the service is currently offered */
    currentlyOffered?: boolean;
    /** Whether inventory is limited */
    limitedInventory?: boolean;
    /** Available inventory count */
    inventoryCount?: number;
    /** Total inventory count */
    inventoryTotal?: number;
    /** Whether the service has custom availability */
    hasCustomAvailability?: boolean;
    /** Number of custom pricing tiers */
    customPricingCount?: number;
    /** Service category */
    category?: string;
    /** Tags for the service */
    tags?: string[];
    /** Click handler for card */
    onClick?: (id: string) => void;
    /** Click handler for edit action */
    onEdit?: (id: string) => void;
    /** Click handler for manage action */
    onManage?: (id: string) => void;
    /** Click handler for delete action */
    onDelete?: (id: string) => void;
    /** Whether the card is selected */
    selected?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * ServiceCard displays a service with pricing, availability, and inventory information.
 */
declare function ServiceCard({ id, name, description, price, currency, currentlyOffered, limitedInventory, inventoryCount, inventoryTotal, hasCustomAvailability, customPricingCount, category, tags, onClick, onEdit, onManage, onDelete, selected, className, }: ServiceCardProps): react_jsx_runtime.JSX.Element;
/**
 * AddServiceCard displays a card to add a new service.
 */
interface AddServiceCardProps {
    /** Click handler */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
}
declare function AddServiceCard({ onClick, className, }: AddServiceCardProps): react_jsx_runtime.JSX.Element;

interface ServiceGeneralSettingsProps {
    /** Service name */
    name?: string;
    /** Handler for name change */
    onNameChange?: (value: string) => void;
    /** Service description */
    description?: string;
    /** Handler for description change */
    onDescriptionChange?: (value: string) => void;
    /** Service code/SKU */
    serviceCode?: string;
    /** Handler for service code change */
    onServiceCodeChange?: (value: string) => void;
    /** Selected category ID */
    categoryId?: string;
    /** Handler for category change */
    onCategoryChange?: (categoryId: string) => void;
    /** Available categories */
    categories?: Array<{
        id: string;
        name: string;
    }>;
    /** Base price */
    basePrice?: number;
    /** Handler for price change */
    onBasePriceChange?: (value: number) => void;
    /** Whether service is active */
    isActive?: boolean;
    /** Handler for active toggle */
    onIsActiveChange?: (active: boolean) => void;
    /** Whether service is featured */
    isFeatured?: boolean;
    /** Handler for featured toggle */
    onIsFeaturedChange?: (featured: boolean) => void;
    /** Turnaround time in days */
    turnaroundDays?: number;
    /** Handler for turnaround change */
    onTurnaroundDaysChange?: (days: number) => void;
    /** CPT code */
    cptCode?: string;
    /** Handler for CPT code change */
    onCptCodeChange?: (value: string) => void;
    /** Handler for saving settings */
    onSave?: () => void;
    /** Whether save is in progress */
    isSaving?: boolean;
    /** Error message */
    errorMessage?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * ServiceGeneralSettings manages general configuration for a service.
 */
declare function ServiceGeneralSettings({ name, onNameChange, description, onDescriptionChange, serviceCode, onServiceCodeChange, categoryId, onCategoryChange, categories, basePrice, onBasePriceChange, isActive, onIsActiveChange, isFeatured, onIsFeaturedChange, turnaroundDays, onTurnaroundDaysChange, cptCode, onCptCodeChange, onSave, isSaving, errorMessage, className, }: ServiceGeneralSettingsProps): react_jsx_runtime.JSX.Element;

interface ServiceGridProps {
    /** Array of services to display */
    services: Omit<ServiceCardProps, 'onEdit' | 'onManage' | 'onDelete'>[];
    /** Handler for editing a service */
    onEdit?: (serviceId: string) => void;
    /** Handler for managing a service (inventory, pricing, etc.) */
    onManage?: (serviceId: string) => void;
    /** Handler for deleting a service */
    onDelete?: (serviceId: string) => void;
    /** Handler for adding a new service */
    onAdd?: () => void;
    /** Whether to show the add card */
    showAddCard?: boolean;
    /** Loading state */
    isLoading?: boolean;
    /** Number of skeleton cards to show when loading */
    skeletonCount?: number;
    /** Empty state message */
    emptyMessage?: string;
    /** Grid columns */
    columns?: 1 | 2 | 3 | 4;
    /** Gap between cards */
    gap?: 'sm' | 'md' | 'lg';
    /** Additional class name */
    className?: string;
}
/**
 * ServiceGrid provides a grid layout for displaying service cards with add functionality.
 */
declare function ServiceGrid({ services, onEdit, onManage, onDelete, onAdd, showAddCard, isLoading, skeletonCount, emptyMessage, columns, gap, className, }: ServiceGridProps): react_jsx_runtime.JSX.Element;

/**
 * Selectable service item
 */
interface SelectableService {
    /** Unique identifier */
    id: string;
    /** Service name */
    name: string;
    /** Service code (e.g., CPT code) */
    code?: string;
    /** Service description */
    description?: string;
    /** Price or cost */
    price?: number;
    /** Whether the service is disabled */
    disabled?: boolean;
}
/**
 * Service group containing services
 */
interface ServiceGroup {
    /** Unique identifier */
    id: string;
    /** Group name */
    name: string;
    /** Services in this group */
    services: SelectableService[];
    /** Sub-groups (optional nesting) */
    subGroups?: ServiceGroup[];
}
interface ServicePickerProps {
    /** Array of service groups */
    groups: ServiceGroup[];
    /** Currently selected service IDs */
    selectedIds: string[];
    /** Callback when selection changes */
    onSelectionChange: (selectedIds: string[]) => void;
    /** Whether to show search input */
    showSearch?: boolean;
    /** Search placeholder text */
    searchPlaceholder?: string;
    /** Whether to allow multiple selection */
    multiple?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Error message */
    error?: string;
    /** Empty state message */
    emptyMessage?: string;
    /** Heading text */
    heading?: string;
    /** Whether to hide heading */
    hideHeading?: boolean;
    /** Whether the picker fills full width */
    fullWidth?: boolean;
    /** Custom className */
    className?: string;
}
/**
 * A service picker component with search, grouping, and multi-select support.
 *
 * @example
 * ```tsx
 * const [selectedIds, setSelectedIds] = useState<string[]>([]);
 *
 * <ServicePicker
 *   groups={serviceGroups}
 *   selectedIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 *   showSearch
 *   multiple
 * />
 * ```
 */
declare function ServicePicker({ groups, selectedIds, onSelectionChange, showSearch, searchPlaceholder, multiple, loading, error, emptyMessage, heading, hideHeading, fullWidth, className, }: ServicePickerProps): react_jsx_runtime.JSX.Element;
declare namespace ServicePicker {
    var displayName: string;
}

interface ServicePrice {
    id: string;
    serviceName: string;
    serviceCode?: string;
    category?: string;
    basePrice: number;
    employerPrice?: number;
    isActive: boolean;
    lastUpdated?: Date | string;
}
interface ServicePricingManagerProps {
    /** List of service prices */
    services: ServicePrice[];
    /** Handler for updating a service price */
    onUpdatePrice?: (serviceId: string, newPrice: number, priceType: 'base' | 'employer') => void;
    /** Handler for toggling service status */
    onToggleStatus?: (serviceId: string, isActive: boolean) => void;
    /** Handler for bulk update */
    onBulkUpdate?: (updates: {
        serviceId: string;
        price: number;
        priceType: 'base' | 'employer';
    }[]) => void;
    /** Whether changes are being saved */
    isSaving?: boolean;
    /** Whether data is loading */
    isLoading?: boolean;
    /** Filter by category */
    categories?: string[];
    /** Additional CSS classes */
    className?: string;
}
/**
 * ServicePricingManager displays and manages service pricing for providers.
 */
declare function ServicePricingManager({ services, onUpdatePrice, onToggleStatus, onBulkUpdate, isSaving, isLoading, categories: _categories, className, }: ServicePricingManagerProps): react_jsx_runtime.JSX.Element;

interface ShippingAddress {
    name?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
}
interface ServiceShippingSettingsProps {
    /** Whether shipping is enabled */
    shippingEnabled?: boolean;
    /** Handler for toggling shipping */
    onShippingEnabledChange?: (enabled: boolean) => void;
    /** Default shipping address */
    defaultAddress?: ShippingAddress;
    /** Handler for address changes */
    onAddressChange?: (address: ShippingAddress) => void;
    /** Available shipping methods */
    shippingMethods?: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    /** Selected shipping method ID */
    selectedMethodId?: string;
    /** Handler for method change */
    onMethodChange?: (methodId: string) => void;
    /** Carrier account number */
    carrierAccountNumber?: string;
    /** Handler for carrier account change */
    onCarrierAccountChange?: (value: string) => void;
    /** Special instructions */
    instructions?: string;
    /** Handler for instructions change */
    onInstructionsChange?: (value: string) => void;
    /** Whether to use kit shipping */
    useKitShipping?: boolean;
    /** Handler for kit shipping toggle */
    onUseKitShippingChange?: (enabled: boolean) => void;
    /** Handler for saving settings */
    onSave?: () => void;
    /** Whether save is in progress */
    isSaving?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * ServiceShippingSettings manages shipping configuration for a service.
 */
declare function ServiceShippingSettings({ shippingEnabled, onShippingEnabledChange, defaultAddress, onAddressChange, shippingMethods, selectedMethodId, onMethodChange, carrierAccountNumber, onCarrierAccountChange, instructions, onInstructionsChange, useKitShipping, onUseKitShippingChange, onSave, isSaving, className, }: ServiceShippingSettingsProps): react_jsx_runtime.JSX.Element;

interface ServiceCategory {
    id: string;
    name: string;
}
interface SetupServiceModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Handler for closing the modal */
    onOpenChange: (open: boolean) => void;
    /** Handler for saving the service */
    onSave?: (data: ServiceFormData) => void;
    /** Available service categories */
    categories?: ServiceCategory[];
    /** Available services to select from */
    availableServices?: Array<{
        id: string;
        name: string;
        defaultPrice?: number;
    }>;
    /** Whether to show service picker (vs free-form entry) */
    showServicePicker?: boolean;
    /** Whether submission is in progress */
    isSubmitting?: boolean;
    /** Error message to display */
    errorMessage?: string;
    /** Title for the modal */
    title?: string;
}
interface ServiceFormData {
    serviceId?: string;
    name: string;
    description?: string;
    price: number;
    categoryId?: string;
    currentlyOffered: boolean;
    limitedInventory: boolean;
    initialInventory?: number;
    autoAcceptReferrals: boolean;
}
/**
 * SetupServiceModal provides a form to add or configure a new service.
 */
declare function SetupServiceModal({ open, onOpenChange, onSave, categories, availableServices, showServicePicker, isSubmitting, errorMessage, title, }: SetupServiceModalProps): react_jsx_runtime.JSX.Element;

interface SidebarProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Width when expanded (default: '280px') */
    expandedWidth?: string;
    /** Width when collapsed (default: '80px') */
    collapsedWidth?: string;
    /** Custom styles object */
    style?: React__default.CSSProperties;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function Sidebar({ children, className, expandedWidth, collapsedWidth, style, 'data-testid': testId, }: SidebarProps): React__default.JSX.Element;
interface SidebarHeaderProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show mobile close button (default: true) */
    showMobileClose?: boolean;
}
declare function SidebarHeader({ children, className, showMobileClose, }: SidebarHeaderProps): React__default.JSX.Element;
interface SidebarFooterProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarFooter({ children, className, }: SidebarFooterProps): React__default.JSX.Element;
interface SidebarContentProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarContent({ children, className, }: SidebarContentProps): React__default.JSX.Element;
interface SidebarNavProps {
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarNav({ children, className, }: SidebarNavProps): React__default.JSX.Element;
interface SidebarNavGroupProps {
    /** Group label */
    label: string;
    /** Group icon */
    icon?: ReactNode;
    /** Group items */
    children: ReactNode;
    /** Whether the group starts expanded (for controlled accordion) */
    defaultExpanded?: boolean;
    /** Group identifier for accordion behavior */
    groupId?: string;
    /** Additional CSS classes */
    className?: string;
}
declare function SidebarNavGroup({ label, icon, children, defaultExpanded, groupId, className, }: SidebarNavGroupProps): React__default.JSX.Element;
interface SidebarNavItemProps {
    /** Item label */
    label: string;
    /** Item icon */
    icon?: ReactNode;
    /** Whether this item is currently active */
    isActive?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Optional href for link items */
    href?: string;
    /** Badge content (number or text) */
    badge?: ReactNode;
    /** Whether the item is disabled */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function SidebarNavItem({ label, icon, isActive, onClick, href, badge, disabled, className, 'data-testid': testId, }: SidebarNavItemProps): React__default.JSX.Element;
interface SidebarToggleProps {
    /** Additional CSS classes */
    className?: string;
    /** Position of the toggle (default: 'inline') */
    position?: 'inline' | 'floating';
}
declare function SidebarToggle({ className, position, }: SidebarToggleProps): React__default.JSX.Element;
interface SidebarMobileToggleProps {
    /** Additional CSS classes */
    className?: string;
    /** Custom icon */
    icon?: ReactNode;
}
declare function SidebarMobileToggle({ className, icon, }: SidebarMobileToggleProps): React__default.JSX.Element;
interface SidebarSearchProps {
    /** Search query value */
    value: string;
    /** Change handler */
    onChange: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Keyboard shortcut hint */
    shortcutHint?: string;
    /** Additional CSS classes */
    className?: string;
    /** Test ID for testing */
    'data-testid'?: string;
}
declare function SidebarSearch({ value, onChange, placeholder, shortcutHint, className, 'data-testid': testId, }: SidebarSearchProps): React__default.JSX.Element;

interface SidebarContextValue {
    /** Whether the sidebar is collapsed (desktop) */
    isCollapsed: boolean;
    /** Toggle collapsed state */
    toggleCollapsed: () => void;
    /** Set collapsed state */
    setCollapsed: (collapsed: boolean) => void;
    /** Whether the mobile sidebar is open */
    isMobileOpen: boolean;
    /** Open mobile sidebar */
    openMobile: () => void;
    /** Close mobile sidebar */
    closeMobile: () => void;
    /** Toggle mobile sidebar */
    toggleMobile: () => void;
    /** Whether we're on a mobile/tablet viewport */
    isMobileViewport: boolean;
    /** Currently expanded group (for accordion behavior) */
    expandedGroup: string | null;
    /** Set the expanded group */
    setExpandedGroup: (group: string | null) => void;
    /** Toggle a group's expanded state */
    toggleGroup: (group: string) => void;
}
interface SidebarProviderProps {
    children: ReactNode;
    /** Default collapsed state (default: false) */
    defaultCollapsed?: boolean;
    /** Storage key for persisting collapsed state (default: 'sidebar-collapsed') */
    storageKey?: string;
    /** Whether to persist collapsed state to localStorage (default: true) */
    persistCollapsed?: boolean;
    /** Default expanded group */
    defaultExpandedGroup?: string | null;
    /** Breakpoint for mobile detection (default: 1024px) */
    mobileBreakpoint?: string;
}
declare function SidebarProvider({ children, defaultCollapsed, storageKey, persistCollapsed, defaultExpandedGroup, mobileBreakpoint, }: SidebarProviderProps): React__default.JSX.Element;
/**
 * Hook to access the sidebar context.
 * Must be used within a SidebarProvider.
 *
 * @example
 * ```tsx
 * function MenuButton() {
 *   const { isMobileViewport, openMobile, toggleCollapsed } = useSidebar();
 *
 *   return (
 *     <button onClick={isMobileViewport ? openMobile : toggleCollapsed}>
 *       Menu
 *     </button>
 *   );
 * }
 * ```
 */
declare function useSidebar(): SidebarContextValue;

interface FooterLink {
    label: string;
    href: string;
    external?: boolean;
}
interface FooterLinkGroup {
    title: string;
    links: FooterLink[];
}
interface SocialLink {
    platform: 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'youtube' | 'tiktok' | 'github';
    href: string;
    label?: string;
}
interface SocialMediaLinksProps {
    links: SocialLink[];
    variant?: 'light' | 'dark';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}
declare function SocialMediaLinks({ links, variant, size, className, }: SocialMediaLinksProps): react_jsx_runtime.JSX.Element;
interface NewsletterFormProps {
    onSubmit?: (email: string) => void;
    placeholder?: string;
    buttonText?: string;
    variant?: 'light' | 'dark';
    isLoading?: boolean;
    className?: string;
}
declare function NewsletterForm({ onSubmit, placeholder, buttonText, variant, isLoading, className, }: NewsletterFormProps): react_jsx_runtime.JSX.Element;
interface FooterLinkSectionProps {
    group: FooterLinkGroup;
    variant?: 'light' | 'dark';
    className?: string;
}
declare function FooterLinkSection({ group, variant, className, }: FooterLinkSectionProps): react_jsx_runtime.JSX.Element;
interface CopyrightTextProps {
    companyName: string;
    year?: number;
    variant?: 'light' | 'dark';
    className?: string;
}
declare function CopyrightText({ companyName, year, variant, className, }: CopyrightTextProps): react_jsx_runtime.JSX.Element;
interface LegalLinksProps {
    privacyHref?: string;
    termsHref?: string;
    cookiesHref?: string;
    additionalLinks?: FooterLink[];
    variant?: 'light' | 'dark';
    className?: string;
}
declare function LegalLinks({ privacyHref, termsHref, cookiesHref, additionalLinks, variant, className, }: LegalLinksProps): react_jsx_runtime.JSX.Element;
interface DisclaimerTextProps {
    children: React$1.ReactNode;
    variant?: 'light' | 'dark';
    className?: string;
}
declare function DisclaimerText({ children, variant, className, }: DisclaimerTextProps): react_jsx_runtime.JSX.Element;
declare const footerVariants: (props?: ({
    variant?: "primary" | "white" | "dark" | "default" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SiteFooterProps extends VariantProps<typeof footerVariants> {
    logo?: {
        src?: string;
        alt?: string;
        name?: string;
        href?: string;
    };
    description?: string;
    linkGroups?: FooterLinkGroup[];
    socialLinks?: SocialLink[];
    companyName?: string;
    showNewsletter?: boolean;
    onNewsletterSubmit?: (email: string) => void;
    newsletterPlaceholder?: string;
    privacyHref?: string;
    termsHref?: string;
    cookiesHref?: string;
    additionalLegalLinks?: FooterLink[];
    disclaimer?: React$1.ReactNode;
    emergencyDisclaimer?: boolean;
    className?: string;
}
declare function SiteFooter({ logo, description, linkGroups, socialLinks, companyName, variant, showNewsletter, onNewsletterSubmit, newsletterPlaceholder, privacyHref, termsHref, cookiesHref, additionalLegalLinks, disclaimer, emergencyDisclaimer, className, }: SiteFooterProps): react_jsx_runtime.JSX.Element;
interface SimpleFooterProps {
    companyName?: string;
    privacyHref?: string;
    termsHref?: string;
    variant?: 'light' | 'dark';
    className?: string;
}
declare function SimpleFooter({ companyName, privacyHref, termsHref, variant, className, }: SimpleFooterProps): react_jsx_runtime.JSX.Element;

interface NavLink {
    label: string;
    href: string;
    external?: boolean;
    hideOnMobile?: boolean;
}
interface UserProfile {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
}
interface SiteLogoProps {
    href?: string;
    logoSrc?: string;
    logoAlt?: string;
    textSrc?: string;
    name?: string;
    variant?: 'light' | 'dark';
    className?: string;
}
declare function SiteLogo({ href, logoSrc, logoAlt, textSrc, name, variant, className, }: SiteLogoProps): react_jsx_runtime.JSX.Element;
interface NavLinksProps {
    links: NavLink[];
    variant?: 'light' | 'dark';
    className?: string;
}
declare function NavLinks({ links, variant, className, }: NavLinksProps): react_jsx_runtime.JSX.Element;
interface AuthButtonsProps {
    variant?: 'light' | 'dark';
    onLogin?: () => void;
    onSignUp?: () => void;
    loginHref?: string;
    signUpHref?: string;
    showSignUp?: boolean;
    className?: string;
}
declare function AuthButtons({ variant, onLogin, onSignUp, loginHref, signUpHref, showSignUp, className, }: AuthButtonsProps): react_jsx_runtime.JSX.Element;
interface UserMenuProps {
    user: UserProfile;
    variant?: 'light' | 'dark';
    onLogout?: () => void;
    onProfile?: () => void;
    onSettings?: () => void;
    menuItems?: Array<{
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: React$1.ReactNode;
    }>;
    className?: string;
}
declare function UserMenu({ user, variant, onLogout, onProfile, onSettings, menuItems, className, }: UserMenuProps): react_jsx_runtime.JSX.Element;
interface MobileMenuButtonProps {
    isOpen: boolean;
    onClick: () => void;
    variant?: 'light' | 'dark';
    className?: string;
}
declare function MobileMenuButton({ isOpen, onClick, variant, className, }: MobileMenuButtonProps): react_jsx_runtime.JSX.Element;
interface MobileMenuPanelProps {
    isOpen: boolean;
    onClose: () => void;
    links: NavLink[];
    user?: UserProfile | null;
    onLogin?: () => void;
    onSignUp?: () => void;
    onLogout?: () => void;
    className?: string;
}
declare function MobileMenuPanel({ isOpen, onClose, links, user, onLogin, onSignUp, onLogout, className, }: MobileMenuPanelProps): react_jsx_runtime.JSX.Element | null;
declare const headerVariants: (props?: ({
    variant?: "primary" | "white" | "transparent" | "glass" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SiteHeaderProps extends VariantProps<typeof headerVariants> {
    logo?: {
        src?: string;
        alt?: string;
        textSrc?: string;
        name?: string;
        href?: string;
    };
    links?: NavLink[];
    user?: UserProfile | null;
    onLogin?: () => void;
    onSignUp?: () => void;
    onLogout?: () => void;
    onProfile?: () => void;
    loginHref?: string;
    signUpHref?: string;
    showSignUp?: boolean;
    userMenuItems?: UserMenuProps['menuItems'];
    className?: string;
}
declare function SiteHeader({ logo, links, user, variant, onLogin, onSignUp, onLogout, onProfile, loginHref, signUpHref, showSignUp, userMenuItems, className, }: SiteHeaderProps): react_jsx_runtime.JSX.Element;
interface CompactHeaderProps {
    title?: string;
    backHref?: string;
    onBack?: () => void;
    rightContent?: React$1.ReactNode;
    className?: string;
}
declare function CompactHeader({ title, backHref, onBack, rightContent, className, }: CompactHeaderProps): react_jsx_runtime.JSX.Element;

interface SSOConfigData {
    /** Client domain for SSO */
    clientDomain: string;
    /** SSO login URL */
    ssoLoginUrl: string;
    /** SSO logout URL (optional) */
    ssoLogoutUrl?: string;
    /** Force re-authentication on each login */
    forceReauthentication?: boolean;
    /** IDP signs the request */
    idpSignsRequest?: boolean;
    /** Allow unencrypted assertions */
    allowUnencryptedAssertion?: boolean;
}
interface SSOConfigFormProps {
    /** Initial configuration data */
    initialData?: Partial<SSOConfigData>;
    /** Whether an identity provider is already configured (show delete button) */
    hasExistingConfig?: boolean;
    /** Callback when form is submitted */
    onSubmit: (data: SSOConfigData, certificateFile?: File) => void;
    /** Callback when delete is clicked */
    onDelete?: () => void;
    /** Callback when cancelled */
    onCancel?: () => void;
    /** Custom className */
    className?: string;
    /** Labels for internationalization */
    labels?: {
        title?: string;
        clientDomain?: string;
        clientDomainPlaceholder?: string;
        invalidClientDomain?: string;
        ssoLoginUrl?: string;
        ssoLoginUrlPlaceholder?: string;
        invalidSsoLoginUrl?: string;
        ssoLogoutUrl?: string;
        ssoLogoutUrlPlaceholder?: string;
        selectCertificate?: string;
        selectFileToUpload?: string;
        certificateSelected?: string;
        otherOptions?: string;
        forceReauthentication?: string;
        forceReauthenticationDescription?: string;
        idpSignsRequest?: string;
        idpSignsRequestDescription?: string;
        allowUnencryptedAssertion?: string;
        allowUnencryptedAssertionDescription?: string;
        save?: string;
        delete?: string;
        cancel?: string;
    };
}
/**
 * A form for configuring Single Sign-On (SSO) / SAML settings.
 *
 * @example
 * ```tsx
 * <SSOConfigForm
 *   onSubmit={(data, certFile) => saveSSO(data, certFile)}
 *   onDelete={() => deleteSSO()}
 *   hasExistingConfig={!!identityProvider}
 * />
 * ```
 */
declare function SSOConfigForm({ initialData, hasExistingConfig, onSubmit, onDelete, onCancel, className, labels, }: SSOConfigFormProps): react_jsx_runtime.JSX.Element;

interface Step {
    /** Unique step identifier */
    id: string | number;
    /** Step label/title */
    label: string;
    /** Optional description */
    description?: string;
    /** Optional icon */
    icon?: React$1.ReactNode;
    /** Whether this step has an error */
    hasError?: boolean;
    /** Whether this step is optional */
    optional?: boolean;
}
interface StepIndicatorProps {
    /** Array of steps */
    steps: Step[];
    /** Current active step index (0-based) */
    currentStep: number;
    /** Orientation of the step indicator */
    orientation?: 'horizontal' | 'vertical';
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Click handler for steps (for navigation) */
    onStepClick?: (stepIndex: number) => void;
    /** Whether to allow clicking on completed steps only */
    allowCompletedStepsOnly?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * StepIndicator displays a multi-step progress indicator for wizards and forms.
 */
declare function StepIndicator({ steps, currentStep, orientation, size, onStepClick, allowCompletedStepsOnly, className, }: StepIndicatorProps): react_jsx_runtime.JSX.Element;

interface StripeBadgeProps {
    /** Display variant */
    variant?: 'default' | 'outline' | 'minimal';
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show "Powered by" text */
    showPoweredBy?: boolean;
    /** Link to Stripe's website */
    href?: string;
    /** Custom className */
    className?: string;
}
/**
 * A badge indicating Stripe payment processing, commonly used in payment forms
 * and checkout pages to show trust and security.
 *
 * @example
 * ```tsx
 * <StripeBadge />
 * <StripeBadge variant="outline" showPoweredBy />
 * <StripeBadge size="sm" variant="minimal" />
 * ```
 */
declare function StripeBadge({ variant, size, showPoweredBy, href, className, }: StripeBadgeProps): react_jsx_runtime.JSX.Element;
interface StripeSecureBadgeProps {
    /** Size variant */
    size?: 'sm' | 'md';
    /** Custom className */
    className?: string;
}
/**
 * A badge emphasizing Stripe's security, commonly used near sensitive form fields.
 *
 * @example
 * ```tsx
 * <StripeSecureBadge />
 * <StripeSecureBadge size="sm" />
 * ```
 */
declare function StripeSecureBadge({ size, className, }: StripeSecureBadgeProps): react_jsx_runtime.JSX.Element;

/**
 * Timeline step/milestone
 */
interface TimelineStep {
    /** Unique identifier */
    key: string;
    /** Step label text */
    label: string;
    /** Step description (optional) */
    description?: string;
    /** Completion timestamp */
    completedAt?: Date | string;
    /** Whether this step is hidden */
    hidden?: boolean;
    /** Whether this step has an error */
    error?: boolean;
}
type TimelineStepState = 'completed' | 'current' | 'pending' | 'error';
type TimelineSize = 'sm' | 'md' | 'lg';
/**
 * Timeline event/message
 */
interface TimelineEvent {
    /** Unique identifier */
    id: string;
    /** Event type/category */
    type: 'message' | 'status' | 'attachment' | 'assignment' | 'note';
    /** Event title */
    title: string;
    /** Event description/content */
    content?: string;
    /** Author/actor name */
    author?: string;
    /** Author avatar URL */
    authorAvatar?: string;
    /** Event timestamp */
    timestamp: Date | string;
    /** Associated metadata */
    metadata?: Record<string, unknown>;
}
interface TimelineProgressProps {
    /** Array of timeline steps */
    steps: TimelineStep[];
    /** Current step key (determines state of all steps) */
    currentStep: string;
    /** Whether to show timestamps */
    showTimestamps?: boolean;
    /** Size variant */
    size?: TimelineSize;
    /** Whether to show a pulse animation on the current step */
    pulse?: boolean;
    /** Custom className */
    className?: string;
}
/**
 * A horizontal timeline progress indicator showing order/workflow steps.
 *
 * @example
 * ```tsx
 * <TimelineProgress
 *   steps={[
 *     { key: 'submitted', label: 'Submitted', completedAt: new Date() },
 *     { key: 'processing', label: 'Processing' },
 *     { key: 'completed', label: 'Completed' },
 *   ]}
 *   currentStep="processing"
 * />
 * ```
 */
declare function TimelineProgress({ steps, currentStep, showTimestamps, size, pulse, className, }: TimelineProgressProps): react_jsx_runtime.JSX.Element;
declare namespace TimelineProgress {
    var displayName: string;
}
interface TimelineEventListProps {
    /** Array of timeline events */
    events: TimelineEvent[];
    /** Whether to show relative timestamps */
    relativeTime?: boolean;
    /** Custom className */
    className?: string;
}
/**
 * A vertical list of timeline events/messages.
 *
 * @example
 * ```tsx
 * <TimelineEventList
 *   events={[
 *     { id: '1', type: 'status', title: 'Order submitted', timestamp: new Date() },
 *     { id: '2', type: 'message', title: 'Note from provider', content: '...', timestamp: new Date() },
 *   ]}
 * />
 * ```
 */
declare function TimelineEventList({ events, relativeTime, className, }: TimelineEventListProps): react_jsx_runtime.JSX.Element;
declare namespace TimelineEventList {
    var displayName: string;
}
interface OrderConfirmationProps {
    /** Whether the modal/overlay is open */
    open: boolean;
    /** Callback when closed */
    onClose: () => void;
    /** Order number or ID */
    orderNumber?: string;
    /** Custom message */
    message?: string;
    /** Custom className */
    className?: string;
}
/**
 * An order confirmation overlay/modal with animated success state.
 *
 * @example
 * ```tsx
 * <OrderConfirmation
 *   open={showConfirmation}
 *   onClose={() => setShowConfirmation(false)}
 *   orderNumber="ORD-12345"
 * />
 * ```
 */
declare function OrderConfirmation({ open, onClose, orderNumber, message, className, }: OrderConfirmationProps): react_jsx_runtime.JSX.Element | null;
declare namespace OrderConfirmation {
    var displayName: string;
}

type ToastVariant = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
interface ToastData {
    /** Unique identifier for the toast */
    id: string;
    /** Toast message content */
    message: ReactNode;
    /** Optional title for the toast */
    title?: string;
    /** Toast variant/type (default: 'info') */
    variant?: ToastVariant;
    /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss, default: 5000) */
    duration?: number;
    /** Whether the toast can be dismissed by clicking (default: true) */
    dismissible?: boolean;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Custom icon to display */
    icon?: ReactNode;
    /** Callback when toast is dismissed */
    onDismiss?: () => void;
}
type ToastOptions = Omit<ToastData, 'id'>;
interface ToastContextValue {
    /** Currently visible toasts */
    toasts: ToastData[];
    /** Add a new toast and return its ID */
    toast: (options: ToastOptions) => string;
    /** Shorthand for success toast */
    success: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Shorthand for error toast */
    error: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Shorthand for warning toast */
    warning: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Shorthand for info toast */
    info: (message: ReactNode, options?: Partial<ToastOptions>) => string;
    /** Dismiss a specific toast by ID */
    dismiss: (id: string) => void;
    /** Dismiss all toasts */
    dismissAll: () => void;
}
interface ToastProviderProps {
    children: ReactNode;
    /** Maximum number of toasts to show at once (default: 5) */
    maxToasts?: number;
    /** Position of toasts on screen (default: 'bottom-right') */
    position?: ToastPosition;
    /** Default duration for toasts in ms (default: 5000) */
    defaultDuration?: number;
}
declare function ToastProvider({ children, maxToasts, defaultDuration, }: ToastProviderProps): React__default.JSX.Element;
/**
 * Hook to access the toast notification system.
 * Must be used within a ToastProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { success, error } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       success('Data saved successfully!');
 *     } catch (e) {
 *       error('Failed to save data');
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
declare function useToast(): ToastContextValue;

interface ToastProps extends ToastData {
    /** Called when the toast is dismissed */
    onClose: () => void;
}
declare function Toast({ title, message, variant, dismissible, action, icon, onClose, }: ToastProps): React__default.JSX.Element;
interface ToastContainerProps {
    /** Toasts to display */
    toasts: ToastData[];
    /** Position of the toast container (default: 'bottom-right') */
    position?: ToastPosition;
    /** Called when a toast should be dismissed */
    onDismiss: (id: string) => void;
}
declare function ToastContainer({ toasts, position, onDismiss, }: ToastContainerProps): React__default.JSX.Element | null;

interface SystemReport {
    /** Report ID */
    id: string;
    /** Report name */
    name: string;
    /** Report description */
    description?: string;
    /** Report category/group */
    category?: string;
}
interface ReportResult {
    /** Result data (typically HTML or structured data) */
    data?: string | Record<string, unknown> | Record<string, unknown>[];
    /** Chart/visualization data */
    chartData?: unknown;
    /** Error message if report failed */
    error?: string;
    /** Whether the report ran successfully */
    success?: boolean;
}
interface DateRange {
    /** Start date */
    start: Date | string;
    /** End date */
    end: Date | string;
}
interface WebChartReportViewerProps {
    /** Available system reports */
    reports: SystemReport[];
    /** Currently selected report */
    currentReport?: SystemReport;
    /** Report results */
    reportResult?: ReportResult;
    /** Callback when report is selected */
    onReportSelect?: (report: SystemReport) => void;
    /** Callback to refresh reports list */
    onRefreshReports?: () => void;
    /** Callback to refresh current report */
    onRefreshReport?: () => void;
    /** Callback when offcanvas closes */
    onClose?: () => void;
    /** Whether reports are loading */
    loading?: boolean;
    /** Whether current report is loading */
    loadingReport?: boolean;
    /** Error message */
    error?: string;
    /** Date range for reports */
    dateRange?: DateRange;
    /** Callback when date range changes */
    onDateRangeChange?: (start: Date | string, end: Date | string) => void;
    /** WebChart brand info */
    webchartBrand?: {
        name: string;
        logo?: string;
    };
    /** Callback to reconnect WebChart */
    onReconnect?: () => void;
    /** Custom cell renderers keyed by column name */
    columnRenderers?: Record<string, (value: unknown, row: Record<string, unknown>) => React$1.ReactNode>;
    /** Custom class name */
    className?: string;
    /** Labels */
    labels?: {
        refreshReports?: string;
        refreshReport?: string;
        reconnect?: string;
        noReports?: string;
        loadingReports?: string;
        loadingData?: string;
        close?: string;
        dateFrom?: string;
        dateTo?: string;
    };
}
declare function WebChartReportViewer({ reports, currentReport, reportResult, onReportSelect, onRefreshReports, onRefreshReport, onClose, loading, loadingReport, error, dateRange, onDateRangeChange, webchartBrand, onReconnect, columnRenderers, className, labels, }: WebChartReportViewerProps): react_jsx_runtime.JSX.Element;
interface ReportDatePickerProps {
    /** Start date */
    startDate?: Date | string;
    /** End date */
    endDate?: Date | string;
    /** Callback when dates change */
    onChange?: (start: Date | string, end: Date | string) => void;
    /** Preset options */
    presets?: Array<{
        label: string;
        value: string;
    }>;
    /** Custom class name */
    className?: string;
}
declare function ReportDatePicker({ startDate, endDate, onChange, presets, className, }: ReportDatePickerProps): react_jsx_runtime.JSX.Element;

type WebsiteType = 'blog' | 'facebook' | 'instagram' | 'linkedin' | 'pinterest' | 'twitter' | 'website' | 'yelp' | 'youtube';
interface WebsiteEntry {
    url: string;
    type: WebsiteType;
}
interface WebsiteInputProps extends Omit<InputProps, 'type' | 'onChange' | 'value'> {
    /** The URL value */
    value?: string;
    /** Callback fired when the value changes */
    onChange?: (value: string) => void;
    /** Whether to validate and show error state for invalid URLs */
    validateOnBlur?: boolean;
}
/**
 * Validates if a string is a valid URL
 */
declare function isValidUrl(url: string): boolean;
/**
 * A URL input with validation
 *
 * @example
 * ```tsx
 * const [url, setUrl] = useState('');
 * <WebsiteInput
 *   label="Website URL"
 *   value={url}
 *   onChange={setUrl}
 *   validateOnBlur
 * />
 * ```
 */
declare const WebsiteInput: React$1.ForwardRefExoticComponent<WebsiteInputProps & React$1.RefAttributes<HTMLInputElement>>;
declare const WEBSITE_TYPES: {
    value: WebsiteType;
    label: string;
    icon?: string;
}[];
interface WebsiteInputGroupProps {
    /** Array of website entries */
    value: WebsiteEntry[];
    /** Callback when website entries change */
    onChange: (websites: WebsiteEntry[]) => void;
    /** Minimum number of website entries (default: 1) */
    minEntries?: number;
    /** Maximum number of website entries (default: 10) */
    maxEntries?: number;
    /** Whether the first entry is required */
    required?: boolean;
    /** Whether all inputs are disabled */
    disabled?: boolean;
    /** Validate on blur */
    validateOnBlur?: boolean;
    /** Label for the website input */
    label?: string;
    /** Labels for type options (for i18n) */
    typeLabels?: Partial<Record<WebsiteType, string>>;
    /** Custom className */
    className?: string;
}
/**
 * A group of website/social media URL inputs with type selection and add/remove functionality.
 *
 * @example
 * ```tsx
 * const [websites, setWebsites] = useState<WebsiteEntry[]>([
 *   { url: '', type: 'website' }
 * ]);
 *
 * <WebsiteInputGroup
 *   value={websites}
 *   onChange={setWebsites}
 * />
 * ```
 */
declare function WebsiteInputGroup({ value, onChange, minEntries, maxEntries, required, disabled, validateOnBlur, label, typeLabels, className, }: WebsiteInputGroupProps): react_jsx_runtime.JSX.Element;
declare namespace WebsiteInputGroup {
    var displayName: string;
}

export { AGGrid, type AGGridProps, AIChat, type AIChatCallbacks, AIChatModal, type AIChatModalProps, type AIChatProps, type AIChatSession, AIChatTrigger, type AIChatTriggerProps, AILogoIcon, type AILogoIconProps, type AIMessage, type AIMessageContent, AIMessageDisplay, type AIMessageDisplayProps, type AIMessageRole, type AIMessageStatus, type AISuggestedAction, AITypingIndicator, AccessDeniedPage, type AccessDeniedPageProps, ActionButton, type ActionButtonProps, ActionButtonsBar, type ActionButtonsBarProps, ActiveFilters, type ActiveFiltersProps, AddContactModal, type AddContactModalProps, AddServiceCard, type AddServiceCardProps, AdditionalFields, type AdditionalFieldsProps, Address, AddressCard, type AddressCardProps, AddressCompact, type AddressCompactProps, type AddressData, AddressDisplay, type AddressDisplayProps, AddressForm, type AddressFormData, type AddressFormProps, AddressInline, type AddressInlineProps, type AddressProps, AppHeader, AppHeaderActions, type AppHeaderActionsProps, AppHeaderDivider, type AppHeaderDividerProps, AppHeaderIconButton, type AppHeaderIconButtonProps, type AppHeaderProps, AppHeaderSearch, type AppHeaderSearchProps, AppHeaderSection, type AppHeaderSectionProps, AppHeaderTitle, type AppHeaderTitleProps, AppHeaderUserMenu, type AppHeaderUserMenuProps, AttachmentPicker, type AttachmentPickerProps, AttachmentPreview, AttachmentPreviewItem, type AttachmentPreviewItemProps, type AttachmentPreviewProps, type AttachmentState, type AttachmentType, AuthButtons, type AuthButtonsProps, AuthDialog, type AuthDialogProps, type AuthMode, AvatarNameRenderer, type BackgroundCheckCandidate, type BackgroundCheckReport, type BankAccountData, BookAppointmentButton, type BookAppointmentButtonProps, BookingDialog, type BookingDialogProps, type BookingFormData, type BookingProvider, type BookingService, BooleanRenderer, BrandConfig, BusinessHours, BusinessHoursEditor, type BusinessHoursEditorProps, type BusinessHoursProps, type BusinessHoursSchedule, type CSVColumn, CSVColumnMapper, type CSVColumnMapperProps, CSVFileUpload, type CSVFileUploadProps, type CalendarAppointment, CameraButton, type CameraButtonProps, type CameraPermission, CardSkeleton, type CardSkeletonProps, CellRenderers, CharacterCounter, type CharacterCounterProps, type ChartDataPoint, CheckrIntegration, type CheckrIntegrationProps, ChevronIcon, type ChevronIconProps, type ClaimFormData, ClaimListingButton, type ClaimListingButtonProps, ClaimProviderForm, type ClaimProviderFormProps, CloseIcon, type CloseIconProps, type ColDef, CommandPalette, type CommandPaletteCategory, type CommandPaletteContextValue, type CommandPaletteItem, type CommandPaletteProps, CommandPaletteProvider, type CommandPaletteProviderProps, CommandPaletteTrigger, type CommandPaletteTriggerProps, CompactCookieBanner, type CompactCookieBannerProps, CompactFilterBar, type CompactFilterBarProps, CompactHeader, type CompactHeaderProps, CompactHours, type CompactHoursProps, CompactProviderHeader, type CompactProviderHeaderProps, CompanyRenderer, type ConfirmationResult, type ConnectionInfo, type ConnectionState, ConnectionStatusBadge, type ConnectionStatusBadgeProps, ConnectionStatusBar, type ConnectionStatusBarProps, ConnectionStatusOverlay, type ConnectionStatusOverlayProps, ConsentSwitch, type ConsentSwitchProps, type Contact, type ContactAddress, type ContactFormData, type Conversation, ConversationHeader, type ConversationHeaderProps, ConversationListItem, type ConversationListItemProps, ConversationListSkeleton, type ConversationListSkeletonProps, type ConversationType, CookieConsentBanner, type CookieConsentBannerProps, type CookieConsentLink, CopyrightText, type CopyrightTextProps, type CreateInvoiceData, CreateInvoiceModal, type CreateInvoiceModalProps, CreateReferralModal, type CreateReferralModalProps, type CreditCardData, CurrencyRenderer, type CustomField, DEFAULT_ACCEPTED_FILE_TYPES, DEFAULT_ERROR_CONFIGS, DEFAULT_LANGUAGES, DEFAULT_MAX_FILE_SIZE_MB, DEFAULT_RADIUS_OPTIONS, DEFAULT_SOCIAL_PROVIDERS, DOTBadge, type DOTBadgeProps, type DateRange$1 as DateRange, DateRangeFilter, type DateRangeFilterProps, DateRangePicker, type DateRangePickerProps, type DateRangePreset, type DateRangePresetKey, DateRenderer, type DateRendererProps, DateSeparator, type DateSeparatorProps, type DayHours, type DaySchedule, type Department, type DetectionConfig, type DetectionMetrics, type DetectionState, DialogOverlay, type DialogOverlayProps, DisclaimerText, type DisclaimerTextProps, type DocumentBoundary, DocumentDetectionOverlay, DocumentScanner, type DocumentScannerProps, DomainRenderer, DragDropZone, type DragDropZoneProps, DropZone, type DropZoneProps, DropzoneOverlay, type DropzoneOverlayProps, EditUserRoleModal, type EditUserRoleModalProps, EmailRenderer, type Employee, type EmployeeAddress, type EmployeeData, EmployeeForm, type EmployeeFormData, type EmployeeFormProps, type EmployeePhone, EmployeeProfileCard, type EmployeeProfileCardProps, type Employer, type EmployerAccess, type EmployerAddress, type EmployerContact, EmployerContactCard, type EmployerContactCardProps, type EmployerDetails, type EmployerInvoice, EmployerList, type EmployerListProps, type EmployerOption, type EmployerOrder, EmployerPricingCard, type EmployerPricingCardProps, type EmployerServiceConfig, EmployerServiceModal, type EmployerServiceModalProps, EmployerView, type EmployerViewProps, EmptyState, type EmptyStateProps, EngagementScoreRenderer, ErrorPage, type ErrorPageConfig, type ErrorPageProps, type ErrorType, type FAQItem, type FieldOption, type FileItem, FileManager, type FileManagerProps, FilePreview, type FilePreviewProps, FloatingAIChat, type FloatingAIChatProps, FloatingInput, type FloatingInputProps, type FooterLink, type FooterLinkGroup, FooterLinkSection, type FooterLinkSectionProps, SocialMediaLinks as FooterSocialLinks, type SocialMediaLinksProps as FooterSocialLinksProps, type GeolocationStatus, type HRISProvider, HRISProviderSelector, type HRISProviderSelectorProps, HelpSupportPanel, type HelpSupportPanelProps, HeroSearchBar, type HeroSearchBarProps, HoursSummary, type HoursSummaryProps, InlineBookingForm, type InlineBookingFormProps, InputProps, type InventoryLogEntry, InventoryManager, type InventoryManagerProps, InviteUserModal, type InviteUserModalProps, type Invoice, type InvoiceLineItem$1 as InvoiceLineItem, InvoiceList, type InvoiceListProps, type InvoicePaymentDetails, InvoicePaymentPage, type InvoicePaymentPageProps, InvoiceView, type InvoiceViewProps, type KeyValueEntry, type Language, LanguageSelector, LanguageSelectorInline, type LanguageSelectorInlineProps, LanguageSelectorNative, type LanguageSelectorNativeProps, type LanguageSelectorProps, LegalLinks, type LegalLinksProps, LightboxModal, type LightboxModalProps, LinkedInRenderer, LoadMoreButton, type LoadMoreButtonProps, LoadingBar, type LoadingBarProps, LoadingDots, type LoadingDotsProps, LoadingOverlay, type LoadingOverlayProps, LoadingPage, type LoadingPageProps, LoadingSkeleton, type LoadingSkeletonProps, type MCPResource, type MCPResourceLink, type MCPToolCall, MCPToolCallDisplay, type MCPToolCallDisplayProps, type MCPToolInfo, type MCPToolParameter, type MCPToolResult, type MCPToolStatus, MaintenancePage, type MaintenancePageProps, MemoizedAvatarNameRenderer, MemoizedBooleanRenderer, MemoizedCompanyRenderer, MemoizedCurrencyRenderer, MemoizedDateRenderer, MemoizedDomainRenderer, MemoizedEmailRenderer, MemoizedEngagementScoreRenderer, MemoizedLinkedInRenderer, MemoizedNumberRenderer, MemoizedPhoneRenderer, MemoizedProgressRenderer, MemoizedStatusBadgeRenderer, MemoizedTagsRenderer, type Message, type MessageAction, type MessageAttachment, MessageAvatar, MessageBubble, type MessageBubbleProps, MessageComposer, type MessageComposerProps, type MessageGroup, MessageList, type MessageListProps, type MessageParticipant, type MessageReaction, type MessageStatus, MessageStatusIcon, type MessageStatusIconProps, type MessageStatusIndicator, MessageThread, type MessageThreadProps, type MessageType, type MessagingEventHandlers, type MessagingLoadingState, MessagingSplitView, type MessagingSplitViewProps, type MetricData, MobileBackButton, type MobileBackButtonProps, MobileMenuButton, type MobileMenuButtonProps, MobileMenuPanel, type MobileMenuPanelProps, type NavLink, NavLinks, type NavLinksProps, type NewMessage, NewsletterForm, type NewsletterFormProps, NotFoundPage, type NotFoundPageProps, type Notification, NotificationCenter, type NotificationCenterProps, NumberRenderer, OfflinePage, type OfflinePageProps, OnboardingCompletion, type OnboardingCompletionProps, type OnboardingStep, OnboardingStepQuestion, type OnboardingStepQuestionProps, OnboardingWizard, type OnboardingWizardProps, OpenStatusBadge, OrderCard, type OrderCardProps, OrderConfirmation, type OrderConfirmationProps, OrderConfirmationWizard, type OrderConfirmationWizardProps, OrderDetailSidebar, type OrderDetailSidebarProps, type OrderDetails, type OrderEmployee, type OrderEmployer, OrderList, type OrderListProps, type OrderListTab, type OrderLookupData, OrderLookupForm, type OrderLookupFormProps, type OrderOption, type OrderService, OrderSidebar, type OrderSidebarProps, type OrderSidebarTab, OrderSidebarTabs, type OrderSidebarTabsProps, type OrderStatus$1 as OrderStatus, PageHeader, type PageHeaderProps, type Payment, type PaymentFormData, PaymentHistoryTable, type PaymentHistoryTableProps, type PaymentMethod, PaymentMethodBank, type PaymentMethodBankProps, PaymentMethodCard, type PaymentMethodCardProps, PaymentMethodList, type PaymentMethodListProps, type PendingClaim, PendingClaimsTable, type PendingClaimsTableProps, type Permission, type PermissionGroup, PermissionsEditor, type PermissionsEditorProps, PhoneRenderer, type Point, type PostalCodeInfo, type PreviewFile, type PricingTier, ProductVersion, ProductVersionBadge, type ProductVersionBadgeProps, type ProductVersionProps, ProgressRenderer, type ProgressRendererProps, type Provider, type ProviderAddress$1 as ProviderAddress, Breadcrumb as ProviderBreadcrumb, type BreadcrumbItem as ProviderBreadcrumbItem, type BreadcrumbProps as ProviderBreadcrumbProps, ProviderCard, ProviderCardGrid, type ProviderCardGridProps, type ProviderCardProps, ProviderCardSkeleton, type ProviderCardSkeletonProps, type ProviderContact, type ProviderAddress as ProviderDetailAddress, type ProviderDetailData, ProviderDetailHeader, type ProviderDetailHeaderProps, ProviderDetailHeaderSkeleton, type ProviderDetailHeaderSkeletonProps, type ProviderFilters, ProviderLogo, type ProviderLogoProps, type ProviderOption, ProviderOverview, type ProviderOverviewProps, ProviderSearchBar, type ProviderSearchBarProps, ProviderSearchFilters, type ProviderSearchFiltersProps, ProviderSelector, type ProviderSelectorProps, type ProviderService, ProviderSettings, type ProviderSettingsData, type ProviderSettingsProps, SocialMediaLinks$1 as ProviderSocialLinks, type SocialMediaLinksProps$1 as ProviderSocialLinksProps, type ProviderStats, type ProviderUrls, type ProviderUser, ProviderUsersTable, type ProviderUsersTableProps, QuickBookCard, type QuickBookCardProps, type QuickLink, QuickLinksCard, type QuickLinksCardProps, type RadiusOption, type ReadReceipt, ReadReceiptIndicator, type ReadReceiptIndicatorProps, type RecentActivity, type RecurringService, RecurringServiceAddCard, type RecurringServiceAddCardProps, RecurringServiceCard, type RecurringServiceCardProps, type RecurringServiceCardState, type RecurringServiceFormData, RecurringServiceGrid, type RecurringServiceGridProps, RecurringServiceSetupModal, type RecurringServiceSetupModalProps, type ReferralData, RefreshIcon, type RefreshIconProps, RejectionModal, type RejectionModalProps, type RejectionReason, ReportDashboard, type ReportDashboardProps, ReportDatePicker, type ReportDatePickerProps, ReportLink, type ReportLinkProps, type ReportResult, ResourceLink, type ResourceLinkProps, type ResultStatus, ResultsEntryCard, type ResultsEntryData, ResultsEntryForm, type ResultsEntryFormProps, ResultsEntryModal, type ResultsEntryModalProps, type Role, type SSOConfigData, SSOConfigForm, type SSOConfigFormProps, type ScannerSource, type ScannerState, ScheduleCalendar, type ScheduleCalendarProps, type SearchResults, SearchResultsMessage, type SearchResultsMessageProps, type SelectableService, SelectedServicesBadges, type SelectedServicesBadgesProps, SendButton, type SendButtonProps, SendIcon, type SendIconProps, ServerErrorPage, type ServerErrorPageProps, ServiceAccordion, type ServiceAccordionProps, ServiceBadge, ServiceBadgeGroup, type ServiceBadgeGroupProps, type ServiceBadgeProps, ServiceCard, type ServiceCardProps, type ServiceCategory$1 as ServiceCategory, ServiceCategoryBadge, type ServiceCategoryBadgeProps, type ServiceFormData, ServiceGeneralSettings, type ServiceGeneralSettingsProps, ServiceGrid, type ServiceGridProps, type ServiceGroup, type ServiceItem, ServiceLink, ServiceList, type ServiceListProps, ServiceMultiSelect, type ServiceOption, ServicePicker, type ServicePickerProps, type ServicePrice, ServicePricingManager, type ServicePricingManagerProps, ServiceSelect, type ServiceSelectProps, ServiceShippingSettings, type ServiceShippingSettingsProps, type ServiceSubCategory, ServiceTagCloud, ServiceTagCloudBadges, type ServiceTagCloudProps as ServiceTagCloudBadgesProps, type ServiceTagCloudProps$1 as ServiceTagCloudProps, SetupServiceModal, type SetupServiceModalProps, type ShippingAddress, Sidebar, SidebarContent, type SidebarContentProps, type SidebarContextValue, SidebarFooter, type SidebarFooterProps, SidebarHeader, type SidebarHeaderProps, SidebarMobileToggle, type SidebarMobileToggleProps, SidebarNav, SidebarNavGroup, type SidebarNavGroupProps, SidebarNavItem, type SidebarNavItemProps, type SidebarNavProps, type SidebarProps, SidebarProvider, type SidebarProviderProps, SidebarSearch, type SidebarSearchProps, SidebarToggle, type SidebarToggleProps, type SignupData, SimpleFooter, type SimpleFooterProps, SiteFooter, type SiteFooterProps, SiteHeader, type SiteHeaderProps, SiteLogo, type SiteLogoProps, SkeletonMessage, type SkeletonMessageProps, type SocialLink, type SocialProvider, SparklesIcon, type SparklesIconProps, SpinnerIcon, type SpinnerIconProps, SpinnerProps, StatusBadgeRenderer, type StatusBadgeRendererProps, type StatusConfig, type Step, StepIndicator, type StepIndicatorProps, StripeBadge, type StripeBadgeProps, StripeSecureBadge, type StripeSecureBadgeProps, SuggestedActions, type SuggestedActionsProps, type SupportContact, type SystemMessageType, type SystemReport, TagsRenderer, type TimeRange, type TimeSlot, type TimelineEvent, TimelineEventList, type TimelineEventListProps, TimelineProgress, type TimelineProgressProps, type TimelineSize, type TimelineStep, type TimelineStepState, Toast, ToastContainer, type ToastContainerProps, type ToastContextValue, type ToastData, type ToastOptions, type ToastPosition, type ToastProps, ToastProvider, type ToastProviderProps, type ToastVariant, ToolStatusIcon, type TopItem, TypingIndicator, type TypingIndicatorProps, type TypingState, UpdateAvailableOverlay, type UpdateAvailableOverlayProps, type UpdateInfo, type UseConnectionStatusOptions, type UseConnectionStatusReturn, type UseCookieConsentOptions, type UseCookieConsentReturn, type UseDropzoneOptions, type UseDropzoneReturn, type UseMessageScrollOptions, type UseMessageScrollReturn, type UseMessagesOptions, type UseMessagesReturn, type UseReadReceiptsOptions, type UseTypingIndicatorOptions, type UseTypingIndicatorReturn, UserMenu, type UserMenuProps, type UserProfile, type UserRole, type ValidationError, VerifiedBadge, type VerifiedBadgeProps, WEBSITE_TYPES, WebChartReportViewer, type WebChartReportViewerProps, WebcamModal, type WebcamModalProps, type WebsiteEntry, WebsiteInput, WebsiteInputGroup, type WebsiteInputGroupProps, type WebsiteInputProps, type WebsiteType, bubbleVariants, create24HourSchedule, createDefaultSchedule, createWeekdaySchedule, defaultOrderTabs, formatAddressLines, formatAddressSingleLine, formatCityState, formatCityStateZip, formatDateLabel, formatFileSize, formatLastSeen, formatPhoneDisplay, generateAttachmentId, generateId, getConversationSubtitle, getConversationTitle, getFileType, getGoogleMapsSearchUrl, getGoogleMapsUrl, getToolIcon, groupMessagesByDate, headerVariants$2 as headerVariants, isSameSenderGroup, isValidUrl, sendButtonVariants, statusColors, useCamera, useCommandPalette, useConnectionStatus, useCookieConsent, useDocumentDetection, useDropzone, useFileUpload, useMessageScroll, useMessages, useReadReceipts, useSidebar, useToast, useTypingIndicator, validateFile };
