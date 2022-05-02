import { useMemoRef } from "@/utils/useSyncRef";
import { usePrevious } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { subscribeKey } from "valtio/utils";
import { snapshot } from "valtio/vanilla";
import { debounce } from "../utils/debounce";
import { hashCode } from "./hashCode";
import {
    useJsonSchemaToOpenApi,
    useJsonSchemaToTs,
    useJsonSchemaToZod,
    useOpenApiToJsonSchema,
    useOpenApiToTs,
    useOpenApiToZod,
    useTsToJsonSchema,
    useTsToOapi,
    useTsToZod,
} from "./hooks";
import {
    clearTexts,
    currentOpenApiProxy,
    destinationsAtom,
    editorRefs,
    localCache,
    prevTextsProxy,
    textsProxy,
} from "./store";

/** very copy pasty shitty hook but at least that works i guess ? */
export function useTransformerMutation({
    tsToOapi,
    tsToJsonSchema,
    tsToZod,
    openApiToTs,
    openApiToJsonSchema,
    openApiToZod,
    jsonSchemaToTs,
    jsonSchemaToOpenApi,
    jsonSchemaToZod,
}: {
    tsToOapi: ReturnType<typeof useTsToOapi>;
    tsToJsonSchema: ReturnType<typeof useTsToJsonSchema>;
    tsToZod: ReturnType<typeof useTsToZod>;
    openApiToTs: ReturnType<typeof useOpenApiToTs>;
    openApiToJsonSchema: ReturnType<typeof useOpenApiToJsonSchema>;
    openApiToZod: ReturnType<typeof useOpenApiToZod>;
    jsonSchemaToTs: ReturnType<typeof useJsonSchemaToTs>;
    jsonSchemaToOpenApi: ReturnType<typeof useJsonSchemaToOpenApi>;
    jsonSchemaToZod: ReturnType<typeof useJsonSchemaToZod>;
}) {
    const [destinations, setDestinations] = useAtom(destinationsAtom);
    const prevDestinations = usePrevious(destinations);

    const callbackRef = useMemoRef(
        debounce((value: string) => {
            if (!value) {
                clearTexts();
                return console.warn("no value");
            }

            const prev = snapshot(prevTextsProxy);
            const texts = snapshot(textsProxy);

            const hasChanged = value !== prev[texts.source];
            const hasDestinationsChanged = destinations.join() !== prevDestinations?.join();
            if (value !== null && prev[texts.source] !== "" && !hasChanged && !hasDestinationsChanged) {
                return console.warn("no change", { prev: prev[texts.source], value, destinations, prevDestinations });
            }
            prevTextsProxy[texts.source] = value;

            if (texts.source === "ts") {
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
            } else if (texts.source === "openApi") {
                if (destinations.includes("ts")) {
                    const cacheKey = `openApiToTs-${hashCode(value)}`;
                    if (!localCache.has(cacheKey)) {
                        const currentOpenApi = snapshot(currentOpenApiProxy);
                        openApiToTs.mutate({
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
                    const cacheKey = `openApiToJsonSchema-${hashCode(value)}`;
                    if (!localCache.has(cacheKey)) {
                        const currentOpenApi = snapshot(currentOpenApiProxy);
                        openApiToJsonSchema.mutate({
                            value,
                            format: currentOpenApi.format as "json" | "yaml",
                            schemaVersion: currentOpenApi.schemaVersion,
                        });
                        prevTextsProxy.jsonSchema = texts.jsonSchema;
                    } else {
                        const result = localCache.get(cacheKey);
                        editorRefs.jsonSchema!.setValue(result);
                        textsProxy.jsonSchema = result;
                        console.warn("jsonSchema didnt change, skipping");
                    }
                }
                if (destinations.includes("zod")) {
                    const cacheKey = `openApiToZod-${hashCode(value)}`;
                    if (!localCache.has(cacheKey)) {
                        const currentOpenApi = snapshot(currentOpenApiProxy);
                        openApiToZod.mutate({
                            value,
                            format: currentOpenApi.format as "json" | "yaml",
                            schemaVersion: currentOpenApi.schemaVersion,
                        });
                        prevTextsProxy.zod = texts.zod;
                    } else {
                        const result = localCache.get(cacheKey);
                        editorRefs.zod!.setValue(result);
                        textsProxy.zod = result;
                        console.warn("zod didnt change, skipping");
                    }
                }
            } else if (texts.source === "jsonSchema") {
                if (destinations.includes("ts")) {
                    const cacheKey = `jsonSchemaToTs-${hashCode(value)}`;
                    if (!localCache.has(cacheKey)) {
                        jsonSchemaToTs.mutate(value);
                        prevTextsProxy.openApi = texts.openApi;
                    } else {
                        const result = localCache.get(cacheKey);
                        editorRefs.openApi!.setValue(result);
                        textsProxy.openApi = result;
                        console.warn("openApi didnt change, skipping");
                    }
                }
                if (destinations.includes("openApi")) {
                    const cacheKey = `jsonSchemaToOpenApi-${hashCode(value)}`;
                    if (!localCache.has(cacheKey)) {
                        const currentOpenApi = snapshot(currentOpenApiProxy);
                        jsonSchemaToOpenApi.mutate({
                            value,
                            format: currentOpenApi.format as "json" | "yaml",
                            schemaVersion: currentOpenApi.schemaVersion,
                        });
                        prevTextsProxy.jsonSchema = texts.jsonSchema;
                    } else {
                        const result = localCache.get(cacheKey);
                        editorRefs.jsonSchema!.setValue(result);
                        textsProxy.jsonSchema = result;
                        console.warn("jsonSchema didnt change, skipping");
                    }
                }
                if (destinations.includes("zod")) {
                    const cacheKey = `jsonSchemaToZod-${hashCode(value)}`;
                    if (!localCache.has(cacheKey)) {
                        jsonSchemaToZod.mutate(value);
                        prevTextsProxy.zod = texts.zod;
                    } else {
                        const result = localCache.get(cacheKey);
                        editorRefs.zod!.setValue(result);
                        textsProxy.zod = result;
                        console.warn("zod didnt change, skipping");
                    }
                }
            }
        }, 300),
        [destinations]
    );

    // call API on destinations change
    useEffect(() => {
        const texts = snapshot(textsProxy);
        callbackRef.current(texts[texts.source]);
    }, [destinations]);

    const texts = useSnapshot(textsProxy);

    // call API on ts change
    useEffect(() => {
        const unsubTs = subscribeKey(textsProxy, texts.source, (value) => callbackRef.current(value));

        return () => {
            unsubTs();
        };
    }, [texts.source]);

    // Add self (source) to destinations so that when swapping to another it will also output in that format
    useEffect(() => {
        if (!destinations.includes(texts.source)) {
            setDestinations((prev) => [...prev, texts.source]);
        }
    }, [texts.source, destinations]);

    return { destinations };
}
