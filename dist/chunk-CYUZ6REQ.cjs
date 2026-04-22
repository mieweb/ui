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

function Breadcrumb({
  items,
  separator,
  maxItems,
  renderLink,
  className
}) {
  const displayedItems = React__namespace.useMemo(() => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));
    return [
      firstItem,
      { label: "...", isEllipsis: true },
      ...lastItems
    ];
  }, [items, maxItems]);
  const defaultSeparator = /* @__PURE__ */ jsxRuntime.jsx(ChevronRightIcon, { className: "h-4 w-4 shrink-0 text-muted-foreground" });
  return /* @__PURE__ */ jsxRuntime.jsx("nav", { "aria-label": "Breadcrumb", className, children: /* @__PURE__ */ jsxRuntime.jsx("ol", { className: "flex flex-wrap items-center gap-1.5", children: displayedItems.map((item, index) => {
    const isLast = index === displayedItems.length - 1;
    const isEllipsis = item.isEllipsis;
    return /* @__PURE__ */ jsxRuntime.jsxs("li", { className: "flex items-center gap-1.5", children: [
      index > 0 && /* @__PURE__ */ jsxRuntime.jsx("span", { "aria-hidden": "true", children: separator || defaultSeparator }),
      isEllipsis ? /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-sm text-muted-foreground", children: "..." }) : isLast || !item.href ? /* @__PURE__ */ jsxRuntime.jsx(BreadcrumbPage, { item }) : renderLink ? renderLink(item, index) : /* @__PURE__ */ jsxRuntime.jsx(BreadcrumbLink, { item })
    ] }, index);
  }) }) });
}
Breadcrumb.displayName = "Breadcrumb";
function BreadcrumbLink({ item }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "a",
    {
      href: item.href,
      className: chunkOR5DRJCW_cjs.cn(
        "inline-flex items-center gap-1.5",
        "text-sm text-muted-foreground",
        "transition-colors hover:text-foreground",
        "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      ),
      children: [
        item.icon,
        item.label
      ]
    }
  );
}
function BreadcrumbPage({ item }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "span",
    {
      className: "inline-flex items-center gap-1.5 text-sm font-medium text-foreground",
      "aria-current": "page",
      children: [
        item.icon,
        item.label
      ]
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
function BreadcrumbSlash({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "span",
    {
      className: chunkOR5DRJCW_cjs.cn("mx-1 text-muted-foreground", className),
      "aria-hidden": "true",
      children: "/"
    }
  );
}

exports.Breadcrumb = Breadcrumb;
exports.BreadcrumbSlash = BreadcrumbSlash;
//# sourceMappingURL=chunk-CYUZ6REQ.cjs.map
//# sourceMappingURL=chunk-CYUZ6REQ.cjs.map