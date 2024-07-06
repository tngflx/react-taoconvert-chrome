export class ObjectMgr {
    static FIND_EMPTY_VALUE = 'findEmptyValue';
    static FIND_MATCH_VALUE = 'findMatchValue';
    static FIND_MATCH_PARENTCHILD = 'findMatchParentChildVal';

    findObject(options: { obj: Record<string, any>, value?: any, flag: string }): any | undefined {
        const { obj, value, flag } = options;
        const stack = [{ obj, parentKey: null, currentKey: null }];

        while (stack.length > 0) {
            const { obj: currentObj, parentKey, currentKey } = stack.pop();

            for (const key in currentObj) {
                if (currentObj.hasOwnProperty(key)) {
                    const objValue = currentObj[key];
                    switch (flag) {
                        case ObjectMgr.FIND_EMPTY_VALUE:
                            if (objValue && typeof objValue === 'object' && Object.keys(objValue).length === 0) {
                                return { parentKey: currentKey ?? key, currentObj: { [key]: objValue } };
                            }
                            break;
                        case ObjectMgr.FIND_MATCH_VALUE:
                            if (objValue === value) {
                                return { parentKey: currentKey ?? key, currentObj: { [key]: objValue } };
                            }
                            break;
                        case ObjectMgr.FIND_MATCH_PARENTCHILD:
                            if (objValue === value) {
                                return { parentKey: currentKey ?? key, currentObj: { [key]: objValue } };
                            } else if (typeof objValue === 'object') {
                                for (const nestedKey in objValue) {
                                    if (objValue.hasOwnProperty(nestedKey)) {
                                        const nestedObjValue = objValue[nestedKey];
                                        if (nestedObjValue === value) {
                                            return { parentKey: currentKey ?? key, currentObj: { [key]: objValue } };
                                        }
                                    }
                                }
                            }
                            break;
                    }
                    if (typeof objValue === 'object') {
                        stack.push({ obj: objValue, parentKey: key, currentKey: key });
                    }
                }
            }
        }
        return undefined;
    }
}
