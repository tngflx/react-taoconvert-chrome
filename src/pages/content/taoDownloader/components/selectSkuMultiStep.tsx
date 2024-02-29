import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Checkbox from '@radix-ui/react-checkbox';
import useStorage from '../../../../shared/hooks/useStorage';
import dataStore from '../../../../shared/storages/reviewItemSkuBase';
import { CheckIcon } from '@radix-ui/react-icons';

const SelectSkuFirstStep = ({ onSelectSkuText }) => {
    const data = useStorage(dataStore)

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

    return (
        <>
            <h3 className="mb-4 font-semibold text-gray-900">Choose SKU Texts:</h3>
            <div className="flex flex-col">
                <ul className="w-56 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {Object.keys(data.remappedSkuBase).map((mainKey, index) => (
                        <li className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600" key={index}>
                            <div className="flex items-center ps-3">
                                <Checkbox.Root
                                    className="w-4 h-4 text-blue-900 bg-white-200 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    checked={selectedCategories.has(mainKey)}
                                    onCheckedChange={() => handleCheckboxChange(mainKey)}
                                    id={`checkbox_${index}`}
                                >
                                    <Checkbox.Indicator className="text-green">
                                        <CheckIcon />
                                    </Checkbox.Indicator>
                                </Checkbox.Root>
                                <label
                                    className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                                    htmlFor={`checkbox_${index}`}
                                >
                                    {mainKey}
                                </label>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {Object.keys(data.remappedSkuBase).some((mainKey) => !selectedCategories.has(mainKey)) && (
                <div className="flex flex-col ml-8">
                    {Object.keys(data.remappedSkuBase).map((mainKey, index) => (
                        !selectedCategories.has(mainKey) && (
                            <ul key={index}>
                                {Object.keys(data.remappedSkuBase[mainKey]).map((subKey, subIndex) => (
                                    <li key={subIndex}>
                                        <div className="flex items-center ps-3">
                                            <Checkbox.Root
                                                className="w-4 h-4 text-blue-900 bg-white-200 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                                checked={selectedCategories.has(subKey)}
                                                onCheckedChange={() => handleCheckboxChange(subKey)}
                                                id={`checkbox_${index}_${subIndex}`}
                                            >
                                                <Checkbox.Indicator className="text-green">
                                                    <CheckIcon />
                                                </Checkbox.Indicator>
                                            </Checkbox.Root>
                                            <label
                                                className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                                                htmlFor={`checkbox_${index}_${subIndex}`}
                                            >
                                                {subKey}
                                            </label>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                    ))}
                </div>
            )}
            <button onClick={handleNextStep}>Next Step</button>
        </>
    );
}

export default SelectSkuFirstStep;