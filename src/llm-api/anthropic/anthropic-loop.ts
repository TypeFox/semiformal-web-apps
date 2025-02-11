import { ToolResponse } from "./anthropic-tools.js";
import { createFile } from "../prompt-utils/fs-utils.js";
import { ANTHROPIC_SYSTEM_PROMPT_BACKEND, ANTHROPIC_SYSTEM_PROMPT_FRONTEND } from "./anthropic-tools.js";
import { anthropicTools } from "./anthropic-tools.js";
import { Logger } from "../../utils/logger.js";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";

export async function anthropicLoop(client: Anthropic, messagesStack: Anthropic.MessageParam[], response: Anthropic.Message, baseFolder: string, category: string, aiModelName: string) {
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
                if (toolCall.name !== "write_file") {
                    Logger.error("Invalid tool call received from anthropic: ", toolCall);
                    break;
                }

                let tool: ToolResponse = toolCall as ToolResponse;

                let fileName = tool.input.filename;
                let fileContent = tool.input.content;
                let filePath = tool.input.folder;

                createFile(baseFolder, filePath, fileName, fileContent);
                filesCreated.push(path.join(filePath, fileName));

                // add a message indicating that the file was created
                messagesStack.push({
                    role: "user",
                    content: [{
                        "type": "tool_result",
                        "tool_use_id": toolCall.id,
                        "content": `File ${fileName} created in ${filePath} with the given content.`
                    }]
                });
            }
        }


        response = await client.messages.create({
            model: aiModelName,
            system: category === "backend" ? ANTHROPIC_SYSTEM_PROMPT_BACKEND : ANTHROPIC_SYSTEM_PROMPT_FRONTEND,
            max_tokens: 5000,
            messages: messagesStack,
            tools: anthropicTools
        });
    }
    return filesCreated;
}