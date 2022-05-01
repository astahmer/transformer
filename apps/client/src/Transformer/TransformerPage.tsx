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
    Spinner,
    Stack,
    Text,
    Tooltip,
} from "@chakra-ui/react";
import Editor from "@monaco-editor/react";
import { OpenAPIWriterOptions } from "@transformer/backend/src";
import { atom, useAtom } from "jotai";
import { useAtomValue } from "jotai/utils";
import { useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { ref } from "valtio/vanilla";
import { Show } from "../components/Show";
import { useTsToJsonSchema, useTsToOapi, useTsToZod } from "./hooks";
import {
    clearTexts,
    currentOpenApiProxy,
    editorRefs,
    openApiSchemaVersions,
    resetToDefault,
    textsProxy,
} from "./store";
import { useTransformerMutation } from "./useTransformerMutation";

type OutputDestination = "jsonSchema" | "openApi" | "zod";
export const destinationsAtom = atom<OutputDestination[]>(["jsonSchema", "zod"]);

export function TransformerPage() {
    const tsToOapi = useTsToOapi();
    const tsToJsonSchema = useTsToJsonSchema();
    const tsToZod = useTsToZod();
    const destinations = useAtomValue(destinationsAtom);

    useTransformerMutation({ tsToOapi, tsToJsonSchema, tsToZod });

    return (
        <Stack w="100%" h="100%" p="4">
            <Header />
            <SimpleGrid columns={[1, 2, null, destinations.length + 1]} h="100%" p="2">
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

    return (
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
                    onChange={(v) => setDestinations(v as OutputDestination[])}
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
    );
}

function TypescriptColumn() {
    const tsText = useRef<string>(textsProxy.ts);

    return (
        <Stack w="100%">
            <Heading as="h2" fontSize={24}>
                Typescript
            </Heading>
            <Divider />
            <Editor
                height="100%"
                defaultLanguage="typescript"
                defaultValue={textsProxy.ts}
                options={{ minimap: { enabled: false } }}
                onMount={(editorRef, monaco) => {
                    editorRefs.ts = ref(editorRef!);
                    editorRefs.monaco = monaco!;
                }}
                onChange={(value) => {
                    tsText.current = value!;

                    const model = editorRefs.ts!.getModel();
                    if (model) {
                        const markers = editorRefs.monaco!.editor.getModelMarkers({
                            resource: model.uri,
                        });
                        if (!markers.length) {
                            textsProxy.ts = tsText.current;
                        }
                    }
                }}
                onValidate={(markers) => {
                    if (markers.length) {
                        return console.warn("TS Errors", markers);
                    }
                    textsProxy.ts = tsText.current;
                }}
            />
        </Stack>
    );
}

function JsonSchemaColumn({ isLoading }: { isLoading: boolean }) {
    return (
        <Stack w="100%">
            <Stack direction="row">
                <Heading as="h2" fontSize={24}>
                    JSON Schema
                </Heading>
                <Show cond={isLoading}>
                    <Spinner />
                </Show>
            </Stack>
            <Divider />
            <Editor
                height="100%"
                defaultLanguage="json"
                options={{ minimap: { enabled: false }, readOnly: true }}
                onMount={(ref) => {
                    editorRefs.jsonSchema = ref!;
                    ref.setValue(textsProxy.jsonSchema);
                }}
            />
        </Stack>
    );
}

function OpenApiColumn({ isLoading }: { isLoading: boolean }) {
    const [isEditingOpenApi, setIsEditingOpenApi] = useState(false);
    const currentOpenApi = useSnapshot(currentOpenApiProxy);

    return (
        <Stack w="100%">
            <Stack>
                <Stack direction="row" alignContent="flex-end">
                    <Heading as="h2" fontSize={24}>
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
                height="100%"
                defaultLanguage="json"
                options={{ minimap: { enabled: false }, readOnly: true }}
                onMount={(ref) => {
                    editorRefs.openApi = ref!;
                    ref.setValue(textsProxy.openApi);
                }}
            />
        </Stack>
    );
}

function ZodColumn({ isLoading }: { isLoading: boolean }) {
    return (
        <Stack w="100%">
            <Stack direction="row">
                <Heading as="h2" fontSize={24}>
                    Zod schemas
                </Heading>
                <Show cond={isLoading}>
                    <Spinner />
                </Show>
            </Stack>
            <Divider />
            <Editor
                height="100%"
                defaultLanguage="typescript"
                options={{ minimap: { enabled: false }, readOnly: true }}
                onMount={(ref) => {
                    editorRefs.zod = ref!;
                    ref.setValue(textsProxy.zod);
                }}
            />
        </Stack>
    );
}
