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
                let existing_variant_keysvals = existing_product[main_selected_prod_key];

                let matched_condition = '';
                let existing_variant_val = '';
                let existing_variant_key = '';

                existing_variant_keysvals.some((existing_variant_keyval, index, array) => {
                    const existing_v_keysvals_keyonly = Object.keys(existing_variant_keyval)[0];
                    const keyval_segments = existing_v_keysvals_keyonly?.split('/');
                    keyval_segments.forEach((segment, index) => {
                        const [v_key, v_val]= segment.split(':');
                        if (segment.includes(current_variant_key)) {
                            existing_variant_val = segment;
                            existing_variant_key = current_variant_key;
                        }
                    });


                    const is_same_variant_key = match[1] === current_variant_key;
                    const variant_value1 = match[2];
                    const is_empty_variant_value2 = match[3] === '';

                    existing_variant_val = variant_value1;
                    existing_variant_key = match[1];
                    // This is to ensure the loop continues if certain there's matched value
                    const check_vval_does_exist = existing_variant_keysvals.some(obj => Object.keys(obj)[0].includes(current_variant_val));
                    const check_vval_all_occupied = existing_variant_keysvals.every(key_val => {
                        const part = Object.keys(key_val)[0].split('/')
                        return part[part.length - 1] !== '';
                    });

                    if (is_same_variant_key) {
                        if (variant_value1 === current_variant_val) {
                            matched_condition = 'delete_existing_entry';
                            return true;
                        } else if (variant_value1 !== current_variant_val && !check_vval_does_exist) {
                            matched_condition = 'add_new_variant_key';
                            return true;
                        }
                    } else if (!is_same_variant_key && check_vval_all_occupied) {
                        matched_condition = 'add_same_vkey_diff_vval';
                        return true;
                    }

                    const isLastEntry = index === array.length - 1;

                    if (isLastEntry && !is_same_variant_key && is_empty_variant_value2) {
                        matched_condition = 'insert_next_to_slash';
                        existing_variant_val = match[0];
                        delete existing_variant_keysvals[index];
                        return true;
                    }

                    return false;
                });

                switch (matched_condition) {
                    case 'insert_next_to_slash':
                        const combined_variants_key = [existing_variant_val, `${current_variant_key}:${current_variant_val}`].join('');
                        existing_variant_keysvals.push({ [combined_variants_key]: { price: '', quantity: '' } });

                        break;
                    case 'add_new_variant_key':
                        existing_variant_keysvals.push({
                            [`${current_variant_key}:${current_variant_val}/`]: { price: '', quantity: '' },
                        });
                        break;
                    case 'delete_existing_entry':
                        const newVariantKeysVals = existing_variant_keysvals.filter(existing_variant_keyval => {
                            return !Object.keys(existing_variant_keyval)[0].includes(current_variant_val);
                        });
                        const newProduct = { ...existing_product, [main_selected_prod_key]: newVariantKeysVals };
                        return prevSelectedVariants.map(item => (item === existing_product ? newProduct : item));
                    case 'add_same_vkey_diff_vval':
                        existing_variant_keysvals.push({
                            [`${existing_variant_key}:${existing_variant_val}/${current_variant_key}:${current_variant_val}`]: { price: '', quantity: '' },
                        });
                        break;
                    default:
                        // Handle default case
                        break;
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
                            return v[main_selected_prod_key]?.some(variant =>
                                Object.keys(variant)[0].includes(`${current_variant_key}:${current_variant_val}/`)
                            );
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
