/* eslint-disable no-inner-declarations */
import { render } from 'react-dom';
import { MutationObserverManager, DOMTools } from '../utils/misc';
import { taoDownloader } from '../taoDownloader/taoDownloadInjected';
import { CurrencyAPI } from '../utils/currencyAPI';
import MultiStepFormInDialog from '../taoDownloader/multiStepFormInDialog';
import { priceBoxRenderer } from '../sharedComponents/renderer/priceBoxRenderer';
import { PriceBox } from '../sharedComponents/priceBoxComponent';
const { findChildThenParentElbyClassName } = DOMTools;

// Create an instance of the CurrencyAPI class
const currencyApi = new CurrencyAPI();
const mutObserverManager = new MutationObserverManager();
//cariable declarion
let currency_change = 'USD';
let currency_rate = 0;
//    const warning_header =
//        `<div style="padding: 10px;
//text-align: center;
//color: #f40;
//top: 0px;
//background-color: white;
//line-height: 1;">You are currently using automatic price converter to Currency you set, the Currency you set price are not guarantee 100% accuracy.</div>`

chrome.runtime.onMessage.addListener(function (request) {
  if (request.action === 'taobao_currency_choose') {
    location.reload();
  }
});

async function getCurrencyRate() {
  try {
    const storageData = await chrome.storage.sync.get({
      selected_target_currency: 'MYR',
      last_update_time: 0, // Default to 0 if not set
      stored_currency_rate: 0, // Default to 0 if not set
    });
    const { selected_target_currency, last_update_time, stored_currency_rate } = storageData;
    currency_change = selected_target_currency;

    const current_time = new Date().getTime();
    const thirty_minutes_in_millis = 30 * 60 * 1000;

    if (
      current_time - last_update_time < thirty_minutes_in_millis ||
      (currency_rate === 0 && stored_currency_rate === 0)
    ) {
      // If more than 30 minutes have passed or stored_currency_rate is not set, query the API
      const response = await currencyApi.latest({
        base_currency: 'CNY',
        currencies: currency_change,
      });

      const { data } = response || null;
      currency_rate = data[currency_change];

      // Save the new currency rate and update time in storage
      await chrome.storage.sync.set({ stored_currency_rate: currency_rate, last_update_time: current_time });
    } else {
      // If less than 30 minutes have passed, or if stored_currency_rate is set, use the stored currency rate
      currency_rate = stored_currency_rate;
    }
    return currency_rate;
  } catch (error) {
    console.error('Error fetching currency data:', error);
  }
}

const boxRenderer = new priceBoxRenderer();

getCurrencyRate().then(currency_rate => {
  boxRenderer.currency_rate = currency_rate;
  boxRenderer.currency_change = currency_change;
});

/////////////////////////////////////[https://world.taobao.com/]/////////////////////////////////////
//effect only content in taobao home page
if (location.href.includes('https://world.taobao.com/')) {
  let lastProcessedIndex = 0; // Variable to keep track of the last processed index

  mutObserverManager.config = {
    mode: 'addedNode',
    mutTargetChildName: 'item',
    domLoadedSourceParentNode: '.item-feed .list',
    subtree: false,
  };
  mutObserverManager.startObserver(addConversionPrice);

  function addConversionPrice() {
    const price_elements = document.querySelectorAll('.price-text');

    for (const [index, item] of price_elements.entries()) {
      if (index >= lastProcessedIndex) {
        const symbolTextElement = item.previousElementSibling;

        // Remove extra symbol span
        if (symbolTextElement && symbolTextElement.classList.contains('symbol-text')) {
          symbolTextElement.remove();
        }

        // Change the font size of .price-text
        (item as HTMLElement).style.fontSize = '15px';

        const original_price = parseFloat(item.textContent);
        if (!isNaN(original_price)) {
          const converted_price = (original_price * currency_rate).toFixed(2);
          item.textContent = '¥ ' + item.textContent + ' or ' + converted_price + ' ' + currency_change;
        }
      }
    }

    // Update the last processed index
    lastProcessedIndex = price_elements.length;
  }
}

