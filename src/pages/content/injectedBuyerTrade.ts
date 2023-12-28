import { MutationObserverManager } from "./utils/misc";


export async function injectTaoSaveListings() {
    if (location.href.includes("https://buyertrade.taobao.com/")) {
        let buyerTradeHeaderToObserve = 'bought-wrapper-mod__head';
        let buyerTradeDivToObserve = 'div[class*="bought-wrapper-mod__thead-operations-containe"]'

        window.onload = (event) => {
            let buyerTradeWrapper = new MutationObserverManager();
            buyerTradeWrapper.config = { mode: 'addedNode', mutatedTargetChildNode: buyerTradeDivToObserve, mutatedTargetParentNode: buyerTradeHeaderToObserve, subtree: false };
            buyerTradeWrapper.startObserver(buyerTradeDivToObserve);

            injectBuyerTradePage();
        };

        async function injectBuyerTradePage() {
            
        }
    }
}