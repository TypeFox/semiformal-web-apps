import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Model } from '../language/generated/ast.js';
import { defaultModels } from '../llm-api/common/default-models.js';
import { PromptAgent } from '../llm-api/common/prompt-agent.js';
import { openaiAssistantPrompt } from '../llm-api/openai/prompt.js';
import { Logger } from '../utils/logger.js';
import { extractDestinationAndName } from './cli-util.js';
import { CliPromptOptions } from './main.js';
import { NodeFileSystem } from 'langium/node';
import { createSWAServices } from '../language/swa-module.js';

export async function generatePrompt(
    model: Model,
    filePath: string,
    opts: CliPromptOptions) {
    let { name, destination, provider, modelName, maxTokens, host } = opts;
    if (!modelName) {
        modelName = defaultModels[provider];
    }

    const data = extractDestinationAndName(filePath, destination);
    const baseDir = path.join(data.destination, name);
    const generatedFilePath = `${baseDir}/${name}.json`;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    // initialize logger
    Logger.initialize(baseDir);

    switch(provider) {
        case "openai-assistant":
            console.log("Generating project with OpenAI Assistant");
            await openaiAssistantPrompt(generatedFilePath, data.destination, name, model, modelName);
            break;
        default:
            if (provider in defaultModels) {
                let dslContent: string = "";
                if (opts.text) {
                    Logger.info(`Prompting with DSL content as TEXT`);
                    dslContent = await fs.promises.readFile(filePath, 'utf-8');
                } else {
                    Logger.info(`Prompting with DSL content as JSON`);
                    const services = createSWAServices(NodeFileSystem).SWA;
                    dslContent = services.serializer.JsonSerializer.serialize(model, {
                        comments: true,
                        space: 4
                    });
                }

                let agent = new PromptAgent(provider, modelName, dslContent, data.destination, name, maxTokens, host);
                await agent.generate();
            }
            else {
                Logger.error(`Unknown LLM Provider: "${provider}"`);
            }
            break;
    }
}