/////////////////////////////////////[https://s.taobao.com/]/////////////////////////////////////
//effect only in taobao search page
if (location.href.includes('https://s.taobao.com/')) {
  let RightAdsObserverManager: MutationObserverManager;
  let BottomAdsObserverManager: MutationObserverManager;

  const searchResultPageDivToObserve = 'div[class*="leftContent"] [class*="contentInner"]';
  const RightAdsPageDivToObserve = 'div[class^="RightLay--rightWrap"] [class*="templet"]';
  const BottomAdsPageDivToObserve = 'div[class^="BottomLay--bottomWrap"] [class*="templet"]';

  mutObserverManager.config = {
    mode: 'addedNode',
    mutTargetChildName: 'doubleCardWrapper',
    domLoadedSourceParentNode: searchResultPageDivToObserve,
    subtree: false,
  };
  mutObserverManager.startObserver(changeTaobaoSearchResultPagePriceTag);
  BottomAdsObserverManager = new MutationObserverManager();

  window.onload = event => {
    // Bottom ads load the last, so need different observer for it even though shares the same div structure and elements
    BottomAdsObserverManager.config = {
      mode: 'addedNode',
      mutTargetChildName: 'line1',
      domLoadedSourceParentNode: BottomAdsPageDivToObserve,
      subtree: false,
    };
    BottomAdsObserverManager.startObserver(changeTaobaoSearchResultPageAdsPriceTag);

    changeTaobaoSearchResultPageAdsPriceTag();
  };

  async function changeTaobaoSearchResultPagePriceTag() {
    const price_wrapper_elements = document.querySelectorAll('[class*="priceWrapper"]');

    for (const price_wrapper_element of price_wrapper_elements as NodeListOf<HTMLElement>) {
      // get Price int and float using more generic selectors
      const price_int_element = findChildThenParentElbyClassName(price_wrapper_element, 'priceInt') as HTMLElement;
      if (!price_int_element) throw Error('price_int_element no value');

      const price_float_element = findChildThenParentElbyClassName(price_wrapper_element, 'priceFloat') as HTMLElement;
      if (!price_float_element) throw Error('price_float_element no value');

      // Extract the text content of priceInt and priceFloat elements
      const price_int = parseFloat(price_int_element.textContent);
      const price_float = parseFloat(price_float_element.textContent) || 0;

      // Combine priceInt and priceFloat into one number
      const original_price = price_int + price_float / 100; // Assuming priceFloat represents cents

      if (!isNaN(original_price)) {
        const converted_price = (original_price * currency_rate).toFixed(2);

        const ancestor = price_wrapper_element.closest('a[class^="Card--doubleCardWrapper"]') as HTMLElement;
        const parent_unwanted_heightstyle= price_wrapper_element.closest('div[class^="Card--doubleCard"]') as HTMLElement;
        parent_unwanted_heightstyle.style.height = 'auto';
        ancestor.style.height = 'fit-content';

        price_int_element.style.fontSize = '17px';
        price_float_element.style.fontSize = '17px';
        price_wrapper_element.style.height = 'fit-content';
        price_wrapper_element.style['align-items'] = 'flex-start';

        const priceSalesSpan = findChildThenParentElbyClassName(price_wrapper_element, 'realSales') as HTMLElement;
        priceSalesSpan.style['line-height'] = '20px';

        //price_wrapper_element.classList.add('taoconvert_pricebox_container');

        const newDiv = document.createElement('div');
        newDiv.className = 'taoconvert_pricebox_container';
        const newDivEl = price_float_element.insertAdjacentElement('afterend', newDiv);

        render(<PriceBox size="sm" convertedPrice={converted_price} currencyChange={currency_change} />, newDivEl);
      }
    }
  }

  function changeTaobaoSearchResultPageAdsPriceTag() {
    const ads_price_wrapper = document.querySelectorAll('.templet ul.item-list li.item');

    // As bottom ads is the last to load, right ads will be rendered first with pricebox, remove it then reprocess with last call
    boxRenderer.removeTrailingTaoConvPricebox(RightAdsPageDivToObserve);

    for (const item of ads_price_wrapper) {
      const ad_price_element = findChildThenParentElbyClassName(item, 'price', 'a') as HTMLElement;
      const ad_price_wrapper_element = findChildThenParentElbyClassName(item, 'line1', 'div') as HTMLElement;

      if (!ad_price_element) {
        console.error(`ad_price_element not found`);
        break;
      } else if (ad_price_element) {
        let original_ad_price: number | string = ad_price_element.textContent;

        // Use a regular expression to match numbers with or without a decimal point
        const matches = original_ad_price.match(/\d+(\.\d+)?|\.\d+/);

        // Check if there are matches and extract the first one
        original_ad_price = matches ? parseFloat(matches[0]) : NaN;

        const converted_price = (original_ad_price * currency_rate).toFixed(2);
        ad_price_element.style['font-size'] = '15px';
        ad_price_wrapper_element.style['height'] = 'fit-content';

        ad_price_element.classList.add('taoconvert_pricebox_container');
        ad_price_element.innerHTML +=
          '<div class="taoconvert_pricebox_tag sm"><i></i><span> ≈ ' +
          converted_price +
          ' ' +
          currency_change +
          '</span></div>';
      }
    }
  }
}

