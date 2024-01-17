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

    checkNodeExistsInChildEl = (element: Element, class_or_id: string) => {
        if (element.className && typeof element.className === 'string' && element.className.includes(class_or_id)) {
            return true;
        }

        if (element.id && element.id === class_or_id) {
            return true;
        }

        if (element.childNodes.length > 0) {
            return Array.from(element.childNodes).some(child =>
                child.nodeType === 1 && this.checkNodeExistsInChildEl(child as Element, class_or_id)
            );
        }

        return false;
    }
}
export class MutationObserverManager extends DOMTools {
    errorCodes: Record<string, string>;
    config: { mode: string; mutatedTargetChildNode: string; mutatedTargetParentNode: string; subtree: boolean; };
    foundTargetNode: boolean;
    mutatedTargetParentNode: Element | null;
    mutatedTargetChildNode: Element | string;
    subtree: boolean;

    constructor() {
        super();
        this.errorCodes = {
            elementNotFound: "Element not found.",
            emptyConfig: "Config for MutationObserverManager is empty. Please provide valid configuration.",
            noSpecifiedCase: "Switch statement doesn't have any suitable case"
        }

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
        } else {
            // Not to throw error here as mutationObserver can still observe unloaded elements
            console.error(this.errorCodes['elementNotFound'] + '' + mutatedTargetParentNode);
        }

        console.log(`mutate.startObserver func/ parent: ${mutatedTargetParentNode}, mode: ${mode}, mutatedChild: ${mutatedTargetChildNode}`)

        if (!mode || !mutatedTargetChildNode) {
            throw Error(this.errorCodes['emptyConfig']);
        }

        const observer = new MutationObserver((mutationsList, observer) => {
            switch (mode) {
                case 'addedNode':
                    this.foundTargetNode = mutationsList.some(mutation => {

                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            return Array.from(mutation.addedNodes).some(node =>
                                this.checkNodeExistsInChildEl(node as Element, mutatedTargetChildNode)
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
                            this.checkNodeExistsInChildEl(node as Element, mutatedTargetChildNode)

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
                    throw Error(this.errorCodes['noSpecifiedCase']);
            }

        });

        // To init observe on targetelement
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
