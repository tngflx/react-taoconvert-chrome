import { createRoot } from 'react-dom/client';
import '@pages/popup/Popup.css';
import Popup from '@pages/popup/Popup';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/popup');

function init() {
    const appContainer = document.querySelector('#app-container');
    if (!appContainer) {
        throw new Error('Can not find #app-container');
    } else {
        appContainer.className = 'w-[600px] min-h-fit flex flex-col';
    }
    const root = createRoot(appContainer);
    root.render(<Popup />);
}

init();
