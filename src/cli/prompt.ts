import type { Model } from '../language/generated/ast.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';
import { LLMBackend } from './main.js';
import { openaiPrompt } from '../llm-api/openai/prompt.js';
import { anthropicPrompt } from '../llm-api/anthropic/prompt.js';
import { Logger } from '../utils/logger.js';

const DEFAULT_MODELS = {
    "openai": "gpt-4o",
    "anthropic": "claude-3-5-sonnet-20241022"
}

export async function generatePrompt(model: Model, filePath: string, llmModel: LLMBackend, aiModelName: string | undefined, name: string, destination: string) {
    if (!aiModelName) {
        aiModelName = DEFAULT_MODELS[llmModel];
    }

    const data = extractDestinationAndName(filePath, destination);
    const baseDir = path.join(data.destination, name);
    const generatedFilePath = `${baseDir}/${name}.json`;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    // initialize logger
    Logger.initialize(baseDir);

    switch(llmModel) {
        case "openai":
            console.log("Generating project with OpenAI");
            await openaiPrompt(generatedFilePath, data.destination, name, model, aiModelName);
            break;
        case "anthropic":
            console.log("Generating project with Anthropic");
            await anthropicPrompt(generatedFilePath, data.destination, name, model, aiModelName);
            break;
        default:
            console.error(`Unknown LLM "${llmModel}"`);
            break;
    }
    
    console.log(`Prompt generated at ${generatedFilePath}`);
}
