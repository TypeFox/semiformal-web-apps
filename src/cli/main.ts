import type { Model } from '../language/generated/ast.js';
import chalk from 'chalk';
import { Command } from 'commander';
import { LaDslLanguageMetaData } from '../language/generated/module.js';
import { createLaDslServices } from '../language/la-dsl-module.js';
import { extractAstNode } from './cli-util.js';
import { generateJSON } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import { generatePrompt } from './prompt.js';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ProviderModel } from '../llm-api/common/prompt-agent.js';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createLaDslServices(NodeFileSystem).LaDsl;
    const model = await extractAstNode<Model>(fileName, services);
    const generatedFilePath = generateJSON(model, fileName, opts.destination);
    console.log(chalk.green(`JSON code generated successfully: ${generatedFilePath}`));
};

export const generatePromptAction = async (fileName: string, opts: PromptOptions): Promise<void> => {
    const services = createLaDslServices(NodeFileSystem).LaDsl;
    const model = await extractAstNode<Model>(fileName, services);
    const generatedFilePath = await generatePrompt(model, fileName, opts);
    console.log(chalk.green(`JSON code generated successfully: ${generatedFilePath}`));
};


export type GenerateOptions = {
    destination?: string;
}

export type PromptOptions = {
    name: string;
    destination: string;
    provider: SemiformBackendProvider;
    modelName?: string;
    maxTokens?: string;
    host?: string;
    // When enabled, the DSL content is sent as text instead of JSON
    text?: boolean;
}

// We need to support the old "openai-assistant" provider for backward compatibility with
// OpenAI assistant feature
export type SemiformBackendProvider = "openai-assistant" | ProviderModel;

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = LaDslLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates JSON code from a source file')
        .action(generateAction);

    program
        .command("prompt")
        .argument("<file>", `source file (possible file extensions: ${fileExtensions})`)
        .requiredOption("-n, --name <name>", "name of the project")
        .requiredOption("-p, --provider <provider>", "LLM provider to use, currently supported: openai, anthropic")
        .requiredOption("-d, --destination <dir>", "root destination directory for generating")
        .option("-m, --model-name <name>", "name of the model to use, optional (gpt-4o, claude-3-5-sonnet-20241022, etc.)")
        .option("-h, --host <host>", "host to use, for self-hosted models")
        .option("-t, --max-tokens <tokens>", "max tokens to use, default: 4096")
        .option("--text", "Send DSL content as text instead of JSON")
        .description("generates LLM response given a DSL source file")
        .action(generatePromptAction);

    program.parse(process.argv);
}
