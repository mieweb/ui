import { useFocusTrap } from './chunk-CLNOI5J7.js';
import { useEscapeKey } from './chunk-T4ME7QCT.js';
import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { jsx, jsxs } from 'react/jsx-runtime';

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
  const generatedId = React.useId();
  const modalId = id || generatedId;
  const focusTrapRef = useFocusTrap(open);
  useEscapeKey(() => {
    if (closeOnEscape && open) {
      onOpenChange(false);
    }
  }, open);
  const handleOverlayClick = React.useCallback(
    (e) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [closeOnOverlayClick, onOpenChange]
  );
  React.useEffect(() => {
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
var ModalContext = React.createContext(
  void 0
);
function useModalContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error("Modal components must be used within a Modal");
  }
  return context;
}
var ModalHeader = React.forwardRef(
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
var ModalTitle = React.forwardRef(
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
var ModalClose = React.forwardRef(
  ({ className, children, onClick, ...props }, ref) => {
    const { onClose } = useModalContext();
    const handleClick = React.useCallback(
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
var ModalBody = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("px-6 py-4", className), ...props })
);
ModalBody.displayName = "ModalBody";
var ModalFooter = React.forwardRef(
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

export { Modal, ModalBody, ModalClose, ModalFooter, ModalHeader, ModalTitle, modalContentVariants, modalOverlayVariants };
//# sourceMappingURL=chunk-D5IBXXF2.js.map
//# sourceMappingURL=chunk-D5IBXXF2.js.map