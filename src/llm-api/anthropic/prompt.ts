import Anthropic from '@anthropic-ai/sdk';
import { NodeFileSystem } from 'langium/node';
import { createLaDslServices } from '../../language/la-dsl-module.js';
import type { Model } from '../../language/generated/ast.js';
import { ANTHROPIC_BACKEND_ASSISTANT_MESSAGE, ANTHROPIC_FRONTEND_ASSISTANT_MESSAGE, ANTHROPIC_MAX_TOKENS, anthropicTools, getBackendPrompt, getFrontendPrompt } from './anthropic-tools.js';

import { Logger } from '../../utils/logger.js';
import { anthropicLoop } from './anthropic-loop.js';
import path from 'node:path';
import { displayGeneratedFiles } from '../../utils/file-display.js';
import { spinner } from '../../utils/spinner.js';
import fs from 'node:fs';

/**
 * @deprecated in favor of the prompt agent
 * Anthropic prompt is stateless, we have to keep track of the conversation
 * manually. This handled within the anthropic-loop.ts file.
 */
export async function anthropicPrompt(generatedFilePath: string, destination: string, name: string, model: Model, aiModelName: string) {
    const client = new Anthropic({
        apiKey: process.env["ANTHROPIC_API_KEY"]
    })

    const services = createLaDslServices(NodeFileSystem).LaDsl;
    const json = services.serializer.JsonSerializer.serialize(model, {
        comments: true,
        space: 4
    });

    const baseFolder = path.join(destination, name);

    // anthropic is stateless, we have to keep track of the thread
    let messagesStack: Anthropic.MessageParam[] = [
        { role: "user", content: "Generate the backend service"},
        { role: "assistant", content: ANTHROPIC_BACKEND_ASSISTANT_MESSAGE},
        { role: "user", content: json }
    ]

    /**
     * We will be reusing the same response object
     * in a loop
     */
    let response = await client.messages.create({
        model: aiModelName,
        // we start with the backend prompt
        system: getBackendPrompt(),
        max_tokens: ANTHROPIC_MAX_TOKENS,
        messages: messagesStack,
        tools: anthropicTools
    });



    spinner.start('Generating backend service...');
    let backendFilesCreated = await anthropicLoop(client, messagesStack, response, baseFolder, "backend", aiModelName);
    spinner.succeed('Backend service generated successfully');

    displayGeneratedFiles(backendFilesCreated, baseFolder, "backend");

    // find the notes file in output_dir/backebd/NOTES.md
    // check if the file exists
    const notesFilePath = path.join(baseFolder, "backend", "NOTES.md");
    let notes: string | undefined = undefined;
    if (fs.existsSync(notesFilePath)) {
        notes = fs.readFileSync(notesFilePath, "utf8");
    }
    else {
        Logger.warn("AI failed to generate the notes file (not found) ", notesFilePath);
    }

    // clean the messages stack
    messagesStack = []

    messagesStack.push(
        { role: "user", content: "Generate the frontend service"},
        { role: "assistant", content: ANTHROPIC_FRONTEND_ASSISTANT_MESSAGE},
        { role: "user", content: json }
    );

    response = await client.messages.create({
        model: aiModelName,
        system: getFrontendPrompt(notes),
        max_tokens: ANTHROPIC_MAX_TOKENS,
        messages: messagesStack,
        tools: anthropicTools
    });

    spinner.start('Generating frontend service...');
    let frontendFilesCreated = await anthropicLoop(client, messagesStack, response, baseFolder, "frontend", aiModelName, notes);
    spinner.succeed('Frontend service generated successfully');

    displayGeneratedFiles(frontendFilesCreated, baseFolder, "frontend");

    Logger.debug("Final response: ", response.content);
    Logger.debug("Stop reason: ", response.stop_reason);
}

