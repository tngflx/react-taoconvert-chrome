chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.msg_action === 'taoworld_login_form') {
        const { hasClickedLogin } = await new Promise(resolve => chrome.storage.local.get('hasClickedLogin', resolve));
        console.log('i ranned');
        if (!hasClickedLogin) {
            const loginLink = Array.from(document.querySelectorAll('a')).find(el => el.textContent === '亲，请登录');

            if (loginLink) {
                loginLink.click();
                chrome.storage.local.set({ hasClickedLogin: true });
            } else {
                console.log('Login link not found');
            }
        }
    }
});
