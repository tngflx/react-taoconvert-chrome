import { render } from 'react-dom';
import { DOMTools } from '../utils/misc';
import ButtonRenderer from '../sharedComponents/renderer/taoButtonRenderer';
const { findChildThenParentElbyClassName, checkNodeExistsInChildEl } = DOMTools

const port = chrome.runtime.connect({ name: 'content-script' });

const createBuyerTradeButton = (bought_threadop_wrapper_el) => {
    const button_container = document.createElement('div');
    button_container.classList.add('tao_convert_button');

    bought_threadop_wrapper_el.insertAdjacentElement('afterbegin', button_container)

    const handleButtonClick = () => {

        console.log('im clicked')

    }

    // Render the BuyerTradeButtonWrapper component and pass the button_wrapper as a prop
    render(
        <ButtonRenderer
            onClickHandler={handleButtonClick}
            containerElement={button_container}
            buttonWrapperClasses="float-left inline-flex mx-4"
            buttonName="taoImport"
            buttonTwindClasses="taoconv_button bg-green-500 hover:bg-green-300 text-black font-bold py-2 px-3 rounded items-center"
        />,
        button_container
    );
};


port.onMessage.addListener(async (resp) => {
    const { msg_action, db_data, freight_html, freight_otw_arrive_data } = resp;
    const { buyertrade_tracking_info } = db_data
    const parser = new DOMParser();

    switch (msg_action) {
        case 'process_mulupost_freight_html': {
            const mulu_doc = parser.parseFromString(freight_html.mulu_html as string, 'text/html')
            const panel_bd_arr = Array.from(mulu_doc.querySelectorAll('.panel-bd .m-desc-item'))
            const freight_infos = panel_bd_arr.reduce((acc, item) => {
                const label = item.querySelector('.label').textContent.trim();
                const value = item.querySelector('.value').textContent.trim();
                acc.push({ label, value });

                return acc;
            }, []);

            const freightProps: { [key: string]: string } = {
                tracking_code: mulu_doc.querySelector('.relative.panel .panel-hd .text-primary').textContent,
                delivery_status_tracklink: mulu_doc.querySelector('.panel-ft a.btn-primary[href]')?.href,
                date_added: freight_infos[7].value,
            }
            switch (true) {
                case (/包裹运输中/g.test(freight_infos[7].value)):
                    freightProps["delivery_status"] = 'delivery'
                    break;
                case (/运输完成/g.test(freight_infos[7].value)):
                    freightProps["delivery_status"] = 'completed'
                    break;
                case (/签收入库/g.test(freight_infos[7].value)):
                    freightProps["delivery_status"] = 'arrived'
                    break;
                case (/发货运输/g.test(freight_infos[7].value)):
                    freightProps["delivery_status"] = 'on the way'
                    break;
                default:
            }

            port.postMessage({ msg_action: 'save_db', db_data })

            break;
        }
        case 'process_nswex_freight_html': {
            const { delivery_html, ontheway_html, arrived_html } = Object.entries(freight_html).reduce((acc, [key, values]) =>
                (acc[key] = parser.parseFromString(values as string, 'text/html'), acc)
                , {}) as { delivery_html: Document, ontheway_html: Document, arrived_html: Document };

            /**
             * For first run just accept every parsed html
             * NOTE : ontheway_html and arrived_html had slight different from how normal delivery_html shows search result
             * non delivery_html have searchedtextresult as childrenof orderproductdiv
             */

            if (ontheway_html && arrived_html) {
                process_html(ontheway_html, 'ontheway');
                process_html(arrived_html, 'arrived');
            } else
                process_html(delivery_html, 'delivery')

            function process_html(html_element, source_html_name) {
                // freight_tracking_el is el for search result tracking code on freight
                const nswex_search_panel = html_element.querySelector('div[class="panel panel-default"]') as HTMLElement

                const next_sibiling = nswex_search_panel?.nextElementSibling;
                const nextnextsib_or_not_el =
                    next_sibiling?.tagName.toLowerCase() === 'div' && next_sibiling.id === 'submit_order_product'
                        ? next_sibiling.firstElementChild
                        : next_sibiling
                const text_search_result_el = nextnextsib_or_not_el?.tagName.toLowerCase() === 'p' ? nextnextsib_or_not_el?.textContent : null

                const table_search_result_columns_els = findChildThenParentElbyClassName(nswex_search_panel, 'table-bordered', 'table')?.querySelectorAll('tbody td')

                if (table_search_result_columns_els?.length > 0) {
                    const commonIndex = source_html_name == 'delivery' ? 1 : 3

                    const freightProps: { [key: string]: string } = {
                        tracking_code: table_search_result_columns_els[commonIndex].querySelector('.text-nowrap')?.firstChild.textContent,
                        delivery_status_tracklink: table_search_result_columns_els[commonIndex].querySelector('a.agree')?.getAttribute('href'),
                        date_added: table_search_result_columns_els[commonIndex == 1 ? commonIndex + 2 : commonIndex + 7].textContent,
                        total_weight: table_search_result_columns_els[commonIndex == 1 ? commonIndex + 5 : commonIndex + 4].textContent,
                        total_price: table_search_result_columns_els[commonIndex == 1 ? commonIndex + 7 : commonIndex + 5].textContent,
                        delivery_status: table_search_result_columns_els[commonIndex + 6].querySelector('span.order_status')?.textContent ||
                            table_search_result_columns_els[commonIndex + 6].querySelector('span#order_product_status')?.textContent
                    }

                    const restructured_objs = Object.fromEntries(
                        (Object.entries(freightProps) as [string, string][])
                            // Trimming and replace newline
                            .map(([key, value]) => [key, typeof (value) === 'string' ? value.trim().replace(/\n/g, '') : null])
                            // Filter out undefined/null/empty value
                            .filter(([, value]) => value && value !== '')
                    ) as { [key: string]: string };

                    if (source_html_name !== 'delivery') {
                        //If the current iteration of arrived/otw html have the same current processing expressId
                        //can return straight
                        if (freightProps?.tracking_code === buyertrade_tracking_info?.expressId) {
                            db_data.freight_delivery_data = db_data?.freight_otw_arrive_data || restructured_objs;
                        } else {
                            resp.freight_otw_arrive_data = restructured_objs;
                        }
                    } else if (source_html_name === 'delivery') {
                        if (freight_otw_arrive_data && freight_otw_arrive_data?.tracking_code === buyertrade_tracking_info?.expressId) {
                            db_data.freight_delivery_data = freight_otw_arrive_data
                        } else
                            db_data.freight_delivery_data = restructured_objs;
                    }
                } else if (text_search_result_el === "You have not made any previous orders!") {
                    db_data.freight_delivery_data = Object.assign({}, db_data.freight_delivery_data, { delivery_status: "none" });

                } else if (!text_search_result_el && !table_search_result_columns_els && source_html_name !== 'delivery') {
                    process_html(delivery_html, 'delivery')
                }
            }

            // postMessage persist message on each call, need manual cleaning
            delete resp.freight_html;
            delete resp.msg_action; // Fixes bug where previous msg_action obj stuck with a new chromeapi postmessage call

            port.postMessage({ msg_action: 'save_db', db_data })
            console.log({ ...db_data })
            break;
        }
        default:
    }
});


