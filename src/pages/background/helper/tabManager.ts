// Original code :
/**
 * case 'create_nswex_tab': {
        const { selected_product_infos, url } = request;
        chrome.tabs.create({ url }, function (newTab) {
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
                if (tabId === newTab.id && changeInfo.status === 'complete' && nswex_script_loaded) {
                    const port = chrome.tabs.connect(tabId);
                    port.postMessage({ msg_action: 'nswex_fill_form', ...selected_product_infos });
                    nswex_script_loaded = false;
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            });
        });
        break;
    }
    case 'update_nswex_tab': {
        const { nswexTab, selected_product_infos, url } = request;
        function listener(tabId, changeInfo) {
            if (tabId === nswexTab.id && changeInfo.status === 'complete') {
                const port = chrome.tabs.connect(nswexTab.id);
                port.postMessage({ msg_action: 'nswex_fill_form', ...selected_product_infos });
                chrome.tabs.onUpdated.removeListener(listener);
            }
        }

        chrome.tabs.onUpdated.addListener(listener);
        const chrome_tabs_options = nswexTab.url === url ? { active: true } : { url, active: true };

        chrome.tabs.update(nswexTab.id, chrome_tabs_options, function (updatedTab) {
            if (chrome.runtime.lastError) {
                chrome.tabs.onUpdated.removeListener(listener);
                console.error(chrome.runtime.lastError);
            }
            if (nswexTab.url == url) {
                listener(updatedTab.id, { status: 'complete' })
            }
        });
        break;
    }
 */

interface TabUpdateMessage {
    msg_action: string;
    [key: string]: any;
}

interface ExistingTab {
    id: number;
    url: string;
}

export class TabManager {
    targetTabId: number;
    port: chrome.runtime.Port;

    private onTabUpdated(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, callback: (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => void, message: TabUpdateMessage, onComplete: () => void) {
        if (changeInfo.status === 'complete' && tabId === this.targetTabId) {
            this.port = chrome.tabs.connect(tabId);
            this.port.postMessage(message);
            chrome.tabs.onUpdated.removeListener(callback);
            onComplete();
        }
    }

    public createTab(url: string, message: TabUpdateMessage, onComplete?: () => void) {
        chrome.tabs.create({ url }, (newTab) => {
            this.targetTabId = newTab.id;
            const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => this.onTabUpdated(tabId, changeInfo, listener, message, onComplete);
            chrome.tabs.onUpdated.addListener(listener);
        });
    }

    public updateTab(existingTab: ExistingTab, url: string, message: TabUpdateMessage, onComplete?: () => void) {
        const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => this.onTabUpdated(tabId, changeInfo, listener, message, onComplete);
        chrome.tabs.onUpdated.addListener(listener);

        const chromeTabsOptions: chrome.tabs.UpdateProperties = existingTab.url === url ? { active: true } : { url, active: true };

        chrome.tabs.update(existingTab.id, chromeTabsOptions, (updatedTab) => {
            if (chrome.runtime.lastError) {
                chrome.tabs.onUpdated.removeListener(listener);
                console.error(chrome.runtime.lastError);
            }
            if (existingTab.url === url) {
                listener(updatedTab!.id, { status: 'complete' });
            }
        });
    }

    public addListener(callback: (message: any) => void) {
        if (!this.port) {
            console.error("Port is not initialized.");
            return;
        }
        this.port.onMessage.addListener(callback);
    }
}
