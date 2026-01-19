'use strict';

var chunkUBWTYI3A_cjs = require('./chunk-UBWTYI3A.cjs');
var chunkFFJVCQ5R_cjs = require('./chunk-FFJVCQ5R.cjs');
var chunk4LNS5QDP_cjs = require('./chunk-4LNS5QDP.cjs');
var chunkO5HS7ZND_cjs = require('./chunk-O5HS7ZND.cjs');
var chunkP52GA3GJ_cjs = require('./chunk-P52GA3GJ.cjs');
var chunkS6UNPMAS_cjs = require('./chunk-S6UNPMAS.cjs');
var chunkSWV5E75F_cjs = require('./chunk-SWV5E75F.cjs');
var chunkZ3TFPXVN_cjs = require('./chunk-Z3TFPXVN.cjs');
var chunkEXDNFGI7_cjs = require('./chunk-EXDNFGI7.cjs');
var chunkLZEY55QZ_cjs = require('./chunk-LZEY55QZ.cjs');
var chunkPFPBF3TQ_cjs = require('./chunk-PFPBF3TQ.cjs');
var chunkQDGZBDBI_cjs = require('./chunk-QDGZBDBI.cjs');
var chunkB7YGVKTE_cjs = require('./chunk-B7YGVKTE.cjs');
var chunkVDMQCSXT_cjs = require('./chunk-VDMQCSXT.cjs');
var chunkBXK5TNJE_cjs = require('./chunk-BXK5TNJE.cjs');
var chunkZJCPW6MS_cjs = require('./chunk-ZJCPW6MS.cjs');
var chunkG4IYKDQ2_cjs = require('./chunk-G4IYKDQ2.cjs');
var chunkNAATBUHR_cjs = require('./chunk-NAATBUHR.cjs');
var chunk2QX46LFO_cjs = require('./chunk-2QX46LFO.cjs');
var chunkXZB73CF4_cjs = require('./chunk-XZB73CF4.cjs');
var chunkXNY3NM2W_cjs = require('./chunk-XNY3NM2W.cjs');
var chunkLEE3NMNP_cjs = require('./chunk-LEE3NMNP.cjs');
var chunkN3QTYHRZ_cjs = require('./chunk-N3QTYHRZ.cjs');
var chunkJYMQJ32S_cjs = require('./chunk-JYMQJ32S.cjs');
var chunkYEZJKPEN_cjs = require('./chunk-YEZJKPEN.cjs');
var chunkZENVEUAE_cjs = require('./chunk-ZENVEUAE.cjs');
var chunkL7TTMKLJ_cjs = require('./chunk-L7TTMKLJ.cjs');
var chunkJGADLLQW_cjs = require('./chunk-JGADLLQW.cjs');
var chunkFIXAVBUA_cjs = require('./chunk-FIXAVBUA.cjs');
var chunkDQTQ4AQQ_cjs = require('./chunk-DQTQ4AQQ.cjs');
var chunkNH2JVQ6V_cjs = require('./chunk-NH2JVQ6V.cjs');
var chunkPF3XWKE5_cjs = require('./chunk-PF3XWKE5.cjs');
var chunkR4DM4635_cjs = require('./chunk-R4DM4635.cjs');
var chunk2O7D6F67_cjs = require('./chunk-2O7D6F67.cjs');
var chunk6HFFWEM3_cjs = require('./chunk-6HFFWEM3.cjs');
var chunkSWMRCGL4_cjs = require('./chunk-SWMRCGL4.cjs');
var chunkBR2XGATJ_cjs = require('./chunk-BR2XGATJ.cjs');
var chunkFHY3K6PL_cjs = require('./chunk-FHY3K6PL.cjs');
require('./chunk-ZO46CFVN.cjs');
var chunkBTJHYGPI_cjs = require('./chunk-BTJHYGPI.cjs');
var chunkKMN7JX2X_cjs = require('./chunk-KMN7JX2X.cjs');
var chunkZEFZRYQS_cjs = require('./chunk-ZEFZRYQS.cjs');
var chunkQLLBEUXV_cjs = require('./chunk-QLLBEUXV.cjs');
var chunkUHS53NVJ_cjs = require('./chunk-UHS53NVJ.cjs');
var chunkPA5DHCK4_cjs = require('./chunk-PA5DHCK4.cjs');
var chunkPEFJAWNR_cjs = require('./chunk-PEFJAWNR.cjs');
var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var jsxRuntime = require('react/jsx-runtime');
var React = require('react');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var React__default = /*#__PURE__*/_interopDefault(React);

