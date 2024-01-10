import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { idb } from '../../shared/storages/indexDB';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "get_tracking_code") {
        chrome.cookies.getAll({ url: sender.origin }, (cookies) => {
            // Extract the necessary cookies from the cookies array
            const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

            const apiUrl = `https://buyertrade.taobao.com/trade/json/transit_step.do?bizOrderId=${request.orderId}`

            // Make a request to the internal API with the extracted cookies
            fetch(apiUrl, {
                method: "GET",  // or "POST" depending on your API
                headers: {
                    "Cookie": cookieString,
                    "Accept": "application/json",
                },
                // Add any other options or parameters required by your API
            })
                .then(response => response.arrayBuffer())
                .then(async data => {
                    const decoder = new TextDecoder('gbk');
                    data = JSON.parse(decoder.decode(data));
                    const { expressName, expressId } = data as any;

                    sendResponse({ expressId, expressName })
                })
                .catch(error => {
                    console.error("Error querying internal API:", error);
                    sendResponse({ status: false, error: error.message });

                });
        });
    }
    // Bug in chrome api itself, need to return true, so it will wait for response
    return true;
});

let popupPort;

// Listen for a connection from the content script
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'content-script') {

        // Save the port for later communication
        popupPort = port;

        // Listen for messages from the content script
        port.onMessage.addListener((resp) => {
            const { msg_action } = resp;
            switch (msg_action) {
                case 'get_tracking_info':

                case 'save_db':
                    console.log(resp)
                    const { orderId, ...rest } = resp;
                    idb.add({ orderId, ...rest })
                    break;

                default:
            }
        });
    }
});
