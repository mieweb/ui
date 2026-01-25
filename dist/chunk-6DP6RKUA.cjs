'use strict';

// src/brands/index.ts
var brands = {
  bluehive: () => import('./brands/bluehive.cjs').then((m) => m.bluehiveBrand),
  default: () => import('./default-ZGHKI5WF.cjs').then((m) => m.defaultBrand),
  "enterprise-health": () => import('./enterprise-health-UDI25OCV.cjs').then((m) => m.enterpriseHealthBrand),
  mieweb: () => import('./mieweb-UJABK5XX.cjs').then((m) => m.miewebBrand),
  waggleline: () => import('./waggleline-6IGA66HR.cjs').then((m) => m.wagglelineBrand),
  webchart: () => import('./webchart-EHVGP46N.cjs').then((m) => m.webchartBrand)
};

exports.brands = brands;
//# sourceMappingURL=chunk-6DP6RKUA.cjs.map
//# sourceMappingURL=chunk-6DP6RKUA.cjs.map