function AppHeader({
  children,
  className,
  sticky = true,
  bordered = true,
  height = "h-16",
  "data-testid": testId = "app-header"
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "header",
    {
      "data-testid": testId,
      className: chunkOR5DRJCW_cjs.cn(
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: chunkOR5DRJCW_cjs.cn("min-w-0", className), children: [
    /* @__PURE__ */ jsxRuntime.jsx("h1", { className: "truncate text-lg font-semibold text-gray-900 dark:text-white", children }),
    subtitle && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "truncate text-sm text-gray-500 dark:text-gray-400", children: subtitle })
  ] });
}
function AppHeaderActions({
  children,
  className
}) {
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: chunkOR5DRJCW_cjs.cn("flex items-center gap-2", className), children });
}
function AppHeaderDivider({
  className
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn("mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700", className),
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
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "button",
    {
      onClick,
      "data-testid": testId,
      className: chunkOR5DRJCW_cjs.cn(
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
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "h-5 w-5", children: icon }),
        typeof badge === "number" && badge > 0 && /* @__PURE__ */ jsxRuntime.jsx(
          "span",
          {
            className: chunkOR5DRJCW_cjs.cn(
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
var SearchIcon = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx(
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
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "button",
    {
      onClick,
      "data-testid": testId,
      className: chunkOR5DRJCW_cjs.cn(
        "flex items-center gap-3 rounded-lg border border-gray-300 dark:border-gray-600",
        "bg-white px-4 py-2 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400",
        "hover:border-gray-400 dark:hover:border-gray-500",
        "transition-colors hover:bg-gray-50 dark:hover:bg-gray-600",
        !showOnMobile && "hidden sm:flex",
        "min-w-[200px] lg:min-w-[300px]",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(SearchIcon, {}),
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "flex-1 text-left whitespace-nowrap", children: placeholder }),
        /* @__PURE__ */ jsxRuntime.jsxs(
          "kbd",
          {
            className: chunkOR5DRJCW_cjs.cn(
              "hidden items-center gap-0.5 px-2 py-0.5 sm:inline-flex",
              "rounded border border-gray-200 bg-gray-100 dark:border-gray-500 dark:bg-gray-600",
              "flex-shrink-0 text-xs text-gray-500 dark:text-gray-300"
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
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "button",
    {
      onClick,
      "data-testid": testId,
      className: chunkOR5DRJCW_cjs.cn(
        "flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus:ring-primary-500 focus:ring-2 focus:outline-none",
        isOpen && "bg-gray-100 dark:bg-gray-800",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: chunkOR5DRJCW_cjs.cn(
              "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full",
              "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm font-medium"
            ),
            children: avatarUrl ? /* @__PURE__ */ jsxRuntime.jsx(
              "img",
              {
                src: avatarUrl,
                alt: name,
                className: "h-full w-full object-cover"
              }
            ) : displayInitials
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "hidden min-w-0 text-left lg:block", children: [
          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "max-w-[150px] truncate text-sm font-medium text-gray-900 dark:text-white", children: name }),
          email && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "max-w-[150px] truncate text-xs text-gray-500 dark:text-gray-400", children: email })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "svg",
          {
            className: chunkOR5DRJCW_cjs.cn(
              "hidden h-4 w-4 text-gray-400 transition-transform lg:block",
              isOpen && "rotate-180"
            ),
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            strokeWidth: 2,
            children: /* @__PURE__ */ jsxRuntime.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" })
          }
        )
      ]
    }
  );
}
var CommandPaletteContext = React.createContext(
  null
);
function CommandPaletteProvider({
  children,
  enableShortcut = true,
  customEventName
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [activeCategory, setActiveCategory] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const open = React.useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setSelectedIndex(-1);
    setActiveCategory(null);
  }, []);
  const close = React.useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(-1);
  }, []);
  const toggle = React.useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);
  chunkR4DM4635_cjs.useCommandK(toggle, enableShortcut);
  React__default.default.useEffect(() => {
    if (!customEventName) return;
    const handler = () => open();
    document.addEventListener(customEventName, handler);
    return () => document.removeEventListener(customEventName, handler);
  }, [customEventName, open]);
  const contextValue = React.useMemo(
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
  return /* @__PURE__ */ jsxRuntime.jsx(CommandPaletteContext.Provider, { value: contextValue, children });
}
function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider"
    );
  }
  return context;
}
var SearchIcon2 = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      }
    )
  }
);
var XIcon = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M6 18L18 6M6 6l12 12"
      }
    )
  }
);
var SpinnerIcon = () => /* @__PURE__ */ jsxRuntime.jsxs("svg", { className: "h-4 w-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
  /* @__PURE__ */ jsxRuntime.jsx(
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
  /* @__PURE__ */ jsxRuntime.jsx(
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
  const inputRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const listRef = React.useRef(null);
  const filteredItems = React.useMemo(() => {
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
  const groupedItems = React.useMemo(() => {
    const groups = /* @__PURE__ */ new Map();
    filteredItems.forEach((item) => {
      const category = item.category ?? "Other";
      const group = groups.get(category) ?? [];
      group.push(item);
      groups.set(category, group);
    });
    return groups;
  }, [filteredItems]);
  chunkFHY3K6PL_cjs.useEscapeKey(close, isOpen);
  chunkSWMRCGL4_cjs.useClickOutside(containerRef, close);
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);
  React.useEffect(() => {
    setSelectedIndex(filteredItems.length > 0 ? 0 : -1);
  }, [filteredItems.length, setSelectedIndex]);
  React.useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);
  const handleKeyDown = React.useCallback(
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
  const handleItemClick = React.useCallback(
    (item) => {
      if (!item.disabled) {
        onSelect?.(item);
        close();
      }
    },
    [onSelect, close]
  );
  const getCategoryInfo = React.useCallback(
    (categoryId) => {
      return categories.find((c) => c.id === categoryId);
    },
    [categories]
  );
  if (!isOpen) return null;
  let globalIndex = -1;
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm dark:bg-black/70",
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "fixed inset-x-0 top-20 z-50 mx-auto max-w-2xl px-4", children: /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        ref: containerRef,
        "data-testid": testId,
        className: chunkOR5DRJCW_cjs.cn(
          "rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
          "overflow-hidden shadow-2xl",
          className
        ),
        children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative border-b border-gray-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute top-1/2 left-4 -translate-y-1/2 text-gray-400", children: /* @__PURE__ */ jsxRuntime.jsx(SearchIcon2, {}) }),
            /* @__PURE__ */ jsxRuntime.jsx(
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
                className: chunkOR5DRJCW_cjs.cn(
                  "w-full bg-transparent py-4 pr-12 pl-12 text-base",
                  "focus:outline-none dark:text-white dark:placeholder-gray-400"
                )
              }
            ),
            query && /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                onClick: () => setQuery(""),
                "data-testid": `${testId}-clear`,
                className: "absolute top-1/2 right-12 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                children: /* @__PURE__ */ jsxRuntime.jsx(XIcon, {})
              }
            ),
            isLoading && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-primary-500 absolute top-1/2 right-4 -translate-y-1/2", children: /* @__PURE__ */ jsxRuntime.jsx(SpinnerIcon, {}) })
          ] }),
          categories.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-1 overflow-x-auto border-b border-gray-100 p-2 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                onClick: () => setActiveCategory(null),
                "data-testid": `${testId}-filter-all`,
                className: chunkOR5DRJCW_cjs.cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  activeCategory === null ? "bg-primary-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                ),
                children: "All"
              }
            ),
            categories.map((cat) => /* @__PURE__ */ jsxRuntime.jsxs(
              "button",
              {
                onClick: () => setActiveCategory(cat.id),
                "data-testid": `${testId}-filter-${cat.id}`,
                className: chunkOR5DRJCW_cjs.cn(
                  "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
                  activeCategory === cat.id ? "bg-primary-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                ),
                children: [
                  cat.icon && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "h-3 w-3", children: cat.icon }),
                  cat.label
                ]
              },
              cat.id
            ))
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx("div", { ref: listRef, className: "max-h-[60vh] overflow-y-auto", children: filteredItems.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx("div", { className: "p-8 text-center text-gray-500 dark:text-gray-400", children: emptyState ?? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mx-auto mb-2 h-8 w-8 opacity-50", children: /* @__PURE__ */ jsxRuntime.jsx(SearchIcon2, {}) }),
            /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm", children: query.trim() ? `No results for "${query}"` : "Start typing to search..." })
          ] }) }) : Array.from(groupedItems.entries()).map(
            ([categoryId, categoryItems]) => {
              const categoryInfo = getCategoryInfo(categoryId);
              return /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntime.jsxs(
                  "div",
                  {
                    className: chunkOR5DRJCW_cjs.cn(
                      "sticky top-0 px-3 py-2 text-xs font-semibold",
                      "text-gray-500 dark:text-gray-400",
                      "bg-gray-50 dark:bg-gray-900/50"
                    ),
                    children: [
                      categoryInfo?.icon && /* @__PURE__ */ jsxRuntime.jsx(
                        "span",
                        {
                          className: chunkOR5DRJCW_cjs.cn(
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
                    return /* @__PURE__ */ jsxRuntime.jsx(
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
                  return /* @__PURE__ */ jsxRuntime.jsxs(
                    "button",
                    {
                      "data-index": currentIndex,
                      onClick: () => handleItemClick(item),
                      onMouseEnter: () => setSelectedIndex(currentIndex),
                      disabled: item.disabled,
                      className: chunkOR5DRJCW_cjs.cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                        isSelected ? "bg-primary-50 dark:bg-primary-500/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/50",
                        item.disabled && "cursor-not-allowed opacity-50"
                      ),
                      children: [
                        item.icon && /* @__PURE__ */ jsxRuntime.jsx(
                          "div",
                          {
                            className: chunkOR5DRJCW_cjs.cn(
                              "mt-0.5 h-4 w-4 flex-shrink-0",
                              isSelected ? "text-primary-600 dark:text-primary-400" : "text-gray-400"
                            ),
                            children: item.icon
                          }
                        ),
                        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "min-w-0 flex-1", children: [
                          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "truncate text-sm font-medium text-gray-900 dark:text-white", children: item.label }),
                          item.subtitle && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "truncate text-xs text-gray-500 dark:text-gray-400", children: item.subtitle }),
                          item.description && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500", children: item.description })
                        ] }),
                        item.shortcut && /* @__PURE__ */ jsxRuntime.jsx(
                          "kbd",
                          {
                            className: chunkOR5DRJCW_cjs.cn(
                              "hidden items-center px-1.5 py-0.5 text-[10px] sm:inline-flex",
                              "rounded border bg-gray-100 dark:bg-gray-700",
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
            }
          ) }),
          footer ?? /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              className: chunkOR5DRJCW_cjs.cn(
                "border-t border-gray-100 p-2 dark:border-gray-700",
                "bg-gray-50 text-xs text-gray-500 dark:bg-gray-900/50 dark:text-gray-400",
                "flex items-center justify-between"
              ),
              children: [
                /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntime.jsx("kbd", { className: "rounded border border-gray-200 bg-white px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700", children: "\u2191\u2193" }),
                  /* @__PURE__ */ jsxRuntime.jsx("span", { children: "navigate" }),
                  /* @__PURE__ */ jsxRuntime.jsx("kbd", { className: "ml-2 rounded border border-gray-200 bg-white px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700", children: "\u21B5" }),
                  /* @__PURE__ */ jsxRuntime.jsx("span", { children: "select" }),
                  /* @__PURE__ */ jsxRuntime.jsx("kbd", { className: "ml-2 rounded border border-gray-200 bg-white px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700", children: "esc" }),
                  /* @__PURE__ */ jsxRuntime.jsx("span", { children: "close" })
                ] }),
                /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      onClick: open,
      "data-testid": testId,
      className: chunkOR5DRJCW_cjs.cn(
        "flex items-center gap-3 rounded-lg border border-gray-300 dark:border-gray-600",
        "bg-white px-4 py-2.5 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400",
        "hover:border-gray-400 dark:hover:border-gray-500",
        "transition-colors hover:bg-gray-50 dark:hover:bg-gray-600",
        "min-w-[200px] sm:min-w-[300px]",
        className
      ),
      children: children ?? /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(SearchIcon2, {}),
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "flex-1 text-left whitespace-nowrap", children: placeholder }),
        /* @__PURE__ */ jsxRuntime.jsxs(
          "kbd",
          {
            className: chunkOR5DRJCW_cjs.cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5",
              "rounded border border-gray-200 bg-gray-100 dark:border-gray-500 dark:bg-gray-600",
              "flex-shrink-0 text-xs text-gray-500 dark:text-gray-300"
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
var SidebarContext = React.createContext(null);
function SidebarProvider({
  children,
  defaultCollapsed = false,
  storageKey = "sidebar-collapsed",
  persistCollapsed = true,
  defaultExpandedGroup = null,
  mobileBreakpoint = "(max-width: 1023px)"
}) {
  const isMobileViewport = chunkR4DM4635_cjs.useMediaQuery(mobileBreakpoint);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (typeof window !== "undefined" && persistCollapsed) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === "true";
      }
    }
    return defaultCollapsed;
  });
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [expandedGroup, setExpandedGroup] = React.useState(
    defaultExpandedGroup
  );
  React.useEffect(() => {
    if (persistCollapsed && typeof window !== "undefined") {
      localStorage.setItem(storageKey, String(isCollapsed));
    }
  }, [isCollapsed, persistCollapsed, storageKey]);
  React.useEffect(() => {
    if (!isMobileViewport && isMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [isMobileViewport, isMobileOpen]);
  const toggleCollapsed = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);
  const setCollapsed = React.useCallback((collapsed) => {
    setIsCollapsed(collapsed);
  }, []);
  const openMobile = React.useCallback(() => {
    setIsMobileOpen(true);
  }, []);
  const closeMobile = React.useCallback(() => {
    setIsMobileOpen(false);
  }, []);
  const toggleMobile = React.useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);
  const toggleGroup = React.useCallback((group) => {
    setExpandedGroup((prev) => prev === group ? null : group);
  }, []);
  const contextValue = React.useMemo(
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
  return /* @__PURE__ */ jsxRuntime.jsx(SidebarContext.Provider, { value: contextValue, children });
}
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
var ChevronLeftIcon = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" })
  }
);
var ChevronRightIcon = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" })
  }
);
var ChevronDownIcon = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-3 w-3",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" })
  }
);
var XIcon2 = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M6 18L18 6M6 6l12 12"
      }
    )
  }
);
var MenuIcon = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M4 6h16M4 12h16M4 18h16"
      }
    )
  }
);
var SearchIcon3 = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx(
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
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    isMobileViewport && isMobileOpen && /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        className: "fixed inset-0 z-40 bg-black/50 lg:hidden",
        onClick: closeMobile,
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      "aside",
      {
        "data-testid": testId,
        className: chunkOR5DRJCW_cjs.cn(
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
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        "flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "min-w-0 flex-1", children }),
        showMobileClose && isMobileViewport && /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            onClick: closeMobile,
            className: "-mr-2 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800",
            "aria-label": "Close navigation",
            children: /* @__PURE__ */ jsxRuntime.jsx(XIcon2, {})
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        "mt-auto border-t border-neutral-200 px-4 py-4 dark:border-neutral-700",
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
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: chunkOR5DRJCW_cjs.cn("flex-1 overflow-y-auto py-4", className), children });
}
function SidebarNav({
  children,
  className
}) {
  return /* @__PURE__ */ jsxRuntime.jsx("nav", { className: chunkOR5DRJCW_cjs.cn("space-y-1 px-2", className), children });
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
  const [localExpanded, setLocalExpanded] = React.useState(defaultExpanded);
  const effectiveExpanded = groupId ? isExpanded : localExpanded;
  const handleToggle = React.useCallback(() => {
    if (groupId) {
      toggleGroup(groupId);
    } else {
      setLocalExpanded((prev) => !prev);
    }
  }, [groupId, toggleGroup]);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: chunkOR5DRJCW_cjs.cn("mb-2", className), children: [
    /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        onClick: handleToggle,
        className: chunkOR5DRJCW_cjs.cn(
          "flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold",
          "text-neutral-700 dark:text-neutral-300",
          "transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
          showCollapsed && "justify-center"
        ),
        title: showCollapsed ? label : void 0,
        children: [
          icon && /* @__PURE__ */ jsxRuntime.jsx(
            "span",
            {
              className: chunkOR5DRJCW_cjs.cn(
                "h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400",
                !showCollapsed && "mr-3"
              ),
              children: icon
            }
          ),
          !showCollapsed && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            /* @__PURE__ */ jsxRuntime.jsx("span", { className: "flex-1 truncate text-left", children: label }),
            /* @__PURE__ */ jsxRuntime.jsx(
              "span",
              {
                className: chunkOR5DRJCW_cjs.cn(
                  "ml-2 flex-shrink-0 transition-transform duration-200",
                  effectiveExpanded && "rotate-180"
                ),
                children: /* @__PURE__ */ jsxRuntime.jsx(ChevronDownIcon, {})
              }
            )
          ] })
        ]
      }
    ),
    !showCollapsed && /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        className: chunkOR5DRJCW_cjs.cn(
          "overflow-hidden transition-all duration-300",
          effectiveExpanded ? "mt-1 max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        ),
        children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "pl-2", children })
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
  const handleClick = React.useCallback(() => {
    if (disabled) return;
    onClick?.();
    if (isMobileViewport) {
      closeMobile();
    }
  }, [disabled, onClick, isMobileViewport, closeMobile]);
  const content = /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    icon && /* @__PURE__ */ jsxRuntime.jsx(
      "span",
      {
        className: chunkOR5DRJCW_cjs.cn(
          "h-5 w-5 flex-shrink-0",
          isActive ? "text-primary-600 dark:text-primary-400" : "text-neutral-500 dark:text-neutral-400",
          !showCollapsed && "mr-3"
        ),
        children: icon
      }
    ),
    !showCollapsed && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "flex-1 truncate text-left", children: label }),
      badge && /* @__PURE__ */ jsxRuntime.jsx(
        "span",
        {
          className: chunkOR5DRJCW_cjs.cn(
            "ml-2 rounded-full px-2 py-0.5 text-xs font-medium",
            isActive ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
          ),
          children: badge
        }
      )
    ] })
  ] });
  const baseClasses = chunkOR5DRJCW_cjs.cn(
    "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
    isActive ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
    disabled && "opacity-50 cursor-not-allowed",
    showCollapsed && "justify-center",
    className
  );
  if (href && !disabled) {
    return /* @__PURE__ */ jsxRuntime.jsx(
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
  return /* @__PURE__ */ jsxRuntime.jsx(
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
  if (isMobileViewport) return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, {});
  const button = /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      onClick: toggleCollapsed,
      className: chunkOR5DRJCW_cjs.cn(
        "rounded-lg p-2 text-neutral-500 dark:text-neutral-400",
        "transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
        "focus:ring-primary-500 focus:ring-2 focus:outline-none",
        className
      ),
      "aria-label": isCollapsed ? "Expand sidebar" : "Collapse sidebar",
      children: isCollapsed ? /* @__PURE__ */ jsxRuntime.jsx(ChevronRightIcon, {}) : /* @__PURE__ */ jsxRuntime.jsx(ChevronLeftIcon, {})
    }
  );
  if (position === "floating") {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute top-6 -right-3 z-10 rounded-full border border-neutral-200 bg-white shadow-md dark:border-neutral-700 dark:bg-neutral-900", children: button });
  }
  return button;
}
function SidebarMobileToggle({
  className,
  icon
}) {
  const { openMobile, isMobileViewport } = useSidebar();
  if (!isMobileViewport) return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, {});
  return /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      onClick: openMobile,
      className: chunkOR5DRJCW_cjs.cn(
        "rounded-lg p-2 text-neutral-500 dark:text-neutral-400",
        "transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
        "focus:ring-primary-500 focus:ring-2 focus:outline-none",
        className
      ),
      "aria-label": "Open navigation",
      children: icon ?? /* @__PURE__ */ jsxRuntime.jsx(MenuIcon, {})
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
  const inputRef = React.useRef(null);
  const showCollapsed = !isMobileViewport && isCollapsed;
  React.useEffect(() => {
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
  if (showCollapsed) return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, {});
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: chunkOR5DRJCW_cjs.cn("px-3 py-2", className), children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400", children: /* @__PURE__ */ jsxRuntime.jsx(SearchIcon3, {}) }),
    /* @__PURE__ */ jsxRuntime.jsx(
      "input",
      {
        ref: inputRef,
        type: "text",
        value,
        onChange: (e) => onChange(e.target.value),
        placeholder: `${placeholder} (${shortcutHint})`,
        "data-testid": testId,
        className: chunkOR5DRJCW_cjs.cn(
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
var CheckIcon = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" })
  }
);
var XCircleIcon = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      }
    )
  }
);
var ExclamationIcon = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      }
    )
  }
);
var InfoIcon = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      }
    )
  }
);
var XIcon3 = () => /* @__PURE__ */ jsxRuntime.jsx(
  "svg",
  {
    className: "h-4 w-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: /* @__PURE__ */ jsxRuntime.jsx(
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
    container: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    icon: "text-blue-500 dark:text-blue-400"
  }
};
var defaultIcons = {
  success: /* @__PURE__ */ jsxRuntime.jsx(CheckIcon, {}),
  error: /* @__PURE__ */ jsxRuntime.jsx(XCircleIcon, {}),
  warning: /* @__PURE__ */ jsxRuntime.jsx(ExclamationIcon, {}),
  info: /* @__PURE__ */ jsxRuntime.jsx(InfoIcon, {})
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
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      role: "alert",
      className: chunkOR5DRJCW_cjs.cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-lg",
        "max-w-[420px] min-w-[300px]",
        "animate-slide-in-right",
        styles.container
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: chunkOR5DRJCW_cjs.cn("flex-shrink-0", styles.icon), children: displayIcon }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "min-w-0 flex-1", children: [
          title && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "mb-1 text-sm font-semibold", children: title }),
          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-sm opacity-90", children: message }),
          action && /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              onClick: action.onClick,
              className: "mt-2 rounded text-sm font-medium underline hover:no-underline focus:ring-2 focus:ring-current focus:ring-offset-2 focus:outline-none",
              children: action.label
            }
          )
        ] }),
        dismissible && /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            onClick: onClose,
            className: "flex-shrink-0 rounded p-1 transition-colors hover:bg-black/10 focus:ring-2 focus:ring-current focus:outline-none dark:hover:bg-white/10",
            "aria-label": "Dismiss notification",
            children: /* @__PURE__ */ jsxRuntime.jsx(XIcon3, {})
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
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        "pointer-events-none fixed z-50 flex flex-col gap-2",
        positionStyles[position]
      ),
      "aria-live": "polite",
      "aria-atomic": "true",
      children: toasts.map((toast) => /* @__PURE__ */ jsxRuntime.jsx("div", { className: "pointer-events-auto", children: /* @__PURE__ */ jsxRuntime.jsx(Toast, { ...toast, onClose: () => onDismiss(toast.id) }) }, toast.id))
    }
  );
}
var ToastContext = React.createContext(null);
var toastIdCounter = 0;
function generateToastId() {
  return `toast-${++toastIdCounter}-${Date.now()}`;
}
function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 5e3
}) {
  const [toasts, setToasts] = React.useState([]);
  const dismiss = React.useCallback((id) => {
    setToasts((prev) => {
      const toast2 = prev.find((t) => t.id === id);
      if (toast2?.onDismiss) {
        toast2.onDismiss();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);
  const dismissAll = React.useCallback(() => {
    setToasts((prev) => {
      prev.forEach((t) => t.onDismiss?.());
      return [];
    });
  }, []);
  const toast = React.useCallback(
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
  const success = React.useCallback(
    (message, options) => {
      return toast({ ...options, message, variant: "success" });
    },
    [toast]
  );
  const error = React.useCallback(
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
  const warning = React.useCallback(
    (message, options) => {
      return toast({ ...options, message, variant: "warning" });
    },
    [toast]
  );
  const info = React.useCallback(
    (message, options) => {
      return toast({ ...options, message, variant: "info" });
    },
    [toast]
  );
  const contextValue = React.useMemo(
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
  return /* @__PURE__ */ jsxRuntime.jsx(ToastContext.Provider, { value: contextValue, children });
}
function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

Object.defineProperty(exports, "brands", {
  enumerable: true,
  get: function () { return chunkUBWTYI3A_cjs.brands; }
});
Object.defineProperty(exports, "createBrandPreset", {
  enumerable: true,
  get: function () { return chunkFFJVCQ5R_cjs.createBrandPreset; }
});
Object.defineProperty(exports, "generateBrandCSS", {
  enumerable: true,
  get: function () { return chunkFFJVCQ5R_cjs.generateBrandCSS; }
});
Object.defineProperty(exports, "generateTailwindTheme", {
  enumerable: true,
  get: function () { return chunkFFJVCQ5R_cjs.generateTailwindTheme; }
});
Object.defineProperty(exports, "bluehiveBrand", {
  enumerable: true,
  get: function () { return chunk4LNS5QDP_cjs.bluehiveBrand; }
});
Object.defineProperty(exports, "defaultBrand", {
  enumerable: true,
  get: function () { return chunkO5HS7ZND_cjs.defaultBrand; }
});
Object.defineProperty(exports, "enterpriseHealthBrand", {
  enumerable: true,
  get: function () { return chunkP52GA3GJ_cjs.enterpriseHealthBrand; }
});
Object.defineProperty(exports, "miewebBrand", {
  enumerable: true,
  get: function () { return chunkS6UNPMAS_cjs.miewebBrand; }
});
Object.defineProperty(exports, "wagglelineBrand", {
  enumerable: true,
  get: function () { return chunkSWV5E75F_cjs.wagglelineBrand; }
});
Object.defineProperty(exports, "webchartBrand", {
  enumerable: true,
  get: function () { return chunkZ3TFPXVN_cjs.webchartBrand; }
});
Object.defineProperty(exports, "Switch", {
  enumerable: true,
  get: function () { return chunkEXDNFGI7_cjs.Switch; }
});
Object.defineProperty(exports, "switchThumbVariants", {
  enumerable: true,
  get: function () { return chunkEXDNFGI7_cjs.switchThumbVariants; }
});
Object.defineProperty(exports, "switchTrackVariants", {
  enumerable: true,
  get: function () { return chunkEXDNFGI7_cjs.switchTrackVariants; }
});
Object.defineProperty(exports, "Table", {
  enumerable: true,
  get: function () { return chunkLZEY55QZ_cjs.Table; }
});
Object.defineProperty(exports, "TableBody", {
  enumerable: true,
  get: function () { return chunkLZEY55QZ_cjs.TableBody; }
});
Object.defineProperty(exports, "TableCaption", {
  enumerable: true,
  get: function () { return chunkLZEY55QZ_cjs.TableCaption; }
});
Object.defineProperty(exports, "TableCell", {
  enumerable: true,
  get: function () { return chunkLZEY55QZ_cjs.TableCell; }
});
Object.defineProperty(exports, "TableFooter", {
  enumerable: true,
  get: function () { return chunkLZEY55QZ_cjs.TableFooter; }
});
Object.defineProperty(exports, "TableHead", {
  enumerable: true,
  get: function () { return chunkLZEY55QZ_cjs.TableHead; }
});
Object.defineProperty(exports, "TableHeader", {
  enumerable: true,
  get: function () { return chunkLZEY55QZ_cjs.TableHeader; }
});
Object.defineProperty(exports, "TableRow", {
  enumerable: true,
  get: function () { return chunkLZEY55QZ_cjs.TableRow; }
});
Object.defineProperty(exports, "Tabs", {
  enumerable: true,
  get: function () { return chunkPFPBF3TQ_cjs.Tabs; }
});
Object.defineProperty(exports, "TabsContent", {
  enumerable: true,
  get: function () { return chunkPFPBF3TQ_cjs.TabsContent; }
});
Object.defineProperty(exports, "TabsList", {
  enumerable: true,
  get: function () { return chunkPFPBF3TQ_cjs.TabsList; }
});
Object.defineProperty(exports, "TabsTrigger", {
  enumerable: true,
  get: function () { return chunkPFPBF3TQ_cjs.TabsTrigger; }
});
Object.defineProperty(exports, "tabsListVariants", {
  enumerable: true,
  get: function () { return chunkPFPBF3TQ_cjs.tabsListVariants; }
});
Object.defineProperty(exports, "tabsTriggerVariants", {
  enumerable: true,
  get: function () { return chunkPFPBF3TQ_cjs.tabsTriggerVariants; }
});
Object.defineProperty(exports, "SmallMuted", {
  enumerable: true,
  get: function () { return chunkQDGZBDBI_cjs.SmallMuted; }
});
Object.defineProperty(exports, "Text", {
  enumerable: true,
  get: function () { return chunkQDGZBDBI_cjs.Text; }
});
Object.defineProperty(exports, "textVariants", {
  enumerable: true,
  get: function () { return chunkQDGZBDBI_cjs.textVariants; }
});
Object.defineProperty(exports, "Textarea", {
  enumerable: true,
  get: function () { return chunkB7YGVKTE_cjs.Textarea; }
});
Object.defineProperty(exports, "textareaVariants", {
  enumerable: true,
  get: function () { return chunkB7YGVKTE_cjs.textareaVariants; }
});
Object.defineProperty(exports, "ThemeProvider", {
  enumerable: true,
  get: function () { return chunkVDMQCSXT_cjs.ThemeProvider; }
});
Object.defineProperty(exports, "ThemeProviderContext", {
  enumerable: true,
  get: function () { return chunkVDMQCSXT_cjs.ThemeProviderContext; }
});
Object.defineProperty(exports, "ThemeToggle", {
  enumerable: true,
  get: function () { return chunkVDMQCSXT_cjs.ThemeToggle; }
});
Object.defineProperty(exports, "themeToggleIconVariants", {
  enumerable: true,
  get: function () { return chunkVDMQCSXT_cjs.themeToggleIconVariants; }
});
Object.defineProperty(exports, "themeToggleVariants", {
  enumerable: true,
  get: function () { return chunkVDMQCSXT_cjs.themeToggleVariants; }
});
Object.defineProperty(exports, "useThemeContext", {
  enumerable: true,
  get: function () { return chunkVDMQCSXT_cjs.useThemeContext; }
});
Object.defineProperty(exports, "Tooltip", {
  enumerable: true,
  get: function () { return chunkBXK5TNJE_cjs.Tooltip; }
});
Object.defineProperty(exports, "VisuallyHidden", {
  enumerable: true,
  get: function () { return chunkZJCPW6MS_cjs.VisuallyHidden; }
});
Object.defineProperty(exports, "PhoneInput", {
  enumerable: true,
  get: function () { return chunkG4IYKDQ2_cjs.PhoneInput; }
});
Object.defineProperty(exports, "CircularProgress", {
  enumerable: true,
  get: function () { return chunkNAATBUHR_cjs.CircularProgress; }
});
Object.defineProperty(exports, "Progress", {
  enumerable: true,
  get: function () { return chunkNAATBUHR_cjs.Progress; }
});
Object.defineProperty(exports, "circularProgressVariants", {
  enumerable: true,
  get: function () { return chunkNAATBUHR_cjs.circularProgressVariants; }
});
Object.defineProperty(exports, "progressBarFillVariants", {
  enumerable: true,
  get: function () { return chunkNAATBUHR_cjs.progressBarFillVariants; }
});
Object.defineProperty(exports, "progressBarTrackVariants", {
  enumerable: true,
  get: function () { return chunkNAATBUHR_cjs.progressBarTrackVariants; }
});
Object.defineProperty(exports, "QuickAction", {
  enumerable: true,
  get: function () { return chunk2QX46LFO_cjs.QuickAction; }
});
Object.defineProperty(exports, "QuickActionGroup", {
  enumerable: true,
  get: function () { return chunk2QX46LFO_cjs.QuickActionGroup; }
});
Object.defineProperty(exports, "QuickActionIcons", {
  enumerable: true,
  get: function () { return chunk2QX46LFO_cjs.QuickActionIcons; }
});
Object.defineProperty(exports, "quickActionIconVariants", {
  enumerable: true,
  get: function () { return chunk2QX46LFO_cjs.quickActionIconVariants; }
});
Object.defineProperty(exports, "quickActionVariants", {
  enumerable: true,
  get: function () { return chunk2QX46LFO_cjs.quickActionVariants; }
});
Object.defineProperty(exports, "Radio", {
  enumerable: true,
  get: function () { return chunkXZB73CF4_cjs.Radio; }
});
Object.defineProperty(exports, "RadioGroup", {
  enumerable: true,
  get: function () { return chunkXZB73CF4_cjs.RadioGroup; }
});
Object.defineProperty(exports, "radioVariants", {
  enumerable: true,
  get: function () { return chunkXZB73CF4_cjs.radioVariants; }
});
Object.defineProperty(exports, "DateButton", {
  enumerable: true,
  get: function () { return chunkXNY3NM2W_cjs.DateButton; }
});
Object.defineProperty(exports, "DatePicker", {
  enumerable: true,
  get: function () { return chunkXNY3NM2W_cjs.DatePicker; }
});
Object.defineProperty(exports, "RadioOption", {
  enumerable: true,
  get: function () { return chunkXNY3NM2W_cjs.RadioOption; }
});
Object.defineProperty(exports, "SchedulePicker", {
  enumerable: true,
  get: function () { return chunkXNY3NM2W_cjs.SchedulePicker; }
});
Object.defineProperty(exports, "TimeButton", {
  enumerable: true,
  get: function () { return chunkXNY3NM2W_cjs.TimeButton; }
});
Object.defineProperty(exports, "TimePicker", {
  enumerable: true,
  get: function () { return chunkXNY3NM2W_cjs.TimePicker; }
});
Object.defineProperty(exports, "dateButtonVariants", {
  enumerable: true,
  get: function () { return chunkXNY3NM2W_cjs.dateButtonVariants; }
});
Object.defineProperty(exports, "radioOptionVariants", {
  enumerable: true,
  get: function () { return chunkXNY3NM2W_cjs.radioOptionVariants; }
});
Object.defineProperty(exports, "timeButtonVariants", {
  enumerable: true,
  get: function () { return chunkXNY3NM2W_cjs.timeButtonVariants; }
});
Object.defineProperty(exports, "Select", {
  enumerable: true,
  get: function () { return chunkLEE3NMNP_cjs.Select; }
});
Object.defineProperty(exports, "selectTriggerVariants", {
  enumerable: true,
  get: function () { return chunkLEE3NMNP_cjs.selectTriggerVariants; }
});
Object.defineProperty(exports, "Skeleton", {
  enumerable: true,
  get: function () { return chunkN3QTYHRZ_cjs.Skeleton; }
});
Object.defineProperty(exports, "SkeletonCard", {
  enumerable: true,
  get: function () { return chunkN3QTYHRZ_cjs.SkeletonCard; }
});
Object.defineProperty(exports, "SkeletonTable", {
  enumerable: true,
  get: function () { return chunkN3QTYHRZ_cjs.SkeletonTable; }
});
Object.defineProperty(exports, "SkeletonText", {
  enumerable: true,
  get: function () { return chunkN3QTYHRZ_cjs.SkeletonText; }
});
Object.defineProperty(exports, "skeletonVariants", {
  enumerable: true,
  get: function () { return chunkN3QTYHRZ_cjs.skeletonVariants; }
});
Object.defineProperty(exports, "FullPageSpinner", {
  enumerable: true,
  get: function () { return chunkJYMQJ32S_cjs.FullPageSpinner; }
});
Object.defineProperty(exports, "Spinner", {
  enumerable: true,
  get: function () { return chunkJYMQJ32S_cjs.Spinner; }
});
Object.defineProperty(exports, "SpinnerWithLabel", {
  enumerable: true,
  get: function () { return chunkJYMQJ32S_cjs.SpinnerWithLabel; }
});
Object.defineProperty(exports, "spinnerVariants", {
  enumerable: true,
  get: function () { return chunkJYMQJ32S_cjs.spinnerVariants; }
});
Object.defineProperty(exports, "Button", {
  enumerable: true,
  get: function () { return chunkYEZJKPEN_cjs.Button; }
});
Object.defineProperty(exports, "buttonVariants", {
  enumerable: true,
  get: function () { return chunkYEZJKPEN_cjs.buttonVariants; }
});
Object.defineProperty(exports, "Card", {
  enumerable: true,
  get: function () { return chunkZENVEUAE_cjs.Card; }
});
Object.defineProperty(exports, "CardContent", {
  enumerable: true,
  get: function () { return chunkZENVEUAE_cjs.CardContent; }
});
Object.defineProperty(exports, "CardDescription", {
  enumerable: true,
  get: function () { return chunkZENVEUAE_cjs.CardDescription; }
});
Object.defineProperty(exports, "CardFooter", {
  enumerable: true,
  get: function () { return chunkZENVEUAE_cjs.CardFooter; }
});
Object.defineProperty(exports, "CardHeader", {
  enumerable: true,
  get: function () { return chunkZENVEUAE_cjs.CardHeader; }
});
Object.defineProperty(exports, "CardTitle", {
  enumerable: true,
  get: function () { return chunkZENVEUAE_cjs.CardTitle; }
});
Object.defineProperty(exports, "cardVariants", {
  enumerable: true,
  get: function () { return chunkZENVEUAE_cjs.cardVariants; }
});
Object.defineProperty(exports, "Checkbox", {
  enumerable: true,
  get: function () { return chunkL7TTMKLJ_cjs.Checkbox; }
});
Object.defineProperty(exports, "CheckboxGroup", {
  enumerable: true,
  get: function () { return chunkL7TTMKLJ_cjs.CheckboxGroup; }
});
Object.defineProperty(exports, "checkboxVariants", {
  enumerable: true,
  get: function () { return chunkL7TTMKLJ_cjs.checkboxVariants; }
});
Object.defineProperty(exports, "DateInput", {
  enumerable: true,
  get: function () { return chunkJGADLLQW_cjs.DateInput; }
});
Object.defineProperty(exports, "Dropdown", {
  enumerable: true,
  get: function () { return chunkFIXAVBUA_cjs.Dropdown; }
});
Object.defineProperty(exports, "DropdownContent", {
  enumerable: true,
  get: function () { return chunkFIXAVBUA_cjs.DropdownContent; }
});
Object.defineProperty(exports, "DropdownHeader", {
  enumerable: true,
  get: function () { return chunkFIXAVBUA_cjs.DropdownHeader; }
});
Object.defineProperty(exports, "DropdownItem", {
  enumerable: true,
  get: function () { return chunkFIXAVBUA_cjs.DropdownItem; }
});
Object.defineProperty(exports, "DropdownLabel", {
  enumerable: true,
  get: function () { return chunkFIXAVBUA_cjs.DropdownLabel; }
});
Object.defineProperty(exports, "DropdownSeparator", {
  enumerable: true,
  get: function () { return chunkFIXAVBUA_cjs.DropdownSeparator; }
});
Object.defineProperty(exports, "Input", {
  enumerable: true,
  get: function () { return chunkDQTQ4AQQ_cjs.Input; }
});
Object.defineProperty(exports, "inputVariants", {
  enumerable: true,
  get: function () { return chunkDQTQ4AQQ_cjs.inputVariants; }
});
Object.defineProperty(exports, "Modal", {
  enumerable: true,
  get: function () { return chunkNH2JVQ6V_cjs.Modal; }
});
Object.defineProperty(exports, "ModalBody", {
  enumerable: true,
  get: function () { return chunkNH2JVQ6V_cjs.ModalBody; }
});
Object.defineProperty(exports, "ModalClose", {
  enumerable: true,
  get: function () { return chunkNH2JVQ6V_cjs.ModalClose; }
});
Object.defineProperty(exports, "ModalFooter", {
  enumerable: true,
  get: function () { return chunkNH2JVQ6V_cjs.ModalFooter; }
});
Object.defineProperty(exports, "ModalHeader", {
  enumerable: true,
  get: function () { return chunkNH2JVQ6V_cjs.ModalHeader; }
});
Object.defineProperty(exports, "ModalTitle", {
  enumerable: true,
  get: function () { return chunkNH2JVQ6V_cjs.ModalTitle; }
});
Object.defineProperty(exports, "modalContentVariants", {
  enumerable: true,
  get: function () { return chunkNH2JVQ6V_cjs.modalContentVariants; }
});
Object.defineProperty(exports, "modalOverlayVariants", {
  enumerable: true,
  get: function () { return chunkNH2JVQ6V_cjs.modalOverlayVariants; }
});
Object.defineProperty(exports, "Pagination", {
  enumerable: true,
  get: function () { return chunkPF3XWKE5_cjs.Pagination; }
});
Object.defineProperty(exports, "SimplePagination", {
  enumerable: true,
  get: function () { return chunkPF3XWKE5_cjs.SimplePagination; }
});
Object.defineProperty(exports, "paginationButtonVariants", {
  enumerable: true,
  get: function () { return chunkPF3XWKE5_cjs.paginationButtonVariants; }
});
Object.defineProperty(exports, "useCommandK", {
  enumerable: true,
  get: function () { return chunkR4DM4635_cjs.useCommandK; }
});
Object.defineProperty(exports, "useIsDesktop", {
  enumerable: true,
  get: function () { return chunkR4DM4635_cjs.useIsDesktop; }
});
Object.defineProperty(exports, "useIsLargeDesktop", {
  enumerable: true,
  get: function () { return chunkR4DM4635_cjs.useIsLargeDesktop; }
});
Object.defineProperty(exports, "useIsMobile", {
  enumerable: true,
  get: function () { return chunkR4DM4635_cjs.useIsMobile; }
});
Object.defineProperty(exports, "useIsMobileOrTablet", {
  enumerable: true,
  get: function () { return chunkR4DM4635_cjs.useIsMobileOrTablet; }
});
Object.defineProperty(exports, "useIsSmallTablet", {
  enumerable: true,
  get: function () { return chunkR4DM4635_cjs.useIsSmallTablet; }
});
Object.defineProperty(exports, "useIsTablet", {
  enumerable: true,
  get: function () { return chunkR4DM4635_cjs.useIsTablet; }
});
Object.defineProperty(exports, "useKeyboardShortcut", {
  enumerable: true,
  get: function () { return chunkR4DM4635_cjs.useKeyboardShortcut; }
});
Object.defineProperty(exports, "useMediaQuery", {
  enumerable: true,
  get: function () { return chunkR4DM4635_cjs.useMediaQuery; }
});
Object.defineProperty(exports, "useTheme", {
  enumerable: true,
  get: function () { return chunk2O7D6F67_cjs.useTheme; }
});
Object.defineProperty(exports, "usePrefersReducedMotion", {
  enumerable: true,
  get: function () { return chunk6HFFWEM3_cjs.usePrefersReducedMotion; }
});
Object.defineProperty(exports, "useClickOutside", {
  enumerable: true,
  get: function () { return chunkSWMRCGL4_cjs.useClickOutside; }
});
Object.defineProperty(exports, "useFocusTrap", {
  enumerable: true,
  get: function () { return chunkBR2XGATJ_cjs.useFocusTrap; }
});
Object.defineProperty(exports, "useEscapeKey", {
  enumerable: true,
  get: function () { return chunkFHY3K6PL_cjs.useEscapeKey; }
});
Object.defineProperty(exports, "formatPhoneNumber", {
  enumerable: true,
  get: function () { return chunkBTJHYGPI_cjs.formatPhoneNumber; }
});
Object.defineProperty(exports, "isPhoneNumberEmpty", {
  enumerable: true,
  get: function () { return chunkBTJHYGPI_cjs.isPhoneNumberEmpty; }
});
Object.defineProperty(exports, "isValidPhoneNumber", {
  enumerable: true,
  get: function () { return chunkBTJHYGPI_cjs.isValidPhoneNumber; }
});
Object.defineProperty(exports, "unformatPhoneNumber", {
  enumerable: true,
  get: function () { return chunkBTJHYGPI_cjs.unformatPhoneNumber; }
});
Object.defineProperty(exports, "calculateAge", {
  enumerable: true,
  get: function () { return chunkKMN7JX2X_cjs.calculateAge; }
});
Object.defineProperty(exports, "formatDateValue", {
  enumerable: true,
  get: function () { return chunkKMN7JX2X_cjs.formatDateValue; }
});
Object.defineProperty(exports, "isDateEmpty", {
  enumerable: true,
  get: function () { return chunkKMN7JX2X_cjs.isDateEmpty; }
});
Object.defineProperty(exports, "isDateInFuture", {
  enumerable: true,
  get: function () { return chunkKMN7JX2X_cjs.isDateInFuture; }
});
Object.defineProperty(exports, "isDateInPast", {
  enumerable: true,
  get: function () { return chunkKMN7JX2X_cjs.isDateInPast; }
});
Object.defineProperty(exports, "isValidDate", {
  enumerable: true,
  get: function () { return chunkKMN7JX2X_cjs.isValidDate; }
});
Object.defineProperty(exports, "isValidDrivingAge", {
  enumerable: true,
  get: function () { return chunkKMN7JX2X_cjs.isValidDrivingAge; }
});
Object.defineProperty(exports, "parseDateValue", {
  enumerable: true,
  get: function () { return chunkKMN7JX2X_cjs.parseDateValue; }
});
Object.defineProperty(exports, "miewebUIPreset", {
  enumerable: true,
  get: function () { return chunkZEFZRYQS_cjs.miewebUIPreset; }
});
Object.defineProperty(exports, "miewebUISafelist", {
  enumerable: true,
  get: function () { return chunkZEFZRYQS_cjs.miewebUISafelist; }
});
Object.defineProperty(exports, "Alert", {
  enumerable: true,
  get: function () { return chunkQLLBEUXV_cjs.Alert; }
});
Object.defineProperty(exports, "AlertDescription", {
  enumerable: true,
  get: function () { return chunkQLLBEUXV_cjs.AlertDescription; }
});
Object.defineProperty(exports, "AlertTitle", {
  enumerable: true,
  get: function () { return chunkQLLBEUXV_cjs.AlertTitle; }
});
Object.defineProperty(exports, "alertVariants", {
  enumerable: true,
  get: function () { return chunkQLLBEUXV_cjs.alertVariants; }
});
Object.defineProperty(exports, "Avatar", {
  enumerable: true,
  get: function () { return chunkUHS53NVJ_cjs.Avatar; }
});
Object.defineProperty(exports, "AvatarGroup", {
  enumerable: true,
  get: function () { return chunkUHS53NVJ_cjs.AvatarGroup; }
});
Object.defineProperty(exports, "avatarVariants", {
  enumerable: true,
  get: function () { return chunkUHS53NVJ_cjs.avatarVariants; }
});
Object.defineProperty(exports, "getInitials", {
  enumerable: true,
  get: function () { return chunkUHS53NVJ_cjs.getInitials; }
});
Object.defineProperty(exports, "Badge", {
  enumerable: true,
  get: function () { return chunkPA5DHCK4_cjs.Badge; }
});
Object.defineProperty(exports, "badgeVariants", {
  enumerable: true,
  get: function () { return chunkPA5DHCK4_cjs.badgeVariants; }
});
Object.defineProperty(exports, "Breadcrumb", {
  enumerable: true,
  get: function () { return chunkPEFJAWNR_cjs.Breadcrumb; }
});
Object.defineProperty(exports, "BreadcrumbSlash", {
  enumerable: true,
  get: function () { return chunkPEFJAWNR_cjs.BreadcrumbSlash; }
});
Object.defineProperty(exports, "cn", {
  enumerable: true,
  get: function () { return chunkOR5DRJCW_cjs.cn; }
});
exports.AppHeader = AppHeader;
exports.AppHeaderActions = AppHeaderActions;
exports.AppHeaderDivider = AppHeaderDivider;
exports.AppHeaderIconButton = AppHeaderIconButton;
exports.AppHeaderSearch = AppHeaderSearch;
exports.AppHeaderSection = AppHeaderSection;
exports.AppHeaderTitle = AppHeaderTitle;
exports.AppHeaderUserMenu = AppHeaderUserMenu;
exports.CommandPalette = CommandPalette;
exports.CommandPaletteProvider = CommandPaletteProvider;
exports.CommandPaletteTrigger = CommandPaletteTrigger;
exports.Sidebar = Sidebar;
exports.SidebarContent = SidebarContent;
exports.SidebarFooter = SidebarFooter;
exports.SidebarHeader = SidebarHeader;
exports.SidebarMobileToggle = SidebarMobileToggle;
exports.SidebarNav = SidebarNav;
exports.SidebarNavGroup = SidebarNavGroup;
exports.SidebarNavItem = SidebarNavItem;
exports.SidebarProvider = SidebarProvider;
exports.SidebarSearch = SidebarSearch;
exports.SidebarToggle = SidebarToggle;
exports.Toast = Toast;
exports.ToastContainer = ToastContainer;
exports.ToastProvider = ToastProvider;
exports.useCommandPalette = useCommandPalette;
exports.useSidebar = useSidebar;
exports.useToast = useToast;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map