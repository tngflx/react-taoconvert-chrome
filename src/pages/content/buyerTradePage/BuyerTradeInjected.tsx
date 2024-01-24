import { render } from 'react-dom';
import { DOMTools } from '../utils/misc';
import BuyerTradeButtonWrapper from '../components/buyerTradeButton';
const { findChildThenParentElbyClassName, checkNodeExistsInChildEl } = new DOMTools

const port = chrome.runtime.connect({ name: 'content-script' });

const createBuyerTradeButton = (element, onClickHandler) => {
    const button_wrapper = document.createElement('div');
    button_wrapper.classList.add('tao_convert_button', 'float-left', 'inline-flex', 'mx-4');

    render(<BuyerTradeButtonWrapper onClickHandler={() => onClickHandler(element)} />, button_wrapper);
    element.appendChild(button_wrapper);
};

const handleButtonClick = (element) => {

    console.log('im clicked')


}



port.onMessage.addListener(async (resp) => {
    const { msg_action, freight_html } = resp;
    switch (msg_action) {
        case 'process_freight_html':
            const parser = new DOMParser();
            const doc = parser.parseFromString(freight_html, 'text/html');

            // freight_tracking_el is el for search result tracking code on freight
            const freight_tracking_el = doc.querySelector('.panel-default')?.nextElementSibling;
            let freight_tracking_code: string;
            let freight_web_link: string;

            const result: string | NodeListOf<Element> | (() => void) = freight_tracking_el?.tagName?.toLowerCase() === 'p'
                ? freight_tracking_el.textContent : freight_tracking_el?.className == 'table-responsive'
                    ? (() => {
                        const tbody_track_el = freight_tracking_el.querySelectorAll('tbody td')
                        freight_tracking_code = tbody_track_el[1].querySelector('.text-nowrap')?.firstChild.textContent
                        freight_web_link = tbody_track_el[1].querySelector('a.agree')?.getAttribute('href')
                        return ''
                    })() : "error"

            if (result === "You have not made any previous orders!") {
                resp.is_freight_processed = false;
            } else if (freight_tracking_code?.startsWith('MY')) {
                resp.is_freight_processed = true;
                console.log(freight_tracking_code, freight_web_link)
            }
            delete resp.freight_html;
            delete resp.msg_action;

            port.postMessage({ msg_action: 'save_db', ...resp })
            break;
        default:
    }
});


(async () => {
    if (location.href.includes("https://buyertrade.taobao.com/")) {
        const buyerTradeHeaderToObserve = 'tbody[class*="bought-wrapper-mod__head"]';
        const buyerTradeDivToObserve = 'td[class*="bought-wrapper-mod__thead-operations-containe"]'

        //let buyerTradeWrapper = new MutationObserverManager();
        //buyerTradeWrapper.config = { mode: 'addedNode', mutatedTargetChildNode: buyerTradeDivToObserve, mutatedTargetParentNode: buyerTradeHeaderToObserve, subtree: false };
        //buyerTradeWrapper.startObserver(injectBuyerTradePage);

        const bought_wrapper_elements = Array.from(document.querySelectorAll(buyerTradeDivToObserve))

        for (const bought_wrapper_element of bought_wrapper_elements.slice(0, 15) as Element[]) {
            const bottom_row_buyertrade_wrapper_el = findChildThenParentElbyClassName(bought_wrapper_element, 'sol-mod__no-br', 'td');

            // buyer trade page column 1 2 3
            const columns = Array.from(bottom_row_buyertrade_wrapper_el.parentNode.children).filter(child => child.nodeType === 1);
            const is_tracking_el_exists = checkNodeExistsInChildEl(columns[5], 'viewLogistic')

            const product_main_title = columns[0].querySelectorAll("div[style^='margin-left'] a span")?.[2]?.textContent
            const product_selected_title = columns[0].querySelectorAll("span[class^='production-mod__sku-item'] span")?.[2]?.textContent

            const product_image_url = 'https:' + columns[0].querySelector("a[class^='production-mod__pic'] img")?.getAttribute('src')

            const product_web_link = 'https:' + columns[0].querySelector("div[style^='margin-left'] a")?.getAttribute('href');
            const bought_quantity = columns[2].querySelector("p")?.textContent

            const price_mod_el = findChildThenParentElbyClassName(columns[4], "price-mod__price")
            const bought_price = price_mod_el.querySelectorAll('strong span')?.[1]?.textContent

            const upper_row_buyertrade_wrapper_el = findChildThenParentElbyClassName(bought_wrapper_element, 'bought-wrapper-mod__head-info-cell')
            const orderId = upper_row_buyertrade_wrapper_el.querySelectorAll("span[data-reactid]")?.[5]?.textContent
            const product_create_time = upper_row_buyertrade_wrapper_el.querySelector("span[class^='bought-wrapper-mod__create-time']")?.textContent

            if (is_tracking_el_exists) {
                createBuyerTradeButton(bought_wrapper_element, handleButtonClick)

                const tracking_info = await new Promise<TrackingInfo>((resolve) => {
                    chrome.runtime.sendMessage({ action: "get_tracking_code", orderId }, (tracking_info) => {
                        resolve(tracking_info);
                    });
                });

                const db_data = {
                    orderId,
                    product_main_title,
                    product_selected_title,
                    bought_price,
                    bought_quantity,
                    product_web_link,
                    product_image_url,
                    product_create_time,
                    tracking_info
                }

                port.postMessage({ msg_action: 'is_freight_processed', ...db_data })

            }

        }



    }

})()

interface TrackingInfo {
    expressId: string;
    expressName: string;
    // Add other properties if necessary
}