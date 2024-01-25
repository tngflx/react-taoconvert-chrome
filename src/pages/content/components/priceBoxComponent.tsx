import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import injectedStyle from './injected.css?inline';

refreshOnUpdate('pages/priceConvert');

export const PriceBox = ({ convertedPrice, convertedPriceRange, currencyChange, size }: {
    convertedPrice?: string;
    convertedPriceRange?: string[];
    currencyChange: string;
    size: string;
}) => {
    return (
        <div className={'taoconvert_pricebox_tag ' + size}>
            <i></i>
            {convertedPriceRange ? (
                <span>&cong; {convertedPriceRange[0]} - {convertedPriceRange[1]} {currencyChange}</span>
            ) : (
                <span>&cong; {convertedPrice} {currencyChange}</span>
            )}
        </div>
    );
};

/**
 * https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/pull/174
 *
 * In the firefox environment, the adoptedStyleSheets bug may prevent contentStyle from being applied properly.
 * Please refer to the PR link above and go back to the contentStyle.css implementation, or raise a PR if you have a better way to improve it.
 */
