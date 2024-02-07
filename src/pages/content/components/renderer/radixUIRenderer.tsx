import React, { useRef, useEffect } from 'react';
import { render } from 'react-dom';
import { Button, Theme } from '@radix-ui/themes';
   
const RadixRenderer = ({ shadowRootContainer, children, targetShadowDom }) => {
    const radixRef = useRef(null);

    useEffect(() => {
        const shadowRoot = shadowRootContainer.attachShadow({ mode: 'open' });
        const cssModules = [
            'assets/css/tailwindStyle.chunk.css',
            'assets/css/radixStyle.chunk.css'
        ];

        const fetchData = async () => {
            try {

                const responses = await Promise.all(cssModules.map(async file => {
                    const response = await fetch(chrome.runtime.getURL(file));
                    return response.text();
                }));

                const styleSheets = responses.map(style => {
                    const newStyleSheet = new CSSStyleSheet();
                    newStyleSheet.replace(style);
                    return newStyleSheet;
                });

                shadowRoot.adoptedStyleSheets = styleSheets;

                if (targetShadowDom) {
                    console.log(targetShadowDom)
                    targetShadowDom.adoptedStyleSheets = styleSheets;
                }

            } catch (error) {
                console.error('Error getting css files:', error);
            }
        };

        fetchData();

        // Can't directly return buttonElement because we still need to do dom manipulation on this button
        // The only way is to useEffect hook to do dom manipulation before render
        render(

            <Theme ref={radixRef}
                accentColor="indigo"
                grayColor="slate"
                panelBackground="solid"
                scaling="100%"
                radius="full">
                {children}
            </Theme>
            , shadowRoot
        );

    }, [shadowRootContainer]);

    // Return an empty div as a placeholder for the component
    return <div ref={radixRef}></div>;
};

export default RadixRenderer;
