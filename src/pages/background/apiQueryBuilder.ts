import { h5Encryption } from "../../shared/h5api.taobao/sign"
import { TabManager } from "./helper/tabManager";
const tab_manager = new TabManager();

interface fetchOptions {
    headers: {
        "accept-language": string;
        "sec-fetch-dest": string;
        "sec-fetch-mode": string;
        "sec-fetch-site": string;
        "sec-gpc": string;
        "Content-Type": string;
    };
    referrerPolicy?: ReferrerPolicy;
    method: string;
    mode?: RequestMode;
    credentials?: RequestCredentials;
}

export class queryBuilder extends h5Encryption {
    url_param_data: any;
    params: any;
    h5_tk_cookies_string: string;
    fetchOptions: fetchOptions;
    static h5_tk_token_array: any[] = []; // Static property to share across instances
    fetchParam: {};

    constructor(url_param_data: any) {
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
        this.fetchOptions  = {
            headers: {
                "accept-language": "en-US,en;q=0.9",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "sec-gpc": "1",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "GET",
            mode: "cors"
        }
    }

    async setH5EncData() {
        const h5_tk_tokens = queryBuilder.h5_tk_token_array.reduce((tokens, cookie) => {
            const cookieName = cookie.hasOwnProperty('name') ? cookie.name : cookie[0];
            return [...tokens, { [cookieName]: cookie.value ?? cookie[1] }];
        }, []);

        this.h5enc_token = h5_tk_tokens.reduce((token: string, cookie: any) => {
            if (cookie.hasOwnProperty('_m_h5_tk')) {
                return cookie._m_h5_tk;
            }
            return token?.split('_')[0];
        }, '');

        this.h5enc_time = this.params.t;
        this.h5enc_data = this.params.data;

        this.h5_tk_cookies_string = h5_tk_tokens
            .map(cookie => `${Object.keys(cookie)[0]}=${Object.values(cookie)[0]}`)
            .join('; ');

        h5_tk_tokens.forEach(cookie => {
            chrome.cookies.set({
                url: 'https://taobao.com',
                name: Object.keys(cookie)[0],
                value: Object.values(cookie)[0] as string,
                domain: '.taobao.com',
                path: '/',
                secure: true,
                sameSite: 'no_restriction'
            });
        })

    }


    async initH5EncDataWithRetries() {
        const maxRetries = 3;

        for (let retries = maxRetries; retries > 0; retries--) {
            try {
                if (queryBuilder.h5_tk_token_array.length === 0) {
                    const cookieStores = await chrome.cookies.getAllCookieStores();
                    const cookieNames = ['_m_h5_tk', '_m_h5_tk_enc'];

                    queryBuilder.h5_tk_token_array = await Promise.all(
                        cookieStores.flatMap(cookieStore =>
                            cookieNames.map(cookieName =>
                                new Promise((resolve, reject) => {
                                    chrome.cookies.get({ url: 'https://taobao.com', name: cookieName, storeId: cookieStore.id }, cookie => {
                                        if (cookie) resolve(cookie);
                                        else reject(`Cookie ${cookieName} not found in store ${cookieStore.id}`);
                                    });
                                })
                            )
                        )
                    );
                }

                // Set H5 encryption data if cookies are available
                if (queryBuilder.h5_tk_token_array.length > 0) {
                    this.setH5EncData();
                    return;
                } else {
                    await this.refreshTaobaoWorldPage();
                }
            } catch (error) {
                console.error("Error retrieving cookies:", error);
                await this.handleCookieRetrievalError();
            }
        }

        throw new Error(`Failed to retrieve cookies after ${maxRetries} attempts.`);
    }

    async refreshTaobaoWorldPage() {
        return new Promise<void>((resolve) => {
            console.log('Opening temporary tab for refresh...');
            tab_manager.createTab('https://world.taobao.com', { msg_action: 'taoworld_login_form' }, () => {
                tab_manager.addListener((resp) => {
                    console.log('TabManager response:', resp);
                    resolve();
                });
            });
        });
    }

    async handleCookieRetrievalError() {
        await new Promise<void>((resolve, reject) => {
            chrome.storage.local.get('internal-cache-key', (data) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    queryBuilder.h5_tk_token_array = Object.entries(data?.['internal-cache-key']?.cookie) ?? [];
                    resolve();
                }
            });
        });

        // Notify user to delete cookies
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png', // Path to the icon
            title: 'Delete Cookies?',
            message: 'Do you want to delete cookies from taobao.com?',
            buttons: [
                { title: 'Yes' },
                { title: 'No' }
            ],
            isClickable: false,
        }, notificationId => {
            chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
                if (notificationId === notifId) {
                    if (btnIdx === 0) { // Yes button
                        chrome.cookies.getAll({ url: 'https://taobao.com' }, function (cookies) {
                            cookies.forEach(cookie => {
                                chrome.cookies.remove({ url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`, name: cookie.name }, details => {
                                    console.log('Cookie removed:', details);
                                });
                            });
                        });
                    } else {
                        console.log('User chose not to delete cookies.');
                    }
                }
            });
        });

        await this.refreshTaobaoWorldPage();
    }

    createFetch() {
        const queryString = this.processQueryString();

        const url = `https://h5api.m.taobao.com/h5/${this.params['api']}/1.0/?${queryString}`;

        return fetch(url, this.fetchOptions)
            .then(response => response.json())
            .then(data => data)
            .catch(err => {
                throw Error('h5api.taobao is not working well :(');
            });
    }

    async fetchTaoItemPage() {
        await this.initH5EncDataWithRetries();
        this.params['sign'] = this.signH5ItemPageReq();
        this.params['api'] = 'mtop.taobao.pcdetail.data.get';
        return this.createFetch();
    }

    async fetchTaoReviewPage() {
        await this.initH5EncDataWithRetries();
        this.params['jsv'] = '2.7.2';
        this.params['api'] = 'mtop.alibaba.review.list.for.new.pc.detail';
        this.params['sign'] = this.signH5ReviewReq();
        return this.createFetch();
    }

    async fetchItemLogistics() {
        await this.initH5EncDataWithRetries();
        this.params['jsv'] = '2.7.0';
        this.params['api'] = "mtop.taobao.logistics.detailorlist.query";
        this.params['sign'] = this.signH5ItemPageReq();
        this.params['ttid'] = "#t#ip##_h5_web_default"
        return this.createFetch();
    }

    processQueryString() {
        const order = ['jsv', 'appKey', 't', 'sign', 'api', 'v', 'isSec', 'ecode', 'timeout', 'ttid', 'AntiFlood', 'AntiCreep', 'dataType', 'valueType', 'preventFallback', 'type', 'data'];
        const reorderedParams = Object.fromEntries(order.map(key => [key, this.params[key]]));

        return Object.entries(reorderedParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join("&");
    }
}
