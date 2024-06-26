import { chromePortMsgHandler } from "../utils/portMessageHandler";

const port = chrome.runtime.connect({ name: 'content-script' });
const chrome_port = new chromePortMsgHandler(port);

chrome.runtime.onConnect.addListener((port) => {
    if (port.name == 'content-script') {
        port.onMessage.addListener(async (request) => {
            if (request.msg_action === 'taoworld_login_form') {
                console.log('i ranned');
                const { hasClickedLogin } = await new Promise(resolve => chrome.storage.local.get('hasClickedLogin', resolve));
                if (!hasClickedLogin) {
                    const loginLink = Array.from(document.querySelectorAll('a')).find(el => el.textContent === '亲，请登录');

                    if (loginLink) {
                        loginLink.click();
                        chrome.storage.local.set({ hasClickedLogin: true }, () => {
                            chrome_port.enqueueMessage({ status: "Login initiated" });
                        });
                    } else {
                        console.log('Login link not found');
                        chrome_port.enqueueMessage({ status: "Login link not found" });
                    }
                } else {
                    chrome_port.enqueueMessage({ status: "Already clicked login" });
                }
            }
        });
    }
})
