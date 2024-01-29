export class mutObsError extends Error {
    static errorCodes = {
        elementNotFound: "Element not found.",
        emptyConfig: "Config for MutationObserverManager is empty. Please provide a valid configuration.",
        noSpecifiedCase: "Switch statement doesn't have any suitable case"
    } as const;

    errorCode: keyof typeof mutObsError.errorCodes;

    constructor(errorCode: keyof typeof mutObsError.errorCodes, customMessage?: string) {
        super(customMessage || mutObsError.errorCodes[errorCode]);
        this.errorCode = errorCode;
        this.name = 'CustomError';
    }
}