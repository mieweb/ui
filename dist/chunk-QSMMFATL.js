import { useEscapeKey } from './chunk-T4ME7QCT.js';
import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva } from 'class-variance-authority';
import { jsxs, jsx } from 'react/jsx-runtime';

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
  const [isOpen, setIsOpen] = React.useState(false);
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || ""
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const searchInputRef = React.useRef(null);
  const listRef = React.useRef(null);
  const dropdownRef = React.useRef(null);
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const isControlled = controlledValue !== void 0;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const flatOptions = React.useMemo(() => {
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
  const filteredOptions = React.useMemo(() => {
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
  const filteredFlatOptions = React.useMemo(() => {
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
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const target = e.target;
      if (containerRef.current && !containerRef.current.contains(target) && dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  useEscapeKey(() => {
    if (isOpen) {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }, isOpen);
  const [dropdownStyle, setDropdownStyle] = React.useState(
    {}
  );
  const updateDropdownPosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedDropdownHeight = Math.min(flatOptions.length * 40 + 16, 300);
    const openAbove = spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow;
    setDropdownStyle({
      position: "fixed",
      ...openAbove ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 },
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(
        Math.min(openAbove ? spaceAbove - 8 : spaceBelow - 8, 300),
        0
      ),
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      zIndex: 9999
    });
  }, [flatOptions.length]);
  React.useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition]);
  const handleValueChange = React.useCallback(
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
  const handleKeyDown = React.useCallback(
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
  React.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);
  React.useEffect(() => {
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
      isOpen && createPortal(
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: dropdownRef,
            style: dropdownStyle,
            className: cn(
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
                  className: "flex-1 overflow-auto p-1",
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
        ),
        document.body
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
        isSelected && /* @__PURE__ */ jsx(CheckIcon, { className: "text-primary-500 h-4 w-4 shrink-0" })
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
function CheckIcon({ className }) {
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

export { Select, selectTriggerVariants };
//# sourceMappingURL=chunk-QSMMFATL.js.map
//# sourceMappingURL=chunk-QSMMFATL.js.map