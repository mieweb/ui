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
  const pageRange = React__namespace.useMemo(() => {
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
              /* @__PURE__ */ jsxRuntime.jsx(ChevronRightIcon, { className: "h-4 w-4" })
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
              /* @__PURE__ */ jsxRuntime.jsx(ChevronRightIcon, { className: "h-4 w-4" })
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

exports.Pagination = Pagination;
exports.SimplePagination = SimplePagination;
exports.paginationButtonVariants = paginationButtonVariants;
//# sourceMappingURL=chunk-PF3XWKE5.cjs.map
//# sourceMappingURL=chunk-PF3XWKE5.cjs.map