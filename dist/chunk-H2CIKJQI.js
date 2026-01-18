import * as React from 'react';
import { jsx } from 'react/jsx-runtime';

// src/components/VisuallyHidden/VisuallyHidden.tsx
var VisuallyHidden = React.forwardRef(
  ({ children, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "span",
      {
        ref,
        style: {
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          borderWidth: 0
        },
        ...props,
        children
      }
    );
  }
);
VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };
//# sourceMappingURL=chunk-H2CIKJQI.js.map
//# sourceMappingURL=chunk-H2CIKJQI.js.map