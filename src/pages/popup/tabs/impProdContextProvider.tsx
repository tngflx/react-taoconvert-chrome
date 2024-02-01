import React, { createContext, useContext, useState, useEffect } from 'react';
import { idb } from '../../../shared/storages/indexDB';
import { ImportedProducts } from '../component/impProd/importedProducts';
import { CircularButton } from '../component/impProd/circularButton';

export const ImpProdContext = createContext(null);

const ImpProdContextProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);

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

    return (
        <ImpProdContext.Provider value={{ loading, products, fetchDB, clearListHandler }}>
            <ImportedProducts />
        </ImpProdContext.Provider>
    );
};

export const ImportedProductsTab = () => {
    return (
        <ImpProdContextProvider>
            <ImportedProducts />
            <CircularButton />
            {/* Add more components here if needed */}
        </ImpProdContextProvider>
    );
};

export const useImpProdContext = () => {
    return useContext(ImpProdContext);
};
