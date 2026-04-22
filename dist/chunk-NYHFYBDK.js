import * as React from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

import { cn } from './chunk-F3SOEIN2.js';

function Breadcrumb({ items, separator, maxItems, renderLink, className }) {
  const displayedItems = React.useMemo(() => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));
    return [firstItem, { label: '...', isEllipsis: true }, ...lastItems];
  }, [items, maxItems]);
  const defaultSeparator = /* @__PURE__ */ jsx(ChevronRightIcon, {
    className: 'h-4 w-4 shrink-0 text-muted-foreground',
  });
  return /* @__PURE__ */ jsx('nav', {
    'aria-label': 'Breadcrumb',
    className,
    children: /* @__PURE__ */ jsx('ol', {
      className: 'flex flex-wrap items-center gap-1.5',
      children: displayedItems.map((item, index) => {
        const isLast = index === displayedItems.length - 1;
        const isEllipsis = item.isEllipsis;
        return /* @__PURE__ */ jsxs(
          'li',
          {
            className: 'flex items-center gap-1.5',
            children: [
              index > 0 &&
                /* @__PURE__ */ jsx('span', {
                  'aria-hidden': 'true',
                  children: separator || defaultSeparator,
                }),
              isEllipsis
                ? /* @__PURE__ */ jsx('span', {
                    className: 'text-sm text-muted-foreground',
                    children: '...',
                  })
                : isLast || !item.href
                  ? /* @__PURE__ */ jsx(BreadcrumbPage, { item })
                  : renderLink
                    ? renderLink(item, index)
                    : /* @__PURE__ */ jsx(BreadcrumbLink, { item }),
            ],
          },
          index
        );
      }),
    }),
  });
}
Breadcrumb.displayName = 'Breadcrumb';
function BreadcrumbLink({ item }) {
  return /* @__PURE__ */ jsxs('a', {
    href: item.href,
    className: cn(
      'inline-flex items-center gap-1.5',
      'text-sm text-muted-foreground',
      'transition-colors hover:text-foreground',
      'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    ),
    children: [item.icon, item.label],
  });
}
function BreadcrumbPage({ item }) {
  return /* @__PURE__ */ jsxs('span', {
    className:
      'inline-flex items-center gap-1.5 text-sm font-medium text-foreground',
    'aria-current': 'page',
    children: [item.icon, item.label],
  });
}
function ChevronRightIcon({ className }) {
  return /* @__PURE__ */ jsx('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': 'true',
    children: /* @__PURE__ */ jsx('path', { d: 'm9 18 6-6-6-6' }),
  });
}
function BreadcrumbSlash({ className }) {
  return /* @__PURE__ */ jsx('span', {
    className: cn('mx-1 text-muted-foreground', className),
    'aria-hidden': 'true',
    children: '/',
  });
}

export { Breadcrumb, BreadcrumbSlash };
//# sourceMappingURL=chunk-NYHFYBDK.js.map
//# sourceMappingURL=chunk-NYHFYBDK.js.map
