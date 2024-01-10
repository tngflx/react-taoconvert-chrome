import { useEffect, useState } from "react";
import { idb } from "../../../shared/storages/indexDB";

let CircularButton = ({ onClick, icon, bgColor, hoverBgColor }) => {
    const colors = {
        red: 'bg-red-300',
        blue: 'bg-blue-600',
        green: 'bg-green-500'
    }

    return (
        <button
            className={`w-8 h-8 ${colors[bgColor]} text-white rounded-full flex items-center justify-center hover:bg-red-300 focus:shadow-outline-${colors[bgColor]} active:${bgColor}`}
            onClick={onClick}
        >
            <span className="text-2xl">{icon}</span>
        </button>
    );
};

export const SavedLists = () => {
    const [products, setProducts] = useState([]);

    const fetchDB = () => {
        idb.retrieve()
            .then(data => {
                setProducts(data)
            })
    }
    useEffect(() => {
        fetchDB()
    }, []);

    function handleMinusClick(orderId) {
        console.log(orderId)
        idb.remove(orderId)
        fetchDB()
    }
    function handlePlusClick(orderId: string) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var activeTab = tabs[0];

            idb.get(orderId).then(product => {
                chrome.tabs.sendMessage(activeTab.id, { action: 'nswex_fill_form', ...product });

            })
        });
    }

    return (
        <div className="bg-white dark:bg-white-800 h-[calc(100vh-4.5em)] justify-center items-center mx-4">
            <ul role="list" className="divide-y divide-white-100">
                {products.map((product) => (
                    <li key={product.orderId} className="flex justify-between gap-x-6 py-5">
                        <div className="flex min-w-0 gap-x-4">
                            <img className="h-12 w-12 flex-none bg-gray-500" src={product.product_image_url} alt="" />
                            <div className="min-w-0 flex-auto">
                                <p className="text-sm font-semibold leading-6 text-white-900">{product.product_main_title}</p>
                                <p className="mt-1 text-xs leading-5 text-white-900">{product.product_selected_title}</p>
                            </div>
                        </div>
                        <div className="shrink-0 sm:flex sm:flex-col sm:items-end">
                            <p className="text-sm leading-6 text-gray-900">Buttons</p>
                            <div className="mt-1 flex items-center gap-x-1.5">
                                <CircularButton
                                    onClick={() => handleMinusClick(product.orderId)}
                                    icon="-"
                                    bgColor="blue"
                                    hoverBgColor='red'
                                />
                                <CircularButton
                                    onClick={() => handlePlusClick(product.orderId)}
                                    icon="+"
                                    bgColor="blue"
                                    hoverBgColor="green"
                                />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};