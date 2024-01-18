import packageJson from './package.json' assert { type: 'json' };

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = {
    manifest_version: 3,
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    permissions: ['storage', 'sidePanel', "cookies", "unlimitedStorage", "tabs"],
    host_permissions: ["<all_urls>"],
    background: {
        service_worker: 'src/pages/background/index.js',
        type: 'module',
    },
    action: {
        default_popup: 'src/pages/popup/index.html',
        default_icon: 'icon-34.png',
    },
    icons: {
        128: 'icon-128.png',
    },
    content_scripts: [
        {
            matches: ["https://*.taobao.com/*", "https://*.tmall.com/*"],
            js: ['src/pages/priceConvert/index.js'],
            // KEY for cache invalidation
            css: ['assets/css/priceConvStyle<KEY>.chunk.css'],
        },
        {
            matches: ["https://buyertrade.taobao.com/*"],
            js: ['src/pages/buyerTrade/index.js'],
            css: ['assets/css/buyerTradeStyle.chunk.css'],
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
