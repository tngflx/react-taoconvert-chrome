import packageJson from './package.json' assert { type: 'json' };

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: chrome.runtime.ManifestV3 = {
    manifest_version: 3,
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    permissions: [
        'storage', 'sidePanel', "cookies", "background", "webRequest",
        "unlimitedStorage", "tabs", "debugger", "webNavigation"
    ],
    host_permissions: ["*://*/*"],
    background: {
        service_worker: 'src/pages/background/index.js',
        type: 'module',
    },
    devtools_page: 'src/pages/devtools/index.html',
    action: {
        default_popup: 'src/pages/popup/index.html',
        default_icon: 'icon-34.png',
    },
    icons: {
        128: 'icon-128.png',
    },
    content_scripts: [
        {
            matches: ["https://buyertrade.taobao.com/*"],
            js: ['src/pages/buyerTrade/index.js'],
            css:['assets/css/buyerTradeStyle.chunk.css']
        },
        {
            matches: ["https://s.taobao.com/*", "https://item.taobao.com/*", "https://world.taobao.com/*", "https://*.tmall.com/*"],
            js: ['src/pages/priceConvert/index.js'],
            // KEY for cache invalidation
            css: ['assets/css/priceConvStyle.chunk.css']
        },
        {
            matches: ["https://nswex.com/*"],
            js: ['src/pages/freightPage/index.js']
        }
    ],
    web_accessible_resources: [
        {
            resources: ['assets/js/*.js', 'assets/css/*.css', 'icon-128.png', 'icon-34.png'],
            matches: ['*://*/*'],
        },
    ],
};

export default manifest;
