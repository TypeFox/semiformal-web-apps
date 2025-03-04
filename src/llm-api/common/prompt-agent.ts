import { bedrock } from "@ai-sdk/amazon-bedrock";
import { anthropic } from "@ai-sdk/anthropic";
import { azure } from "@ai-sdk/azure";
import { cerebras } from '@ai-sdk/cerebras';
import { deepinfra } from '@ai-sdk/deepinfra';
import { deepseek } from '@ai-sdk/deepseek';
import { fireworks } from '@ai-sdk/fireworks';
import { google } from "@ai-sdk/google";
import { vertex } from "@ai-sdk/google-vertex";
import { groq } from '@ai-sdk/groq';
import { mistral } from "@ai-sdk/mistral";
import { openai } from "@ai-sdk/openai";
import { perplexity } from '@ai-sdk/perplexity';
import { togetherai } from '@ai-sdk/togetherai';
import { xai } from "@ai-sdk/xai";
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { CoreMessage, generateObject } from "ai";
import { LangfuseExporter } from 'langfuse-vercel';
import fs from "node:fs";
import { createOllama, ollama } from 'ollama-ai-provider';
import path from "path";
import { displayGeneratedFiles } from '../../utils/file-display.js';
import { Logger } from '../../utils/logger.js';
import { spinner } from '../../utils/spinner.js';
import { createFile } from "../prompt-utils/fs-utils.js";
import { COMMON_BACKEND_ASSISTANT_MESSAGE, COMMON_FRONTEND_ASSISTANT_MESSAGE, getBackendPrompt, getFrontendPrompt } from "./prompts-content.js";
import { createFilesSchema, CreateFileType, parseCreateFiles } from "./tools.js";


/**
 * List of supported Provider Models, as supported by the AI SDK
 */
export type ProviderModel = "openai"
                         | "anthropic"
                         | "azure"
                         | "amazon-bedrock"
                         | "google-gemini"
                         | "google-vertex"
                         | "mistral"
                         | "xai"
                         | "together"
                         | "fireworks"
                         | "deepinfra"
                         | "deepseek"
                         | "cerebras"
                         | "groq" 
                         | "ollama"
                         | "perplexity";
                         

export class PromptAgent {
    /**
     * Name of the backend service
     */
    private provider: ProviderModel;
    
    /**
     * Name of the model to use, provider specific
     * e.g `gpt-4o`, `claude-3-5-sonnet-latest`, `gemini-1.5-flash`, `gemini-1.5-pro`
     */
    private model: string;


    /**
     * Base URL for the provider
     * used only for self-hosted providers for now
     */
    private baseURL: string | null = null;

    /**
     * Destination folder for the generated project
     */
    private baseFolder: string;

    /**
     * Name of the project
     */
    private projectName: string;


    /**
     * DSL text to use for the generation, either a JSON or raw DSL content
     */
    private dslText: string;

    /**
     * Message history: Conversation history with the AI
     * Since the AI is stateless, we have to keep track of the conversation manually
     */
    private messageHistory: CoreMessage[];

    /**
     * Actual provider instance, per vercel ai sdk
     * Currently `any` type as the proper type is not exported by the vercel ai sdk :(
     */
    private providerInstance: any;

    /**
     * Maximum tokens to use for the generation
     * Issue: different models have different max tokens
     */
    private maxTokens: number = 4094;

    /**
     * Whether to use telemetry (Laminar)
     */
    private useTelemetry: boolean = true;

    /**
     * OpenTelemetry SDK instance
     */
    private sdk = process.env.LANGFUSE_BASEURL ? new NodeSDK({
        traceExporter: new LangfuseExporter(),
        instrumentations: [getNodeAutoInstrumentations()],
    }) : undefined;
    
    constructor(provider: ProviderModel, model: string, dslText: string, destination: string, projectName: string, maxTokens: number, baseURL?: string) {
        this.provider = provider;
        this.model = model;
        this.dslText = dslText;
        this.projectName = projectName;
        this.baseFolder = path.join(destination, projectName);
        this.baseURL = baseURL ?? null;
        this.messageHistory = [];

        this.providerInstance = this.createProvider();
        this.maxTokens = maxTokens;
        this.sdk?.start();
    }
    
