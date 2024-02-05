﻿import triplearrow from '@assets/img/triplearrow.svg';
import { idb } from '../../../../shared/storages/indexDB';
import cross from '@assets/img/cross.svg';
import tick from '@assets/img/success.svg'
import { useImpProdContext } from '../../tabs/impProdContextProvider';

const HoverArrow = ({ orderId }) => {

    const { successEntry, setSuccessEntry } = useImpProdContext()

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const { msg_action, isEveryInputFilledFlag, isEveryInputSameFlag } = request;
        switch (msg_action) {
            case 'update_hoverarrow':
                if (isEveryInputFilledFlag && isEveryInputSameFlag) {
                    setSuccessEntry(false)
                } else if (!isEveryInputFilledFlag || !isEveryInputSameFlag) {
                    setSuccessEntry(true)
                }

                //let timeout;

                //// Trigger debounced behavior directly
                //clearTimeout(timeout);  // Clear any existing timeout
                //timeout = setTimeout(() => {
                //    setSuccessEntry(null);
                //}, 2000);
                break;
            default:
        }
    })


    const clickHandler = () => {
        const desiredURL = "https://nswex.com/index.php?route=account/shipforme";

        chrome.tabs.query({ url: "https://nswex.com/*" }, async function (tabs) {
            const nswexTab = tabs.length > 0 ? tabs[0] : null;

            function newOrUpdateTab(options, tabId = nswexTab.id) {
                return chrome.tabs.update(tabId, options)
                    .then(() => idb.get(orderId))
                    .then(product => {
                        const port = chrome.tabs.connect(tabId);
                        port.postMessage({ msg_action: 'nswex_fill_form', ...product });
                        return product
                    });
            }

            if (nswexTab) {
                if (nswexTab?.url == desiredURL) {
                    await newOrUpdateTab({ active: true });
                } else if (nswexTab?.url != desiredURL) {
                    await newOrUpdateTab({ url: desiredURL, active: true });
                }
            } else {
                chrome.tabs.create({ url: desiredURL }, function (newTab) {
                    chrome.tabs.onUpdated.addListener(async function onUpdatedListener(tabId, changeInfo, updatedTab) {
                        if (tabId === newTab.id && changeInfo.status === "complete") {
                            chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                            await newOrUpdateTab({ active: true }, newTab.id);
                        }
                    });
                });
            }
        });
    }


    return (
        <div className="hover-arrow absolute top-0 left-[-15rem] h-full flex-col items-center justify-center z-0 transition-transform duration-950 group-hover:translate-x-[32rem]"
            onClick={clickHandler}
        >
            {successEntry === true ? (
                <>
                    <img src={tick} alt="" className="h-[70px] w-full mb-1 items-center" />
                    <p className="text-center text-sm p-[0.5px] rounded-full bg-emerald-300">Success!</p>
                </>
            ) : successEntry === false ? (
                <>
                    <img src={cross} alt="" className="h-[70px] w-full mb-1 items-center" />
                    <p className="text-center text-sm p-[0.5px] rounded-full bg-red-300">Already Filled!</p>
                </>
            ) : (
                <>
                    <img src={triplearrow} alt="" className="h-[70px] w-full mb-1 items-center" />
                    <p className="text-center text-sm p-[0.5px] rounded-full bg-orange-300">Export to freight!</p>
                </>
            )}
        </div>
    );
};

export { HoverArrow };
