import { z } from "zod";
import { createRouter } from "./createRouter";

import { getTypeScriptReader, getOpenApiWriter, getJsonSchemaWriter, makeConverter } from "typeconv";
import { generate } from "ts-to-zod";

const reader = getTypeScriptReader();

const oapiWriter = getOpenApiWriter({ format: "json", title: "My API", version: "v1" });
const tsToOapi = makeConverter(reader, oapiWriter, {});

const jsonSchemaWriter = getJsonSchemaWriter();
const tsToJsonSchema = makeConverter(reader, jsonSchemaWriter);

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
        input: z.string(),
        async resolve({ input }) {
            const result = await tsToOapi.convert({ data: input });
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
