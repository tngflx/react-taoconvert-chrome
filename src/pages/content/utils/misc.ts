import { MutObsError } from "./errorHandler";

/**
 * Provides utility methods for checking the existence of HTML classes in a given HTML string.
 */
export class DOMStringTools {
    static checkBothClassExists(htmlString: string, ...classNames: string[]): boolean {
        return classNames.every(className => {
            const regex = new RegExp(`<[^>]+class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"`)
            return regex.test(htmlString)
        })
    }

    static checkClassExistsAndGetHref(htmlString: string, className: string): string | null {
        const regex = new RegExp(`<[^>]+class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"[^>]*href="([^"]*)"`, 'i')
        const match = htmlString.match(regex)
        return match ? match[1] : null
    }
}


export class DOMTools {

    /**
     * Find element / dom entities by class name with/without the tag
     * Works by traversing into children first then traverse up to ancestor/parent while ignoring siblings
     * Only go for first layer children and doesn't go too deep
     * @param {string} src_elements The iteration object from querySelectorAll
     * @param {any} class_name class name u want to look for
     * @param {any} element_tag the tag u want to look for, example <div> <p>
     * @returns {Element} the node Element u searched for
     */
    static findChildThenParentElbyClassName(src_elements: Element | null, class_name: string, element_tag?: string): Element | null {
        let lowerCaseClassName = class_name.toLowerCase();
        element_tag = element_tag || '*';

        while (src_elements && src_elements.tagName !== 'HTML') {
            const matchingElement = Array.from(src_elements.getElementsByTagName(element_tag)).find(el => {
                return typeof el.className === 'string' && el.className.toLowerCase().includes(lowerCaseClassName);
            });

            if (matchingElement) {
                return matchingElement;
            }

            src_elements = src_elements.parentNode as Element;
        }

        return null; // Return null if no matching element is found in the ancestors
    }

    static findMultipleParentElbyClassName(src_element: Element | null, class_name: string, element_tag?: string): Element[] {
        let lowerCaseClassName = class_name.toLowerCase();
        element_tag = element_tag || '*';

        const matchingElements: Element[] = [];

        while (src_element && src_element.tagName !== 'HTML') {
            const elements = Array.from(src_element.getElementsByTagName(element_tag)).filter(el => {
                return typeof el.className === 'string' && el.className.toLowerCase().includes(lowerCaseClassName);
            });

            if (elements.length > 0) {
                matchingElements.push(...elements);
            }

            src_element = src_element.parentNode as Element;
        }

        return matchingElements;
    }

    /**
     * check if parcticular html node exists in child element with return either boolean or the element itself
     * this method is tailored for mutationLists iteration
     * @param {Element} src_element source element/ parent node that contains the child to search for
     * @param {string} class_or_id string of the classname or id name for search target
     * @param {Boolean} is_return_element flag to return element or boolean
     * @returns {Boolean | Element} return either boolean or Element
     */

    static checkNodeExistsInChildEl(options: { src_element: Element, target_class_or_id: string, tag_name?: string, is_return_element?: boolean }): Element | boolean {
        const { src_element, target_class_or_id, tag_name, is_return_element } = options;

        const notEmptyTargClassId = target_class_or_id.length > 0 ? true : false;
        const hasMatchingClass = src_element.className && typeof src_element.className === 'string' && notEmptyTargClassId && src_element.className.includes(target_class_or_id);
        const hasMatchingTag = src_element?.tagName?.toLowerCase() === (tag_name || '')?.toLowerCase();
        const hasMatchingId = src_element?.id && notEmptyTargClassId && src_element?.id === target_class_or_id;

        if (hasMatchingClass || hasMatchingTag || hasMatchingId) {
            return is_return_element ? src_element : true;
        }

        if (src_element.childNodes.length > 0) {
            for (const child of Array.from(src_element.childNodes)) {
                if (child.nodeType === 1) {
                    const result = this.checkNodeExistsInChildEl({ src_element: child as Element, target_class_or_id, tag_name, is_return_element });
                    if (result === true || (is_return_element && result)) {
                        return result;
                    }
                }
            }
        }

        return false;
    }

