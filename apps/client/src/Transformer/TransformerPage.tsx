import { CloseIcon, EditIcon, InfoIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
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
    Spinner,
    Stack,
    Text,
    Tooltip,
    useColorMode,
    useColorModeValue,
} from "@chakra-ui/react";
import Editor from "@monaco-editor/react";
import { OpenAPIWriterOptions } from "@transformer/backend/src";
import { useAtom } from "jotai";
import { useAtomValue } from "jotai/utils";
import { useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { ref } from "valtio/vanilla";
import { Show } from "../components/Show";
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
    openApiSchemaVersions,
    OutputDestination,
    resetToDefault,
    sourceOptions,
    textsProxy,
} from "./store";
import { useTransformerMutation } from "./useTransformerMutation";

export function TransformerPage() {
    const tsToOapi = useTsToOapi();
    const tsToJsonSchema = useTsToJsonSchema();
    const tsToZod = useTsToZod();

    const openApiToTs = useOpenApiToTs();
    const openApiToJsonSchema = useOpenApiToJsonSchema();
    const openApiToZod = useOpenApiToZod();

    const jsonSchemaToTs = useJsonSchemaToTs();
    const jsonSchemaToOpenApi = useJsonSchemaToOpenApi();
    const jsonSchemaToZod = useJsonSchemaToZod();

    const destinations = useAtomValue(destinationsAtom);

    useTransformerMutation({
        tsToOapi,
        tsToJsonSchema,
        tsToZod,
        openApiToTs,
        openApiToJsonSchema,
        openApiToZod,
        jsonSchemaToTs,
        jsonSchemaToOpenApi,
        jsonSchemaToZod,
    });

    return (
        <Stack w="100%" h="100%" p="4">
            <Header />
            <SimpleGrid columns={[1, 2, null, destinations.length || 1]} h="100%" p="2">
                <TypescriptColumn />
                <Show cond={destinations.includes("jsonSchema")}>
                    <JsonSchemaColumn isLoading={tsToJsonSchema.isLoading} />
                </Show>
                <Show cond={destinations.includes("openApi")}>
                    <OpenApiColumn isLoading={tsToOapi.isLoading} />
                </Show>
                <Show cond={destinations.includes("zod")}>
                    <ZodColumn isLoading={tsToZod.isLoading} />
                </Show>
            </SimpleGrid>
        </Stack>
    );
}

function Header() {
    const [destinations, setDestinations] = useAtom(destinationsAtom);
    const { colorMode, toggleColorMode } = useColorMode();

    const texts = useSnapshot(textsProxy);
    const source = texts.source;

    return (
        <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" spacing="8">
                <Stack direction="row">
                    <Select w="100px" onChange={(e) => (textsProxy.source = e.target.value as OutputDestination)}>
                        {sourceOptions.map((v) => (
                            <option key={v} value={v}>
                                {v}
                            </option>
                        ))}
                    </Select>
                    <Button onClick={() => clearTexts()}>Clear</Button>
                    <Button onClick={() => resetToDefault()}>Reset to default</Button>
                </Stack>
                <Divider orientation="vertical" />
                <CheckboxGroup
                    colorScheme="green"
                    defaultValue={destinations}
                    value={destinations}
                    onChange={(v) => setDestinations(v as OutputDestination[])}
                >
                    <Stack spacing={[1, 5]} direction={["column", "row"]}>
                        <Checkbox value="ts" isDisabled={source === "ts"}>
                            Typescript
                        </Checkbox>
                        <Checkbox value="jsonSchema" isDisabled={source === "jsonSchema"}>
                            JSON Schema
                        </Checkbox>
                        <Checkbox value="openApi" isDisabled={source === "openApi"}>
                            OpenAPI
                        </Checkbox>
                        <Checkbox value="zod" isDisabled={source === "zod"}>
                            Zod
                        </Checkbox>
                    </Stack>
                </CheckboxGroup>
            </Stack>
            <Stack direction="row" alignItems="center">
                <IconButton
                    aria-label="Toggle color mode"
                    icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                    onClick={toggleColorMode}
                />
                <Text fontWeight="bold" color="red.700">
                    Please do NOT use complex TS Generics
                </Text>
                <Tooltip label="They will be stripped out and shouldn't be expected to work well">
                    <InfoIcon color="red.300" />
                </Tooltip>
            </Stack>
        </Stack>
    );
}

