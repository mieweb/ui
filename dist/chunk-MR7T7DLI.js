// src/brands/index.ts
var brands = {
  bluehive: () => import('./brands/bluehive.js').then((m) => m.bluehiveBrand),
  default: () => import('./default-LIRPABBK.js').then((m) => m.defaultBrand),
  "enterprise-health": () => import('./enterprise-health-ORQQOLM3.js').then((m) => m.enterpriseHealthBrand),
  mieweb: () => import('./mieweb-PV2YKYO7.js').then((m) => m.miewebBrand),
  webchart: () => import('./webchart-2SLO5ICI.js').then((m) => m.webchartBrand)
};

export { brands };
//# sourceMappingURL=chunk-MR7T7DLI.js.map
//# sourceMappingURL=chunk-MR7T7DLI.js.map