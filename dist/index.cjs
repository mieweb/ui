'use strict';

var chunkUHS53NVJ_cjs = require('./chunk-UHS53NVJ.cjs');
var chunkXNY3NM2W_cjs = require('./chunk-XNY3NM2W.cjs');
var chunk2QX46LFO_cjs = require('./chunk-2QX46LFO.cjs');
var chunkSEZI2MIS_cjs = require('./chunk-SEZI2MIS.cjs');
var chunkS6UNPMAS_cjs = require('./chunk-S6UNPMAS.cjs');
var chunkZ3TFPXVN_cjs = require('./chunk-Z3TFPXVN.cjs');
var chunkFFJVCQ5R_cjs = require('./chunk-FFJVCQ5R.cjs');
var chunk4LNS5QDP_cjs = require('./chunk-4LNS5QDP.cjs');
var chunkO5HS7ZND_cjs = require('./chunk-O5HS7ZND.cjs');
var chunkP52GA3GJ_cjs = require('./chunk-P52GA3GJ.cjs');
var chunkMGGTYVHX_cjs = require('./chunk-MGGTYVHX.cjs');
var chunk64UPCPJC_cjs = require('./chunk-64UPCPJC.cjs');
var chunkHGON5QUF_cjs = require('./chunk-HGON5QUF.cjs');
var chunkHPFLIQZO_cjs = require('./chunk-HPFLIQZO.cjs');
var chunkPA5DHCK4_cjs = require('./chunk-PA5DHCK4.cjs');
var chunkQLLBEUXV_cjs = require('./chunk-QLLBEUXV.cjs');
var chunkZJCPW6MS_cjs = require('./chunk-ZJCPW6MS.cjs');
var chunkXWF7I3QH_cjs = require('./chunk-XWF7I3QH.cjs');
var chunkWDMNKM4C_cjs = require('./chunk-WDMNKM4C.cjs');
var chunk6HFFWEM3_cjs = require('./chunk-6HFFWEM3.cjs');
var chunkJ4XHETCY_cjs = require('./chunk-J4XHETCY.cjs');
var chunk2O7D6F67_cjs = require('./chunk-2O7D6F67.cjs');
require('./chunk-ZO46CFVN.cjs');
var chunkBTJHYGPI_cjs = require('./chunk-BTJHYGPI.cjs');
var chunkKMN7JX2X_cjs = require('./chunk-KMN7JX2X.cjs');
var chunkCPTPSLYC_cjs = require('./chunk-CPTPSLYC.cjs');
var chunkYEZJKPEN_cjs = require('./chunk-YEZJKPEN.cjs');
var chunkDQTQ4AQQ_cjs = require('./chunk-DQTQ4AQQ.cjs');
var chunkZENVEUAE_cjs = require('./chunk-ZENVEUAE.cjs');
var chunkQDGZBDBI_cjs = require('./chunk-QDGZBDBI.cjs');
var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React7 = require('react');
var jsxRuntime = require('react/jsx-runtime');
var classVarianceAuthority = require('class-variance-authority');

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

var React7__namespace = /*#__PURE__*/_interopNamespace(React7);

