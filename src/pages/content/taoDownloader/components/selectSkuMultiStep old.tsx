import React, { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import useStorage from '../../../../shared/hooks/useStorage';
import dataStore from '../../../../shared/storages/dataStore';
import { CheckIcon } from '@radix-ui/react-icons';
import { ObjectMgr } from '../../utils/objectMgr';
import { useRef } from 'react';
const objectMgr = new ObjectMgr();

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
    const [keyToObserveState, setKeyToObserveState] = useState({});
    const main_selected_prod_key = keyToObserveState?.["main_product_title"] || '';
    const target_key_to_observe = keyToObserveState?.["parentKey"] || '';
    const clickCount = useRef(0);

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

    const handleCheckboxChange = ({
        main_product_title,
        variant: { current_variant_val = undefined, current_variant_key = undefined } = {},
    }) => {
        if (!current_variant_val && main_product_title) {
            setKeyToObserveState(prev_obj_to_observe => {
                let new_key_to_observe = { ...prev_obj_to_observe };

                if (new_key_to_observe?.["main_product_title"] === main_product_title) {
                    new_key_to_observe["main_product_title"] = {};
                    setSelectedVariantsState(prevSelectedVariants => {
                        return prevSelectedVariants.filter(item => Object.keys(item)[0] !== main_product_title);
                    });
                } else {
                    new_key_to_observe = {
                        main_product_title,
                    };
                }
                return new_key_to_observe;
            });
            return;
        }

        setSelectedVariantsState(prevSelectedVariants => {
            // This is deep cloning the array of objects, shallow cloning is this [...prevSelectedVariants]
            const deep_cloned_prevselectvariants = prevSelectedVariants.map(variant => ({ ...variant }));

            const existing_variant_index = deep_cloned_prevselectvariants.findIndex(item => Object.keys(item)[0] === main_selected_prod_key);
            const current_combined_vkey = current_variant_key ? `${current_variant_key}/${current_variant_val}` : current_variant_val;

            if (existing_variant_index !== -1) {
                const existing_product_obj = deep_cloned_prevselectvariants[existing_variant_index];
                const existing_variant_objs = existing_product_obj[main_selected_prod_key];

                // Get the last key that is not nested
                const last_key_prodvdata_notnested = Object.keys(productVariationsData).pop();
                const is_existing_same_current_vkey = Object.keys(existing_variant_objs).find(key => key.includes(current_variant_key));

                // Check if the variant key already exists
                if (existing_variant_objs.hasOwnProperty(current_combined_vkey) || existing_variant_objs[target_key_to_observe]?.hasOwnProperty(current_combined_vkey)) {
                    clickCount.current = clickCount.current + 1;
                    if (clickCount.current === 1) {
                        setTimeout(() => {
                            if (clickCount.current === 1) {
                                setKeyToObserveState(prev_obj_to_observe => ({
                                    ...prev_obj_to_observe,
                                    parentKey: current_combined_vkey
                                }));
                            }
                            clickCount.current = 0;
                        }, 300);
                    } else if (clickCount.current === 2) {
                        const updatedVariantObjs = Object.fromEntries(
                            Object.entries(existing_variant_objs).filter(([key]) => {
                                return key !== current_combined_vkey
                            })
                        );
                        existing_product_obj[main_selected_prod_key] = updatedVariantObjs;

                        // Reset clickCount
                        clickCount.current = 0;

                        setKeyToObserveState((prev_obj_to_observe: { parentKey?: string }) => {
                            const updatedState = { ...prev_obj_to_observe };
                            const parentKey = Object.keys(updatedVariantObjs).pop();

                            if (parentKey) {
                                updatedState.parentKey = parentKey;
                            } else {
                                delete updatedState.parentKey;
                            }

                            return updatedState;
                        });
                        // Return the updated array for the state update
                    }
                    return deep_cloned_prevselectvariants;
                } else {
                    // Variant key doesn't exist, add it with price and quantity
                    const deepestObjectWEmpty = objectMgr.findObject({ obj: existing_variant_objs, flag: ObjectMgr.FIND_EMPTY_VALUE });
                    let targetObj = deepestObjectWEmpty || existing_variant_objs;
                    let targetKey = current_combined_vkey;

                    // Traverse to the deepest empty object
                    if (deepestObjectWEmpty) {
                        const keys = Object.keys(deepestObjectWEmpty);
                        targetKey = keys.length > 0 ? keys[keys.length - 1] : current_combined_vkey;
                    } else if (!deepestObjectWEmpty && !is_existing_same_current_vkey) {
                        targetKey = Object.keys(existing_variant_objs).pop() || current_combined_vkey;
                    }

                    // If the current_variant_key is the last key, add price and quantity
                    if (last_key_prodvdata_notnested === current_variant_key) {
                        targetObj[targetKey] = { ...targetObj[targetKey], [current_combined_vkey]: { price: '', quantity: '' } };
                    } else {
                        targetObj[targetKey] = { ...targetObj[targetKey] };
                    }

                    setKeyToObserveState(prev_obj_to_observe => ({
                        ...prev_obj_to_observe,
                        parentKey: targetKey
                    }));
                }


                const newProduct = {
                    [main_selected_prod_key]: existing_variant_objs
                };

                const newSelectedVariants = [...prevSelectedVariants];
                newSelectedVariants[existing_variant_index] = newProduct;

                return newSelectedVariants;
            } else {
                // Product doesn't exist in the state, add it with the variant key and its price and quantity
                setKeyToObserveState(prev_obj_to_observe => ({
                    ...prev_obj_to_observe,
                    parentKey: current_combined_vkey
                }));

                return [
                    ...prevSelectedVariants,
                    {
                        [main_selected_prod_key]: {
                            [current_combined_vkey]: {}
                        }
                    }
                ];
            }
        });

    };

    const isVariantValueSelected = (variantKey) => {
        let deepestMatchFound = false;

        const checkNestedVariant = (selectedVariants, currentParentKey) => {
            Object.keys(selectedVariants).forEach((key) => {
                if (selectedVariants.hasOwnProperty(variantKey)) {
                    deepestMatchFound = true;
                    return;
                }
                if (key == currentParentKey && selectedVariants[key] instanceof Object && Object.keys(selectedVariants[key]).includes(variantKey)) {
                    checkNestedVariant(selectedVariants[key], currentParentKey);
                }
            });
        };

        selectedVariantsState.some((item) => {
            const mainTitle = Object.keys(item)[0];
            if (mainTitle !== main_selected_prod_key) {
                return false;
            }
            const selectedVariants = item[mainTitle];
            const parentKey = keyToObserveState?.["parentKey"] || '';

            checkNestedVariant(selectedVariants, parentKey);
        });

        // If the variant key does not exist in the selectedVariantsState, return false
        if (!deepestMatchFound) {
            return false;
        }

        return deepestMatchFound;
    };

    const handleNextStep = () => {
        console.log('selectedVariants', selectedVariantsState);
        console.log('objToObserve', keyToObserveState);
        // onSelectSkuText(selectedVariants);
    };

    const renderCheckboxes = (variant_values, current_variant_key) =>
        variant_values.map((current_variant_val, index) => (
            <li key={index}>
                <div className="flex items-center ps-3">
                    <Checkbox.Root
                        className="w-4 h-4 text-blue-400 bg-white-200 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                        checked={isVariantValueSelected(`${current_variant_key}/${current_variant_val}`)}
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
            <div className="flex flex-row space-x-2">
                <ul className="w-fit text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {data.remappedSkuBase.map(({ main_product_title }, index) => (
                        <div className="flex items-center ps-3" key={index}>
                            <Checkbox.Root
                                className="w-4 h-4 text-blue-400 bg-green-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                checked={keyToObserveState?.["main_product_title"] === main_product_title}
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
                {keyToObserveState?.["main_product_title"] == main_selected_prod_key &&
                    Object.entries(productVariationsData).map(([key, variation], index) => (
                        <ul
                            key={index}
                            className="w-2/5 p-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
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