'use strict';

// src/brands/index.ts
var brands = {
  bluehive: () => import('./brands/bluehive.cjs').then((m) => m.bluehiveBrand),
  default: () => import('./default-ZGHKI5WF.cjs').then((m) => m.defaultBrand),
  "enterprise-health": () => import('./enterprise-health-UDI25OCV.cjs').then((m) => m.enterpriseHealthBrand),
  mieweb: () => import('./mieweb-UJABK5XX.cjs').then((m) => m.miewebBrand),
  webchart: () => import('./webchart-EHVGP46N.cjs').then((m) => m.webchartBrand)
};

exports.brands = brands;
//# sourceMappingURL=chunk-SEZI2MIS.cjs.map
//# sourceMappingURL=chunk-SEZI2MIS.cjs.map