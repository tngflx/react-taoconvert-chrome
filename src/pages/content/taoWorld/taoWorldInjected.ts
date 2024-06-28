chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (request) => {
        if (request.msg_action === 'taoworld_login_form') {

            const is_login_link_exists = Array.from(document.querySelectorAll('a')).find(el => el.textContent === '亲，请登录');
            if(is_login_link_exists) {
                is_login_link_exists.click();
                chrome.storage.local.set({ hasClickedLogin: true }, () => {
                    port.postMessage({ status: "Login initiated" });
                });
            } else {
                console.log('Login link not found');
                port.postMessage({ status: "Login link not found" });
            }


            const { hasClickedLogin }: { hasClickedLogin: boolean } = await new Promise(resolve => chrome.storage.local.get('hasClickedLogin', resolve));

        }
    });
});
