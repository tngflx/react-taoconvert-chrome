import { render } from "react-dom";
import ButtonRenderer from "../components/renderer/taoButtonRenderer";
import { DOMTools, MutationObserverManager } from "../utils/misc";
import RadixRenderer from "../components/renderer/radixUIRenderer";
import DropDownImageDownload from "../components/radixUI";
const mutObserverManager = new MutationObserverManager();

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
        let url_param_data = {
            "id": urlParams.get("id"),
            "detail_v": "3.3.2",
            "exParams": JSON.stringify({
                ...exParams,
                queryParams,
                domain,
                path_name: pathname
            })
        };

        resolve({ data: 'ds' })
        //chrome.runtime.sendMessage({ msg_action: 'get_itempage_products', url_param_data }, h5api_data => {
        //    resolve(h5api_data)
        //})

    })
    //const { data: { skuBase, skuCore, item, seller } } = h5api_data;

    //const remapped_skubase = skuBase.skus.map(({ propPath, skuId }) => {
    //    const prop_path_segments = propPath.split(";");

    //    const all_product_props = prop_path_segments.map((segment) => {
    //        // Split each segment by ":"
    //        const [pid, vid] = segment.split(":").map((item) => item.trim());

    //        // Find corresponding names for pid and vid in props
    //        const prop = skuBase.props.find((p) => p.pid === pid);

    //        const sku2info: Sku2Info = skuCore.sku2info;
    //        const { price, quantity } = Object.entries(sku2info).find(([key]) => key === skuId)?.[1]

    //        if (prop) {
    //            const value = prop.values.find((v) => v.vid === vid);
    //            if (value) {
    //                const preprocess_sku = {
    //                    name_segment: value.name,
    //                    price_text: price?.priceText,
    //                    quantity
    //                }

    //                return value?.image ? { image: value.image, ...preprocess_sku } : preprocess_sku

    //            }
    //        }
    //    }).reduce((acc, { name_segment, image, price_text, quantity }) => {
    //        acc.product_name.push(name_segment)
    //        if (image)
    //            acc.product_image_link = image
    //        acc.product_price = price_text
    //        acc.product_avail_quantity = quantity
    //        return acc
    //    }, { product_name: [], product_image_link: '', product_price: '', product_avail_quantity: '' })

    //    return { ...all_product_props, skuId }
    //})



    all_sku_items.forEach(sku_item => {
        const product_title = sku_item.querySelector("div[title]")?.textContent
        const product_image = sku_item.querySelector('img[class="skuIcon"]')?.getAttribute("src")

    })

    reviewTabScrape()
}

function reviewTabScrape() {
    let commentTabToObserve = 'div[class^="Tabs--root"] [class^="Tabs--container"]';

    const review_tab_container = document.querySelector(commentTabToObserve)
    const review_with_pic_orvid = review_tab_container.querySelectorAll('div[class^="Comments--tagList"] button.detail-btn')[1] as HTMLElement
    const tabs_header_el = document.querySelectorAll('div[class^="Tabs--header"] [class^="Tabs--title"]')[1] as HTMLElement
    tabs_header_el.click()
    review_with_pic_orvid.click()


    mutObserverManager.config = { mode: 'addedNode', mutTargetChildName: 'Comment--album', domLoadedSourceParentNode: commentTabToObserve, subtree: true }
    mutObserverManager.startObserver(() => {
        const comment_album_els = review_tab_container.querySelectorAll('div[class^="Comment--album"]')
        Array.from(comment_album_els).forEach(photo => {
            createImagePlusButton(photo)
        })
    })
}

function createImagePlusButton(comment_album_el) {
    const button_container = document.createElement('div');
    button_container.classList.add('tao_convert_button');

    comment_album_el.insertAdjacentElement('beforebegin', button_container)

    render(
        <RadixRenderer shadowRootContainer={button_container}>
            <DropDownImageDownload />
        </RadixRenderer>,
        button_container
    );
}