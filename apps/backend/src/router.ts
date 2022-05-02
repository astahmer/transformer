import { InterfaceDeclaration, Project, TypeAliasDeclaration } from "ts-morph";
import { generate } from "ts-to-zod";
import {
    getJsonSchemaReader,
    getJsonSchemaWriter,
    getOpenApiReader,
    getOpenApiWriter,
    getTypeScriptReader,
    getTypeScriptWriter,
    makeConverter,
} from "typeconv";
import { z } from "zod";
import { createRouter } from "./createRouter";
import { getRandomString } from "@pastable/core";
import { load as loadYaml } from "js-yaml";

const tsReader = getTypeScriptReader();
const tsWriter = getTypeScriptWriter({});

const jsonSchemaReader = getJsonSchemaReader();
const jsonSchemaWriter = getJsonSchemaWriter();

const openApiReader = getOpenApiReader();

const tsToJsonSchema = makeConverter(tsReader, jsonSchemaWriter);
const jsonSchemaToTs = makeConverter(jsonSchemaReader, tsWriter);

const openApiToTs = makeConverter(openApiReader, tsWriter);
const openApiToJsonSchema = makeConverter(openApiReader, jsonSchemaWriter);

const project = new Project({
    useInMemoryFileSystem: true,
    skipLoadingLibFiles: true,
    compilerOptions: {
        skipLibCheck: true,
        noLib: true,
        skipDefaultLibCheck: true,
        noResolve: true,
    },
});

// OpenAPIWriterOptions["schemaVersion"]
const openApiSchemaVersionSchema = z.union([
    z.literal("3.0.3"),
    z.literal("3.0.2"),
    z.literal("3.0.1"),
    z.literal("3.0.0"),
    z.literal("3.0.0-rc2"),
    z.literal("3.0.0-rc1"),
    z.literal("3.0.0-rc0"),
    z.literal("2.0"),
    z.literal("1.2"),
    z.literal("1.1"),
    z.literal("1.0"),
]);

const toOpenApiSchema = z.object({
    value: z.string(),
    format: z.union([z.literal("json"), z.literal("yaml")]),
    schemaVersion: openApiSchemaVersionSchema.default("3.0.3"),
});

export const appRouter = createRouter()
    .mutation("tsToZod", {
        input: z.string(),
        async resolve({ input }) {
            const ts = getTransformedTs(input);
            const result = generate({ sourceText: ts });

            const zodResult = result.getZodSchemasFile("./schema");
            return zodResult;
        },
    })
    .mutation("tsToOapi", {
        input: toOpenApiSchema,
        async resolve({ input }) {
            const oapiWriter = getOpenApiWriter({
                title: "My API",
                version: "v1",
                format: input.format,
                schemaVersion: input.schemaVersion,
            });
            const tsToOapi = makeConverter(tsReader, oapiWriter);

            const ts = getTransformedTs(input.value);
            const result = await tsToOapi.convert({ data: ts });
            return result.data;
        },
    })
    .mutation("tsToJsonSchema", {
        input: z.string(),
        async resolve({ input }) {
            const ts = getTransformedTs(input);
            const result = await tsToJsonSchema.convert({ data: ts });
            return result.data;
        },
    })
    .mutation("jsonSchemaToTs", {
        input: z.string(),
        async resolve({ input }) {
            return (await jsonSchemaToTs.convert({ data: input })).data;
        },
    })
    .mutation("jsonSchemaToZod", {
        input: z.string(),
        async resolve({ input }) {
            const ts = (await jsonSchemaToTs.convert({ data: input })).data;

            const result = generate({ sourceText: getTransformedTs(ts) });

            const zodResult = result.getZodSchemasFile("./schema");
            return zodResult;
        },
    })
    .mutation("jsonSchemaToOpenApi", {
        input: toOpenApiSchema,
        async resolve({ input }) {
            const oapiWriter = getOpenApiWriter({
                title: "My API",
                version: "v1",
                format: input.format,
                schemaVersion: input.schemaVersion,
            });
            const jsonSchemaToOpenApi = makeConverter(jsonSchemaReader, oapiWriter);
            const result = await jsonSchemaToOpenApi.convert({ data: input.value });
            return result.data;
        },
    })
    .mutation("openApiToTs", {
        input: toOpenApiSchema,
        async resolve({ input }) {
            const data = input.format === "json" ? input.value : JSON.stringify(loadYaml(input.value));
            return (await openApiToTs.convert({ data })).data;
        },
    })
    .mutation("openApiToJsonSchema", {
        input: toOpenApiSchema,
        async resolve({ input }) {
            const data = input.format === "json" ? input.value : JSON.stringify(loadYaml(input.value));
            return (await openApiToJsonSchema.convert({ data })).data;
        },
    })
    .mutation("openApiToZod", {
        input: toOpenApiSchema,
        async resolve({ input }) {
            const data = input.format === "json" ? input.value : JSON.stringify(loadYaml(input.value));
            const ts = (await openApiToTs.convert({ data })).data;

            const result = generate({ sourceText: getTransformedTs(ts) });

            const zodResult = result.getZodSchemasFile("./schema");
            return zodResult;
        },
    });

export type AppRouter = typeof appRouter;

const autoTransformTs = (node: InterfaceDeclaration | TypeAliasDeclaration) => {
    node.setIsExported(true);
    node.getTypeParameters().forEach((t) => t.remove());
};

/** Strip out generics, auto-exports interfaces */
function getTransformedTs(input: string) {
    const tsFile = project.createSourceFile(getRandomString() + ".ts", input);

    tsFile.getTypeAliases().forEach(autoTransformTs);
    tsFile.getInterfaces().forEach(autoTransformTs);

    tsFile.saveSync();
    const ts = tsFile.getText();
    tsFile.deleteImmediatelySync();

    return ts;
}
