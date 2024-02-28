import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Checkbox from '@radix-ui/react-checkbox';
import useStorage from '../../../../shared/hooks/useStorage';
import dataStore from '../../../../shared/storages/reviewItemSkuBase';
import { CheckIcon } from '@radix-ui/react-icons';

const SelectSkuFirstStep = ({ onSelectSkuText }) => {
    const [selectedSkuTexts, setSelectedSkuTexts] = useState([]);
    const data = useStorage(dataStore)

    const handleCheckboxChange = (skuText) => {
        setSelectedSkuTexts((prevSelected) => {
            if (prevSelected.includes(skuText)) {
                return prevSelected.filter((item) => item !== skuText);
            } else {
                return [...prevSelected, skuText];
            }
        });
    };

    const combineRemappedData = () => {

    }

    const handleNextStep = () => {
        onSelectSkuText(selectedSkuTexts);
    };

    return (
        <>
            <h3 className="mb-4 font-semibold text-gray-900">Choose SKU Texts:</h3>
            <ul className="w-56 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {data.remappedReviewData.map(({ skuText: { category } }, index) => (
                    <li className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600" key={index}>
                        <div className="flex items-center ps-3">
                            <Checkbox.Root
                                className="w-4 h-4 text-blue-900 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                defaultChecked
                                onCheckedChange={handleCheckboxChange}
                                id="c1"
                            >
                                <Checkbox.Indicator className="text-green">
                                    <CheckIcon />
                                </Checkbox.Indicator>
                            </Checkbox.Root>
                            <label className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300" htmlFor="c1">
                                {category}
                            </label>
                        </div>
                    </li>
                ))}
            </ul>
            <button onClick={handleNextStep}>Next Step</button>
        </>
    );
};

export default SelectSkuFirstStep;