function Breadcrumb({
  items,
  separator,
  maxItems,
  renderLink,
  className
}) {
  const displayedItems = React7__namespace.useMemo(() => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));
    return [
      firstItem,
      { label: "...", isEllipsis: true },
      ...lastItems
    ];
  }, [items, maxItems]);
  const defaultSeparator = /* @__PURE__ */ jsxRuntime.jsx(ChevronRightIcon, { className: "text-muted-foreground h-4 w-4 shrink-0" });
  return /* @__PURE__ */ jsxRuntime.jsx("nav", { "aria-label": "Breadcrumb", className, children: /* @__PURE__ */ jsxRuntime.jsx("ol", { className: "flex flex-wrap items-center gap-1.5", children: displayedItems.map((item, index) => {
    const isLast = index === displayedItems.length - 1;
    const isEllipsis = item.isEllipsis;
    return /* @__PURE__ */ jsxRuntime.jsxs("li", { className: "flex items-center gap-1.5", children: [
      index > 0 && /* @__PURE__ */ jsxRuntime.jsx("span", { "aria-hidden": "true", children: separator || defaultSeparator }),
      isEllipsis ? /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground text-sm", children: "..." }) : isLast || !item.href ? /* @__PURE__ */ jsxRuntime.jsx(BreadcrumbPage, { item }) : renderLink ? renderLink(item, index) : /* @__PURE__ */ jsxRuntime.jsx(BreadcrumbLink, { item })
    ] }, index);
  }) }) });
}
Breadcrumb.displayName = "Breadcrumb";
function BreadcrumbLink({ item }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "a",
    {
      href: item.href,
      className: chunkOR5DRJCW_cjs.cn(
        "inline-flex items-center gap-1.5",
        "text-muted-foreground text-sm",
        "hover:text-foreground transition-colors",
        "focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none"
      ),
      children: [
        item.icon,
        item.label
      ]
    }
  );
}
function BreadcrumbPage({ item }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "span",
    {
      className: "text-foreground inline-flex items-center gap-1.5 text-sm font-medium",
      "aria-current": "page",
      children: [
        item.icon,
        item.label
      ]
    }
  );
}
function ChevronRightIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m9 18 6-6-6-6" })
    }
  );
}
function BreadcrumbSlash({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "span",
    {
      className: chunkOR5DRJCW_cjs.cn("text-muted-foreground mx-1", className),
      "aria-hidden": "true",
      children: "/"
    }
  );
}
var checkboxVariants = classVarianceAuthority.cva(
  [
    "shrink-0 appearance-none",
    "border-2 border-input rounded",
    "bg-background",
    "transition-all duration-150",
    "cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "checked:bg-primary-500 checked:border-primary-500",
    "indeterminate:bg-primary-500 indeterminate:border-primary-500"
  ],
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
var Checkbox = React7__namespace.forwardRef(
  ({
    className,
    size,
    label,
    description,
    indeterminate = false,
    error,
    labelPosition = "right",
    id,
    disabled,
    ...props
  }, ref) => {
    const internalRef = React7__namespace.useRef(null);
    const generatedId = React7__namespace.useId();
    const checkboxId = id || generatedId;
    const descriptionId = `${checkboxId}-description`;
    const errorId = `${checkboxId}-error`;
    React7__namespace.useEffect(() => {
      const checkbox = internalRef.current;
      if (checkbox) {
        checkbox.indeterminate = indeterminate;
      }
    }, [indeterminate]);
    React7__namespace.useImperativeHandle(ref, () => internalRef.current);
    const checkboxElement = /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "relative inline-flex items-center justify-center", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          ref: internalRef,
          id: checkboxId,
          type: "checkbox",
          disabled,
          "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
          "aria-invalid": !!error,
          className: chunkOR5DRJCW_cjs.cn(checkboxVariants({ size }), className),
          ...props
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        CheckIcon,
        {
          size,
          className: "pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100"
        }
      )
    ] });
    const labelElement = label && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "label",
        {
          htmlFor: checkboxId,
          className: chunkOR5DRJCW_cjs.cn(
            "text-foreground cursor-pointer text-sm font-medium select-none",
            disabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsxRuntime.jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description })
    ] });
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          className: chunkOR5DRJCW_cjs.cn(
            "flex items-start gap-3",
            labelPosition === "left" && "flex-row-reverse"
          ),
          children: [
            checkboxElement,
            labelElement
          ]
        }
      ),
      error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error })
    ] });
  }
);
Checkbox.displayName = "Checkbox";
function CheckboxGroup({
  label,
  description,
  error,
  orientation = "vertical",
  children,
  className
}) {
  const groupId = React7__namespace.useId();
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "fieldset",
    {
      className: chunkOR5DRJCW_cjs.cn("flex flex-col gap-2", className),
      "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
      children: [
        label && /* @__PURE__ */ jsxRuntime.jsx("legend", { className: "text-foreground text-sm font-medium", children: label }),
        description && /* @__PURE__ */ jsxRuntime.jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            role: "group",
            className: chunkOR5DRJCW_cjs.cn(
              "flex gap-4",
              orientation === "vertical" && "flex-col gap-3"
            ),
            children
          }
        ),
        error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error })
      ]
    }
  );
}
CheckboxGroup.displayName = "CheckboxGroup";
function CheckIcon({ size, className }) {
  const sizeMap = {
    sm: 10,
    md: 12,
    lg: 14
  };
  const iconSize = sizeMap[size || "md"];
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: iconSize,
      height: iconSize,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "3",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M20 6 9 17l-5-5" })
    }
  );
}
var modalOverlayVariants = classVarianceAuthority.cva(
  [
    "fixed inset-0 z-50",
    "bg-black/50 backdrop-blur-sm",
    "data-[state=open]:animate-in data-[state=open]:fade-in-0",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
  ],
  {
    variants: {},
    defaultVariants: {}
  }
);
var modalContentVariants = classVarianceAuthority.cva(
  [
    "fixed left-1/2 top-1/2 z-50",
    "-translate-x-1/2 -translate-y-1/2",
    "w-full bg-card text-card-foreground",
    "border border-border rounded-xl shadow-lg",
    "focus:outline-none",
    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
    "duration-200"
  ],
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        full: "max-w-[calc(100vw-2rem)]"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
function Modal({
  open,
  onOpenChange,
  children,
  size,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy
}) {
  const generatedId = React7__namespace.useId();
  const modalId = id || generatedId;
  const focusTrapRef = chunkWDMNKM4C_cjs.useFocusTrap(open);
  chunkJ4XHETCY_cjs.useEscapeKey(() => {
    if (closeOnEscape && open) {
      onOpenChange(false);
    }
  }, open);
  const handleOverlayClick = React7__namespace.useCallback(
    (e) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [closeOnOverlayClick, onOpenChange]
  );
  React7__namespace.useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntime.jsx(
    ModalContext.Provider,
    {
      value: { onClose: () => onOpenChange(false), modalId },
      children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "fixed inset-0 z-50", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: chunkOR5DRJCW_cjs.cn(modalOverlayVariants()),
            "data-state": open ? "open" : "closed",
            onClick: handleOverlayClick,
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            ref: focusTrapRef,
            role: "dialog",
            "aria-modal": "true",
            "aria-label": ariaLabel,
            "aria-labelledby": ariaLabelledBy || `${modalId}-title`,
            "aria-describedby": ariaDescribedBy,
            id: modalId,
            tabIndex: -1,
            "data-state": open ? "open" : "closed",
            className: chunkOR5DRJCW_cjs.cn(modalContentVariants({ size }), className),
            children
          }
        )
      ] })
    }
  );
}
Modal.displayName = "Modal";
var ModalContext = React7__namespace.createContext(
  void 0
);
function useModalContext() {
  const context = React7__namespace.useContext(ModalContext);
  if (!context) {
    throw new Error("Modal components must be used within a Modal");
  }
  return context;
}
var ModalHeader = React7__namespace.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      ref,
      className: chunkOR5DRJCW_cjs.cn(
        "flex items-center justify-between",
        "border-border border-b px-6 py-4",
        className
      ),
      ...props
    }
  )
);
ModalHeader.displayName = "ModalHeader";
var ModalTitle = React7__namespace.forwardRef(
  ({ className, children, ...props }, ref) => {
    const { modalId } = useModalContext();
    return /* @__PURE__ */ jsxRuntime.jsx(
      "h2",
      {
        ref,
        id: `${modalId}-title`,
        className: chunkOR5DRJCW_cjs.cn(
          "text-lg leading-none font-semibold tracking-tight",
          className
        ),
        ...props,
        children
      }
    );
  }
);
ModalTitle.displayName = "ModalTitle";
var ModalClose = React7__namespace.forwardRef(
  ({ className, children, onClick, ...props }, ref) => {
    const { onClose } = useModalContext();
    const handleClick = React7__namespace.useCallback(
      (e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          onClose();
        }
      },
      [onClick, onClose]
    );
    return /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        ref,
        type: "button",
        onClick: handleClick,
        className: chunkOR5DRJCW_cjs.cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          className
        ),
        "aria-label": "Close",
        ...props,
        children: children || /* @__PURE__ */ jsxRuntime.jsx(CloseIcon, {})
      }
    );
  }
);
ModalClose.displayName = "ModalClose";
var ModalBody = React7__namespace.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx("div", { ref, className: chunkOR5DRJCW_cjs.cn("px-6 py-4", className), ...props })
);
ModalBody.displayName = "ModalBody";
var ModalFooter = React7__namespace.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      ref,
      className: chunkOR5DRJCW_cjs.cn(
        "flex items-center justify-end gap-3",
        "border-border border-t px-6 py-4",
        className
      ),
      ...props
    }
  )
);
ModalFooter.displayName = "ModalFooter";
function CloseIcon() {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M18 6 6 18" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m6 6 12 12" })
      ]
    }
  );
}
var paginationButtonVariants = classVarianceAuthority.cva(
  [
    "inline-flex items-center justify-center",
    "font-medium transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50"
  ],
  {
    variants: {
      variant: {
        default: [
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "data-[active=true]:bg-primary-500 data-[active=true]:text-white"
        ],
        outline: [
          "border border-border text-muted-foreground",
          "hover:bg-muted hover:text-foreground",
          "data-[active=true]:border-primary-500 data-[active=true]:bg-primary-50 data-[active=true]:text-primary-500",
          "dark:data-[active=true]:bg-primary-950"
        ],
        ghost: [
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "data-[active=true]:text-primary-500 data-[active=true]:font-semibold"
        ]
      },
      size: {
        sm: "h-8 min-w-8 px-2.5 text-xs rounded-md gap-1",
        md: "h-10 min-w-10 px-3 text-sm rounded-lg gap-1.5",
        lg: "h-12 min-w-12 px-4 text-base rounded-xl gap-2"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);
function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  variant,
  size,
  labels,
  className
}) {
  const pageRange = React7__namespace.useMemo(() => {
    const range = [];
    range.push(1);
    const leftSiblingIndex = Math.max(page - siblingCount, 2);
    const rightSiblingIndex = Math.min(page + siblingCount, totalPages - 1);
    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;
    if (showLeftEllipsis) {
      range.push("ellipsis");
    }
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        range.push(i);
      }
    }
    if (showRightEllipsis) {
      range.push("ellipsis");
    }
    if (totalPages > 1) {
      range.push(totalPages);
    }
    return range;
  }, [page, totalPages, siblingCount]);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "nav",
    {
      role: "navigation",
      "aria-label": "Pagination",
      className: chunkOR5DRJCW_cjs.cn("flex items-center gap-1", className),
      children: [
        showFirstLast && /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(1),
            disabled: !canGoPrev,
            "aria-label": labels?.first || "Go to first page",
            className: chunkOR5DRJCW_cjs.cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(ChevronsLeftIcon, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: labels?.first || "First" })
            ]
          }
        ),
        showPrevNext && /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(page - 1),
            disabled: !canGoPrev,
            "aria-label": labels?.previous || "Go to previous page",
            className: chunkOR5DRJCW_cjs.cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(ChevronLeftIcon, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only sm:not-sr-only", children: labels?.previous || "Previous" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex items-center gap-1", children: pageRange.map((item, index) => {
          if (item === "ellipsis") {
            return /* @__PURE__ */ jsxRuntime.jsx(
              "span",
              {
                className: chunkOR5DRJCW_cjs.cn(
                  paginationButtonVariants({ variant, size }),
                  "cursor-default hover:bg-transparent"
                ),
                "aria-hidden": "true",
                children: "..."
              },
              `ellipsis-${index}`
            );
          }
          return /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              type: "button",
              onClick: () => onPageChange(item),
              "aria-label": `Go to page ${item}`,
              "aria-current": item === page ? "page" : void 0,
              "data-active": item === page,
              className: chunkOR5DRJCW_cjs.cn(paginationButtonVariants({ variant, size })),
              children: item
            },
            item
          );
        }) }),
        showPrevNext && /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(page + 1),
            disabled: !canGoNext,
            "aria-label": labels?.next || "Go to next page",
            className: chunkOR5DRJCW_cjs.cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only sm:not-sr-only", children: labels?.next || "Next" }),
              /* @__PURE__ */ jsxRuntime.jsx(ChevronRightIcon2, { className: "h-4 w-4" })
            ]
          }
        ),
        showFirstLast && /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(totalPages),
            disabled: !canGoNext,
            "aria-label": labels?.last || "Go to last page",
            className: chunkOR5DRJCW_cjs.cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: labels?.last || "Last" }),
              /* @__PURE__ */ jsxRuntime.jsx(ChevronsRightIcon, { className: "h-4 w-4" })
            ]
          }
        )
      ]
    }
  );
}
Pagination.displayName = "Pagination";
function SimplePagination({
  page,
  totalPages,
  onPageChange,
  showPageInfo = true,
  variant,
  size,
  className
}) {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "nav",
    {
      role: "navigation",
      "aria-label": "Pagination",
      className: chunkOR5DRJCW_cjs.cn("flex items-center gap-2", className),
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(page - 1),
            disabled: !canGoPrev,
            "aria-label": "Go to previous page",
            className: chunkOR5DRJCW_cjs.cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(ChevronLeftIcon, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { children: "Previous" })
            ]
          }
        ),
        showPageInfo && /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "text-muted-foreground px-2 text-sm", children: [
          "Page ",
          page,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(page + 1),
            disabled: !canGoNext,
            "aria-label": "Go to next page",
            className: chunkOR5DRJCW_cjs.cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsxRuntime.jsx("span", { children: "Next" }),
              /* @__PURE__ */ jsxRuntime.jsx(ChevronRightIcon2, { className: "h-4 w-4" })
            ]
          }
        )
      ]
    }
  );
}
SimplePagination.displayName = "SimplePagination";
function ChevronLeftIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m15 18-6-6 6-6" })
    }
  );
}
function ChevronRightIcon2({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m9 18 6-6-6-6" })
    }
  );
}
function ChevronsLeftIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m11 17-5-5 5-5" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m18 17-5-5 5-5" })
      ]
    }
  );
}
function ChevronsRightIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m6 17 5-5-5-5" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m13 17 5-5-5-5" })
      ]
    }
  );
}
var progressBarTrackVariants = classVarianceAuthority.cva(
  ["w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"],
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
        xl: "h-4"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
var progressBarFillVariants = classVarianceAuthority.cva(
  ["h-full rounded-full transition-all duration-300 ease-out"],
  {
    variants: {
      variant: {
        default: "bg-primary-500",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-red-500"
      },
      animated: {
        true: "animate-pulse",
        false: ""
      },
      striped: {
        true: [
          "bg-gradient-to-r",
          "from-transparent via-white/20 to-transparent",
          "bg-[length:1rem_100%]",
          "animate-[progress-stripes_1s_linear_infinite]"
        ],
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      animated: false,
      striped: false
    }
  }
);
function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  formatValue,
  size,
  variant,
  animated,
  striped,
  className,
  indeterminate = false
}) {
  const percentage = Math.min(Math.max(value / max * 100, 0), 100);
  const progressId = React7__namespace.useId();
  const displayValue = formatValue ? formatValue(value, max) : `${Math.round(percentage)}%`;
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: chunkOR5DRJCW_cjs.cn("w-full", className), children: [
    (label || showValue) && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-1.5 flex items-center justify-between", children: [
      label && /* @__PURE__ */ jsxRuntime.jsx(
        "label",
        {
          id: `${progressId}-label`,
          className: "text-foreground text-sm font-medium",
          children: label
        }
      ),
      showValue && !indeterminate && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground text-sm", children: displayValue })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        role: "progressbar",
        "aria-valuenow": indeterminate ? void 0 : value,
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-labelledby": label ? `${progressId}-label` : void 0,
        "aria-label": !label ? "Progress" : void 0,
        className: chunkOR5DRJCW_cjs.cn(progressBarTrackVariants({ size })),
        children: /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: chunkOR5DRJCW_cjs.cn(
              progressBarFillVariants({ variant, animated, striped }),
              indeterminate && "w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite]",
              !striped && variant === "default" && "bg-primary-500",
              !striped && variant === "success" && "bg-green-500",
              !striped && variant === "warning" && "bg-yellow-500",
              !striped && variant === "danger" && "bg-red-500"
            ),
            style: indeterminate ? void 0 : { width: `${percentage}%` }
          }
        )
      }
    )
  ] });
}
Progress.displayName = "Progress";
var circularProgressVariants = classVarianceAuthority.cva(["relative inline-flex"], {
  variants: {
    size: {
      sm: "h-8 w-8",
      md: "h-12 w-12",
      lg: "h-16 w-16",
      xl: "h-24 w-24"
    }
  },
  defaultVariants: {
    size: "md"
  }
});
function CircularProgress({
  value,
  max = 100,
  variant = "default",
  size,
  strokeWidth = 4,
  showValue = false,
  indeterminate = false,
  className
}) {
  const percentage = Math.min(Math.max(value / max * 100, 0), 100);
  const sizeMap = { sm: 32, md: 48, lg: 64, xl: 96 };
  const svgSize = sizeMap[size || "md"];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - percentage / 100 * circumference;
  const variantColors = {
    default: "stroke-primary-500",
    success: "stroke-green-500",
    warning: "stroke-yellow-500",
    danger: "stroke-red-500"
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      role: "progressbar",
      "aria-valuenow": indeterminate ? void 0 : value,
      "aria-valuemin": 0,
      "aria-valuemax": max,
      "aria-label": "Progress",
      className: chunkOR5DRJCW_cjs.cn(circularProgressVariants({ size }), className),
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          "svg",
          {
            className: chunkOR5DRJCW_cjs.cn("-rotate-90 transform", indeterminate && "animate-spin"),
            width: svgSize,
            height: svgSize,
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                "circle",
                {
                  className: "stroke-neutral-200 dark:stroke-neutral-700",
                  fill: "none",
                  strokeWidth,
                  cx: svgSize / 2,
                  cy: svgSize / 2,
                  r: radius
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(
                "circle",
                {
                  className: chunkOR5DRJCW_cjs.cn(
                    variantColors[variant],
                    "transition-all duration-300 ease-out"
                  ),
                  fill: "none",
                  strokeWidth,
                  strokeLinecap: "round",
                  cx: svgSize / 2,
                  cy: svgSize / 2,
                  r: radius,
                  strokeDasharray: circumference,
                  strokeDashoffset: indeterminate ? circumference * 0.75 : offset
                }
              )
            ]
          }
        ),
        showValue && !indeterminate && /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "text-foreground absolute inset-0 flex items-center justify-center text-xs font-medium", children: [
          Math.round(percentage),
          "%"
        ] })
      ]
    }
  );
}
CircularProgress.displayName = "CircularProgress";
var RadioGroupContext = React7__namespace.createContext(void 0);
function useRadioGroupContext() {
  const context = React7__namespace.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("Radio must be used within a RadioGroup");
  }
  return context;
}
var radioVariants = classVarianceAuthority.cva(
  [
    "shrink-0 appearance-none",
    "border-2 border-input rounded-full",
    "bg-background",
    "transition-all duration-150",
    "cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "checked:border-primary-500"
  ],
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
function RadioGroup({
  name,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  label,
  description,
  error,
  disabled = false,
  size = "md",
  orientation = "vertical",
  children,
  className
}) {
  const generatedName = React7__namespace.useId();
  const groupName = name || generatedName;
  const groupId = React7__namespace.useId();
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;
  const [uncontrolledValue, setUncontrolledValue] = React7__namespace.useState(defaultValue);
  const isControlled = controlledValue !== void 0;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const handleChange = React7__namespace.useCallback(
    (newValue) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );
  return /* @__PURE__ */ jsxRuntime.jsx(
    RadioGroupContext.Provider,
    {
      value: { name: groupName, value, onChange: handleChange, disabled, size },
      children: /* @__PURE__ */ jsxRuntime.jsxs(
        "fieldset",
        {
          role: "radiogroup",
          className: chunkOR5DRJCW_cjs.cn("flex flex-col gap-2", className),
          "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
          children: [
            label && /* @__PURE__ */ jsxRuntime.jsx("legend", { className: "text-foreground text-sm font-medium", children: label }),
            description && /* @__PURE__ */ jsxRuntime.jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description }),
            /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: chunkOR5DRJCW_cjs.cn(
                  "flex gap-4",
                  orientation === "vertical" && "flex-col gap-3"
                ),
                children
              }
            ),
            error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error })
          ]
        }
      )
    }
  );
}
RadioGroup.displayName = "RadioGroup";
var Radio = React7__namespace.forwardRef(
  ({
    className,
    size: propSize,
    value,
    label,
    description,
    labelPosition = "right",
    disabled: propDisabled,
    id,
    ...props
  }, ref) => {
    const context = useRadioGroupContext();
    const generatedId = React7__namespace.useId();
    const radioId = id || generatedId;
    const descriptionId = `${radioId}-description`;
    const isChecked = context.value === value;
    const isDisabled = propDisabled || context.disabled;
    const size = propSize || context.size;
    const handleChange = React7__namespace.useCallback(() => {
      if (!isDisabled) {
        context.onChange(value);
      }
    }, [isDisabled, context, value]);
    const radioElement = /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "relative inline-flex items-center justify-center", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "input",
        {
          ref,
          id: radioId,
          type: "radio",
          name: context.name,
          value,
          checked: isChecked,
          disabled: isDisabled,
          onChange: handleChange,
          "aria-describedby": description ? descriptionId : void 0,
          className: chunkOR5DRJCW_cjs.cn(radioVariants({ size }), className),
          ...props
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "span",
        {
          className: chunkOR5DRJCW_cjs.cn(
            "bg-primary-500 pointer-events-none absolute rounded-full transition-transform",
            size === "sm" && "h-2 w-2",
            size === "md" && "h-2.5 w-2.5",
            size === "lg" && "h-3 w-3",
            isChecked ? "scale-100" : "scale-0"
          )
        }
      )
    ] });
    const labelElement = label && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "label",
        {
          htmlFor: radioId,
          className: chunkOR5DRJCW_cjs.cn(
            "text-foreground cursor-pointer text-sm font-medium select-none",
            isDisabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsxRuntime.jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description })
    ] });
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className: chunkOR5DRJCW_cjs.cn(
          "flex items-start gap-3",
          labelPosition === "left" && "flex-row-reverse"
        ),
        children: [
          radioElement,
          labelElement
        ]
      }
    );
  }
);
Radio.displayName = "Radio";
var selectTriggerVariants = classVarianceAuthority.cva(
  [
    "flex w-full items-center justify-between gap-2",
    "border border-input rounded-lg",
    "bg-background text-foreground",
    "transition-colors duration-200",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
    "disabled:cursor-not-allowed disabled:opacity-50"
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-3 text-base",
        lg: "h-12 px-4 text-lg"
      },
      hasError: {
        true: "border-destructive focus:ring-destructive",
        false: ""
      }
    },
    defaultVariants: {
      size: "md",
      hasError: false
    }
  }
);
function Select({
  options,
  value: controlledValue,
  defaultValue,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  label,
  hideLabel = false,
  error,
  helperText,
  size,
  hasError,
  searchable = false,
  searchPlaceholder = "Search...",
  noResultsText = "No results found",
  className,
  id
}) {
  const [isOpen, setIsOpen] = React7__namespace.useState(false);
  const [uncontrolledValue, setUncontrolledValue] = React7__namespace.useState(
    defaultValue || ""
  );
  const [searchQuery, setSearchQuery] = React7__namespace.useState("");
  const [highlightedIndex, setHighlightedIndex] = React7__namespace.useState(-1);
  const containerRef = React7__namespace.useRef(null);
  const triggerRef = React7__namespace.useRef(null);
  const searchInputRef = React7__namespace.useRef(null);
  const listRef = React7__namespace.useRef(null);
  const generatedId = React7__namespace.useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const isControlled = controlledValue !== void 0;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const flatOptions = React7__namespace.useMemo(() => {
    const result = [];
    for (const item of options) {
      if ("options" in item) {
        result.push(...item.options);
      } else {
        result.push(item);
      }
    }
    return result;
  }, [options]);
  const filteredOptions = React7__namespace.useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    const result = [];
    for (const item of options) {
      if ("options" in item) {
        const filteredGroupOptions = item.options.filter(
          (opt) => opt.label.toLowerCase().includes(query)
        );
        if (filteredGroupOptions.length > 0) {
          result.push({ ...item, options: filteredGroupOptions });
        }
      } else {
        if (item.label.toLowerCase().includes(query)) {
          result.push(item);
        }
      }
    }
    return result;
  }, [options, searchQuery]);
  const filteredFlatOptions = React7__namespace.useMemo(() => {
    const result = [];
    for (const item of filteredOptions) {
      if ("options" in item) {
        result.push(...item.options.filter((opt) => !opt.disabled));
      } else if (!item.disabled) {
        result.push(item);
      }
    }
    return result;
  }, [filteredOptions]);
  const selectedOption = flatOptions.find((opt) => opt.value === value);
  chunkJ4XHETCY_cjs.useClickOutside(containerRef, () => setIsOpen(false));
  chunkJ4XHETCY_cjs.useEscapeKey(() => {
    if (isOpen) {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }, isOpen);
  const handleValueChange = React7__namespace.useCallback(
    (newValue) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
      setIsOpen(false);
      setSearchQuery("");
      triggerRef.current?.focus();
    },
    [isControlled, onValueChange]
  );
  const handleKeyDown = React7__namespace.useCallback(
    (e) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex(
              (prev) => prev < filteredFlatOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex(
              (prev) => prev > 0 ? prev - 1 : filteredFlatOptions.length - 1
            );
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            handleValueChange(filteredFlatOptions[highlightedIndex].value);
          } else if (!isOpen) {
            setIsOpen(true);
          }
          break;
        case "Home":
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setHighlightedIndex(filteredFlatOptions.length - 1);
          break;
      }
    },
    [isOpen, highlightedIndex, filteredFlatOptions, handleValueChange]
  );
  React7__namespace.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);
  React7__namespace.useEffect(() => {
    setHighlightedIndex(filteredFlatOptions.length > 0 ? 0 : -1);
  }, [searchQuery, filteredFlatOptions.length]);
  const describedByIds = [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: chunkOR5DRJCW_cjs.cn("flex flex-col gap-1.5", className), children: [
    label && /* @__PURE__ */ jsxRuntime.jsx(
      "label",
      {
        htmlFor: selectId,
        className: chunkOR5DRJCW_cjs.cn(
          "text-foreground text-sm font-medium",
          hideLabel && "sr-only"
        ),
        children: label
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { ref: containerRef, className: "relative", children: [
      /* @__PURE__ */ jsxRuntime.jsxs(
        "button",
        {
          ref: triggerRef,
          id: selectId,
          type: "button",
          role: "combobox",
          "aria-haspopup": "listbox",
          "aria-expanded": isOpen,
          "aria-controls": listboxId,
          "aria-invalid": hasError || !!error,
          "aria-describedby": describedByIds || void 0,
          disabled,
          onClick: () => setIsOpen(!isOpen),
          onKeyDown: handleKeyDown,
          className: chunkOR5DRJCW_cjs.cn(
            selectTriggerVariants({ size, hasError: hasError || !!error })
          ),
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "span",
              {
                className: chunkOR5DRJCW_cjs.cn(
                  "truncate",
                  !selectedOption && "text-muted-foreground"
                ),
                children: selectedOption?.label || placeholder
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              ChevronDownIcon,
              {
                className: chunkOR5DRJCW_cjs.cn(
                  "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
                  isOpen && "rotate-180"
                )
              }
            )
          ]
        }
      ),
      isOpen && /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          className: chunkOR5DRJCW_cjs.cn(
            "absolute z-50 mt-1 w-full",
            "border-border bg-card rounded-lg border shadow-lg",
            "animate-in fade-in zoom-in-95 duration-100"
          ),
          children: [
            searchable && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "border-border border-b p-2", children: /* @__PURE__ */ jsxRuntime.jsx(
              "input",
              {
                ref: searchInputRef,
                type: "text",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                onKeyDown: handleKeyDown,
                placeholder: searchPlaceholder,
                className: chunkOR5DRJCW_cjs.cn(
                  "border-input bg-background w-full rounded-md border px-3 py-2 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus:ring-ring focus:ring-2 focus:outline-none"
                ),
                "aria-label": "Search options"
              }
            ) }),
            /* @__PURE__ */ jsxRuntime.jsx(
              "ul",
              {
                ref: listRef,
                id: listboxId,
                role: "listbox",
                "aria-label": label || "Options",
                className: "max-h-60 overflow-auto p-1",
                children: filteredFlatOptions.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx("li", { className: "text-muted-foreground px-3 py-2 text-center text-sm", children: noResultsText }) : filteredOptions.map((item) => {
                  if ("options" in item) {
                    return /* @__PURE__ */ jsxRuntime.jsxs("li", { role: "presentation", children: [
                      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase", children: item.label }),
                      /* @__PURE__ */ jsxRuntime.jsx("ul", { role: "group", "aria-label": item.label, children: item.options.map((option) => /* @__PURE__ */ jsxRuntime.jsx(
                        SelectOptionItem,
                        {
                          option,
                          isSelected: option.value === value,
                          isHighlighted: filteredFlatOptions[highlightedIndex]?.value === option.value,
                          onSelect: () => handleValueChange(option.value),
                          onMouseEnter: () => {
                            const idx = filteredFlatOptions.findIndex(
                              (o) => o.value === option.value
                            );
                            setHighlightedIndex(idx);
                          }
                        },
                        option.value
                      )) })
                    ] }, `group-${item.label}`);
                  }
                  return /* @__PURE__ */ jsxRuntime.jsx(
                    SelectOptionItem,
                    {
                      option: item,
                      isSelected: item.value === value,
                      isHighlighted: filteredFlatOptions[highlightedIndex]?.value === item.value,
                      onSelect: () => handleValueChange(item.value),
                      onMouseEnter: () => {
                        const idx = filteredFlatOptions.findIndex(
                          (o) => o.value === item.value
                        );
                        setHighlightedIndex(idx);
                      }
                    },
                    item.value
                  );
                })
              }
            )
          ]
        }
      )
    ] }),
    error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error }),
    helperText && !error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: helperId, className: "text-muted-foreground text-sm", children: helperText })
  ] });
}
Select.displayName = "Select";
function SelectOptionItem({
  option,
  isSelected,
  isHighlighted,
  onSelect,
  onMouseEnter
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!option.disabled) {
        onSelect();
      }
    }
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "li",
    {
      role: "option",
      "aria-selected": isSelected,
      "aria-disabled": option.disabled,
      "data-highlighted": isHighlighted,
      "data-disabled": option.disabled,
      tabIndex: isHighlighted ? 0 : -1,
      onClick: option.disabled ? void 0 : onSelect,
      onKeyDown: handleKeyDown,
      onMouseEnter: option.disabled ? void 0 : onMouseEnter,
      className: chunkOR5DRJCW_cjs.cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm",
        "transition-colors outline-none",
        isHighlighted && "bg-muted",
        isSelected && "bg-primary-50 text-primary-900 dark:bg-primary-950 dark:text-primary-100",
        option.disabled && "cursor-not-allowed opacity-50"
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "flex-1 truncate", children: option.label }),
        isSelected && /* @__PURE__ */ jsxRuntime.jsx(CheckIcon2, { className: "text-primary-500 h-4 w-4 shrink-0" })
      ]
    }
  );
}
function ChevronDownIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m6 9 6 6 6-6" })
    }
  );
}
function CheckIcon2({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M20 6 9 17l-5-5" })
    }
  );
}
var skeletonVariants = classVarianceAuthority.cva(
  ["animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700"],
  {
    variants: {
      variant: {
        default: "",
        text: "h-4",
        title: "h-6",
        avatar: "rounded-full",
        button: "h-10 w-24",
        card: "h-40",
        image: "aspect-video"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Skeleton({
  className,
  variant,
  width,
  height,
  circle,
  style,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        skeletonVariants({ variant }),
        circle && "rounded-full",
        className
      ),
      style: {
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style
      },
      "aria-hidden": "true",
      ...props
    }
  );
}
Skeleton.displayName = "Skeleton";
function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
  gap = "sm",
  className
}) {
  const gapClasses = {
    sm: "space-y-2",
    md: "space-y-3",
    lg: "space-y-4"
  };
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: chunkOR5DRJCW_cjs.cn(gapClasses[gap], className), "aria-hidden": "true", children: Array.from({ length: lines }).map((_, index) => /* @__PURE__ */ jsxRuntime.jsx(
    Skeleton,
    {
      variant: "text",
      style: {
        width: index === lines - 1 ? lastLineWidth : "100%"
      }
    },
    index
  )) });
}
SkeletonText.displayName = "SkeletonText";
function SkeletonCard({
  showImage = true,
  showAvatar = false,
  textLines = 2,
  className
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        "border-border bg-card space-y-4 rounded-xl border p-4",
        className
      ),
      "aria-hidden": "true",
      children: [
        showImage && /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { variant: "image", className: "rounded-lg" }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-3", children: [
          showAvatar && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { circle: true, width: 40, height: 40 }),
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex-1 space-y-2", children: [
              /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { variant: "text", width: "50%" }),
              /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { variant: "text", width: "30%" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { variant: "title", width: "80%" }),
          /* @__PURE__ */ jsxRuntime.jsx(SkeletonText, { lines: textLines })
        ] })
      ]
    }
  );
}
SkeletonCard.displayName = "SkeletonCard";
function SkeletonTable({
  rows = 5,
  columns = 4,
  className
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: chunkOR5DRJCW_cjs.cn("space-y-3", className), "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex gap-4", children: Array.from({ length: columns }).map((_, i) => /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { variant: "text", className: "h-5 flex-1" }, `header-${i}`)) }),
    Array.from({ length: rows }).map((_, rowIndex) => /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex gap-4", children: Array.from({ length: columns }).map((_2, colIndex) => /* @__PURE__ */ jsxRuntime.jsx(
      Skeleton,
      {
        variant: "text",
        className: "flex-1"
      },
      `cell-${rowIndex}-${colIndex}`
    )) }, `row-${rowIndex}`))
  ] });
}
SkeletonTable.displayName = "SkeletonTable";
var spinnerVariants = classVarianceAuthority.cva(
  ["animate-spin rounded-full border-2 border-current border-t-transparent"],
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12"
      },
      variant: {
        default: "text-primary-500",
        muted: "text-muted-foreground",
        white: "text-white"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);
