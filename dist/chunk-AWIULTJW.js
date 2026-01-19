import { cn } from './chunk-F3SOEIN2.js';
import * as React from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

var Table = React.forwardRef(
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
var TableHeader = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props })
);
TableHeader.displayName = "TableHeader";
var TableBody = React.forwardRef(
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
var TableFooter = React.forwardRef(
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
var TableRow = React.forwardRef(
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
var TableHead = React.forwardRef(
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
var TableCell = React.forwardRef(
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
var TableCaption = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
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

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
//# sourceMappingURL=chunk-AWIULTJW.js.map
//# sourceMappingURL=chunk-AWIULTJW.js.map