import { h5Encryption } from "../../shared/h5api.taobao/sign"
interface fetchOptions {
    headers: { "accept-language": string; "sec-fetch-dest": string; "sec-fetch-mode": string; "sec-fetch-site": string; "sec-gpc": string; Cookie: any; "Content-Type": string; }; referrerPolicy: string; method: string; mode: string
}
export class queryBuilder extends h5Encryption {
    cookies: any
    url_param_data: any
    params: { jsv: string; appKey: string; t: number; v: string; isSec: string; ecode: string; timeout: string; ttid: string; AntiFlood: string; AntiCreep: string; dataType: string; valueType: string; preventFallback: string; type: string; data: string; };
    h5_tk_cookies_string: any;
    fetchOptions: Object;
    constructor(cookies, url_param_data) {
        const h5_tk_token_array = cookies
            .filter(cookie => cookie.name.includes('m_h5_tk'));

        const token = h5_tk_token_array[0].value.split('_')[0];

        const params = {
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

        // Pass processed values directly to the super() call
        super(token, params.t, params.data);

        this.h5_tk_cookies_string = h5_tk_token_array
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');

        this.params = params;
        this.cookies = cookies;
        this.url_param_data = url_param_data;
        this.fetchOptions = {};
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

    fetchTaoItemPage() {

        this.params['sign'] = this.signH5ItemPageReq()
        this.params['api'] = 'mtop.taobao.pcdetail.data.get'

        return this.createFetch()
    }

    fetchTaoReviewPage() {
        this.params['jsv'] = '2.7.2'
        this.params['api'] = 'mtop.alibaba.review.list.for.new.pc.detail'
        this.params['sign'] = this.signH5ReviewReq()

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