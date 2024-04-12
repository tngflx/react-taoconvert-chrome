
export class ObjectMgr {
    static FIND_EMPTY_VALUE = 'findEmptyValue';
    static FIND_MATCH_VALUE = 'findMatchValue';

    findObject(options: { obj: Record<string, any>, value?: any, flag: string }): any | undefined {
        const { obj, value, flag } = options;
        const queue = [obj];
        while (queue.length > 0) {
            const currentObj = queue.shift();
            for (const key in currentObj) {
                if (currentObj.hasOwnProperty(key)) {
                    const objValue = currentObj[key];
                    switch (flag) {
                        case ObjectMgr.FIND_EMPTY_VALUE:
                            if (objValue && typeof objValue === 'object' && Object.keys(objValue).length === 0) {
                                return currentObj;
                            }
                            break;
                        case ObjectMgr.FIND_MATCH_VALUE:
                            if (objValue === value) {
                                return currentObj;
                            }
                            break;
                    }
                    if (typeof objValue === 'object') {
                        queue.push(objValue);
                    }
                }
            }
        }
        return undefined;
    }
}
