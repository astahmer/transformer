import { z } from "zod";
import { createRouter } from "./createRouter";

import { getTypeScriptReader, getOpenApiWriter, getJsonSchemaWriter, makeConverter } from "typeconv";
import { generate } from "ts-to-zod";

const reader = getTypeScriptReader();

const jsonSchemaWriter = getJsonSchemaWriter();
const tsToJsonSchema = makeConverter(reader, jsonSchemaWriter);

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

// TODO - strip generics before using source to convert ? https://ts-morph.com/details/type-parameters

export const appRouter = createRouter()
    .mutation("tsToZod", {
        input: z.string(),
        async resolve({ input }) {
            const result = generate({ sourceText: input });
            const oui = result.getZodSchemasFile("./schema");
            return oui;
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
            const result = await tsToOapi.convert({ data: input.value });
            return result.data;
        },
    })
    .mutation("tsToJsonSchema", {
        input: z.string(),
        async resolve({ input }) {
            const result = await tsToJsonSchema.convert({ data: input });
            return result.data;
        },
    });

export type AppRouter = typeof appRouter;