    /**
     * check if text already inserted on mutation by main DOM
     * this method is tailored for mutationLists iteration
     * @param {Element} src_element source element/ parent node that contains the child to search for
     * @param {string} target_class_or_id string of the classname or id name for search target
     * @param {Boolean} is_return_element flag to return true/ false
     * @returns {Boolean}
     */
    static checkTextInsertedInParentEl = (src_element: Element, target_class_or_id: string): boolean => {
        //nodeType 3 is text, when textContent is not empty
        // which means text exists, then return true
        if (src_element.nodeType == 3 && src_element.textContent !== '') {
            if (src_element?.parentElement && src_element.parentElement.className.includes(target_class_or_id)) {
                return true
            }
        }

        // Weird taobao rendering after click on different option of product (while changing price)
        // which has multiple comments first before putting new text
        // This is to capture the moment when comment is added, presume text is added on that time
        if (src_element.nodeType == 8 && src_element.nodeName == '#comment') {
            if (src_element?.previousElementSibling && src_element.previousElementSibling?.className?.includes(target_class_or_id)) {
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
        mode: 'addedNode' | 'removedNode' | 'addedText' | 'addedAttrib' | 'addedTextnNode'
        /**
         * The mutated target child node of domLoadedSourceParentNode.
         * the selector doesn't need to be in [class^=''] format
         * cause it will be passed to checkNodeExistsInChildEl | checkTextInsertedInParentEl as string
         * @type {string}
         */
        mutTargetChildName: Exclude<string, `[class*=`>;

        /**
         * This must be a valid selector or a reference to an existing DOM element,
         * because it is passed to document.querySelector for checking
         * preferably you find the unchangeable ancestor existed first on loading the web
         * @type {string}
         */
        domLoadedSourceParentNode: GenericSelector | string | Node
        subtree: boolean
        characterData: boolean
    };
    foundTargetNode: boolean;
    mutatedTargetParentNode: Element | null;
    mutatedTargetChildNode: Element | string;
    subtree: boolean;
    characterData: boolean;

    constructor() {
        super();

        this.config = { mode: 'addedNode', mutTargetChildName: '', domLoadedSourceParentNode: '[class^=""] [class*=""]', subtree: false, characterData: false };
        this.foundTargetNode = false
        this.mutatedTargetParentNode = null
        this.mutatedTargetChildNode = null
        this.subtree = false
        this.characterData = false
    }

    initObsThenChildObs(
        parentRegex: RegExp,
        childSelectors: string[],
        callback: (itemPageDivToObserve: string) => void
    ) {
        const observer = new MutationObserver((mutations, obs) => {
            const parentElement = Array.from(document.querySelectorAll('div')).find(el => parentRegex.test(el.className));

            if (parentElement) {
                const foundChildElements = childSelectors.map(selector =>
                    parentElement.querySelector(`[class*="${selector}"]`)
                );

                if (foundChildElements.every(el => el)) {
                    obs.disconnect();
                    const itemPageDivToObserve = `div[class*="${parentElement.className}"] ${foundChildElements.map(el => `[class*="${el.className}"]`).join(' ')}`;
                    callback(itemPageDivToObserve);
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    startObserver(callback) {
        const { mode, mutTargetChildName, domLoadedSourceParentNode, subtree, characterData } = this.config;

        let targetElement;
        if (typeof domLoadedSourceParentNode == 'object') {
            targetElement = domLoadedSourceParentNode
        } else {
            targetElement = document.querySelector(domLoadedSourceParentNode)
        }

        if (targetElement) {
            this.mutatedTargetParentNode = targetElement
            this.subtree = subtree
            this.characterData = characterData
        } else {
            // Not to throw error here as mutationObserver can still observe unloaded elements
            throw MutObsError.elementNotFound(domLoadedSourceParentNode as string);
        }

        console.log(`mutate.startObserver srcParent: ${domLoadedSourceParentNode}, mode: ${mode}, mutatedChild: ${mutTargetChildName}`)

        if (!mode || !mutTargetChildName) {
            throw MutObsError.emptyConfig()
        }

        const observer = new MutationObserver((mutationsList, observer) => {
            switch (mode) {
                case 'addedNode':
                    this.foundTargetNode = mutationsList.some(mutation => {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            return Array.from(mutation.addedNodes).some(node =>
                                MutationObserverManager.checkNodeExistsInChildEl({ src_element: node as Element, target_class_or_id: mutTargetChildName })
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
                            MutationObserverManager.checkNodeExistsInChildEl({ src_element: node as Element, target_class_or_id: mutTargetChildName })

                        )
                    );

                    this.stopObserverBeforeDomChanges(observer, callback)
                    break;

                case 'addedTextnNode':
                    this.foundTargetNode = mutationsList.some(mutation => {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            return Array.from(mutation.addedNodes).some(node =>
                                MutationObserverManager.checkTextInsertedInParentEl(node as Element, mutTargetChildName)
                            );
                        } else if (mutation.type === 'characterData') {
                            return MutationObserverManager.checkTextInsertedInParentEl(mutation.target as Element, mutTargetChildName)
                        }
                    });

                    this.stopObserverBeforeDomChanges(observer, callback)
                    break;
                case 'addedAttrib':
                    this.foundTargetNode = mutationsList.some(mutation => {
                        console.log(mutation.type, mutation)
                        return mutation.type === 'childList' &&
                            Array.from(mutation.addedNodes).some(node =>
                                MutationObserverManager.checkNodeExistsInChildEl({ src_element: node as Element, target_class_or_id: '', tag_name: mutTargetChildName })
                            )
                    });
                    break;
                default:
                    throw MutObsError.noSpecifiedCase()
            }

        })

        // To init observe on targetelement
        observer.observe(targetElement, { childList: true, subtree, characterData });
    }

    stopObserverBeforeDomChanges(observer, callback) {
        observer.disconnect()

        if (this.foundTargetNode) {
            callback()
        }
        observer.observe(this.mutatedTargetParentNode, { childList: true, subtree: this.subtree, characterData: this.characterData });
    }
}

export function promisify(fn) {
    return (...args) => new Promise((resolve, reject) => {
        fn(...args, result => {
            chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(result);
        });
    });
}