export { brands } from './chunk-CND4MR3I.js';
export { createBrandPreset, generateBrandCSS, generateTailwindTheme } from './chunk-SOFX4T7M.js';
export { bluehiveBrand } from './chunk-ULOA7WBW.js';
export { defaultBrand } from './chunk-4LTN2LEN.js';
export { enterpriseHealthBrand } from './chunk-MTZPVOP6.js';
export { miewebBrand } from './chunk-UHSPAFY6.js';
export { wagglelineBrand } from './chunk-OWPWP46L.js';
export { webchartBrand } from './chunk-C6MDPPPL.js';
export { Switch, switchThumbVariants, switchTrackVariants } from './chunk-TTSLBOAO.js';
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './chunk-AWIULTJW.js';
export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants, tabsTriggerVariants } from './chunk-AL3FB3Q5.js';
export { SmallMuted, Text, textVariants } from './chunk-RCMF6KZA.js';
export { Textarea, textareaVariants } from './chunk-4AWW5WPF.js';
export { ThemeProvider, ThemeProviderContext, ThemeToggle, themeToggleIconVariants, themeToggleVariants, useThemeContext } from './chunk-TA6FVVCM.js';
export { Tooltip } from './chunk-UZUBLXVC.js';
export { VisuallyHidden } from './chunk-H2CIKJQI.js';
export { PhoneInput } from './chunk-J23CSBQG.js';
export { CircularProgress, Progress, circularProgressVariants, progressBarFillVariants, progressBarTrackVariants } from './chunk-4MHTSFPX.js';
export { QuickAction, QuickActionGroup, QuickActionIcons, quickActionIconVariants, quickActionVariants } from './chunk-BAZHMCLV.js';
export { Radio, RadioGroup, radioVariants } from './chunk-BC7YQKHJ.js';
export { DateButton, DatePicker, RadioOption, SchedulePicker, TimeButton, TimePicker, dateButtonVariants, radioOptionVariants, timeButtonVariants } from './chunk-ROTSYQJW.js';
export { Select, selectTriggerVariants } from './chunk-KJOFWJHV.js';
export { Skeleton, SkeletonCard, SkeletonTable, SkeletonText, skeletonVariants } from './chunk-6OCIIIAI.js';
export { FullPageSpinner, Spinner, SpinnerWithLabel, spinnerVariants } from './chunk-GV5JQBPX.js';
export { Button, buttonVariants } from './chunk-XMPYXAEJ.js';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants } from './chunk-XVNFVSOS.js';
export { Checkbox, CheckboxGroup, checkboxVariants } from './chunk-VW7ZJHOM.js';
export { DateInput } from './chunk-HK4M7Z6D.js';
export { Dropdown, DropdownContent, DropdownHeader, DropdownItem, DropdownLabel, DropdownSeparator } from './chunk-265CFCCX.js';
export { Input, inputVariants } from './chunk-LIYX5CYL.js';
export { Modal, ModalBody, ModalClose, ModalFooter, ModalHeader, ModalTitle, modalContentVariants, modalOverlayVariants } from './chunk-D5IBXXF2.js';
export { Pagination, SimplePagination, paginationButtonVariants } from './chunk-ONWOB76P.js';
import { useCommandK, useMediaQuery } from './chunk-SMSIXPEE.js';
export { useCommandK, useIsDesktop, useIsLargeDesktop, useIsMobile, useIsMobileOrTablet, useIsSmallTablet, useIsTablet, useKeyboardShortcut, useMediaQuery } from './chunk-SMSIXPEE.js';
export { useTheme } from './chunk-KJZNEVYM.js';
export { usePrefersReducedMotion } from './chunk-HB7C7NB5.js';
import { useClickOutside } from './chunk-OT36EMM5.js';
export { useClickOutside } from './chunk-OT36EMM5.js';
export { useFocusTrap } from './chunk-CLNOI5J7.js';
import { useEscapeKey } from './chunk-T4ME7QCT.js';
export { useEscapeKey } from './chunk-T4ME7QCT.js';
import './chunk-ZQ4XMJH7.js';
export { formatPhoneNumber, isPhoneNumberEmpty, isValidPhoneNumber, unformatPhoneNumber } from './chunk-CEHWXAAI.js';
export { calculateAge, formatDateValue, isDateEmpty, isDateInFuture, isDateInPast, isValidDate, isValidDrivingAge, parseDateValue } from './chunk-SN52QMRT.js';
export { miewebUIPreset, miewebUISafelist } from './chunk-JNFJAZT5.js';
export { Alert, AlertDescription, AlertTitle, alertVariants } from './chunk-KOHBAPLC.js';
export { Avatar, AvatarGroup, avatarVariants, getInitials } from './chunk-4XWG5RKH.js';
export { Badge, badgeVariants } from './chunk-H7OGAIAK.js';
export { Breadcrumb, BreadcrumbSlash } from './chunk-B3L43JGH.js';
import { cn } from './chunk-F3SOEIN2.js';
export { cn } from './chunk-F3SOEIN2.js';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import React, { createContext, useState, useCallback, useMemo, useContext, useRef, useEffect } from 'react';

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
    /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold text-gray-900 dark:text-white truncate", children }),
    subtitle && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 truncate", children: subtitle })
  ] });
}
function AppHeaderActions({ children, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("flex items-center gap-2", className), children });
}
function AppHeaderDivider({ className }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn("w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2", className),
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
        "relative p-2 rounded-lg transition-colors",
        "text-gray-500 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus:outline-none focus:ring-2 focus:ring-primary-500",
        isActive && "bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400",
        className
      ),
      "aria-label": label,
      title: label,
      children: [
        /* @__PURE__ */ jsx("span", { className: "w-5 h-5", children: icon }),
        typeof badge === "number" && badge > 0 && /* @__PURE__ */ jsx(
          "span",
          {
            className: cn(
              "absolute -top-1 -right-1 flex items-center justify-center",
              "min-w-[18px] h-[18px] px-1 text-[10px] font-bold",
              "bg-red-500 text-white rounded-full"
            ),
            children: badge > 99 ? "99+" : badge
          }
        )
      ]
    }
  );
}
var SearchIcon = () => /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx(
  "path",
  {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
  }
) });
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
        "bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-500 dark:text-gray-400",
        "hover:border-gray-400 dark:hover:border-gray-500",
        "hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors",
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
              "hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5",
              "bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500",
              "text-xs text-gray-500 dark:text-gray-300 flex-shrink-0"
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
        "flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus:outline-none focus:ring-2 focus:ring-primary-500",
        isOpen && "bg-gray-100 dark:bg-gray-800",
        className
      ),
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "w-8 h-8 rounded-full flex items-center justify-center overflow-hidden",
              "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm font-medium"
            ),
            children: avatarUrl ? /* @__PURE__ */ jsx("img", { src: avatarUrl, alt: name, className: "w-full h-full object-cover" }) : displayInitials
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "hidden lg:block text-left min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]", children: name }),
          email && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]", children: email })
        ] }),
        /* @__PURE__ */ jsx(
          "svg",
          {
            className: cn(
              "w-4 h-4 text-gray-400 transition-transform hidden lg:block",
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
var CommandPaletteContext = createContext(null);
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
  React.useEffect(() => {
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
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return context;
}
var SearchIcon2 = () => /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx(
  "path",
  {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
  }
) });
var XIcon = () => /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) });
var SpinnerIcon = () => /* @__PURE__ */ jsxs("svg", { className: "w-4 h-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
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
          setSelectedIndex(Math.min(selectedIndex + 1, filteredItems.length - 1));
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
        className: "fixed inset-0 bg-black/50 dark:bg-black/70 z-50 backdrop-blur-sm",
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-x-0 top-20 z-50 mx-auto max-w-2xl px-4", children: /* @__PURE__ */ jsxs(
      "div",
      {
        ref: containerRef,
        "data-testid": testId,
        className: cn(
          "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700",
          "shadow-2xl overflow-hidden",
          className
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "relative border-b border-gray-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400", children: /* @__PURE__ */ jsx(SearchIcon2, {}) }),
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
                  "w-full py-4 pl-12 pr-12 text-base bg-transparent",
                  "focus:outline-none dark:text-white dark:placeholder-gray-400"
                )
              }
            ),
            query && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setQuery(""),
                "data-testid": `${testId}-clear`,
                className: "absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                children: /* @__PURE__ */ jsx(XIcon, {})
              }
            ),
            isLoading && /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-primary-500", children: /* @__PURE__ */ jsx(SpinnerIcon, {}) })
          ] }),
          categories.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setActiveCategory(null),
                "data-testid": `${testId}-filter-all`,
                className: cn(
                  "px-2 py-1 text-xs font-medium rounded transition-colors",
                  activeCategory === null ? "bg-primary-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors",
                  activeCategory === cat.id ? "bg-primary-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                ),
                children: [
                  cat.icon && /* @__PURE__ */ jsx("span", { className: "w-3 h-3", children: cat.icon }),
                  cat.label
                ]
              },
              cat.id
            ))
          ] }),
          /* @__PURE__ */ jsx("div", { ref: listRef, className: "overflow-y-auto max-h-[60vh]", children: filteredItems.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-gray-500 dark:text-gray-400", children: emptyState ?? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 mx-auto mb-2 opacity-50", children: /* @__PURE__ */ jsx(SearchIcon2, {}) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: query.trim() ? `No results for "${query}"` : "Start typing to search..." })
          ] }) }) : Array.from(groupedItems.entries()).map(([categoryId, categoryItems]) => {
            const categoryInfo = getCategoryInfo(categoryId);
            return /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: cn(
                    "px-3 py-2 text-xs font-semibold sticky top-0",
                    "text-gray-500 dark:text-gray-400",
                    "bg-gray-50 dark:bg-gray-900/50"
                  ),
                  children: [
                    categoryInfo?.icon && /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: cn(
                          "inline-block w-4 h-4 mr-2 align-middle",
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
                      children: renderItem(item, { isSelected, index: currentIndex })
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
                      "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                      isSelected ? "bg-primary-50 dark:bg-primary-500/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                      item.disabled && "opacity-50 cursor-not-allowed"
                    ),
                    children: [
                      item.icon && /* @__PURE__ */ jsx(
                        "div",
                        {
                          className: cn(
                            "mt-0.5 flex-shrink-0 w-4 h-4",
                            isSelected ? "text-primary-600 dark:text-primary-400" : "text-gray-400"
                          ),
                          children: item.icon
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm text-gray-900 dark:text-white truncate", children: item.label }),
                        item.subtitle && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: item.subtitle }),
                        item.description && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5", children: item.description })
                      ] }),
                      item.shortcut && /* @__PURE__ */ jsx(
                        "kbd",
                        {
                          className: cn(
                            "hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px]",
                            "bg-gray-100 dark:bg-gray-700 rounded border",
                            "border-gray-200 dark:border-gray-600",
                            "text-gray-500 dark:text-gray-400"
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
          }) }),
          footer ?? /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "p-2 border-t border-gray-100 dark:border-gray-700",
                "bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400",
                "flex items-center justify-between"
              ),
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("kbd", { className: "px-1 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600", children: "\u2191\u2193" }),
                  /* @__PURE__ */ jsx("span", { children: "navigate" }),
                  /* @__PURE__ */ jsx("kbd", { className: "px-1 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 ml-2", children: "\u21B5" }),
                  /* @__PURE__ */ jsx("span", { children: "select" }),
                  /* @__PURE__ */ jsx("kbd", { className: "px-1 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 ml-2", children: "esc" }),
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
        "bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400",
        "hover:border-gray-400 dark:hover:border-gray-500",
        "hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors",
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
              "bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500",
              "text-xs text-gray-500 dark:text-gray-300 flex-shrink-0"
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
  const [expandedGroup, setExpandedGroup] = useState(defaultExpandedGroup);
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
var ChevronLeftIcon = () => /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) });
var ChevronRightIcon = () => /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) });
var ChevronDownIcon = () => /* @__PURE__ */ jsx("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) });
var XIcon2 = () => /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) });
var MenuIcon = () => /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 6h16M4 12h16M4 18h16" }) });
var SearchIcon3 = () => /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx(
  "path",
  {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
  }
) });
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
        className: "fixed inset-0 bg-black/50 z-40 lg:hidden",
        onClick: closeMobile,
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsx(
      "aside",
      {
        "data-testid": testId,
        className: cn(
          "flex flex-col h-screen",
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700",
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
        role: "navigation",
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
  const { closeMobile, isMobileViewport } = useSidebar();
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700",
        className
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children }),
        showMobileClose && isMobileViewport && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: closeMobile,
            className: "p-2 -mr-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden",
            "aria-label": "Close navigation",
            children: /* @__PURE__ */ jsx(XIcon2, {})
          }
        )
      ]
    }
  );
}
function SidebarFooter({ children, className }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "mt-auto px-4 py-4 border-t border-gray-200 dark:border-gray-700",
        className
      ),
      children
    }
  );
}
function SidebarContent({ children, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("flex-1 overflow-y-auto py-4", className), children });
}
function SidebarNav({ children, className }) {
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
          "flex items-center w-full px-3 py-2 text-sm font-semibold rounded-lg",
          "text-gray-600 dark:text-gray-400",
          "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
          showCollapsed && "justify-center"
        ),
        title: showCollapsed ? label : void 0,
        children: [
          icon && /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "flex-shrink-0 w-5 h-5",
                !showCollapsed && "mr-3"
              ),
              children: icon
            }
          ),
          !showCollapsed && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "flex-1 text-left truncate", children: label }),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: cn(
                  "flex-shrink-0 ml-2 transition-transform duration-200",
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
          effectiveExpanded ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0"
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
          "flex-shrink-0 w-5 h-5",
          isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-400 dark:text-gray-500",
          !showCollapsed && "mr-3"
        ),
        children: icon
      }
    ),
    !showCollapsed && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: label }),
      badge && /* @__PURE__ */ jsx(
        "span",
        {
          className: cn(
            "ml-2 px-2 py-0.5 text-xs font-medium rounded-full",
            isActive ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          ),
          children: badge
        }
      )
    ] })
  ] });
  const baseClasses = cn(
    "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
    isActive ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
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
        "p-2 rounded-lg text-gray-500 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary-500",
        className
      ),
      "aria-label": isCollapsed ? "Expand sidebar" : "Collapse sidebar",
      children: isCollapsed ? /* @__PURE__ */ jsx(ChevronRightIcon, {}) : /* @__PURE__ */ jsx(ChevronLeftIcon, {})
    }
  );
  if (position === "floating") {
    return /* @__PURE__ */ jsx("div", { className: "absolute -right-3 top-6 z-10 bg-white dark:bg-gray-900 rounded-full shadow-md border border-gray-200 dark:border-gray-700", children: button });
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
        "p-2 rounded-lg text-gray-500 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary-500",
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
    /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", children: /* @__PURE__ */ jsx(SearchIcon3, {}) }),
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
          "w-full py-2 pl-10 pr-4 text-sm rounded-lg",
          "bg-gray-100 dark:bg-gray-800 border-transparent",
          "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-700",
          "transition-colors"
        )
      }
    )
  ] }) });
}
var CheckIcon = () => /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) });
var XCircleIcon = () => /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx(
  "path",
  {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
  }
) });
var ExclamationIcon = () => /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx(
  "path",
  {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
  }
) });
var InfoIcon = () => /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx(
  "path",
  {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
  }
) });
var XIcon3 = () => /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) });
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
    container: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    icon: "text-blue-500 dark:text-blue-400"
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
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg",
        "min-w-[300px] max-w-[420px]",
        "animate-slide-in-right",
        styles.container
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: cn("flex-shrink-0", styles.icon), children: displayIcon }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          title && /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm mb-1", children: title }),
          /* @__PURE__ */ jsx("div", { className: "text-sm opacity-90", children: message }),
          action && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: action.onClick,
              className: "mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded",
              children: action.label
            }
          )
        ] }),
        dismissible && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-current",
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
      className: cn("fixed z-50 flex flex-col gap-2 pointer-events-none", positionStyles[position]),
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

export { AppHeader, AppHeaderActions, AppHeaderDivider, AppHeaderIconButton, AppHeaderSearch, AppHeaderSection, AppHeaderTitle, AppHeaderUserMenu, CommandPalette, CommandPaletteProvider, CommandPaletteTrigger, Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMobileToggle, SidebarNav, SidebarNavGroup, SidebarNavItem, SidebarProvider, SidebarSearch, SidebarToggle, Toast, ToastContainer, ToastProvider, useCommandPalette, useSidebar, useToast };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map