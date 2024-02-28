import React, { useRef, useEffect } from 'react';
import { render } from 'react-dom';
import { Button, Theme } from '@radix-ui/themes';
import { forwardRef } from 'react';

interface RadixRendererProps {
    shadowRootContainer: any;
    children?: React.ReactNode;
}

const RadixRenderer = forwardRef<HTMLDivElement, RadixRendererProps>(
    ({ shadowRootContainer, children }, radixRef) => {

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

                } catch (error) {
                    console.error('Error getting css files:', error);
                }
            };

            fetchData();

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

        return <div ref={radixRef}></div>;
    }
);

export default RadixRenderer;