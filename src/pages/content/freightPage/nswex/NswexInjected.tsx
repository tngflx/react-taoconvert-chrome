// Inform the background script that the content script has loaded
chrome.runtime.sendMessage({ msg_action: 'nswex:script_loaded' });

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(request => {
        if (request.msg_action === 'nswex_fill_form') {
            const {
                product_main_title,
                selected_product_variant,
                bought_price,
                bought_quantity,
                product_web_link,
                product_image_url,
                orderId,
                buyertrade_tracking_info,
                product_create_date,
            }: ProductData = request;
            // First row of shipping entry on nswex
            const add_entry_button = document.querySelector('.table-responsive-2 .pull-left button') as HTMLElement;

            let express_name_lists = document.querySelectorAll("select[name='shipping_product[0][express_company]'] option");
            const express_name_arr = Array.from(express_name_lists).map((el, idx) => el.textContent);

            // Function to get the element IDs dynamically based on the row index
            const getRowElements = row => {
                // TODO : Trying to fix bug where 3rd row select freight can change 2nd row select freight
                const rowIndex = row.id.match(/\d/g)[0];
                return {
                    freight_select_el_per_row: row.querySelector(
                        `span[id^='select2-shipping_product${rowIndex}']`,
                    ) as HTMLSelectElement,
                    all_input_els_per_row: row.querySelectorAll('td input[name^="shipping_product"]') as HTMLInputElement[],
                    input_elements_toinsert_template: [
                        { index: 0, value: product_main_title },
                        { index: 2, value: buyertrade_tracking_info.expressId },
                        { index: 3, value: bought_quantity },
                        { index: 4, value: String(bought_price / 10) },
                    ],
                };
            };

            // Query all shipping_product-row divs
            const shippingProductRows = document.querySelectorAll('[id^="shipping_product-row"]');

            const selected_express_name = express_name_arr.find(el => {
                const { expressName } = buyertrade_tracking_info || null;
                if (expressName == '中通快递') return 'ZTO';
                return expressName.includes(el);
            });

            let { isEveryInputFilledFlag, isEveryInputSameFlag } = Array.from(shippingProductRows).reduce(
                (acc, row, rowIndex) => {
                    const { input_elements_toinsert_template, all_input_els_per_row } = getRowElements(row);
                    const input_elements = Array.from(all_input_els_per_row) as HTMLInputElement[];
                    //Check if input elements ever filled on each column
                    if (input_elements_toinsert_template.every(({ index }) => input_elements[index]?.value))
                        acc.isEveryInputFilledFlag = true;

                    // Check if the input elements already have the same value as incoming data in each column
                    if (input_elements_toinsert_template.every(({ index, value }) => input_elements[index]?.value == value))
                        acc.isEveryInputSameFlag = true;
                    return acc;
                },
                { isEveryInputFilledFlag: false, isEveryInputSameFlag: false },
            );

            chrome.runtime.sendMessage({ msg_action: 'nswex:update_hoverarrow', isEveryInputFilledFlag, isEveryInputSameFlag })

            if (!isEveryInputFilledFlag) {
                const { input_elements_toinsert_template, all_input_els_per_row, freight_select_el_per_row } = getRowElements(
                    shippingProductRows[0],
                );
                input_elements_toinsert_template.forEach(({ index, value }) => (all_input_els_per_row[index].value = String(value)));
                freight_select_el_per_row.textContent = selected_express_name;

            } else if (isEveryInputFilledFlag && isEveryInputSameFlag) {
                return;
            } else if (isEveryInputFilledFlag && !isEveryInputSameFlag) {
                add_entry_button.click();
                const shippingProductRows = document.querySelectorAll('[id^="shipping_product-row"]');

                const { input_elements_toinsert_template, all_input_els_per_row, freight_select_el_per_row } = getRowElements(
                    shippingProductRows[shippingProductRows.length - 1],
                );

                input_elements_toinsert_template.forEach(({ index, value }) => (all_input_els_per_row[index].value = String(value)));
                freight_select_el_per_row.textContent = selected_express_name;
            }
        }
    });
});
