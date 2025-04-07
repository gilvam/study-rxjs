
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 604, hash: '6cf4e079c8d5471e1b48db5508841d2a37fc6d1c3a95ffc122eda605bc4c7192', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1006, hash: 'b0ec9d0809deb01da6357dffdaa16f9d4114d978103c22c5e20c654a655acf0c', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 4253, hash: 'a52c3457c0a147bffb045a884051c731d17a6366abc98557c964daafe7772018', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-ZUISL3KO.css': {size: 48, hash: 'OMjhBbaoui0', text: () => import('./assets-chunks/styles-ZUISL3KO_css.mjs').then(m => m.default)}
  },
};
