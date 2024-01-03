import { render } from 'react-dom';
import { MutationObserverManager, DOMTools } from '../utils/misc';
import { ButtonComponent } from './app';
const { findParentElbyClassName, findMultipleParentElbyClassName } = new DOMTools

const createButtonAndAppend = (element, onClickHandler) => {
    const button_wrapper = document.createElement('div');

    const handle_click = () => onClickHandler(element);
    render(<ButtonComponent onClick={handle_click} />, button_wrapper);
    element.appendChild(button_wrapper);
};

const handleButtonClick = (element) => {
    const sol_mod_wrapper_el = findParentElbyClassName(element, 'sol-mod__no-br', 'td');
    const siblings = Array.from(sol_mod_wrapper_el.parentNode.children).filter(child => child.nodeType === 1);
    const product_title = siblings[0].querySelectorAll("div[style^='margin-left'] a span")?.[2]?.textContent

    const price_mod_el = findParentElbyClassName(siblings[4], "price-mod__price")
    const bought_price = price_mod_el.querySelectorAll('strong span')?.[1]?.textContent
    console.log(bought_price, product_title)
};
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