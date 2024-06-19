import { rejects } from "assert";
import { h5Encryption } from "../../shared/h5api.taobao/sign"
interface fetchOptions {
    headers: { "accept-language": string; "sec-fetch-dest": string; "sec-fetch-mode": string; "sec-fetch-site": string; "sec-gpc": string; Cookie: any; "Content-Type": string; }; referrerPolicy: string; method: string; mode: string
}
export class queryBuilder extends h5Encryption {
    url_param_data: any
    params: { jsv: string; appKey: string; t: number; v: string; isSec: string; ecode: string; timeout: string; ttid: string; AntiFlood: string; AntiCreep: string; dataType: string; valueType: string; preventFallback: string; type: string; data: string; };
    h5_tk_cookies_string: any;
    fetchOptions: Object;
    static h5_tk_token_array: any[] = []; // Static property to share across instances

    constructor(url_param_data) {
        super();

        this.params = {
            jsv: '2.6.1',
            appKey: '12574478',
            t: (new Date).getTime(),
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
            data: JSON.stringify({ ...url_param_data }),
        };
        this.fetchOptions = {};
    }

    async setH5EncData() {
        this.h5enc_token = queryBuilder.h5_tk_token_array[0].value.split('_')[0];
        this.h5enc_time = this.params.t;
        this.h5enc_data = this.params.data;

        this.h5_tk_cookies_string = queryBuilder.h5_tk_token_array
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');
    }

    async initH5EncDataWithRetries() {

        //Hacky way to refetch m_h5_tk token by refreshing world.taobao.com
        const refreshTaobaoWorldPage = (retries): Promise<void> => {
            return new Promise((resolve) => {
                console.log('Opening temporary tab for refresh...');
                chrome.tabs.create({ url: 'https://world.taobao.com' }, (newTab) => {
                    chrome.webNavigation.onCompleted.addListener(function onCompletedListener(details) {
                        if (details.tabId === newTab.id) {
                            chrome.webNavigation.onCompleted.removeListener(onCompletedListener);

                            chrome.runtime.sendMessage({ msg_action: 'taoworld_login_form' }, (response) => {
                                setTimeout(() => {
                                    chrome.tabs.remove(newTab.id, () => {
                                        console.log('Temporary tab closed.');
                                        resolve();
                                    });
                                }, 3000);
                            });
                        }
                    });
                });

            });
        }

        if (queryBuilder.h5_tk_token_array && queryBuilder.h5_tk_token_array.length > 0) {

            this.setH5EncData();
            return;
        }
        const maxRetries = 3;
        let retries = maxRetries;
        do {
            try {
                const cookieStores = await chrome.cookies.getAllCookieStores();
                const cookieNames = ['_m_h5_tk', '_m_h5_tk_enc'];

                const cookiePromises = cookieStores.flatMap(cookieStore =>
                    cookieNames.map(cookieName =>
                        new Promise((resolve, reject) => {
                            chrome.cookies.get({ url: 'https://taobao.com', name: cookieName, storeId: cookieStore.id }, async cookie => {
                                if (cookie)
                                    resolve(cookie)
                                else {
                                    reject('Cookie not found from taobao.com')
                                }
                            });
                        })
                    )
                );

                queryBuilder.h5_tk_token_array = await Promise.all(cookiePromises);

                if (!queryBuilder.h5_tk_token_array || queryBuilder.h5_tk_token_array.length === 0) {
                    await refreshTaobaoWorldPage(retries);
                } else if (queryBuilder.h5_tk_token_array && queryBuilder.h5_tk_token_array.length > 0) {
                    // Directly set h5Encryption required properties
                    this.setH5EncData();
                }

            } catch (error) {
                console.error("Error retrieving cookies:", error);

                // Remove cookies
                await new Promise((resolve, reject) => {
                    chrome.cookies.getAll({ url: 'https://taobao.com' }, function (cookies) {
                        cookies.forEach(cookie => {
                            chrome.cookies.remove({ url: "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path, name: cookie.name }, details => {
                                console.log('Cookie removed:', details);
                                resolve(details)
                            });
                        });
                    });
                });

                // Refresh page
                await refreshTaobaoWorldPage(retries);

                queryBuilder.h5_tk_token_array = null;
            }

            retries--;
        } while (retries > 0 && (!queryBuilder.h5_tk_token_array || queryBuilder.h5_tk_token_array.length === 0))


        if (queryBuilder.h5_tk_token_array === null || queryBuilder.h5_tk_token_array.length === 0) {
            throw new Error(`Failed to retrieve cookies after ${maxRetries} attempts.`);
        }

    }

    createFetch() {
        const queryString = this.processQueryString()

        const url = `https://h5api.m.taobao.com/h5/${this.params['api']}/1.0/?${queryString}`;
        this.fetchOptions = {
            headers: {
                "accept-language": "en;q=0.5",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "sec-gpc": "1",
                "Cookie": this.h5_tk_cookies_string,
                "Content-Type": "application/json",
            },
            referrerPolicy: "strict-origin-when-cross-origin",
            method: "GET",
            mode: "cors"
        } as fetchOptions

        return fetch(url, this.fetchOptions)
            .then(response => response.json())
            .then(data => data)
            .catch(err => {
                throw Error('h5api.taobao is not working well :(')
            })
    }

    async fetchTaoItemPage() {
        await this.initH5EncDataWithRetries()

        this.params['sign'] = this.signH5ItemPageReq()
        this.params['api'] = 'mtop.taobao.pcdetail.data.get'

        return this.createFetch()
    }

    async fetchTaoReviewPage() {
        await this.initH5EncDataWithRetries()

        this.params['jsv'] = '2.7.2'
        this.params['api'] = 'mtop.alibaba.review.list.for.new.pc.detail'
        this.params['sign'] = this.signH5ReviewReq()

        return this.createFetch()

    }

    async fetchMoreItemDetails() {
        await this.initH5EncDataWithRetries()

        this.params['jsv'] = '2.7'
        this.params['api'] = "mtop.taobao.query.detail"
        this.params['sign'] = this.signH5ItemPageReq()

        return this.createFetch()
    }

    processQueryString() {
        const order = ['jsv', 'appKey', 't', 'sign', 'api', 'v', 'isSec', 'ecode', 'timeout', 'ttid', 'AntiFlood', 'AntiCreep', 'dataType', 'valueType', 'preventFallback', 'type', 'data'];
        const reorderedParams = Object.fromEntries(order.map(key => [key, this.params[key]]));

        return Object.entries(reorderedParams)
            .map(([key, value]) => {
                return `${key}=${encodeURIComponent(value as any)}`;
            })
            .join("&");
    }
}