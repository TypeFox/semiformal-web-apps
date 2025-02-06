import type { Model } from '../language/generated/ast.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';
import { singlePrompt } from './promting/single-prompt.js';
import OpenAI from 'openai';
import { PromptMode } from './main.js';
import { multiPrompt } from './promting/multi-prompt.js';
import { functionBasedPrompt } from './promting/functions-based-prompt.js';

const client = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"]
})

export async function generatePrompt(model: Model, filePath: string, mode: PromptMode, name: string, destination: string) {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.json`;


    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    switch(mode) {
        case "single":
            console.log("Generating single shot project");
            await singlePrompt(client, generatedFilePath, data.destination, name, model);
            break;
        case "multi":
            console.log("Generating multi shot project");
            await multiPrompt(client, generatedFilePath, data.destination, name, model);
            break;
        case "functions":
            console.log("Generating functions based project");
            await functionBasedPrompt(client, generatedFilePath, data.destination, name, model);
            break;
        default:
            console.error(`Unknown mode "${mode}"`);
            break;
    }
    
    console.log(`Prompt generated at ${generatedFilePath}`);
}
