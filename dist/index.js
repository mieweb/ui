export { Avatar, AvatarGroup, avatarVariants, getInitials } from './chunk-4XWG5RKH.js';
export { DateButton, DatePicker, RadioOption, SchedulePicker, TimeButton, TimePicker, dateButtonVariants, radioOptionVariants, timeButtonVariants } from './chunk-ROTSYQJW.js';
export { QuickAction, QuickActionGroup, QuickActionIcons, quickActionIconVariants, quickActionVariants } from './chunk-BAZHMCLV.js';
export { brands } from './chunk-MR7T7DLI.js';
export { miewebBrand } from './chunk-UHSPAFY6.js';
export { webchartBrand } from './chunk-C6MDPPPL.js';
export { createBrandPreset, generateBrandCSS, generateTailwindTheme } from './chunk-SOFX4T7M.js';
export { bluehiveBrand } from './chunk-ULOA7WBW.js';
export { defaultBrand } from './chunk-4LTN2LEN.js';
export { enterpriseHealthBrand } from './chunk-MTZPVOP6.js';
export { PhoneInput } from './chunk-4M33VUCY.js';
export { DateInput } from './chunk-7NOU5IZL.js';
export { Tooltip } from './chunk-3GNQP4KR.js';
export { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from './chunk-SST7B7PA.js';
export { Badge, badgeVariants } from './chunk-H7OGAIAK.js';
export { Alert, AlertDescription, AlertTitle, alertVariants } from './chunk-KOHBAPLC.js';
export { VisuallyHidden } from './chunk-H2CIKJQI.js';
export { ThemeProvider, ThemeProviderContext, useThemeContext } from './chunk-JE462LFV.js';
import { useFocusTrap } from './chunk-ZWZKLFEG.js';
export { useFocusTrap } from './chunk-ZWZKLFEG.js';
export { usePrefersReducedMotion } from './chunk-HB7C7NB5.js';
import { useEscapeKey, useClickOutside } from './chunk-XMYVC7TT.js';
export { useClickOutside, useEscapeKey } from './chunk-XMYVC7TT.js';
export { useTheme } from './chunk-KJZNEVYM.js';
import './chunk-ZQ4XMJH7.js';
export { formatPhoneNumber, isPhoneNumberEmpty, isValidPhoneNumber, unformatPhoneNumber } from './chunk-CEHWXAAI.js';
export { calculateAge, formatDateValue, isDateEmpty, isDateInFuture, isDateInPast, isValidDate, isValidDrivingAge, parseDateValue } from './chunk-SN52QMRT.js';
export { miewebUIPreset } from './chunk-HDQRCRUC.js';
export { Button, buttonVariants } from './chunk-XMPYXAEJ.js';
export { Input, inputVariants } from './chunk-LIYX5CYL.js';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants } from './chunk-XVNFVSOS.js';
export { SmallMuted, Text, textVariants } from './chunk-RCMF6KZA.js';
import { cn } from './chunk-F3SOEIN2.js';
export { cn } from './chunk-F3SOEIN2.js';
import * as React7 from 'react';
import { jsxs, jsx } from 'react/jsx-runtime';
import { cva } from 'class-variance-authority';

