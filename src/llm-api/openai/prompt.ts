import OpenAI from "openai";
import * as path from 'node:path';
import { NodeFileSystem } from 'langium/node';
import { createLaDslServices } from '../../language/la-dsl-module.js';
import type { Model } from '../../language/generated/ast.js';
import { createAssistantWithFunctionCall, getAssistantResponse } from "./assistant-utils.js";

export async function openaiPrompt(generatedFilePath: string, destination: string, name: string, model: Model) {
    const client = new OpenAI({
        apiKey: process.env["OPENAI_API_KEY"]
    })

    const services = createLaDslServices(NodeFileSystem).LaDsl;
    const json = services.serializer.JsonSerializer.serialize(model, {
        comments: true,
        space: 4
    });

    let assistant = await createAssistantWithFunctionCall(client);

    const thread = await client.beta.threads.create();
    console.log("OpenAI Thread ID:", thread.id);


    await client.beta.threads.messages.create(thread.id, {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": `
Let's start with the only backend service. Make sure to generate all the necessary files for the backend service.
Make sure to include a Dockerfile and a docker-compose.yml file to make the backend service runnable and containerized.
When the service starts, some random data must be generated to test the service, according to the schema.
                `
            },
            {
                "type": "text",
                "text": json
            }
        ]
    });

    console.info("Prompted the assistant for the backend service");
    await getAssistantResponse(client, thread.id, assistant.id, path.join(destination, name));

    await client.beta.threads.messages.create(thread.id, {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": `
Now we will generate the frontend service. Make sure to generate all the necessary files for the frontend service.
The frontend service must be a React application, including all the necessary files to make it runnable, such as
tsconfig.json, package.json, index.html, etc, index.css, etc.

The user expects a fully functional frontend application, with a complete UI.
                `
            },
            {
                "type": "text",
                "text": json
            }
        ]
    });

    console.info("Prompted the assistant for the frontend service");
    await getAssistantResponse(client, thread.id, assistant.id, path.join(destination, name));

    console.info("Assistant finished");
}

