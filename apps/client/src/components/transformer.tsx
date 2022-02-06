import { toasts } from "@/toasts";
import { trpc } from "@/trpc";
import { CloseIcon, EditIcon, InfoIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
    Divider,
    Heading,
    IconButton,
    Radio,
    RadioGroup,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Tooltip,
    usePrevious,
} from "@chakra-ui/react";
import Editor from "@monaco-editor/react";
import type { OpenAPIWriterOptions } from "@transformer/backend/src";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import { proxy } from "valtio";
import { subscribeKey } from "valtio/utils";
import { snapshot } from "valtio/vanilla";
import { debounce } from "./debounce";
import { Show } from "./Show";
import { tsDefaultValue } from "./tsDefaultValue";

const localCache = new Map();
const texts = proxy({ ts: tsDefaultValue, jsonSchema: "", openApi: "", zod: "" });
const prevDefault = {
    ts: null as unknown as string,
    jsonSchema: null as unknown as string,
    openApi: null as unknown as string,
    zod: null as unknown as string,
};
const openApiSchemaVersions = [
    "3.0.3",
    "3.0.2",
    "3.0.1",
    "3.0.0",
    "3.0.0-rc2",
    "3.0.0-rc1",
    "3.0.0-rc0",
    "2.0",
    "1.2",
    "1.1",
    "1.0",
] as Array<OpenAPIWriterOptions["schemaVersion"]>;

type MaybeEditor = monaco.editor.IStandaloneCodeEditor | null;

// TODO refresh indicator for backend refresh

