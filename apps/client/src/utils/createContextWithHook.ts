import * as React from "react";

// Adapted from https://github.com/chakra-ui/chakra-ui/blob/27eec8de744d05eef5bcbd2de651f3a37370ff2c/packages/react-utils/src/context.ts

export interface CreateContextOptions<Value, Initial extends Value = Value> {
    /**
     * If `true`, React will throw if context is `null` or `undefined`
     * In some cases, you might want to support nested context, so you can set it to `false`
     */
    strict?: boolean;
    /**
     * Error message to throw if the context is `undefined`
     */
    errorMessage?: string;
    /**
     * The display name of the context
     */
    name: string;
    /**
     * The display name of the context
     */
    initialValue?: Initial | undefined;
}

type CreateContextReturn<T> = [React.Provider<T>, () => T, React.Context<T>];

/**
 * Creates a named context, provider, and hook.
 *
 * @param options create context options
 */
export function createContextWithHook<ContextType>(
    options: CreateContextOptions<ContextType>
): CreateContextReturn<ContextType>;
export function createContextWithHook<ContextType>(
    name: string,
    options?: CreateContextOptions<ContextType>
): CreateContextReturn<ContextType>;
export function createContextWithHook<ContextType>(
    nameOrOptions: string | CreateContextOptions<ContextType>,
    optionsProp: CreateContextOptions<ContextType> = { name: undefined as any }
): CreateContextReturn<ContextType> {
    const options = typeof nameOrOptions === "string" ? optionsProp : nameOrOptions;
    const name = typeof nameOrOptions === "string" ? nameOrOptions : options.name;
    const {
        strict = false,
        errorMessage = `useContext: "${
            name || "context"
        }" is undefined. Seems you forgot to wrap component within the Provider`,
    } = options;

    const Context = React.createContext<ContextType | undefined>(undefined);

    Context.displayName = name;

    function useContext() {
        const context = React.useContext(Context);

        if (!context && strict) {
            const error = new Error(errorMessage);
            error.name = "ContextError";
            // @ts-ignore
            Error.captureStackTrace?.(error, useContext);
            throw error;
        }

        return context;
    }

    return [Context.Provider, useContext, Context] as CreateContextReturn<ContextType>;
}
