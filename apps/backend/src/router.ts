import { z } from "zod";
import { createRouter } from "./createRouter";

import { getTypeScriptReader, getOpenApiWriter, getJsonSchemaWriter, makeConverter } from "typeconv";
import { generate } from "ts-to-zod";
import { Project } from "ts-morph";

const reader = getTypeScriptReader();

const jsonSchemaWriter = getJsonSchemaWriter();
const tsToJsonSchema = makeConverter(reader, jsonSchemaWriter);
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

// TODO add export on interfaces/types

export const appRouter = createRouter()
    .mutation("tsToZod", {
        input: z.string(),
        async resolve({ input }) {
            const ts = stripOutGenerics(input);
            const result = generate({ sourceText: ts });

            const zodResult = result.getZodSchemasFile("./schema");
            return zodResult;
        },
    })
    .mutation("tsToOapi", {
        input: z.object({
            value: z.string(),
            format: z.union([z.literal("json"), z.literal("yaml")]),
            schemaVersion: openApiSchemaVersionSchema,
        }),
        async resolve({ input }) {
            const oapiWriter = getOpenApiWriter({
                title: "My API",
                version: "v1",
                format: input.format,
                schemaVersion: input.schemaVersion,
            });
            const tsToOapi = makeConverter(reader, oapiWriter);

            const ts = stripOutGenerics(input.value);
            const result = await tsToOapi.convert({ data: ts });
            return result.data;
        },
    })
    .mutation("tsToJsonSchema", {
        input: z.string(),
        async resolve({ input }) {
            const ts = stripOutGenerics(input);
            const result = await tsToJsonSchema.convert({ data: ts });
            return result.data;
        },
    });

export type AppRouter = typeof appRouter;

function stripOutGenerics(input: string) {
    const tsFile = project.createSourceFile("source.ts", input);

    const nodes = tsFile.getInterfaces();
    nodes.forEach((n) => n.getTypeParameters().forEach((t) => t.remove()));

    tsFile.saveSync();
    const ts = tsFile.getText();
    tsFile.deleteImmediatelySync();

    return ts;
}
