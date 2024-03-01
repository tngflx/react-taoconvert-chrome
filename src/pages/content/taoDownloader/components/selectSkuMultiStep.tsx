import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Checkbox from '@radix-ui/react-checkbox';
import useStorage from '../../../../shared/hooks/useStorage';
import dataStore from '../../../../shared/storages/reviewItemSkuBase';
import { CheckIcon } from '@radix-ui/react-icons';

const SelectSkuFirstStep = ({ onSelectSkuText }) => {
    const data = useStorage(dataStore);

    const [selectedCategories, setSelectedCategories] = useState(new Set());

    const handleCheckboxChange = (category) => {
        const updatedCategories = new Set(selectedCategories);
        if (updatedCategories.has(category)) {
            updatedCategories.delete(category);
        } else {
            updatedCategories.add(category);
        }
        setSelectedCategories(updatedCategories);
    };

    const handleNextStep = () => {
        onSelectSkuText(selectedCategories);
    };

    const deDuplicateData = () => {
        const uniqueArrays = data.remappedSkuBase.reduce((acc, { values }) => {
            Object.keys(values).forEach((key) => {
                const components = key.split('/');

                components.forEach((component, index) => {
                    acc[index] = acc[index] || [];

                    if (!acc[index].includes(component)) {
                        acc[index].push(component);
                    }
                });
            });

            return acc;
        }, []);

        return uniqueArrays;
    }

    const renderCheckboxes = (mainKey, segments) =>
        segments.map((segment, index) => (
            <li key={index}>
                <div className="flex items-center ps-3">
                    <Checkbox.Root
                        className="w-4 h-4 text-blue-400 bg-white-200 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                        checked={selectedCategories.has(segment)}
                        onCheckedChange={() => handleCheckboxChange(segment)}
                        id={`checkbox_${mainKey}_${index}`}
                    >
                        <Checkbox.Indicator className="text-green">
                            <CheckIcon />
                        </Checkbox.Indicator>
                    </Checkbox.Root>
                    <label
                        className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                        htmlFor={`checkbox_${mainKey}_${index}`}
                    >
                        {segment}
                    </label>
                </div>
            </li>
        ));

    return (
        <>
            <h3 className="mb-4 font-semibold text-gray-900">Choose SKU Texts:</h3>
            <div className="flex flex-row">
                <ul className="w-56 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {data.remappedSkuBase.map(({ main_product_title }, index) => {
                        return (
                            <div className="flex items-center ps-3">
                                <Checkbox.Root
                                    className="w-4 h-4 text-blue-400 bg-white-200 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    checked={selectedCategories.has(main_product_title)}
                                    onCheckedChange={() => handleCheckboxChange(main_product_title)}
                                    id={`checkbox_${main_product_title}_${index}`}
                                >
                                    <Checkbox.Indicator className="text-green">
                                        <CheckIcon />
                                    </Checkbox.Indicator>
                                </Checkbox.Root>
                                <label
                                    className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                                    htmlFor={`checkbox_${main_product_title}_${index}`}
                                >
                                    {main_product_title}
                                </label>
                            </div>
                        );
                    })}
                </ul>
                {selectedCategories.size > 0 && (
                    <ul>
                        {deDuplicateData().map((segment, index) => (
                            <li key={index}>
                                <div>
                                    <label className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                        {segment}
                                    </label>
                                    {renderCheckboxes(data, segment)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <button onClick={handleNextStep}>Next Step</button>
        </>
    );
};

export default SelectSkuFirstStep;