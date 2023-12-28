import { MutationObserverManager } from "./utils/misc";

export async function injectTaoSaveListings() {
    if (location.href.includes("https://buyertrade.taobao.com/")) {
        let buyerTradeHeaderToObserve = 'tbody[class*="bought-wrapper-mod__head"]';
        let buyerTradeDivToObserve = 'td[class*="bought-wrapper-mod__thead-operations-containe"]'

        window.onload = (event) => {
            let buyerTradeWrapper = new MutationObserverManager();
            buyerTradeWrapper.config = { mode: 'addedNode', mutatedTargetChildNode: buyerTradeDivToObserve, mutatedTargetParentNode: buyerTradeHeaderToObserve, subtree: false };
            buyerTradeWrapper.startObserver(buyerTradeDivToObserve);

            injectBuyerTradePage();
        };

        async function injectBuyerTradePage() {
            let bought_wrapper_elements = document.querySelectorAll(buyerTradeDivToObserve)

            for (let bought_wrapper_element of bought_wrapper_elements as NodeListOf<HTMLElement>) {
                console.log(bought_wrapper_element)
            //    bought_wrapper_element.appendChild()
            }
        }
    }
}

function createButton() {

    let button_wrapper = `<div>`
}

injectTaoSaveListings()