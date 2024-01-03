export class DOMTools {

    /**
     * Find element / dom entities by class name or the tag
     * @param {string} element The iteration object from querySelectorAll
     * @param {any} class_name class name u want to look for
     * @param {any} element_tag the tag u want to look for, example <div> <p>
     * @returns
     */
    findParentElbyClassName(element: Element | null, class_name: string, element_tag?: string): Element | null {
        let lowerCaseClassName = class_name.toLowerCase();
        element_tag = element_tag || '*';

        while (element && element.tagName !== 'HTML') {
            const matchingElement = Array.from(element.getElementsByTagName(element_tag)).find(el => {
                return typeof el.className === 'string' && el.className.toLowerCase().includes(lowerCaseClassName);
            });

            if (matchingElement) {
                return matchingElement;
            }

            element = element.parentNode as Element;
        }

        return null; // Return null if no matching element is found in the ancestors
    }

    findMultipleParentElbyClassName(element: Element | null, class_name: string, element_tag?: string): Element[] {
        let lowerCaseClassName = class_name.toLowerCase();
        element_tag = element_tag || '*';

        const matchingElements: Element[] = [];

        while (element && element.tagName !== 'HTML') {
            const elements = Array.from(element.getElementsByTagName(element_tag)).filter(el => {
                return typeof el.className === 'string' && el.className.toLowerCase().includes(lowerCaseClassName);
            });

            if (elements.length > 0) {
                matchingElements.push(...elements);
            }

            element = element.parentNode as Element;
        }

        return matchingElements;
    }

    checkClassNameInChildEl(element: Element, class_name: string) {
        if (element.className && typeof element.className === 'string' && element.className.includes(class_name)) {
            return true;
        }

        if (element.childNodes.length > 0) {
            return Array.from(element.childNodes).some(child =>
                child.nodeType === 1 && this.checkClassNameInChildEl(child as Element, class_name)
            );
        }

        return false;
    }
}
export class MutationObserverManager extends DOMTools {
    config: { mode: string; mutatedTargetChildNode: string; mutatedTargetParentNode: string; subtree: boolean; };
    foundTargetNode: boolean;
    mutatedTargetParentNode: Element | null;
    mutatedTargetChildNode: Element | string;
    subtree: boolean;

    constructor() {
        super();
        this.config = { mode: '', mutatedTargetChildNode: '', mutatedTargetParentNode: '', subtree: false };
        this.foundTargetNode = false
        this.mutatedTargetParentNode = null
        this.mutatedTargetChildNode = null
        this.subtree = false
    }

    startObserver(callback) {
        const { mode, mutatedTargetChildNode, mutatedTargetParentNode, subtree } = this.config;

        let targetElement = document.querySelector(mutatedTargetParentNode)
        if (targetElement) {
            this.mutatedTargetParentNode = targetElement
            this.mutatedTargetChildNode = mutatedTargetChildNode
            this.subtree = subtree
        } else console.error(`Element with selector '${mutatedTargetParentNode}' not found.`);

        console.log(`parent: ${mutatedTargetParentNode}, mode: ${mode}, mutatedChild: ${mutatedTargetChildNode}`)

        if (!mode || !mutatedTargetChildNode) {
            console.error('Config for mutationObserverManager is empty. Please provide valid configuration.');
            return -1; // or handle it in another way based on your requirements
        }

        const observer = new MutationObserver((mutationsList, observer) => {
            switch (mode) {
                case 'addedNode':
                    this.foundTargetNode = mutationsList.some(mutation => {

                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            return Array.from(mutation.addedNodes).some(node =>
                                this.checkClassNameInChildEl(node as Element, mutatedTargetChildNode)
                            );
                        }
                        return false;
                    });

                    this.stopObserverBeforeDomChanges(observer, callback)
                    break;

                case 'removedNode':
                    this.foundTargetNode = mutationsList.some(mutation =>
                        mutation.type === 'childList' &&
                        Array.from(mutation.removedNodes).some(node =>
                            this.checkClassNameInChildEl(node as Element, mutatedTargetChildNode)

                        )
                    );

                    this.stopObserverBeforeDomChanges(observer, callback)
                    break;

                case 'removedText':
                    this.foundTargetNode = mutationsList.some(mutation =>
                        mutation.type === 'childList' &&
                        Array.from(mutation.removedNodes).some(node =>
                            node.nodeName.includes('text') || node.nodeName.includes('comment')
                        )
                    );

                    this.stopObserverBeforeDomChanges(observer, callback)
                    break;
                default:
            }

        });
        if (targetElement)
            observer.observe(targetElement, { childList: true, subtree });


    }

    stopObserverBeforeDomChanges(observer, callback) {
        observer.disconnect()

        if (this.foundTargetNode) {
            callback()
        }
        observer.observe(this.mutatedTargetParentNode, { childList: true, subtree: this.subtree });
    }
}
