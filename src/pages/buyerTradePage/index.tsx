import React from 'react';
import ReactDOM from 'react-dom';
import { MutationObserverManager } from '../utils/misc';

const ButtonComponent = ({ onClick }) => (
    <button onClick= { onClick } > Click me</button>
);

const createButtonAndAppend = (element, onClickHandler) => {
    const buttonWrapper = document.createElement('div');
    const handleClick = () => onClickHandler(element);
    ReactDOM.render(<ButtonComponent onClick={ handleClick } />, buttonWrapper);
    element.appendChild(buttonWrapper);
};

const handleButtonClick = (element) => {
    console.log('Button clicked for element:', element);
    // Handle button click logic here
};
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
                createButtonAndAppend(bought_wrapper_element, handleButtonClick);

            }
        }
    }
}

function createButton() {

    let button_wrapper = `<div>`
}

injectTaoSaveListings()