'use strict';

var chunkVV4N4WY6_cjs = require('./chunk-VV4N4WY6.cjs');
var chunkKMN7JX2X_cjs = require('./chunk-KMN7JX2X.cjs');
var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var React = require('react');
var lucideReact = require('lucide-react');
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

var widthClasses = {
  full: "w-full",
  fit: "w-fit",
  fixed: "w-44"
  // ~176px - enough for MM/DD/YYYY + calendar icon
};
var sizeClasses = {
  sm: "h-8 text-sm",
  md: "h-10 text-base",
  lg: "h-12 text-lg"
};
function getValidationError(value, mode, minAge, maxAge) {
  if (!value || value.replace(/\D/g, "").length === 0) {
    return void 0;
  }
  if (!chunkKMN7JX2X_cjs.isValidDate(value)) {
    return "Please enter a valid date (MM/DD/YYYY)";
  }
  switch (mode) {
    case "dob": {
      if (!chunkKMN7JX2X_cjs.isDateInPast(value)) {
        return "Date of birth must be in the past";
      }
      const age = chunkKMN7JX2X_cjs.calculateAge(value);
      if (age !== null) {
        if (minAge !== void 0 && age < minAge) {
          return `Must be at least ${minAge} years old`;
        }
        if (maxAge !== void 0 && age > maxAge) {
          return `Must be no more than ${maxAge} years old`;
        }
      }
      break;
    }
    case "expiration":
      if (!chunkKMN7JX2X_cjs.isDateInFuture(value)) {
        return "Expiration date must be in the future";
      }
      break;
    case "past":
      if (!chunkKMN7JX2X_cjs.isDateInPast(value)) {
        return "Date must be in the past";
      }
      break;
    case "future":
      if (!chunkKMN7JX2X_cjs.isDateInFuture(value)) {
        return "Date must be in the future";
      }
      break;
  }
  return void 0;
}
var DateInput = React__namespace.forwardRef(
  ({
    value = "",
    onChange,
    mode = "default",
    minAge,
    maxAge,
    validateOnBlur,
    showCalendar = false,
    width = "full",
    className,
    onBlur,
    hasError,
    error,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = React__namespace.useState(
      () => chunkKMN7JX2X_cjs.formatDateValue(value)
    );
    const [localError, setLocalError] = React__namespace.useState();
    React__namespace.useEffect(() => {
      setDisplayValue(chunkKMN7JX2X_cjs.formatDateValue(value));
    }, [value]);
    const handleChange = (e) => {
      const formatted = chunkKMN7JX2X_cjs.formatDateValue(e.target.value);
      setDisplayValue(formatted);
      onChange?.(formatted);
      if (localError) {
        setLocalError(void 0);
      }
    };
    const handleBlur = (e) => {
      onBlur?.(e);
      if (validateOnBlur) {
        const validationError = getValidationError(
          displayValue,
          mode,
          minAge,
          maxAge
        );
        setLocalError(validationError);
      }
    };
    const placeholder = mode === "expiration" ? "MM/DD/YYYY" : "MM/DD/YYYY";
    const autoComplete = mode === "dob" ? "bday" : mode === "expiration" ? "cc-exp" : void 0;
    const generatedId = React__namespace.useId();
    const [isCalendarOpen, setIsCalendarOpen] = React__namespace.useState(false);
    const calendarRef = React__namespace.useRef(null);
    const buttonRef = React__namespace.useRef(null);
    const parsedDate = React__namespace.useMemo(() => {
      if (!displayValue || !chunkKMN7JX2X_cjs.isValidDate(displayValue)) {
        return {
          month: (/* @__PURE__ */ new Date()).getMonth(),
          year: (/* @__PURE__ */ new Date()).getFullYear(),
          day: null
        };
      }
      const [month, day, year] = displayValue.split("/").map(Number);
      return { month: month - 1, year, day };
    }, [displayValue]);
    const [calendarMonth, setCalendarMonth] = React__namespace.useState(parsedDate.month);
    const [calendarYear, setCalendarYear] = React__namespace.useState(parsedDate.year);
    React__namespace.useEffect(() => {
      if (displayValue && chunkKMN7JX2X_cjs.isValidDate(displayValue)) {
        const [month, , year] = displayValue.split("/").map(Number);
        setCalendarMonth(month - 1);
        setCalendarYear(year);
      }
    }, [displayValue]);
    React__namespace.useEffect(() => {
      const handleClickOutside = (event) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
          setIsCalendarOpen(false);
        }
      };
      if (isCalendarOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isCalendarOpen]);
    React__namespace.useEffect(() => {
      const handleEscape = (event) => {
        if (event.key === "Escape") {
          setIsCalendarOpen(false);
          buttonRef.current?.focus();
        }
      };
      if (isCalendarOpen) {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
      }
    }, [isCalendarOpen]);
    const handleDateSelect = (day) => {
      const month = String(calendarMonth + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const year = String(calendarYear);
      const formatted = `${month}/${dayStr}/${year}`;
      setDisplayValue(formatted);
      onChange?.(formatted);
      setIsCalendarOpen(false);
      if (validateOnBlur) {
        const validationError = getValidationError(
          formatted,
          mode,
          minAge,
          maxAge
        );
        setLocalError(validationError);
      }
    };
    const getDaysInMonth = (month, year) => {
      return new Date(year, month + 1, 0).getDate();
    };
    const getFirstDayOfMonth = (month, year) => {
      return new Date(year, month, 1).getDay();
    };
    const renderCalendar = () => {
      const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
      const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
      const days = [];
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      const isSelectedDay = (day) => {
        return parsedDate.day === day && parsedDate.month === calendarMonth && parsedDate.year === calendarYear;
      };
      const isToday = (day) => {
        const today = /* @__PURE__ */ new Date();
        return day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
      };
      return /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          ref: calendarRef,
          className: chunkOR5DRJCW_cjs.cn(
            "absolute top-full left-0 z-50 mt-1",
            "bg-background border-border rounded-lg border shadow-lg",
            "w-72 p-3"
          ),
          role: "dialog",
          "aria-label": "Choose date",
          children: [
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear(calendarYear - 1);
                    } else {
                      setCalendarMonth(calendarMonth - 1);
                    }
                  },
                  className: "hover:bg-muted rounded-md p-1 transition-colors",
                  "aria-label": "Previous month",
                  children: /* @__PURE__ */ jsxRuntime.jsx(ChevronLeftIcon, {})
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntime.jsx(
                  "select",
                  {
                    value: calendarMonth,
                    onChange: (e) => setCalendarMonth(Number(e.target.value)),
                    className: "bg-background border-border rounded border px-2 py-1 text-sm",
                    "aria-label": "Select month",
                    children: monthNames.map((name, i) => /* @__PURE__ */ jsxRuntime.jsx("option", { value: i, children: name }, name))
                  }
                ),
                /* @__PURE__ */ jsxRuntime.jsx(
                  "select",
                  {
                    value: calendarYear,
                    onChange: (e) => setCalendarYear(Number(e.target.value)),
                    className: "bg-background border-border rounded border px-2 py-1 text-sm",
                    "aria-label": "Select year",
                    children: Array.from(
                      { length: 150 },
                      (_, i) => (/* @__PURE__ */ new Date()).getFullYear() - 100 + i
                    ).map((year) => /* @__PURE__ */ jsxRuntime.jsx("option", { value: year, children: year }, year))
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntime.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear(calendarYear + 1);
                    } else {
                      setCalendarMonth(calendarMonth + 1);
                    }
                  },
                  className: "hover:bg-muted rounded-md p-1 transition-colors",
                  "aria-label": "Next month",
                  children: /* @__PURE__ */ jsxRuntime.jsx(ChevronRightIcon, {})
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mb-1 grid grid-cols-7 gap-1", children: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: "text-muted-foreground py-1 text-center text-xs font-medium",
                children: day
              },
              day
            )) }),
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "grid grid-cols-7 gap-1", children: days.map((day, index) => /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                type: "button",
                disabled: day === null,
                onClick: () => day && handleDateSelect(day),
                className: chunkOR5DRJCW_cjs.cn(
                  "h-8 w-8 rounded-md text-sm transition-colors",
                  "focus:ring-ring focus:ring-2 focus:outline-none",
                  day === null && "invisible",
                  day !== null && "hover:bg-muted",
                  isSelectedDay(day) && "bg-primary-800 hover:bg-primary-700 text-white",
                  isToday(day) && !isSelectedDay(day) && "border-primary-800 text-primary-800 border"
                ),
                children: day
              },
              index
            )) }),
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "border-border mt-3 border-t pt-3", children: /* @__PURE__ */ jsxRuntime.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  const today = /* @__PURE__ */ new Date();
                  setCalendarMonth(today.getMonth());
                  setCalendarYear(today.getFullYear());
                  handleDateSelect(today.getDate());
                },
                className: "text-primary-800 w-full text-sm hover:underline",
                children: "Today"
              }
            ) })
          ]
        }
      );
    };
    if (showCalendar) {
      const { label, helperText, hideLabel, required, size, ...inputProps } = props;
      const resolvedSize = size ?? "md";
      const inputId = inputProps.id || generatedId;
      const errorId = `${inputId}-error`;
      const helperId = `${inputId}-helper`;
      const showError = hasError || !!localError;
      const errorMessage = error || localError;
      return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: chunkOR5DRJCW_cjs.cn("flex flex-col gap-1.5", widthClasses[width]), children: [
        label && /* @__PURE__ */ jsxRuntime.jsxs(
          "label",
          {
            htmlFor: inputId,
            className: chunkOR5DRJCW_cjs.cn(
              "text-foreground text-sm font-medium",
              hideLabel && "sr-only"
            ),
            children: [
              label,
              required && /* @__PURE__ */ jsxRuntime.jsx(
                "span",
                {
                  className: "ml-1",
                  style: { color: "#ef4444" },
                  "aria-hidden": "true",
                  children: "*"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "input",
            {
              ref,
              id: inputId,
              type: "text",
              inputMode: "numeric",
              autoComplete,
              placeholder,
              value: displayValue,
              onChange: handleChange,
              onBlur: handleBlur,
              "aria-invalid": showError,
              "aria-describedby": [errorMessage ? errorId : null, helperText ? helperId : null].filter(Boolean).join(" ") || void 0,
              className: chunkOR5DRJCW_cjs.cn(
                "w-full px-3 py-2",
                "rounded-lg border",
                "bg-background text-foreground",
                "placeholder:text-muted-foreground",
                "transition-colors duration-200",
                "focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                sizeClasses[resolvedSize],
                showError ? "border-destructive focus:ring-destructive" : "border-input",
                "pr-10",
                className
              ),
              ...inputProps
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "button",
            {
              ref: buttonRef,
              type: "button",
              onClick: () => setIsCalendarOpen(!isCalendarOpen),
              className: chunkOR5DRJCW_cjs.cn(
                "absolute top-1/2 right-3 -translate-y-1/2",
                "text-muted-foreground hover:text-foreground",
                "focus:text-foreground focus:outline-none",
                "transition-colors"
              ),
              "aria-label": "Open calendar",
              "aria-expanded": isCalendarOpen,
              "aria-haspopup": "dialog",
              children: /* @__PURE__ */ jsxRuntime.jsx(lucideReact.Calendar, { size: 18 })
            }
          ),
          isCalendarOpen && renderCalendar()
        ] }),
        errorMessage && /* @__PURE__ */ jsxRuntime.jsx(
          "p",
          {
            id: errorId,
            className: "text-sm",
            style: { color: "#ef4444" },
            role: "alert",
            children: errorMessage
          }
        ),
        helperText && !errorMessage && /* @__PURE__ */ jsxRuntime.jsx("p", { id: helperId, className: "text-muted-foreground text-sm", children: helperText })
      ] });
    }
    return /* @__PURE__ */ jsxRuntime.jsx(
      chunkVV4N4WY6_cjs.Input,
      {
        ref,
        type: "text",
        inputMode: "numeric",
        autoComplete,
        placeholder,
        value: displayValue,
        onChange: handleChange,
        onBlur: handleBlur,
        hasError: hasError || !!localError,
        error: error || localError,
        className: chunkOR5DRJCW_cjs.cn(widthClasses[width], className),
        ...props
      }
    );
  }
);
DateInput.displayName = "DateInput";
function ChevronLeftIcon() {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m15 18-6-6 6-6" })
    }
  );
}
function ChevronRightIcon() {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m9 18 6-6-6-6" })
    }
  );
}

exports.DateInput = DateInput;
//# sourceMappingURL=chunk-B7DA35BY.cjs.map
//# sourceMappingURL=chunk-B7DA35BY.cjs.map