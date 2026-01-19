'use strict';

var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React = require('react');
var classVarianceAuthority = require('class-variance-authority');
var jsxRuntime = require('react/jsx-runtime');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);

var TabsContext = React__namespace.createContext(
  void 0
);
function useTabsContext() {
  const context = React__namespace.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}
function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  variant = "underline",
  children,
  className
}) {
  const [uncontrolledValue, setUncontrolledValue] = React__namespace.useState(
    defaultValue || ""
  );
  const isControlled = controlledValue !== void 0;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const handleValueChange = React__namespace.useCallback(
    (newValue) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );
  return /* @__PURE__ */ jsxRuntime.jsx(
    TabsContext.Provider,
    {
      value: { value, onValueChange: handleValueChange, variant },
      children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: chunkOR5DRJCW_cjs.cn("w-full", className), children })
    }
  );
}
Tabs.displayName = "Tabs";
var tabsListVariants = classVarianceAuthority.cva(["flex items-center"], {
  variants: {
    variant: {
      underline: "border-b border-border gap-0",
      pills: "gap-1 p-1 rounded-lg bg-muted",
      enclosed: "gap-0 border-b border-border"
    }
  },
  defaultVariants: {
    variant: "underline"
  }
});
var TabsList = React__namespace.forwardRef(
  ({ className, ...props }, ref) => {
    const { variant } = useTabsContext();
    const listRef = React__namespace.useRef(null);
    const handleKeyDown = React__namespace.useCallback(
      (e) => {
        const list = listRef.current;
        if (!list) return;
        const triggers = Array.from(
          list.querySelectorAll(
            '[role="tab"]:not([disabled])'
          )
        );
        const currentIndex = triggers.findIndex(
          (trigger) => trigger === document.activeElement
        );
        let nextIndex;
        switch (e.key) {
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            nextIndex = currentIndex === triggers.length - 1 ? 0 : currentIndex + 1;
            triggers[nextIndex]?.focus();
            break;
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            nextIndex = currentIndex === 0 ? triggers.length - 1 : currentIndex - 1;
            triggers[nextIndex]?.focus();
            break;
          case "Home":
            e.preventDefault();
            triggers[0]?.focus();
            break;
          case "End":
            e.preventDefault();
            triggers[triggers.length - 1]?.focus();
            break;
        }
      },
      []
    );
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref: (node) => {
          listRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        },
        role: "tablist",
        tabIndex: 0,
        onKeyDown: handleKeyDown,
        className: chunkOR5DRJCW_cjs.cn(tabsListVariants({ variant }), className),
        ...props
      }
    );
  }
);
TabsList.displayName = "TabsList";
var tabsTriggerVariants = classVarianceAuthority.cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium transition-all duration-200",
    "whitespace-nowrap",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50"
  ],
  {
    variants: {
      variant: {
        underline: [
          "px-4 py-2 -mb-px",
          "border-b-2 border-transparent",
          "text-muted-foreground hover:text-foreground",
          "data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
        ],
        pills: [
          "px-3 py-1.5 rounded-md text-sm",
          "text-muted-foreground hover:text-foreground",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        ],
        enclosed: [
          "px-4 py-2 -mb-px",
          "border border-transparent rounded-t-lg",
          "text-muted-foreground hover:text-foreground",
          "data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground"
        ]
      }
    },
    defaultVariants: {
      variant: "underline"
    }
  }
);
var TabsTrigger = React__namespace.forwardRef(
  ({ className, value, icon, children, disabled, ...props }, ref) => {
    const { value: selectedValue, onValueChange, variant } = useTabsContext();
    const isSelected = selectedValue === value;
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        ref,
        type: "button",
        role: "tab",
        "aria-selected": isSelected,
        "aria-controls": `tabpanel-${value}`,
        id: `tab-${value}`,
        tabIndex: isSelected ? 0 : -1,
        "data-state": isSelected ? "active" : "inactive",
        disabled,
        onClick: () => onValueChange(value),
        className: chunkOR5DRJCW_cjs.cn(tabsTriggerVariants({ variant }), className),
        ...props,
        children: [
          icon && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "shrink-0", children: icon }),
          children
        ]
      }
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";
var TabsContent = React__namespace.forwardRef(
  ({ className, value, forceMount = false, children, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    const isSelected = selectedValue === value;
    if (!isSelected && !forceMount) {
      return null;
    }
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        ref,
        role: "tabpanel",
        id: `tabpanel-${value}`,
        "aria-labelledby": `tab-${value}`,
        tabIndex: 0,
        hidden: !isSelected,
        "data-state": isSelected ? "active" : "inactive",
        className: chunkOR5DRJCW_cjs.cn(
          "focus-visible:ring-ring mt-4 rounded-lg focus-visible:ring-2 focus-visible:outline-none",
          !isSelected && "hidden",
          className
        ),
        ...props,
        children
      }
    );
  }
);
TabsContent.displayName = "TabsContent";

exports.Tabs = Tabs;
exports.TabsContent = TabsContent;
exports.TabsList = TabsList;
exports.TabsTrigger = TabsTrigger;
exports.tabsListVariants = tabsListVariants;
exports.tabsTriggerVariants = tabsTriggerVariants;
//# sourceMappingURL=chunk-PFPBF3TQ.cjs.map
//# sourceMappingURL=chunk-PFPBF3TQ.cjs.map