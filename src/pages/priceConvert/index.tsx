import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import injectedStyle from './injected.css?inline';

refreshOnUpdate('pages/content');

// PriceBox.tsx
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface PriceBoxProps {
    itemPriceElement: HTMLElement;
    className: string;
    currencyRate: number;
    currencyChange: string;
}

const PriceBox: React.FC<PriceBoxProps> = ({ itemPriceElement, className, currencyRate, currencyChange }) => {
    useEffect(() => {
        const createPriceBox = () => {
            const itemPrice = itemPriceElement.textContent;

            if (itemPrice.includes("-")) {
                const originalPriceArr = itemPrice.split("-");
                const newPriceTag = (
                    <div className={className}>
                        <i></i>
                        <span>
                            ¡Ö {(
                                parseFloat(originalPriceArr[0].substring(1)) * currencyRate
                            ).toFixed(2)} - {(
                                parseFloat(originalPriceArr[1]) * currencyRate
                            ).toFixed(2)} {currencyChange}
                        </span>
                    </div>
                );
                itemPriceElement.lastElementChild!.insertAdjacentElement('afterend', newPriceTag);
            } else {
                const originalPrice = parseFloat(itemPrice.substring(1));
                const convertedPrice = (originalPrice * currencyRate).toFixed(2);
                const newPriceTag = (
                    <div className={className}>
                        <i></i>
                        <span>¡Ö {convertedPrice} {currencyChange}</span>
                    </div>
                );
                itemPriceElement.lastElementChild!.insertAdjacentElement('afterend', newPriceTag);
            }
        };

        const removeTrailingTaoConvPricebox = (parentNode?: string) => {
            const targetSelector = parentNode ? `${parentNode} .taoconvert_pricebox_tag` : '.taoconvert_pricebox_tag';
            const trailingTaoconvPricebox = document.querySelectorAll(targetSelector);
            if (trailingTaoconvPricebox.length > 0) {
                trailingTaoconvPricebox.forEach(tag => tag.remove());
            }
        };

        createPriceBox();

        return () => {
            removeTrailingTaoConvPricebox(); // Clean up on unmount
        };
    }, [itemPriceElement, className, currencyRate, currencyChange]);

    return <></>; // You can customize the component's output if needed
};

export default PriceBox;

const root = document.createElement("div");
root.className = "taoconvert_pricebox_tag";

const placePriceBoxToDom = () => {
    const promptTextarea = document.querySelector("#prompt-textarea");
    const parent = promptTextarea?.parentElement?.parentElement;

    if (parent) {
        parent.append(root);
        createRoot(root).render(<PriceBox />);
    }
};
placePriceBoxToDom()
/**
 * https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/pull/174
 *
 * In the firefox environment, the adoptedStyleSheets bug may prevent contentStyle from being applied properly.
 * Please refer to the PR link above and go back to the contentStyle.css implementation, or raise a PR if you have a better way to improve it.
 */
