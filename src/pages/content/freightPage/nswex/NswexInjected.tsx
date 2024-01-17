export const injectScript = () => {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === 'nswex_fill_form') {
            const { product_main_title, product_selected_title, bought_price, bought_quantity, product_web_link, product_image_url, orderId, tracking_info } = request

            const form_wrapper = document.querySelector('#shipping_product-row0')
            let express_name_lists = document.querySelectorAll("select[name='shipping_product[0][express_company]'] option")
            const express_name_arr = Array.from(express_name_lists).map((el, idx) =>
                el.textContent
            )
            const selected_express_name = express_name_arr.find(el => {
                const { expressName } = tracking_info || null
                if (expressName == '中通快递') return 'ZTO';
                return expressName.includes(el)
            })
            let express_select_form = document.querySelector("span[id^='select2-shipping_product0express_company']") as HTMLSelectElement
            express_select_form.textContent = selected_express_name;

            console.log(express_name_arr)
            const all_forms = form_wrapper.querySelectorAll('td input')
            const inputElements = Array.from(all_forms) as HTMLInputElement[];

            inputElements[0].value = product_main_title;
            inputElements[2].value = tracking_info.expressId;
            inputElements[3].value = bought_quantity;
            inputElements[4].value = String(bought_price / 10)

        }
    });

}

injectScript()