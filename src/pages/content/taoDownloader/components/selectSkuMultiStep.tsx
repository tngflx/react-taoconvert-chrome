import React, { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import useStorage from '../../../../shared/hooks/useStorage';
import dataStore from '../../../../shared/storages/reviewItemSkuBase';
import { CheckIcon } from '@radix-ui/react-icons';

const SelectSkuFirstStep = ({ onSelectSkuText }) => {
  const data = useStorage(dataStore);

  const [selectedVariants, setSelectedVariants] = useState([]);
  const [mainProductTitle, setMainProductTitle] = useState(null); // New state for storing main_product_title

  const handleCheckboxChange = ({ main_product_title: newTitle, variant }) => {
    setSelectedVariants(prevSelectedVariants => {
      console.log(prevSelectedVariants);
      // Check if the newTitle already exists in selectedVariants
      const existingIndex = prevSelectedVariants.findIndex(item => Object.keys(item)[0] === newTitle);

      if (!variant) {
        setMainProductTitle(newTitle);
        return prevSelectedVariants;
      }

      // Use the saved mainProductTitle if variant is provided
      const main_product_title = mainProductTitle || newTitle;

      // If main_product_title already exists, update its selectedArray with the new variant
      if (existingIndex !== -1) {
        // If the variant is already selected, return the previous state
        if (prevSelectedVariants[existingIndex][main_product_title].selectedArray.includes(variant)) {
          return prevSelectedVariants;
        }

        return prevSelectedVariants.map((item, index) => {
          if (index === existingIndex) {
            return {
              [main_product_title]: {
                selectedArray: [...item[main_product_title].selectedArray, variant],
              },
            };
          }
          return item;
        });
      } else {
        // If main_product_title doesn't exist, add it with the new variant
        return [
          ...prevSelectedVariants,
          {
            [main_product_title]: {
              selectedArray: [variant],
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

  const productVariationsData = () => {
    const uniqueArrays = data.remappedSkuBase
      .reduce((acc, { values, variation_names }) => {
        // If variation_names is undefined, return the accumulator immediately
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

    return Object.entries(uniqueArrays);
  };

  const renderCheckboxes = (variations, previousSelection) =>
    variations.map((variant, index) => (
      <li key={index}>
        <div className="flex items-center ps-3">
          <Checkbox.Root
            className="w-4 h-4 text-blue-400 bg-white-200 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
            checked={selectedVariants.some(v => v[mainProductTitle].selectedArray[0] == variant)}
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
                checked={selectedVariants.some(item => Object.keys(item)[0] === main_product_title)}
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
        {mainProductTitle &&
          productVariationsData().map(([key, variation], index) => (
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
