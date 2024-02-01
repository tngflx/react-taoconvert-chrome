import { render } from 'react-dom';
import { DOMTools } from '../utils/misc';
import ButtonRenderer from '../components/renderer/taoButtonRenderer';
const { findChildThenParentElbyClassName, checkNodeExistsInChildEl } = new DOMTools

const port = chrome.runtime.connect({ name: 'content-script' });

const createBuyerTradeButton = (bought_threadop_wrapper_el, onClickHandler) => {
    const button_container = document.createElement('div');
    button_container.classList.add('tao_convert_button');

    bought_threadop_wrapper_el.insertAdjacentElement('afterbegin', button_container)

    // Render the BuyerTradeButtonWrapper component and pass the button_wrapper as a prop
    render(
        <ButtonRenderer
            onClickHandler={onClickHandler}
            containerElement={button_container}
            buttonWrapperClasses="float-left inline-flex mx-4"
            buttonName="taoImport"
        />,
        button_container
    );
};

const handleButtonClick = () => {

    console.log('im clicked')

}



port.onMessage.addListener(async (resp) => {
    const { msg_action, freight_html } = resp;
    switch (msg_action) {
        case 'process_freight_html':
            const parser = new DOMParser();
            const doc = parser.parseFromString(freight_html, 'text/html');

            // freight_tracking_el is el for search result tracking code on freight
            const nswex_search_result_el = doc.querySelector('.panel-default')?.nextElementSibling;
            let freight_delivery_status: string;
            /**
             * TODO : 
             * 1) use freight_tracking_code to check when arrival
             * 2) 
             */
            const text_search_result_el = nswex_search_result_el?.tagName?.toLowerCase() === 'p'
                ? nswex_search_result_el.textContent : null

            const table_search_result_columns_els: Element[] = Array.from(nswex_search_result_el.querySelectorAll('table.table-bordered tbody td'))

            if (table_search_result_columns_els.length > 0) {
                const freightProps = {
                    tracking_code: table_search_result_columns_els[1].querySelector('.text-nowrap')?.firstChild.textContent,
                    delivery_status_tracklink: table_search_result_columns_els[1].querySelector('a.agree')?.getAttribute('href'),
                    date_added: table_search_result_columns_els[3].textContent,
                    total_weight: table_search_result_columns_els[6].textContent,
                    total_price: table_search_result_columns_els[8].textContent,
                    delivery_status: table_search_result_columns_els[7].querySelector('span.order_status')?.textContent ||
                        table_search_result_columns_els[7].querySelector('span#order_product_status')?.textContent
                };
                freight_delivery_status = freightProps.delivery_status

                resp.freight_delivery_data = Object.fromEntries(
                    (Object.entries(freightProps) as [string, string][])
                        // Trimming and replace newline
                        .map(([key, value]) => [key, typeof (value) === 'string' ? value.trim().replace(/\n/g, '') : null])
                        // Filter out undefined/null/empty value
                        .filter(([, value]) => value && value !== '')
                ) as { [key: string]: string };

            }

            if (text_search_result_el === "You have not made any previous orders!") {
                resp.freight_delivery_data = Object.assign({}, resp.freight_delivery_data, { delivery_status: "none" });
            }

            // postMessage persist message on each call, need manual cleaning
            delete resp.freight_html;
            delete resp.msg_action; // Fixes bug where previous msg_action obj stuck with a new chromeapi postmessage call

            port.postMessage({ msg_action: 'save_db', ...resp })
            break;
        default:
    }
});


(async () => {
    if (location.href.includes("https://buyertrade.taobao.com/")) {
        const buyerTradeDivToObserve = 'td[class*="bought-wrapper-mod__thead-operations-container"]'

        // This is rightmost wrapper for flag, delete / threadoperations list on buyertrade page
        const bought_threadop_wrapper_els = Array.from(document.querySelectorAll(buyerTradeDivToObserve))

        for (const bought_threadop_wrapper_el of bought_threadop_wrapper_els.slice(0, 15) as Element[]) {

            // Need to do this as there's no className or Id or even attrib to capture the wrapper
            // Do not use querySelector as it will only find children and not ancestor
            const bottom_row_buyertrade_wrapper_el = findChildThenParentElbyClassName(bought_threadop_wrapper_el, 'sol-mod__no-br', 'td');

            // buyer trade lists column 1 2 3
            const columns = Array.from(bottom_row_buyertrade_wrapper_el.parentNode.children).filter(child => child.nodeType === 1);
            const is_tracking_el_exists = columns[5].querySelector('#viewLogistic')

            const product_main_title = columns[0].querySelectorAll("div[style^='margin-left'] a span")?.[2]?.textContent
            const selected_product_variant = columns[0].querySelectorAll("span[class^='production-mod__sku-item'] span")?.[2]?.textContent

            const product_image_url = 'https:' + columns[0].querySelector("a[class^='production-mod__pic'] img")?.getAttribute('src')

            const product_web_link = 'https:' + columns[0].querySelector("div[style^='margin-left'] a")?.getAttribute('href');
            const bought_quantity = columns[2].querySelector("p")?.textContent

            const price_mod_el = findChildThenParentElbyClassName(columns[4], "price-mod__price")
            const bought_price = price_mod_el.querySelectorAll('strong span')?.[1]?.textContent

            const upper_row_buyertrade_wrapper_el = findChildThenParentElbyClassName(bought_threadop_wrapper_el, 'bought-wrapper-mod__head-info-cell')
            const orderId = upper_row_buyertrade_wrapper_el.querySelectorAll("span[data-reactid]")?.[5]?.textContent
            const product_create_date = upper_row_buyertrade_wrapper_el.querySelector("span[class^='bought-wrapper-mod__create-time']")?.textContent

            if (is_tracking_el_exists) {
                const tracking_info = await new Promise<TrackingInfo>((resolve) => {
                    chrome.runtime.sendMessage({ action: "get_tracking_code", orderId }, (tracking_info) => {
                        resolve(tracking_info);
                    });
                });

                if (!tracking_info) continue;

                createBuyerTradeButton(bought_threadop_wrapper_el as HTMLElement, handleButtonClick)

                const db_data: BuyerTradeData = {
                    orderId,
                    product_main_title,
                    selected_product_variant,
                    bought_price,
                    bought_quantity,
                    product_web_link,
                    product_image_url,
                    product_create_date,
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