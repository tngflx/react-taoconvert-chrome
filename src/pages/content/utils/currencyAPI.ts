export class CurrencyAPI {
        baseUrl: string;
        headers: HeadersInit
        constructor() {
            this.baseUrl = 'https://api.freecurrencyapi.com/v1/';
            this.headers = {
                apikey: "fca_live_ELSJj5SD57q5MeuvJeSqvWUjdK7jGJabegz4d5G2"
            };
        }

        call(endpoint, params = {}) {
            const paramString = new URLSearchParams({ ...params }).toString();

            return fetch(`${this.baseUrl}${endpoint}?${paramString}`, { headers: this.headers })
                .then(response => response.json())
                .then(data => data);
        }

        status() {
            return this.call('status');
        }

        currencies(params) {
            return this.call('currencies', params);
        }

        latest(params) {
            return this.call('latest', params);
        }

        historical(params) {
            return this.call('historical', params);
        }
    }