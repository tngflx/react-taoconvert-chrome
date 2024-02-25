import dataStore, { loadState } from "../../../shared/storages/reviewItemSkuBase";
import { DOMTools, MutationObserverManager } from "../utils/misc";
import { processReviewTab } from "./reviewTabInjected";
const mutObserverManager = new MutationObserverManager();

export async function taoDownloader() {
    await loadState.setLoad(true)

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

    const [h5api_data, remapped_review_data] = await Promise.allSettled([
        new Promise((resolve) => {

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
        }),
        processReviewTab()
    ])

    if (h5api_data.status === 'fulfilled') {
        const { data: { skuBase, skuCore, item, seller } } = h5api_data.value as { data: any };

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
        await dataStore.updateRemappedSkuBase(remapped_skubase)

    } else {
        throw Error('remapped_sku_base failedd!')
    }

    if (remapped_review_data.status == 'fulfilled') {
        await dataStore.updateRemappedReviewData(remapped_review_data.value)
    } else {
        throw Error('remapped_review_data failed!')
    }

    all_sku_items.forEach(sku_item => {
        const product_title = sku_item.querySelector("div[title]")?.textContent
        const product_image = sku_item.querySelector('img[class="skuIcon"]')?.getAttribute("src")

    })


    await loadState.setLoad(false)
}
