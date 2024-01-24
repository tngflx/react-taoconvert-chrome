import { render } from "react-dom";
import { DOMTools } from "./misc";
import { PriceBox } from "../priceConvert/priceBoxComponent";

const { findChildThenParentElbyClassName } = new DOMTools;
export class priceBoxRenderer {
    public currency_change: string
    public currency_rate: number
    constructor() {
        this.currency_change = ''
        this.currency_rate = 1
    }


    /**
     * react render taoconvert pricebox
     * @param item_price_element This is directly point to the originPrice or extraPrice element, so that we can find price straight
     * @param taoconvert_pricebox_container_size pricebox container that render according to specific size
     * @param insert_to_target_el The target element that we want to insertAdjacentHTML to
     * @returns
     */
    createPriceBox(item_price_element: Element, taoconvert_pricebox_container_size: '' | 'lg' | 'sm', insert_to_target_el?: Element): void {
        let target_el_to_insert = insert_to_target_el ? insert_to_target_el : item_price_element;

        const item_price = findChildThenParentElbyClassName(item_price_element, 'Price--priceText')?.textContent
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
                <PriceBox convertedPriceRange={converted_price_range} currencyChange={this.currency_change} size={taoconvert_pricebox_container_size} />,
                taoConvertContainer
            );
        } else {
            /*const original_price = parseFloat(item_price.substring(1));*/
            const converted_price = (parseFloat(item_price) * this.currency_rate).toFixed(2);

            render(
                <PriceBox convertedPrice={converted_price} currencyChange={this.currency_change} size={taoconvert_pricebox_container_size} />,
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