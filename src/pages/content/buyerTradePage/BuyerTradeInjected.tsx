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

/**
 * TO NOTE :
 * 1. NSWEX webpage is messy, missing items here and there
 * "on the way": do have tracking code prepared
 * "arrived": do have tracking code prepared"
 * "delivery": do have tracking code prepared"
 * "wait for deliver": do not have tracking code prepared
 * "wait for payment": not sure
 */
port.onMessage.addListener(async (resp) => {
    const { msg_action, db_data, freight_html } = resp;
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
                company: 'Mulupost',
                tracking_code: mulu_doc.querySelector('.relative.panel .panel-hd .text-primary').textContent,
                delivery_status_tracklink: mulu_doc.querySelector('.panel-ft a.btn-primary[href]')?.getAttribute('href'),
                date_added: freight_infos[7].value,
            }
            switch (true) {
                case (/包裹运输中/g.test(freight_infos[1].value)):
                    freightProps["delivery_status"] = 'delivery'
                    break;
                case (/运输完成/g.test(freight_infos[1].value)):
                    freightProps["delivery_status"] = 'completed'
                    break;
                case (/签收入库/g.test(freight_infos[1].value)):
                    freightProps["delivery_status"] = 'arrived'
                    break;
                case (/发货运输/g.test(freight_infos[1].value)):
                    freightProps["delivery_status"] = 'on the way'
                    break;
                case ((freight_html.mulu_html as string)?.includes('not found')):
                    freightProps["delivery_status"] = 'none'
                    break;
                default:
            }
            db_data.freight_delivery_data = freightProps;

            port.postMessage({ msg_action: 'save_db', db_data })
            console.log({ ...db_data }, 'mulupost')
            break;
        }
        case 'process_nswex_freight_html': {
            const { delivery_html, ontheway_html, arrived_html } = Object.entries(freight_html).reduce((acc, [key, values]) =>
                (acc[key] = parser.parseFromString(values as string, 'text/html'), acc)
                , {}) as { delivery_html: Document, ontheway_html: Document, arrived_html: Document };

            if (ontheway_html && arrived_html) {
                processHTML(ontheway_html, 'ontheway');
                processHTML(arrived_html, 'arrived');
            } else {
                processHTML(delivery_html, 'delivery');
            }


            function processHTML(html_dom_element, source_html_name) {
                const { freight_props_savelater_data } = resp;
                // freight_tracking_el is el for search result tracking code on freight
                const nswex_search_panel = html_dom_element.querySelector('div[class="panel panel-default"]') as HTMLElement

                const next_sibiling = nswex_search_panel?.nextElementSibling;
                const nextnextsib_or_not_el =
                    next_sibiling?.tagName.toLowerCase() === 'div' && next_sibiling.id === 'submit_order_product'
                        ? next_sibiling.firstElementChild
                        : next_sibiling
                const text_search_result_el = nextnextsib_or_not_el?.tagName.toLowerCase() === 'p' ? nextnextsib_or_not_el?.textContent : null
                const table_search_result_column_el = findChildThenParentElbyClassName(nswex_search_panel, 'table-bordered', 'table')

                const table_search_result_columns_els = table_search_result_column_el?.querySelectorAll('tbody td')

                if (table_search_result_column_el) {
                    const table_header = Array.from(table_search_result_column_el?.querySelectorAll('thead td')).map((td) => {
                        const key = td.textContent.trim()
                            .replace(/\s+/g, '_') // Replace spaces with underscores
                            .replace('/', '') // Remove slashes
                            .toLowerCase();
                        if (key == 'weight_m3') return 'weight'
                        return key

                    });

                    const table_values = Array.from(table_search_result_column_el.querySelectorAll('tbody tr')).map(tr =>
                        Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())
                    );

                    const mapped_thead_tbody_data = table_header.reduce((acc, key, index) => {
                        const td = table_values.map(row => row[index]);

                        switch (key) {
                            case 'tracking_number':
                                acc[key] = td[index]?.querySelector('.text-nowrap')?.firstChild?.textContent;
                                break;
                            case 'delivery_order_status':
                                acc[key] = td[index]?.querySelector('span.order_status')?.textContent || td[index]?.querySelector('span#order_product_status')?.textContent;
                                break;
                            default:
                                acc[key] = td[index];
                                break;
                        }
                        return acc;
                    }, {});


                    const is_tracking_code_exists = Object.entries(mapped_thead_tbody_data).find(data => data[0] === 'tracking_number')
                    //!is_tracking_code_exists && port.postMessage({ msg_action: 'postprocess:redive_endpoint' })

                    const commonIndex = source_html_name == 'delivery' ? 1 : 3
                    const freight_props_template: { [key: string]: string } = {
                        company: 'NSWEX',
                        tracking_code: mapped_thead_tbody_data['tracking_number'],
                        delivery_status_tracklink: table_search_result_columns_els[commonIndex].querySelector('a.agree')?.getAttribute('href'),
                        date_added: mapped_thead_tbody_data['date_added'],
                        total_weight: mapped_thead_tbody_data['weight'],
                        total_price: mapped_thead_tbody_data['total'],
                        delivery_status: mapped_thead_tbody_data['delivery_order_status'] || mapped_thead_tbody_data['status']
                    }

                    const freight_props = Object.fromEntries(
                        (Object.entries(freight_props_template) as [string, string][])
                            // Trimming and replace newline
                            .map(([key, value]) => [key, typeof (value) === 'string' ? value.trim().replace(/\n/g, '') : null])
                            // Filter out undefined/null/empty value
                            .filter(([, value]) => value && value !== '')
                    ) as { [key: string]: string };
                    console.log(freight_props, 'freight_props')

                    const is_not_empty_array_freight_savelater_data = Array.isArray(freight_props_savelater_data) && freight_props_savelater_data.length > 0;
                    const found_matching_savelater_tracking_code = is_not_empty_array_freight_savelater_data && freight_props_savelater_data.find(data => data.tracking_code === buyertrade_tracking_info?.expressId)
                    const current_same_processing_t_code = freight_props_template?.tracking_code == buyertrade_tracking_info?.expressId

                    // If source_html_name is otw, arrive
                    if (source_html_name !== 'delivery') {
                        //If the current iteration of arrived/otw html have the same current processing expressId
                        //can just use back freight_props_savelater_data
                        if (current_same_processing_t_code || found_matching_savelater_tracking_code) {
                            db_data.freight_delivery_data = found_matching_savelater_tracking_code || freight_props;
                        } else {
                            // Push the new data to freight_props_savelater_data
                            resp.freight_props_savelater_data = [];
                            resp.freight_props_savelater_data.push(freight_props);
                        }

                    } else if (source_html_name === 'delivery') {
                        if (current_same_processing_t_code || found_matching_savelater_tracking_code) {
                            db_data.freight_delivery_data = found_matching_savelater_tracking_code || freight_props;
                        }
                    }
                } else if (text_search_result_el === "You have not made any previous orders!") {
                    db_data.freight_delivery_data = Object.assign({}, db_data.freight_delivery_data, { delivery_status: "none" });

                } else if (!text_search_result_el && !table_search_result_columns_els && source_html_name !== 'delivery') {
                    processHTML(delivery_html, 'delivery')
                }
            }

            // postMessage persist message on each call, need manual cleaning
            delete resp.freight_html;
            delete resp.msg_action; // Fixes bug where previous msg_action obj stuck with a new chromeapi postmessage call

            port.postMessage({ msg_action: 'save_db', db_data })
            console.log({ ...db_data }, 'nswex')
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