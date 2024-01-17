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
    permissions: ['storage', 'sidePanel', "cookies", "unlimitedStorage"],
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
            matches: ['https://s.taobao.com/*', 'https://world.taobao.com/*', "https://item.taobao.com/*", '<all_urls>'],
            js: ['src/pages/priceConvert/index.js'],
            // KEY for cache invalidation
            css: ['assets/css/priceConvertStyle<KEY>.chunk.css'],
            "type": "module"
        },
        {
            matches: ["https://buyertrade.taobao.com/*"],
            js: ['src/pages/buyerTrade/index.js'],
            // KEY for cache invalidation
            css: ['assets/css/priceConvertStyle<KEY>.chunk.css'],
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
