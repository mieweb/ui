'use strict';

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

// src/components/VisuallyHidden/VisuallyHidden.tsx
var VisuallyHidden = React__namespace.forwardRef(
  ({ children, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntime.jsx(
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

exports.VisuallyHidden = VisuallyHidden;
//# sourceMappingURL=chunk-ZJCPW6MS.cjs.map
//# sourceMappingURL=chunk-ZJCPW6MS.cjs.map