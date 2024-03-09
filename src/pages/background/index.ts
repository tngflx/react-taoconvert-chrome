import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { idb } from '../../shared/storages/indexDB';
import { queryBuilder } from './apiQueryBuilder';
import { MulupostStatusChecker, NSWEXStatusChecker } from './freightStatusHandler';

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
 * each case get its own destructured request due to race condition
 */

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request?.msg_action) {
        case 'get_buyertrade_tracking_code':
            chrome.cookies.getAll({ url: sender.origin }, (cookies) => {
                const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

                const apiUrl = `https://buyertrade.taobao.com/trade/json/transit_step.do?bizOrderId=${request.orderId}`

                fetch(apiUrl, {
                    method: "GET", 
                    headers: {
                        "Cookie": cookieString,
                        "Accept": "application/json",
                    },
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

            const _queryBuilder = new queryBuilder(url_param_data)
            _queryBuilder.fetchTaoItemPage()
                .then(res => {
                    sendResponse(res)
                }).catch(e => {
                    sendResponse(e)
                })
            break;
        }

        case 'get_itempage_reviews': {

            const { url_param_data } = request;

            const _queryBuilder = new queryBuilder(url_param_data)
            _queryBuilder.fetchTaoReviewPage()
                .then(res => {
                    sendResponse(res)
                }).catch(e => {
                    sendResponse(e)
                })
            break;
        }
        case 'get_itempage_products_moredetails': {
            // Mainly to get address of product
            const { orderId } = request;
            let change_param_data = { "source": 1, "bizOrderId": orderId, "requestIdentity": "#t#ip##_h5_web_default", "appName": "tborder", "appVersion": "3.0" }

                const _queryBuilder = new queryBuilder(change_param_data)
                _queryBuilder.fetchMoreItemDetails()
                    .then(res => {
                        sendResponse(res)
                    }).catch(e => {
                        sendResponse(e)
                    })

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
                case 'is_mulupost_freight_processed': {
                    const muluFreight = new MulupostStatusChecker()
                    const mulu_html = await muluFreight.fetchMuluStatus('search', buyertrade_tracking_info?.expressId)

                    resp.freight_html = {
                        mulu_html
                    };

                    delete resp.msg_action;

                    port.postMessage({ msg_action: "process_mulupost_freight_html", ...resp })
                    break;
                }

                case 'is_nswex_freight_processed': {
                    const nswexFreight = new NSWEXStatusChecker()
                    if (first_query) {
                        const [delivery_html, ontheway_html, arrived_html] = await Promise.all([
                            nswexFreight.checkFreightStatus('delivery_info', buyertrade_tracking_info?.expressId),
                            nswexFreight.checkFreightStatus('ontheway_info'),
                            nswexFreight.checkFreightStatus('arrived_info')
                        ])

                        resp.freight_html = {
                            delivery_html,
                            ontheway_html,
                            arrived_html
                        };
                    } else {
                        resp.freight_html = {
                            delivery_html: await nswexFreight.checkFreightStatus('delivery_info', buyertrade_tracking_info?.expressId)
                        };
                    }

                    delete resp.msg_action; //Bug in chrome where msg_action will stuck on previous call

                    port.postMessage({ msg_action: "process_nswex_freight_html", ...resp })
                    break;
                }
                case 'save_db': {
                    idb.add({ orderId, ...db_data })
                    break;
                }
                default:
            }
        });
    }
});

