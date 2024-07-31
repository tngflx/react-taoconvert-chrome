import React, { createContext, useContext, useState, useEffect } from 'react';
import { idb } from '../../../shared/storages/indexDB';
import { ImportedProducts } from '../component/impProd/importedProducts';
import { CircularButton } from '../component/impProd/circularButton';
import { HoverArrow } from '../component/impProd/hoverArrowLogics';

export const ImpProdContext = createContext(null);

const ImpProdContextProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [successEntry, setSuccessEntry] = useState(null)

    const fetchDB = async () => {
        setLoading(true); // Set loading to true before starting the fetch
        idb.retrieve('sort')
            .then(data => {
                setProducts(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchDB();
    }, []);

    const clearListHandler = () => {
        idb.clear()
            .then(() => {
                // After clearing, you can update the state or perform any other actions
                // For example, update the state to an empty array to clear the displayed list
                setProducts([]);
            })
            .catch(error => {
                console.error("Error clearing lists:", error);
            });
    };

    const contextValue = {
        loading,
        products,
        successEntry,
        setSuccessEntry,
        fetchDB,
        clearListHandler
    }

    return (
        <ImpProdContext.Provider value={contextValue}>
            {children}
        </ImpProdContext.Provider>
    );
};

export const ImportedProductsTab = () => {
    return (
        <ImpProdContextProvider>
            <ImportedProducts />
            <CircularButton icon={''} bgColor={''} orderId={undefined} />
            <HoverArrow orderId={undefined} freightCompany={undefined} />
        </ImpProdContextProvider>
    );
};

export const useImpProdContext = () => {
    return useContext(ImpProdContext);
};
