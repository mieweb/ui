'use strict';

var chunkOR5DRJCW_cjs = require('./chunk-OR5DRJCW.cjs');
var classVarianceAuthority = require('class-variance-authority');
var jsxRuntime = require('react/jsx-runtime');

var skeletonVariants = classVarianceAuthority.cva(
  ["animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700"],
  {
    variants: {
      variant: {
        default: "",
        text: "h-4",
        title: "h-6",
        avatar: "rounded-full",
        button: "h-10 w-24",
        card: "h-40",
        image: "aspect-video"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Skeleton({
  className,
  variant,
  width,
  height,
  circle,
  style,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        skeletonVariants({ variant }),
        circle && "rounded-full",
        className
      ),
      style: {
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style
      },
      "aria-hidden": "true",
      ...props
    }
  );
}
Skeleton.displayName = "Skeleton";
function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
  gap = "sm",
  className
}) {
  const gapClasses = {
    sm: "space-y-2",
    md: "space-y-3",
    lg: "space-y-4"
  };
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: chunkOR5DRJCW_cjs.cn(gapClasses[gap], className), "aria-hidden": "true", children: Array.from({ length: lines }).map((_, index) => /* @__PURE__ */ jsxRuntime.jsx(
    Skeleton,
    {
      variant: "text",
      style: {
        width: index === lines - 1 ? lastLineWidth : "100%"
      }
    },
    index
  )) });
}
SkeletonText.displayName = "SkeletonText";
function SkeletonCard({
  showImage = true,
  showAvatar = false,
  textLines = 2,
  className
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: chunkOR5DRJCW_cjs.cn(
        "border-border bg-card space-y-4 rounded-xl border p-4",
        className
      ),
      "aria-hidden": "true",
      children: [
        showImage && /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { variant: "image", className: "rounded-lg" }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "space-y-3", children: [
          showAvatar && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { circle: true, width: 40, height: 40 }),
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex-1 space-y-2", children: [
              /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { variant: "text", width: "50%" }),
              /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { variant: "text", width: "30%" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { variant: "title", width: "80%" }),
          /* @__PURE__ */ jsxRuntime.jsx(SkeletonText, { lines: textLines })
        ] })
      ]
    }
  );
}
SkeletonCard.displayName = "SkeletonCard";
function SkeletonTable({
  rows = 5,
  columns = 4,
  className
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: chunkOR5DRJCW_cjs.cn("space-y-3", className), "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex gap-4", children: Array.from({ length: columns }).map((_, i) => /* @__PURE__ */ jsxRuntime.jsx(Skeleton, { variant: "text", className: "h-5 flex-1" }, `header-${i}`)) }),
    Array.from({ length: rows }).map((_, rowIndex) => /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex gap-4", children: Array.from({ length: columns }).map((_2, colIndex) => /* @__PURE__ */ jsxRuntime.jsx(
      Skeleton,
      {
        variant: "text",
        className: "flex-1"
      },
      `cell-${rowIndex}-${colIndex}`
    )) }, `row-${rowIndex}`))
  ] });
}
SkeletonTable.displayName = "SkeletonTable";

exports.Skeleton = Skeleton;
exports.SkeletonCard = SkeletonCard;
exports.SkeletonTable = SkeletonTable;
exports.SkeletonText = SkeletonText;
exports.skeletonVariants = skeletonVariants;
//# sourceMappingURL=chunk-N3QTYHRZ.cjs.map
//# sourceMappingURL=chunk-N3QTYHRZ.cjs.map