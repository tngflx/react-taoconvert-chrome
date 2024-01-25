export async function taoDownloader() {
    const all_sku_items = document.querySelectorAll('div.skuItemWrapper .skuItem')
    const h5api_data = await new Promise((resolve) => {

        let { href: currentURL, origin: domain, search: queryParams, pathname } = window.location
        const urlParams = new URLSearchParams(queryParams);
        queryParams = queryParams.substring(1)

        /**
         * All these complexity for api call on taobao!
         * Extracting all query paramters from item.taobao.com/item.htm? url
         */
        const arrayParamKeys = Array.from(urlParams.keys());

        // Fix weird urlsearchparam bug where first key is the whole url itself
        let exParams = {};
        arrayParamKeys.forEach((key) => {
            exParams[key] = urlParams.get(key);
        });

        // Construct JSON object
        let data = {
            "id": urlParams.get("id"),
            "detail_v": "3.3.2",
            "exParams": JSON.stringify({
                ...exParams,
                queryParams,
                domain,
                path_name: pathname
            })
        };

        chrome.runtime.sendMessage({ action: 'get_itempage_products', data }, h5api_data => {
            resolve(h5api_data)
        })

    })
    console.log(h5api_data)

    all_sku_items.forEach(sku_item => {
        //const product_title = sku_item.querySelector(".title").textContent
        //const product_image = sku_item.querySelector('img[class="skuIcon"]').getAttribute("src")


    })
}