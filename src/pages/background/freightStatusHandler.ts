import { DOMStringTools } from "../content/utils/misc";

abstract class BaseFreightStatusChecker {
    protected baseUrl: string;

    constructor() {
        this.baseUrl = this.getBaseUrl();
    }

    protected abstract getBaseUrl(): string;

    protected abstract buildUrl(options: string, expressId?: string): string;

    protected fetchFreight(url: string): Promise<string | void> {
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
                console.error("Fetch error:", error);
            });
    }
}

export enum NswexFreightStatusType {
    ARRIVED_INFO = 'arrived_info',
    DELIVERY_INFO = 'delivery_info',
    ON_THE_WAY_INFO = 'ontheway_info',
    REDIVE_INFO = 'refetch_info'
}

const typeUrlMapping: Record<NswexFreightStatusType, string> = {
    [NswexFreightStatusType.ARRIVED_INFO]: 'order_product&filter_order_product_status=4',
    [NswexFreightStatusType.DELIVERY_INFO]: 'order&filter_tracking_number=',
    [NswexFreightStatusType.ON_THE_WAY_INFO]: 'order_product&filter_order_product_status=3',
    [NswexFreightStatusType.REDIVE_INFO]: 'order/info&order_id='
};
export class NswexStatusChecker extends BaseFreightStatusChecker {
    protected getBaseUrl(): string {
        return 'https://nswex.com/index.php?route=account/';
    }

    protected buildUrl(type: NswexFreightStatusType, express_id?: string, nswex_order_id?: string) {
        const suffix = typeUrlMapping[type];
        if (suffix === undefined) {
            throw new Error('Invalid option');
        }

        switch (type) {
            case NswexFreightStatusType.DELIVERY_INFO:
                if (!express_id) {
                    throw new Error('Express ID is required for delivery info');
                }
                return this.baseUrl + suffix + express_id;
            case NswexFreightStatusType.REDIVE_INFO:
                if (!nswex_order_id) {
                    throw new Error('Order ID is required for refetch info');
                }
                return this.baseUrl + suffix + nswex_order_id;
            default:
                return this.baseUrl + suffix;
        }
    }

    public checkStatus(options: { type: NswexFreightStatusType, express_id?: string, nswex_order_id?: string }): Promise<string | void> {
        const { express_id, nswex_order_id, type } = options;
        const url = this.buildUrl(type, express_id, nswex_order_id);
        return this.fetchFreight(url);
    }
}

export class MulupostStatusChecker extends BaseFreightStatusChecker {
    protected getBaseUrl(): string {
        return 'https://www.mulupost.com/my/shipment/';
    }

    protected buildUrl(options: 'search' | 'status', expressId?: string): string {
        switch (options) {
            case 'search':
                return this.baseUrl + "search?mysearch=" + expressId;
            case 'status':
                return this.baseUrl + expressId
            default:
                throw new Error('Invalid option');
        }
    }

    public checkStatus(options, expressId?: string): any {
        const url = this.buildUrl(options, expressId);

        return this.fetchFreight(url)
            .then((mulu_html: string) => {

                const mulu_empty_el = DOMStringTools.checkBothClassExists(mulu_html, 'mulu-empty', 'mulu-empty-text');
                const tcode_link_el = DOMStringTools.checkClassExistsAndGetHref(mulu_html, 'op-detail');

                if (mulu_empty_el) {
                    return 'order_not_added';
                } else if (!tcode_link_el) {
                    throw new Error('Link not found in HTML');
                }

                const id = tcode_link_el.match(/(\d+)$/)[1];
                const url = this.buildUrl('status', id);

                return this.fetchFreight(url);
            })
            .catch((error) => {
                console.error("MulupostStatusChecker error:", error);
            });


    }
}