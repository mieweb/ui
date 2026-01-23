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

var dateButtonVariants = classVarianceAuthority.cva(
  [
    "flex-shrink-0 rounded-xl border px-3 py-2 text-center transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
    "dark:focus:ring-offset-neutral-900"
  ],
  {
    variants: {
      selected: {
        true: "border-primary-500 bg-primary-50 dark:bg-primary-900/20",
        false: "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
      }
    },
    defaultVariants: {
      selected: false
    }
  }
);
var DateButton = React__namespace.forwardRef(
  ({ className, date, selected, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        ref,
        type: "button",
        className: chunkOR5DRJCW_cjs.cn(dateButtonVariants({ selected }), className),
        ...props,
        children: [
          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-xs text-neutral-500 dark:text-neutral-400", children: date.toLocaleDateString("en-US", { weekday: "short" }) }),
          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-lg font-semibold text-neutral-900 dark:text-white", children: date.getDate() }),
          /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-xs text-neutral-500 dark:text-neutral-400", children: date.toLocaleDateString("en-US", { month: "short" }) })
        ]
      }
    );
  }
);
DateButton.displayName = "DateButton";
var timeButtonVariants = classVarianceAuthority.cva(
  [
    "rounded-xl border px-2 py-2 text-sm transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
    "dark:focus:ring-offset-neutral-900"
  ],
  {
    variants: {
      selected: {
        true: "border-primary-500 bg-primary-50 dark:bg-primary-900/20",
        false: "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
      }
    },
    defaultVariants: {
      selected: false
    }
  }
);
var TimeButton = React__namespace.forwardRef(
  ({ className, time, selected, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        ref,
        type: "button",
        className: chunkOR5DRJCW_cjs.cn(timeButtonVariants({ selected }), className),
        ...props,
        children: time
      }
    );
  }
);
TimeButton.displayName = "TimeButton";
var radioOptionVariants = classVarianceAuthority.cva(
  [
    "cursor-pointer rounded-xl border bg-card p-4 transition-all",
    "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500"
  ],
  {
    variants: {
      selected: {
        true: "border-2 border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800",
        false: "border-border"
      }
    },
    defaultVariants: {
      selected: false
    }
  }
);
var RadioOption = React__namespace.forwardRef(
  ({ className, title, description, selected, children, onClick, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        ref,
        className: chunkOR5DRJCW_cjs.cn(radioOptionVariants({ selected }), className),
        onClick,
        role: "button",
        tabIndex: 0,
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.(e);
          }
        },
        ...props,
        children: [
          /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: chunkOR5DRJCW_cjs.cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  selected ? "border-primary-500 bg-primary-500" : "border-neutral-300"
                ),
                children: selected && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "h-2 w-2 rounded-full bg-white" })
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntime.jsx("div", { className: "font-medium text-neutral-900 dark:text-white", children: title }),
              description && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "text-sm text-neutral-500 dark:text-neutral-400", children: description })
            ] })
          ] }),
          children
        ]
      }
    );
  }
);
RadioOption.displayName = "RadioOption";
var DatePicker = React__namespace.forwardRef(
  ({
    className,
    dates,
    selectedDate,
    onDateSelect,
    label = "Select Date",
    ...props
  }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { ref, className, ...props, children: [
      /* @__PURE__ */ jsxRuntime.jsx("label", { className: "mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300", children: label }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "-m-1 flex gap-2 overflow-x-auto p-1", children: dates.map((date, index) => /* @__PURE__ */ jsxRuntime.jsx(
        DateButton,
        {
          date,
          selected: selectedDate?.toDateString() === date.toDateString(),
          onClick: (e) => {
            e.stopPropagation();
            onDateSelect?.(date);
          }
        },
        index
      )) })
    ] });
  }
);
DatePicker.displayName = "DatePicker";
var TimePicker = React__namespace.forwardRef(
  ({
    className,
    times,
    selectedTime,
    onTimeSelect,
    label = "Select Time",
    columns = 6,
    ...props
  }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { ref, className, ...props, children: [
      /* @__PURE__ */ jsxRuntime.jsx("label", { className: "mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300", children: label }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          className: chunkOR5DRJCW_cjs.cn(
            "-m-1 grid gap-2 p-1",
            columns === 4 ? "grid-cols-4" : "grid-cols-4 sm:grid-cols-6"
          ),
          children: times.map((time) => /* @__PURE__ */ jsxRuntime.jsx(
            TimeButton,
            {
              time,
              selected: selectedTime === time,
              onClick: (e) => {
                e.stopPropagation();
                onTimeSelect?.(time);
              }
            },
            time
          ))
        }
      )
    ] });
  }
);
TimePicker.displayName = "TimePicker";
var SchedulePicker = React__namespace.forwardRef(
  ({
    className,
    dates,
    times,
    selectedDate,
    selectedTime,
    onDateSelect,
    onTimeSelect,
    dateLabel = "Select Date",
    timeLabel = "Select Time",
    timeColumns = 6,
    showTimePicker = true,
    ...props
  }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { ref, className: chunkOR5DRJCW_cjs.cn("space-y-4", className), ...props, children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        DatePicker,
        {
          dates,
          selectedDate,
          onDateSelect,
          label: dateLabel
        }
      ),
      showTimePicker && selectedDate && /* @__PURE__ */ jsxRuntime.jsx(
        TimePicker,
        {
          times,
          selectedTime,
          onTimeSelect,
          label: timeLabel,
          columns: timeColumns
        }
      )
    ] });
  }
);
SchedulePicker.displayName = "SchedulePicker";

exports.DateButton = DateButton;
exports.DatePicker = DatePicker;
exports.RadioOption = RadioOption;
exports.SchedulePicker = SchedulePicker;
exports.TimeButton = TimeButton;
exports.TimePicker = TimePicker;
exports.dateButtonVariants = dateButtonVariants;
exports.radioOptionVariants = radioOptionVariants;
exports.timeButtonVariants = timeButtonVariants;
//# sourceMappingURL=chunk-EF46XW4Z.cjs.map
//# sourceMappingURL=chunk-EF46XW4Z.cjs.map