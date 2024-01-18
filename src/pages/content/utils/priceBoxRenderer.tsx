import { render } from "react-dom";
import { DOMTools } from "./misc";
import { PriceBox } from "../priceConvert/priceBoxComponent";

const { findChildThenParentElbyClassName } = new DOMTools;
export class priceBoxRenderer {
    currency_change: string;
    currency_rate: number;
    constructor(currency_rate, currency_change) {
        this.currency_change = currency_change
        this.currency_rate = currency_rate
    }



    createPriceBox(item_price_element, taoconvert_pricebox_container_size) {
        const item_price = findChildThenParentElbyClassName(item_price_element, 'Price--priceText').textContent

        let taoConvertContainer = document.createElement('div');
        taoConvertContainer.className = 'taoconvert_pricebox_container'

        // Insert the new div element after the item_price_element
        item_price_element.insertAdjacentElement('afterend', taoConvertContainer);


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
            const original_price = parseFloat(item_price/*.substring(1)*/);
            const converted_price = (original_price * this.currency_rate).toFixed(2);

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