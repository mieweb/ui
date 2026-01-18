'use strict';

var chunk6HFFWEM3_cjs = require('./chunk-6HFFWEM3.cjs');
var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React = require('react');
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

var placementStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2"
};
var arrowStyles = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-neutral-900 dark:border-t-neutral-100 border-x-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-neutral-900 dark:border-b-neutral-100 border-x-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-neutral-900 dark:border-l-neutral-100 border-y-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 border-r-neutral-900 dark:border-r-neutral-100 border-y-transparent border-l-transparent"
};
function Tooltip({
  content,
  children,
  placement = "top",
  delay = 200,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
  className
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React__namespace.useState(false);
  const timeoutRef = React__namespace.useRef(null);
  const tooltipId = React__namespace.useId();
  const prefersReducedMotion = chunk6HFFWEM3_cjs.usePrefersReducedMotion();
  const isControlled = controlledOpen !== void 0;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React__namespace.useCallback(
    (value) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );
  const handleShow = React__namespace.useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setOpen(true), delay);
  }, [disabled, delay, setOpen]);
  const handleHide = React__namespace.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(false);
  }, [setOpen]);
  React__namespace.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  const trigger = React__namespace.cloneElement(children, {
    onMouseEnter: handleShow,
    onMouseLeave: handleHide,
    onFocus: handleShow,
    onBlur: handleHide,
    "aria-describedby": isOpen ? tooltipId : void 0
  });
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative inline-flex", children: [
    trigger,
    isOpen && !disabled && /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        id: tooltipId,
        role: "tooltip",
        "aria-hidden": !isOpen,
        className: chunkOR5DRJCW_cjs.cn(
          "absolute z-50 px-2 py-1 text-sm",
          "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
          "rounded-md shadow-lg",
          "whitespace-nowrap",
          !prefersReducedMotion && "animate-fade-in",
          placementStyles[placement],
          className
        ),
        children: [
          content,
          /* @__PURE__ */ jsxRuntime.jsx(
            "span",
            {
              className: chunkOR5DRJCW_cjs.cn("absolute h-0 w-0 border-4", arrowStyles[placement]),
              "aria-hidden": "true"
            }
          )
        ]
      }
    )
  ] });
}
Tooltip.displayName = "Tooltip";

exports.Tooltip = Tooltip;
//# sourceMappingURL=chunk-HGON5QUF.cjs.map
//# sourceMappingURL=chunk-HGON5QUF.cjs.map