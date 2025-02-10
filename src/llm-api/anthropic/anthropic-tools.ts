import Anthropic from "@anthropic-ai/sdk"

export const anthropicTools: Anthropic.Tool[] = [{
    name: "write_file",
    description: "Write content to a file in a specific folder",
    input_schema: {
        type: "object",
        properties: {
            folder: {
                type: "string",
                description: "The folder path where to write the file"
            },
            filename: {
                type: "string",
                description: "The name of the file to write"
            },
            content: {
                type: "string",
                description: "The content to write to the file"
            }
        },
        required: ["folder", "filename", "content"]
    }
}]

export type ToolResponse = {
    "type": "tool_use",
    "name": "write_file",
    "id": string,
    "input": {
        "folder": string,
        "filename": string,
        "content": string
    }
}