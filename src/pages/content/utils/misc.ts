import { mutObsError } from "./errorHandler";

export class DOMTools {

    /**
     * Find element / dom entities by class name or the tag
     * @param {string} element The iteration object from querySelectorAll
     * @param {any} class_name class name u want to look for
     * @param {any} element_tag the tag u want to look for, example <div> <p>
     * @returns
     */
    findChildThenParentElbyClassName(element: Element | null, class_name: string, element_tag?: string): Element | null {
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

    checkNodeExistsInChildEl = (element: Element, class_or_id: string, returnElement?: boolean): Element | boolean => {
        if (element.className && typeof element.className === 'string' && element.className.includes(class_or_id)) {
            return returnElement ? element : true;
        }

        if (element.id && element.id === class_or_id) {
            return returnElement ? element : true;
        }

        if (element.childNodes.length > 0) {
            for (const child of Array.from(element.childNodes)) {
                if (child.nodeType === 1) {
                    const result = this.checkNodeExistsInChildEl(child as Element, class_or_id, returnElement);
                    if (result === true || (returnElement && result)) {
                        return result;
                    }
                }
            }
        }

        return false;
    }

    checkTextInsertedInParentEl = (element: Element, class_or_id: string): boolean => {
        if (element.nodeType == 3 && element.textContent !== '') {
            if (element?.parentElement && element.parentElement.className.includes(class_or_id)) {
                return true
            }
        }

        // Weird taobao rendering after click on different option of product (hence changing price)
        // which has multiple comments first before putting new text
        if (element.nodeType == 8 && element.nodeName == '#comment') {
            if (element?.previousElementSibling && element.previousElementSibling?.className?.includes(class_or_id)) {
                return true
            }
        }
        return false
    }
}

type SelectorPart = `${string}[class^="${string}"]` | `${string}[class*="${string}"]` | `[class*="${string}"]` | `[class^="${string}"]`;

type GenericSelector = `${SelectorPart} ${SelectorPart}` | SelectorPart;
export class MutationObserverManager extends DOMTools {

    errorCodes: Record<string, string>;
    config: {
        mode: string;
        /**
         * The mutated target parent node of the MutationObserverManager.
         * the selector doesn't need to be in [class^=''] format
         * cause we just pass it to find within className attribute
         * @type {string}
         */
        mutTargetChildName: Exclude<string, `[class*=`>;

        /**
         * This must be a valid selector or a reference to an existing DOM element,
         * because it is passed to document.querySelector for checking
         * preferably you find the unchangeable ancestor existed first after load
         * @type {string}
         */
        domLoadedSourceParentNode: GenericSelector | string;
        subtree: boolean
    };
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

        this.config = { mode: '', mutTargetChildName: '', domLoadedSourceParentNode: '[class^=""] [class*=""]', subtree: false };
        this.foundTargetNode = false
        this.mutatedTargetParentNode = null
        this.mutatedTargetChildNode = null
        this.subtree = false
    }

    startObserver(callback) {
        const { mode, mutTargetChildName, domLoadedSourceParentNode, subtree } = this.config;

        let targetElement = document.querySelector(domLoadedSourceParentNode)
        if (targetElement) {
            this.mutatedTargetParentNode = targetElement
            this.mutatedTargetChildNode = mutTargetChildName
            this.subtree = subtree
        } else {
            // Not to throw error here as mutationObserver can still observe unloaded elements
            throw new mutObsError('elementNotFound', this.errorCodes['elementNotFound'] + ' ' + domLoadedSourceParentNode);
        }

        console.log(`mutate.startObserver func/ parent: ${domLoadedSourceParentNode}, mode: ${mode}, mutatedChild: ${mutTargetChildName}`)

        if (!mode || !mutTargetChildName) {
            throw Error(this.errorCodes['emptyConfig']);
        }

        const observer = new MutationObserver((mutationsList, observer) => {
            switch (mode) {
                case 'addedNode':
                    this.foundTargetNode = mutationsList.some(mutation => {

                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            return Array.from(mutation.addedNodes).some(node =>
                                this.checkNodeExistsInChildEl(node as Element, mutTargetChildName)
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
                            this.checkNodeExistsInChildEl(node as Element, mutTargetChildName)

                        )
                    );

                    this.stopObserverBeforeDomChanges(observer, callback)
                    break;

                case 'addedText':
                    this.foundTargetNode = mutationsList.some(mutation =>
                        mutation.type === 'childList' &&
                        Array.from(mutation.addedNodes).some(node =>
                            this.checkTextInsertedInParentEl(node as Element, mutTargetChildName)
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