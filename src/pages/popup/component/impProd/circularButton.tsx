import { idb } from "../../../../shared/storages/indexDB";
import { useImpProdContext } from "../../tabs/impProdContextProvider";

interface CircularButtonProps {
    icon: string;
    bgColor: string;
    hoverBgColor: string;
    orderId: any;
    isMinus?: boolean;  // Make isMinus optional
    onClick?: (orderId: any) => void;
}

export const CircularButton: React.FC<any> = ({ onClick, icon, bgColor, hoverBgColor, orderId, isMinus }) => {
    const { fetchDB } = useImpProdContext()

    const colors = {
        red: 'bg-red-300',
        blue: 'bg-blue-600',
        green: 'bg-green-500'
    };

    const handleMinusClick = () => {
        console.log(orderId);
        idb.remove(orderId);
        fetchDB()
    };

    const handlePlusClick = () => {
        const desiredURL = "https://nswex.com/index.php?route=account/shipforme";

        chrome.tabs.query({ url: "https://nswex.com/*" }, async function (tabs) {
            const nswexTab = tabs.length > 0 ? tabs[0] : null;

            function newOrUpdateTab(options, tabId = nswexTab.id) {
                chrome.tabs.update(tabId, options)
                    .then(() => idb.get(orderId))
                    .then(product => {
                        const port = chrome.tabs.connect(tabId);
                        port.postMessage({ action: 'nswex_fill_form', ...product });
                    });
            }

            if (nswexTab) {
                if (nswexTab?.url == desiredURL) {
                    newOrUpdateTab({ active: true });
                } else if (nswexTab?.url != desiredURL) {
                    newOrUpdateTab({ url: desiredURL, active: true });
                }
            } else {
                chrome.tabs.create({ url: desiredURL }, function (newTab) {
                    chrome.tabs.onUpdated.addListener(function onUpdatedListener(tabId, changeInfo, updatedTab) {
                        if (tabId === newTab.id && changeInfo.status === "complete") {
                            chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                            newOrUpdateTab({ active: true }, newTab.id);
                        }
                    });
                });
            }
        });
    };

    const handleClick = () => {
        if (isMinus) {
            handleMinusClick();
        } else {
            handlePlusClick();
        }

        // You can call the provided onClick prop if needed
        if (onClick) {
            onClick(orderId);
        }
    };

    return (
        <button
            className={`w-8 h-8 ${colors[bgColor]} text-white rounded-full flex items-center justify-center hover:bg-red-300 focus:shadow-outline-${colors[bgColor]} active:${bgColor}`}
            onClick={handleClick}
        >
            <span className="text-2xl">{icon}</span>
        </button>
    );
};