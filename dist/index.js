export { ThemeProvider, ThemeProviderContext, ThemeToggle, themeToggleIconVariants, themeToggleVariants, useThemeContext } from './chunk-TA6FVVCM.js';
export { Tooltip } from './chunk-UZUBLXVC.js';
export { VisuallyHidden } from './chunk-H2CIKJQI.js';
export { brands } from './chunk-FIUNOH6W.js';
export { miewebBrand } from './chunk-UHSPAFY6.js';
export { wagglelineBrand } from './chunk-OWPWP46L.js';
export { webchartBrand } from './chunk-C6MDPPPL.js';
export { createBrandPreset, generateBrandCSS, generateTailwindTheme } from './chunk-SOFX4T7M.js';
export { bluehiveBrand } from './chunk-ULOA7WBW.js';
export { defaultBrand } from './chunk-4LTN2LEN.js';
export { enterpriseHealthBrand } from './chunk-MTZPVOP6.js';
export { Select, selectTriggerVariants } from './chunk-KJOFWJHV.js';
export { Skeleton, SkeletonCard, SkeletonTable, SkeletonText, skeletonVariants } from './chunk-6OCIIIAI.js';
export { FullPageSpinner, Spinner, SpinnerWithLabel, spinnerVariants } from './chunk-GV5JQBPX.js';
export { Switch, switchThumbVariants, switchTrackVariants } from './chunk-TTSLBOAO.js';
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './chunk-AWIULTJW.js';
export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants, tabsTriggerVariants } from './chunk-JFAXLE2J.js';
export { SmallMuted, Text, textVariants } from './chunk-RCMF6KZA.js';
export { Textarea, textareaVariants } from './chunk-4AWW5WPF.js';
export { Modal, ModalBody, ModalClose, ModalFooter, ModalHeader, ModalTitle, modalContentVariants, modalOverlayVariants } from './chunk-D5IBXXF2.js';
export { Pagination, SimplePagination, paginationButtonVariants } from './chunk-ONWOB76P.js';
export { PhoneInput } from './chunk-J23CSBQG.js';
export { CircularProgress, Progress, circularProgressVariants, progressBarFillVariants, progressBarTrackVariants } from './chunk-4MHTSFPX.js';
export { QuickAction, QuickActionGroup, QuickActionIcons, quickActionIconVariants, quickActionVariants } from './chunk-VO3RBR4B.js';
export { Radio, RadioGroup, radioVariants } from './chunk-BC7YQKHJ.js';
export { RecordButton, formatDuration, recordButtonVariants, recordingIndicatorVariants } from './chunk-QK4R7ISY.js';
export { DateButton, DatePicker, RadioOption, SchedulePicker, TimeButton, TimePicker, dateButtonVariants, radioOptionVariants, timeButtonVariants } from './chunk-DMA74PZ7.js';
export { Badge, badgeVariants } from './chunk-3NJ72QU6.js';
export { Breadcrumb, BreadcrumbSlash } from './chunk-B3L43JGH.js';
export { Button, buttonVariants } from './chunk-ZH2ST6EC.js';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants } from './chunk-XVNFVSOS.js';
export { Checkbox, CheckboxGroup, checkboxVariants } from './chunk-VW7ZJHOM.js';
export { DateInput } from './chunk-HK4M7Z6D.js';
export { Dropdown, DropdownContent, DropdownHeader, DropdownItem, DropdownLabel, DropdownSeparator } from './chunk-265CFCCX.js';
export { Input, inputVariants } from './chunk-LIYX5CYL.js';
import { useCommandK, useMediaQuery } from './chunk-CP7NPDQW.js';
export { useCommandK, useIsDesktop, useIsLargeDesktop, useIsMobile, useIsMobileOrTablet, useIsSmallTablet, useIsTablet, useKeyboardShortcut, useMediaQuery } from './chunk-CP7NPDQW.js';
export { useTheme } from './chunk-KJZNEVYM.js';
export { usePrefersReducedMotion } from './chunk-HB7C7NB5.js';
import { useFocusTrap } from './chunk-CLNOI5J7.js';
export { useFocusTrap } from './chunk-CLNOI5J7.js';
import { useClickOutside } from './chunk-OT36EMM5.js';
export { useClickOutside } from './chunk-OT36EMM5.js';
import { useEscapeKey } from './chunk-T4ME7QCT.js';
export { useEscapeKey } from './chunk-T4ME7QCT.js';
import './chunk-ZQ4XMJH7.js';
export { formatPhoneNumber, isPhoneNumberEmpty, isValidPhoneNumber, unformatPhoneNumber } from './chunk-CEHWXAAI.js';
export { calculateAge, formatDateValue, isDateEmpty, isDateInFuture, isDateInPast, isValidDate, isValidDrivingAge, parseDateValue } from './chunk-SN52QMRT.js';
export { miewebUIPreset, miewebUISafelist } from './chunk-D2UGT5OL.js';
export { Alert, AlertDescription, AlertTitle, alertVariants } from './chunk-I4BGJZ7J.js';
export { AudioPlayer, ProgressBar, audioPlayerVariants, formatTime as formatAudioTime, playButtonVariants } from './chunk-S64LP3CR.js';
export { AudioRecorder, audioRecorderVariants, controlButtonVariants, formatTime, waveformContainerVariants } from './chunk-QZLRB3UG.js';
export { Avatar, AvatarGroup, avatarVariants, getInitials } from './chunk-DKOQSOJC.js';
import { cn } from './chunk-F3SOEIN2.js';
export { cn } from './chunk-F3SOEIN2.js';
import * as React14 from 'react';
import React14__default, { memo, createContext, useState, useCallback, useMemo, useContext, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
export { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { cva } from 'class-variance-authority';
import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { Mail, Phone, Linkedin, Globe, CheckCircle, Clock } from 'lucide-react';

ModuleRegistry.registerModules([AllCommunityModule]);
var agGridVariants = cva("ag-theme-custom w-full", {
  variants: {
    /**
     * Visual variant of the grid
     */
    variant: {
      default: "",
      bordered: "[&_.ag-root-wrapper]:border [&_.ag-root-wrapper]:border-border [&_.ag-root-wrapper]:rounded-lg",
      striped: "[&_.ag-row-odd]:bg-muted/50"
    },
    /**
     * Size/density of the grid rows
     */
    size: {
      sm: "[&_.ag-row]:h-8 [&_.ag-header-row]:h-8 text-xs",
      md: "[&_.ag-row]:h-10 [&_.ag-header-row]:h-10 text-sm",
      lg: "[&_.ag-row]:h-12 [&_.ag-header-row]:h-12 text-base"
    }
  },
  defaultVariants: {
    variant: "default",
    size: "md"
  }
});
var defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  minWidth: 100
};
function AGGridInner({
  className,
  variant,
  size,
  height = 400,
  loading = false,
  columnDefs,
  rowData,
  defaultColDef: userDefaultColDef,
  onGridReady,
  onRowClick,
  gridRef,
  rowSelection,
  ...props
}, ref) {
  const internalRef = React14.useRef(null);
  const gridApiRef = React14.useRef(null);
  const resolvedRef = gridRef || ref || internalRef;
  const handleGridReady = React14.useCallback(
    (event) => {
      gridApiRef.current = event.api;
      onGridReady?.(event);
    },
    [onGridReady]
  );
  const handleRowClicked = React14.useCallback(
    (event) => {
      onRowClick?.(event);
    },
    [onRowClick]
  );
  const mergedDefaultColDef = React14.useMemo(
    () => ({
      ...defaultColDef,
      ...userDefaultColDef
    }),
    [userDefaultColDef]
  );
  const resolvedRowSelection = React14.useMemo(() => {
    if (!rowSelection) return void 0;
    if (typeof rowSelection === "object") {
      return rowSelection;
    }
    if (rowSelection === "multiple") {
      return {
        mode: "multiRow",
        enableClickSelection: true
      };
    }
    if (rowSelection === "single") {
      return {
        mode: "singleRow",
        enableClickSelection: true
      };
    }
    return void 0;
  }, [rowSelection]);
  React14.useEffect(() => {
    if (gridApiRef.current) {
      if (loading) {
        gridApiRef.current.showLoadingOverlay();
      } else {
        gridApiRef.current.hideOverlay();
      }
    }
  }, [loading]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(agGridVariants({ variant, size }), className),
      style: { height: typeof height === "number" ? `${height}px` : height },
      children: /* @__PURE__ */ jsx(
        AgGridReact,
        {
          ref: resolvedRef,
          columnDefs,
          rowData,
          defaultColDef: mergedDefaultColDef,
          onGridReady: handleGridReady,
          onRowClicked: handleRowClicked,
          animateRows: false,
          rowSelection: resolvedRowSelection,
          theme: "legacy",
          ...props
        }
      )
    }
  );
}
var AGGrid = React14.forwardRef(AGGridInner);
AGGrid.displayName = "AGGrid";
function getNestedValue(obj, path) {
  if (!obj || !path) return void 0;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === void 0) return void 0;
    if (typeof current === "object") {
      current = current[part];
    } else {
      return void 0;
    }
  }
  return current;
}
function getFaviconUrl(domain) {
  if (!domain || typeof domain !== "string") return null;
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
  if (!cleanDomain) return null;
  return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`;
}
function formatPhoneDisplay(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `${cleaned[0]}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}
function getInitials2(name) {
  if (!name || typeof name !== "string") return "??";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
function getAvatarColor(name) {
  const colors = [
    "bg-primary-600",
    "bg-green-600",
    "bg-orange-600",
    "bg-secondary-600",
    "bg-pink-600",
    "bg-primary-700",
    "bg-teal-600",
    "bg-amber-600"
  ];
  if (!name || typeof name !== "string") return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
function cellRendererPropsAreEqual(prevProps, nextProps) {
  if (prevProps.value !== nextProps.value) return false;
  if (prevProps.data !== nextProps.data) return false;
  if (prevProps.node?.rowIndex !== nextProps.node?.rowIndex) return false;
  return true;
}
var statusColors = {
  active: {
    label: "Active",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-600 dark:text-green-400"
  },
  inactive: {
    label: "Inactive",
    bgClass: "bg-gray-200 dark:bg-gray-700",
    textClass: "text-gray-600 dark:text-gray-400"
  },
  pending: {
    label: "Pending",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    textClass: "text-amber-600 dark:text-amber-400"
  },
  new: {
    label: "New",
    bgClass: "bg-primary-100 dark:bg-primary-900/30",
    textClass: "text-primary-600 dark:text-primary-400"
  },
  verified: {
    label: "Verified",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-600 dark:text-green-400"
  },
  flagged: {
    label: "Flagged",
    bgClass: "bg-red-100 dark:bg-red-900/30",
    textClass: "text-red-600 dark:text-red-400"
  }
};
function AvatarNameRenderer(props) {
  const { data, value } = props;
  if (!data && !value) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const displayName = typeof value === "string" && value ? value : "Unknown";
  const isSystemValue = ["Unknown", "Unassigned", "System"].includes(
    displayName
  );
  const avatarUrl = props.avatarField && data ? getNestedValue(data, props.avatarField) : data?.avatarUrl;
  const domain = props.domainField && data ? getNestedValue(data, props.domainField) : data?.company?.domain || data?.domain;
  const faviconUrl = getFaviconUrl(domain);
  const initials = getInitials2(displayName);
  const imageUrl = avatarUrl || faviconUrl;
  if (isSystemValue) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-1", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-400 dark:bg-gray-700 dark:text-gray-500", children: displayName === "Unassigned" ? "\u2014" : "??" }),
      /* @__PURE__ */ jsx("span", { className: "truncate text-gray-400 italic dark:text-gray-500", children: displayName })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-1", children: [
    imageUrl ? /* @__PURE__ */ jsx(
      "img",
      {
        src: imageUrl,
        alt: displayName,
        className: "h-7 w-7 rounded-full bg-white object-cover ring-2 ring-white dark:ring-gray-700",
        onError: (e) => {
          const target = e.target;
          target.style.display = "none";
          const sibling = target.nextElementSibling;
          if (sibling) sibling.style.display = "flex";
        }
      }
    ) : null,
    /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white",
          getAvatarColor(displayName)
        ),
        style: { display: imageUrl ? "none" : "flex" },
        children: initials
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "text-foreground truncate font-medium", children: displayName })
  ] });
}
function StatusBadgeRenderer(props) {
  const { value, statusConfig = statusColors } = props;
  if (!value) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const normalizedValue = String(value).toLowerCase().replace(/\s+/g, "_");
  const config = statusConfig[normalizedValue] || {
    label: value,
    bgClass: "bg-gray-200 dark:bg-gray-700",
    textClass: "text-gray-600 dark:text-gray-400"
  };
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bgClass,
        config.textClass
      ),
      children: config.label
    }
  );
}
function getEngagementScoreColors(score) {
  if (score >= 70)
    return {
      barColor: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400"
    };
  if (score >= 40)
    return {
      barColor: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400"
    };
  if (score >= 20)
    return {
      barColor: "bg-orange-500",
      textColor: "text-orange-600 dark:text-orange-400"
    };
  return {
    barColor: "bg-gray-400",
    textColor: "text-gray-600 dark:text-gray-400"
  };
}
function EngagementScoreRenderer(props) {
  const { value } = props;
  if (value == null) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const score = Number(value);
  const percentage = Math.min(100, Math.max(0, score));
  const { barColor, textColor } = getEngagementScoreColors(score);
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-1", children: [
    /* @__PURE__ */ jsx("div", { className: "h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: cn("h-full rounded-full transition-all", barColor),
        style: { width: `${percentage}%` }
      }
    ) }),
    /* @__PURE__ */ jsx("span", { className: cn("text-sm font-medium", textColor), children: score })
  ] });
}
function EmailRenderer(props) {
  const { value } = props;
  if (!value) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: `mailto:${value}`,
      className: "text-primary-600 dark:text-primary-400 inline-flex items-center gap-1.5 hover:underline",
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsx(Mail, { className: "h-3 w-3 opacity-60" }),
        /* @__PURE__ */ jsx("span", { className: "truncate", children: value })
      ]
    }
  );
}
function PhoneRenderer(props) {
  const { value } = props;
  if (!value) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const displayValue = formatPhoneDisplay(value);
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: `tel:${value}`,
      className: "text-foreground hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1.5",
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsx(Phone, { className: "h-3 w-3 text-green-500 opacity-70" }),
        /* @__PURE__ */ jsx("span", { children: displayValue })
      ]
    }
  );
}
function DomainRenderer(props) {
  const { value } = props;
  if (!value) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const url = value.startsWith("http") ? value : `https://${value}`;
  const displayDomain = value.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: url,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "text-primary-600 dark:text-primary-400 inline-flex items-center gap-1.5 hover:underline",
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsx(Globe, { className: "h-3 w-3 opacity-60" }),
        /* @__PURE__ */ jsx("span", { className: "truncate", children: displayDomain })
      ]
    }
  );
}
function LinkedInRenderer(props) {
  const { value } = props;
  if (!value) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: value,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "inline-flex items-center gap-1.5 text-[#0A66C2] hover:underline",
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsx(Linkedin, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { className: "truncate text-sm", children: "LinkedIn" })
      ]
    }
  );
}
function CurrencyRenderer(props) {
  const { value } = props;
  if (value == null) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
  return /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium tabular-nums", children: formatted });
}
function NumberRenderer(props) {
  const { value } = props;
  if (value == null) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const formatted = Number(value).toLocaleString();
  return /* @__PURE__ */ jsx("span", { className: "text-foreground tabular-nums", children: formatted });
}
function DateRenderer(props) {
  const { value, format = "medium" } = props;
  if (!value) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  }
  if (format === "relative") {
    const now = /* @__PURE__ */ new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
    let relativeText;
    if (days === 0) {
      relativeText = "Today";
    } else if (days === 1) {
      relativeText = "Yesterday";
    } else if (days < 7) {
      relativeText = `${days} days ago`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      relativeText = `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      relativeText = `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(days / 365);
      relativeText = `${years} year${years > 1 ? "s" : ""} ago`;
    }
    return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: relativeText });
  }
  const dateOptions = format === "short" ? { month: "numeric", day: "numeric" } : format === "long" ? { month: "long", day: "numeric", year: "numeric" } : { month: "short", day: "numeric", year: "numeric" };
  if (format === "datetime") {
    const formatted2 = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
    return /* @__PURE__ */ jsx("span", { className: "text-foreground", children: formatted2 });
  }
  const formatted = date.toLocaleDateString("en-US", dateOptions);
  return /* @__PURE__ */ jsx("span", { className: "text-foreground", children: formatted });
}
function BooleanRenderer(props) {
  const { value } = props;
  if (value == null) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const isTrue = Boolean(value);
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isTrue ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
      ),
      children: [
        isTrue ? /* @__PURE__ */ jsx(CheckCircle, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
        isTrue ? "Yes" : "No"
      ]
    }
  );
}
function CompanyRenderer(props) {
  const { data, value } = props;
  if (!value) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const domain = props.domainField && data ? getNestedValue(data, props.domainField) : data?.company?.domain || data?.domain;
  const faviconUrl = getFaviconUrl(domain);
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-0.5", children: [
    faviconUrl ? /* @__PURE__ */ jsx(
      "img",
      {
        src: faviconUrl,
        alt: value,
        className: "h-5 w-5 rounded bg-white object-contain",
        onError: (e) => {
          const target = e.target;
          target.style.display = "none";
          const sibling = target.nextElementSibling;
          if (sibling) sibling.style.display = "flex";
        }
      }
    ) : null,
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "flex h-5 w-5 items-center justify-center rounded bg-primary-100 text-[9px] font-semibold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
        style: { display: faviconUrl ? "none" : "flex" },
        children: getInitials2(value)
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: value })
  ] });
}
function ProgressRenderer(props) {
  const { value, barColor = "bg-primary-500", max = 100 } = props;
  if (value == null) return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  const percentage = Math.min(100, Math.max(0, Number(value) / max * 100));
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-1", children: [
    /* @__PURE__ */ jsx("div", { className: "h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: cn("h-full rounded-full transition-all", barColor),
        style: { width: `${percentage}%` }
      }
    ) }),
    /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-xs font-medium", children: [
      Math.round(percentage),
      "%"
    ] })
  ] });
}
function TagsRenderer(props) {
  const { value } = props;
  if (!value || !Array.isArray(value) || value.length === 0) {
    return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "--" });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1", children: [
    value.slice(0, 3).map((tag, index) => /* @__PURE__ */ jsx(
      "span",
      {
        className: "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        children: tag
      },
      index
    )),
    value.length > 3 && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-xs", children: [
      "+",
      value.length - 3
    ] })
  ] });
}
var MemoizedAvatarNameRenderer = memo(
  AvatarNameRenderer,
  cellRendererPropsAreEqual
);
var MemoizedStatusBadgeRenderer = memo(
  StatusBadgeRenderer,
  cellRendererPropsAreEqual
);
var MemoizedEngagementScoreRenderer = memo(
  EngagementScoreRenderer,
  cellRendererPropsAreEqual
);
var MemoizedEmailRenderer = memo(
  EmailRenderer,
  cellRendererPropsAreEqual
);
var MemoizedPhoneRenderer = memo(
  PhoneRenderer,
  cellRendererPropsAreEqual
);
var MemoizedLinkedInRenderer = memo(
  LinkedInRenderer,
  cellRendererPropsAreEqual
);
var MemoizedDomainRenderer = memo(
  DomainRenderer,
  cellRendererPropsAreEqual
);
var MemoizedCurrencyRenderer = memo(
  CurrencyRenderer,
  cellRendererPropsAreEqual
);
var MemoizedNumberRenderer = memo(
  NumberRenderer,
  cellRendererPropsAreEqual
);
var MemoizedDateRenderer = memo(
  DateRenderer,
  cellRendererPropsAreEqual
);
var MemoizedBooleanRenderer = memo(
  BooleanRenderer,
  cellRendererPropsAreEqual
);
var MemoizedCompanyRenderer = memo(
  CompanyRenderer,
  cellRendererPropsAreEqual
);
var MemoizedProgressRenderer = memo(
  ProgressRenderer,
  cellRendererPropsAreEqual
);
var MemoizedTagsRenderer = memo(
  TagsRenderer,
  cellRendererPropsAreEqual
);
var CellRenderers = {
  // Original renderers
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
  // Memoized renderers (recommended for performance)
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
  // Utility functions
  formatPhoneDisplay
};
var sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7"
};
function SparklesIcon({ className, size = "md" }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      className: cn(sizeClasses[size], className),
      viewBox: "0 0 24 24",
      fill: "currentColor",
      children: [
        /* @__PURE__ */ jsx("path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M20 3v4",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M22 5h-4",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round"
          }
        )
      ]
    }
  );
}
function AILogoIcon({ className, size = "md" }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      className: cn(sizeClasses[size], className),
      viewBox: "0 0 24 24",
      fill: "none",
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M12 2L2 7L12 12L22 7L12 2Z",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            fill: "currentColor",
            fillOpacity: "0.2"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M2 17L12 22L22 17",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M2 12L12 17L22 12",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        )
      ]
    }
  );
}
function CloseIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className: cn("h-5 w-5", className),
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "2",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M6 18L18 6M6 6l12 12"
        }
      )
    }
  );
}
function RefreshIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className: cn("h-5 w-5", className),
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        }
      )
    }
  );
}
var chevronRotation = {
  up: "-rotate-180",
  down: "",
  left: "rotate-90",
  right: "-rotate-90"
};
function ChevronIcon({
  className,
  direction = "down"
}) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className: cn("h-4 w-4", chevronRotation[direction], className),
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "2",
      children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" })
    }
  );
}
function SendIcon({ className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className: cn("h-5 w-5", className),
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        }
      )
    }
  );
}
function SpinnerIcon({ className }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      className: cn("h-5 w-5 animate-spin", className),
      fill: "none",
      viewBox: "0 0 24 24",
      children: [
        /* @__PURE__ */ jsx(
          "circle",
          {
            className: "opacity-25",
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            strokeWidth: "4"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            className: "opacity-75",
            fill: "currentColor",
            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          }
        )
      ]
    }
  );
}
var statusIconVariants = cva(
  "flex h-5 w-5 items-center justify-center rounded-full",
  {
    variants: {
      status: {
        pending: "bg-neutral-200 dark:bg-neutral-700",
        running: "bg-primary-100 dark:bg-primary-900/50",
        success: "bg-green-100 dark:bg-green-900/50",
        error: "bg-red-100 dark:bg-red-900/50",
        cancelled: "bg-neutral-200 dark:bg-neutral-700"
      }
    },
    defaultVariants: {
      status: "pending"
    }
  }
);
function ToolStatusIcon({ status, className }) {
  return /* @__PURE__ */ jsxs("span", { className: cn(statusIconVariants({ status }), className), children: [
    status === "pending" && /* @__PURE__ */ jsx(
      "svg",
      {
        className: "h-3 w-3 text-neutral-500",
        fill: "currentColor",
        viewBox: "0 0 20 20",
        children: /* @__PURE__ */ jsx("circle", { cx: "10", cy: "10", r: "3" })
      }
    ),
    status === "running" && /* @__PURE__ */ jsxs(
      "svg",
      {
        className: "text-primary-600 dark:text-primary-400 h-3 w-3 animate-spin",
        fill: "none",
        viewBox: "0 0 24 24",
        children: [
          /* @__PURE__ */ jsx(
            "circle",
            {
              className: "opacity-25",
              cx: "12",
              cy: "12",
              r: "10",
              stroke: "currentColor",
              strokeWidth: "4"
            }
          ),
          /* @__PURE__ */ jsx(
            "path",
            {
              className: "opacity-75",
              fill: "currentColor",
              d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            }
          )
        ]
      }
    ),
    status === "success" && /* @__PURE__ */ jsx(
      "svg",
      {
        className: "h-3 w-3 text-green-600 dark:text-green-400",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: "3",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M5 13l4 4L19 7"
          }
        )
      }
    ),
    status === "error" && /* @__PURE__ */ jsx(
      "svg",
      {
        className: "h-3 w-3 text-red-600 dark:text-red-400",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: "3",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M6 18L18 6M6 6l12 12"
          }
        )
      }
    ),
    status === "cancelled" && /* @__PURE__ */ jsx(
      "svg",
      {
        className: "h-3 w-3 text-neutral-500",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: "3",
        children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M18 12H6" })
      }
    )
  ] });
}
var TOOL_ICONS = {
  // Patient tools
  create_patient: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
        }
      )
    }
  ),
  get_patient: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        }
      )
    }
  ),
  search_patients: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        }
      )
    }
  ),
  // Appointment tools
  schedule_appointment: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
        }
      )
    }
  ),
  // Document tools
  create_document: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        }
      )
    }
  ),
  // Default tool icon
  default: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
        }
      )
    }
  )
};
function getToolIcon(toolName) {
  return TOOL_ICONS[toolName] || TOOL_ICONS.default;
}
function ResourceLink({ link, onClick, className }) {
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(link);
    }
  };
  const linkTypeIcons = {
    patient: /* @__PURE__ */ jsx(
      "svg",
      {
        className: "h-4 w-4",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: "1.5",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          }
        )
      }
    ),
    document: /* @__PURE__ */ jsx(
      "svg",
      {
        className: "h-4 w-4",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: "1.5",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          }
        )
      }
    ),
    appointment: /* @__PURE__ */ jsx(
      "svg",
      {
        className: "h-4 w-4",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: "1.5",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          }
        )
      }
    ),
    order: /* @__PURE__ */ jsx(
      "svg",
      {
        className: "h-4 w-4",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: "1.5",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
          }
        )
      }
    ),
    external: /* @__PURE__ */ jsx(
      "svg",
      {
        className: "h-4 w-4",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: "1.5",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          }
        )
      }
    ),
    internal: /* @__PURE__ */ jsx(
      "svg",
      {
        className: "h-4 w-4",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: "1.5",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          }
        )
      }
    )
  };
  const icon = link.type ? linkTypeIcons[link.type] : linkTypeIcons.internal;
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: link.href,
      onClick: handleClick,
      className: cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5",
        "bg-primary-50 text-primary-700 hover:bg-primary-100",
        "dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50",
        "text-sm font-medium transition-colors",
        "focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 focus:outline-none",
        "dark:focus:ring-offset-neutral-900",
        className
      ),
      children: [
        icon,
        /* @__PURE__ */ jsx("span", { children: link.label }),
        link.type === "external" && /* @__PURE__ */ jsx(
          "svg",
          {
            className: "h-3 w-3 opacity-60",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            strokeWidth: "2",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                d: "M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
              }
            )
          }
        )
      ]
    }
  );
}
function ToolResultDisplay({
  result,
  onLinkClick,
  showRawData = false,
  className
}) {
  const [showJson, setShowJson] = React14.useState(false);
  if (result.type === "error") {
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "mt-2 rounded-md bg-red-50 p-3 dark:bg-red-900/20",
          className
        ),
        children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-700 dark:text-red-300", children: typeof result.data === "string" ? String(result.data) : "An error occurred" })
      }
    );
  }
  const hasRawData = result.type === "json" && result.data !== void 0 && result.data !== null;
  return /* @__PURE__ */ jsxs("div", { className: cn("space-y-2", className), children: [
    result.summary && /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-700 dark:text-neutral-300", children: result.summary }),
    result.link && /* @__PURE__ */ jsx(ResourceLink, { link: result.link, onClick: onLinkClick }),
    result.resources && result.resources.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: result.resources.map((resource) => /* @__PURE__ */ jsx(
      ResourceLink,
      {
        link: {
          href: resource.uri || "#",
          label: resource.name,
          type: resource.type
        },
        onClick: onLinkClick
      },
      resource.id
    )) }),
    hasRawData && showRawData && /* @__PURE__ */ jsxs("div", { className: "mt-2", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowJson(!showJson),
          className: "flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300",
          children: [
            /* @__PURE__ */ jsx(
              "svg",
              {
                className: cn(
                  "h-3 w-3 transition-transform",
                  showJson && "rotate-90"
                ),
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                strokeWidth: "2",
                children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    d: "M9 5l7 7-7 7"
                  }
                )
              }
            ),
            showJson ? "Hide" : "Show",
            " raw data"
          ]
        }
      ),
      showJson && /* @__PURE__ */ jsx("pre", { className: "mt-2 max-h-40 overflow-auto rounded-md bg-neutral-100 p-2 text-xs dark:bg-neutral-800", children: JSON.stringify(result.data, null, 2) })
    ] })
  ] });
}
var toolCallVariants = cva(
  ["rounded-lg border", "overflow-hidden", "transition-all duration-200"],
  {
    variants: {
      status: {
        pending: "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50",
        running: "border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/20",
        success: "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20",
        error: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20",
        cancelled: "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50 opacity-60"
      },
      compact: {
        true: "p-2",
        false: "p-3"
      }
    },
    defaultVariants: {
      status: "pending",
      compact: false
    }
  }
);
var TOOL_FRIENDLY_NAMES = {
  create_patient: "Creating patient",
  get_patient: "Looking up patient",
  search_patients: "Searching patients",
  update_patient: "Updating patient",
  delete_patient: "Removing patient",
  schedule_appointment: "Scheduling appointment",
  cancel_appointment: "Canceling appointment",
  update_appointment: "Updating appointment",
  create_document: "Creating document",
  upload_document: "Uploading document",
  get_document: "Retrieving document",
  search_documents: "Searching documents",
  create_order: "Creating order",
  send_message: "Sending message",
  search: "Searching"
};
function getToolFriendlyName(toolName, status) {
  const baseName = TOOL_FRIENDLY_NAMES[toolName] || toolName.replace(/_/g, " ");
  if (status === "success") {
    if (baseName.startsWith("Creating"))
      return baseName.replace("Creating", "Created");
    if (baseName.startsWith("Scheduling"))
      return baseName.replace("Scheduling", "Scheduled");
    if (baseName.startsWith("Searching"))
      return baseName.replace("Searching", "Searched");
    if (baseName.startsWith("Looking"))
      return baseName.replace("Looking", "Found");
    if (baseName.startsWith("Updating"))
      return baseName.replace("Updating", "Updated");
    if (baseName.startsWith("Removing"))
      return baseName.replace("Removing", "Removed");
    if (baseName.startsWith("Canceling"))
      return baseName.replace("Canceling", "Canceled");
    if (baseName.startsWith("Retrieving"))
      return baseName.replace("Retrieving", "Retrieved");
    if (baseName.startsWith("Uploading"))
      return baseName.replace("Uploading", "Uploaded");
    if (baseName.startsWith("Sending"))
      return baseName.replace("Sending", "Sent");
  }
  return baseName;
}
function getParameterSummary(toolName, params) {
  const paramMap = Object.fromEntries(params.map((p) => [p.name, p.value]));
  if (toolName === "create_patient" && paramMap.firstName && paramMap.lastName) {
    return `${paramMap.firstName} ${paramMap.lastName}`;
  }
  if (toolName.includes("search") && paramMap.query) {
    return `"${paramMap.query}"`;
  }
  if (toolName.includes("appointment") && paramMap.patientName) {
    const date = paramMap.preferredDate || paramMap.date;
    return date ? `${paramMap.patientName} on ${date}` : String(paramMap.patientName);
  }
  return null;
}
function MCPToolCallDisplay({
  toolCall,
  showParameters = true,
  collapsible = true,
  defaultCollapsed = true,
  compact,
  onLinkClick,
  className
}) {
  const [showDetails, setShowDetails] = React14.useState(!defaultCollapsed);
  const formatDuration2 = (ms) => {
    if (!ms) return null;
    if (ms < 1e3) return `${ms}ms`;
    return `${(ms / 1e3).toFixed(1)}s`;
  };
  const friendlyName = getToolFriendlyName(toolCall.toolName, toolCall.status);
  const paramSummary = getParameterSummary(
    toolCall.toolName,
    toolCall.parameters
  );
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        toolCallVariants({ status: toolCall.status, compact }),
        className
      ),
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/50 text-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-400", children: getToolIcon(toolCall.toolName) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-neutral-900 dark:text-white", children: friendlyName }),
            /* @__PURE__ */ jsx(ToolStatusIcon, { status: toolCall.status }),
            toolCall.duration && /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-400", children: formatDuration2(toolCall.duration) })
          ] }),
          paramSummary && toolCall.status !== "success" && /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-sm text-neutral-600 dark:text-neutral-400", children: paramSummary }),
          toolCall.result && /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
            ToolResultDisplay,
            {
              result: toolCall.result,
              onLinkClick,
              showRawData: showDetails
            }
          ) }),
          toolCall.error && /* @__PURE__ */ jsx("div", { className: "mt-2 rounded-md bg-red-100 p-2 dark:bg-red-900/30", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-700 dark:text-red-300", children: toolCall.error }) }),
          collapsible && showParameters && toolCall.parameters.length > 0 && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowDetails(!showDetails),
              className: "mt-2 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300",
              children: [
                /* @__PURE__ */ jsx(
                  "svg",
                  {
                    className: cn(
                      "h-3 w-3 transition-transform",
                      showDetails && "rotate-90"
                    ),
                    fill: "none",
                    viewBox: "0 0 24 24",
                    stroke: "currentColor",
                    strokeWidth: "2",
                    children: /* @__PURE__ */ jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        d: "M9 5l7 7-7 7"
                      }
                    )
                  }
                ),
                showDetails ? "Hide" : "Show",
                " details"
              ]
            }
          ),
          showDetails && showParameters && toolCall.parameters.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-md bg-neutral-100 p-2 dark:bg-neutral-800", children: [
            /* @__PURE__ */ jsx("h4", { className: "mb-1.5 text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400", children: "Parameters" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: toolCall.parameters.map((param) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex items-start gap-2 text-xs",
                children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-mono text-neutral-500 dark:text-neutral-500", children: [
                    param.name,
                    ":"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-neutral-700 dark:text-neutral-300", children: typeof param.value === "string" ? param.value : JSON.stringify(param.value) })
                ]
              },
              param.name
            )) })
          ] })
        ] })
      ] })
    }
  );
}
var avatarVariants2 = cva(
  "flex shrink-0 items-center justify-center rounded-full",
  {
    variants: {
      role: {
        user: "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300",
        assistant: "bg-primary-500 text-white dark:bg-primary-600",
        system: "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400",
        tool: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
      },
      size: {
        sm: "h-6 w-6 text-xs",
        md: "h-8 w-8 text-sm",
        lg: "h-10 w-10 text-base"
      }
    },
    defaultVariants: {
      role: "user",
      size: "md"
    }
  }
);
function MessageAvatar({
  role,
  size,
  userName,
  className
}) {
  const getInitials3 = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };
  return /* @__PURE__ */ jsx("div", { className: cn(avatarVariants2({ role, size }), className), children: role === "assistant" ? /* @__PURE__ */ jsx(SparklesIcon, { size: "md" }) : role === "user" ? /* @__PURE__ */ jsx("span", { className: "font-medium", children: getInitials3(userName) }) : role === "system" ? /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        }
      )
    }
  ) : /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
        }
      )
    }
  ) });
}
function AITypingIndicator({ className }) {
  const dotStyle = {
    width: "6px",
    height: "6px",
    minWidth: "6px",
    minHeight: "6px",
    flexShrink: 0
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("inline-flex items-center justify-center gap-2", className),
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "rounded-full bg-neutral-500 dark:bg-neutral-400",
            style: {
              ...dotStyle,
              animation: "typing-dot 1.4s infinite ease-in-out both",
              animationDelay: "-0.32s"
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "rounded-full bg-neutral-500 dark:bg-neutral-400",
            style: {
              ...dotStyle,
              animation: "typing-dot 1.4s infinite ease-in-out both",
              animationDelay: "-0.16s"
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "rounded-full bg-neutral-500 dark:bg-neutral-400",
            style: {
              ...dotStyle,
              animation: "typing-dot 1.4s infinite ease-in-out both"
            }
          }
        ),
        /* @__PURE__ */ jsx("style", { children: `
        @keyframes typing-dot {
          0%, 80%, 100% { opacity: 0.4; }
          40% { opacity: 1; }
        }
      ` })
      ]
    }
  );
}
function ContentBlock({ content, onLinkClick }) {
  const [isCollapsed, setIsCollapsed] = React14.useState(
    content.collapsed ?? false
  );
  if (content.type === "text" && content.text) {
    return /* @__PURE__ */ jsx("div", { className: "prose prose-sm dark:prose-invert max-w-none", children: /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap", children: content.text }) });
  }
  if (content.type === "tool_use" && content.toolCall) {
    return /* @__PURE__ */ jsx(
      MCPToolCallDisplay,
      {
        toolCall: content.toolCall,
        onLinkClick,
        defaultCollapsed: content.collapsed
      }
    );
  }
  if (content.type === "thinking" && content.text) {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setIsCollapsed(!isCollapsed),
          className: "flex w-full items-center justify-between px-3 py-2 text-left",
          children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400", children: [
              /* @__PURE__ */ jsx(
                "svg",
                {
                  className: "h-4 w-4",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  strokeWidth: "1.5",
                  children: /* @__PURE__ */ jsx(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    }
                  )
                }
              ),
              "Thinking..."
            ] }),
            /* @__PURE__ */ jsx(
              ChevronIcon,
              {
                direction: isCollapsed ? "right" : "down",
                className: "text-neutral-400"
              }
            )
          ]
        }
      ),
      !isCollapsed && /* @__PURE__ */ jsx("div", { className: "border-t border-neutral-200 px-3 py-2 dark:border-neutral-700", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-600 italic dark:text-neutral-400", children: content.text }) })
    ] });
  }
  if (content.type === "code" && content.text) {
    return /* @__PURE__ */ jsx("pre", { className: "rounded-lg bg-neutral-900 p-3 text-sm dark:bg-neutral-950", children: /* @__PURE__ */ jsx(
      "code",
      {
        className: content.language ? `language-${content.language}` : "",
        children: content.text
      }
    ) });
  }
  return null;
}
var messageVariants = cva("flex gap-3", {
  variants: {
    role: {
      user: "flex-row-reverse",
      assistant: "flex-row",
      system: "flex-row justify-center",
      tool: "flex-row"
    }
  },
  defaultVariants: {
    role: "assistant"
  }
});
var bubbleVariants = cva("rounded-2xl px-4 py-2.5 w-fit max-w-[85%]", {
  variants: {
    role: {
      user: "bg-primary-600 text-white dark:bg-primary-500",
      assistant: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white",
      system: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-center text-sm max-w-[95%]",
      tool: "bg-transparent p-0 max-w-full w-full"
    }
  },
  defaultVariants: {
    role: "assistant"
  }
});
function AIMessageDisplay({
  message,
  userName,
  showAvatar = true,
  showTimestamp = false,
  onLinkClick,
  className
}) {
  const isStreaming = message.status === "streaming";
  const hasContent = message.content.length > 0;
  const formatTime3 = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(void 0, {
      hour: "numeric",
      minute: "2-digit"
    });
  };
  if (message.role === "tool") {
    return /* @__PURE__ */ jsxs("div", { className: cn(messageVariants({ role: message.role }), className), children: [
      showAvatar && /* @__PURE__ */ jsx(MessageAvatar, { role: message.role }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 space-y-2", children: message.content.map((content, index) => /* @__PURE__ */ jsx(
        ContentBlock,
        {
          content,
          onLinkClick
        },
        index
      )) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: cn(messageVariants({ role: message.role }), className), children: [
    showAvatar && message.role !== "system" && /* @__PURE__ */ jsx(MessageAvatar, { role: message.role, userName }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
          "flex flex-col gap-1",
          message.role === "user" && "items-end"
        ),
        children: [
          /* @__PURE__ */ jsx("div", { className: bubbleVariants({ role: message.role }), children: hasContent ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: message.content.map((content, index) => /* @__PURE__ */ jsx(
            ContentBlock,
            {
              content,
              onLinkClick
            },
            index
          )) }) : isStreaming ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx(AITypingIndicator, {}) }) : null }),
          showTimestamp && /* @__PURE__ */ jsx("span", { className: "px-2 text-xs text-neutral-500", children: formatTime3(message.timestamp) }),
          message.status === "error" && /* @__PURE__ */ jsx("span", { className: "px-2 text-xs text-red-500", children: "Failed to send" })
        ]
      }
    )
  ] });
}
function getFileType(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) {
    return "document";
  }
  return "file";
}
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function validateFile(file, acceptedTypes, maxSize) {
  if (acceptedTypes && acceptedTypes.length > 0) {
    const isAccepted = acceptedTypes.some((type) => {
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.replace("/*", "/"));
      }
      return file.type === type;
    });
    if (!isAccepted) {
      return { valid: false, error: "File type not supported" };
    }
  }
  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File too large (max ${formatFileSize(maxSize)})`
    };
  }
  return { valid: true };
}
function generateAttachmentId() {
  return `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function AttachmentPreviewItem({
  attachment,
  onRemove,
  onRetry,
  className
}) {
  const { file, previewUrl, type, state, progress } = attachment;
  const isImage = type === "image";
  const isVideo = type === "video";
  const isUploading = state === "uploading";
  const isFailed = state === "failed";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "group relative overflow-hidden rounded-lg",
        "bg-neutral-100 dark:bg-neutral-800",
        "border border-neutral-200 dark:border-neutral-700",
        isFailed && "border-red-500",
        className
      ),
      children: [
        (isImage || isVideo) && previewUrl ? /* @__PURE__ */ jsxs("div", { className: "relative h-20 w-20", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: previewUrl,
              alt: file.name,
              className: cn(
                "h-full w-full object-cover",
                (isUploading || isFailed) && "opacity-50"
              )
            }
          ),
          isVideo && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx(
            "svg",
            {
              className: "h-6 w-6 text-white drop-shadow",
              fill: "currentColor",
              viewBox: "0 0 24 24",
              children: /* @__PURE__ */ jsx("path", { d: "M8 5v14l11-7z" })
            }
          ) })
        ] }) : (
          /* File preview */
          /* @__PURE__ */ jsxs("div", { className: "flex h-20 w-20 flex-col items-center justify-center p-2", children: [
            /* @__PURE__ */ jsx(
              "svg",
              {
                className: "h-8 w-8 text-neutral-400",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "mt-1 max-w-full truncate px-1 text-xs text-neutral-500", children: file.name.split(".").pop()?.toUpperCase() })
          ] })
        ),
        isUploading && progress !== void 0 && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "text-center text-white", children: [
          /* @__PURE__ */ jsxs(
            "svg",
            {
              className: "mx-auto h-6 w-6 animate-spin",
              fill: "none",
              viewBox: "0 0 24 24",
              children: [
                /* @__PURE__ */ jsx(
                  "circle",
                  {
                    className: "opacity-25",
                    cx: "12",
                    cy: "12",
                    r: "10",
                    stroke: "currentColor",
                    strokeWidth: "4"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    className: "opacity-75",
                    fill: "currentColor",
                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "mt-1 text-xs", children: [
            progress,
            "%"
          ] })
        ] }) }),
        isFailed && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx(
            "svg",
            {
              className: "mx-auto h-6 w-6 text-red-400",
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              children: /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                }
              )
            }
          ),
          onRetry && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onRetry,
              className: "mt-1 text-xs text-white underline hover:no-underline",
              children: "Retry"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onRemove,
            className: cn(
              "absolute -top-1 -right-1 z-10",
              "rounded-full p-1",
              "bg-neutral-900 text-white",
              "opacity-0 group-hover:opacity-100",
              "focus:ring-primary-500 focus:opacity-100 focus:ring-2 focus:outline-none",
              "transition-opacity"
            ),
            "aria-label": `Remove ${file.name}`,
            children: /* @__PURE__ */ jsx(
              "svg",
              {
                className: "h-3 w-3",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M6 18L18 6M6 6l12 12"
                  }
                )
              }
            )
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "absolute right-0 bottom-0 left-0",
              "bg-black/70 px-1 py-0.5",
              "opacity-0 group-hover:opacity-100",
              "transition-opacity"
            ),
            children: /* @__PURE__ */ jsx("p", { className: "truncate text-xs text-white", children: file.name })
          }
        )
      ]
    }
  );
}
AttachmentPreviewItem.displayName = "AttachmentPreviewItem";
var AttachmentPicker = React14.forwardRef(
  ({
    onFilesSelected,
    acceptedTypes = ["image/*", "video/*", ".pdf", ".doc", ".docx"],
    maxFileSize = 25 * 1024 * 1024,
    // 25MB
    maxFiles = 10,
    multiple = true,
    disabled = false,
    onError,
    className,
    children
  }, ref) => {
    const inputRef = React14.useRef(null);
    React14.useImperativeHandle(ref, () => inputRef.current);
    const handleClick = () => {
      inputRef.current?.click();
    };
    const handleChange = (event) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      const validFiles = [];
      for (const file of files.slice(0, maxFiles)) {
        const validation = validateFile(file, acceptedTypes, maxFileSize);
        if (validation.valid) {
          validFiles.push(file);
        } else if (onError) {
          onError(`${file.name}: ${validation.error}`);
        }
      }
      if (files.length > maxFiles && onError) {
        onError(`Maximum ${maxFiles} files allowed`);
      }
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
      event.target.value = "";
    };
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: inputRef,
          type: "file",
          accept: acceptedTypes.join(","),
          multiple,
          onChange: handleChange,
          disabled,
          className: "sr-only",
          "aria-label": "Select files to attach"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleClick,
          disabled,
          className: cn(
            "inline-flex items-center justify-center",
            "rounded-full p-2",
            "text-neutral-500 hover:text-neutral-700",
            "dark:text-neutral-400 dark:hover:text-neutral-200",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800",
            "focus:ring-primary-500 focus:ring-2 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors",
            className
          ),
          "aria-label": "Attach files",
          children: children || /* @__PURE__ */ jsx(
            "svg",
            {
              className: "h-5 w-5",
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              children: /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                }
              )
            }
          )
        }
      )
    ] });
  }
);
AttachmentPicker.displayName = "AttachmentPicker";
function DragDropZone({
  onFilesDropped,
  acceptedTypes,
  maxFileSize,
  maxFiles = 10,
  disabled = false,
  onError,
  children,
  className
}) {
  const [isDragging, setIsDragging] = React14.useState(false);
  const dragCounterRef = React14.useRef(0);
  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    dragCounterRef.current++;
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };
  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragging(false);
    dragCounterRef.current = 0;
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;
    const validFiles = [];
    for (const file of files.slice(0, maxFiles)) {
      const validation = validateFile(file, acceptedTypes, maxFileSize);
      if (validation.valid) {
        validFiles.push(file);
      } else if (onError) {
        onError(`${file.name}: ${validation.error}`);
      }
    }
    if (files.length > maxFiles && onError) {
      onError(`Maximum ${maxFiles} files allowed`);
    }
    if (validFiles.length > 0) {
      onFilesDropped(validFiles);
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      className: cn("relative", className),
      children: [
        children,
        isDragging && /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "absolute inset-0 z-50",
              "flex items-center justify-center",
              "bg-primary-50/90 dark:bg-primary-900/90",
              "border-primary-500 border-2 border-dashed",
              "rounded-lg"
            ),
            children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx(
                "svg",
                {
                  className: "text-primary-500 mx-auto h-12 w-12",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  children: /* @__PURE__ */ jsx(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: 2,
                      d: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-primary-700 dark:text-primary-300 mt-2 text-sm font-medium", children: "Drop files here" })
            ] })
          }
        )
      ]
    }
  );
}
DragDropZone.displayName = "DragDropZone";
function CameraButton({
  onCapture,
  useFrontCamera = false,
  disabled = false,
  className
}) {
  const inputRef = React14.useRef(null);
  const handleClick = () => {
    inputRef.current?.click();
  };
  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onCapture(file);
    }
    event.target.value = "";
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept: "image/*",
        capture: useFrontCamera ? "user" : "environment",
        onChange: handleChange,
        disabled,
        className: "sr-only",
        "aria-label": "Take a photo"
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: handleClick,
        disabled,
        className: cn(
          "inline-flex items-center justify-center",
          "rounded-full p-2",
          "text-neutral-500 hover:text-neutral-700",
          "dark:text-neutral-400 dark:hover:text-neutral-200",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
          "focus:ring-primary-500 focus:ring-2 focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          className
        ),
        "aria-label": "Take a photo",
        children: /* @__PURE__ */ jsxs(
          "svg",
          {
            className: "h-5 w-5",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: [
              /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                }
              ),
              /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                }
              )
            ]
          }
        )
      }
    )
  ] });
}
CameraButton.displayName = "CameraButton";
function CharacterCounter({
  current,
  max,
  showWarningAt = 0.9,
  className
}) {
  const percentage = current / max;
  const isWarning = percentage >= showWarningAt && percentage < 1;
  const isOver = current > max;
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: cn(
        "text-xs tabular-nums",
        isOver ? "font-medium text-red-500" : isWarning ? "text-amber-500" : "text-neutral-400",
        className
      ),
      "aria-live": "polite",
      "aria-label": `${current} of ${max} characters`,
      children: [
        current,
        "/",
        max
      ]
    }
  );
}
CharacterCounter.displayName = "CharacterCounter";
var sendButtonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "rounded-full p-3 self-start",
    "transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-primary-500",
    "disabled:opacity-50 disabled:cursor-not-allowed"
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-primary-800 text-white",
          "hover:bg-primary-700",
          "active:scale-95"
        ],
        subtle: [
          "bg-transparent text-primary-600",
          "hover:bg-primary-50 dark:hover:bg-primary-900/20"
        ]
      },
      canSend: {
        true: "",
        false: "opacity-50 cursor-not-allowed"
      }
    },
    defaultVariants: {
      variant: "primary",
      canSend: false
    }
  }
);
var SendButton = React14.forwardRef(
  ({ className, variant, canSend, isLoading, disabled, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "button",
      {
        ref,
        type: "submit",
        disabled: disabled || !canSend || isLoading,
        className: cn(sendButtonVariants({ variant, canSend }), className),
        "aria-label": isLoading ? "Sending message" : "Send message",
        ...props,
        children: isLoading ? /* @__PURE__ */ jsxs("svg", { className: "h-5 w-5 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
          /* @__PURE__ */ jsx(
            "circle",
            {
              className: "opacity-25",
              cx: "12",
              cy: "12",
              r: "10",
              stroke: "currentColor",
              strokeWidth: "4"
            }
          ),
          /* @__PURE__ */ jsx(
            "path",
            {
              className: "opacity-75",
              fill: "currentColor",
              d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            }
          )
        ] }) : /* @__PURE__ */ jsx(
          "svg",
          {
            className: "h-5 w-5",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              }
            )
          }
        )
      }
    );
  }
);
SendButton.displayName = "SendButton";
var MessageComposer = React14.forwardRef(
  ({
    onSend,
    onTypingStart,
    onTypingStop,
    placeholder = "Type a message...",
    maxLength = 1600,
    showCharacterCount = false,
    disabled = false,
    isSending = false,
    showAttachmentPicker = true,
    showCameraButton = false,
    acceptedFileTypes = ["image/*", "video/*", ".pdf", ".doc", ".docx"],
    maxFileSize = 25 * 1024 * 1024,
    maxAttachments = 10,
    onError,
    autoFocus = false,
    replyTo = null,
    onCancelReply,
    variant = "default",
    className
  }, ref) => {
    const textareaRef = React14.useRef(null);
    const [content, setContent] = React14.useState("");
    const [attachments, setAttachments] = React14.useState(
      []
    );
    const [isTyping, setIsTyping] = React14.useState(false);
    const typingTimeoutRef = React14.useRef(null);
    React14.useImperativeHandle(ref, () => textareaRef.current);
    React14.useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
      }
    }, [content]);
    React14.useEffect(() => {
      if (content.length > 0 && !isTyping) {
        setIsTyping(true);
        onTypingStart?.();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          onTypingStop?.();
        }
      }, 2e3);
      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }, [content, isTyping, onTypingStart, onTypingStop]);
    React14.useEffect(() => {
      if (autoFocus) {
        textareaRef.current?.focus();
      }
    }, [autoFocus]);
    React14.useEffect(() => {
      if (replyTo) {
        textareaRef.current?.focus();
      }
    }, [replyTo]);
    const canSend = (content.trim().length > 0 || attachments.length > 0) && content.length <= maxLength && !disabled && !isSending;
    const handleSubmit = async (event) => {
      event.preventDefault();
      if (!canSend) return;
      const message = {
        content: content.trim(),
        attachments: attachments.map((a) => a.file),
        replyToId: replyTo?.id
      };
      setContent("");
      setAttachments([]);
      setIsTyping(false);
      onTypingStop?.();
      try {
        await onSend(message);
      } catch {
        setContent(message.content);
        onError?.("Failed to send message");
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (canSend) {
          handleSubmit(event);
        }
      }
    };
    const handleFilesSelected = (files) => {
      const remainingSlots = maxAttachments - attachments.length;
      const filesToAdd = files.slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        onError?.(`Maximum ${maxAttachments} attachments allowed`);
      }
      const newAttachments = filesToAdd.map((file) => {
        const type = getFileType(file.type);
        let previewUrl;
        if (type === "image" || type === "video") {
          previewUrl = URL.createObjectURL(file);
        }
        return {
          id: generateAttachmentId(),
          file,
          previewUrl,
          type,
          state: "pending"
        };
      });
      setAttachments((prev) => [...prev, ...newAttachments]);
    };
    const handleRemoveAttachment = (attachmentId) => {
      setAttachments((prev) => {
        const attachment = prev.find((a) => a.id === attachmentId);
        if (attachment?.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
        return prev.filter((a) => a.id !== attachmentId);
      });
    };
    React14.useEffect(() => {
      const currentAttachments = attachments;
      return () => {
        currentAttachments.forEach((a) => {
          if (a.previewUrl) {
            URL.revokeObjectURL(a.previewUrl);
          }
        });
      };
    }, [attachments]);
    return /* @__PURE__ */ jsx(
      DragDropZone,
      {
        onFilesDropped: handleFilesSelected,
        acceptedTypes: acceptedFileTypes,
        maxFileSize,
        maxFiles: maxAttachments - attachments.length,
        disabled: disabled || attachments.length >= maxAttachments,
        onError,
        className: cn("w-full", className),
        children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "w-full", children: [
          replyTo && /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "flex items-center gap-2 px-4 py-2",
                "bg-neutral-50 dark:bg-neutral-800/50",
                "border-primary-500 border-l-4"
              ),
              children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-primary-600 dark:text-primary-400 text-xs font-medium", children: [
                    "Replying to ",
                    replyTo.senderName
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "truncate text-sm text-neutral-600 dark:text-neutral-300", children: replyTo.content })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: onCancelReply,
                    className: cn(
                      "shrink-0 rounded p-1",
                      "text-neutral-400 hover:text-neutral-600",
                      "dark:text-neutral-500 dark:hover:text-neutral-300",
                      "focus:ring-primary-500 focus:ring-2 focus:outline-none"
                    ),
                    "aria-label": "Cancel reply",
                    children: /* @__PURE__ */ jsx(
                      "svg",
                      {
                        className: "h-4 w-4",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor",
                        children: /* @__PURE__ */ jsx(
                          "path",
                          {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M6 18L18 6M6 6l12 12"
                          }
                        )
                      }
                    )
                  }
                )
              ]
            }
          ),
          attachments.length > 0 && /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "flex flex-wrap gap-2 p-3",
                "border-t border-neutral-200 dark:border-neutral-700"
              ),
              children: attachments.map((attachment) => /* @__PURE__ */ jsx(
                AttachmentPreviewItem,
                {
                  attachment,
                  onRemove: () => handleRemoveAttachment(attachment.id)
                },
                attachment.id
              ))
            }
          ),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "flex items-center gap-2 p-3",
                "bg-white dark:bg-neutral-900",
                variant === "default" && "border-t border-neutral-200 dark:border-neutral-700"
              ),
              children: [
                showAttachmentPicker && /* @__PURE__ */ jsx(
                  AttachmentPicker,
                  {
                    onFilesSelected: handleFilesSelected,
                    acceptedTypes: acceptedFileTypes,
                    maxFileSize,
                    maxFiles: maxAttachments - attachments.length,
                    disabled: disabled || attachments.length >= maxAttachments,
                    onError
                  }
                ),
                showCameraButton && /* @__PURE__ */ jsx(
                  CameraButton,
                  {
                    onCapture: (file) => handleFilesSelected([file]),
                    disabled: disabled || attachments.length >= maxAttachments
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                  /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      ref: textareaRef,
                      value: content,
                      onChange: (e) => setContent(e.target.value),
                      onKeyDown: handleKeyDown,
                      placeholder,
                      disabled: disabled || isSending,
                      rows: 1,
                      className: cn(
                        "w-full resize-none rounded-2xl px-4 py-2.5",
                        "bg-neutral-100 dark:bg-neutral-800",
                        "text-neutral-900 dark:text-neutral-100",
                        "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                        "focus:ring-primary-500 focus:ring-2 focus:outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "transition-colors",
                        "max-h-[150px]"
                      ),
                      "aria-label": "Message",
                      "aria-describedby": showCharacterCount ? "char-count" : void 0
                    }
                  ),
                  showCharacterCount && /* @__PURE__ */ jsx("div", { id: "char-count", className: "absolute right-3 bottom-1.5", children: /* @__PURE__ */ jsx(CharacterCounter, { current: content.length, max: maxLength }) })
                ] }),
                /* @__PURE__ */ jsx(
                  SendButton,
                  {
                    canSend,
                    isLoading: isSending,
                    disabled
                  }
                )
              ]
            }
          )
        ] })
      }
    );
  }
);
MessageComposer.displayName = "MessageComposer";
var statusIconVariants2 = cva(
  "inline-flex items-center gap-0.5 text-current",
  {
    variants: {
      status: {
        sending: "text-neutral-400",
        sent: "text-neutral-500",
        delivered: "text-neutral-600 dark:text-neutral-400",
        read: "text-primary-600 dark:text-primary-400",
        failed: "text-red-500"
      }
    },
    defaultVariants: {
      status: "sent"
    }
  }
);
function MessageStatusIcon({ status, className }) {
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: cn(statusIconVariants2({ status }), className),
      role: "img",
      "aria-label": `Message ${status}`,
      children: [
        status === "sending" && /* @__PURE__ */ jsxs(
          "svg",
          {
            className: "h-3.5 w-3.5 animate-spin",
            fill: "none",
            viewBox: "0 0 24 24",
            children: [
              /* @__PURE__ */ jsx(
                "circle",
                {
                  className: "opacity-25",
                  cx: "12",
                  cy: "12",
                  r: "10",
                  stroke: "currentColor",
                  strokeWidth: "4"
                }
              ),
              /* @__PURE__ */ jsx(
                "path",
                {
                  className: "opacity-75",
                  fill: "currentColor",
                  d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                }
              )
            ]
          }
        ),
        status === "sent" && /* @__PURE__ */ jsx(
          "svg",
          {
            className: "h-3.5 w-3.5",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            strokeWidth: "2",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                d: "M5 13l4 4L19 7"
              }
            )
          }
        ),
        (status === "delivered" || status === "read") && /* @__PURE__ */ jsxs(
          "svg",
          {
            className: "h-4 w-4",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            strokeWidth: "2",
            children: [
              /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M5 13l4 4L19 7"
                }
              ),
              /* @__PURE__ */ jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 13l4 4L26 7",
                  transform: "translate(-5, 0)"
                }
              )
            ]
          }
        ),
        status === "failed" && /* @__PURE__ */ jsx(
          "svg",
          {
            className: "h-3.5 w-3.5",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            strokeWidth: "2",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              }
            )
          }
        )
      ]
    }
  );
}
function ReadReceiptIndicator({
  receipts,
  maxAvatars = 3,
  size = "xs",
  className
}) {
  if (receipts.length === 0) return null;
  const visibleReceipts = receipts.slice(0, maxAvatars);
  const remainingCount = receipts.length - maxAvatars;
  const sizeClasses2 = {
    xs: "h-4 w-4 text-[8px]",
    sm: "h-5 w-5 text-[10px]"
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("flex items-center -space-x-1", className),
      "aria-label": `Read by ${receipts.map((r) => r.participant.name).join(", ")}`,
      children: [
        visibleReceipts.map((receipt) => /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "rounded-full ring-2 ring-white dark:ring-neutral-900",
              "bg-primary-800 font-medium text-white",
              "flex items-center justify-center",
              sizeClasses2[size]
            ),
            title: `Read by ${receipt.participant.name}`,
            children: receipt.participant.avatarUrl ? /* @__PURE__ */ jsx(
              "img",
              {
                src: receipt.participant.avatarUrl,
                alt: receipt.participant.name,
                className: "h-full w-full rounded-full object-cover"
              }
            ) : receipt.participant.name.charAt(0).toUpperCase()
          },
          receipt.participant.id
        )),
        remainingCount > 0 && /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "rounded-full ring-2 ring-white dark:ring-neutral-900",
              "bg-neutral-500 font-medium text-white",
              "flex items-center justify-center",
              sizeClasses2[size]
            ),
            children: [
              "+",
              remainingCount
            ]
          }
        )
      ]
    }
  );
}
function AttachmentPreview({
  attachment,
  onClick,
  className
}) {
  const isImage = attachment.type === "image";
  const isVideo = attachment.type === "video";
  if (isImage || isVideo) {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick,
        className: cn(
          "relative block overflow-hidden rounded-lg",
          "focus:ring-primary-500 focus:ring-2 focus:outline-none",
          "transition-transform hover:scale-[1.02]",
          className
        ),
        "aria-label": `View ${attachment.alt || attachment.filename}`,
        children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: attachment.thumbnailUrl || attachment.url,
              alt: attachment.alt || attachment.filename,
              className: "max-h-64 w-auto rounded-lg object-cover",
              loading: "lazy"
            }
          ),
          isVideo && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/30", children: /* @__PURE__ */ jsx("div", { className: "rounded-full bg-white/90 p-3", children: /* @__PURE__ */ jsx(
            "svg",
            {
              className: "h-6 w-6 text-neutral-900",
              fill: "currentColor",
              viewBox: "0 0 24 24",
              children: /* @__PURE__ */ jsx("path", { d: "M8 5v14l11-7z" })
            }
          ) }) }),
          attachment.state === "uploading" && attachment.progress !== void 0 && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "text-center text-white", children: [
            /* @__PURE__ */ jsxs(
              "svg",
              {
                className: "mx-auto h-8 w-8 animate-spin",
                fill: "none",
                viewBox: "0 0 24 24",
                children: [
                  /* @__PURE__ */ jsx(
                    "circle",
                    {
                      className: "opacity-25",
                      cx: "12",
                      cy: "12",
                      r: "10",
                      stroke: "currentColor",
                      strokeWidth: "4"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      className: "opacity-75",
                      fill: "currentColor",
                      d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "mt-1 text-sm", children: [
              attachment.progress,
              "%"
            ] })
          ] }) }),
          attachment.state === "failed" && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "text-center text-white", children: [
            /* @__PURE__ */ jsx(
              "svg",
              {
                className: "mx-auto h-8 w-8 text-red-400",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "mt-1 text-sm", children: "Upload failed" })
          ] }) })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      className: cn(
        "flex items-center gap-3 rounded-lg p-3",
        "bg-white/10 hover:bg-white/20",
        "transition-colors",
        "focus:ring-primary-500 focus:ring-2 focus:outline-none",
        className
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white/20 p-2", children: /* @__PURE__ */ jsx(
          "svg",
          {
            className: "h-6 w-6",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 text-left", children: [
          /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium", children: attachment.filename }),
          /* @__PURE__ */ jsx("p", { className: "text-xs opacity-70", children: formatFileSize2(attachment.size) })
        ] })
      ]
    }
  );
}
function formatFileSize2(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
var bubbleVariants2 = cva(
  [
    "relative max-w-[85%] sm:max-w-[70%]",
    "rounded-2xl px-4 py-2",
    "transition-all duration-200"
  ],
  {
    variants: {
      variant: {
        outgoing: ["bg-primary-800 text-white", "rounded-br-md", "ml-auto"],
        incoming: [
          "bg-neutral-100 text-neutral-900",
          "dark:bg-neutral-800 dark:text-neutral-100",
          "rounded-bl-md",
          "mr-auto"
        ],
        system: [
          "mx-auto max-w-none",
          "bg-transparent text-neutral-500 dark:text-neutral-400",
          "text-center text-sm",
          "py-1 px-2"
        ]
      },
      status: {
        sending: "opacity-70",
        sent: "",
        delivered: "",
        read: "",
        failed: "ring-2 ring-red-500/50"
      }
    },
    defaultVariants: {
      variant: "incoming",
      status: "sent"
    }
  }
);
function defaultFormatTimestamp(timestamp) {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return date.toLocaleTimeString(void 0, {
    hour: "numeric",
    minute: "2-digit"
  });
}
var MessageBubble = React14.forwardRef(
  ({
    className,
    message,
    showAvatar = false,
    showSenderName = false,
    showTimestamp = true,
    showStatus = true,
    showReadReceipts = true,
    onRetry,
    onAttachmentClick,
    isOutgoing,
    formatTimestamp = defaultFormatTimestamp,
    ...props
  }, ref) => {
    const isSystem = message.type === "system";
    const variant = isSystem ? "system" : isOutgoing ? "outgoing" : "incoming";
    const hasAttachments = message.attachments && message.attachments.length > 0;
    const hasText = message.content && message.content.trim().length > 0;
    const isFailed = message.status === "failed";
    if (isSystem) {
      return /* @__PURE__ */ jsx(
        "div",
        {
          ref,
          className: cn(bubbleVariants2({ variant: "system" }), className),
          role: "status",
          "aria-live": "polite",
          ...props,
          children: message.content
        }
      );
    }
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        className: cn(
          "group flex items-end gap-2",
          isOutgoing ? "flex-row-reverse" : "flex-row",
          className
        ),
        ...props,
        children: [
          showAvatar && !isOutgoing && /* @__PURE__ */ jsx("div", { className: "mb-1 shrink-0", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                "bg-primary-800 text-sm font-medium text-white"
              ),
              children: message.sender.avatarUrl ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: message.sender.avatarUrl,
                  alt: message.sender.name,
                  className: "h-full w-full rounded-full object-cover"
                }
              ) : message.sender.name.charAt(0).toUpperCase()
            }
          ) }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "flex flex-col",
                isOutgoing ? "items-end" : "items-start"
              ),
              children: [
                showSenderName && !isOutgoing && /* @__PURE__ */ jsx("span", { className: "mb-1 px-1 text-xs font-medium text-neutral-500 dark:text-neutral-400", children: message.sender.name }),
                message.replyTo && /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: cn(
                      "mb-1 max-w-full rounded-lg px-3 py-1.5 text-xs",
                      isOutgoing ? "bg-primary-700/50 text-white/80" : "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                    ),
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "font-medium", children: message.replyTo.sender.name }),
                      /* @__PURE__ */ jsx("p", { className: "truncate", children: message.replyTo.content })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: cn(bubbleVariants2({ variant, status: message.status })),
                    role: "article",
                    "aria-label": `Message from ${message.sender.name}`,
                    children: [
                      hasAttachments && /* @__PURE__ */ jsx("div", { className: cn("space-y-2", hasText && "mb-2"), children: message.attachments.map((attachment) => /* @__PURE__ */ jsx(
                        AttachmentPreview,
                        {
                          attachment,
                          onClick: () => onAttachmentClick?.(attachment)
                        },
                        attachment.id
                      )) }),
                      hasText && /* @__PURE__ */ jsx("p", { className: "break-words whitespace-pre-wrap", children: message.isDeleted ? /* @__PURE__ */ jsx("span", { className: "italic opacity-60", children: "This message was deleted" }) : message.content }),
                      message.isEdited && !message.isDeleted && /* @__PURE__ */ jsx("span", { className: "ml-1 text-xs opacity-60", children: "(edited)" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: cn(
                      "mt-1 flex items-center gap-2 px-1",
                      isOutgoing ? "flex-row-reverse" : "flex-row"
                    ),
                    children: [
                      showTimestamp && /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-400 dark:text-neutral-500", children: formatTimestamp(message.timestamp) }),
                      showStatus && isOutgoing && /* @__PURE__ */ jsx(MessageStatusIcon, { status: message.status }),
                      showReadReceipts && isOutgoing && message.readReceipts && message.readReceipts.length > 0 && /* @__PURE__ */ jsx(ReadReceiptIndicator, { receipts: message.readReceipts }),
                      isFailed && onRetry && /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: onRetry,
                          className: cn(
                            "flex items-center gap-1 rounded px-2 py-0.5",
                            "text-xs font-medium text-red-500",
                            "hover:bg-red-50 dark:hover:bg-red-900/20",
                            "focus:ring-2 focus:ring-red-500 focus:outline-none"
                          ),
                          "aria-label": "Retry sending message",
                          children: [
                            /* @__PURE__ */ jsx(
                              "svg",
                              {
                                className: "h-3 w-3",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                children: /* @__PURE__ */ jsx(
                                  "path",
                                  {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  }
                                )
                              }
                            ),
                            "Retry"
                          ]
                        }
                      )
                    ]
                  }
                ),
                message.reactions && message.reactions.length > 0 && /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: cn(
                      "-mt-1 flex flex-wrap gap-1",
                      isOutgoing ? "justify-end" : "justify-start"
                    ),
                    children: message.reactions.map((reaction) => /* @__PURE__ */ jsxs(
                      "span",
                      {
                        className: cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                          "bg-neutral-100 text-xs dark:bg-neutral-800",
                          "border border-neutral-200 dark:border-neutral-700"
                        ),
                        title: reaction.participants.map((p) => p.name).join(", "),
                        children: [
                          /* @__PURE__ */ jsx("span", { children: reaction.emoji }),
                          reaction.count > 1 && /* @__PURE__ */ jsx("span", { className: "text-neutral-500", children: reaction.count })
                        ]
                      },
                      reaction.emoji
                    ))
                  }
                )
              ]
            }
          ),
          showAvatar && isOutgoing && /* @__PURE__ */ jsx("div", { className: "w-8 shrink-0" })
        ]
      }
    );
  }
);
MessageBubble.displayName = "MessageBubble";
function groupMessagesByDate(messages) {
  const groups = /* @__PURE__ */ new Map();
  messages.forEach((message) => {
    const date = new Date(message.timestamp);
    const dateKey = date.toDateString();
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, message]);
  });
  return Array.from(groups.entries()).map(([dateKey, msgs]) => ({
    date: dateKey,
    label: formatDateLabel(new Date(dateKey)),
    messages: msgs
  }));
}
function formatDateLabel(date) {
  const now = /* @__PURE__ */ new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  if (messageDate.getTime() === today.getTime()) {
    return "Today";
  }
  if (messageDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(void 0, {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }
  return date.toLocaleDateString(void 0, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}
function isSameSenderGroup(prev, current, thresholdMinutes = 5) {
  if (!prev) return false;
  if (prev.sender.id !== current.sender.id) return false;
  if (prev.type === "system" || current.type === "system") return false;
  const prevTime = new Date(prev.timestamp).getTime();
  const currentTime = new Date(current.timestamp).getTime();
  const diffMinutes = (currentTime - prevTime) / (1e3 * 60);
  return diffMinutes < thresholdMinutes;
}
function SkeletonMessage({
  isOutgoing = false,
  showAvatar = true,
  className
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex items-end gap-2",
        isOutgoing ? "flex-row-reverse" : "flex-row",
        className
      ),
      "aria-hidden": "true",
      children: [
        showAvatar && !isOutgoing && /* @__PURE__ */ jsx("div", { className: "h-8 w-8 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "animate-pulse rounded-2xl",
              isOutgoing ? "bg-primary-800/30 rounded-br-md" : "rounded-bl-md bg-neutral-200 dark:bg-neutral-700",
              "h-10 w-48"
            )
          }
        ),
        showAvatar && isOutgoing && /* @__PURE__ */ jsx("div", { className: "w-8" })
      ]
    }
  );
}
SkeletonMessage.displayName = "SkeletonMessage";
function TypingIndicator({ typingState, className }) {
  const { participants } = typingState;
  if (participants.length === 0) return null;
  const typingText = participants.length === 1 ? `${participants[0].name} is typing` : participants.length === 2 ? `${participants[0].name} and ${participants[1].name} are typing` : `${participants[0].name} and ${participants.length - 1} others are typing`;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("flex items-center gap-2 px-4 py-2", className),
      role: "status",
      "aria-live": "polite",
      "aria-label": typingText,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 rounded-2xl rounded-bl-md bg-neutral-200 px-4 py-3 dark:bg-neutral-700", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "h-2 w-2 animate-bounce rounded-full bg-neutral-500",
              style: { animationDelay: "0ms" }
            }
          ),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "h-2 w-2 animate-bounce rounded-full bg-neutral-500",
              style: { animationDelay: "150ms" }
            }
          ),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "h-2 w-2 animate-bounce rounded-full bg-neutral-500",
              style: { animationDelay: "300ms" }
            }
          )
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-500 dark:text-neutral-400", children: typingText })
      ]
    }
  );
}
TypingIndicator.displayName = "TypingIndicator";
function DateSeparator({ label, className }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn("flex items-center justify-center py-4", className),
      role: "separator",
      "aria-label": label,
      children: /* @__PURE__ */ jsx(
        "span",
        {
          className: cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            "bg-neutral-100 text-neutral-500",
            "dark:bg-neutral-800 dark:text-neutral-400"
          ),
          children: label
        }
      )
    }
  );
}
DateSeparator.displayName = "DateSeparator";
function EmptyState({
  title = "No messages yet",
  description = "Start the conversation by sending a message below.",
  icon,
  action,
  className
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex flex-1 flex-col items-center justify-center p-8 text-center",
        className
      ),
      role: "status",
      "aria-label": title,
      children: [
        icon || /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800", children: /* @__PURE__ */ jsx(
          "svg",
          {
            className: "h-12 w-12 text-neutral-400",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 1.5,
                d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsx("h3", { className: "mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100", children: title }),
        /* @__PURE__ */ jsx("p", { className: "mb-4 max-w-sm text-sm text-neutral-500 dark:text-neutral-400", children: description }),
        action
      ]
    }
  );
}
EmptyState.displayName = "EmptyState";
function LoadMoreButton({
  isLoading,
  onClick,
  className
}) {
  return /* @__PURE__ */ jsx("div", { className: cn("flex justify-center py-4", className), children: /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick,
      disabled: isLoading,
      className: cn(
        "rounded-full px-4 py-2 text-sm font-medium",
        "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
        "hover:bg-neutral-200 dark:hover:bg-neutral-700",
        "focus:ring-primary-500 focus:ring-2 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors"
      ),
      "aria-label": isLoading ? "Loading more messages" : "Load more messages",
      children: isLoading ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          "svg",
          {
            className: "h-4 w-4 animate-spin",
            fill: "none",
            viewBox: "0 0 24 24",
            children: [
              /* @__PURE__ */ jsx(
                "circle",
                {
                  className: "opacity-25",
                  cx: "12",
                  cy: "12",
                  r: "10",
                  stroke: "currentColor",
                  strokeWidth: "4"
                }
              ),
              /* @__PURE__ */ jsx(
                "path",
                {
                  className: "opacity-75",
                  fill: "currentColor",
                  d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                }
              )
            ]
          }
        ),
        "Loading..."
      ] }) : "Load earlier messages"
    }
  ) });
}
LoadMoreButton.displayName = "LoadMoreButton";
var MessageList = React14.forwardRef(
  ({
    messages,
    currentUser,
    isLoading = false,
    hasMore = false,
    isLoadingMore = false,
    typingState,
    showAvatars = true,
    showSenderNames = false,
    groupByDate = true,
    onLoadMore,
    onRetryMessage,
    onAttachmentClick,
    emptyState,
    formatTimestamp,
    className,
    autoScroll = "onNewMessage"
  }, ref) => {
    const scrollContainerRef = React14.useRef(null);
    const bottomRef = React14.useRef(null);
    const [isUserScrolled, setIsUserScrolled] = React14.useState(false);
    const prevMessageCountRef = React14.useRef(messages.length);
    React14.useImperativeHandle(ref, () => scrollContainerRef.current);
    const handleScroll = React14.useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsUserScrolled(!isAtBottom);
    }, []);
    React14.useEffect(() => {
      const container = scrollContainerRef.current;
      const bottom = bottomRef.current;
      if (!container || !bottom) return;
      const messageCountChanged = messages.length !== prevMessageCountRef.current;
      prevMessageCountRef.current = messages.length;
      if (autoScroll === "always") {
        bottom.scrollIntoView({ behavior: "smooth" });
      } else if (autoScroll === "onNewMessage" && messageCountChanged) {
        const lastMessage = messages[messages.length - 1];
        const isOutgoing = lastMessage?.sender.id === currentUser.id;
        if (isOutgoing || !isUserScrolled) {
          bottom.scrollIntoView({ behavior: "smooth" });
        }
      }
    }, [messages, currentUser.id, autoScroll, isUserScrolled]);
    React14.useEffect(() => {
      const bottom = bottomRef.current;
      if (bottom && !isLoading) {
        bottom.scrollIntoView();
      }
    }, [isLoading]);
    const messageGroups = groupByDate ? groupMessagesByDate(messages) : [{ date: "all", label: "", messages }];
    if (isLoading) {
      return /* @__PURE__ */ jsx(
        "div",
        {
          className: cn(
            "flex flex-1 flex-col gap-3 overflow-y-auto p-4",
            className
          ),
          "aria-busy": "true",
          "aria-label": "Loading messages",
          children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ jsx(
            SkeletonMessage,
            {
              isOutgoing: i % 3 === 0,
              showAvatar: showAvatars
            },
            i
          ))
        }
      );
    }
    if (messages.length === 0) {
      return emptyState || /* @__PURE__ */ jsx(EmptyState, {});
    }
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref: scrollContainerRef,
        className: cn(
          "flex flex-1 flex-col overflow-y-auto",
          "scroll-smooth",
          className
        ),
        onScroll: handleScroll,
        role: "log",
        "aria-label": "Message history",
        "aria-live": "polite",
        children: [
          hasMore && onLoadMore && /* @__PURE__ */ jsx(LoadMoreButton, { isLoading: isLoadingMore, onClick: onLoadMore }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1 p-4", children: messageGroups.map((group) => /* @__PURE__ */ jsxs(React14.Fragment, { children: [
            groupByDate && group.label && /* @__PURE__ */ jsx(DateSeparator, { label: group.label }),
            group.messages.map((message, index) => {
              const prevMessage = group.messages[index - 1];
              const isOutgoing = message.sender.id === currentUser.id;
              const isSameGroup = isSameSenderGroup(prevMessage, message);
              return /* @__PURE__ */ jsx(
                "div",
                {
                  className: cn(
                    "transition-opacity duration-200",
                    isSameGroup ? "mt-0.5" : "mt-3",
                    index === 0 && "mt-0"
                  ),
                  children: /* @__PURE__ */ jsx(
                    MessageBubble,
                    {
                      message,
                      isOutgoing,
                      showAvatar: showAvatars && !isSameGroup && !isOutgoing,
                      showSenderName: showSenderNames && !isSameGroup && !isOutgoing,
                      showTimestamp: !isSameGroup,
                      onRetry: message.status === "failed" && onRetryMessage ? () => onRetryMessage(message.id) : void 0,
                      onAttachmentClick: (attachment) => onAttachmentClick?.(attachment, message),
                      formatTimestamp
                    }
                  )
                },
                message.id
              );
            })
          ] }, group.date)) }),
          typingState && typingState.participants.length > 0 && /* @__PURE__ */ jsx(TypingIndicator, { typingState }),
          /* @__PURE__ */ jsx("div", { ref: bottomRef, className: "h-0", "aria-hidden": "true" }),
          isUserScrolled && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              },
              className: cn(
                "fixed right-4 bottom-24 z-10",
                "rounded-full p-3 shadow-lg",
                "bg-white dark:bg-neutral-800",
                "border border-neutral-200 dark:border-neutral-700",
                "hover:bg-neutral-50 dark:hover:bg-neutral-700",
                "focus:ring-primary-500 focus:ring-2 focus:outline-none",
                "transition-all"
              ),
              "aria-label": "Scroll to bottom",
              children: /* @__PURE__ */ jsx(
                "svg",
                {
                  className: "h-5 w-5 text-neutral-600 dark:text-neutral-300",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  children: /* @__PURE__ */ jsx(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: 2,
                      d: "M19 14l-7 7m0 0l-7-7m7 7V3"
                    }
                  )
                }
              )
            }
          )
        ]
      }
    );
  }
);
MessageList.displayName = "MessageList";
var ACTION_ICONS = {
  patient: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
        }
      )
    }
  ),
  search: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        }
      )
    }
  ),
  appointment: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        }
      )
    }
  ),
  document: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        }
      )
    }
  ),
  help: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
        }
      )
    }
  ),
  default: /* @__PURE__ */ jsx(
    "svg",
    {
      className: "h-4 w-4",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        }
      )
    }
  )
};
function SuggestedActions({
  actions,
  onSelect,
  className
}) {
  return /* @__PURE__ */ jsx("div", { className: cn("flex flex-wrap gap-2", className), children: actions.map((action) => /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: () => onSelect(action),
      className: cn(
        "flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5",
        "hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 text-sm text-neutral-700",
        "dark:border-neutral-700 dark:text-neutral-300",
        "dark:hover:border-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-300",
        "transition-colors"
      ),
      children: [
        ACTION_ICONS[action.icon || "default"] || ACTION_ICONS.default,
        /* @__PURE__ */ jsx("span", { children: action.label })
      ]
    },
    action.id
  )) });
}
function AIEmptyState({
  title = "How can I help you today?",
  description = "Ask me anything about patients, appointments, documents, or how to use the system.",
  suggestions,
  onSuggestionSelect,
  className,
  ...props
}) {
  const aiIcon = /* @__PURE__ */ jsx("div", { className: "bg-primary-500 dark:bg-primary-600 flex h-16 w-16 items-center justify-center rounded-full text-white", children: /* @__PURE__ */ jsx(SparklesIcon, { size: "lg", className: "h-8 w-8" }) });
  const suggestionsAction = suggestions && suggestions.length > 0 && onSuggestionSelect ? /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
    /* @__PURE__ */ jsx("p", { className: "mb-3 text-sm text-neutral-500 dark:text-neutral-400", children: "Try asking:" }),
    /* @__PURE__ */ jsx(SuggestedActions, { actions: suggestions, onSelect: onSuggestionSelect })
  ] }) : void 0;
  return /* @__PURE__ */ jsx(
    EmptyState,
    {
      title,
      description,
      icon: aiIcon,
      action: suggestionsAction,
      className,
      ...props
    }
  );
}
var chatVariants = cva("flex flex-col", {
  variants: {
    variant: {
      default: "bg-white dark:bg-neutral-900",
      embedded: "bg-transparent",
      floating: "bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700"
    },
    size: {
      sm: "max-w-sm",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "w-full"
    }
  },
  defaultVariants: {
    variant: "default",
    size: "full"
  }
});
function AIChat({
  session,
  messages: messagesProp,
  isGenerating: isGeneratingProp,
  userName = "You",
  title = "AI Assistant",
  suggestions,
  showHeader = true,
  showTimestamps = false,
  inputPlaceholder = "Ask anything...",
  variant,
  size,
  height,
  composerProps,
  className,
  onSendMessage,
  onToolCall: _onToolCall,
  onResourceClick,
  onSuggestedAction,
  onCancel,
  onClear,
  onClose
}) {
  const messagesEndRef = React14.useRef(null);
  const messages = React14.useMemo(
    () => session?.messages || messagesProp || [],
    [session?.messages, messagesProp]
  );
  const isGenerating = session?.isGenerating || isGeneratingProp || false;
  React14.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleSend = async (message) => {
    if (message.content.trim() && onSendMessage) {
      onSendMessage(message.content.trim());
    }
  };
  const handleSuggestionSelect = (action) => {
    if (onSuggestedAction) {
      onSuggestedAction(action);
    } else if (onSendMessage) {
      onSendMessage(action.prompt);
    }
  };
  const handleLinkClick = (link) => {
    if (onResourceClick) {
      onResourceClick(link);
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(chatVariants({ variant, size }), className),
      style: { height: height || void 0 },
      children: [
        showHeader && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-primary-500 dark:bg-primary-600 flex h-8 w-8 items-center justify-center rounded-full text-white", children: /* @__PURE__ */ jsx(SparklesIcon, { size: "sm" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "font-semibold text-neutral-900 dark:text-white", children: title }),
              isGenerating && /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "Generating..." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            isGenerating && onCancel && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onCancel,
                className: cn(
                  "rounded-lg px-3 py-1.5 text-sm",
                  "bg-red-100 text-red-600 hover:bg-red-200",
                  "dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50",
                  "transition-colors"
                ),
                children: "Stop"
              }
            ),
            onClear && messages.length > 0 && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onClear,
                className: "rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300",
                title: "Clear chat",
                children: /* @__PURE__ */ jsx(RefreshIcon, {})
              }
            ),
            onClose && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onClose,
                className: "rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300",
                title: "Close chat",
                "aria-label": "Close chat",
                children: /* @__PURE__ */ jsx(CloseIcon, {})
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto px-4 py-4", children: messages.length === 0 ? /* @__PURE__ */ jsx(
          AIEmptyState,
          {
            suggestions,
            onSuggestionSelect: handleSuggestionSelect
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          messages.map((message) => /* @__PURE__ */ jsx(
            AIMessageDisplay,
            {
              message,
              userName,
              showTimestamp: showTimestamps,
              onLinkClick: handleLinkClick
            },
            message.id
          )),
          /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "shrink-0 border-t border-neutral-200 dark:border-neutral-700", children: [
          suggestions && suggestions.length > 0 && messages.length > 0 && !isGenerating && /* @__PURE__ */ jsx("div", { className: "px-4 pt-3", children: /* @__PURE__ */ jsx(
            SuggestedActions,
            {
              actions: suggestions,
              onSelect: handleSuggestionSelect
            }
          ) }),
          /* @__PURE__ */ jsx(
            MessageComposer,
            {
              onSend: handleSend,
              placeholder: inputPlaceholder,
              disabled: isGenerating,
              isSending: isGenerating,
              showAttachmentPicker: false,
              showCameraButton: false,
              showCharacterCount: false,
              variant: "minimal",
              ...composerProps
            }
          )
        ] })
      ]
    }
  );
}
function AIChatTrigger({
  isOpen = false,
  onClick,
  pulse = false,
  badge,
  position = "bottom-right",
  className
}) {
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4"
  };
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick,
      className: cn(
        "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg",
        "bg-primary-500 text-white",
        "hover:bg-primary-600",
        "focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 focus:outline-none",
        "dark:focus:ring-offset-neutral-900",
        "transition-all duration-200",
        isOpen && "scale-0 opacity-0",
        positionClasses[position],
        className
      ),
      "aria-label": "Open AI Assistant",
      children: [
        pulse && !isOpen && /* @__PURE__ */ jsx("span", { className: "bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" }),
        badge && badge > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold", children: badge > 9 ? "9+" : badge }),
        /* @__PURE__ */ jsx(SparklesIcon, { size: "lg" })
      ]
    }
  );
}
function AIChatModal({
  open,
  onOpenChange,
  position = "bottom-right",
  width = 400,
  height = 600,
  modalClassName,
  ...chatProps
}) {
  const modalRef = useFocusTrap(open);
  useEscapeKey(() => {
    if (open) onOpenChange(false);
  });
  if (!open) return null;
  const positionClasses = {
    "bottom-right": "bottom-20 right-4",
    "bottom-left": "bottom-20 left-4",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    position === "center" && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm",
        onClick: () => onOpenChange(false),
        onKeyDown: (e) => e.key === "Escape" && onOpenChange(false),
        role: "button",
        tabIndex: 0,
        "aria-label": "Close dialog"
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        ref: modalRef,
        className: cn(
          "fixed z-50",
          "animate-in fade-in-0 zoom-in-95",
          positionClasses[position],
          modalClassName
        ),
        style: {
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          maxHeight: "calc(100vh - 6rem)",
          maxWidth: "calc(100vw - 2rem)"
        },
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "AI Assistant Chat",
        children: /* @__PURE__ */ jsx("div", { className: "relative h-full w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900", children: /* @__PURE__ */ jsx(
          AIChat,
          {
            ...chatProps,
            variant: "embedded",
            height: "100%",
            className: "h-full",
            onClose: () => onOpenChange(false)
          }
        ) })
      }
    )
  ] });
}
function FloatingAIChat({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  buttonPosition = "bottom-right",
  position = "bottom-right",
  pulse = false,
  ...chatProps
}) {
  const [internalOpen, setInternalOpen] = React14.useState(defaultOpen);
  const isControlled = controlledOpen !== void 0;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const handleOpenChange = (open) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    controlledOnOpenChange?.(open);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      AIChatTrigger,
      {
        isOpen,
        onClick: () => handleOpenChange(true),
        position: buttonPosition,
        pulse: pulse && !isOpen
      }
    ),
    /* @__PURE__ */ jsx(
      AIChatModal,
      {
        open: isOpen,
        onOpenChange: handleOpenChange,
        position,
        ...chatProps
      }
    )
  ] });
}
function AppHeader({
  children,
  className,
  sticky = true,
  bordered = true,
  height = "h-16",
  "data-testid": testId = "app-header"
}) {
  return /* @__PURE__ */ jsx(
    "header",
    {
      "data-testid": testId,
      className: cn(
        "flex items-center justify-between px-4 lg:px-6",
        "bg-white dark:bg-gray-900",
        height,
        sticky && "sticky top-0 z-30",
        bordered && "border-b border-gray-200 dark:border-gray-700",
        className
      ),
      children
    }
  );
}
function AppHeaderSection({
  children,
  align = "left",
  className
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "flex items-center gap-3",
        align === "left" && "mr-auto",
        align === "center" && "mx-auto",
        align === "right" && "ml-auto",
        className
      ),
      children
    }
  );
}
function AppHeaderTitle({
  children,
  subtitle,
  className
}) {
  return /* @__PURE__ */ jsxs("div", { className: cn("min-w-0", className), children: [
    /* @__PURE__ */ jsx("h1", { className: "truncate text-lg font-semibold text-gray-900 dark:text-white", children }),
    subtitle && /* @__PURE__ */ jsx("p", { className: "truncate text-sm text-gray-500 dark:text-gray-400", children: subtitle })
  ] });
}
function AppHeaderActions({
  children,
  className
}) {
  return /* @__PURE__ */ jsx("div", { className: cn("flex items-center gap-2", className), children });
}
function AppHeaderDivider({
  className
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn("mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700", className),
      "aria-hidden": "true"
    }
  );
}
function AppHeaderIconButton({
  icon,
  label,
  onClick,
  badge,
  isActive = false,
  className,
  "data-testid": testId
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick,
      "data-testid": testId,
      className: cn(
        "relative rounded-lg p-2 transition-colors",
        "text-gray-500 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus:ring-primary-500 focus:ring-2 focus:outline-none",
        isActive && "text-primary-600 dark:text-primary-400 bg-gray-100 dark:bg-gray-800",
        className
      ),
      "aria-label": label,
      title: label,
      children: [
        /* @__PURE__ */ jsx("span", { className: "h-5 w-5", children: icon }),
        typeof badge === "number" && badge > 0 && /* @__PURE__ */ jsx(
          "span",
          {
            className: cn(
              "absolute -top-1 -right-1 flex items-center justify-center",
              "h-[18px] min-w-[18px] px-1 text-[10px] font-bold",
              "rounded-full bg-red-500 text-white"
            ),
            children: badge > 99 ? "99+" : badge
          }
        )
      ]
    }
  );
}
var SearchIcon = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      }
    )
  }
);
var isMac = typeof window !== "undefined" && typeof window.navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
function AppHeaderSearch({
  onClick,
  placeholder = "Search...",
  showOnMobile = false,
  className,
  "data-testid": testId = "app-header-search"
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick,
      "data-testid": testId,
      className: cn(
        "flex items-center gap-3 rounded-lg border border-gray-300 dark:border-gray-600",
        "bg-white px-4 py-2 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400",
        "hover:border-gray-400 dark:hover:border-gray-500",
        "transition-colors hover:bg-gray-50 dark:hover:bg-gray-600",
        !showOnMobile && "hidden sm:flex",
        "min-w-[200px] lg:min-w-[300px]",
        className
      ),
      children: [
        /* @__PURE__ */ jsx(SearchIcon, {}),
        /* @__PURE__ */ jsx("span", { className: "flex-1 text-left whitespace-nowrap", children: placeholder }),
        /* @__PURE__ */ jsxs(
          "kbd",
          {
            className: cn(
              "hidden items-center gap-0.5 px-2 py-0.5 sm:inline-flex",
              "rounded border border-gray-200 bg-gray-100 dark:border-gray-500 dark:bg-gray-600",
              "flex-shrink-0 text-xs text-gray-600 dark:text-gray-300"
            ),
            children: [
              isMac ? "\u2318" : "Ctrl",
              "+K"
            ]
          }
        )
      ]
    }
  );
}
function AppHeaderUserMenu({
  name,
  email,
  avatarUrl,
  initials,
  isOpen = false,
  onClick,
  className,
  "data-testid": testId = "app-header-user-menu"
}) {
  const displayInitials = initials ?? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick,
      "data-testid": testId,
      className: cn(
        "flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus:ring-primary-500 focus:ring-2 focus:outline-none",
        isOpen && "bg-gray-100 dark:bg-gray-800",
        className
      ),
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full",
              "bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 text-sm font-medium"
            ),
            children: avatarUrl ? /* @__PURE__ */ jsx(
              "img",
              {
                src: avatarUrl,
                alt: name,
                className: "h-full w-full object-cover"
              }
            ) : displayInitials
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "hidden min-w-0 text-left lg:block", children: [
          /* @__PURE__ */ jsx("div", { className: "max-w-[150px] truncate text-sm font-medium text-gray-900 dark:text-white", children: name }),
          email && /* @__PURE__ */ jsx("div", { className: "max-w-[150px] truncate text-xs text-gray-500 dark:text-gray-400", children: email })
        ] }),
        /* @__PURE__ */ jsx(
          "svg",
          {
            className: cn(
              "hidden h-4 w-4 text-gray-400 transition-transform lg:block",
              isOpen && "rotate-180"
            ),
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            strokeWidth: 2,
            children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" })
          }
        )
      ]
    }
  );
}
var CommandPaletteContext = createContext(
  null
);
function CommandPaletteProvider({
  children,
  enableShortcut = true,
  customEventName
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeCategory, setActiveCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setSelectedIndex(-1);
    setActiveCategory(null);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(-1);
  }, []);
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);
  useCommandK(toggle, enableShortcut);
  React14__default.useEffect(() => {
    if (!customEventName) return;
    const handler = () => open();
    document.addEventListener(customEventName, handler);
    return () => document.removeEventListener(customEventName, handler);
  }, [customEventName, open]);
  const contextValue = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      query,
      setQuery,
      selectedIndex,
      setSelectedIndex,
      activeCategory,
      setActiveCategory,
      items,
      categories,
      setItems,
      setCategories
    }),
    [
      isOpen,
      open,
      close,
      toggle,
      query,
      selectedIndex,
      activeCategory,
      items,
      categories
    ]
  );
  return /* @__PURE__ */ jsx(CommandPaletteContext.Provider, { value: contextValue, children });
}
function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider"
    );
  }
  return context;
}
var SearchIcon2 = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      }
    )
  }
);
var XIcon = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M6 18L18 6M6 6l12 12"
      }
    )
  }
);
var SpinnerIcon2 = () => /* @__PURE__ */ jsxs("svg", { className: "h-4 w-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
  /* @__PURE__ */ jsx(
    "circle",
    {
      className: "opacity-25",
      cx: "12",
      cy: "12",
      r: "10",
      stroke: "currentColor",
      strokeWidth: "4"
    }
  ),
  /* @__PURE__ */ jsx(
    "path",
    {
      className: "opacity-75",
      fill: "currentColor",
      d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    }
  )
] });
var isMac2 = typeof window !== "undefined" && typeof window.navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
function CommandPalette({
  placeholder = "Search...",
  isLoading = false,
  onSelect,
  emptyState,
  renderItem,
  footer,
  className,
  "data-testid": testId = "command-palette"
}) {
  const {
    isOpen,
    close,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    activeCategory,
    setActiveCategory,
    items,
    categories
  } = useCommandPalette();
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const filteredItems = useMemo(() => {
    let result = items;
    if (activeCategory) {
      result = result.filter((item) => item.category === activeCategory);
    }
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (item) => item.label.toLowerCase().includes(lowerQuery) || item.subtitle?.toLowerCase().includes(lowerQuery) || item.description?.toLowerCase().includes(lowerQuery)
      );
    }
    return result;
  }, [items, query, activeCategory]);
  const groupedItems = useMemo(() => {
    const groups = /* @__PURE__ */ new Map();
    filteredItems.forEach((item) => {
      const category = item.category ?? "Other";
      const group = groups.get(category) ?? [];
      group.push(item);
      groups.set(category, group);
    });
    return groups;
  }, [filteredItems]);
  useEscapeKey(close, isOpen);
  useClickOutside(containerRef, close);
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);
  useEffect(() => {
    setSelectedIndex(filteredItems.length > 0 ? 0 : -1);
  }, [filteredItems.length, setSelectedIndex]);
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);
  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(
            Math.min(selectedIndex + 1, filteredItems.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(Math.max(selectedIndex - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
            const item = filteredItems[selectedIndex];
            if (!item.disabled) {
              onSelect?.(item);
              close();
            }
          }
          break;
        case "Tab":
          e.preventDefault();
          if (categories.length > 0) {
            const currentIdx = activeCategory ? categories.findIndex((c) => c.id === activeCategory) : -1;
            const nextIdx = e.shiftKey ? currentIdx <= 0 ? categories.length - 1 : currentIdx - 1 : currentIdx >= categories.length - 1 ? -1 : currentIdx + 1;
            setActiveCategory(nextIdx === -1 ? null : categories[nextIdx].id);
          }
          break;
      }
    },
    [
      filteredItems,
      selectedIndex,
      setSelectedIndex,
      onSelect,
      close,
      categories,
      activeCategory,
      setActiveCategory
    ]
  );
  const handleItemClick = useCallback(
    (item) => {
      if (!item.disabled) {
        onSelect?.(item);
        close();
      }
    },
    [onSelect, close]
  );
  const getCategoryInfo = useCallback(
    (categoryId) => {
      return categories.find((c) => c.id === categoryId);
    },
    [categories]
  );
  if (!isOpen) return null;
  let globalIndex = -1;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm dark:bg-black/70",
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-x-0 top-20 z-50 mx-auto max-w-2xl px-4", children: /* @__PURE__ */ jsxs(
      "div",
      {
        ref: containerRef,
        "data-testid": testId,
        className: cn(
          "rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
          "overflow-hidden shadow-2xl",
          className
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "relative border-b border-gray-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-4 -translate-y-1/2 text-gray-400", children: /* @__PURE__ */ jsx(SearchIcon2, {}) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                ref: inputRef,
                type: "text",
                value: query,
                onChange: (e) => setQuery(e.target.value),
                onKeyDown: handleKeyDown,
                placeholder,
                autoFocus: true,
                "data-testid": `${testId}-input`,
                className: cn(
                  "w-full bg-transparent py-4 pr-12 pl-12 text-base",
                  "focus:outline-none dark:text-white dark:placeholder-gray-400"
                )
              }
            ),
            query && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setQuery(""),
                "data-testid": `${testId}-clear`,
                className: "absolute top-1/2 right-12 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                children: /* @__PURE__ */ jsx(XIcon, {})
              }
            ),
            isLoading && /* @__PURE__ */ jsx("div", { className: "text-primary-500 absolute top-1/2 right-4 -translate-y-1/2", children: /* @__PURE__ */ jsx(SpinnerIcon2, {}) })
          ] }),
          categories.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 overflow-x-auto border-b border-gray-100 p-2 dark:border-gray-700", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setActiveCategory(null),
                "data-testid": `${testId}-filter-all`,
                className: cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  activeCategory === null ? "bg-primary-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                ),
                children: "All"
              }
            ),
            categories.map((cat) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setActiveCategory(cat.id),
                "data-testid": `${testId}-filter-${cat.id}`,
                className: cn(
                  "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
                  activeCategory === cat.id ? "bg-primary-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                ),
                children: [
                  cat.icon && /* @__PURE__ */ jsx("span", { className: "h-3 w-3", children: cat.icon }),
                  cat.label
                ]
              },
              cat.id
            ))
          ] }),
          /* @__PURE__ */ jsx("div", { ref: listRef, className: "max-h-[60vh] overflow-y-auto", children: filteredItems.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-gray-500 dark:text-gray-400", children: emptyState ?? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "mx-auto mb-2 h-8 w-8 opacity-50", children: /* @__PURE__ */ jsx(SearchIcon2, {}) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: query.trim() ? `No results for "${query}"` : "Start typing to search..." })
          ] }) }) : Array.from(groupedItems.entries()).map(
            ([categoryId, categoryItems]) => {
              const categoryInfo = getCategoryInfo(categoryId);
              return /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: cn(
                      "sticky top-0 px-3 py-2 text-xs font-semibold",
                      "text-gray-500 dark:text-gray-400",
                      "bg-gray-50 dark:bg-gray-900/50"
                    ),
                    children: [
                      categoryInfo?.icon && /* @__PURE__ */ jsx(
                        "span",
                        {
                          className: cn(
                            "mr-2 inline-block h-4 w-4 align-middle",
                            categoryInfo.colorClass
                          ),
                          children: categoryInfo.icon
                        }
                      ),
                      categoryInfo?.label ?? categoryId,
                      " (",
                      categoryItems.length,
                      ")"
                    ]
                  }
                ),
                categoryItems.map((item) => {
                  globalIndex++;
                  const currentIndex = globalIndex;
                  const isSelected = currentIndex === selectedIndex;
                  if (renderItem) {
                    return /* @__PURE__ */ jsx(
                      "div",
                      {
                        role: "option",
                        "aria-selected": isSelected,
                        "data-index": currentIndex,
                        onClick: () => handleItemClick(item),
                        onKeyDown: (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleItemClick(item);
                          }
                        },
                        onMouseEnter: () => setSelectedIndex(currentIndex),
                        tabIndex: 0,
                        children: renderItem(item, {
                          isSelected,
                          index: currentIndex
                        })
                      },
                      item.id
                    );
                  }
                  return /* @__PURE__ */ jsxs(
                    "button",
                    {
                      "data-index": currentIndex,
                      onClick: () => handleItemClick(item),
                      onMouseEnter: () => setSelectedIndex(currentIndex),
                      disabled: item.disabled,
                      className: cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                        isSelected ? "bg-primary-50 dark:bg-primary-500/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                        item.disabled && "cursor-not-allowed opacity-50"
                      ),
                      children: [
                        item.icon && /* @__PURE__ */ jsx(
                          "div",
                          {
                            className: cn(
                              "mt-0.5 h-4 w-4 flex-shrink-0",
                              isSelected ? "text-primary-600 dark:text-primary-400" : "text-gray-400"
                            ),
                            children: item.icon
                          }
                        ),
                        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                          /* @__PURE__ */ jsx("div", { className: "truncate text-sm font-medium text-gray-900 dark:text-white", children: item.label }),
                          item.subtitle && /* @__PURE__ */ jsx("div", { className: "truncate text-xs text-gray-500 dark:text-gray-400", children: item.subtitle }),
                          item.description && /* @__PURE__ */ jsx("div", { className: "mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500", children: item.description })
                        ] }),
                        item.shortcut && /* @__PURE__ */ jsx(
                          "kbd",
                          {
                            className: cn(
                              "hidden items-center px-1.5 py-0.5 text-[10px] sm:inline-flex",
                              "rounded border bg-gray-100 dark:bg-gray-700",
                              "border-gray-200 dark:border-gray-600",
                              "text-gray-600 dark:text-gray-400"
                            ),
                            children: item.shortcut
                          }
                        )
                      ]
                    },
                    item.id
                  );
                })
              ] }, categoryId);
            }
          ) }),
          footer ?? /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "border-t border-gray-100 p-2 dark:border-gray-700",
                "bg-gray-50 text-xs text-gray-500 dark:bg-gray-900/50 dark:text-gray-400",
                "flex items-center justify-between"
              ),
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("kbd", { className: "rounded border border-gray-200 bg-white px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700", children: "\u2191\u2193" }),
                  /* @__PURE__ */ jsx("span", { children: "navigate" }),
                  /* @__PURE__ */ jsx("kbd", { className: "ml-2 rounded border border-gray-200 bg-white px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700", children: "\u21B5" }),
                  /* @__PURE__ */ jsx("span", { children: "select" }),
                  /* @__PURE__ */ jsx("kbd", { className: "ml-2 rounded border border-gray-200 bg-white px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700", children: "esc" }),
                  /* @__PURE__ */ jsx("span", { children: "close" })
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  filteredItems.length,
                  " results"
                ] })
              ]
            }
          )
        ]
      }
    ) })
  ] });
}
function CommandPaletteTrigger({
  children,
  placeholder = "Search...",
  className,
  "data-testid": testId = "command-palette-trigger"
}) {
  const { open } = useCommandPalette();
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: open,
      "data-testid": testId,
      className: cn(
        "flex items-center gap-3 rounded-lg border border-gray-300 dark:border-gray-600",
        "bg-white px-4 py-2.5 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400",
        "hover:border-gray-400 dark:hover:border-gray-500",
        "transition-colors hover:bg-gray-50 dark:hover:bg-gray-600",
        "min-w-[200px] sm:min-w-[300px]",
        className
      ),
      children: children ?? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(SearchIcon2, {}),
        /* @__PURE__ */ jsx("span", { className: "flex-1 text-left whitespace-nowrap", children: placeholder }),
        /* @__PURE__ */ jsxs(
          "kbd",
          {
            className: cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5",
              "rounded border border-gray-200 bg-gray-100 dark:border-gray-500 dark:bg-gray-600",
              "flex-shrink-0 text-xs text-gray-600 dark:text-gray-300"
            ),
            children: [
              isMac2 ? "\u2318" : "Ctrl",
              "+K"
            ]
          }
        )
      ] })
    }
  );
}
var headerVariants = cva(
  [
    "flex items-center gap-3 px-4 py-3",
    "bg-white dark:bg-neutral-900",
    "border-b border-neutral-200 dark:border-neutral-700"
  ],
  {
    variants: {
      size: {
        sm: "py-2",
        md: "py-3",
        lg: "py-4"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
function getConversationTitle(conversation, participant) {
  if (conversation?.name) return conversation.name;
  if (participant?.name) return participant.name;
  if (conversation?.participants && conversation.participants.length > 0) {
    const names = conversation.participants.filter((p) => !p.isCurrentUser).map((p) => p.name);
    if (names.length <= 2) return names.join(" & ");
    return `${names[0]} and ${names.length - 1} others`;
  }
  return "Conversation";
}
function getConversationSubtitle(conversation, participant, showOnlineStatus) {
  if (participant) {
    if (showOnlineStatus && participant.isOnline) {
      return "Online";
    }
    if (participant.lastSeen) {
      const lastSeen = new Date(participant.lastSeen);
      return `Last seen ${formatLastSeen(lastSeen)}`;
    }
    if (participant.phoneNumber) {
      return participant.phoneNumber;
    }
  }
  if (conversation?.type === "group" && conversation.participants) {
    return `${conversation.participants.length} participants`;
  }
  return void 0;
}
function formatLastSeen(date) {
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1e3 * 60));
  const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
var ConversationHeader = React14.forwardRef(
  ({
    className,
    size,
    conversation,
    title,
    subtitle,
    avatarUrl,
    participant,
    showOnlineStatus = true,
    showBackButton = false,
    onBack,
    actions,
    leftContent,
    rightContent,
    ...props
  }, ref) => {
    const displayTitle = title || getConversationTitle(conversation, participant);
    const displaySubtitle = subtitle || getConversationSubtitle(conversation, participant, showOnlineStatus);
    const displayAvatar = avatarUrl || conversation?.avatarUrl || participant?.avatarUrl;
    const isOnline = participant?.isOnline;
    return /* @__PURE__ */ jsxs(
      "header",
      {
        ref,
        className: cn(headerVariants({ size }), className),
        ...props,
        children: [
          leftContent || showBackButton && onBack && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onBack,
              className: cn(
                "-ml-2 rounded-full p-2",
                "text-neutral-500 hover:text-neutral-700",
                "dark:text-neutral-400 dark:hover:text-neutral-200",
                "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                "focus:ring-primary-500 focus:ring-2 focus:outline-none",
                "transition-colors"
              ),
              "aria-label": "Go back",
              children: /* @__PURE__ */ jsx(
                "svg",
                {
                  className: "h-5 w-5",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  children: /* @__PURE__ */ jsx(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: 2,
                      d: "M15 19l-7-7 7-7"
                    }
                  )
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-primary-800 font-medium text-white"
                ),
                children: displayAvatar ? /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: displayAvatar,
                    alt: displayTitle,
                    className: "h-full w-full rounded-full object-cover"
                  }
                ) : displayTitle.charAt(0).toUpperCase()
              }
            ),
            showOnlineStatus && isOnline && /* @__PURE__ */ jsx(
              "span",
              {
                className: cn(
                  "absolute right-0 bottom-0",
                  "h-3 w-3 rounded-full",
                  "bg-green-500 ring-2 ring-white dark:ring-neutral-900"
                ),
                "aria-label": "Online"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("h2", { className: "truncate font-semibold text-neutral-900 dark:text-neutral-100", children: displayTitle }),
            displaySubtitle && /* @__PURE__ */ jsx(
              "p",
              {
                className: cn(
                  "truncate text-sm",
                  isOnline ? "text-green-600 dark:text-green-400" : "text-neutral-500 dark:text-neutral-400"
                ),
                children: displaySubtitle
              }
            )
          ] }),
          rightContent || actions && /* @__PURE__ */ jsx("div", { className: "flex shrink-0 items-center gap-1", children: actions })
        ]
      }
    );
  }
);
ConversationHeader.displayName = "ConversationHeader";
var ConversationListItem = React14.forwardRef(({ className, conversation, isSelected, onSelect, ...props }, ref) => {
  const participant = conversation.participants.find((p) => !p.isCurrentUser);
  const title = getConversationTitle(conversation, participant);
  const avatarUrl = conversation.avatarUrl || participant?.avatarUrl;
  const lastMessage = conversation.lastMessage;
  const isUnread = conversation.unreadCount > 0;
  const formatTime3 = (timestamp) => {
    const date = new Date(timestamp);
    const now = /* @__PURE__ */ new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString(void 0, {
        hour: "numeric",
        minute: "2-digit"
      });
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    return date.toLocaleDateString(void 0, {
      month: "short",
      day: "numeric"
    });
  };
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ref,
      type: "button",
      onClick: () => onSelect?.(conversation),
      className: cn(
        "flex w-full items-center gap-3 px-4 py-3",
        "text-left transition-colors",
        isSelected ? "bg-primary-50 dark:bg-primary-900/20" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
        "focus:bg-neutral-50 focus:outline-none dark:focus:bg-neutral-800/50",
        className
      ),
      "aria-current": isSelected ? "true" : void 0,
      ...props,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                "bg-primary-800 font-medium text-white"
              ),
              children: avatarUrl ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: avatarUrl,
                  alt: title,
                  className: "h-full w-full rounded-full object-cover"
                }
              ) : title.charAt(0).toUpperCase()
            }
          ),
          participant?.isOnline && /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "absolute right-0 bottom-0",
                "h-3 w-3 rounded-full",
                "bg-green-500 ring-2 ring-white dark:ring-neutral-900"
              )
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx(
              "h3",
              {
                className: cn(
                  "truncate text-sm",
                  isUnread ? "font-semibold text-neutral-900 dark:text-neutral-100" : "font-medium text-neutral-700 dark:text-neutral-300"
                ),
                children: title
              }
            ),
            lastMessage && /* @__PURE__ */ jsx("span", { className: "shrink-0 text-xs text-neutral-500 dark:text-neutral-400", children: formatTime3(lastMessage.timestamp) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx(
              "p",
              {
                className: cn(
                  "truncate text-sm",
                  isUnread ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-500 dark:text-neutral-400"
                ),
                children: lastMessage?.content || "No messages yet"
              }
            ),
            isUnread && /* @__PURE__ */ jsx(
              "span",
              {
                className: cn(
                  "flex shrink-0 items-center justify-center",
                  "h-5 min-w-[20px] rounded-full px-1.5",
                  "bg-primary-600 text-xs font-medium text-white"
                ),
                children: conversation.unreadCount > 99 ? "99+" : conversation.unreadCount
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 flex-col items-center gap-1", children: [
          conversation.isPinned && /* @__PURE__ */ jsx(
            "svg",
            {
              className: "text-primary-500 h-4 w-4",
              fill: "currentColor",
              viewBox: "0 0 24 24",
              children: /* @__PURE__ */ jsx("path", { d: "M16 4v8l2 2v2h-6v6l-1 1-1-1v-6H4v-2l2-2V4c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2z" })
            }
          ),
          conversation.isMuted && /* @__PURE__ */ jsxs(
            "svg",
            {
              className: "h-4 w-4 text-neutral-400",
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              children: [
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  }
                )
              ]
            }
          )
        ] })
      ]
    }
  );
});
ConversationListItem.displayName = "ConversationListItem";
function ConversationListSkeleton({
  count = 5,
  className
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "divide-y divide-neutral-200 dark:divide-neutral-700",
        className
      ),
      children: Array.from({ length: count }).map((_, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center gap-3 px-4 py-3",
          "aria-hidden": "true",
          children: [
            /* @__PURE__ */ jsx("div", { className: "h-12 w-12 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
              /* @__PURE__ */ jsx("div", { className: "h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" }),
              /* @__PURE__ */ jsx("div", { className: "h-3 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" })
            ] })
          ]
        },
        i
      ))
    }
  );
}
ConversationListSkeleton.displayName = "ConversationListSkeleton";
function LightboxModal({ attachment, onClose }) {
  React14.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (attachment) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [attachment, onClose]);
  if (!attachment) return null;
  const isImage = attachment.type === "image";
  const isVideo = attachment.type === "video";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("fixed inset-0 z-50", "flex items-center justify-center"),
      role: "dialog",
      "aria-modal": "true",
      "aria-label": `View ${attachment.filename}`,
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "absolute inset-0 cursor-default bg-black/90",
            onClick: onClose,
            "aria-label": "Close lightbox"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: cn(
              "absolute top-4 right-4 z-10",
              "rounded-full p-2",
              "bg-white/10 text-white",
              "hover:bg-white/20",
              "focus:ring-2 focus:ring-white focus:outline-none",
              "transition-colors"
            ),
            "aria-label": "Close",
            children: /* @__PURE__ */ jsx(
              "svg",
              {
                className: "h-6 w-6",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M6 18L18 6M6 6l12 12"
                  }
                )
              }
            )
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-h-[90vh] max-w-[90vw]", children: [
          isImage && /* @__PURE__ */ jsx(
            "img",
            {
              src: attachment.url,
              alt: attachment.alt || attachment.filename,
              className: "max-h-[90vh] max-w-[90vw] object-contain"
            }
          ),
          isVideo && /* @__PURE__ */ jsx(
            "video",
            {
              src: attachment.url,
              controls: true,
              autoPlay: true,
              className: "max-h-[90vh] max-w-[90vw]",
              children: /* @__PURE__ */ jsx("track", { kind: "captions" })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-4 left-1/2 -translate-x-1/2", children: /* @__PURE__ */ jsx("p", { className: "rounded-full bg-black/50 px-4 py-2 text-sm text-white", children: attachment.filename }) })
      ]
    }
  );
}
LightboxModal.displayName = "LightboxModal";
var MessageThread = React14.forwardRef(
  ({
    conversation,
    messages,
    currentUser,
    typingState,
    isLoading = false,
    hasMore = false,
    isLoadingMore = false,
    isSending = false,
    eventHandlers = {},
    showHeader = true,
    showBackButton = false,
    onBack,
    headerActions,
    placeholder = "Type a message...",
    maxMessageLength = 1600,
    showCharacterCount = false,
    showAttachmentPicker = true,
    showCameraButton = false,
    acceptedFileTypes,
    maxFileSize,
    maxAttachments,
    showAvatars = true,
    showSenderNames = false,
    groupByDate = true,
    emptyState,
    formatTimestamp,
    onError,
    className
  }, ref) => {
    const [lightboxAttachment, setLightboxAttachment] = React14.useState(null);
    const [replyTo, setReplyTo] = React14.useState(null);
    const participant = conversation?.type === "direct" ? conversation.participants.find((p) => p.id !== currentUser.id) : void 0;
    const handleAttachmentClick = (attachment, message) => {
      if (attachment.type === "image" || attachment.type === "video") {
        setLightboxAttachment(attachment);
      }
      eventHandlers.onAttachmentClick?.(attachment, message);
    };
    const handleSendMessage = async (newMessage) => {
      const messageWithReply = {
        ...newMessage,
        replyToId: replyTo?.id || newMessage.replyToId
      };
      setReplyTo(null);
      await eventHandlers.onSendMessage?.(messageWithReply);
    };
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        className: cn(
          "flex h-full flex-col",
          "bg-white dark:bg-neutral-900",
          className
        ),
        children: [
          showHeader && /* @__PURE__ */ jsx(
            ConversationHeader,
            {
              conversation,
              participant,
              showBackButton,
              onBack,
              actions: headerActions
            }
          ),
          /* @__PURE__ */ jsx(
            DragDropZone,
            {
              onFilesDropped: () => {
                onError?.("Drop files on the composer to attach them");
              },
              disabled: !showAttachmentPicker,
              className: "flex-1 overflow-hidden",
              children: /* @__PURE__ */ jsx(
                MessageList,
                {
                  messages,
                  currentUser,
                  isLoading,
                  hasMore,
                  isLoadingMore,
                  typingState,
                  showAvatars,
                  showSenderNames,
                  groupByDate,
                  onLoadMore: eventHandlers.onLoadMore,
                  onRetryMessage: eventHandlers.onRetryMessage,
                  onAttachmentClick: handleAttachmentClick,
                  emptyState,
                  formatTimestamp,
                  className: "h-full"
                }
              )
            }
          ),
          /* @__PURE__ */ jsx(
            MessageComposer,
            {
              onSend: handleSendMessage,
              onTypingStart: eventHandlers.onTypingStart,
              onTypingStop: eventHandlers.onTypingStop,
              placeholder,
              maxLength: maxMessageLength,
              showCharacterCount,
              isSending,
              showAttachmentPicker,
              showCameraButton,
              acceptedFileTypes,
              maxFileSize,
              maxAttachments,
              onError,
              replyTo,
              onCancelReply: () => setReplyTo(null)
            }
          ),
          /* @__PURE__ */ jsx(
            LightboxModal,
            {
              attachment: lightboxAttachment,
              onClose: () => setLightboxAttachment(null)
            }
          )
        ]
      }
    );
  }
);
MessageThread.displayName = "MessageThread";
function MessagingSplitView({
  conversationList,
  messageThread,
  hasSelectedConversation = false,
  listWidth = 320,
  mobileBreakpoint = "md",
  className
}) {
  const breakpointClasses = {
    sm: "sm:flex",
    md: "md:flex",
    lg: "lg:flex"
  };
  const hideMobileClasses = {
    sm: hasSelectedConversation ? "hidden sm:block" : "block sm:block",
    md: hasSelectedConversation ? "hidden md:block" : "block md:block",
    lg: hasSelectedConversation ? "hidden lg:block" : "block lg:block"
  };
  const showMobileClasses = {
    sm: hasSelectedConversation ? "block sm:block" : "hidden sm:block",
    md: hasSelectedConversation ? "block md:block" : "hidden md:block",
    lg: hasSelectedConversation ? "block lg:block" : "hidden lg:block"
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "h-full w-full",
        breakpointClasses[mobileBreakpoint],
        className
      ),
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "h-full w-full flex-shrink-0",
              "border-r border-neutral-200 dark:border-neutral-700",
              hideMobileClasses[mobileBreakpoint]
            ),
            style: {
              width: typeof listWidth === "number" ? `${listWidth}px` : listWidth
            },
            children: conversationList
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "h-full min-w-0 flex-1",
              showMobileClasses[mobileBreakpoint]
            ),
            children: messageThread
          }
        )
      ]
    }
  );
}
MessagingSplitView.displayName = "MessagingSplitView";
function useMessages(options) {
  const {
    initialMessages = [],
    currentUser,
    onSend,
    onRetry,
    onLoadMore
  } = options;
  const [messages, setMessages] = React14.useState(initialMessages);
  const [isSending, setIsSending] = React14.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React14.useState(false);
  React14.useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);
  const addMessage = React14.useCallback((message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);
  const updateMessage = React14.useCallback(
    (messageId, updates) => {
      setMessages(
        (prev) => prev.map((m) => m.id === messageId ? { ...m, ...updates } : m)
      );
    },
    []
  );
  const removeMessage = React14.useCallback((messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);
  const updateStatus = React14.useCallback(
    (messageId, status) => {
      updateMessage(messageId, { status });
    },
    [updateMessage]
  );
  const markAsRead = React14.useCallback(
    (messageId) => {
      updateStatus(messageId, "read");
    },
    [updateStatus]
  );
  const sendMessage = React14.useCallback(
    async (newMessage) => {
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        type: "text",
        content: newMessage.content,
        sender: currentUser,
        timestamp: /* @__PURE__ */ new Date(),
        status: "sending",
        attachments: []
        // Would handle attachment uploads here
      };
      addMessage(optimisticMessage);
      setIsSending(true);
      try {
        if (onSend) {
          const sentMessage = await onSend(newMessage);
          setMessages(
            (prev) => prev.map((m) => m.id === optimisticId ? sentMessage : m)
          );
        } else {
          updateStatus(optimisticId, "sent");
        }
      } catch {
        updateStatus(optimisticId, "failed");
      } finally {
        setIsSending(false);
      }
    },
    [currentUser, onSend, addMessage, updateStatus]
  );
  const retryMessage = React14.useCallback(
    async (messageId) => {
      updateStatus(messageId, "sending");
      try {
        if (onRetry) {
          await onRetry(messageId);
          updateStatus(messageId, "sent");
        }
      } catch {
        updateStatus(messageId, "failed");
      }
    },
    [onRetry, updateStatus]
  );
  const loadMore = React14.useCallback(async () => {
    if (isLoadingMore || !onLoadMore) return;
    setIsLoadingMore(true);
    try {
      const olderMessages = await onLoadMore();
      setMessages((prev) => [...olderMessages, ...prev]);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, onLoadMore]);
  return {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
    sendMessage,
    retryMessage,
    loadMore,
    isSending,
    isLoadingMore,
    markAsRead,
    updateStatus
  };
}
function useTypingIndicator(options = {}) {
  const {
    typingParticipants: initialParticipants = [],
    debounceTime = 2e3,
    onTypingStart,
    onTypingStop
  } = options;
  const [participants, setParticipants] = React14.useState(initialParticipants);
  const [isLocalTyping, setIsLocalTyping] = React14.useState(false);
  const typingTimeoutRef = React14.useRef(null);
  React14.useEffect(() => {
    setParticipants(initialParticipants);
  }, [initialParticipants]);
  const startTyping = React14.useCallback(() => {
    if (!isLocalTyping) {
      setIsLocalTyping(true);
      onTypingStart?.();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsLocalTyping(false);
      onTypingStop?.();
    }, debounceTime);
  }, [isLocalTyping, debounceTime, onTypingStart, onTypingStop]);
  const stopTyping = React14.useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsLocalTyping(false);
    onTypingStop?.();
  }, [onTypingStop]);
  React14.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  const typingState = React14.useMemo(
    () => ({
      participants,
      lastUpdated: /* @__PURE__ */ new Date()
    }),
    [participants]
  );
  return {
    typingState,
    startTyping,
    stopTyping,
    setTypingParticipants: setParticipants
  };
}
function useMessageScroll(options) {
  const { messages, currentUserId, threshold = 100 } = options;
  const scrollContainerRef = React14.useRef(null);
  const bottomRef = React14.useRef(null);
  const [isScrolledUp, setIsScrolledUp] = React14.useState(false);
  const prevMessageCountRef = React14.useRef(messages.length);
  React14.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < threshold;
      setIsScrolledUp(!isAtBottom);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [threshold]);
  const scrollToBottom = React14.useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto"
    });
  }, []);
  React14.useEffect(() => {
    const messageCountChanged = messages.length !== prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    if (!messageCountChanged) return;
    const lastMessage = messages[messages.length - 1];
    const isOutgoing = lastMessage?.sender.id === currentUserId;
    if (isOutgoing || !isScrolledUp) {
      scrollToBottom(true);
    }
  }, [messages, currentUserId, isScrolledUp, scrollToBottom]);
  return {
    scrollContainerRef,
    bottomRef,
    isScrolledUp,
    scrollToBottom
  };
}
function useReadReceipts(options) {
  const { currentUserId, onMarkRead, threshold = 0.5 } = options;
  const observerRef = React14.useRef(null);
  const observedMessagesRef = React14.useRef(/* @__PURE__ */ new Set());
  React14.useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id");
            if (messageId && !observedMessagesRef.current.has(messageId)) {
              observedMessagesRef.current.add(messageId);
              onMarkRead?.(messageId);
            }
          }
        });
      },
      { threshold }
    );
    return () => {
      observerRef.current?.disconnect();
    };
  }, [onMarkRead, threshold]);
  const observeMessage = React14.useCallback(
    (element, message) => {
      if (!element || !observerRef.current) return;
      if (message.sender.id !== currentUserId && message.status !== "read" && !observedMessagesRef.current.has(message.id)) {
        element.setAttribute("data-message-id", message.id);
        observerRef.current.observe(element);
      }
    },
    [currentUserId]
  );
  return { observeMessage };
}
var SidebarContext = createContext(null);
function SidebarProvider({
  children,
  defaultCollapsed = false,
  storageKey = "sidebar-collapsed",
  persistCollapsed = true,
  defaultExpandedGroup = null,
  mobileBreakpoint = "(max-width: 1023px)"
}) {
  const isMobileViewport = useMediaQuery(mobileBreakpoint);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined" && persistCollapsed) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === "true";
      }
    }
    return defaultCollapsed;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(
    defaultExpandedGroup
  );
  useEffect(() => {
    if (persistCollapsed && typeof window !== "undefined") {
      localStorage.setItem(storageKey, String(isCollapsed));
    }
  }, [isCollapsed, persistCollapsed, storageKey]);
  useEffect(() => {
    if (!isMobileViewport && isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [isMobileViewport, isMobileOpen]);
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);
  const setCollapsed = useCallback((collapsed) => {
    setIsCollapsed(collapsed);
  }, []);
  const openMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);
  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);
  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);
  const toggleGroup = useCallback((group) => {
    setExpandedGroup((prev) => prev === group ? null : group);
  }, []);
  const contextValue = useMemo(
    () => ({
      isCollapsed,
      toggleCollapsed,
      setCollapsed,
      isMobileOpen,
      openMobile,
      closeMobile,
      toggleMobile,
      isMobileViewport,
      expandedGroup,
      setExpandedGroup,
      toggleGroup
    }),
    [
      isCollapsed,
      toggleCollapsed,
      setCollapsed,
      isMobileOpen,
      openMobile,
      closeMobile,
      toggleMobile,
      isMobileViewport,
      expandedGroup,
      toggleGroup
    ]
  );
  return /* @__PURE__ */ jsx(SidebarContext.Provider, { value: contextValue, children });
}
function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
var ChevronLeftIcon = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" })
  }
);
var ChevronRightIcon = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" })
  }
);
var ChevronDownIcon = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-3 w-3",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" })
  }
);
var XIcon2 = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M6 18L18 6M6 6l12 12"
      }
    )
  }
);
var MenuIcon = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M4 6h16M4 12h16M4 18h16"
      }
    )
  }
);
var SearchIcon3 = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      }
    )
  }
);
function Sidebar({
  children,
  className,
  expandedWidth = "280px",
  collapsedWidth = "80px",
  style,
  "data-testid": testId = "sidebar"
}) {
  const { isCollapsed, isMobileOpen, closeMobile, isMobileViewport } = useSidebar();
  const width = isMobileViewport ? expandedWidth : isCollapsed ? collapsedWidth : expandedWidth;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    isMobileViewport && isMobileOpen && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-40 bg-black/50 lg:hidden",
        onClick: closeMobile,
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsx(
      "nav",
      {
        "data-testid": testId,
        className: cn(
          "flex h-screen flex-col",
          "border-r border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900",
          "transition-all duration-300 ease-in-out",
          // Mobile positioning
          isMobileViewport && "fixed top-0 left-0 z-50",
          isMobileViewport && (isMobileOpen ? "translate-x-0" : "-translate-x-full"),
          // Desktop positioning
          !isMobileViewport && "relative",
          className
        ),
        style: {
          width,
          minWidth: width,
          ...style
        },
        "aria-label": "Main navigation",
        children
      }
    )
  ] });
}
function SidebarHeader({
  children,
  className,
  showMobileClose = true
}) {
  const { closeMobile, isMobileViewport, isCollapsed } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex items-center border-b border-neutral-200 py-4 dark:border-neutral-700",
        showCollapsed ? "justify-center px-2" : "justify-between px-4",
        className
      ),
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "min-w-0",
              showCollapsed ? "flex justify-center" : "flex-1"
            ),
            children
          }
        ),
        showMobileClose && isMobileViewport && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: closeMobile,
            className: "-mr-2 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800",
            "aria-label": "Close navigation",
            children: /* @__PURE__ */ jsx(XIcon2, {})
          }
        )
      ]
    }
  );
}
function SidebarFooter({
  children,
  className
}) {
  const { isCollapsed, isMobileViewport } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "mt-auto border-t border-neutral-200 py-4 dark:border-neutral-700",
        showCollapsed ? "flex justify-center px-2" : "px-4",
        className
      ),
      children
    }
  );
}
function SidebarContent({
  children,
  className
}) {
  return /* @__PURE__ */ jsx("div", { className: cn("flex-1 overflow-y-auto py-4", className), children });
}
function SidebarNav({
  children,
  className
}) {
  return /* @__PURE__ */ jsx("nav", { className: cn("space-y-1 px-2", className), children });
}
function SidebarNavGroup({
  label,
  icon,
  children,
  defaultExpanded = false,
  groupId,
  className
}) {
  const { isCollapsed, isMobileViewport, expandedGroup, toggleGroup } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;
  const isExpanded = groupId ? expandedGroup === groupId : defaultExpanded;
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const effectiveExpanded = groupId ? isExpanded : localExpanded;
  const handleToggle = useCallback(() => {
    if (groupId) {
      toggleGroup(groupId);
    } else {
      setLocalExpanded((prev) => !prev);
    }
  }, [groupId, toggleGroup]);
  return /* @__PURE__ */ jsxs("div", { className: cn("mb-2", className), children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: handleToggle,
        className: cn(
          "flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold",
          "text-neutral-700 dark:text-neutral-300",
          "transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
          showCollapsed && "justify-center"
        ),
        title: showCollapsed ? label : void 0,
        children: [
          icon && /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400",
                !showCollapsed && "mr-3"
              ),
              children: icon
            }
          ),
          !showCollapsed && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "flex-1 truncate text-left", children: label }),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: cn(
                  "ml-2 flex-shrink-0 transition-transform duration-200",
                  effectiveExpanded && "rotate-180"
                ),
                children: /* @__PURE__ */ jsx(ChevronDownIcon, {})
              }
            )
          ] })
        ]
      }
    ),
    !showCollapsed && /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "overflow-hidden transition-all duration-300",
          effectiveExpanded ? "mt-1 max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        ),
        children: /* @__PURE__ */ jsx("div", { className: "pl-2", children })
      }
    )
  ] });
}
function SidebarNavItem({
  label,
  icon,
  isActive = false,
  onClick,
  href,
  badge,
  disabled = false,
  className,
  "data-testid": testId
}) {
  const { isCollapsed, isMobileViewport, closeMobile } = useSidebar();
  const showCollapsed = !isMobileViewport && isCollapsed;
  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick?.();
    if (isMobileViewport) {
      closeMobile();
    }
  }, [disabled, onClick, isMobileViewport, closeMobile]);
  const content = /* @__PURE__ */ jsxs(Fragment, { children: [
    icon && /* @__PURE__ */ jsx(
      "span",
      {
        className: cn(
          "h-5 w-5 flex-shrink-0",
          isActive ? "text-primary-600 dark:text-primary-400" : "text-neutral-500 dark:text-neutral-400",
          !showCollapsed && "mr-3"
        ),
        children: icon
      }
    ),
    !showCollapsed && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("span", { className: "flex-1 truncate text-left", children: label }),
      badge && /* @__PURE__ */ jsx(
        "span",
        {
          className: cn(
            "ml-2 rounded-full px-2 py-0.5 text-xs font-medium",
            isActive ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
          ),
          children: badge
        }
      )
    ] })
  ] });
  const baseClasses = cn(
    "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
    isActive ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
    disabled && "opacity-50 cursor-not-allowed",
    showCollapsed && "justify-center",
    className
  );
  if (href && !disabled) {
    return /* @__PURE__ */ jsx(
      "a",
      {
        href,
        onClick: handleClick,
        "data-testid": testId,
        className: baseClasses,
        title: showCollapsed ? label : void 0,
        children: content
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: handleClick,
      disabled,
      "data-testid": testId,
      className: baseClasses,
      title: showCollapsed ? label : void 0,
      children: content
    }
  );
}
function SidebarToggle({
  className,
  position = "inline"
}) {
  const { isCollapsed, toggleCollapsed, isMobileViewport } = useSidebar();
  if (isMobileViewport) return /* @__PURE__ */ jsx(Fragment, {});
  const button = /* @__PURE__ */ jsx(
    "button",
    {
      onClick: toggleCollapsed,
      className: cn(
        "rounded-lg p-2 text-neutral-500 dark:text-neutral-400",
        "transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
        "focus:ring-primary-500 focus:ring-2 focus:outline-none",
        className
      ),
      "aria-label": isCollapsed ? "Expand sidebar" : "Collapse sidebar",
      children: isCollapsed ? /* @__PURE__ */ jsx(ChevronRightIcon, {}) : /* @__PURE__ */ jsx(ChevronLeftIcon, {})
    }
  );
  if (position === "floating") {
    return /* @__PURE__ */ jsx("div", { className: "absolute top-6 -right-3 z-10 rounded-full border border-neutral-200 bg-white shadow-md dark:border-neutral-700 dark:bg-neutral-900", children: button });
  }
  return button;
}
function SidebarMobileToggle({
  className,
  icon
}) {
  const { openMobile, isMobileViewport } = useSidebar();
  if (!isMobileViewport) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: openMobile,
      className: cn(
        "rounded-lg p-2 text-neutral-500 dark:text-neutral-400",
        "transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
        "focus:ring-primary-500 focus:ring-2 focus:outline-none",
        className
      ),
      "aria-label": "Open navigation",
      children: icon ?? /* @__PURE__ */ jsx(MenuIcon, {})
    }
  );
}
function SidebarSearch({
  value,
  onChange,
  placeholder = "Search...",
  shortcutHint = "/",
  className,
  "data-testid": testId = "sidebar-search"
}) {
  const { isCollapsed, isMobileViewport, setCollapsed } = useSidebar();
  const inputRef = useRef(null);
  const showCollapsed = !isMobileViewport && isCollapsed;
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        if (showCollapsed) {
          setCollapsed(false);
          setTimeout(() => inputRef.current?.focus(), 350);
        } else {
          inputRef.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showCollapsed, setCollapsed]);
  if (showCollapsed) return /* @__PURE__ */ jsx(Fragment, {});
  return /* @__PURE__ */ jsx("div", { className: cn("px-3 py-2", className), children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400", children: /* @__PURE__ */ jsx(SearchIcon3, {}) }),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "text",
        value,
        onChange: (e) => onChange(e.target.value),
        placeholder: `${placeholder} (${shortcutHint})`,
        "data-testid": testId,
        className: cn(
          "w-full rounded-lg py-2 pr-4 pl-10 text-sm",
          "border-transparent bg-neutral-100 dark:bg-neutral-800",
          "text-neutral-900 placeholder-neutral-400 dark:text-white dark:placeholder-neutral-500",
          "focus:ring-primary-500 focus:bg-white focus:ring-2 focus:outline-none dark:focus:bg-neutral-700",
          "transition-colors"
        )
      }
    )
  ] }) });
}
var CheckIcon = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" })
  }
);
var XCircleIcon = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      }
    )
  }
);
var ExclamationIcon = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      }
    )
  }
);
var InfoIcon = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      }
    )
  }
);
var XIcon3 = () => /* @__PURE__ */ jsx(
  "svg",
  {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M6 18L18 6M6 6l12 12"
      }
    )
  }
);
var variantStyles = {
  success: {
    container: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    icon: "text-green-500 dark:text-green-400"
  },
  error: {
    container: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    icon: "text-red-500 dark:text-red-400"
  },
  warning: {
    container: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
    icon: "text-amber-500 dark:text-amber-400"
  },
  info: {
    container: "bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200",
    icon: "text-primary-500 dark:text-primary-400"
  }
};
var defaultIcons = {
  success: /* @__PURE__ */ jsx(CheckIcon, {}),
  error: /* @__PURE__ */ jsx(XCircleIcon, {}),
  warning: /* @__PURE__ */ jsx(ExclamationIcon, {}),
  info: /* @__PURE__ */ jsx(InfoIcon, {})
};
function Toast({
  title,
  message,
  variant = "info",
  dismissible = true,
  action,
  icon,
  onClose
}) {
  const styles = variantStyles[variant];
  const displayIcon = icon ?? defaultIcons[variant];
  return /* @__PURE__ */ jsxs(
    "div",
    {
      role: "alert",
      className: cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-lg",
        "max-w-[420px] min-w-[300px]",
        "animate-slide-in-right",
        styles.container
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: cn("flex-shrink-0", styles.icon), children: displayIcon }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          title && /* @__PURE__ */ jsx("p", { className: "mb-1 text-sm font-semibold", children: title }),
          /* @__PURE__ */ jsx("div", { className: "text-sm opacity-90", children: message }),
          action && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: action.onClick,
              className: "mt-2 rounded text-sm font-medium underline hover:no-underline focus:ring-2 focus:ring-current focus:ring-offset-2 focus:outline-none",
              children: action.label
            }
          )
        ] }),
        dismissible && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "flex-shrink-0 rounded p-1 transition-colors hover:bg-black/10 focus:ring-2 focus:ring-current focus:outline-none dark:hover:bg-white/10",
            "aria-label": "Dismiss notification",
            children: /* @__PURE__ */ jsx(XIcon3, {})
          }
        )
      ]
    }
  );
}
var positionStyles = {
  "top-left": "top-4 left-4 items-start",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-4 right-4 items-end"
};
function ToastContainer({
  toasts,
  position = "bottom-right",
  onDismiss
}) {
  if (toasts.length === 0) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "pointer-events-none fixed z-50 flex flex-col gap-2",
        positionStyles[position]
      ),
      "aria-live": "polite",
      "aria-atomic": "true",
      children: toasts.map((toast) => /* @__PURE__ */ jsx("div", { className: "pointer-events-auto", children: /* @__PURE__ */ jsx(Toast, { ...toast, onClose: () => onDismiss(toast.id) }) }, toast.id))
    }
  );
}
var ToastContext = createContext(null);
var toastIdCounter = 0;
function generateToastId() {
  return `toast-${++toastIdCounter}-${Date.now()}`;
}
function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 5e3
}) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => {
    setToasts((prev) => {
      const toast2 = prev.find((t) => t.id === id);
      if (toast2?.onDismiss) {
        toast2.onDismiss();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);
  const dismissAll = useCallback(() => {
    setToasts((prev) => {
      prev.forEach((t) => t.onDismiss?.());
      return [];
    });
  }, []);
  const toast = useCallback(
    (options) => {
      const id = generateToastId();
      const duration = options.duration ?? defaultDuration;
      const newToast = {
        ...options,
        id,
        variant: options.variant ?? "info",
        dismissible: options.dismissible ?? true,
        duration
      };
      setToasts((prev) => {
        const updated = [...prev, newToast];
        if (updated.length > maxToasts) {
          const removed = updated.slice(0, updated.length - maxToasts);
          removed.forEach((t) => t.onDismiss?.());
          return updated.slice(-maxToasts);
        }
        return updated;
      });
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [maxToasts, defaultDuration, dismiss]
  );
  const success = useCallback(
    (message, options) => {
      return toast({ ...options, message, variant: "success" });
    },
    [toast]
  );
  const error = useCallback(
    (message, options) => {
      return toast({
        ...options,
        message,
        variant: "error",
        duration: options?.duration ?? 7e3
        // Errors stay longer by default
      });
    },
    [toast]
  );
  const warning = useCallback(
    (message, options) => {
      return toast({ ...options, message, variant: "warning" });
    },
    [toast]
  );
  const info = useCallback(
    (message, options) => {
      return toast({ ...options, message, variant: "info" });
    },
    [toast]
  );
  const contextValue = useMemo(
    () => ({
      toasts,
      toast,
      success,
      error,
      warning,
      info,
      dismiss,
      dismissAll
    }),
    [toasts, toast, success, error, warning, info, dismiss, dismissAll]
  );
  return /* @__PURE__ */ jsx(ToastContext.Provider, { value: contextValue, children });
}
function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export { AGGrid, AIChat, AIChatModal, AIChatTrigger, AILogoIcon, AIMessageDisplay, AITypingIndicator, AppHeader, AppHeaderActions, AppHeaderDivider, AppHeaderIconButton, AppHeaderSearch, AppHeaderSection, AppHeaderTitle, AppHeaderUserMenu, AttachmentPicker, AttachmentPreview, AttachmentPreviewItem, AvatarNameRenderer, BooleanRenderer, CameraButton, CellRenderers, CharacterCounter, ChevronIcon, CloseIcon, CommandPalette, CommandPaletteProvider, CommandPaletteTrigger, CompanyRenderer, ConversationHeader, ConversationListItem, ConversationListSkeleton, CurrencyRenderer, DateRenderer, DateSeparator, DomainRenderer, DragDropZone, EmailRenderer, EmptyState, EngagementScoreRenderer, FloatingAIChat, LightboxModal, LinkedInRenderer, LoadMoreButton, MCPToolCallDisplay, MemoizedAvatarNameRenderer, MemoizedBooleanRenderer, MemoizedCompanyRenderer, MemoizedCurrencyRenderer, MemoizedDateRenderer, MemoizedDomainRenderer, MemoizedEmailRenderer, MemoizedEngagementScoreRenderer, MemoizedLinkedInRenderer, MemoizedNumberRenderer, MemoizedPhoneRenderer, MemoizedProgressRenderer, MemoizedStatusBadgeRenderer, MemoizedTagsRenderer, MessageAvatar, MessageBubble, MessageComposer, MessageList, MessageStatusIcon, MessageThread, MessagingSplitView, NumberRenderer, PhoneRenderer, ProgressRenderer, ReadReceiptIndicator, RefreshIcon, ResourceLink, SendButton, SendIcon, Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMobileToggle, SidebarNav, SidebarNavGroup, SidebarNavItem, SidebarProvider, SidebarSearch, SidebarToggle, SkeletonMessage, SparklesIcon, SpinnerIcon, StatusBadgeRenderer, SuggestedActions, TagsRenderer, Toast, ToastContainer, ToastProvider, ToolStatusIcon, TypingIndicator, bubbleVariants2 as bubbleVariants, formatDateLabel, formatFileSize2 as formatFileSize, formatLastSeen, formatPhoneDisplay, generateAttachmentId, getConversationSubtitle, getConversationTitle, getFileType, getToolIcon, groupMessagesByDate, headerVariants, isSameSenderGroup, sendButtonVariants, statusColors, useCommandPalette, useMessageScroll, useMessages, useReadReceipts, useSidebar, useToast, useTypingIndicator, validateFile };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map