function TypescriptColumn() {
    const editorText = useRef<string>(textsProxy.ts);
    const texts = useSnapshot(textsProxy);
    const isReadOnly = texts.source !== "ts";

    return (
        <Stack w="100%">
            <Heading
                as="h2"
                fontSize={24}
                color={texts.source === "ts" ? "green.300" : undefined}
                cursor="pointer"
                onClick={() => (textsProxy.source = "ts")}
            >
                Typescript
            </Heading>
            <Divider />
            <Editor
                theme={useColorModeValue("light", "vs-dark")}
                height="100%"
                defaultLanguage="typescript"
                defaultValue={textsProxy.ts}
                options={{ minimap: { enabled: false }, readOnly: isReadOnly }}
                onMount={(editorRef, monaco) => {
                    editorRefs.ts = ref(editorRef!);
                    editorRefs.monaco = monaco!;
                }}
                onChange={(value) => {
                    editorText.current = value!;

                    const model = editorRefs.ts!.getModel();
                    if (model) {
                        const markers = editorRefs.monaco!.editor.getModelMarkers({
                            resource: model.uri,
                        });
                        // = if no errors
                        if (!markers.length) {
                            textsProxy.ts = editorText.current;
                        }
                    }
                }}
                onValidate={(markers) => {
                    if (markers.length) {
                        return console.warn("TS Errors", markers);
                    }
                    // = if no errors
                    textsProxy.ts = editorText.current;
                }}
            />
        </Stack>
    );
}

function JsonSchemaColumn({ isLoading }: { isLoading: boolean }) {
    const editorText = useRef<string>(textsProxy.jsonSchema);
    const texts = useSnapshot(textsProxy);
    const isReadOnly = texts.source !== "jsonSchema";

    return (
        <Stack w="100%">
            <Stack direction="row">
                <Heading
                    as="h2"
                    fontSize={24}
                    color={texts.source === "jsonSchema" ? "green.300" : undefined}
                    cursor="pointer"
                    onClick={() => (textsProxy.source = "jsonSchema")}
                >
                    JSON Schema
                </Heading>
                <Show cond={isLoading}>
                    <Spinner />
                </Show>
            </Stack>
            <Divider />
            <Editor
                theme={useColorModeValue("light", "vs-dark")}
                height="100%"
                defaultLanguage="json"
                options={{ minimap: { enabled: false }, readOnly: isReadOnly }}
                onMount={(ref) => {
                    editorRefs.jsonSchema = ref!;
                    ref.setValue(textsProxy.jsonSchema);
                }}
                onChange={(value) => {
                    editorText.current = value!;

                    const model = editorRefs.jsonSchema!.getModel();
                    if (model) {
                        const markers = editorRefs.monaco!.editor.getModelMarkers({
                            resource: model.uri,
                        });
                        // = if no errors
                        if (!markers.length) {
                            textsProxy.jsonSchema = editorText.current;
                        }
                    }
                }}
                onValidate={(markers) => {
                    if (markers.length) {
                        return console.warn("JSON Errors", markers);
                    }
                    // = if no errors
                    textsProxy.jsonSchema = editorText.current;
                }}
            />
        </Stack>
    );
}

