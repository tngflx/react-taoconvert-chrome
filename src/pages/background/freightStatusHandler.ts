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

    public checkFreightStatus(options: string, expressId?: string): Promise<string | void> {
        const url = this.buildUrl(options, expressId);
        return this.fetchFreight(url);
    }
}

export class NSWEXStatusChecker extends BaseFreightStatusChecker {
    protected getBaseUrl(): string {
        return 'https://nswex.com/index.php?route=account/';
    }

    protected buildUrl(options: string, expressId?: string): string {
        switch (options) {
            case 'arrived_info':
                return this.baseUrl + 'order_product&filter_order_product_status=4';
            case 'delivery_info':
                return this.baseUrl + `order&filter_tracking_number=${expressId}`;
            case 'ontheway_info':
                return this.baseUrl + 'order_product&filter_order_product_status=3';
            default:
                throw new Error('Invalid option');
        }
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


                const linkMatch = mulu_html.match(/<a class="op-detail" href="([^"]+)"/);
                if (!linkMatch || linkMatch.length < 2) {
                    throw new Error('Link not found in HTML');
                } else {
                    const isEmpty = mulu_html.includes('mulu-empty') && mulu_html.includes('Î´²éÑ¯µ½');

                    if (isEmpty) {
                        return 'not found';
                    }
                }
                const id = linkMatch[1].match(/(\d+)$/)[1];
                const url = this.buildUrl('status', id);

                return this.fetchFreight(url);
            })
            .catch((error) => {
                console.error("MulupostStatusChecker error:", error);
            });


    }
}