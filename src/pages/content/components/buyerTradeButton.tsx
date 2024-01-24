import React, { useRef, useEffect } from 'react';
import { render } from 'react-dom';

const BuyerTradeButtonWrapper = ({ onClickHandler }) => {
    const buttonRef = useRef(null);

    useEffect(() => {
        const loadExternalStylesheet = async () => {
            // Access the Shadow DOM
            const buttonWrapper = buttonRef.current.attachShadow({ mode: 'open' });

            // Create a link element for the external stylesheet
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('type', 'text/css');
            link.setAttribute('href', '@pages/content/buyerTradePage/injected.css'); // Use the default export from the dynamically imported module
            buttonWrapper.appendChild(link);
            // Access the Shadow DOM

            // Render Tailwind CSS Button into the Shadow DOM
            const buttonContainer = document.createElement('div');
            buttonWrapper.appendChild(buttonContainer);

            // Add Tailwind CSS classes to the buttonContainer
            buttonContainer.className = 'bg-blue-500 text-white py-2 px-4 rounded';

            // Set up event handler
            buttonContainer.addEventListener('click', onClickHandler);

            // Add text content
            buttonContainer.innerText = 'Click me';
        }
        loadExternalStylesheet()
    }, [onClickHandler]);

    return <div ref={buttonRef}></div>;
};

export default BuyerTradeButtonWrapper;
