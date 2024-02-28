﻿import dataStore, { loadState } from "../../../shared/storages/reviewItemSkuBase";
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
        /**
        * example of json data returned by h5api
        * "skuBase.skus": [
                {
                    "propPath": "1627207:30146346867;20122:368194910;20105:103646",
                    "skuId": "5311150259765"
        * where the first segment 1627207:30146346867, refer to main product title
        * 20122:368194910;20105:103646 variation of product
        * ----------------------------------------------------------------------------------
        * "skuBase.props": [
                {
                    "hasImage": "true",
                    "name": "颜色分类",
                    "nameDesc": "（24）",
                    "pid": "1627207",
                    "values": [
                        {
                            "image": "https://gw.alicdn.com/bao/uploaded/i4/3372205069/O1CN01wTKOK81nJeZ6el0k7_!!3372205069.jpg",
                            "name": "幻14白-R9-5900HS/RTX3060/2K/120Hz/14英寸（质保6个月）",
                            "sortOrder": "0",
                            "vid": "30146346867"
        *----------------------------------------------------------------------------------------
        *  "skuCore.sku2info": {
        *    "5311150259765": {
                    "logisticsTime": "48小时内发货",
                    "moreQuantity": "false",
                    "price": {
                        "priceActionText": "前往手淘查看更多优惠",
                        "priceActionType": "buy_in_mobile",
                        "priceMoney": "539900",
                        "priceText": "5399"
                    },
                    "quantity": "0",
                    "quantityText": "无货"
                },
        */
        const { data: { skuBase, skuCore } } = h5api_data.value as { data: any };

        const groupedByMainProductTitle = skuBase.skus.reduce((groupedMap, { propPath, skuId }) => {
            const prop_path_segments = propPath.split(";");
            const [main_product_pid, main_product_vid] = prop_path_segments[0].split(":").map(i => i.trim())
            const main_product_title = skuBase.props.find((p) => p.pid === main_product_pid)?.values?.find((v) => v.vid === main_product_vid)?.name

            if (!groupedMap.has(main_product_title)) {
                groupedMap.set(main_product_title, []);
            }

            const all_product_props = prop_path_segments.slice(1).map((segment) => {
                const [pid, vid] = segment.split(":").map((item) => item.trim());
                const prop = skuBase.props.find((p) => p.pid === pid);

                const sku2info: Sku2Info = skuCore.sku2info;
                const { price, quantity } = sku2info[skuId] || { price: {}, quantity: '' };

                if (prop) {
                    const value = prop.values.find((v) => v.vid === vid);
                    if (value) {
                        const preprocess_sku = {
                            product_variation: value.name,
                            product_price: price?.priceText,
                            quantity
                        };

                        return value.image ? { image: value.image, ...preprocess_sku } : preprocess_sku;
                    }
                }
            }).reduce((acc, { product_variation, image, product_price, quantity }) => {
                acc.product_variation.push(product_variation);
                if (image) acc.product_image_link = image;
                acc.product_price = product_price;
                acc.product_avail_quantity = quantity;
                return acc;
            }, { product_variation: [], product_image_link: '', product_price: '', product_avail_quantity: '' });

            groupedMap.get(main_product_title).push({ ...all_product_props, skuId });
            return groupedMap;

        }, new Map<string, any[]>());

        // Update the data store with the grouped information
        await dataStore.updateRemappedSkuBase(groupedByMainProductTitle);
    } else {
        throw new Error('remapped_sku_base failed!');
    }


    if (remapped_review_data.status == 'fulfilled') {
        await dataStore.updateRemappedReviewData(remapped_review_data.value as any)
    } else {
        throw Error('remapped_review_data failed!')
    }

    all_sku_items.forEach(sku_item => {
        const product_title = sku_item.querySelector("div[title]")?.textContent
        const product_image = sku_item.querySelector('img[class="skuIcon"]')?.getAttribute("src")

    })


    await loadState.setLoad(false)
}
