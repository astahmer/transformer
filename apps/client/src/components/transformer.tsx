import { trpc } from "@/trpc";
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
import { CloseIcon, EditIcon } from "@chakra-ui/icons";
import type { OpenAPIWriterOptions } from "@transformer/backend/src";

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

export default function Transformer() {
    const editorsRef = useRef({
        ts: null as MaybeEditor,
        jsonSchema: null as MaybeEditor,
        openApi: null as MaybeEditor,
        zod: null as MaybeEditor,
    });

    const tsToOapi = trpc.useMutation("tsToOapi", {
        onSuccess: (result) => {
            if (editorsRef.current.openApi && editorsRef.current.openApi.getValue() !== result) {
                editorsRef.current.openApi.setValue(result);
                return;
            }

            texts.openApi = result;
        },
    });
    const tsToJsonSchema = trpc.useMutation("tsToJsonSchema", {
        onSuccess: (result) => {
            if (editorsRef.current.jsonSchema && editorsRef.current.jsonSchema.getValue() !== result) {
                editorsRef.current.jsonSchema.setValue(result);
                return;
            }

            texts.jsonSchema = result;
        },
    });
    const tsToZod = trpc.useMutation("tsToZod", {
        onSuccess: (result) => {
            if (editorsRef.current.zod && editorsRef.current.zod.getValue() !== result) {
                editorsRef.current.zod.setValue(result);
                return;
            }

            texts.zod = result;
        },
    });

    const [destinations, setDestinations] = useState<string[]>(["jsonSchema", "zod"]);
    const callbackRef = useRef(null as unknown as (value: string) => void);
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
                    tsToOapi.mutate({
                        value,
                        format: openApiOptions.current.format as "json" | "yaml",
                        schemaVersion: openApiOptions.current.schemaVersion,
                    });
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
            </SimpleGrid>
        </Stack>
    );
}
