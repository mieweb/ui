import { cn } from './chunk-F3SOEIN2.js';
import { cva } from 'class-variance-authority';
import { jsx, jsxs } from 'react/jsx-runtime';

var skeletonVariants = cva(
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
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
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
  return /* @__PURE__ */ jsx("div", { className: cn(gapClasses[gap], className), "aria-hidden": "true", children: Array.from({ length: lines }).map((_, index) => /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "border-border bg-card space-y-4 rounded-xl border p-4",
        className
      ),
      "aria-hidden": "true",
      children: [
        showImage && /* @__PURE__ */ jsx(Skeleton, { variant: "image", className: "rounded-lg" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          showAvatar && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Skeleton, { circle: true, width: 40, height: 40 }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
              /* @__PURE__ */ jsx(Skeleton, { variant: "text", width: "50%" }),
              /* @__PURE__ */ jsx(Skeleton, { variant: "text", width: "30%" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Skeleton, { variant: "title", width: "80%" }),
          /* @__PURE__ */ jsx(SkeletonText, { lines: textLines })
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
  return /* @__PURE__ */ jsxs("div", { className: cn("space-y-3", className), "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("div", { className: "flex gap-4", children: Array.from({ length: columns }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { variant: "text", className: "h-5 flex-1" }, `header-${i}`)) }),
    Array.from({ length: rows }).map((_, rowIndex) => /* @__PURE__ */ jsx("div", { className: "flex gap-4", children: Array.from({ length: columns }).map((_2, colIndex) => /* @__PURE__ */ jsx(
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

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonText, skeletonVariants };
//# sourceMappingURL=chunk-6OCIIIAI.js.map
//# sourceMappingURL=chunk-6OCIIIAI.js.map