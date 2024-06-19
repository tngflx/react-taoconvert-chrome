import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { idb } from '../../shared/storages/indexDB';
import { queryBuilder } from './apiQueryBuilder';
import { MulupostStatusChecker, NswexFreightStatusType, NswexStatusChecker } from './freightStatusHandler';

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
let nswex_script_loaded = false;
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    const { msg_action } = request;
    const [src_msg, child_msg] = msg_action.split(':');

    switch (src_msg) {
        case 'buyertrade': {
            switch (child_msg) {
                case 'get_buyertrade_tracking_code': {
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
                }
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
                    const change_param_data = { "source": 1, "bizOrderId": orderId, "requestIdentity": "#t#ip##_h5_web_default", "appName": "tborder", "appVersion": "3.0" }

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
            break;
        }

        case 'popup': {
            switch (child_msg) {
                case 'create_nswex_tab': {
                    const { selected_product_infos, url } = request;
                    chrome.tabs.create({ url }, function (newTab) {
                        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
                            if (tabId === newTab.id && changeInfo.status === 'complete' && nswex_script_loaded) {
                                const port = chrome.tabs.connect(tabId);
                                port.postMessage({ msg_action: 'nswex_fill_form', ...selected_product_infos });
                                nswex_script_loaded = false;
                                chrome.tabs.onUpdated.removeListener(listener);
                            }
                        });
                    });
                    break;
                }
                case 'update_nswex_tab': {
                    const { nswexTab, selected_product_infos, url } = request;
                    function listener(tabId, changeInfo) {
                        if (tabId === nswexTab.id && changeInfo.status === 'complete') {
                            const port = chrome.tabs.connect(nswexTab.id);
                            port.postMessage({ msg_action: 'nswex_fill_form', ...selected_product_infos });
                            chrome.tabs.onUpdated.removeListener(listener);
                        }
                    }

                    chrome.tabs.onUpdated.addListener(listener);
                    const chrome_tabs_options = nswexTab.url === url ? { active: true } : { url, active: true };

                    chrome.tabs.update(nswexTab.id, chrome_tabs_options, function (updatedTab) {
                        if (chrome.runtime.lastError) {
                            chrome.tabs.onUpdated.removeListener(listener);
                            console.error(chrome.runtime.lastError);
                        }
                        if (nswexTab.url == url) {
                            listener(updatedTab.id, { status: 'complete' })
                        }
                    });
                    break;
                }
            }
            break;
        }

        case 'nswex': {
            switch (child_msg) {
                case 'script_loaded': {
                    nswex_script_loaded = true;
                    console.log('script_loaded nswex')
                    break;
                }
            }
            break;
        }
    }

    // Bug in chrome api itself, need to return true, so it will wait for response
    return true;
});


/**
 * Listener for a persistent connection content-script and background ts
 */
chrome.runtime.onConnect.addListener((port) => {
    if (port.name == 'content-script') {
        port.onMessage.addListener(async (resp) => {
            const { msg_action, db_data, first_query } = resp;
            const { orderId, buyertrade_tracking_info } = db_data;
            const nswexFreight = new NswexStatusChecker();

            const [src_msg, child_msg] = msg_action.split(':');
            switch (src_msg) {
                case 'buyertrade': {
                    switch (child_msg) {
                        case 'is_mulupost_freight_processed': {
                            const muluFreight = new MulupostStatusChecker()
                            const mulu_html = await muluFreight.checkStatus('search', buyertrade_tracking_info?.expressId)

                            resp.freight_html = {
                                mulu_html
                            };

                            delete resp.msg_action;

                            port.postMessage({ msg_action: "background:process_mulupost_freight_html", ...resp })
                            break;
                        }

                        case 'is_nswex_freight_processed': {
                            if (first_query) {
                                const [delivery_html, ontheway_html, arrived_html] = await Promise.all([
                                    nswexFreight.checkStatus({ type: NswexFreightStatusType.DELIVERY_INFO, express_id: buyertrade_tracking_info?.expressId }),
                                    nswexFreight.checkStatus({ type: NswexFreightStatusType.ON_THE_WAY_INFO }),
                                    nswexFreight.checkStatus({ type: NswexFreightStatusType.ARRIVED_INFO })
                                ])

                                resp.freight_html = {
                                    delivery_html: { delivery_html_raw: delivery_html, delivery_html_tcode: buyertrade_tracking_info?.expressId },
                                    ontheway_html,
                                    arrived_html
                                };
                                port.postMessage({ done_process_entry: true });
                            } else {
                                resp.freight_html = {
                                    delivery_html: {
                                        delivery_html_raw: await nswexFreight.checkStatus({ type: NswexFreightStatusType.DELIVERY_INFO, express_id: buyertrade_tracking_info?.expressId }),
                                        delivery_html_tcode: buyertrade_tracking_info?.expressId
                                    }
                                };

                                port.postMessage({ done_process_entry: true });

                            }

                            delete resp.msg_action; //Bug in chrome where msg_action will stuck on previous call
                            port.postMessage({ msg_action: "background:process_nswex_freight_html", ...resp })
                            break;
                        }
                        case 'save_db': {
                            idb.add({ orderId, ...db_data })
                            break;
                        }
                        default:
                    }
                    break;
                }

                case 'postprocess': {
                    switch (child_msg) {
                        case 'redive_endpoint':
                            resp.freight_html = {
                                redive_html: await nswexFreight.checkStatus({ type: NswexFreightStatusType.REDIVE_INFO, nswex_order_id: orderId })
                            };
                            break;
                    }
                    break;
                }
            }

        });
    }
});

