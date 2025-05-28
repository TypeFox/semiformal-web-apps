import OpenAI from "openai";
import * as path from 'node:path';
import { NodeFileSystem } from 'langium/node';
import { createSWAServices } from '../../language/swa-module.js';
import type { Model } from '../../language/generated/ast.js';
import { createAssistantWithFunctionCall, getAssistantResponse } from "./assistant-utils.js";
import { spinner } from '../../utils/spinner.js';
import { Logger } from '../../utils/logger.js';
import { displayGeneratedFiles } from '../../utils/file-display.js';

export async function openaiAssistantPrompt(generatedFilePath: string, destination: string, name: string, model: Model, aiModelName: string) {
    const baseFolder = path.join(destination, name);

    const client = new OpenAI({
        apiKey: process.env["OPENAI_API_KEY"]
    });

    const services = createSWAServices(NodeFileSystem).SWA;
    const json = services.serializer.JsonSerializer.serialize(model, {
        comments: true,
        space: 4
    });

    spinner.start('Creating OpenAI assistant...');
    let assistant = await createAssistantWithFunctionCall(client, aiModelName);
    spinner.succeed('Assistant created successfully');

    const thread = await client.beta.threads.create();
    Logger.info("Created OpenAI Thread", { threadId: thread.id });

    spinner.start('Generating backend service...');
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

    Logger.info("Prompted assistant for backend service");
    const backendFiles = await getAssistantResponse(client, thread.id, assistant.id, baseFolder);
    spinner.succeed('Backend service generated');
    
    if (backendFiles && backendFiles.length > 0) {
        Logger.info('Generated backend files:', { files: backendFiles });
        displayGeneratedFiles(backendFiles, destination, 'Backend');
    }
    else {
        Logger.warn("No backend files generated");
    }

    spinner.start('Generating frontend service...');
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

    Logger.info("Prompted assistant for frontend service");
    const frontendFiles = await getAssistantResponse(client, thread.id, assistant.id, path.join(destination, name));
    spinner.succeed('Frontend service generated');

    if (frontendFiles && frontendFiles.length > 0) {
        Logger.info('Generated frontend files:', { files: frontendFiles });
        displayGeneratedFiles(frontendFiles, destination, 'Frontend');
    }
    else {
        Logger.warn("No frontend files generated");
    }

    spinner.succeed('Generation completed successfully');
}

