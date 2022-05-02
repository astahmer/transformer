import { Monaco } from "@monaco-editor/react";
import type { OpenAPIWriterOptions } from "@transformer/backend/src";
import { atom } from "jotai";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { proxy } from "valtio";
import { tsDefaultValue } from "./tsDefaultValue";

export const localCache = new Map();

const defaultTexts = {
    ts: null as unknown as string,
    jsonSchema: null as unknown as string,
    openApi: null as unknown as string,
    zod: null as unknown as string,
};
export const textsProxy = proxy({
    source: "ts" as OutputDestination,
    ts: tsDefaultValue,
    jsonSchema: "",
    openApi: "",
    zod: "",
});

export type OutputDestination = keyof typeof defaultTexts;
export const destinationsAtom = atom<OutputDestination[]>(["openApi", "zod"] as OutputDestination[]);
export const sourceAtom = atom<OutputDestination>("ts");
export const sourceOptions: OutputDestination[] = ["ts", "jsonSchema", "openApi"];

export const prevTextsProxy = proxy(defaultTexts);

const resetPrevTexts = () => {
    prevTextsProxy.ts = defaultTexts.ts;
    prevTextsProxy.jsonSchema = defaultTexts.jsonSchema;
    prevTextsProxy.openApi = defaultTexts.openApi;
    prevTextsProxy.zod = defaultTexts.zod;
};
export const clearTexts = () => {
    resetPrevTexts();
    editorRefs.ts?.setValue("");
    editorRefs.jsonSchema?.setValue("");
    editorRefs.openApi?.setValue("");
    editorRefs.zod?.setValue("");
};
export const resetToDefault = () => {
    resetPrevTexts();
    textsProxy.source = "ts";
    textsProxy.ts = tsDefaultValue;
    editorRefs.ts?.setValue(tsDefaultValue);
};

type MaybeEditor = monaco.editor.IStandaloneCodeEditor | null;

export const editorRefs = {
    monaco: null as unknown as Monaco,
    ts: null as MaybeEditor,
    jsonSchema: null as MaybeEditor,
    openApi: null as MaybeEditor,
    zod: null as MaybeEditor,
};

export const openApiSchemaVersions = [
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
export const currentOpenApiProxy = proxy<Required<Pick<OpenAPIWriterOptions, "format" | "schemaVersion">>>({
    format: "json",
    schemaVersion: openApiSchemaVersions[0]!,
});
