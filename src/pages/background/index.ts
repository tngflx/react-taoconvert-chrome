import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { idb } from '../../shared/storages/indexDB';
import { queryBuilder } from './apiQueryBuilder';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
interface TrackingInfo {
    expressId: string;
    expressName: string;
    // Add other properties if necessary
}

/**
 * One-time chrome message listener and short-lived
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request?.msg_action) {
        case 'get_buyertrade_tracking_code':
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
                        const parsedData: TrackingInfo = JSON.parse(decoder.decode(data));

                        if (parsedData?.expressName && parsedData?.expressId) {
                            const { expressName, expressId } = parsedData;
                            sendResponse({ expressId, expressName });
                        } else {
                            sendResponse(null);
                        }
                    })
                    .catch(error => {
                        console.error("Error querying buyertrade.taobao.com :", error);
                        sendResponse({ status: false, error: error.message });

                    });
            });
            break;

        case 'get_itempage_products': {
            const { url_param_data } = request;

            chrome.cookies.getAll({ url: sender.origin }, (cookies) => {
                const _queryBuilder = new queryBuilder(cookies, url_param_data)
                _queryBuilder.fetchTaoItemPage()
                    .then(res => {
                        sendResponse(res)
                    }).catch(e => {
                        sendResponse(e)
                    })
            });
            break;
        }

        case 'get_itempage_reviews': {

            const { url_param_data } = request;

            chrome.cookies.getAll({ url: sender.origin }, (cookies) => {
                const _queryBuilder = new queryBuilder(cookies, url_param_data)
                _queryBuilder.fetchTaoReviewPage()
                    .then(res => {
                        sendResponse(res)
                    }).catch(e => {
                        sendResponse(e)
                    })
            });
            break;
        }

        default:
    }
    // Bug in chrome api itself, need to return true, so it will wait for response
    return true;
});

let popupPort;

/**
 * Listener for a persistent connection content-script and background ts
 */
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'content-script') {

        // Save the port for later communication
        popupPort = port;
        // Listen for messages from the content script
        port.onMessage.addListener(async (resp) => {
            const { msg_action, db_data, first_query } = resp;
            const { orderId, buyertrade_tracking_info, ...rest } = db_data
            switch (msg_action) {
                case 'get_tracking_info':

                case 'is_freight_processed':
                    if (first_query) {
                        const [delivery_html, ontheway_html, arrived_html] = await Promise.all([
                            checkFreightIfTrackingExists('delivery_info', buyertrade_tracking_info?.expressId),
                            checkFreightIfTrackingExists('ontheway_info'),
                            checkFreightIfTrackingExists('arrived_info')
                        ])

                        resp.freight_html = {
                            delivery_html,
                            ontheway_html,
                            arrived_html
                        };
                    } else {
                        resp.freight_html = {
                            delivery_html: await checkFreightIfTrackingExists('delivery_info', buyertrade_tracking_info?.expressId)
                        };
                    }

                    delete resp.msg_action; //Bug in chrome where msg_action will stuck on previous call

                    port.postMessage({ msg_action: "process_freight_html", ...resp })
                    break;

                case 'save_db':
                    idb.add({ orderId, ...db_data })
                    break;
                default:
            }
        });
    }
});


function checkFreightIfTrackingExists(options: string, expressId?: Object) {
    let url: string;

    // Needed as 
    switch (options) {
        case 'arrived_info':
            url = 'https://nswex.com/index.php?route=account/order_product&filter_order_product_status=4'
            break;
        case 'delivery_info':
            url = `https://nswex.com/index.php?route=account/order&filter_tracking_number=${expressId}`
            break;
        case 'ontheway_info':
            url = 'https://nswex.com/index.php?route=account/order_product&filter_order_product_status=3'
            break;
        default:
    }

    const headers = {
        "Accept": "text/html",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
    };

    const fetchOptions: RequestInit = {
        method: "GET",
        mode: "cors",
        credentials: "include" as RequestCredentials,
        headers
    };

    return fetch(url, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .catch(error => {
            // Handle errors here
            console.error("Fetch error:", error);
        });

}

