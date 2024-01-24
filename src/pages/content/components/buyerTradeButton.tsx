import React, { useRef, useEffect } from 'react';
import tailwindCSS from '@src/assets/style/tailwind.css?inline';
import { unmountComponentAtNode, render } from 'react-dom';

const BuyerTradeButtonWrapper = ({ onClickHandler }) => {
    const buttonRef = useRef(null);

    useEffect(() => {
        // Access the Shadow DOM
        const shadowRoot = buttonRef.current.attachShadow({ mode: 'open' });

        // Create a style element for the external stylesheet
        const cssStyle = document.createElement('style');
        cssStyle.innerHTML = tailwindCSS;
        shadowRoot.appendChild(cssStyle);

        // Render the component using render from react-dom
        const buttonComponent = (
            <div className="bg-blue-500 text-white py-2 px-4 rounded" onClick={onClickHandler}>
                Click me
            </div>
        );

        render(buttonComponent, shadowRoot);

        // Cleanup function to unmount the component when the component is unmounted
        return () => {
            unmountComponentAtNode(shadowRoot);
        };
    }, [onClickHandler]);

    return <div ref={buttonRef}></div>;
};

export default BuyerTradeButtonWrapper;
