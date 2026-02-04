'use strict';

var chunkNNEFAUHV_cjs = require('./chunk-NNEFAUHV.cjs');
var chunkFHY3K6PL_cjs = require('./chunk-FHY3K6PL.cjs');
var chunkSCV7C55E_cjs = require('./chunk-SCV7C55E.cjs');
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

var scrollLockState = {
  count: 0,
  originalOverflow: null};
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
  const generatedId = React__namespace.useId();
  const modalId = id || generatedId;
  const focusTrapRef = chunkNNEFAUHV_cjs.useFocusTrap(open);
  chunkFHY3K6PL_cjs.useEscapeKey(() => {
    if (closeOnEscape && open) {
      onOpenChange(false);
    }
  }, open);
  const handleOverlayClick = React__namespace.useCallback(
    (e) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [closeOnOverlayClick, onOpenChange]
  );
  React__namespace.useEffect(() => {
    if (!open || chunkSCV7C55E_cjs.isStorybookDocsMode()) {
      return void 0;
    }
    scrollLockState.count++;
    if (scrollLockState.count === 1) {
      scrollLockState.originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      scrollLockState.count--;
      if (scrollLockState.count === 0 && scrollLockState.originalOverflow !== null) {
        document.body.style.overflow = scrollLockState.originalOverflow;
        scrollLockState.originalOverflow = null;
      }
    };
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
var ModalContext = React__namespace.createContext(
  void 0
);
function useModalContext() {
  const context = React__namespace.useContext(ModalContext);
  if (!context) {
    throw new Error("Modal components must be used within a Modal");
  }
  return context;
}
var ModalHeader = React__namespace.forwardRef(
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
var ModalTitle = React__namespace.forwardRef(
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
var ModalClose = React__namespace.forwardRef(
  ({ className, children, onClick, ...props }, ref) => {
    const { onClose } = useModalContext();
    const handleClick = React__namespace.useCallback(
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
var ModalBody = React__namespace.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx("div", { ref, className: chunkOR5DRJCW_cjs.cn("px-6 py-4", className), ...props })
);
ModalBody.displayName = "ModalBody";
var ModalFooter = React__namespace.forwardRef(
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

exports.Modal = Modal;
exports.ModalBody = ModalBody;
exports.ModalClose = ModalClose;
exports.ModalFooter = ModalFooter;
exports.ModalHeader = ModalHeader;
exports.ModalTitle = ModalTitle;
exports.modalContentVariants = modalContentVariants;
exports.modalOverlayVariants = modalOverlayVariants;
//# sourceMappingURL=chunk-I7L6CQXR.cjs.map
//# sourceMappingURL=chunk-I7L6CQXR.cjs.map