function Breadcrumb({
  items,
  separator,
  maxItems,
  renderLink,
  className
}) {
  const displayedItems = React7.useMemo(() => {
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
  const defaultSeparator = /* @__PURE__ */ jsx(ChevronRightIcon, { className: "text-muted-foreground h-4 w-4 shrink-0" });
  return /* @__PURE__ */ jsx("nav", { "aria-label": "Breadcrumb", className, children: /* @__PURE__ */ jsx("ol", { className: "flex flex-wrap items-center gap-1.5", children: displayedItems.map((item, index) => {
    const isLast = index === displayedItems.length - 1;
    const isEllipsis = item.isEllipsis;
    return /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-1.5", children: [
      index > 0 && /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: separator || defaultSeparator }),
      isEllipsis ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: "..." }) : isLast || !item.href ? /* @__PURE__ */ jsx(BreadcrumbPage, { item }) : renderLink ? renderLink(item, index) : /* @__PURE__ */ jsx(BreadcrumbLink, { item })
    ] }, index);
  }) }) });
}
Breadcrumb.displayName = "Breadcrumb";
function BreadcrumbLink({ item }) {
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: item.href,
      className: cn(
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
  return /* @__PURE__ */ jsxs(
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
  return /* @__PURE__ */ jsx(
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
      children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" })
    }
  );
}
function BreadcrumbSlash({ className }) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: cn("text-muted-foreground mx-1", className),
      "aria-hidden": "true",
      children: "/"
    }
  );
}
var checkboxVariants = cva(
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
var Checkbox = React7.forwardRef(
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
    const internalRef = React7.useRef(null);
    const generatedId = React7.useId();
    const checkboxId = id || generatedId;
    const descriptionId = `${checkboxId}-description`;
    const errorId = `${checkboxId}-error`;
    React7.useEffect(() => {
      const checkbox = internalRef.current;
      if (checkbox) {
        checkbox.indeterminate = indeterminate;
      }
    }, [indeterminate]);
    React7.useImperativeHandle(ref, () => internalRef.current);
    const checkboxElement = /* @__PURE__ */ jsxs("span", { className: "relative inline-flex items-center justify-center", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: internalRef,
          id: checkboxId,
          type: "checkbox",
          disabled,
          "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
          "aria-invalid": !!error,
          className: cn(checkboxVariants({ size }), className),
          ...props
        }
      ),
      /* @__PURE__ */ jsx(
        CheckIcon,
        {
          size,
          className: "pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100"
        }
      )
    ] });
    const labelElement = label && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsx(
        "label",
        {
          htmlFor: checkboxId,
          className: cn(
            "text-foreground cursor-pointer text-sm font-medium select-none",
            disabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description })
    ] });
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "flex items-start gap-3",
            labelPosition === "left" && "flex-row-reverse"
          ),
          children: [
            checkboxElement,
            labelElement
          ]
        }
      ),
      error && /* @__PURE__ */ jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error })
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
  const groupId = React7.useId();
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;
  return /* @__PURE__ */ jsxs(
    "fieldset",
    {
      className: cn("flex flex-col gap-2", className),
      "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
      children: [
        label && /* @__PURE__ */ jsx("legend", { className: "text-foreground text-sm font-medium", children: label }),
        description && /* @__PURE__ */ jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description }),
        /* @__PURE__ */ jsx(
          "div",
          {
            role: "group",
            className: cn(
              "flex gap-4",
              orientation === "vertical" && "flex-col gap-3"
            ),
            children
          }
        ),
        error && /* @__PURE__ */ jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error })
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
  return /* @__PURE__ */ jsx(
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
      children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" })
    }
  );
}
var modalOverlayVariants = cva(
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
var modalContentVariants = cva(
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
  const generatedId = React7.useId();
  const modalId = id || generatedId;
  const focusTrapRef = useFocusTrap(open);
  useEscapeKey(() => {
    if (closeOnEscape && open) {
      onOpenChange(false);
    }
  }, open);
  const handleOverlayClick = React7.useCallback(
    (e) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [closeOnOverlayClick, onOpenChange]
  );
  React7.useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);
  if (!open) return null;
  return /* @__PURE__ */ jsx(
    ModalContext.Provider,
    {
      value: { onClose: () => onOpenChange(false), modalId },
      children: /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(modalOverlayVariants()),
            "data-state": open ? "open" : "closed",
            onClick: handleOverlayClick,
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsx(
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
            className: cn(modalContentVariants({ size }), className),
            children
          }
        )
      ] })
    }
  );
}
Modal.displayName = "Modal";
var ModalContext = React7.createContext(
  void 0
);
function useModalContext() {
  const context = React7.useContext(ModalContext);
  if (!context) {
    throw new Error("Modal components must be used within a Modal");
  }
  return context;
}
var ModalHeader = React7.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: cn(
        "flex items-center justify-between",
        "border-border border-b px-6 py-4",
        className
      ),
      ...props
    }
  )
);
ModalHeader.displayName = "ModalHeader";
var ModalTitle = React7.forwardRef(
  ({ className, children, ...props }, ref) => {
    const { modalId } = useModalContext();
    return /* @__PURE__ */ jsx(
      "h2",
      {
        ref,
        id: `${modalId}-title`,
        className: cn(
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
var ModalClose = React7.forwardRef(
  ({ className, children, onClick, ...props }, ref) => {
    const { onClose } = useModalContext();
    const handleClick = React7.useCallback(
      (e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          onClose();
        }
      },
      [onClick, onClose]
    );
    return /* @__PURE__ */ jsx(
      "button",
      {
        ref,
        type: "button",
        onClick: handleClick,
        className: cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          className
        ),
        "aria-label": "Close",
        ...props,
        children: children || /* @__PURE__ */ jsx(CloseIcon, {})
      }
    );
  }
);
ModalClose.displayName = "ModalClose";
var ModalBody = React7.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("px-6 py-4", className), ...props })
);
ModalBody.displayName = "ModalBody";
var ModalFooter = React7.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: cn(
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
        /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
      ]
    }
  );
}
var paginationButtonVariants = cva(
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
  const pageRange = React7.useMemo(() => {
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
  return /* @__PURE__ */ jsxs(
    "nav",
    {
      role: "navigation",
      "aria-label": "Pagination",
      className: cn("flex items-center gap-1", className),
      children: [
        showFirstLast && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(1),
            disabled: !canGoPrev,
            "aria-label": labels?.first || "Go to first page",
            className: cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsx(ChevronsLeftIcon, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: labels?.first || "First" })
            ]
          }
        ),
        showPrevNext && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(page - 1),
            disabled: !canGoPrev,
            "aria-label": labels?.previous || "Go to previous page",
            className: cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsx(ChevronLeftIcon, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { className: "sr-only sm:not-sr-only", children: labels?.previous || "Previous" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: pageRange.map((item, index) => {
          if (item === "ellipsis") {
            return /* @__PURE__ */ jsx(
              "span",
              {
                className: cn(
                  paginationButtonVariants({ variant, size }),
                  "cursor-default hover:bg-transparent"
                ),
                "aria-hidden": "true",
                children: "..."
              },
              `ellipsis-${index}`
            );
          }
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => onPageChange(item),
              "aria-label": `Go to page ${item}`,
              "aria-current": item === page ? "page" : void 0,
              "data-active": item === page,
              className: cn(paginationButtonVariants({ variant, size })),
              children: item
            },
            item
          );
        }) }),
        showPrevNext && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(page + 1),
            disabled: !canGoNext,
            "aria-label": labels?.next || "Go to next page",
            className: cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only sm:not-sr-only", children: labels?.next || "Next" }),
              /* @__PURE__ */ jsx(ChevronRightIcon2, { className: "h-4 w-4" })
            ]
          }
        ),
        showFirstLast && /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(totalPages),
            disabled: !canGoNext,
            "aria-label": labels?.last || "Go to last page",
            className: cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: labels?.last || "Last" }),
              /* @__PURE__ */ jsx(ChevronsRightIcon, { className: "h-4 w-4" })
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
  return /* @__PURE__ */ jsxs(
    "nav",
    {
      role: "navigation",
      "aria-label": "Pagination",
      className: cn("flex items-center gap-2", className),
      children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(page - 1),
            disabled: !canGoPrev,
            "aria-label": "Go to previous page",
            className: cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsx(ChevronLeftIcon, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { children: "Previous" })
            ]
          }
        ),
        showPageInfo && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground px-2 text-sm", children: [
          "Page ",
          page,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onPageChange(page + 1),
            disabled: !canGoNext,
            "aria-label": "Go to next page",
            className: cn(paginationButtonVariants({ variant, size })),
            children: [
              /* @__PURE__ */ jsx("span", { children: "Next" }),
              /* @__PURE__ */ jsx(ChevronRightIcon2, { className: "h-4 w-4" })
            ]
          }
        )
      ]
    }
  );
}
SimplePagination.displayName = "SimplePagination";
function ChevronLeftIcon({ className }) {
  return /* @__PURE__ */ jsx(
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
      children: /* @__PURE__ */ jsx("path", { d: "m15 18-6-6 6-6" })
    }
  );
}
function ChevronRightIcon2({ className }) {
  return /* @__PURE__ */ jsx(
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
      children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" })
    }
  );
}
function ChevronsLeftIcon({ className }) {
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx("path", { d: "m11 17-5-5 5-5" }),
        /* @__PURE__ */ jsx("path", { d: "m18 17-5-5 5-5" })
      ]
    }
  );
}
function ChevronsRightIcon({ className }) {
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx("path", { d: "m6 17 5-5-5-5" }),
        /* @__PURE__ */ jsx("path", { d: "m13 17 5-5-5-5" })
      ]
    }
  );
}
var progressBarTrackVariants = cva(
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
var progressBarFillVariants = cva(
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
  const progressId = React7.useId();
  const displayValue = formatValue ? formatValue(value, max) : `${Math.round(percentage)}%`;
  return /* @__PURE__ */ jsxs("div", { className: cn("w-full", className), children: [
    (label || showValue) && /* @__PURE__ */ jsxs("div", { className: "mb-1.5 flex items-center justify-between", children: [
      label && /* @__PURE__ */ jsx(
        "label",
        {
          id: `${progressId}-label`,
          className: "text-foreground text-sm font-medium",
          children: label
        }
      ),
      showValue && !indeterminate && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: displayValue })
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        role: "progressbar",
        "aria-valuenow": indeterminate ? void 0 : value,
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-labelledby": label ? `${progressId}-label` : void 0,
        "aria-label": !label ? "Progress" : void 0,
        className: cn(progressBarTrackVariants({ size })),
        children: /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
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
var circularProgressVariants = cva(["relative inline-flex"], {
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
  return /* @__PURE__ */ jsxs(
    "div",
    {
      role: "progressbar",
      "aria-valuenow": indeterminate ? void 0 : value,
      "aria-valuemin": 0,
      "aria-valuemax": max,
      "aria-label": "Progress",
      className: cn(circularProgressVariants({ size }), className),
      children: [
        /* @__PURE__ */ jsxs(
          "svg",
          {
            className: cn("-rotate-90 transform", indeterminate && "animate-spin"),
            width: svgSize,
            height: svgSize,
            children: [
              /* @__PURE__ */ jsx(
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
              /* @__PURE__ */ jsx(
                "circle",
                {
                  className: cn(
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
        showValue && !indeterminate && /* @__PURE__ */ jsxs("span", { className: "text-foreground absolute inset-0 flex items-center justify-center text-xs font-medium", children: [
          Math.round(percentage),
          "%"
        ] })
      ]
    }
  );
}
CircularProgress.displayName = "CircularProgress";
var RadioGroupContext = React7.createContext(void 0);
function useRadioGroupContext() {
  const context = React7.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("Radio must be used within a RadioGroup");
  }
  return context;
}
var radioVariants = cva(
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
  const generatedName = React7.useId();
  const groupName = name || generatedName;
  const groupId = React7.useId();
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;
  const [uncontrolledValue, setUncontrolledValue] = React7.useState(defaultValue);
  const isControlled = controlledValue !== void 0;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const handleChange = React7.useCallback(
    (newValue) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );
  return /* @__PURE__ */ jsx(
    RadioGroupContext.Provider,
    {
      value: { name: groupName, value, onChange: handleChange, disabled, size },
      children: /* @__PURE__ */ jsxs(
        "fieldset",
        {
          role: "radiogroup",
          className: cn("flex flex-col gap-2", className),
          "aria-describedby": [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || void 0,
          children: [
            label && /* @__PURE__ */ jsx("legend", { className: "text-foreground text-sm font-medium", children: label }),
            description && /* @__PURE__ */ jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "flex gap-4",
                  orientation === "vertical" && "flex-col gap-3"
                ),
                children
              }
            ),
            error && /* @__PURE__ */ jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error })
          ]
        }
      )
    }
  );
}
RadioGroup.displayName = "RadioGroup";
var Radio = React7.forwardRef(
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
    const generatedId = React7.useId();
    const radioId = id || generatedId;
    const descriptionId = `${radioId}-description`;
    const isChecked = context.value === value;
    const isDisabled = propDisabled || context.disabled;
    const size = propSize || context.size;
    const handleChange = React7.useCallback(() => {
      if (!isDisabled) {
        context.onChange(value);
      }
    }, [isDisabled, context, value]);
    const radioElement = /* @__PURE__ */ jsxs("span", { className: "relative inline-flex items-center justify-center", children: [
      /* @__PURE__ */ jsx(
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
          className: cn(radioVariants({ size }), className),
          ...props
        }
      ),
      /* @__PURE__ */ jsx(
        "span",
        {
          className: cn(
            "bg-primary-500 pointer-events-none absolute rounded-full transition-transform",
            size === "sm" && "h-2 w-2",
            size === "md" && "h-2.5 w-2.5",
            size === "lg" && "h-3 w-3",
            isChecked ? "scale-100" : "scale-0"
          )
        }
      )
    ] });
    const labelElement = label && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsx(
        "label",
        {
          htmlFor: radioId,
          className: cn(
            "text-foreground cursor-pointer text-sm font-medium select-none",
            isDisabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description })
    ] });
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
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
var selectTriggerVariants = cva(
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
  const [isOpen, setIsOpen] = React7.useState(false);
  const [uncontrolledValue, setUncontrolledValue] = React7.useState(
    defaultValue || ""
  );
  const [searchQuery, setSearchQuery] = React7.useState("");
  const [highlightedIndex, setHighlightedIndex] = React7.useState(-1);
  const containerRef = React7.useRef(null);
  const triggerRef = React7.useRef(null);
  const searchInputRef = React7.useRef(null);
  const listRef = React7.useRef(null);
  const generatedId = React7.useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const isControlled = controlledValue !== void 0;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const flatOptions = React7.useMemo(() => {
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
  const filteredOptions = React7.useMemo(() => {
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
  const filteredFlatOptions = React7.useMemo(() => {
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
  useClickOutside(containerRef, () => setIsOpen(false));
  useEscapeKey(() => {
    if (isOpen) {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }, isOpen);
  const handleValueChange = React7.useCallback(
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
  const handleKeyDown = React7.useCallback(
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
  React7.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);
  React7.useEffect(() => {
    setHighlightedIndex(filteredFlatOptions.length > 0 ? 0 : -1);
  }, [searchQuery, filteredFlatOptions.length]);
  const describedByIds = [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col gap-1.5", className), children: [
    label && /* @__PURE__ */ jsx(
      "label",
      {
        htmlFor: selectId,
        className: cn(
          "text-foreground text-sm font-medium",
          hideLabel && "sr-only"
        ),
        children: label
      }
    ),
    /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "relative", children: [
      /* @__PURE__ */ jsxs(
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
          className: cn(
            selectTriggerVariants({ size, hasError: hasError || !!error })
          ),
          children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: cn(
                  "truncate",
                  !selectedOption && "text-muted-foreground"
                ),
                children: selectedOption?.label || placeholder
              }
            ),
            /* @__PURE__ */ jsx(
              ChevronDownIcon,
              {
                className: cn(
                  "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
                  isOpen && "rotate-180"
                )
              }
            )
          ]
        }
      ),
      isOpen && /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "absolute z-50 mt-1 w-full",
            "border-border bg-card rounded-lg border shadow-lg",
            "animate-in fade-in zoom-in-95 duration-100"
          ),
          children: [
            searchable && /* @__PURE__ */ jsx("div", { className: "border-border border-b p-2", children: /* @__PURE__ */ jsx(
              "input",
              {
                ref: searchInputRef,
                type: "text",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                onKeyDown: handleKeyDown,
                placeholder: searchPlaceholder,
                className: cn(
                  "border-input bg-background w-full rounded-md border px-3 py-2 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus:ring-ring focus:ring-2 focus:outline-none"
                ),
                "aria-label": "Search options"
              }
            ) }),
            /* @__PURE__ */ jsx(
              "ul",
              {
                ref: listRef,
                id: listboxId,
                role: "listbox",
                "aria-label": label || "Options",
                className: "max-h-60 overflow-auto p-1",
                children: filteredFlatOptions.length === 0 ? /* @__PURE__ */ jsx("li", { className: "text-muted-foreground px-3 py-2 text-center text-sm", children: noResultsText }) : filteredOptions.map((item) => {
                  if ("options" in item) {
                    return /* @__PURE__ */ jsxs("li", { role: "presentation", children: [
                      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase", children: item.label }),
                      /* @__PURE__ */ jsx("ul", { role: "group", "aria-label": item.label, children: item.options.map((option) => /* @__PURE__ */ jsx(
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
                  return /* @__PURE__ */ jsx(
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
    error && /* @__PURE__ */ jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error }),
    helperText && !error && /* @__PURE__ */ jsx("p", { id: helperId, className: "text-muted-foreground text-sm", children: helperText })
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
  return /* @__PURE__ */ jsxs(
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
      className: cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm",
        "transition-colors outline-none",
        isHighlighted && "bg-muted",
        isSelected && "bg-primary-50 text-primary-900 dark:bg-primary-950 dark:text-primary-100",
        option.disabled && "cursor-not-allowed opacity-50"
      ),
      children: [
        /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: option.label }),
        isSelected && /* @__PURE__ */ jsx(CheckIcon2, { className: "text-primary-500 h-4 w-4 shrink-0" })
      ]
    }
  );
}
function ChevronDownIcon({ className }) {
  return /* @__PURE__ */ jsx(
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
      children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" })
    }
  );
}
function CheckIcon2({ className }) {
  return /* @__PURE__ */ jsx(
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
      children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" })
    }
  );
}
var skeletonVariants = cva(
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
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
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
  return /* @__PURE__ */ jsx("div", { className: cn(gapClasses[gap], className), "aria-hidden": "true", children: Array.from({ length: lines }).map((_, index) => /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "border-border bg-card space-y-4 rounded-xl border p-4",
        className
      ),
      "aria-hidden": "true",
      children: [
        showImage && /* @__PURE__ */ jsx(Skeleton, { variant: "image", className: "rounded-lg" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          showAvatar && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Skeleton, { circle: true, width: 40, height: 40 }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
              /* @__PURE__ */ jsx(Skeleton, { variant: "text", width: "50%" }),
              /* @__PURE__ */ jsx(Skeleton, { variant: "text", width: "30%" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Skeleton, { variant: "title", width: "80%" }),
          /* @__PURE__ */ jsx(SkeletonText, { lines: textLines })
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
  return /* @__PURE__ */ jsxs("div", { className: cn("space-y-3", className), "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("div", { className: "flex gap-4", children: Array.from({ length: columns }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { variant: "text", className: "h-5 flex-1" }, `header-${i}`)) }),
    Array.from({ length: rows }).map((_, rowIndex) => /* @__PURE__ */ jsx("div", { className: "flex gap-4", children: Array.from({ length: columns }).map((_2, colIndex) => /* @__PURE__ */ jsx(
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
var spinnerVariants = cva(
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
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "status",
      "aria-label": label,
      className: cn(spinnerVariants({ size, variant }), className),
      ...props,
      children: /* @__PURE__ */ jsx("span", { className: "sr-only", children: label })
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
  return /* @__PURE__ */ jsxs(
    "div",
    {
      role: "status",
      "aria-label": label,
      className: cn(
        "inline-flex items-center justify-center gap-2",
        positionClasses[labelPosition],
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(spinnerVariants({ size, variant })),
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: label })
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
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4",
        backdrop && "bg-background/80 backdrop-blur-sm"
      ),
      children: [
        /* @__PURE__ */ jsx(Spinner, { size, ...props }),
        text && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: text })
      ]
    }
  );
}
FullPageSpinner.displayName = "FullPageSpinner";
var switchTrackVariants = cva(
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
var switchThumbVariants = cva(
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
var Switch = React7.forwardRef(
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
    const [uncontrolledChecked, setUncontrolledChecked] = React7.useState(defaultChecked);
    const generatedId = React7.useId();
    const switchId = id || generatedId;
    const descriptionId = `${switchId}-description`;
    const isControlled = controlledChecked !== void 0;
    const isChecked = isControlled ? controlledChecked : uncontrolledChecked;
    const handleToggle = React7.useCallback(() => {
      if (disabled) return;
      const newValue = !isChecked;
      if (!isControlled) {
        setUncontrolledChecked(newValue);
      }
      onCheckedChange?.(newValue);
    }, [disabled, isChecked, isControlled, onCheckedChange]);
    const handleKeyDown = React7.useCallback(
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      },
      [handleToggle]
    );
    const switchElement = /* @__PURE__ */ jsx(
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
        className: cn(switchTrackVariants({ size }), "items-center", className),
        ...props,
        children: /* @__PURE__ */ jsx(
          "span",
          {
            "data-state": isChecked ? "checked" : "unchecked",
            className: switchThumbVariants({ size })
          }
        )
      }
    );
    const labelElement = label && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsx(
        "label",
        {
          htmlFor: switchId,
          className: cn(
            "text-foreground cursor-pointer text-sm font-medium select-none",
            disabled && "cursor-not-allowed opacity-50"
          ),
          children: label
        }
      ),
      description && /* @__PURE__ */ jsx("p", { id: descriptionId, className: "text-muted-foreground text-xs", children: description })
    ] });
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
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
var Table = React7.forwardRef(
  ({ className, responsive = true, children, ...props }, ref) => {
    const table = /* @__PURE__ */ jsx(
      "table",
      {
        ref,
        className: cn("w-full caption-bottom text-sm", className),
        ...props,
        children
      }
    );
    if (responsive) {
      return /* @__PURE__ */ jsx("div", { className: "relative w-full overflow-auto", children: table });
    }
    return table;
  }
);
Table.displayName = "Table";
var TableHeader = React7.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props })
);
TableHeader.displayName = "TableHeader";
var TableBody = React7.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "tbody",
    {
      ref,
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  )
);
TableBody.displayName = "TableBody";
var TableFooter = React7.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "tfoot",
    {
      ref,
      className: cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      ),
      ...props
    }
  )
);
TableFooter.displayName = "TableFooter";
var TableRow = React7.forwardRef(
  ({ className, selected, ...props }, ref) => /* @__PURE__ */ jsx(
    "tr",
    {
      ref,
      "data-selected": selected,
      className: cn(
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
var TableHead = React7.forwardRef(
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => {
    const content = sortable ? /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: onSort,
        className: cn(
          "hover:text-foreground flex items-center gap-1 transition-colors",
          "focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none"
        ),
        "aria-label": `Sort column ${sortDirection === "asc" ? "descending" : "ascending"}`,
        children: [
          children,
          /* @__PURE__ */ jsx(SortIcon, { direction: sortDirection })
        ]
      }
    ) : children;
    return /* @__PURE__ */ jsx(
      "th",
      {
        ref,
        "aria-sort": sortable ? sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : "none" : void 0,
        className: cn(
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
var TableCell = React7.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "td",
    {
      ref,
      className: cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className
      ),
      ...props
    }
  )
);
TableCell.displayName = "TableCell";
var TableCaption = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "caption",
  {
    ref,
    className: cn("text-muted-foreground mt-4 text-sm", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";
function SortIcon({ direction }) {
  if (direction === "asc") {
    return /* @__PURE__ */ jsx(
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
        children: /* @__PURE__ */ jsx("path", { d: "m5 12 7-7 7 7" })
      }
    );
  }
  if (direction === "desc") {
    return /* @__PURE__ */ jsx(
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
        children: /* @__PURE__ */ jsx("path", { d: "m19 12-7 7-7-7" })
      }
    );
  }
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx("path", { d: "m7 15 5 5 5-5" }),
        /* @__PURE__ */ jsx("path", { d: "m7 9 5-5 5 5" })
      ]
    }
  );
}
var TabsContext = React7.createContext(
  void 0
);
function useTabsContext() {
  const context = React7.useContext(TabsContext);
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
  const [uncontrolledValue, setUncontrolledValue] = React7.useState(
    defaultValue || ""
  );
  const isControlled = controlledValue !== void 0;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const handleValueChange = React7.useCallback(
    (newValue) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );
  return /* @__PURE__ */ jsx(
    TabsContext.Provider,
    {
      value: { value, onValueChange: handleValueChange, variant },
      children: /* @__PURE__ */ jsx("div", { className: cn("w-full", className), children })
    }
  );
}
Tabs.displayName = "Tabs";
var tabsListVariants = cva(["flex items-center"], {
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
var TabsList = React7.forwardRef(
  ({ className, ...props }, ref) => {
    const { variant } = useTabsContext();
    const listRef = React7.useRef(null);
    const handleKeyDown = React7.useCallback(
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
    return /* @__PURE__ */ jsx(
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
        className: cn(tabsListVariants({ variant }), className),
        ...props
      }
    );
  }
);
TabsList.displayName = "TabsList";
var tabsTriggerVariants = cva(
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
var TabsTrigger = React7.forwardRef(
  ({ className, value, icon, children, disabled, ...props }, ref) => {
    const { value: selectedValue, onValueChange, variant } = useTabsContext();
    const isSelected = selectedValue === value;
    return /* @__PURE__ */ jsxs(
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
        className: cn(tabsTriggerVariants({ variant }), className),
        ...props,
        children: [
          icon && /* @__PURE__ */ jsx("span", { className: "shrink-0", children: icon }),
          children
        ]
      }
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";
var TabsContent = React7.forwardRef(
  ({ className, value, forceMount = false, children, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    const isSelected = selectedValue === value;
    if (!isSelected && !forceMount) {
      return null;
    }
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        role: "tabpanel",
        id: `tabpanel-${value}`,
        "aria-labelledby": `tab-${value}`,
        tabIndex: 0,
        hidden: !isSelected,
        "data-state": isSelected ? "active" : "inactive",
        className: cn(
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
var textareaVariants = cva(
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
var Textarea = React7.forwardRef(
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
    const internalRef = React7.useRef(null);
    const [internalValue, setInternalValue] = React7.useState(
      defaultValue || ""
    );
    const generatedId = React7.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const countId = `${textareaId}-count`;
    React7.useImperativeHandle(ref, () => internalRef.current);
    const currentValue = value !== void 0 ? String(value) : internalValue;
    const characterCount = currentValue.length;
    const adjustHeight = React7.useCallback(() => {
      const textarea = internalRef.current;
      if (textarea && autoResize) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [autoResize]);
    React7.useEffect(() => {
      adjustHeight();
    }, [currentValue, adjustHeight]);
    const handleChange = React7.useCallback(
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
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
      label && /* @__PURE__ */ jsx(
        "label",
        {
          htmlFor: textareaId,
          className: cn(
            "text-foreground text-sm font-medium",
            hideLabel && "sr-only"
          ),
          children: label
        }
      ),
      /* @__PURE__ */ jsx(
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
          className: cn(
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
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          error && /* @__PURE__ */ jsx("p", { id: errorId, className: "text-destructive text-sm", role: "alert", children: error }),
          helperText && !error && /* @__PURE__ */ jsx("p", { id: helperId, className: "text-muted-foreground text-sm", children: helperText })
        ] }),
        showCount && /* @__PURE__ */ jsxs(
          "p",
          {
            id: countId,
            className: cn(
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

export { Breadcrumb, BreadcrumbSlash, Checkbox, CheckboxGroup, CircularProgress, FullPageSpinner, Modal, ModalBody, ModalClose, ModalFooter, ModalHeader, ModalTitle, Pagination, Progress, Radio, RadioGroup, Select, SimplePagination, Skeleton, SkeletonCard, SkeletonTable, SkeletonText, Spinner, SpinnerWithLabel, Switch, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, checkboxVariants, circularProgressVariants, modalContentVariants, modalOverlayVariants, paginationButtonVariants, progressBarFillVariants, progressBarTrackVariants, radioVariants, selectTriggerVariants, skeletonVariants, spinnerVariants, switchThumbVariants, switchTrackVariants, tabsListVariants, tabsTriggerVariants, textareaVariants };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map