(async () => {
    let first_query = true;

    if (location.href.includes("https://buyertrade.taobao.com/")) {
        const buyerTradeDivToObserve = 'td[class*="bought-wrapper-mod__thead-operations-container"]'

        // This is rightmost wrapper for flag, delete / threadoperations list on buyertrade page
        const bought_threadop_wrapper_els = Array.from(document.querySelectorAll(buyerTradeDivToObserve))
        const elementsArray = Array.from(bought_threadop_wrapper_els).slice(0, 20) as Element[];

        for (const bought_threadop_wrapper_el of elementsArray) {

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
                const buyertrade_tracking_info = await new Promise<TrackingInfo>((resolve) => {
                    chrome.runtime.sendMessage({ msg_action: "get_buyertrade_tracking_code", orderId }, (buyertrade_tracking_info) => {
                        resolve(buyertrade_tracking_info);
                    });
                })


                if (!buyertrade_tracking_info) continue;
                createBuyerTradeButton(bought_threadop_wrapper_el as HTMLElement)

                const db_data: BuyerTradeData = {
                    orderId,
                    product_main_title,
                    selected_product_variant,
                    bought_price,
                    bought_quantity,
                    product_web_link,
                    product_image_url,
                    product_create_date,
                    buyertrade_tracking_info,
                }

                /**
                 * setting the template for reusable and non reusable object
                 * reusable is usually db_data
                 * non reusable are just like state, and not for permanent store to db
                 */
                const buyertrade_extrainfo: { data: any } = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ msg_action: "get_itempage_products_moredetails", orderId }, buyertrade_extra_info => {
                        resolve(buyertrade_extra_info)
                    })
                })
                const { data: { data: buyertrade_deliver_address } } = buyertrade_extrainfo
                const addressValue = buyertrade_deliver_address.group.reduce((acc, group) => {
                    const cellData = Object.values(group).flatMap((innerArray: any) =>
                        innerArray.map(cell => cell)
                    ).find(cell => cell.cellType === 'address')

                    const addressCell = cellData?.cellData.find(cell => cell.tag === "address");

                    return addressCell ? addressCell.fields.value : acc;
                }, null);

                switch (true) {
                    case (/新西南国际/.test(addressValue)): {
                        port.postMessage({ msg_action: 'is_nswex_freight_processed', db_data, first_query } as PostMessageData)
                        break;
                    }
                    case (/穆院鑫玖电创.*ML\d+#\w+/.test(addressValue)): {
                        port.postMessage({ msg_action: 'is_mulupost_freight_processed', db_data, first_query } as PostMessageData)
                        break;
                    };
                    default:
                }

                first_query = false;
            }

        }



    }

})()