import { ANTHROPIC_MAX_TOKENS, ToolResponse } from "./anthropic-tools.js";
import { createFile } from "../prompt-utils/fs-utils.js";
import { getBackendPrompt, getFrontendPrompt, anthropicTools } from "./anthropic-tools.js";
import { Logger } from "../../utils/logger.js";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";

/**
 * @deprecated
 * Use the common prompt instead
 */
export async function anthropicLoop(
    client: Anthropic, 
    messagesStack: Anthropic.MessageParam[], 
    response: Anthropic.Message, 
    baseFolder: string, 
    category: string, 
    aiModelName: string,
    notes?: string
) {
    Logger.debug("anthropic response: ", response);
    const filesCreated: string[] = [];
    // push the assistant message to the stack
    while(response.stop_reason === "tool_use") {
        messagesStack.push({ role: "assistant", content: response.content });

        // iterate over the content and find the tool call
        for(let content of response.content) {
            if (content.type === "text") {
                // send the message to the user
                Logger.debug("llm textual response: ", content.text);
            } else if (content.type === "tool_use") {
                let toolCall = content as ToolResponse;
                if (toolCall.name !== "create_full_project") {
                    Logger.error("Invalid tool call received from anthropic: ", toolCall);
                    break;
                }

                let tool: ToolResponse = toolCall as ToolResponse;

                if(Object.keys(tool.input).length === 0) {
                    Logger.error("No files to create received from anthropic");
                    break;
                }

                for(let file of tool.input.files) {
                    let fileName = file.filename;
                    let fileContent = file.content;
                    let filePath = file.folder;
                    Logger.debug("Creating file: ", file);
                    createFile(baseFolder, filePath, fileName, fileContent);
                    filesCreated.push(path.join(filePath, fileName));
                }

                // add a message indicating that the file was created
                messagesStack.push({
                    role: "user",
                    content: [{
                        "type": "tool_result",
                        "tool_use_id": toolCall.id,
                        "content": `Files created: ${filesCreated.join(", ")}`
                    }]
                });
            }
        }

        Logger.debug("anthropicRequest", {
            model: aiModelName,
            system: category === "backend" ? getBackendPrompt() : getFrontendPrompt(notes),
            max_tokens: ANTHROPIC_MAX_TOKENS,
            messages: messagesStack,
            tools: anthropicTools
        });
        
        response = await client.messages.create({
            model: aiModelName,
            system: category === "backend" ? getBackendPrompt() : getFrontendPrompt(notes),
            max_tokens: ANTHROPIC_MAX_TOKENS,
            messages: messagesStack,
            tools: anthropicTools
        });
    }

    if(response.stop_reason === "stop_sequence") {
        Logger.debug("Anthropic loop finished");
    } else if (response.stop_reason === "max_tokens") {
        Logger.error("Anthropic loop finished with a max tokens error");
    }
    return filesCreated;
}