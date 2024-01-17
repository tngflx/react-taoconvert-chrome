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

const Footer = ({ clearListHandler, RestoreListHandler }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full bg-gray-900 p-2 flex justify-end">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md mx-2" onClick={clearListHandler}>Clear Lists</button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-md mx-2" onClick={RestoreListHandler}>Restore</button>
        </div>
    );
};

export const SavedLists = () => {
    const [products, setProducts] = useState([]);

    const fetchDB = () => {
        idb.retrieve()
            .then(data => {
                data = data.sort((a, b) =>
                    new Date(b.product_create_time).getTime() - new Date(a.product_create_time).getTime()
                );
                setProducts(data)
            })
    }
    useEffect(() => {
        fetchDB()
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
    function handleMinusClick(orderId) {
        console.log(orderId)
        idb.remove(orderId)
        fetchDB()
    }
    function handlePlusClick(orderId: string) {
        const desiredURL = "https://nswex.com/index.php?route=account/shipforme";

        chrome.tabs.query({ url: "https://nswex.com/*" }, async function (tabs) {
            const nswexTab = tabs.length > 0 ? tabs[0] : null;

            function newOrUpdateTab(options, tabId = nswexTab.id) {
                chrome.tabs.update(tabId, options)
                    .then(() =>
                        idb.get(orderId).then(product => product)
                    ).then(product => {
                        const port = chrome.tabs.connect(tabId);
                        port.postMessage({ action: 'nswex_fill_form', ...product });

                    })
            }

            if (nswexTab) {
                if (nswexTab?.url == desiredURL) {
                    newOrUpdateTab({ active: true })
                } else if (nswexTab?.url != desiredURL) {
                    newOrUpdateTab({ url: desiredURL, active: true })
                }


            } else {
                chrome.tabs.create({ url: desiredURL }, function (newTab) {
                    // Listen for tab updates to make sure the URL is loaded
                    chrome.tabs.onUpdated.addListener(function onUpdatedListener(tabId, changeInfo, updatedTab) {
                        if (tabId === newTab.id && changeInfo.status === "complete") {
                            // Remove the event listener once the URL is loaded
                            chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                            newOrUpdateTab({active: true }, newTab.id);
                        }
                    });
                });

            }
        })
    }

    return (
        <>
            <div className="bg-white dark:bg-white-800 h-[calc(100vh-4.5em)] justify-center items-center mx-4">
                <ul role="list" className="divide-y divide-white-100 pb-16">
                    {products.map((product) => (
                        <li key={product.product_create_time} className="flex justify-between gap-x-6 py-5">
                            <div className="flex min-w-0 gap-x-4">
                                <img className="h-12 w-12 flex-none bg-gray-500" src={product.product_image_url} alt="" />
                                <div className="min-w-0 flex-auto">
                                    <p className="text-sm font-semibold leading-6 text-white-900">{product.product_main_title}</p>
                                    <p className="mt-1 text-xs leading-5 text-white-900">{product.product_selected_title}</p>
                                    {!product.is_freight_processed && (
                                        <span className="new-indicator bg-green-500 text-white p-1 rounded-full animate-pulse">New</span>
                                    )}
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
            <Footer clearListHandler={clearListHandler} RestoreListHandler="" />
        </>
    );
};