import React, { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import useStorage from '../../../../shared/hooks/useStorage';
import dataStore from '../../../../shared/storages/reviewItemSkuBase';
import { CheckIcon } from '@radix-ui/react-icons';

const SelectSkuFirstStep = ({ onSelectSkuText }) => {
    const data = useStorage(dataStore);

    const [selectedVariants, setSelectedVariants] = useState([]);

    const handleCheckboxChange = (variant, previousSelection) => {
        const updatedVariants = [...selectedVariants];

        const existingVariantIndex = updatedVariants.findIndex(
            (selectedVariant) => selectedVariant.variant === variant
        );

        if (existingVariantIndex !== -1) {
            // Variant already selected, update its previous selection
            updatedVariants[existingVariantIndex].previousSelection = previousSelection;
        } else {
            // New variant selected, add it to the list
            updatedVariants.push({ variant, previousSelection });
        }

        setSelectedVariants(updatedVariants);
    };

    const handleNextStep = () => {
        onSelectSkuText(selectedVariants);
    };

    const productVariationData = () => {
        const uniqueArrays = data.remappedSkuBase.reduce((acc, { values, variation_names }) => {
            Object.keys(values).forEach((key) => {
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
        }, []).reduce((acc, { variation_names, ...categories }, index) => {
            const variation_name = variation_names.split('/');
            acc[variation_name[index]] = categories;

            return acc;
        }, {});

        return Object.entries(uniqueArrays);
    };

    const renderCheckboxes = (variations, previousSelection) =>
        variations.map((variation, index) => (
            <li key={index}>
                <div className="flex items-center ps-3">
                    <Checkbox.Root
                        className="w-4 h-4 text-blue-400 bg-white-200 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                        checked={selectedVariants.some((v) => v.variant === variation)}
                        onCheckedChange={() => handleCheckboxChange(variation, previousSelection)}
                        id={`checkbox_${variation}_${index}`}
                    >
                        <Checkbox.Indicator className="text-green">
                            <CheckIcon />
                        </Checkbox.Indicator>
                    </Checkbox.Root>
                    <label
                        className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                        htmlFor={`checkbox_${variation}_${index}`}
                    >
                        {variation}
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
                                checked={selectedVariants.some((v) => v.variant === main_product_title)}
                                onCheckedChange={() => handleCheckboxChange(main_product_title, undefined)}
                                id={`checkbox_${main_product_title}_${index}`}
                            >
                                <Checkbox.Indicator className="text-green">
                                    <CheckIcon />
                                </Checkbox.Indicator>
                            </Checkbox.Root>
                            <label
                                className="w-full p-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                                htmlFor={`checkbox_${main_product_title}_${index}`}
                            >
                                {main_product_title}
                            </label>
                        </div>
                    ))}
                </ul>
                {selectedVariants.length > 0 &&
                    productVariationData().map(([key, variation], index) => (
                        <ul key={index} className="w-56 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <li>
                                <label className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    {key}
                                </label>
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