import React, { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import useStorage from '../../../../shared/hooks/useStorage';
import dataStore from '../../../../shared/storages/reviewItemSkuBase';
import { CheckIcon } from '@radix-ui/react-icons';

const SelectSkuFirstStep = ({ onSelectSkuText }) => {
  const data = useStorage(dataStore);

  const productVariationsData = React.useMemo(() => {
    return data.remappedSkuBase
      .reduce((acc, { values, variation_names }) => {
        // If variation_names is undefined, return the accumulator immediately
        // This is due to some products not having any variation_names
        if (!variation_names) {
          return acc;
        }

        Object.keys(values).forEach(key => {
          const components = key.split('/');

          components.forEach((component, index) => {
            acc[index] = acc[index] || [];

            if (!acc[index].includes(component)) {
              acc[index].push(component);
              acc[index]['variation_names'] = variation_names;
            }
          });
        });

        return acc;
      }, [])
      .reduce((acc, { variation_names, ...categories }, index) => {
        const variation_name = variation_names.split('/');
        acc[variation_name[index]] = categories;

        return acc;
      }, {});
  }, [data.remappedSkuBase]);

  const [selectedVariantsState, setSelectedVariantsState] = useState([]);
  const [mainProductTitleState, setMainProductTitleState] = useState([]);
  const main_selected_prod_key =
    mainProductTitleState.length > 0 ? mainProductTitleState[mainProductTitleState.length - 1] : null;

  const handleCheckboxChange = ({
    main_product_title,
    variant: { current_variant_val = undefined, current_variant_key = undefined } = {},
  }) => {
    if (!current_variant_val && main_product_title) {
      setMainProductTitleState(prev_prod_title => {
        // If the main_product_title already exists, remove it from the selectedVariants array and mainProductTitle array
        if (prev_prod_title.includes(main_product_title)) {
          // Totally remove child variants when we uncheck the main product title
          setSelectedVariantsState(prevSelectedVariants => {
            return prevSelectedVariants.filter(item => !Object.keys(item).includes(main_product_title));
          });
          return prev_prod_title.filter(title => title !== main_product_title);
        }
        // If the main_product_title doesn't exist, add it to the mainProductTitle array
        return [...prev_prod_title, main_product_title];
      });
      return;
    }

    setSelectedVariantsState(prevSelectedVariants => {
      // Check if the main_product_title already exists in the selectedVariants array
      const existingIndex = prevSelectedVariants.findIndex(item => Object.keys(item)[0] === main_selected_prod_key);

      /**
       * I want to match when variant only have partial value, e.g. 'Color:Red/' or 'Color:Red/Size:'
       * It means that the current selected variant is truly incomplete yet, and need another pair
       * -------------
       * if the variant is 'Color:Red/', it means that the user only selected the parent variant
       * If the variant is 'Color:Red/Size:', it means that the user selected the parent variant and the child variant
       * --------------------------------------------------------------------
       * Purpose of variant_key is to know the variant_val is in the same key or not
       * if it is same, then don't insert next to /, e.g 'Color:Red/Blue' is wrong
       * if it is not same, then insert next to /, e.g 'Color:Red/Size:Small'
       * --------------------------------------------------------------------
       * The keyPattern will produce 3 groups:
       * 1. Category key (e.g. Color),
       * 2. Variant key (e.g. Red),
       * 3. Variant value (e.g. Size:Small)
       */
      if (existingIndex !== -1) {
        const existing_product = prevSelectedVariants[existingIndex];
        const existing_variant_keysvals = existing_product[main_selected_prod_key];

        const keyPattern = /^(.*):(.*)\/(.*)$/;
        const { is_same_currentNexisting_variant_key, existing_variant_val } = existing_variant_keysvals.reduce(
          (accum, existing_variant_keyval) => {
            // Find the existing_variant_key that doesn't have a value, means only selected the parent variant
            for (const existing_variant_key of Object.keys(existing_variant_keyval)) {
              const match = existing_variant_key?.match(keyPattern);
              if (!match) return false;

              const is_same_variant_key = match[1] === current_variant_key;
              const variant_value1 = match[2];
              const is_empty_variant_value2 = match[3] == '';

              if (is_same_variant_key && is_empty_variant_value2) {
                accum.is_same_currentNexisting_variant_key = is_same_variant_key;
                accum.existing_variant_val = is_empty_variant_value2 ? variant_value1 : '';
              }
            }

            return accum;
          },
          { is_same_currentNexisting_variant_key: false, existing_variant_val: '' },
        );

        // Condition where the second variant_val is empty and not in same category, e.g. 'Color:Red/', then insert data after /
        if (!is_same_currentNexisting_variant_key && existing_variant_val == '') {
          const combined_variants_key = [existing_variant_val, current_variant_val].join('/');
          existing_variant_keysvals[combined_variants_key] = { price: '', quantity: '' };

          // Condition where the second variant_val is empty and in same category and not same value as previous, create new key
        } else if (
          is_same_currentNexisting_variant_key &&
          existing_variant_val != '' &&
          existing_variant_val != current_variant_val
        ) {
          existing_variant_keysvals.push({
            [`${current_variant_key}:${current_variant_val}/`]: { price: '', quantity: '' },
          });

          // Condition for deletion when current_variant_val is same as existing_variant_val and in same category,
        } else if (is_same_currentNexisting_variant_key && existing_variant_val == current_variant_val) {
          const data = existing_variant_keysvals.filter(existing_variant_keyval =>
            Object.keys(existing_variant_keyval).forEach(existing_variant_key => {
              const match = existing_variant_key?.match(keyPattern);
              if (!match) return false;
              return match[2] !== current_variant_val;
            }),
          );
          console.log('data', data);
        }
        return [...prevSelectedVariants];
      } else {
        // If main_selected_prod_key doesn't exist, add it to the selected_variants_key array
        return [
          ...prevSelectedVariants,
          {
            [main_selected_prod_key]: [
              { [`${current_variant_key}:${current_variant_val}/`]: { price: '', quantity: '' } },
            ],
          },
        ];
      }
    });
  };

  const handleNextStep = () => {
    console.log('selectedVariants', selectedVariantsState);
    console.log('mainProductTitle', mainProductTitleState);
    // onSelectSkuText(selectedVariants);
  };

  const renderCheckboxes = (variant_values, current_variant_key) =>
    variant_values.map((current_variant_val, index) => (
      <li key={index}>
        <div className="flex items-center ps-3">
          <Checkbox.Root
            className="w-4 h-4 text-blue-400 bg-white-200 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
            checked={selectedVariantsState.some(v => {
              const selected_variants_key = Object.keys(productVariationsData).find(key =>
                Object.values(productVariationsData[key]).includes(current_variant_val),
              );
              return v[main_selected_prod_key]?.[selected_variants_key]?.includes(current_variant_val);
            })}
            onCheckedChange={() =>
              handleCheckboxChange({
                main_product_title: undefined,
                variant: { current_variant_val, current_variant_key },
              })
            }
            id={`checkbox_${current_variant_val}_${index}`}>
            <Checkbox.Indicator className="text-green">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label
            className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            htmlFor={`checkbox_${current_variant_val}_${index}`}>
            {current_variant_val}
          </label>
        </div>
      </li>
    ));

  return (
    <>
      <h3 className="mb-4 font-semibold text-gray-900">Choose SKU Texts:</h3>
      <div className="flex flex-row">
        <ul className="w-56 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          {data.remappedSkuBase.map(({ main_product_title }, index) => (
            <div className="flex items-center ps-3" key={index}>
              <Checkbox.Root
                className="w-4 h-4 text-blue-400 bg-green-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                checked={mainProductTitleState?.includes(main_product_title)}
                onCheckedChange={() => handleCheckboxChange({ main_product_title, variant: undefined })}
                id={`checkbox_${main_product_title}_${index}`}>
                <Checkbox.Indicator className="text-green">
                  <CheckIcon />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label
                className="w-full p-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                htmlFor={`checkbox_${main_product_title}_${index}`}>
                {main_product_title}
              </label>
            </div>
          ))}
        </ul>
        {mainProductTitleState.length > 0 &&
          Object.entries(productVariationsData).map(([key, variation], index) => (
            <ul
              key={index}
              className="w-56 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <li>
                <label className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">{key}</label>
                {renderCheckboxes(Object.values(variation), key)}
              </li>
            </ul>
          ))}
      </div>
      <button onClick={handleNextStep}>Next Step</button>
    </>
  );
};

export default SelectSkuFirstStep;
