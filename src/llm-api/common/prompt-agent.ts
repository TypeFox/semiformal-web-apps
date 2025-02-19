import { CoreMessage, generateObject } from "ai";
import type { Model } from '../../language/generated/ast.js';
import { createLaDslServices } from '../../language/la-dsl-module.js';
import { NodeFileSystem } from "langium/node";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { azure } from "@ai-sdk/azure";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { google } from "@ai-sdk/google";
import { vertex } from "@ai-sdk/google-vertex";
import { mistral } from "@ai-sdk/mistral";
import { xai } from "@ai-sdk/xai";
import { togetherai } from '@ai-sdk/togetherai';
import { fireworks } from '@ai-sdk/fireworks';
import { deepinfra } from '@ai-sdk/deepinfra';
import { deepseek } from '@ai-sdk/deepseek';
import { cerebras } from '@ai-sdk/cerebras';
import { groq } from '@ai-sdk/groq';
import { perplexity } from '@ai-sdk/perplexity';
import { ollama, createOllama } from 'ollama-ai-provider';
import { Laminar } from '@lmnr-ai/lmnr';
import path from "path";
import { Logger } from '../../utils/logger.js';
import { spinner } from '../../utils/spinner.js';
import { displayGeneratedFiles } from '../../utils/file-display.js';
import { createFilesSchema } from "./tools.js";
import { createFile } from "../prompt-utils/fs-utils.js";
import { COMMON_BACKEND_ASSISTANT_MESSAGE, COMMON_FRONTEND_ASSISTANT_MESSAGE, getBackendPrompt, getFrontendPrompt } from "./prompts-content.js";
import fs from "node:fs";

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
     * DSL model to use for the generation
     */
    private dslModel: Model;

    /**
     * DSL JSON representation
     */
    private dslJson: string | null = null;

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
    
    constructor(provider: ProviderModel, model: string, dslModel: Model, destination: string, projectName: string, maxTokens?: number, baseURL?: string) {
        this.provider = provider;
        this.model = model;
        this.dslModel = dslModel;
        this.projectName = projectName;
        this.baseFolder = path.join(destination, projectName);
        this.baseURL = baseURL ?? null;
        this.messageHistory = [];

        this.initializeTelemetry();
        this.providerInstance = this.createProvider();
        this.maxTokens = maxTokens ?? 4096;
    }
    
    public async generate() {
        Logger.info(`Generating project ${this.projectName} with ${this.provider} model ${this.model}`);
        this.dslJson = this.generateDSLJsonFromModel(this.dslModel);

        let backendFiles = await this.generateBackend();
        let notes = await this.getNotes();
        await this.generateFrontend(backendFiles, notes);
    }

    private async generateBackend() {
        this.messageHistory =  [
            { role: "user", content: "Generate the backend service"},
            { role: "assistant", content: COMMON_BACKEND_ASSISTANT_MESSAGE},
            { role: "user", content: this.dslJson! }
        ]

        spinner.start('Generating backend service...');
        let files = await this.promptAndGenerateFiles(getBackendPrompt(), "backend");
        spinner.succeed('Backend service generated successfully');
        displayGeneratedFiles(files, this.baseFolder, "backend");

        return files;
    }

    private async generateFrontend(backendFiles: string[], notes: string | undefined) {
        this.messageHistory.push({
            role: "user",
            content: `Created the following files:\n${backendFiles.map(e => `\`${e}\``).join(", ")}`
        })
    
        this.messageHistory.push({ role: "user", content: "Generate the frontend service"})
        this.messageHistory.push({ role: "assistant", content: COMMON_FRONTEND_ASSISTANT_MESSAGE})
        this.messageHistory.push({ role: "user", content: this.dslJson! })
    
        spinner.start('Generating frontend service...');
        let frontendFiles = await this.promptAndGenerateFiles(getFrontendPrompt(notes), "frontend");
        spinner.succeed('Frontend service generated successfully');
        displayGeneratedFiles(frontendFiles, this.baseFolder, "frontend");
    }

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


        // create the files
        for (const file of result.object.files) {
            await createFile(this.baseFolder, '', file.filepath, file.content);
        }

        return result.object.files.map(e => e.filepath);
    }

    private generateDSLJsonFromModel(model: Model) {
        const services = createLaDslServices(NodeFileSystem).LaDsl;
        const json = services.serializer.JsonSerializer.serialize(model, {
            comments: true,
            space: 4
        });
        return json;
    }

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

    private initializeTelemetry() {
        if (process.env.LMNR_API_KEY) {
            this.useTelemetry = true;
            Laminar.initialize({
                projectApiKey: process.env.LMNR_API_KEY,
                baseUrl: 'http://localhost:5667/'
            });
        }
    }

    private async getNotes() {
        const notesFilePath = path.join(this.baseFolder, "backend", "NOTES.md");
        let notes: string | undefined = undefined;
        if (fs.existsSync(notesFilePath)) {
            notes = fs.readFileSync(notesFilePath, "utf8");
        }
        else {
            Logger.warn("AI failed to generate the notes file (not found) ", notesFilePath);
        }
        return notes;
    }
}