function Spinner({
  className,
  size,
  variant,
  label = "Loading",
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      role: "status",
      "aria-label": label,
      className: chunkOR5DRJCW_cjs.cn(spinnerVariants({ size, variant }), className),
      ...props,
      children: /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: label })
    }
  );
}
Spinner.displayName = "Spinner";
function SpinnerWithLabel({
  label,
  labelPosition = "bottom",
  size,
  variant,
  className,
  ...props
}) {
  const positionClasses = {
    top: "flex-col-reverse",
    bottom: "flex-col",
    left: "flex-row-reverse",
    right: "flex-row"
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      role: "status",
      "aria-label": label,
      className: chunkOR5DRJCW_cjs.cn(
        "inline-flex items-center justify-center gap-2",
        positionClasses[labelPosition],
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: chunkOR5DRJCW_cjs.cn(spinnerVariants({ size, variant })),
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-muted-foreground text-sm", children: label })
      ]
    }
  );
}
SpinnerWithLabel.displayName = "SpinnerWithLabel";
function FullPageSpinner({
  backdrop = true,
  text,
  size = "xl",
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4",
        backdrop && "bg-background/80 backdrop-blur-sm"
      ),
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(Spinner, { size, ...props }),
        text && /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-muted-foreground text-sm", children: text })
      ]
    }
  );
}
FullPageSpinner.displayName = "FullPageSpinner";
var switchTrackVariants = classVarianceAuthority.cva(
  [
    "relative inline-flex shrink-0",
    "cursor-pointer rounded-full",
    "transition-colors duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "bg-neutral-200 dark:bg-neutral-700",
    "data-[state=checked]:bg-primary-500"
  ],
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-14"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
var switchThumbVariants = classVarianceAuthority.cva(
  [
    "pointer-events-none inline-block rounded-full",
    "bg-white shadow-lg",
    "ring-0 transition-transform duration-200 ease-in-out"
  ],
  {
    variants: {
      size: {
        sm: "h-4 w-4 data-[state=checked]:translate-x-4 translate-x-0.5",
        md: "h-5 w-5 data-[state=checked]:translate-x-5 translate-x-0.5",
        lg: "h-6 w-6 data-[state=checked]:translate-x-7 translate-x-0.5"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
var Switch = React7__namespace.forwardRef(
  ({
    className,
    size,
    checked: controlledChecked,
    defaultChecked = false,
    onCheckedChange,
    label,
    description,
    labelPosition = "right",
    disabled,
    id,
    ...props
  }, ref) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React7__namespace.useState(defaultChecked);
    const generatedId = React7__namespace.useId();
    const switchId = id || generatedId;
    const descriptionId = `${switchId}-description`;
    const isControlled = controlledChecked !== void 0;
    const isChecked = isControlled ? controlledChecked : uncontrolledChecked;
    const handleToggle = React7__namespace.useCallback(() => {
      if (disabled) return;
      const newValue = !isChecked;
      if (!isControlled) {
        setUncontrolledChecked(newValue);
      }
      onCheckedChange?.(newValue);
    }, [disabled, isChecked, isControlled, onCheckedChange]);
    const handleKeyDown = React7__namespace.useCallback(
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      },
      [handleToggle]
    );
    const switchElement = /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        ref,
        id: switchId,
        type: "button",
        role: "switch",
        "aria-checked": isChecked,
        "aria-describedby": description ? descriptionId : void 0,
        "data-state": isChecked ? "checked" : "unchecked",
        disabled,
        onClick: handleToggle,
        onKeyDown: handleKeyDown,
        className: chunkOR5DRJCW_cjs.cn(switchTrackVariants({ size }), "items-center", className),
        ...props,
        children: /* @__PURE__ */ jsxRuntime.jsx(
          "span",
          {
            "data-state": isChecked ? "checked" : "unchecked",
            className: switchThumbVariants({ size })
          }
        )
      }
    );
    const labelElement = label && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "label",
        {
          htmlFor: switchId,
          className: chunkOR5DRJCW_cjs.cn(
            "text-foreground cursor-pointer text-sm font-medium select-none",
            disabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsxRuntime.jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description })
    ] });
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className: chunkOR5DRJCW_cjs.cn(
          "flex items-center gap-3",
          labelPosition === "left" && "flex-row-reverse"
        ),
        children: [
          switchElement,
          labelElement
        ]
      }
    );
  }
);
Switch.displayName = "Switch";
var Table = React7__namespace.forwardRef(
  ({ className, responsive = true, children, ...props }, ref) => {
    const table = /* @__PURE__ */ jsxRuntime.jsx(
      "table",
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn("w-full caption-bottom text-sm", className),
        ...props,
        children
      }
    );
    if (responsive) {
      return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "relative w-full overflow-auto", children: table });
    }
    return table;
  }
);
Table.displayName = "Table";
var TableHeader = React7__namespace.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx("thead", { ref, className: chunkOR5DRJCW_cjs.cn("[&_tr]:border-b", className), ...props })
);
TableHeader.displayName = "TableHeader";
var TableBody = React7__namespace.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
    "tbody",
    {
      ref,
      className: chunkOR5DRJCW_cjs.cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  )
);
TableBody.displayName = "TableBody";
var TableFooter = React7__namespace.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
    "tfoot",
    {
      ref,
      className: chunkOR5DRJCW_cjs.cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      ),
      ...props
    }
  )
);
TableFooter.displayName = "TableFooter";
var TableRow = React7__namespace.forwardRef(
  ({ className, selected, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
    "tr",
    {
      ref,
      "data-selected": selected,
      className: chunkOR5DRJCW_cjs.cn(
        "border-border border-b transition-colors",
        "hover:bg-muted/50",
        "data-[selected=true]:bg-muted",
        className
      ),
      ...props
    }
  )
);
TableRow.displayName = "TableRow";
var TableHead = React7__namespace.forwardRef(
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => {
    const content = sortable ? /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        type: "button",
        onClick: onSort,
        className: chunkOR5DRJCW_cjs.cn(
          "hover:text-foreground flex items-center gap-1 transition-colors",
          "focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none"
        ),
        "aria-label": `Sort column ${sortDirection === "asc" ? "descending" : "ascending"}`,
        children: [
          children,
          /* @__PURE__ */ jsxRuntime.jsx(SortIcon, { direction: sortDirection })
        ]
      }
    ) : children;
    return /* @__PURE__ */ jsxRuntime.jsx(
      "th",
      {
        ref,
        "aria-sort": sortable ? sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : "none" : void 0,
        className: chunkOR5DRJCW_cjs.cn(
          "text-muted-foreground h-12 px-4 text-left align-middle font-medium",
          "[&:has([role=checkbox])]:pr-0",
          className
        ),
        ...props,
        children: content
      }
    );
  }
);
TableHead.displayName = "TableHead";
var TableCell = React7__namespace.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
    "td",
    {
      ref,
      className: chunkOR5DRJCW_cjs.cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className
      ),
      ...props
    }
  )
);
TableCell.displayName = "TableCell";
var TableCaption = React7__namespace.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
  "caption",
  {
    ref,
    className: chunkOR5DRJCW_cjs.cn("text-muted-foreground mt-4 text-sm", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";
function SortIcon({ direction }) {
  if (direction === "asc") {
    return /* @__PURE__ */ jsxRuntime.jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        className: "shrink-0",
        children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m5 12 7-7 7 7" })
      }
    );
  }
  if (direction === "desc") {
    return /* @__PURE__ */ jsxRuntime.jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        className: "shrink-0",
        children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m19 12-7 7-7-7" })
      }
    );
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      className: "shrink-0 opacity-50",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m7 15 5 5 5-5" }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m7 9 5-5 5 5" })
      ]
    }
  );
}
var TabsContext = React7__namespace.createContext(
  void 0
);
function useTabsContext() {
  const context = React7__namespace.useContext(TabsContext);
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
  const [uncontrolledValue, setUncontrolledValue] = React7__namespace.useState(
    defaultValue || ""
  );
  const isControlled = controlledValue !== void 0;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const handleValueChange = React7__namespace.useCallback(
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
var TabsList = React7__namespace.forwardRef(
  ({ className, ...props }, ref) => {
    const { variant } = useTabsContext();
    const listRef = React7__namespace.useRef(null);
    const handleKeyDown = React7__namespace.useCallback(
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
var TabsTrigger = React7__namespace.forwardRef(
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
var TabsContent = React7__namespace.forwardRef(
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
var textareaVariants = classVarianceAuthority.cva(
  [
    "w-full px-3 py-2",
    "border border-input rounded-lg",
    "bg-background text-foreground",
    "placeholder:text-muted-foreground",
    "transition-colors duration-200",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "resize-y"
  ],
  {
    variants: {
      size: {
        sm: "text-sm min-h-[60px]",
        md: "text-base min-h-[80px]",
        lg: "text-lg min-h-[100px]"
      },
      hasError: {
        true: "border-destructive focus:ring-destructive",
        false: ""
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize"
      }
    },
    defaultVariants: {
      size: "md",
      hasError: false,
      resize: "vertical"
    }
  }
);
var Textarea = React7__namespace.forwardRef(
  ({
    className,
    size,
    hasError,
    resize,
    label,
    hideLabel,
    error,
    helperText,
    maxLength,
    showCount = false,
    autoResize = false,
    id,
    value,
    defaultValue,
    onChange,
    "aria-describedby": ariaDescribedBy,
    ...props
  }, ref) => {
    const internalRef = React7__namespace.useRef(null);
    const [internalValue, setInternalValue] = React7__namespace.useState(
      defaultValue || ""
    );
    const generatedId = React7__namespace.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const countId = `${textareaId}-count`;
    React7__namespace.useImperativeHandle(ref, () => internalRef.current);
    const currentValue = value !== void 0 ? String(value) : internalValue;
    const characterCount = currentValue.length;
    const adjustHeight = React7__namespace.useCallback(() => {
      const textarea = internalRef.current;
      if (textarea && autoResize) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [autoResize]);
    React7__namespace.useEffect(() => {
      adjustHeight();
    }, [currentValue, adjustHeight]);
    const handleChange = React7__namespace.useCallback(
      (e) => {
        if (value === void 0) {
          setInternalValue(e.target.value);
        }
        onChange?.(e);
        adjustHeight();
      },
      [value, onChange, adjustHeight]
    );
    const describedByIds = [
      error ? errorId : null,
      helperText ? helperId : null,
      showCount ? countId : null,
      ariaDescribedBy
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-1.5", children: [
      label && /* @__PURE__ */ jsxRuntime.jsx(
        "label",
        {
          htmlFor: textareaId,
          className: chunkOR5DRJCW_cjs.cn(
            "text-foreground text-sm font-medium",
            hideLabel && "sr-only"
          ),
          children: label
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "textarea",
        {
          ref: internalRef,
          id: textareaId,
          value,
          defaultValue: value === void 0 ? defaultValue : void 0,
          onChange: handleChange,
          maxLength,
          "aria-invalid": hasError || !!error,
          "aria-describedby": describedByIds || void 0,
          className: chunkOR5DRJCW_cjs.cn(
            textareaVariants({
              size,
              hasError: hasError || !!error,
              resize: autoResize ? "none" : resize
            }),
            className
          ),
          ...props
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex-1", children: [
          error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error }),
          helperText && !error && /* @__PURE__ */ jsxRuntime.jsx("p", { id: helperId, className: "text-muted-foreground text-sm", children: helperText })
        ] }),
        showCount && /* @__PURE__ */ jsxRuntime.jsxs(
          "p",
          {
            id: countId,
            className: chunkOR5DRJCW_cjs.cn(
              "text-muted-foreground shrink-0 text-xs",
              maxLength && characterCount >= maxLength && "text-destructive"
            ),
            children: [
              characterCount,
              maxLength && `/${maxLength}`
            ]
          }
        )
      ] })
    ] });
  }
);
Textarea.displayName = "Textarea";

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
Object.defineProperty(exports, "brands", {
  enumerable: true,
  get: function () { return chunkSEZI2MIS_cjs.brands; }
});
Object.defineProperty(exports, "miewebBrand", {
  enumerable: true,
  get: function () { return chunkS6UNPMAS_cjs.miewebBrand; }
});
Object.defineProperty(exports, "webchartBrand", {
  enumerable: true,
  get: function () { return chunkZ3TFPXVN_cjs.webchartBrand; }
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
Object.defineProperty(exports, "PhoneInput", {
  enumerable: true,
  get: function () { return chunkMGGTYVHX_cjs.PhoneInput; }
});
Object.defineProperty(exports, "DateInput", {
  enumerable: true,
  get: function () { return chunk64UPCPJC_cjs.DateInput; }
});
Object.defineProperty(exports, "Tooltip", {
  enumerable: true,
  get: function () { return chunkHGON5QUF_cjs.Tooltip; }
});
Object.defineProperty(exports, "Dropdown", {
  enumerable: true,
  get: function () { return chunkHPFLIQZO_cjs.Dropdown; }
});
Object.defineProperty(exports, "DropdownItem", {
  enumerable: true,
  get: function () { return chunkHPFLIQZO_cjs.DropdownItem; }
});
Object.defineProperty(exports, "DropdownLabel", {
  enumerable: true,
  get: function () { return chunkHPFLIQZO_cjs.DropdownLabel; }
});
Object.defineProperty(exports, "DropdownSeparator", {
  enumerable: true,
  get: function () { return chunkHPFLIQZO_cjs.DropdownSeparator; }
});
Object.defineProperty(exports, "Badge", {
  enumerable: true,
  get: function () { return chunkPA5DHCK4_cjs.Badge; }
});
Object.defineProperty(exports, "badgeVariants", {
  enumerable: true,
  get: function () { return chunkPA5DHCK4_cjs.badgeVariants; }
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
Object.defineProperty(exports, "VisuallyHidden", {
  enumerable: true,
  get: function () { return chunkZJCPW6MS_cjs.VisuallyHidden; }
});
Object.defineProperty(exports, "ThemeProvider", {
  enumerable: true,
  get: function () { return chunkXWF7I3QH_cjs.ThemeProvider; }
});
Object.defineProperty(exports, "ThemeProviderContext", {
  enumerable: true,
  get: function () { return chunkXWF7I3QH_cjs.ThemeProviderContext; }
});
Object.defineProperty(exports, "useThemeContext", {
  enumerable: true,
  get: function () { return chunkXWF7I3QH_cjs.useThemeContext; }
});
Object.defineProperty(exports, "useFocusTrap", {
  enumerable: true,
  get: function () { return chunkWDMNKM4C_cjs.useFocusTrap; }
});
Object.defineProperty(exports, "usePrefersReducedMotion", {
  enumerable: true,
  get: function () { return chunk6HFFWEM3_cjs.usePrefersReducedMotion; }
});
Object.defineProperty(exports, "useClickOutside", {
  enumerable: true,
  get: function () { return chunkJ4XHETCY_cjs.useClickOutside; }
});
Object.defineProperty(exports, "useEscapeKey", {
  enumerable: true,
  get: function () { return chunkJ4XHETCY_cjs.useEscapeKey; }
});
Object.defineProperty(exports, "useTheme", {
  enumerable: true,
  get: function () { return chunk2O7D6F67_cjs.useTheme; }
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
  get: function () { return chunkCPTPSLYC_cjs.miewebUIPreset; }
});
Object.defineProperty(exports, "Button", {
  enumerable: true,
  get: function () { return chunkYEZJKPEN_cjs.Button; }
});
Object.defineProperty(exports, "buttonVariants", {
  enumerable: true,
  get: function () { return chunkYEZJKPEN_cjs.buttonVariants; }
});
Object.defineProperty(exports, "Input", {
  enumerable: true,
  get: function () { return chunkDQTQ4AQQ_cjs.Input; }
});
Object.defineProperty(exports, "inputVariants", {
  enumerable: true,
  get: function () { return chunkDQTQ4AQQ_cjs.inputVariants; }
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
Object.defineProperty(exports, "cn", {
  enumerable: true,
  get: function () { return chunkOR5DRJCW_cjs.cn; }
});
exports.Breadcrumb = Breadcrumb;
exports.BreadcrumbSlash = BreadcrumbSlash;
exports.Checkbox = Checkbox;
exports.CheckboxGroup = CheckboxGroup;
exports.CircularProgress = CircularProgress;
exports.FullPageSpinner = FullPageSpinner;
exports.Modal = Modal;
exports.ModalBody = ModalBody;
exports.ModalClose = ModalClose;
exports.ModalFooter = ModalFooter;
exports.ModalHeader = ModalHeader;
exports.ModalTitle = ModalTitle;
exports.Pagination = Pagination;
exports.Progress = Progress;
exports.Radio = Radio;
exports.RadioGroup = RadioGroup;
exports.Select = Select;
exports.SimplePagination = SimplePagination;
exports.Skeleton = Skeleton;
exports.SkeletonCard = SkeletonCard;
exports.SkeletonTable = SkeletonTable;
exports.SkeletonText = SkeletonText;
exports.Spinner = Spinner;
exports.SpinnerWithLabel = SpinnerWithLabel;
exports.Switch = Switch;
exports.Table = Table;
exports.TableBody = TableBody;
exports.TableCaption = TableCaption;
exports.TableCell = TableCell;
exports.TableFooter = TableFooter;
exports.TableHead = TableHead;
exports.TableHeader = TableHeader;
exports.TableRow = TableRow;
exports.Tabs = Tabs;
exports.TabsContent = TabsContent;
exports.TabsList = TabsList;
exports.TabsTrigger = TabsTrigger;
exports.Textarea = Textarea;
exports.checkboxVariants = checkboxVariants;
exports.circularProgressVariants = circularProgressVariants;
exports.modalContentVariants = modalContentVariants;
exports.modalOverlayVariants = modalOverlayVariants;
exports.paginationButtonVariants = paginationButtonVariants;
exports.progressBarFillVariants = progressBarFillVariants;
exports.progressBarTrackVariants = progressBarTrackVariants;
exports.radioVariants = radioVariants;
exports.selectTriggerVariants = selectTriggerVariants;
exports.skeletonVariants = skeletonVariants;
exports.spinnerVariants = spinnerVariants;
exports.switchThumbVariants = switchThumbVariants;
exports.switchTrackVariants = switchTrackVariants;
exports.tabsListVariants = tabsListVariants;
exports.tabsTriggerVariants = tabsTriggerVariants;
exports.textareaVariants = textareaVariants;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map