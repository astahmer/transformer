import { InterfaceDeclaration, Project, TypeAliasDeclaration } from "ts-morph";
import { generate } from "ts-to-zod";
import { getJsonSchemaWriter, getOpenApiWriter, getTypeScriptReader, makeConverter } from "typeconv";
import { z } from "zod";
import { createRouter } from "./createRouter";

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
    });

export type AppRouter = typeof appRouter;

const autoTransformTs = (node: InterfaceDeclaration | TypeAliasDeclaration) => {
    node.setIsExported(true);
    node.getTypeParameters().forEach((t) => t.remove());
};

/** Strip out generics, auto-exports interfaces */
function getTransformedTs(input: string) {
    const tsFile = project.createSourceFile("source.ts", input);

    tsFile.getTypeAliases().forEach(autoTransformTs);
    tsFile.getInterfaces().forEach(autoTransformTs);

    tsFile.saveSync();
    const ts = tsFile.getText();
    tsFile.deleteImmediatelySync();

    return ts;
}
