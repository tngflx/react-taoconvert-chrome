import React, { useRef, useEffect } from 'react';
import { render } from 'react-dom';

const ButtonRenderer = ({ onClickHandler, containerElement, buttonWrapperClasses, buttonName }) => {
    const buttonRef = useRef(null);

    useEffect(() => {
        const shadowRoot = containerElement.attachShadow({ mode: 'open' });

        // Can't directly return buttonElement because we still need to do dom manipulation on this button
        // The only way is to useEffect hook to do dom manipulation before render
        render(
            <div className={buttonWrapperClasses}>
                <button
                    onClick={() => onClickHandler()}
                    className="taoconv_button bg-green-500 hover:bg-green-300 text-black font-bold py-2 px-3 rounded items-center"
                    ref={buttonRef}
                >
                    {buttonName}
                </button>
            </div>,
            shadowRoot
        );


        // Inject the external stylesheet
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = chrome.runtime.getURL('assets/css/tailwindStyle.chunk.css');
        shadowRoot.appendChild(linkElement);

        // Cleanup logic (optional): Remove the stylesheet and reset buttonRef on component unmount
        return () => {
            shadowRoot.removeChild(linkElement);
        };

    }, [onClickHandler, containerElement]);

    // Return an empty div as a placeholder for the component
    return <div ref={buttonRef}></div>;
};

export default ButtonRenderer;
