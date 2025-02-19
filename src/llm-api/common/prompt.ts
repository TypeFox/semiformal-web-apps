import { anthropic } from '@ai-sdk/anthropic';
import { CoreMessage, generateObject } from 'ai';
import { NodeFileSystem } from 'langium/node';
import fs from 'node:fs';
import path from 'node:path';
import type { Model } from '../../language/generated/ast.js';
import { createLaDslServices } from '../../language/la-dsl-module.js';
import { displayGeneratedFiles } from '../../utils/file-display.js';
import { Logger } from '../../utils/logger.js';
import { spinner } from '../../utils/spinner.js';
import { createFile } from '../prompt-utils/fs-utils.js';
import { COMMON_BACKEND_ASSISTANT_MESSAGE, COMMON_FRONTEND_ASSISTANT_MESSAGE, getBackendPrompt, getFrontendPrompt } from './prompts-content.js';
import { createFilesSchema } from './tools.js';

/**
 * @deprecated
 * Use the prompt agent instead
 */
export async function commonPrompt(generatedFilePath: string, destination: string, name: string, model: Model) {
    const services = createLaDslServices(NodeFileSystem).LaDsl;
    const json = services.serializer.JsonSerializer.serialize(model, {
        comments: true,
        space: 4
    });

    const baseFolder = path.join(destination, name);
    let messagesStack: CoreMessage [] = [
        { role: "user", content: "Generate the backend service"},
        { role: "assistant", content: COMMON_BACKEND_ASSISTANT_MESSAGE},
        { role: "user", content: json }
    ]

    // start with a tool for the backend


    spinner.start('Generating backend service...');

    const backendResult = await generateObject({
        model: anthropic("claude-3-5-sonnet-latest"),
        system: getBackendPrompt(),
        schema: createFilesSchema,
        messages: messagesStack,
        maxTokens: 8192
    })

    const backendFilesCreated = backendResult.object.files.map(e => e.filepath);
    // create the files
    for (const file of backendResult.object.files) {
        await createFile(baseFolder, '', file.filepath, file.content);
    }
    
    spinner.succeed('Backend service generated successfully');

    displayGeneratedFiles(backendFilesCreated, baseFolder, "backend");

    messagesStack.push({
        role: "user",
        content: `Created the following files:\n${backendFilesCreated.map(e => `\`${e}\``).join(", ")}`
    })

    messagesStack.push({ role: "user", content: "Generate the frontend service"})
    messagesStack.push({ role: "assistant", content: COMMON_FRONTEND_ASSISTANT_MESSAGE})
    messagesStack.push({ role: "user", content: json })

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
    

    spinner.start('Generating frontend service...');
    const frontendResult = await generateObject({
        model: anthropic("claude-3-5-sonnet-latest"),
        system: getFrontendPrompt(notes),
        schema: createFilesSchema,
        messages: messagesStack,
        maxTokens: 8192
    })

    // create the files
    for (const file of frontendResult.object.files) {
        await createFile(baseFolder, '', file.filepath, file.content);
    }

    spinner.succeed('Frontend service generated successfully');
    displayGeneratedFiles(frontendResult.object.files.map(e => e.filepath), baseFolder, "frontend");
    Logger.debug("Done");
}

