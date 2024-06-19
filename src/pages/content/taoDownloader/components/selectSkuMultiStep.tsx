import React, { useState, useMemo, useRef } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import useStorage from '../../../../shared/hooks/useStorage';
import dataStore from '../../../../shared/storages/reviewItemSkuBase';
import { CheckIcon } from '@radix-ui/react-icons';
import { ObjectMgr } from '../../utils/objectMgr';
const objectMgr = new ObjectMgr();

const SelectSkuFirstStep = ({ onSelectSkuText }) => {
    const data = useStorage(dataStore);

    const productVariationsData = useMemo(() => {
        return data.remappedSkuBase
            .reduce((acc, { values, variation_names }) => {
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

    const updateNestedVariants = (variants, keys, value) => {
        const lastKey = keys.join('/');
        const parentKeys = keys.slice(0, -1).join('/');

        if (!variants[parentKeys]) {
            variants[parentKeys] = {};
        }
        variants[parentKeys][lastKey] = value;
    };

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
            const deep_cloned_prevselectvariants = prevSelectedVariants.map(variant => ({ ...variant }));

            const existing_variant_index = deep_cloned_prevselectvariants.findIndex(item => Object.keys(item)[0] === main_selected_prod_key);
            const current_combined_vkey = `${current_variant_key}/${current_variant_val}`;

            if (existing_variant_index !== -1) {
                const existing_product_obj = deep_cloned_prevselectvariants[existing_variant_index];
                const existing_variant_objs = existing_product_obj[main_selected_prod_key];

                if (existing_variant_objs[target_key_to_observe]?.hasOwnProperty(current_combined_vkey)) {
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
                            Object.entries(existing_variant_objs).filter(([key]) => key !== current_combined_vkey)
                        );
                        existing_product_obj[main_selected_prod_key] = updatedVariantObjs;

                        clickCount.current = 0;

                        setKeyToObserveState(prev_obj_to_observe => {
                            const updatedState = { ...prev_obj_to_observe };
                            const parentKey = Object.keys(updatedVariantObjs).pop();

                            if (parentKey) {
                                updatedState.parentKey = parentKey;
                            } else {
                                delete updatedState.parentKey;
                            }

                            return updatedState;
                        });
                    }
                    return deep_cloned_prevselectvariants;
                } else {
                    updateNestedVariants(existing_variant_objs, [target_key_to_observe, current_combined_vkey], { price: '', quantity: '' });

                    setKeyToObserveState(prev_obj_to_observe => ({
                        ...prev_obj_to_observe,
                        parentKey: current_combined_vkey
                    }));
                }

                const newProduct = {
                    [main_selected_prod_key]: existing_variant_objs
                };

                const newSelectedVariants = [...prevSelectedVariants];
                newSelectedVariants[existing_variant_index] = newProduct;

                return newSelectedVariants;
            } else {
                setKeyToObserveState(prev_obj_to_observe => ({
                    ...prev_obj_to_observe,
                    parentKey: current_combined_vkey
                }));

                return [
                    ...prevSelectedVariants,
                    {
                        [main_selected_prod_key]: {
                            [current_combined_vkey]: { price: '', quantity: '' }
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
                if (key === currentParentKey && selectedVariants[key] instanceof Object) {
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
                {keyToObserveState?.["main_product_title"] === main_selected_prod_key &&
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
