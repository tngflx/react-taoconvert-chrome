import triplearrow from '@assets/img/triplearrow.svg';
import { idb } from '../../../../shared/storages/indexDB';

const HoverArrow = () => {
    const clickHandler = () => {
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
    }


    return (
        <div className="hover-arrow absolute h-full top-0 left-[-5rem] flex items-center justify-center z-0 transition-transform duration-1000 delay-200 group-hover:translate-x-full"
            onClick={clickHandler}>
            <img src={triplearrow} alt="" className="w-full h-20" />
        </div>
    );
};

export { HoverArrow };
