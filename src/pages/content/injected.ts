import { CurrencyAPI } from "./utils/currencyAPI";
import { MutationObserverManager, findParentElbyClassName } from "./utils/misc";

export async function injectScript() {
    //cariable declarion
    let currency_change = "USD";
    let currency_rate = 0
    //    const warning_header =
    //        `<div style="padding: 10px;
    //text-align: center;
    //color: #f40;
    //top: 0px;
    //background-color: white;
    //line-height: 1;">You are currently using automatic price converter to Currency you set, the Currency you set price are not guarantee 100% accuracy.</div>`

    // const timer = ms => new Promise(res => setTimeout(res, ms))

    chrome.runtime.onMessage.addListener(
        function (request) {
            if (request.action === "taobao_currency_choose") {
                location.reload();
            }
        }
    );


    // Create an instance of the CurrencyAPI class
    const currencyApi = new CurrencyAPI

    const mutObserverManager = new MutationObserverManager();

    getCurrencyRate();
    async function getCurrencyRate() {
        try {
            let storageData = await chrome.storage.sync.get({
                selected_target_currency: 'MYR',
                last_update_time: 0, // Default to 0 if not set
                stored_currency_rate: 0     // Default to 0 if not set
            })
            let { selected_target_currency, last_update_time, stored_currency_rate } = storageData
            currency_change = selected_target_currency;

            const current_time = new Date().getTime();
            const thirty_minutes_in_millis = 30 * 60 * 1000;

            if (current_time - last_update_time < thirty_minutes_in_millis || (currency_rate === 0 && stored_currency_rate === 0)) {
                // If more than 30 minutes have passed or stored_currency_rate is not set, query the API
                const response = await currencyApi.latest({
                    base_currency: 'CNY',
                    currencies: currency_change
                });

                const { data } = response || null;
                currency_rate = data[currency_change];

                // Save the new currency rate and update time in storage
                await chrome.storage.sync.set({ stored_currency_rate: currency_rate, last_update_time: current_time });
            } else {
                // If less than 30 minutes have passed, or if stored_currency_rate is set, use the stored currency rate
                currency_rate = stored_currency_rate;
            }


        } catch (error) {
            console.error('Error fetching currency data:', error);
        }

    }

    class sharedUtilities {
        constructor() {

        }



        createPriceBox(item_price_element, class_name) {
            const item_price = item_price_element.textContent

            if (item_price.includes("-")) {
                const original_price_arr = item_price.split("-");
                const new_price_tag = `<div class="${class_name}"><i></i><span>≈ ${(parseFloat(original_price_arr[0].substring(1)) * currency_rate).toFixed(2)} - ${(parseFloat(original_price_arr[1]) * currency_rate).toFixed(2)} ${currency_change}</span></div>`;
                item_price_element.lastElementChild.insertAdjacentHTML('afterend', new_price_tag);
            } else {
                const original_price = parseFloat(item_price.substring(1));
                const converted_price = (original_price * currency_rate).toFixed(2);
                const newPriceTagHtml = `<div class="${class_name}"><i></i><span>≈ ${converted_price} ${currency_change}</span></div>`;
                item_price_element.lastElementChild.insertAdjacentHTML('afterend', newPriceTagHtml);
            }
        }

        removeTrailingTaoConvPricebox(parentNode?: string) {
            const target_selector = parentNode ? `${parentNode} .taoconvert_pricebox_tag` : '.taoconvert_pricebox_tag'
            const trailing_taoconv_pricebox = document.querySelectorAll(target_selector)
            if (trailing_taoconv_pricebox.length > 0)
                trailing_taoconv_pricebox.forEach(tag => tag.remove())
        }
    }

    const sharedUtility = new sharedUtilities()

    /////////////////////////////////////[https://world.taobao.com/]/////////////////////////////////////
    //effect only content in taobao home page
    if (location.href.includes("https://world.taobao.com/")) {
        let lastProcessedIndex = 0; // Variable to keep track of the last processed index

        //window.onload = (event) => {

        //    addConversionPrice();
        //};

        mutObserverManager.config = { mode: 'addedNode', mutatedTargetChildNode: 'item', mutatedTargetParentNode: '.item-feed .list', subtree: false }
        mutObserverManager.startObserver(addConversionPrice);

        function addConversionPrice() {
            let price_elements = document.querySelectorAll(".price-text");

            for (let [index, item] of price_elements.entries()) {
                if (index >= lastProcessedIndex) {
                    let symbolTextElement = item.previousElementSibling;

                    // Remove extra symbol span
                    if (symbolTextElement && symbolTextElement.classList.contains("symbol-text")) {
                        symbolTextElement.remove()
                    }

                    // Change the font size of .price-text
                    (item as HTMLElement).style.fontSize = "15px";

                    let original_price = parseFloat(item.textContent);
                    if (!isNaN(original_price)) {
                        let converted_price = (original_price * currency_rate).toFixed(2);
                        item.textContent = '¥ ' + item.textContent + " or " + converted_price + " " + currency_change;
                    }
                }
            }

            // Update the last processed index
            lastProcessedIndex = price_elements.length;
        }


    }


    /////////////////////////////////////[https://s.taobao.com/]/////////////////////////////////////
    //effect only in taobao search page
    if (location.href.includes("https://s.taobao.com/")) {
        let RightAdsObserverManager: MutationObserverManager;
        let BottomAdsObserverManager: MutationObserverManager;

        let searchResultPageDivToObserve = 'div[class*="leftContent"] div[class*="contentInner"]';
        let RightAdsPageDivToObserve = 'div[class^="RightLay--rightWrap"] [class*="templet"]';
        let BottomAdsPageDivToObserve = 'div[class^="BottomLay--bottomWrap"] [class*="templet"]';

        mutObserverManager.config = { mode: 'addedNode', mutatedTargetChildNode: "doubleCardWrapper", mutatedTargetParentNode: searchResultPageDivToObserve, subtree: false };
        mutObserverManager.startObserver(changeTaobaoSearchResultPagePriceTag);
        BottomAdsObserverManager = new MutationObserverManager();

        window.onload = (event) => {
            // Bottom ads load the last, so need different observer for it even though shares the same div structure and elements
            BottomAdsObserverManager.config = { mode: 'addedNode', mutatedTargetChildNode: "line1", mutatedTargetParentNode: BottomAdsPageDivToObserve, subtree: false };
            BottomAdsObserverManager.startObserver(changeTaobaoSearchResultPageAdsPriceTag);

            changeTaobaoSearchResultPageAdsPriceTag();
        };

        async function changeTaobaoSearchResultPagePriceTag() {
            let price_wrapper_elements = document.querySelectorAll('[class*="priceWrapper"]');

            for (let price_wrapper_element of price_wrapper_elements as NodeListOf<HTMLElement>) {
                // get Price int and float using more generic selectors
                let price_int_element = findParentElbyClassName(price_wrapper_element, 'priceInt') as HTMLElement;
                if (!price_int_element) console.log('no element');

                let price_float_element = findParentElbyClassName(price_wrapper_element, 'priceFloat') as HTMLElement;
                if (!price_float_element) console.log('no element');

                // Extract the text content of priceInt and priceFloat elements
                let price_int = parseFloat(price_int_element.textContent);
                let price_float = parseFloat(price_float_element.textContent) || 0;

                // Combine priceInt and priceFloat into one number
                let original_price = price_int + price_float / 100; // Assuming priceFloat represents cents

                if (!isNaN(original_price)) {
                    let converted_price = (original_price * currency_rate).toFixed(2);

                    let ancestor = price_wrapper_element.closest('a');
                    ancestor.style.height = "420px";

                    price_int_element.style.fontSize = "17px";
                    price_float_element.style.fontSize = "17px";
                    price_wrapper_element.style.height = "fit-content";
                    price_wrapper_element.style['align-items'] = "flex-start";

                    let priceSalesSpan = findParentElbyClassName(price_wrapper_element, 'realSales') as HTMLElement;
                    priceSalesSpan.style["line-height"] = "20px";

                    price_wrapper_element.classList.add('taoconvert_pricebox_container');
                    price_float_element.insertAdjacentHTML('afterend', '<div class="taoconvert_pricebox_tag sm"><i></i><span> ≈ ' + converted_price + ' ' + currency_change + '</span></div>');

                }
            }
        }

        function changeTaobaoSearchResultPageAdsPriceTag() {
            let ads_price_wrapper = document.querySelectorAll('.templet ul.item-list li.item');

            // As bottom ads is the last to load, right ads will be rendered first with pricebox, remove it then reprocess with last call
            sharedUtility.removeTrailingTaoConvPricebox(RightAdsPageDivToObserve);

            for (let item of ads_price_wrapper) {
                const ad_price_element = findParentElbyClassName(item, 'price', 'a') as HTMLElement;
                const ad_price_wrapper_element = findParentElbyClassName(item, 'line1', 'div') as HTMLElement;

                if (!ad_price_element) {
                    console.error(`ad_price_element not found`);
                    break;
                } else if (ad_price_element) {

                    let original_ad_price: number | string = ad_price_element.textContent;

                    // Use a regular expression to match numbers with or without a decimal point
                    var matches = original_ad_price.match(/\d+(\.\d+)?|\.\d+/);

                    // Check if there are matches and extract the first one
                    original_ad_price = matches ? parseFloat(matches[0]) : NaN;

                    let converted_price = (original_ad_price * currency_rate).toFixed(2);
                    ad_price_element.style["font-size"] = '15px';
                    ad_price_wrapper_element.style["height"] = 'fit-content';

                    ad_price_element.classList.add('taoconvert_pricebox_container');
                    ad_price_element.innerHTML += '<div class="taoconvert_pricebox_tag sm"><i></i><span> ≈ ' + converted_price + ' ' + currency_change + '</span></div>';

                }
            }
        }
    }



    /////////////////////////////////////[https://item.taobao.com/]/////////////////////////////////////
    //Affected only in taobao item page
    if (location.href.includes("https://item.taobao.com/")) {
        const itemPageDivToObserve = "#J_StrPrice .tb-rmb-num"

        mutObserverManager.config = { mode: 'removedText', mutatedTargetChildNode: "tb-rmb-num", mutatedTargetParentNode: itemPageDivToObserve, subtree: false }
        mutObserverManager.startObserver(changeTaobaoItemPagePriceTag)


        function changeTaobaoItemPagePriceTag() {
            sharedUtility.removeTrailingTaoConvPricebox()

            const promo_price_element = document.querySelector('strong.tb-promo-price')
            const original_price_element = document.getElementById('J_StrPrice')

            if (promo_price_element) {
                sharedUtility.createPriceBox(promo_price_element, "taoconvert_pricebox_tag")
                sharedUtility.createPriceBox(original_price_element, "taoconvert_pricebox_tag md")
            } else
                sharedUtility.createPriceBox(original_price_element, "taoconvert_pricebox_tag lg")
        }
    }


    /////////////////////////////////////[https://detail.tmall.com]/////////////////////////////////////
    //effect only in taobao item detail tmall page
    const urlPattern = /^https?:\/\/(.*\.)?detail\.tmall\.com/;

    if (urlPattern.test(location.href)) {
        //if this component load start the script
        const TmallPageDivToObserve = "[class*='originPrice']"

        mutObserverManager.config = { mode: 'removedText', mutatedTargetChildNode: "[class*='priceText']", mutatedTargetParentNode: TmallPageDivToObserve, subtree: true }
        mutObserverManager.startObserver(changeTmallPagePriceTag)


        function changeTmallPagePriceTag() {
            sharedUtility.removeTrailingTaoConvPricebox()

            let tmall_price_elements = document.querySelectorAll("[class^='Price--priceText']")
            let tmall_discounted_price_element;
            let tmall_original_price_element;

            Array.from(tmall_price_elements).forEach(el => {
                const discountedPriceElement = findParentElbyClassName(el, "extraPrice");
                const originalPriceElement = findParentElbyClassName(el, "originPrice");

                if (discountedPriceElement) {
                    tmall_discounted_price_element = discountedPriceElement;
                }

                if (originalPriceElement) {
                    tmall_original_price_element = originalPriceElement;
                }
            });


            if (tmall_discounted_price_element) {
                let tmall_price = tmall_discounted_price_element.textContent
                const converted_price = (parseFloat(tmall_price) * currency_rate).toFixed(2);
                const newPriceTagHtml = `<div class="taoconvert_pricebox_tag"><i></i><span>≈ ${converted_price} ${currency_change}</span></div>`;

                const salePriceRelativeWrapElement = tmall_discounted_price_element.closest('[class^="Price--sale--"]')
                salePriceRelativeWrapElement.style["margin-bottom"] = '10px'

                salePriceRelativeWrapElement.insertAdjacentHTML('afterend', newPriceTagHtml);

            } else {
                let tmall_price = tmall_original_price_element.textContent
                // Use a regular expression to match numbers with or without a decimal point
                var matches = tmall_price.match(/\d+(\.\d+)?|\.\d+/);

                // Check if there are matches and extract the first one
                tmall_price = matches ? parseFloat(matches[0]) : NaN;
                const converted_price = (tmall_price * currency_rate).toFixed(2);
                const newPriceTagHtml = `<div class="taoconvert_pricebox_tag"><i></i><span>≈ ${converted_price} ${currency_change}</span></div>`;
                tmall_original_price_element.style["margin-right"] = '10px'


                //let salePriceRelativeWrapElement = tmall_original_price_element.closest('[class*="salePriceRelativeWrap"]')
                let priceSaleParentElement = tmall_original_price_element.closest('[class^="Price--sale--"]')
                let normalPriceWrapParentElement = tmall_original_price_element.closest('[class^="Price--priceWrap--"]')

                let selectedWrapperElement = priceSaleParentElement ? priceSaleParentElement : normalPriceWrapParentElement

                selectedWrapperElement.style["margin-bottom"] = '10px'
                selectedWrapperElement.insertAdjacentHTML('afterend', newPriceTagHtml);

            }

        }
    }
}

void injectScript();
