import { useMemoRef } from "@/utils/useSyncRef";
import { usePrevious } from "@chakra-ui/react";
import { useAtomValue } from "jotai/utils";
import { useEffect } from "react";
import { subscribeKey } from "valtio/utils";
import { snapshot } from "valtio/vanilla";
import { debounce } from "../utils/debounce";
import { useTsToOapi, useTsToJsonSchema, useTsToZod } from "./hooks";
import { clearTexts, currentOpenApiProxy, editorRefs, localCache, prevTextsProxy, textsProxy } from "./store";
import { destinationsAtom } from "./TransformerPage";
import { hashCode } from "./hashCode";

export function useTransformerMutation({
    tsToOapi,
    tsToJsonSchema,
    tsToZod,
}: {
    tsToOapi: ReturnType<typeof useTsToOapi>;
    tsToJsonSchema: ReturnType<typeof useTsToJsonSchema>;
    tsToZod: ReturnType<typeof useTsToZod>;
}) {
    const destinations = useAtomValue(destinationsAtom);
    const prevDestinations = usePrevious(destinations);

    const callbackRef = useMemoRef(
        debounce((value: string) => {
            if (!value) {
                clearTexts();
                return console.warn("no value");
            }

            const prev = snapshot(prevTextsProxy);
            const hasChanged = value !== prev.ts;
            const hasDestinationsChanged = destinations.join() !== prevDestinations?.join();
            if (value !== null && prev.ts !== "" && !hasChanged && !hasDestinationsChanged) {
                return console.warn("no change", { prev: prev.ts, value, destinations, prevDestinations });
            }
            prevTextsProxy.ts = value;

            const texts = snapshot(textsProxy);
            if (destinations.includes("openApi")) {
                const cacheKey = `tsToOapi-${hashCode(value)}`;
                if (!localCache.has(cacheKey)) {
                    const currentOpenApi = snapshot(currentOpenApiProxy);
                    tsToOapi.mutate({
                        value,
                        format: currentOpenApi.format as "json" | "yaml",
                        schemaVersion: currentOpenApi.schemaVersion,
                    });
                    prevTextsProxy.openApi = texts.openApi;
                } else {
                    const result = localCache.get(cacheKey);
                    editorRefs.openApi!.setValue(result);
                    textsProxy.openApi = result;
                    console.warn("openApi didnt change, skipping");
                }
            }
            if (destinations.includes("jsonSchema")) {
                const cacheKey = `tsToJsonSchema-${hashCode(value)}`;
                if (!localCache.has(cacheKey)) {
                    tsToJsonSchema.mutate(value);
                    prevTextsProxy.jsonSchema = texts.jsonSchema;
                } else {
                    const result = localCache.get(cacheKey);
                    editorRefs.jsonSchema!.setValue(result);
                    textsProxy.jsonSchema = result;
                    console.warn("jsonSchema didnt change, skipping");
                }
            }
            if (destinations.includes("zod")) {
                const cacheKey = `tsToZod-${hashCode(value)}`;
                if (!localCache.has(cacheKey)) {
                    tsToZod.mutate(value);
                    prevTextsProxy.zod = texts.zod;
                } else {
                    const result = localCache.get(cacheKey);
                    editorRefs.zod!.setValue(result);
                    textsProxy.zod = result;
                    console.warn("zod didnt change, skipping");
                }
            }
        }, 300),
        [destinations]
    );

    // call API on destinations change
    useEffect(() => {
        callbackRef.current(snapshot(textsProxy).ts);
    }, [destinations]);

    // call API on ts change
    useEffect(() => {
        const unsubTs = subscribeKey(textsProxy, "ts", (value) => callbackRef.current(value));

        return () => {
            unsubTs();
        };
    }, []);

    return { destinations };
}
