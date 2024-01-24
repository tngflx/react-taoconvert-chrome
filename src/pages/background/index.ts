import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { idb } from '../../shared/storages/indexDB';

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
            const params = {
                jsv: '2.6.1',
                appKey: 12574478,
                t: 1705902514018,
                sign: 'ba4d7b884aa44ed322dcea5681485333',
                api: 'mtop.taobao.pcdetail.data.get',
                v: '1.0',
                isSec: 0,
                ecode: 0,
                timeout: 10000,
                ttid: '2022@taobao_litepc_9.17.0',
                AntiFlood: true,
                AntiCreep: true,
                dataType: 'json',
                valueType: 'string',
                preventFallback: true,
                type: 'json',
                data: {
                    id: '712767031587',
                    detail_v: '3.3.2',
                    exParams: '{"_u":"m20bhahd1d9818","id":"712767031587","spm":"a1z09.2.0.0.753f2e8dRe00I1","queryParams":"_u=m20bhahd1d9818&id=712767031587&spm=a1z09.2.0.0.753f2e8dRe00I1","domain":"https://item.taobao.com","path_name":"/item.htm"}'
                }
            };

            const queryString = Object.entries(params)
                .map(([key, value]) => {
                    if (key === 'data') {
                        // If the key is 'data', stringify the value
                        value = JSON.stringify(value);
                    }
                    return `${key}=${encodeURIComponent(value as any)}`;
                })
                .join("&");

            const url = `https://h5api.m.taobao.com/h5/mtop.taobao.pcdetail.data.get/1.0/?${queryString}`;

            chrome.cookies.getAll({ url: sender.origin }, (cookies) => {
                // Extract the necessary cookies from the cookies array
                const cookieString = cookies
                    .filter(cookie => cookie.name.includes('m_h5_tk'))
                    .map(cookie => `${cookie.name}=${cookie.value}`)
                    .join('; ');

                fetch(url, {
                    "headers": {
                        "accept": "application/json",
                        "cache-control": "no-cache",
                        "content-type": "application/x-www-form-urlencoded",
                        "pragma": "no-cache",
                        "Cookie": cookieString
                    },
                    "method": "GET",
                    "mode": "cors",
                    "credentials": "include"
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);
                    });
            });

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

