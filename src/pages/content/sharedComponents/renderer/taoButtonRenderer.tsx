import React, { useRef, useEffect } from 'react';
import { render } from 'react-dom';

const ButtonRenderer = ({ onClickHandler, containerElement, buttonWrapperClasses, buttonName, buttonTwindClasses }) => {
    const buttonRef = useRef(null);

    useEffect(() => {
        const shadowRoot = containerElement.attachShadow({ mode: 'open' });

        // Can't directly return buttonElement because we still need to do dom manipulation on this button
        render(
            <div className={buttonWrapperClasses}>
                <button
                    onClick={onClickHandler}
                    className={buttonTwindClasses}
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
