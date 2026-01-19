import { usePrefersReducedMotion } from './chunk-HB7C7NB5.js';
import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { jsxs, jsx } from 'react/jsx-runtime';

var DEFAULT_OFFSET = 8;
var VIEWPORT_PADDING = 8;
function Tooltip({
  content,
  children,
  placement: preferredPlacement = "top",
  delay = 200,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
  className,
  maxWidth = 250,
  offset = DEFAULT_OFFSET
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [position, setPosition] = React.useState(null);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const showTimeoutRef = React.useRef(
    null
  );
  const hideTimeoutRef = React.useRef(
    null
  );
  const isHoveringRef = React.useRef(false);
  const wrapperRef = React.useRef(null);
  const tooltipRef = React.useRef(null);
  const tooltipId = React.useId();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isControlled = controlledOpen !== void 0;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (value) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );
  const clearTimeouts = React.useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);
  const calculatePosition = React.useCallback(() => {
    if (!wrapperRef.current || !tooltipRef.current) return;
    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const fitsPlacement = (p) => {
      switch (p) {
        case "top":
          return triggerRect.top - tooltipRect.height - offset >= VIEWPORT_PADDING;
        case "bottom":
          return triggerRect.bottom + tooltipRect.height + offset <= viewportHeight - VIEWPORT_PADDING;
        case "left":
          return triggerRect.left - tooltipRect.width - offset >= VIEWPORT_PADDING;
        case "right":
          return triggerRect.right + tooltipRect.width + offset <= viewportWidth - VIEWPORT_PADDING;
      }
    };
    let actualPlacement = preferredPlacement;
    if (!fitsPlacement(preferredPlacement)) {
      const opposites = {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left"
      };
      const opposite = opposites[preferredPlacement];
      if (fitsPlacement(opposite)) {
        actualPlacement = opposite;
      } else {
        const perpendicular = preferredPlacement === "top" || preferredPlacement === "bottom" ? ["right", "left"] : ["bottom", "top"];
        for (const p of perpendicular) {
          if (fitsPlacement(p)) {
            actualPlacement = p;
            break;
          }
        }
      }
    }
    let top = 0;
    let left = 0;
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;
    switch (actualPlacement) {
      case "top":
        top = triggerRect.top - tooltipRect.height - offset;
        left = triggerCenterX - tooltipRect.width / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + offset;
        left = triggerCenterX - tooltipRect.width / 2;
        break;
      case "left":
        top = triggerCenterY - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - offset;
        break;
      case "right":
        top = triggerCenterY - tooltipRect.height / 2;
        left = triggerRect.right + offset;
        break;
    }
    let arrowOffset = 0;
    const idealLeft = left;
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    } else if (left + tooltipRect.width > viewportWidth - VIEWPORT_PADDING) {
      left = viewportWidth - tooltipRect.width - VIEWPORT_PADDING;
    }
    if (actualPlacement === "top" || actualPlacement === "bottom") {
      arrowOffset = idealLeft - left;
    }
    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING;
    } else if (top + tooltipRect.height > viewportHeight - VIEWPORT_PADDING) {
      top = viewportHeight - tooltipRect.height - VIEWPORT_PADDING;
    }
    setPosition({ top, left, actualPlacement, arrowOffset });
  }, [preferredPlacement, offset]);
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new window.MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
    return () => observer.disconnect();
  }, []);
  React.useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }
    const rafId = window.requestAnimationFrame(() => {
      calculatePosition();
    });
    const handleUpdate = () => calculatePosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, calculatePosition]);
  const handleMouseEnter = React.useCallback(() => {
    if (disabled) return;
    isHoveringRef.current = true;
    clearTimeouts();
    showTimeoutRef.current = setTimeout(() => {
      if (isHoveringRef.current) {
        setOpen(true);
      }
    }, delay);
  }, [disabled, delay, setOpen, clearTimeouts]);
  const handleMouseLeave = React.useCallback(() => {
    isHoveringRef.current = false;
    clearTimeouts();
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setOpen(false);
      }
    }, 100);
  }, [setOpen, clearTimeouts]);
  const handleFocus = React.useCallback(() => {
    if (disabled) return;
    clearTimeouts();
    setOpen(true);
  }, [disabled, setOpen, clearTimeouts]);
  const handleBlur = React.useCallback(() => {
    clearTimeouts();
    setOpen(false);
  }, [setOpen, clearTimeouts]);
  React.useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);
  const trigger = React.cloneElement(children, {
    onFocus: handleFocus,
    onBlur: handleBlur,
    "aria-describedby": isOpen ? tooltipId : void 0
  });
  const getArrowStyle = (isDark) => {
    if (!position) return {};
    const { actualPlacement, arrowOffset } = position;
    const baseStyle = {
      position: "absolute",
      width: 0,
      height: 0,
      borderStyle: "solid",
      // Must use content-box for CSS border triangle to work (Tailwind sets border-box globally)
      boxSizing: "content-box"
    };
    const arrowSize = 5;
    const arrowColor = isDark ? "#f5f5f5" : "#171717";
    switch (actualPlacement) {
      case "top":
        return {
          ...baseStyle,
          bottom: -5,
          left: `calc(50% + ${arrowOffset}px)`,
          transform: "translateX(-50%)",
          borderWidth: `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`,
          borderColor: `${arrowColor} transparent transparent transparent`
        };
      case "bottom":
        return {
          ...baseStyle,
          top: -5,
          left: `calc(50% + ${arrowOffset}px)`,
          transform: "translateX(-50%)",
          borderWidth: `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`,
          borderColor: `transparent transparent ${arrowColor} transparent`
        };
      case "left":
        return {
          ...baseStyle,
          right: -5,
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
          borderColor: `transparent transparent transparent ${arrowColor}`
        };
      case "right":
        return {
          ...baseStyle,
          left: -5,
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
          borderColor: `transparent ${arrowColor} transparent transparent`
        };
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: wrapperRef,
      className: "relative inline-flex",
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      children: [
        trigger,
        isOpen && !disabled && typeof document !== "undefined" && createPortal(
          /* @__PURE__ */ jsxs(
            "div",
            {
              ref: tooltipRef,
              id: tooltipId,
              role: "tooltip",
              "aria-hidden": !isOpen,
              style: {
                position: "fixed",
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
                maxWidth: maxWidth === "none" ? void 0 : maxWidth,
                visibility: position ? "visible" : "hidden",
                // Use inline styles to ensure they work in portals (rendered outside React tree)
                backgroundColor: isDarkMode ? "#f5f5f5" : "#171717",
                // neutral-100 / neutral-900
                color: isDarkMode ? "#171717" : "#ffffff",
                // neutral-900 / white
                fontFamily: "var(--mieweb-font-sans, ui-sans-serif, system-ui, sans-serif)"
              },
              className: cn(
                "pointer-events-none z-[9999] px-3 py-1.5 text-xs",
                "rounded-md shadow-md",
                "leading-normal font-semibold",
                !prefersReducedMotion && position && "animate-fade-in",
                className
              ),
              children: [
                content,
                position && /* @__PURE__ */ jsx("span", { style: getArrowStyle(isDarkMode), "aria-hidden": "true" })
              ]
            }
          ),
          document.body
        )
      ]
    }
  );
}
Tooltip.displayName = "Tooltip";

export { Tooltip };
//# sourceMappingURL=chunk-UZUBLXVC.js.map
//# sourceMappingURL=chunk-UZUBLXVC.js.map