/////////////////////////////////////[https://item.taobao.com/]/////////////////////////////////////
//Affected only in taobao item page
if (location.href.includes('https://item.taobao.com/')) {
  let itemPageDivToObserve = 'div[class^="Item--content"] [class^="BasicContent--itemInfo"]';
  mutObserverManager.config = {
    mode: 'addedText',
    mutTargetChildName: 'Price--priceText',
    domLoadedSourceParentNode: itemPageDivToObserve,
    subtree: true,
  };
  let ran_before = false;

  try {
    mutObserverManager.startObserver(() => {
      boxRenderer.removeTrailingTaoConvPricebox();

      const itempage_price_elements = document.querySelectorAll("[class^='Price--priceText']");
      let itempage_extra_price_el;
      let itempage_origin_price_el;

      Array.from(itempage_price_elements).forEach(el => {
        itempage_extra_price_el = findChildThenParentElbyClassName(el, 'extraPrice');
        itempage_origin_price_el = findChildThenParentElbyClassName(el, 'originPrice');
      });

      if (itempage_extra_price_el) {
        boxRenderer.removeTrailingTaoConvPricebox();

        const price_wrapper_el = itempage_extra_price_el.closest('[class^="Price--root"]');
        boxRenderer.createPriceBox(price_wrapper_el, '');
      } else if (itempage_origin_price_el) {
        boxRenderer.removeTrailingTaoConvPricebox();

        const price_wrapper_el = itempage_origin_price_el.closest('[class^="Price--root"]');
        boxRenderer.createPriceBox(price_wrapper_el, '');
      }

      createDownloadListsButton();
    });
  } catch (e) {
    if (e.errorCode == 'elementNotFound') {
      itemPageDivToObserve = 'ul.tb-meta';
      mutObserverManager.config = {
        mode: 'addedText',
        mutTargetChildName: 'tb-rmb-num',
        domLoadedSourceParentNode: itemPageDivToObserve,
        subtree: true,
      };

      mutObserverManager.startObserver(() => {
        boxRenderer.removeTrailingTaoConvPricebox();

        const promo_price_element = document.querySelector('strong.tb-promo-price');
        const original_price_element = document.getElementById('J_StrPrice');

        if (promo_price_element) {
          boxRenderer.createPriceBox(original_price_element, 'md');

          const promo_price_parent = document.querySelector('div#J_PromoHd');
          boxRenderer.createPriceBox(promo_price_element, '', promo_price_parent);
        } else boxRenderer.createPriceBox(original_price_element, 'lg');
      });
    }
  }

  function createDownloadListsButton() {
    if (ran_before === false) {
      const item_header_el = document.querySelector('[class^="ItemHeader--subTitle"]');
      const root_dom = document.querySelector('#root');

      const new_button_wrapper = document.createElement('div');
      new_button_wrapper.className = 'tao_convert_download_button';

      const new_modal_wrapper = document.createElement('div');
      new_modal_wrapper.className = 'taomodal_image_gallery_wrapper';
      Object.assign(new_modal_wrapper.style, {
        position: 'relative',
        top: '0',
        left: '0',
        zIndex: '9999999',
      });

      item_header_el.appendChild(new_button_wrapper);
      root_dom.appendChild(new_modal_wrapper);

      taoDownloader();

      render(
        <MultiStepFormInDialog shadowRootButton={new_button_wrapper} shadowRootModal={new_modal_wrapper} />,
        new_button_wrapper,
      );

      ran_before = true;
    }
  }
}

