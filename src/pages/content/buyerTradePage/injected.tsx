import { render } from 'react-dom';
import { MutationObserverManager, DOMTools } from '../utils/misc';
import { ButtonComponent } from '../components/buyerTradeButton';
const { findParentElbyClassName, findMultipleParentElbyClassName } = new DOMTools

const port = chrome.runtime.connect({ name: 'content-script' });

const createButtonAndAppend = (element, onClickHandler) => {
    const button_wrapper = document.createElement('div');

    const handle_click = () => onClickHandler(element);
    render(<ButtonComponent onClick={handle_click} />, button_wrapper);
    element.appendChild(button_wrapper);
};

const handleButtonClick = async (element) => {
    const bottom_row_buyertrade_wrapper_el = findParentElbyClassName(element, 'sol-mod__no-br', 'td');

    // buyer trade page column 1 2 3
    const columns = Array.from(bottom_row_buyertrade_wrapper_el.parentNode.children).filter(child => child.nodeType === 1);

    const product_main_title = columns[0].querySelectorAll("div[style^='margin-left'] a span")?.[2]?.textContent
    const product_selected_title = columns[0].querySelectorAll("span[class^='production-mod__sku-item'] span")?.[2]?.textContent

    const product_image_url = 'https:' + columns[0].querySelector("a[class^='production-mod__pic'] img")?.getAttribute('src')

    const product_web_link = 'https:' + columns[0].querySelector("div[style^='margin-left'] a")?.getAttribute('href');
    const bought_quantity = columns[2].querySelector("p")?.textContent

    const price_mod_el = findParentElbyClassName(columns[4], "price-mod__price")
    const bought_price = price_mod_el.querySelectorAll('strong span')?.[1]?.textContent

    const upper_row_buyertrade_wrapper_el = findParentElbyClassName(element, 'bought-wrapper-mod__head-info-cell')
    const orderId = upper_row_buyertrade_wrapper_el.querySelectorAll("span[data-reactid]")?.[5]?.textContent

    let db_data = { product_main_title, product_selected_title, bought_price, bought_quantity, product_web_link, product_image_url, orderId }

    console.log(db_data)
    await chrome.runtime.sendMessage({ action: "get_tracking_code", orderId }, resp => {
        db_data["tracking_info"] = resp
        port.postMessage({ msg_action: 'save_db', ...db_data })
    })

}

export async function injectTaoSaveListings() {
    if (location.href.includes("https://buyertrade.taobao.com/")) {
        let buyerTradeHeaderToObserve = 'tbody[class*="bought-wrapper-mod__head"]';
        let buyerTradeDivToObserve = 'td[class*="bought-wrapper-mod__thead-operations-containe"]'

        //let buyerTradeWrapper = new MutationObserverManager();
        //buyerTradeWrapper.config = { mode: 'addedNode', mutatedTargetChildNode: buyerTradeDivToObserve, mutatedTargetParentNode: buyerTradeHeaderToObserve, subtree: false };
        //buyerTradeWrapper.startObserver(injectBuyerTradePage);

        let bought_wrapper_elements = document.querySelectorAll(buyerTradeDivToObserve)

        for (let bought_wrapper_element of bought_wrapper_elements as NodeListOf<HTMLElement>) {
            createButtonAndAppend(bought_wrapper_element, handleButtonClick);

        }

    }
}

injectTaoSaveListings()