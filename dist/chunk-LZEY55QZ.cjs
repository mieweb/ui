'use strict';

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

var Table = React__namespace.forwardRef(
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
var TableHeader = React__namespace.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx("thead", { ref, className: chunkOR5DRJCW_cjs.cn("[&_tr]:border-b", className), ...props })
);
TableHeader.displayName = "TableHeader";
var TableBody = React__namespace.forwardRef(
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
var TableFooter = React__namespace.forwardRef(
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
var TableRow = React__namespace.forwardRef(
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
var TableHead = React__namespace.forwardRef(
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
var TableCell = React__namespace.forwardRef(
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
var TableCaption = React__namespace.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntime.jsx(
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

exports.Table = Table;
exports.TableBody = TableBody;
exports.TableCaption = TableCaption;
exports.TableCell = TableCell;
exports.TableFooter = TableFooter;
exports.TableHead = TableHead;
exports.TableHeader = TableHeader;
exports.TableRow = TableRow;
//# sourceMappingURL=chunk-LZEY55QZ.cjs.map
//# sourceMappingURL=chunk-LZEY55QZ.cjs.map