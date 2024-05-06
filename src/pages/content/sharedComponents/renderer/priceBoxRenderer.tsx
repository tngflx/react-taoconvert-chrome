import { render } from "react-dom";
import { DOMTools } from "../../utils/misc";
import { PriceBox } from "../priceBoxComponent";

const { findChildThenParentElbyClassName } = DOMTools;
export class priceBoxRenderer {
    public currency_change: string
    public currency_rate: number
    constructor() {
        this.currency_change = ''
        this.currency_rate = 1
    }


    /**
     * react render taoconvert pricebox
     * @param itempage_price_el This is directly point to the originPrice or extraPrice element, so that we can find price straight
     * @param pricebox_ct_size pricebox container that render according to specific size
     * @param insert_to_target_el The target element that we want to insertAdjacentHTML('afterend') relative to item_price_element
     * @returns
     */
    createPriceBox(options: {
        price_text_el: Element,
        pricebox_ct_size: '' | 'lg' | 'md' | 'sm',
        insert_to_target_el?: Element,
    }): void {
        const { price_text_el, pricebox_ct_size, insert_to_target_el } = options;
        let target_el_to_insert = insert_to_target_el ? insert_to_target_el : price_text_el;

        let item_price = findChildThenParentElbyClassName(price_text_el, 'Price--priceText')?.textContent
        // Fix for old itempage taobao
        item_price = item_price ? item_price : findChildThenParentElbyClassName(price_text_el, 'tb-rmb-num')?.textContent

        // This is important as sometimes mutationObserver caught in middle rendering item_price as there are no value,
        // so it's best to return
        if (!item_price || item_price === '') return;

        let taoConvertContainer = document.createElement('div');
        taoConvertContainer.className = 'taoconvert_pricebox_container'

        // Insert the new div element after the item_price_element
        target_el_to_insert.insertAdjacentElement('afterend', taoConvertContainer);


        if (item_price.includes("-")) {
            const original_price_arr = item_price.split("-");
            const converted_price_range = [
                (parseFloat(original_price_arr[0].substring(1)) * this.currency_rate).toFixed(2),
                (parseFloat(original_price_arr[1]) * this.currency_rate).toFixed(2)
            ];

            render(
                <PriceBox convertedPriceRange={converted_price_range} currencyChange={this.currency_change} size={pricebox_ct_size} />,
                taoConvertContainer
            );
        } else {
            /*const original_price = parseFloat(item_price.substring(1));*/
            const converted_price = (parseFloat(item_price) * this.currency_rate).toFixed(2);

            render(
                <PriceBox convertedPrice={converted_price} currencyChange={this.currency_change} size={pricebox_ct_size} />,
                taoConvertContainer
            );
        }
    }

    removeTrailingTaoConvPricebox(parentNode?: string) {
        const target_selector = parentNode ? `${parentNode} .taoconvert_pricebox_tag` : '.taoconvert_pricebox_container'
        const trailing_taoconv_pricebox = document.querySelectorAll(target_selector)
        if (trailing_taoconv_pricebox.length > 0)
            trailing_taoconv_pricebox.forEach(tag => tag.remove())
    }
}