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

    const findParentOfDeepestNonEmptyObject = (obj, path = [], parentKey = null) => {
        let emptyKey = null;
        let lastNonEmptyKey = null;
        for (let key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (Object.keys(obj[key]).length === 0) {
                    emptyKey = key;
                } else {
                    lastNonEmptyKey = key;
                    let result = findParentOfDeepestNonEmptyObject(obj[key], [...path, key]);
                    if (result) return result;
                }
            }
        }
        if (emptyKey) {
            return [...path, emptyKey];
        } else if (lastNonEmptyKey) {
            // Remove the lastNonEmptyKey from the path to get its parent
            path.pop();
            return path;
        } else {
            return null;
        }
    }

    const handleCheckboxChange = ({
        main_product_title,
        variant: { current_variant_val = undefined, current_variant_key = undefined } = {},
    }) => {
        if (!current_variant_val && main_product_title) {
            setMainProductTitleState(prev_prod_title => {
                if (prev_prod_title.includes(main_product_title)) {
                    setSelectedVariantsState(prevSelectedVariants => {
                        return prevSelectedVariants.filter(item => Object.keys(item)[0] !== main_product_title);
                    });
                    return prev_prod_title.filter(title => title !== main_product_title);
                }
                return [...prev_prod_title, main_product_title];
            });
            return;
        }

        // const current_variant_key = Object.keys(productVariationsData).find(key =>
        //     Object.values(productVariationsData[key]).includes(current_variant_val),
        // );

        setSelectedVariantsState(prevSelectedVariants => {
            const existingIndex = prevSelectedVariants.findIndex(item => Object.keys(item)[0] === main_selected_prod_key);

            if (existingIndex !== -1) {
                const existing_product_obj = prevSelectedVariants[existingIndex];
                const existing_variant_objs = existing_product_obj[main_selected_prod_key];

                // Check if the selected_variants_key already exists
                if (existing_variant_objs.hasOwnProperty(current_variant_key)) {
                    // Check if the current_variant_val already exists for the selected_variants_key
                    if (!existing_variant_objs[current_variant_key].hasOwnProperty(current_variant_val)) {
                        existing_variant_objs[current_variant_key][current_variant_val] = {};
                    }
                } else {
                    const deepestEmptyObjectKeyPath = findParentOfDeepestNonEmptyObject(existing_variant_objs);
                    const lastKey = Object.keys(productVariationsData).pop();
                    let targetObj = deepestEmptyObjectKeyPath?.slice(0, -1)
                        .reduce((obj, key) => obj[key], existing_variant_objs)

                    let targetKey;

                    if (deepestEmptyObjectKeyPath) {
                        targetKey = deepestEmptyObjectKeyPath[deepestEmptyObjectKeyPath.length - 1];
                    } else {
                        targetKey = current_variant_key;
                    }

                    if (current_variant_key === lastKey) {
                        targetObj[targetKey] = {
                            [current_variant_val]: {
                                price: '', // Add your price value here
                                quantity: '' // Add your quantity value here
                            }
                        };
                    } else {
                        targetObj[targetKey] = {
                            [current_variant_val]: {}
                        };
                    }
                }

                const newProduct = {
                    [main_selected_prod_key]: existing_variant_objs
                };

                const newSelectedVariants = [...prevSelectedVariants];
                newSelectedVariants[existingIndex] = newProduct;

                return newSelectedVariants;
            } else {
                return [
                    ...prevSelectedVariants,
                    {
                        [main_selected_prod_key]: {
                            [current_variant_key]: {
                                [current_variant_val]: {}
                            }
                        }
                    }
                ];
            }
        });
    };

    const isVariantValueSelected = (selectedVariantsState, mainProductTitle, variantKey, variantValue) => {
        return selectedVariantsState.some(item => {
            const mainTitle = Object.keys(item)[0];
            if (mainTitle !== mainProductTitle) {
                return false;
            }
            const selectedVariants = item[mainTitle];
            const selectedVariant = selectedVariants[variantKey];
            return selectedVariant && selectedVariant.hasOwnProperty(variantValue);
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
                        checked={isVariantValueSelected(selectedVariantsState, main_selected_prod_key, current_variant_key, current_variant_val)}
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
