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

  const [selectedVariants, setSelectedVariants] = useState([]);
  const [mainProductTitle, setMainProductTitle] = useState([]);
  const main_selected_prod_key = mainProductTitle.length > 0 ? mainProductTitle[mainProductTitle.length - 1] : null;

  const handleCheckboxChange = ({ main_product_title, variant }) => {
    if (!variant && main_product_title) {
      setMainProductTitle(prev_prod_title => {
        // If the main_product_title already exists, remove it from the selectedVariants array and mainProductTitle array
        if (prev_prod_title.includes(main_product_title)) {
          setSelectedVariants(prevSelectedVariants => {
            return prevSelectedVariants.filter(item => !Object.keys(item).includes(main_product_title));
          });
          return prev_prod_title.filter(title => title !== main_product_title);
        }
        // If the main_product_title doesn't exist, add it to the mainProductTitle array
        return [...prev_prod_title, main_product_title];
      });
      return;
    }

    const selected_variants_key = Object.keys(productVariationsData).find(key =>
      Object.values(productVariationsData[key]).includes(variant),
    );

    setSelectedVariants(prevSelectedVariants => {
      // Check if the main_product_title already exists in the selectedVariants array
      const existingIndex = prevSelectedVariants.findIndex(item => Object.keys(item)[0] === main_selected_prod_key);

      // If main_selected_prod_key exists, update its corresponding object with the new variant
      if (existingIndex !== -1) {
        const existing_product = prevSelectedVariants[existingIndex];
        const existing_product_key = existing_product[main_selected_prod_key];
        const existing_variant_key = existing_product_key[selected_variants_key];

        // If the variant already exists, remove it from the existing_variant_key array
        if (existing_variant_key?.includes(variant)) {
          const updatedVariants = existing_variant_key.filter(child => child !== variant);
          existing_variant_key[selected_variants_key] = updatedVariants;
          return [...prevSelectedVariants];
        }

        // Now you can use the shorter references in your code
        if (Array.isArray(existing_variant_key)) {
          existing_variant_key.push(variant);
        } else {
          existing_product_key[selected_variants_key] = [variant];
        }
        return [...prevSelectedVariants];

      } else {
        // If main_selected_prod_key doesn't exist, add it to the selected_variants_key array
        return [
          ...prevSelectedVariants,
          {
            [main_selected_prod_key]: {
              [selected_variants_key]: [variant],
            },
          },
        ];
      }
    });
  };

  const handleNextStep = () => {
    console.log('selectedVariants', selectedVariants);
    console.log('mainProductTitle', mainProductTitle);
    // onSelectSkuText(selectedVariants);
  };

  const renderCheckboxes = (variations, previousSelection) =>
    variations.map((variant, index) => (
      <li key={index}>
        <div className="flex items-center ps-3">
          <Checkbox.Root
            className="w-4 h-4 text-blue-400 bg-white-200 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
            checked={selectedVariants.some(v => {
              const selected_variants_key = Object.keys(productVariationsData).find(key =>
                Object.values(productVariationsData[key]).includes(variant),
              );
              return v[main_selected_prod_key]?.[selected_variants_key]?.includes(variant);
            })}
            onCheckedChange={() => handleCheckboxChange({ main_product_title: undefined, variant })}
            id={`checkbox_${variant}_${index}`}>
            <Checkbox.Indicator className="text-green">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label
            className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            htmlFor={`checkbox_${variant}_${index}`}>
            {variant}
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
                checked={mainProductTitle?.includes(main_product_title)}
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
        {mainProductTitle.length > 0 &&
          Object.entries(productVariationsData).map(([key, variation], index) => (
            <ul
              key={index}
              className="w-56 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <li>
                <label className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">{key}</label>
                {renderCheckboxes(Object.values(variation), selectedVariants)}
              </li>
            </ul>
          ))}
      </div>
      <button onClick={handleNextStep}>Next Step</button>
    </>
  );
};

export default SelectSkuFirstStep;
