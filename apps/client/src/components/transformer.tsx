import { trpc } from "@/trpc";
import { Checkbox, CheckboxGroup, Divider, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
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
    const prev = useRef({ ts: null, jsonSchema: null, openApi: null, zod: null });

    // update callbackRef when destinations change, also call API
    useEffect(() => {
        callbackRef.current = debounce((value: string) => {
            if (!value) return;
            if (value === prev.current.ts) return;
            prev.current.ts = value;

            const snap = snapshot(texts);
            console.log(snap);
            if (destinations.includes("openApi")) {
                if (prev.current.openApi !== snap.openApi) {
                    tsToOapi.mutate(value);
                }
                prev.current.openApi = value;
            }
            if (destinations.includes("jsonSchema")) {
                if (prev.current.jsonSchema !== snap.jsonSchema) {
                    tsToJsonSchema.mutate(value);
                }
                prev.current.jsonSchema = value;
            }
            if (destinations.includes("zod")) {
                if (prev.current.zod !== snap.zod) {
                    tsToZod.mutate(value);
                }
                prev.current.zod = value;
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

    return (
        <Stack w="100%" h="100%" p="4">
            <Stack direction="row" justifyContent="space-between">
                <div>
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
                </div>
                <div>
                    <Text fontWeight="bold" color="red">
                        Please do NOT use TS Generics
                    </Text>
                </div>
            </Stack>
            {/* <Flex w="100%" h="100%" p="2"> */}
            <SimpleGrid columns={destinations.length + 1} h="100%" p="2">
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
                            defaultValue={texts.jsonSchema}
                            options={{ minimap: { enabled: false }, readOnly: true }}
                            onMount={(ref) => (editorsRef.current.jsonSchema = ref!)}
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
                            defaultValue={texts.openApi}
                            options={{ minimap: { enabled: false }, readOnly: true }}
                            onMount={(ref) => (editorsRef.current.openApi = ref!)}
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
                            defaultValue={texts.zod}
                            options={{ minimap: { enabled: false }, readOnly: true }}
                            onMount={(ref) => (editorsRef.current.zod = ref!)}
                            onChange={(value) => (texts.zod = value!)}
                        />
                    </Stack>
                </Show>
                {/* </Flex> */}
            </SimpleGrid>
        </Stack>
    );
}
