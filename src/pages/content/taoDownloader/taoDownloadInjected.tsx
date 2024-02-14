import useStorage from "../../../shared/hooks/useStorage";
import dataStore from "../../../shared/storages/reviewItemSkuBase";
import { DOMTools, MutationObserverManager } from "../utils/misc";
import { processReviewTab } from "./reviewTabInjected";
const mutObserverManager = new MutationObserverManager();

export async function taoDownloader() {
    const all_sku_items = document.querySelectorAll('div.skuItemWrapper .skuItem')

    let { href: currentURL, origin: domain, search: queryString, pathname } = window.location
    const queryParams = new URLSearchParams(queryString);
    queryString = queryString.substring(1)

    /**
     * All these complexity for api call on taobao!
     * Extracting all query paramters from item.taobao.com/item.htm? url
     */
    const arrayParamKeys = Array.from(queryParams.keys());

    // Fix weird urlsearchparam bug where first key is the whole url itself
    let exParams: { id?: string } = {};
    arrayParamKeys.forEach((key) => {
        exParams[key] = queryParams.get(key);
    });

    const h5api_data: { data: any } = await new Promise((resolve) => {

        // Construct JSON object
        let url_param_data = {
            "id": queryParams.get("id"),
            "detail_v": "3.3.2",
            "exParams": JSON.stringify({
                ...exParams,
                queryString,
                domain,
                path_name: pathname
            })
        };

        //resolve({ data: 'ds' })
        chrome.runtime.sendMessage({ msg_action: 'get_itempage_products', url_param_data }, h5api_data => {
            resolve(h5api_data)
        })

    })

    const { data: { skuBase, skuCore, item, seller } } = h5api_data;

    const remapped_skubase = skuBase.skus.map(({ propPath, skuId }) => {
        const prop_path_segments = propPath.split(";");

        const all_product_props = prop_path_segments.map((segment) => {
            // Split each segment by ":"
            const [pid, vid] = segment.split(":").map((item) => item.trim());

            // Find corresponding names for pid and vid in props
            const prop = skuBase.props.find((p) => p.pid === pid);

            const sku2info: Sku2Info = skuCore.sku2info;
            const { price, quantity } = Object.entries(sku2info).find(([key]) => key === skuId)?.[1]

            if (prop) {
                const value = prop.values.find((v) => v.vid === vid);
                if (value) {
                    const preprocess_sku = {
                        name_segment: value.name,
                        price_text: price?.priceText,
                        quantity
                    }

                    return value?.image ? { image: value.image, ...preprocess_sku } : preprocess_sku

                }
            }
        }).reduce((acc, { name_segment, image, price_text, quantity }) => {
            acc.product_name.push(name_segment)
            if (image)
                acc.product_image_link = image
            acc.product_price = price_text
            acc.product_avail_quantity = quantity
            return acc
        }, { product_name: [], product_image_link: '', product_price: '', product_avail_quantity: '' })

        return { ...all_product_props, skuId }
    })

    all_sku_items.forEach(sku_item => {
        const product_title = sku_item.querySelector("div[title]")?.textContent
        const product_image = sku_item.querySelector('img[class="skuIcon"]')?.getAttribute("src")

    })

    const remapped_review_data = await processReviewTab()

    await dataStore.updateRemappedSkuBase(remapped_skubase)
    await dataStore.updateRemappedReviewData(remapped_review_data)

}
