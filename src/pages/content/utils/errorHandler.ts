export class MutObsError extends Error {
    static ERROR_CODES = {
        elementNotFound: "Element not found.",
        emptyConfig: "Config for MutationObserverManager is empty. Please provide a valid configuration.",
        noSpecifiedCase: "Switch statement doesn't have any suitable case"
    } as const;

    errorCode!: keyof typeof MutObsError.ERROR_CODES;

    private static instance: MutObsError | null = null;

    private constructor(code: keyof typeof MutObsError.ERROR_CODES, message: string) {
        super(message);
        this.name = 'MutObsError';
        this.errorCode = code;
    }

    private static createError(code: keyof typeof MutObsError.ERROR_CODES, customMessage?: string): MutObsError {
        if (!MutObsError.instance) {
            const defaultMessage = MutObsError.ERROR_CODES[code];
            const message = `${defaultMessage}${customMessage ? ` - ${customMessage}` : ''}`;
            MutObsError.instance = new MutObsError(code, message);
        }
        return MutObsError.instance;
    }

    static elementNotFound(customMessage?: string): MutObsError {
        return this.createError('elementNotFound', customMessage);
    }

    static emptyConfig(customMessage?: string): MutObsError {
        return this.createError('emptyConfig', customMessage);
    }

    static noSpecifiedCase(customMessage?: string): MutObsError {
        return this.createError('noSpecifiedCase', customMessage);
    }
}