/////////////////////////////////////[https://detail.tmall.com]/////////////////////////////////////
//effect only in taobao item detail tmall page
const urlPattern = /^https?:\/\/(.*\.)?detail\.tmall\.com/;

if (urlPattern.test(location.href)) {
  //if this component load start the script
  const TmallPageDivToObserve = '[class*="originPrice"]';

  mutObserverManager.config = {
    mode: 'addedText',
    mutTargetChildName: 'Price--priceText',
    domLoadedSourceParentNode: TmallPageDivToObserve,
    subtree: true,
  };
  mutObserverManager.startObserver(changeTmallPagePriceTag);

  function changeTmallPagePriceTag() {
    const tmall_price_elements = document.querySelectorAll("[class^='Price--priceText']");
    let tmall_extra_price_el;
    let tmall_origin_price_el;

    Array.from(tmall_price_elements).forEach(el => {
      tmall_extra_price_el = findChildThenParentElbyClassName(el, 'Price--extraPrice');
      tmall_origin_price_el = findChildThenParentElbyClassName(el, 'Price--originPrice');
    });

    if (tmall_extra_price_el) {
      boxRenderer.removeTrailingTaoConvPricebox();
      const tmall_price = tmall_extra_price_el.textContent;

      // Get the main wrapper for discount price element so that we can style it
      let salePriceRelativeWrapElement = tmall_extra_price_el.closest('[class^="Price--sale--"]');
      salePriceRelativeWrapElement = salePriceRelativeWrapElement
        ? salePriceRelativeWrapElement
        : tmall_extra_price_el.closest('[class^="Price--root"]');

      if (salePriceRelativeWrapElement) {
        boxRenderer.createPriceBox(tmall_extra_price_el, 'lg', salePriceRelativeWrapElement);
      } else throw Error('no price wrapper element found');
      salePriceRelativeWrapElement.style['margin-bottom'] = '5px';
    } else if (tmall_origin_price_el) {
      boxRenderer.removeTrailingTaoConvPricebox();

      let tmall_price = tmall_origin_price_el.textContent;
      // Use a regular expression to match numbers with or without a decimal point
      const matches = tmall_price.match(/\d+(\.\d+)?|\.\d+/);

      // Check if there are matches and extract the first one
      tmall_price = matches ? parseFloat(matches[0]) : NaN;
      const converted_price = (tmall_price * currency_rate).toFixed(2);
      tmall_origin_price_el.style['margin-right'] = '10px';

      const priceSaleParentElement = tmall_origin_price_el.closest('[class^="Price--sale--"]');
      const normalPriceWrapParentElement = tmall_origin_price_el.closest('[class^="Price--root"]');

      const selectedWrapperElement = priceSaleParentElement ? priceSaleParentElement : normalPriceWrapParentElement;

      selectedWrapperElement.style['margin-bottom'] = '10px';
      boxRenderer.createPriceBox(selectedWrapperElement, '');
    }
  }
}
