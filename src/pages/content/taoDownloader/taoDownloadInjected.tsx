import Result from 'postcss/lib/result';
import dataStore, { loadState } from '../../../shared/storages/reviewItemSkuBase';
import { DOMTools, MutationObserverManager, promisify } from '../utils/misc';
import { processReviewTab } from './reviewTabInjected';
const mutObserverManager = new MutationObserverManager();

export async function taoDownloader() {
  await loadState.setLoad(true);

  const all_sku_items = document.querySelectorAll('div.skuItemWrapper .skuItem');

  let { href: currentURL, origin: domain, search: queryString, pathname } = window.location;
  const queryParams = new URLSearchParams(queryString);
  queryString = queryString.substring(1);

  /**
   * All these complexity for api call on taobao!
   * Extracting all query paramters from item.taobao.com/item.htm? url
   */
  const arrayParamKeys = Array.from(queryParams.keys());

  // Fix weird urlsearchparam bug where first key is the whole url itself
  const exParams: { id?: string } = {};
  arrayParamKeys.forEach(key => {
    exParams[key] = queryParams.get(key);
  });

  /**
        * example of json h5api_data
        * "skuBase.skus": [
                {
                    "propPath": "1627207:30146346867;20122:368194910;20105:103646",
                    "skuId": "5311150259765"
        * where the first segment 1627207:30146346867, refer to main product title
        * 20122:368194910;20105:103646 variation of product
        * ----------------------------------------------------------------------------------
        * "skuBase.props": [
                {
                    "hasImage": "true",
                    "name": "颜色分类",
                    "nameDesc": "（24）",
                    "pid": "1627207",
                    "values": [
                        {
                            "image": "https://gw.alicdn.com/bao/uploaded/i4/3372205069/O1CN01wTKOK81nJeZ6el0k7_!!3372205069.jpg",
                            "name": "幻14白-R9-5900HS/RTX3060/2K/120Hz/14英寸（质保6个月）",
                            "sortOrder": "0",
                            "vid": "30146346867"}
        *       {
                    "hasImage": "false",
                    "name": "硬盘容量",
                    "pid": "20122",
                    "values": [
                        {
                            "name": "1T固态硬盘",
                            "sortOrder": "1",
                            "vid": "368194910"
                        }]
        *----------------------------------------------------------------------------------------
        *  "skuCore.sku2info": {
        *    "5311150259765": {
                    "logisticsTime": "48小时内发货",
                    "moreQuantity": "false",
                    "price": {
                        "priceActionText": "前往手淘查看更多优惠",
                        "priceActionType": "buy_in_mobile",
                        "priceMoney": "539900",
                        "priceText": "5399"
                    },
                    "quantity": "0",
                    "quantityText": "无货"
                },
        */

  const existing_local_stored_chrome = await dataStore.get();

  const existing_local_stored_chrome_nonempty = Object.values(existing_local_stored_chrome).reduce(
    (all_not_empty, current_array) => {
      return all_not_empty && Array.isArray(current_array) && current_array.length > 0;
    },
    true,
  );
  
  if (existing_local_stored_chrome_nonempty) return;

  const [h5api_data, remapped_review_data] = await Promise.allSettled([
    new Promise(resolve => {
      const url_param_data = {
        id: queryParams.get('id'),
        detail_v: '3.3.2',
        exParams: JSON.stringify({
          ...exParams,
          queryString,
          domain,
          path_name: pathname,
        }),
      };

      //resolve({ data: 'ds' })
      chrome.runtime.sendMessage({ msg_action: 'buyertrade:get_itempage_products', url_param_data }, h5api_data => {
        resolve(h5api_data);
      });
    }),
    // processReviewTab(),
  ]);

  if (h5api_data.status === 'fulfilled') {
    const {
      data: { skuBase, skuCore },
    } = h5api_data.value as { data: any };

    function matchSkuBase(to_match_pid, to_match_vid, option: 'inner' | 'outer') {
      if (option == 'inner')
        return skuBase.props.find(p => p.pid === to_match_pid)?.values?.find(v => v.vid === to_match_vid);
      else if (option == 'outer') return skuBase.props.find(p => p.pid === to_match_pid);
    }

    const remapped_skubase_data = skuBase.skus.reduce((groupedMap, { propPath, skuId }) => {
      const prop_path_segments = propPath.split(';');
      const [main_product_pid, main_product_vid] = prop_path_segments[0].split(':').map(i => i.trim());
      const main_product_skubase_prop = matchSkuBase(main_product_pid, main_product_vid, 'inner');

      const main_product_title = main_product_skubase_prop?.name;
      const main_product_image = main_product_skubase_prop?.image;

      const sku2info: Sku2Info = skuCore.sku2info;
      const { price, quantity } = sku2info[skuId] || { price: {}, quantity: '' };

      //only iterate the last two or more segment of the propPath depends on categorylist
      const prop_keys = prop_path_segments.slice(1).reduce(
        (accum, segment) => {
          const [pid, vid] = segment.split(':').map(item => item.trim());
          accum.categories_path += `${matchSkuBase(pid, vid, 'outer')?.name}/`;
          accum.values_key_categories += `${matchSkuBase(pid, vid, 'inner')?.name}/`;
          return accum;
        },
        { categories_path: '', values_key_categories: '' },
      );

      const { categories_path, values_key_categories } = prop_keys;

      const existingEntry = groupedMap.find(entry => entry.main_product_title === main_product_title);

      // If the categories_path is not empty, then the entry have variation_names of the main product
      // Do take note some of the main_product doesn't have any variation_names
      const is_not_emptycategories = categories_path !== '' && values_key_categories !== '';

      if (!existingEntry) {
        const groupedMap_template = {
          main_product_title,
          image: main_product_image || '',
          values: { [values_key_categories.slice(0, -1)]: { price: price?.priceText, quantity } },
        };

        // If main product does have variation, then add the variation_names to the groupedMap_template
        // If not, then just add the price and quantity to the groupedMap_template
        if (is_not_emptycategories) {
          groupedMap.push({ ...groupedMap_template, variation_names: categories_path.slice(0, -1) });
        } else {
          groupedMap.push({ ...groupedMap_template, value: { price: price?.priceText, quantity } });
        }
      } else {
        // If main product does have variation and there's existing entry, just update values of the existing entry
        if (is_not_emptycategories)
          existingEntry.values[values_key_categories.slice(0, -1)] = { price: price?.priceText, quantity };
        else existingEntry.value = { price: price?.priceText, quantity };
      }

      /**
             * Example returned groupedMap data
             * {
                  "product": {
                    "image": "https://gw.alicdn.com/bao/uploaded/i1/3372205069/O1CN01CZaxn71nJeaWpu1xt_!!3372205069.jpg",
                    "main_product_title": "幻14经典灰-R7-6800HS/RX-6700S/2K/120Hz/14英寸",
                    "values": [
                      {
                        "1T固态硬盘/16GB":['6499', '5']
                      },
                      {
                        "1T固态硬盘/24GB":['6899', '3']
                      },
                      {
                        "1T固态硬盘/40GB":['7599', '5']
                      }
                    ]
                  }
                }

             */
      return groupedMap;
    }, []);

    // Update the data store with the grouped information
    await dataStore.updateRemappedSkuBase(remapped_skubase_data);
  } else {
    throw new Error('remapped_sku_base failed!');
  }

  if (remapped_review_data.status == 'fulfilled') {
    await dataStore.updateRemappedReviewData(remapped_review_data.value as any);
  } else if (remapped_review_data.status == 'rejected') {
    throw Error(
      `remapped_review_data failed! Do click on the review tab to load the review data first! Reason: ${remapped_review_data?.reason}`,
    );
  }

  all_sku_items.forEach(sku_item => {
    const product_title = sku_item.querySelector('div[title]')?.textContent;
    const product_image = sku_item.querySelector('img[class="skuIcon"]')?.getAttribute('src');
  });

  await loadState.setLoad(false);
}
