import { CliPromptOptions, PartialCliPromptOptions } from "../cli/main.js";
import { getProviderDefaults } from "../llm-api/common/default-models.js";

export function fillDefaultCliArgs(args: PartialCliPromptOptions): CliPromptOptions {
    const { model, maxTokens: defaultMaxTokens } = 
        args.provider != "openai-assistant" ? 
            getProviderDefaults(args.provider ?? "anthropic") : 
            { model: args.modelName ?? "gpt-4o", maxTokens: 8192 };

    if (!args.maxTokens && !defaultMaxTokens) {
        throw new Error("Cannot infer the maxTokens from the provider, please provide it explicitly with `-t, --max-tokens <tokens>`.");
    }


    return {
        ...args,
        provider: args.provider ?? "anthropic",
        destination: args.destination ?? "./generated",
        modelName: args.modelName ?? model,
        maxTokens: args.maxTokens != undefined ? parseInt(args.maxTokens) : defaultMaxTokens!,
        text: args.text ?? false,
        name: args.name ?? "semiform-app", // name is a required field
    };
}