export function Transformer() {
    const editorsRef = useRef({
        ts: null as MaybeEditor,
        jsonSchema: null as MaybeEditor,
        openApi: null as MaybeEditor,
        zod: null as MaybeEditor,
    });
    const monacoRef = useRef(null as typeof monaco | null);
    const tsText = useRef<string>(texts.ts);

    const tsToOapi = trpc.useMutation("tsToOapi", {
        onSuccess: (result, { value }) => {
            localCache.set(`tsToOapi-${hashCode(value)}`, result);
            if (editorsRef.current.openApi && editorsRef.current.openApi.getValue() !== result) {
                return editorsRef.current.openApi.setValue(result);
            }

            texts.openApi = result;
        },
        onError: (err) => {
            console.error(err);
            toasts.error("openApi: " + err.message);
        },
    });
    const tsToJsonSchema = trpc.useMutation("tsToJsonSchema", {
        onSuccess: (result, value) => {
            localCache.set(`tsToJsonSchema-${hashCode(value)}`, result);
            if (editorsRef.current.jsonSchema && editorsRef.current.jsonSchema.getValue() !== result) {
                return editorsRef.current.jsonSchema.setValue(result);
            }

            texts.jsonSchema = result;
        },
        onError: (err) => {
            console.error(err);
            toasts.error("jsonSchema: " + err.message);
        },
    });
    const tsToZod = trpc.useMutation("tsToZod", {
        onSuccess: (result, value) => {
            localCache.set(`tsToZod-${hashCode(value)}`, result);
            if (editorsRef.current.zod && editorsRef.current.zod.getValue() !== result) {
                return editorsRef.current.zod.setValue(result);
            }

            texts.zod = result;
        },
        onError: (err) => {
            console.error(err);
            toasts.error("zod: " + err.message);
        },
    });

    const [destinations, setDestinations] = useState<string[]>(["jsonSchema", "zod"]);
    const callbackRef = useRef(null as unknown as (value: string) => void);
    const prev = useRef(prevDefault);
    const prevDestinations = usePrevious(destinations);

    // update callbackRef when destinations change, also call API
    useEffect(() => {
        callbackRef.current = debounce((value: string) => {
            if (!value) {
                clearTexts();
                return console.warn("no value");
            }

            const hasChanged = value !== prev.current.ts;
            const hasDestinationsChanged = destinations.join() !== prevDestinations?.join();
            if (value !== null && prev.current.ts !== "" && !hasChanged && !hasDestinationsChanged) {
                return console.warn("no change", { prev: prev.current.ts, value, destinations, prevDestinations });
            }
            prev.current.ts = value;

            const snap = snapshot(texts);
            if (destinations.includes("openApi")) {
                const cacheKey = `tsToOapi-${hashCode(value)}`;
                if (!localCache.has(cacheKey)) {
                    tsToOapi.mutate({
                        value,
                        format: openApiOptions.current.format as "json" | "yaml",
                        schemaVersion: openApiOptions.current.schemaVersion,
                    });
                    prev.current.openApi = snap.openApi;
                } else {
                    const result = localCache.get(cacheKey);
                    editorsRef.current.openApi!.setValue(result);
                    texts.openApi = result;
                    console.warn("openApi didnt change, skipping");
                }
            }
            if (destinations.includes("jsonSchema")) {
                const cacheKey = `tsToJsonSchema-${hashCode(value)}`;
                if (!localCache.has(cacheKey)) {
                    tsToJsonSchema.mutate(value);
                    prev.current.jsonSchema = snap.jsonSchema;
                } else {
                    const result = localCache.get(cacheKey);
                    editorsRef.current.jsonSchema!.setValue(result);
                    texts.jsonSchema = result;
                    console.warn("jsonSchema didnt change, skipping");
                }
            }
            if (destinations.includes("zod")) {
                const cacheKey = `tsToZod-${hashCode(value)}`;
                if (!localCache.has(cacheKey)) {
                    tsToZod.mutate(value);
                    prev.current.zod = snap.zod;
                } else {
                    const result = localCache.get(cacheKey);
                    editorsRef.current.zod!.setValue(result);
                    texts.zod = result;
                    console.warn("zod didnt change, skipping");
                }
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

    const openApiOptions = useRef<Required<Pick<OpenAPIWriterOptions, "format" | "schemaVersion">>>({
        format: "json",
        schemaVersion: openApiSchemaVersions[0]!,
    });
    const [isEditingOpenApi, setIsEditingOpenApi] = useState(false);

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
                            <Checkbox value="openApi">OpenAPI</Checkbox>
                            <Checkbox value="zod">Zod</Checkbox>
                        </Stack>
                    </CheckboxGroup>
                </Stack>
                <Stack direction="row" alignItems="center">
                    <Tooltip label="They will be stripped out and shouldn't be expected to work well">
                        <InfoIcon color="red.300" />
                    </Tooltip>
                    <Text fontWeight="bold" color="red.700">
                        Please do NOT use complex TS Generics
                    </Text>
                </Stack>
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
                        onMount={(ref, monaco) => {
                            editorsRef.current.ts = ref!;
                            monacoRef.current = monaco!;
                        }}
                        onChange={(value) => {
                            tsText.current = value!;

                            const model = editorsRef.current.ts!.getModel();
                            if (model) {
                                const markers = monacoRef.current!.editor.getModelMarkers({ resource: model.uri });
                                if (!markers.length) {
                                    texts.ts = tsText.current;
                                }
                            }
                        }}
                        onValidate={(markers) => {
                            if (markers.length) {
                                return console.warn("TS Errors", markers);
                            }
                            texts.ts = tsText.current;
                        }}
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
                        />
                    </Stack>
                </Show>
                <Show cond={destinations.includes("openApi")}>
                    <Stack w="100%">
                        <Stack>
                            <Stack direction="row" alignContent="flex-end">
                                <Heading as="h2" fontSize={24}>
                                    OpenAPI
                                </Heading>
                                <Text fontSize="xs">
                                    {openApiOptions.current.schemaVersion} ({openApiOptions.current.format})
                                </Text>
                                <IconButton
                                    onClick={() =>
                                        isEditingOpenApi ? setIsEditingOpenApi(false) : setIsEditingOpenApi(true)
                                    }
                                    size="sm"
                                    icon={isEditingOpenApi ? <CloseIcon /> : <EditIcon />}
                                    aria-label="Edit"
                                />
                            </Stack>
                            <Show cond={isEditingOpenApi}>
                                <Box px="4" py="2">
                                    <RadioGroup
                                        defaultValue={openApiOptions.current.format}
                                        onChange={(v) =>
                                            (openApiOptions.current.format = v as OpenAPIWriterOptions["format"])
                                        }
                                    >
                                        <Stack direction="row">
                                            <Radio value="json">JSON</Radio>
                                            <Radio value="yaml">YAML</Radio>
                                        </Stack>
                                    </RadioGroup>
                                    <Select
                                        w="100%"
                                        onChange={(e) =>
                                            (openApiOptions.current.schemaVersion = e.target.value as Exclude<
                                                OpenAPIWriterOptions["schemaVersion"],
                                                undefined
                                            >)
                                        }
                                    >
                                        {openApiSchemaVersions.map((v) => (
                                            <option key={v} value={v}>
                                                {v}
                                            </option>
                                        ))}
                                    </Select>
                                </Box>
                            </Show>
                        </Stack>
                        <Divider />
                        <Editor
                            height="100%"
                            defaultLanguage="json"
                            options={{ minimap: { enabled: false }, readOnly: true }}
                            onMount={(ref) => {
                                editorsRef.current.openApi = ref!;
                                ref.setValue(texts.openApi);
                            }}
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
                        />
                    </Stack>
                </Show>
            </SimpleGrid>
        </Stack>
    );
}

// https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0
function hashCode(s: string) {
    let h = 0;
    let i = 0;
    for (i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;

    return h;
}
