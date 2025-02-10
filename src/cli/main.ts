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
    const generatedFilePath = await generatePrompt(model, fileName, opts.llmModel, opts.name, opts.destination);
    console.log(chalk.green(`JSON code generated successfully: ${generatedFilePath}`));
};


export type GenerateOptions = {
    destination?: string;
}

export type PromptOptions = {
    name: string;
    destination: string;
    llmModel: LLMBackend;
}

export type LLMBackend = "openai" | "anthropic";

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
        .requiredOption("-l, --llm-model <model>", "LLM model to use, currently supported: openai, anthropic")
        .requiredOption("-d, --destination <dir>", "root destination directory for generating")
        .description("generates LLM response given a DSL source file")
        .action(generatePromptAction);

    program.parse(process.argv);
}
