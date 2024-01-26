export async function taoDownloader() {
    const all_sku_items = document.querySelectorAll('div.skuItemWrapper .skuItem')
    const h5api_data: { data: any } = await new Promise((resolve) => {

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
    const { data: { skuBase, skuCore, item, seller } } = h5api_data;

    const remapped_skubase = skuBase.skus.map(({ propPath, skuId }) => {
        const prop_path_segments = propPath.split(";");

        const product_title_segment = prop_path_segments.map((segment) => {
            // Split each segment by ":"
            const [pid, vid] = segment.split(":").map((item) => item.trim());

            // Find corresponding names for pid and vid in props
            const prop = skuBase.props.find((p) => p.pid === pid);

            const sku2info: Sku2Info = skuCore.sku2info;
            const { price, quantity } = Object.entries(sku2info).find(([key]) => key === skuId)?.[1]

            if (prop) {
                const value = prop.values.find((v) => v.vid === vid);
                if (value) {
                    const preprocess_res = {
                        name_segment: value.name,
                        price_text: price?.priceText,
                        quantity
                    }

                    return value?.image ? { image: value.image, ...preprocess_res } : preprocess_res

                }
            }
        }).reduce((acc, { name_segment, image, price_text, quantity }) => {
            acc.product_name.push(name_segment)
            if (image)
                acc.product_image_link = image
            acc.product_price = price_text
            acc.product_avail_quantity= quantity
            return acc
        }, { product_name: [], product_image_link: '', product_price: '', product_avail_quantity: '' })

        return { ...product_title_segment, skuId }
    })
    console.log(remapped_skubase)
    all_sku_items.forEach(sku_item => {
        const product_title = sku_item.querySelector("div[title]")?.textContent
        const product_image = sku_item.querySelector('img[class="skuIcon"]').getAttribute("src")

    })
}