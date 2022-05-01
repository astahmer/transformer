import { Monaco } from "@monaco-editor/react";
import type { OpenAPIWriterOptions } from "@transformer/backend/src";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { proxy } from "valtio";
import { tsDefaultValue } from "./tsDefaultValue";

export const localCache = new Map();
export const textsProxy = proxy({ ts: tsDefaultValue, jsonSchema: "", openApi: "", zod: "" });
export const prevDefault = {
    ts: null as unknown as string,
    jsonSchema: null as unknown as string,
    openApi: null as unknown as string,
    zod: null as unknown as string,
};
export const prevTextsProxy = proxy(prevDefault);

const resetPrevTexts = () => {
    prevTextsProxy.ts = prevDefault.ts;
    prevTextsProxy.jsonSchema = prevDefault.jsonSchema;
    prevTextsProxy.openApi = prevDefault.openApi;
    prevTextsProxy.zod = prevDefault.zod;
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
