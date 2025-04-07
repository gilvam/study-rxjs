
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/study-rxjs/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/study-rxjs"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 615, hash: 'c9c4f6d18cf86029e516a6c84449369e94e1fc2f75d3d8f7298df79fc54cddb8', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1017, hash: '90fe0a7f929ac4b8b0bce478f5bb98314f991d253e73168e3f536fcc5ab1c36e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 4264, hash: 'f7897049983fb7fcc5a84d4a7c5215905a8c7b17475b20cffdd83f10119a2801', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-ZUISL3KO.css': {size: 48, hash: 'OMjhBbaoui0', text: () => import('./assets-chunks/styles-ZUISL3KO_css.mjs').then(m => m.default)}
  },
};