    /**
     * Generate the project
     */
    public async generate() {
        Logger.info(`Generating project ${this.projectName} with ${this.provider} model ${this.model}`);

        let backendFiles = await this.generateBackend();
        let notes = await this.getNotes();
        await this.generateFrontend(backendFiles, notes);
        await this.finish();
    }

    /**
     * Generate the backend service
     * @returns List of generated files
     */
    private async generateBackend() {
        this.messageHistory =  [
            { role: "user", content: "Generate the backend service"},
            { role: "assistant", content: COMMON_BACKEND_ASSISTANT_MESSAGE},
            { role: "user", content: this.dslText }
        ]

        spinner.start('Generating backend service...');
        let files = await this.promptAndGenerateFiles(getBackendPrompt(), "backend");
        spinner.succeed('Backend service generated successfully');
        displayGeneratedFiles(files, this.baseFolder, "backend");

        return files;
    }

    /**
     * Generate the frontend service
     * @param backendFiles - List of backend files, will be added to the message history
     * @param notes - Notes file content if it exists
     */
    private async generateFrontend(backendFiles: string[], notes: string | undefined) {
        this.messageHistory.push({
            role: "user",
            content: `Created the following files:\n${backendFiles.map(e => `\`${e}\``).join(", ")}`
        })
    
        this.messageHistory.push({ role: "user", content: "Generate the frontend service"})
        this.messageHistory.push({ role: "assistant", content: COMMON_FRONTEND_ASSISTANT_MESSAGE})
        this.messageHistory.push({ role: "user", content: this.dslText })
    
        spinner.start('Generating frontend service...');
        let frontendFiles = await this.promptAndGenerateFiles(getFrontendPrompt(notes), "frontend");
        spinner.succeed('Frontend service generated successfully');
        displayGeneratedFiles(frontendFiles, this.baseFolder, "frontend");
    }

    /**
     * Prompt the AI and generate the files
     * @param prompt - Prompt to use
     * @param mode - Mode to use
     * @returns List of generated files
     */
    private async promptAndGenerateFiles(prompt: string, mode: "backend" | "frontend") {
        const result = await generateObject({
            model: this.providerInstance,
            system: prompt,
            schema: createFilesSchema,
            messages: this.messageHistory,
            maxTokens: this.maxTokens,
            experimental_telemetry: {
                isEnabled: this.useTelemetry
            }
        })

        const files: CreateFileType = (typeof result.object === "string") ? parseCreateFiles(result.object) : result.object.files as CreateFileType;

        // create the files
        for (const file of files) {
            await createFile(this.baseFolder, '', file.filepath, file.content);
        }

        return files.map((e)  => e.filepath);
    }

    /**
     * Create the provider instance
     * @returns Provider instance
     */
    private createProvider() {
        switch (this.provider) {
            case "openai":
                return openai(this.model);
            case "anthropic":
                return anthropic(this.model);
            case "azure":
                return azure(this.model);
            case "amazon-bedrock":
                return bedrock(this.model);
            case "google-gemini":
                return google(this.model);
            case "google-vertex":
                return vertex(this.model);
            case "mistral":
                return mistral(this.model);
            case "xai":
                return xai(this.model);
            case "together":
                return togetherai(this.model);
            case "fireworks":
                return fireworks(this.model);
            case "deepinfra":
                return deepinfra(this.model);
            case "deepseek":
                return deepseek(this.model);
            case "cerebras":
                return cerebras(this.model);
            case "groq":
                return groq(this.model);
            case "ollama":
                if (this.baseURL) {
                    return createOllama({
                        baseURL: this.baseURL,
                    })(this.model)
                }
                return ollama(this.model);
            case "perplexity":
                return perplexity(this.model);
        }
    }

    /**
     * Get the notes file content
     * @returns Notes file content or undefined if the file does not exist
     */
    private async getNotes() {
        const notesFilePath = path.join(this.baseFolder, "NOTES.md");
        let notes: string | undefined = undefined;
        if (fs.existsSync(notesFilePath)) {
            notes = fs.readFileSync(notesFilePath, "utf8");
        }
        else {
            Logger.warn("AI failed to generate the notes file (not found) ", notesFilePath);
        }
        return notes;
    }

    /**
     * Gracefully shutdown the OpenTelemetry SDK
     */
    private async finish() {
        await this.sdk?.shutdown();
    }
}
