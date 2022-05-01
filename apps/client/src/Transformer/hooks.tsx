import { trpc } from "@/trpc";
import { toasts } from "@/utils/toasts";
import { isType } from "@pastable/core";
import { InferMutationInput, TMutation } from "@transformer/backend/src";
import { editorRefs, localCache, textsProxy } from "./store";
import { hashCode } from "./hashCode";

const mutationNameToEditorRefName = (name: TMutation) =>
    ((
        {
            tsToOapi: "openApi",
            tsToJsonSchema: "jsonSchema",
            tsToZod: "zod",
        } as const
    )[name]);

function makeTransformerMutationHook(name: TMutation) {
    return () =>
        trpc.useMutation(name, {
            mutationKey: name,
            onSuccess: (result, input) => {
                const value = isType<InferMutationInput<"tsToOapi">>(input, name === "tsToOapi") ? input.value : input;
                localCache.set(`${name}-${hashCode(value)}`, result);

                const refName = mutationNameToEditorRefName(name)!;
                const ref = editorRefs[refName];
                if (ref && ref.getValue() !== result) {
                    return ref.setValue(result);
                }

                textsProxy[refName] = result;
            },
            onError: (err) => {
                console.error(err);
                toasts.error(name + ": " + err.message);
            },
        });
}

export const useTsToOapi = makeTransformerMutationHook("tsToOapi");
export const useTsToJsonSchema = makeTransformerMutationHook("tsToJsonSchema");
export const useTsToZod = makeTransformerMutationHook("tsToZod");
