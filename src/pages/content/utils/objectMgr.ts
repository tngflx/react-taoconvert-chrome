export class ObjectMgr {
    static FIND_EMPTY_VALUE = 'findEmptyValue';
    static FIND_MATCH_VALUE = 'findMatchValue';
    static FIND_MATCH_PARENTCHILD = 'findMatchParentChildVal';

    findObject(options: { obj: Record<string, any>, value?: any, flag: string }): any | undefined {
        const { obj, value, flag } = options;
        const stack = [{ obj, parentKey: null }];

        while (stack.length > 0) {
            const { obj: currentObj, parentKey } = stack.pop();

            for (const key in currentObj) {
                if (currentObj.hasOwnProperty(key)) {
                    const objValue = currentObj[key];
                    switch (flag) {
                        case ObjectMgr.FIND_EMPTY_VALUE:
                            if (objValue && typeof objValue === 'object' && Object.keys(objValue).length === 0) {
                                return { parentKey, currentObj };
                            }
                            break;
                        case ObjectMgr.FIND_MATCH_VALUE:
                            if (Object.keys(objValue).some(k => k === value)) {
                                return currentObj;
                            }
                            break;
                        case ObjectMgr.FIND_MATCH_PARENTCHILD:
                            if (Object.keys(objValue).some(k => k === value)) {
                                return currentObj;
                            } else {
                                for (const nestedKey in objValue) {
                                    if (objValue.hasOwnProperty(nestedKey)) {
                                        const nestedObjValue = objValue[nestedKey];
                                        if (typeof nestedObjValue === 'object') {
                                            if (Object.keys(nestedObjValue).some(k => k === value)) {
                                                return currentObj;
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                    }
                    if (typeof objValue === 'object') {
                        stack.push({ obj: objValue, parentKey: currentObj });
                    }
                }
            }
        }
        return undefined;
    }
}