function OpenApiColumn({ isLoading }: { isLoading: boolean }) {
    const [isEditingOpenApi, setIsEditingOpenApi] = useState(false);
    const currentOpenApi = useSnapshot(currentOpenApiProxy);

    const editorText = useRef<string>(textsProxy.openApi);
    const texts = useSnapshot(textsProxy);
    const isReadOnly = texts.source !== "openApi";

    return (
        <Stack w="100%">
            <Stack>
                <Stack direction="row" alignContent="flex-end">
                    <Heading
                        as="h2"
                        fontSize={24}
                        color={texts.source === "openApi" ? "green.300" : undefined}
                        cursor="pointer"
                        onClick={() => (textsProxy.source = "openApi")}
                    >
                        OpenAPI
                    </Heading>
                    <Text fontSize="xs">
                        {currentOpenApi.schemaVersion} ({currentOpenApi.format})
                    </Text>
                    <IconButton
                        onClick={() => (isEditingOpenApi ? setIsEditingOpenApi(false) : setIsEditingOpenApi(true))}
                        size="sm"
                        icon={isEditingOpenApi ? <CloseIcon /> : <EditIcon />}
                        aria-label="Edit"
                    />
                    <Show cond={isLoading}>
                        <Spinner />
                    </Show>
                </Stack>
                <Show cond={isEditingOpenApi}>
                    <Box px="4" py="2">
                        <RadioGroup
                            defaultValue={currentOpenApi.format}
                            onChange={(v) => (currentOpenApiProxy.format = v as OpenAPIWriterOptions["format"])}
                        >
                            <Stack direction="row">
                                <Radio value="json">JSON</Radio>
                                <Radio value="yaml">YAML</Radio>
                            </Stack>
                        </RadioGroup>
                        <Select
                            w="100%"
                            onChange={(e) =>
                                (currentOpenApiProxy.schemaVersion = e.target.value as Exclude<
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
                theme={useColorModeValue("light", "vs-dark")}
                height="100%"
                defaultLanguage={currentOpenApiProxy.format}
                language={currentOpenApi.format}
                options={{ minimap: { enabled: false }, readOnly: isReadOnly }}
                onMount={(ref) => {
                    editorRefs.openApi = ref!;
                    ref.setValue(textsProxy.openApi);
                }}
                onChange={(value) => {
                    editorText.current = value!;

                    const model = editorRefs.openApi!.getModel();
                    if (model) {
                        const markers = editorRefs.monaco!.editor.getModelMarkers({
                            resource: model.uri,
                        });
                        // = if no errors
                        if (!markers.length) {
                            textsProxy.openApi = editorText.current;
                        }
                    }
                }}
                onValidate={(markers) => {
                    if (markers.length) {
                        return console.warn(currentOpenApi.format + " Errors", markers);
                    }
                    // = if no errors
                    textsProxy.openApi = editorText.current;
                }}
            />
        </Stack>
    );
}

function ZodColumn({ isLoading }: { isLoading: boolean }) {
    const editorText = useRef<string>(textsProxy.zod);
    const texts = useSnapshot(textsProxy);
    const isReadOnly = texts.source !== "zod";

    return (
        <Stack w="100%">
            <Stack direction="row">
                <Heading as="h2" fontSize={24} color={texts.source === "zod" ? "green.300" : undefined}>
                    Zod schemas
                </Heading>
                <Show cond={isLoading}>
                    <Spinner />
                </Show>
            </Stack>
            <Divider />
            <Editor
                theme={useColorModeValue("light", "vs-dark")}
                height="100%"
                defaultLanguage="typescript"
                options={{ minimap: { enabled: false }, readOnly: isReadOnly }}
                onMount={(ref) => {
                    editorRefs.zod = ref!;
                    ref.setValue(textsProxy.zod);
                }}
                onChange={(value) => {
                    editorText.current = value!;

                    const model = editorRefs.zod!.getModel();
                    if (model) {
                        const markers = editorRefs.monaco!.editor.getModelMarkers({
                            resource: model.uri,
                        });
                        // = if no errors
                        if (!markers.length) {
                            textsProxy.zod = editorText.current;
                        }
                    }
                }}
                onValidate={(markers) => {
                    if (markers.length) {
                        return console.warn("TS Errors", markers);
                    }
                    // = if no errors
                    textsProxy.zod = editorText.current;
                }}
            />
        </Stack>
    );
}
