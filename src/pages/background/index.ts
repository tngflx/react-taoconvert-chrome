import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { idb } from '../../shared/storages/indexDB';
import { h5Encryption } from '../../shared/h5api.taobao/sign';


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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request?.action) {
        case 'get_tracking_code':
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
                        const { expressName, expressId } = parsedData;

                        sendResponse({ expressId, expressName })
                    })
                    .catch(error => {
                        console.error("Error querying internal API:", error);
                        sendResponse({ status: false, error: error.message });

                    });
            });
            break;
        case 'get_itempage_products':
            //e.__processRequestMethod, e.__processRequestType, e.__processToken, e.__processRequestUrl, e.middlewares, e.__processRequest, c]

            chrome.cookies.getAll({ url: sender.origin }, (cookies) => {
                const h5_tk_token_array = cookies
                    .filter(cookie => cookie.name.includes('m_h5_tk'))

                const token = h5_tk_token_array[0].value.split('_')[0]

                const h5_tk_cookies_string = h5_tk_token_array
                    .map(cookie => `${cookie.name}=${cookie.value}`)
                    .join('; ');

                const time = (new Date).getTime()
                const params = {
                    jsv: '2.6.1',
                    appKey: '12574478',
                    t: time,
                    api: 'mtop.taobao.pcdetail.data.get',
                    v: '1.0',
                    isSec: '0',
                    ecode: '0',
                    timeout: '10000',
                    ttid: '2022@taobao_litepc_9.17.0',
                    AntiFlood: 'true',
                    AntiCreep: 'true',
                    dataType: 'json',
                    valueType: 'string',
                    preventFallback: 'true',
                    type: 'json',
                    data: JSON.stringify({ ...request.data }),
                };

                const { signH5ItemPageReq } = new h5Encryption(token, time, params.data)
                params['sign'] = signH5ItemPageReq()

                const order = ['jsv', 'appKey', 't', 'sign', 'api', 'v', 'isSec', 'ecode', 'timeout', 'ttid', 'AntiFlood', 'AntiCreep', 'dataType', 'valueType', 'preventFallback', 'type', 'data'];
                const reorderedParams = Object.fromEntries(order.map(key => [key, params[key]]));

                const queryString = Object.entries(reorderedParams)
                    .map(([key, value]) => {
                        return `${key}=${encodeURIComponent(value as any)}`;
                    })
                    .join("&");

                const url = `https://h5api.m.taobao.com/h5/mtop.taobao.pcdetail.data.get/1.0/?${queryString}`;

                fetch(url, {
                    headers: {
                        "accept-language": "en;q=0.5",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-site",
                        "sec-gpc": "1",
                        "Cookie": h5_tk_cookies_string,
                        "Content-Type": "application/json",  // Add this line
                    },
                    referrer: "https://item.taobao.com/",
                    referrerPolicy: "strict-origin-when-cross-origin",
                    method: "GET",
                    mode: "cors",
                    credentials: "include"
                })
                    .then(response => response.json())
                    .then(data => {
                        sendResponse(data)
                    })
                    .catch(err => {
                        console.error('h5api.taobao is not working well :(')
                    })
            });

            break;

        case 'get_itempage_reviews':


            break;

        default:
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
        port.onMessage.addListener(async (resp) => {
            const { msg_action, orderId, tracking_info, ...rest } = resp;
            switch (msg_action) {
                case 'get_tracking_info':

                case 'is_freight_processed':
                    const freight_html = await checkFreightIfTrackingExists(tracking_info?.expressId)
                    resp.freight_html = freight_html;
                    delete resp.msg_action; //Bug in chrome where msg_action will stuck on previous call

                    port.postMessage({ msg_action: "process_freight_html", ...resp })
                    //idb.add({ orderId, ...rest })
                    break;

                case 'save_db':
                    idb.add({ orderId, tracking_info, ...rest })
                    break;
                default:
            }
        });
    }
});


function checkFreightIfTrackingExists(expressId) {
    const trackingEndpoint = `https://nswex.com/index.php?route=account/order&filter_order_status=5&filter_tracking_number=${expressId}`;

    // Fetch the HTML content from the endpoint
    return fetch(trackingEndpoint)
        .then(response => response.text())
        .then(html => html)
        .catch(error => {
            console.error('Error fetching or parsing HTML:', error);
        });
}

