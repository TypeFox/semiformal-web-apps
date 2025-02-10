import type { Model } from '../language/generated/ast.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';
import { LLMBackend } from './main.js';
import { openaiPrompt } from '../llm-api/openai/prompt.js';
import { anthropicPrompt } from '../llm-api/anthropic/prompt.js';

export async function generatePrompt(model: Model, filePath: string, llmModel: LLMBackend, name: string, destination: string) {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.json`;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    switch(llmModel) {
        case "openai":
            console.log("Generating project with OpenAI");
            await openaiPrompt(generatedFilePath, data.destination, name, model);
            break;
        case "anthropic":
            console.log("Generating project with Anthropic");
            await anthropicPrompt(generatedFilePath, data.destination, name, model);
            break;
        default:
            console.error(`Unknown mode "${llmModel}"`);
            break;
    }
    
    console.log(`Prompt generated at ${generatedFilePath}`);
}
