import { trpc } from "@/trpc";
import {
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
    Divider,
    Heading,
    SimpleGrid,
    Stack,
    Text,
    usePrevious,
} from "@chakra-ui/react";
import Editor from "@monaco-editor/react";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import { proxy } from "valtio";
import { subscribeKey } from "valtio/utils";
import { snapshot } from "valtio/vanilla";
import { debounce } from "./debounce";
import { Show } from "./Show";
import { tsDefaultValue } from "./tsDefaultValue";

const texts = proxy({ ts: tsDefaultValue, jsonSchema: "", openApi: "", zod: "" });
const prevDefault = { ts: null as string, jsonSchema: null as string, openApi: null as string, zod: null as string };

type MaybeEditor = monaco.editor.IStandaloneCodeEditor | null;

export default function Transformer() {
    const editorsRef = useRef({
        ts: null as MaybeEditor,
        jsonSchema: null as MaybeEditor,
        openApi: null as MaybeEditor,
        zod: null as MaybeEditor,
    });

    const tsToOapi = trpc.useMutation(["tsToOapi"], {
        onSuccess: (result) => {
            if (editorsRef.current.openApi && editorsRef.current.openApi.getValue() !== result) {
                editorsRef.current.openApi.setValue(result);
                return;
            }

            texts.openApi = result;
        },
    });
    const tsToJsonSchema = trpc.useMutation(["tsToJsonSchema"], {
        onSuccess: (result) => {
            if (editorsRef.current.jsonSchema && editorsRef.current.jsonSchema.getValue() !== result) {
                editorsRef.current.jsonSchema.setValue(result);
                return;
            }

            texts.jsonSchema = result;
        },
    });
    const tsToZod = trpc.useMutation(["tsToZod"], {
        onSuccess: (result) => {
            if (editorsRef.current.zod && editorsRef.current.zod.getValue() !== result) {
                editorsRef.current.zod.setValue(result);
                return;
            }

            texts.zod = result;
        },
    });

    const [destinations, setDestinations] = useState<string[]>(["jsonSchema", "zod"]);
    const callbackRef = useRef(null);
    const prev = useRef(prevDefault);
    const prevDestinations = usePrevious(destinations);

    // update callbackRef when destinations change, also call API
    useEffect(() => {
        callbackRef.current = debounce((value: string) => {
            if (!value) return;

            const hasChanged = value !== prev.current.ts;
            const hasDestinationsChanged = destinations.join() !== prevDestinations?.join();
            if (!hasChanged && !hasDestinationsChanged) return;
            prev.current.ts = value;

            const snap = snapshot(texts);
            if (destinations.includes("openApi")) {
                if (prev.current.openApi !== snap.openApi) {
                    tsToOapi.mutate(value);
                }
                prev.current.openApi = snap.openApi;
            }
            if (destinations.includes("jsonSchema")) {
                if (prev.current.jsonSchema !== snap.jsonSchema) {
                    tsToJsonSchema.mutate(value);
                }
                prev.current.jsonSchema = snap.jsonSchema;
            }
            if (destinations.includes("zod")) {
                if (prev.current.zod !== snap.zod) {
                    tsToZod.mutate(value);
                }
                prev.current.zod = snap.zod;
            }
        }, 300);

        callbackRef.current(snapshot(texts).ts);
    }, [destinations]);

    // call API on ts change
    useEffect(() => {
        const unsubTs = subscribeKey(texts, "ts", (value) => callbackRef.current(value));
        return () => {
            unsubTs();
        };
    }, []);

    const clearTexts = () => {
        // texts.ts = texts.jsonSchema = texts.openApi = texts.zod = "";
        prev.current = prevDefault;
        editorsRef.current.ts?.setValue("");
        editorsRef.current.jsonSchema?.setValue("");
        editorsRef.current.openApi?.setValue("");
        editorsRef.current.zod?.setValue("");
    };
    const resetToDefault = () => {
        texts.ts = tsDefaultValue;
        prev.current = prevDefault;
        editorsRef.current.ts?.setValue(tsDefaultValue);
    };

    return (
        <Stack w="100%" h="100%" p="4">
            <Stack direction="row" justifyContent="space-between">
                <Stack direction="row" spacing="8">
                    <Stack direction="row">
                        <Button onClick={() => clearTexts()}>Clear</Button>
                        <Button onClick={() => resetToDefault()}>Reset to default</Button>
                    </Stack>
                    <Divider orientation="vertical" />
                    <CheckboxGroup
                        colorScheme="green"
                        defaultValue={destinations}
                        onChange={(v) => setDestinations(v as string[])}
                    >
                        <Stack spacing={[1, 5]} direction={["column", "row"]}>
                            <Checkbox value="jsonSchema">JSON Schema</Checkbox>
                            <Checkbox value="openApi">OpenAPI 3</Checkbox>
                            <Checkbox value="zod">Zod</Checkbox>
                        </Stack>
                    </CheckboxGroup>
                </Stack>
                <div>
                    <Text fontWeight="bold" color="red">
                        Please do NOT use TS Generics
                    </Text>
                </div>
            </Stack>
            <SimpleGrid columns={[1, 2, null, destinations.length + 1]} h="100%" p="2">
                <Stack w="100%">
                    <Heading as="h2" fontSize={24}>
                        Typescript
                    </Heading>
                    <Divider />
                    <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        defaultValue={texts.ts}
                        options={{ minimap: { enabled: false } }}
                        onMount={(ref) => (editorsRef.current.ts = ref!)}
                        onChange={(value) => (texts.ts = value!)}
                    />
                </Stack>
                <Show cond={destinations.includes("jsonSchema")}>
                    <Stack w="100%">
                        <Heading as="h2" fontSize={24}>
                            JSON Schema
                        </Heading>
                        <Divider />
                        <Editor
                            height="100%"
                            defaultLanguage="json"
                            options={{ minimap: { enabled: false }, readOnly: true }}
                            onMount={(ref) => {
                                editorsRef.current.jsonSchema = ref!;
                                ref.setValue(texts.jsonSchema);
                            }}
                            onChange={(value) => (texts.jsonSchema = value!)}
                        />
                    </Stack>
                </Show>
                <Show cond={destinations.includes("openApi")}>
                    <Stack w="100%">
                        <Heading as="h2" fontSize={24}>
                            OpenAPI 3
                        </Heading>
                        <Divider />
                        <Editor
                            height="100%"
                            defaultLanguage="json"
                            options={{ minimap: { enabled: false }, readOnly: true }}
                            onMount={(ref) => {
                                editorsRef.current.openApi = ref!;
                                ref.setValue(texts.openApi);
                            }}
                            onChange={(value) => (texts.openApi = value!)}
                        />
                    </Stack>
                </Show>
                <Show cond={destinations.includes("zod")}>
                    <Stack w="100%">
                        <Heading as="h2" fontSize={24}>
                            Zod schemas
                        </Heading>
                        <Divider />
                        <Editor
                            height="100%"
                            defaultLanguage="typescript"
                            options={{ minimap: { enabled: false }, readOnly: true }}
                            onMount={(ref) => {
                                editorsRef.current.zod = ref!;
                                ref.setValue(texts.zod);
                            }}
                            onChange={(value) => (texts.zod = value!)}
                        />
                    </Stack>
                </Show>
                {/* </Flex> */}
            </SimpleGrid>
        </Stack>
    );
}
