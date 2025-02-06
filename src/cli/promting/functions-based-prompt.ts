import OpenAI from "openai";
import * as fs from 'node:fs';
import * as path from 'node:path';
import { NodeFileSystem } from 'langium/node';
import { createLaDslServices } from '../../language/la-dsl-module.js';
import type { Model } from '../../language/generated/ast.js';

async function createFile(baseFolder: string, folder: string, filename: string, content: string) {
    let dist = path.join(baseFolder, folder);
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(path.join(dist, filename), content);
    console.log(`Created file ${path.join(dist, filename)}`);
}

async function createAssistantWithFunctionCall(client: OpenAI) {
    let assistantId: string | undefined = process.env["SEMIFORM_ASSISTANT_ID"];
    if ((assistantId !== undefined) && (assistantId !== "")) {
        let assistant = await client.beta.assistants.retrieve(assistantId)
        return assistant;
    }

    // no assistant found, create a new one
    const createFileFunction = {
        name: "createFile",
        description: "Creates a new file with the given content",
        parameters: {
            type: "object",
            properties: {
                folder: { type: "string", description: "Parent Directory of the File" },
                filename: { type: "string", description: "Name of the file" },
                content: { type: "string", description: "File contents" }
            },
            required: ["folder", "filename", "content"]
        }
    }

    const assistant = await client.beta.assistants.create({
        name: "Semiform Assistant",
        instructions: SYSTEM_PROMPT,
        model: "gpt-4o",
        tools: [{
            type: "function",
            function: createFileFunction
        }]
    });

    return assistant;
}

async function getAssistantResponse(openai: OpenAI, threadId: string, assistantId: string, baseFolder: string) {
    let run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
    });

    console.log("Waiting for response...");

    while (true) {
        run = await openai.beta.threads.runs.retrieve(threadId, run.id);
        console.log(`pinged run status: ${run.status}`);

        if (run.status === "completed") {
            console.log("Assistant finished.");
            break;
        }

        if (run.status === "requires_action") {
            console.log("Assistant requires action, performing action...");
            let toolCalls = run.required_action?.submit_tool_outputs.tool_calls;
            if (toolCalls) {
                let toolResponses: {tool_call_id: string, output: string}[] = [];
                for (const tool of toolCalls) {
                    const func = tool.function;
                    if(func.name === "createFile") {
                        const { folder, filename, content } = JSON.parse(func.arguments);
                        await createFile(baseFolder, folder, filename, content);
                        toolResponses.push({ tool_call_id: tool.id, output: "File created" });
                    }
                }

                await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
                    tool_outputs: toolResponses
                });
        
                console.log("Tool execution results sent back to OpenAI.");
            }
            else {
                throw new Error(`Unknown ${run.required_action?.type} action required by assistant.`);
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before polling again
    }

    // Fetch the latest messages to get assistant response
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantMessages = messages.data.filter(m => m.role === "assistant");

    if (assistantMessages.length > 0) {
        console.log("AI Response:", assistantMessages[0].content);
        return assistantMessages[0].content;
    } else {
        console.log("No text response from AI.");
        return null;
    }
}

export async function functionBasedPrompt(client: OpenAI, generatedFilePath: string, destination: string, name: string, model: Model) {

    const services = createLaDslServices(NodeFileSystem).LaDsl;
    const json = services.serializer.JsonSerializer.serialize(model, {
        comments: true,
        space: 4
    });

    let assistant = await createAssistantWithFunctionCall(client);

    const run = await client.beta.threads.create();
    console.log("OpenAI Thread ID:", run.id);


    await client.beta.threads.messages.create(run.id, {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": json
            }
        ]
    });

    console.log("Prompted the assistant");
    await getAssistantResponse(client, run.id, assistant.id, path.join(destination, name));
}


const SYSTEM_PROMPT = `
You are a code generator, you generate code given a well structured Syntax.
You have the freedom and ideally you generate extra content beyond what the user
has requested, but you must adhere the project specification.

The specification emitted to you is well structured and follow a MVC-like model:

1. TechStack: Enumerates the technologies the user would like to use. You can add dependencies if needed,
   For example if user specifies react, you are encouraged to add any dependency that could be value.

2. Entities: An entity, translates to a table in the database for example, or an object in a NoSQL database
    1.1: Private Entity: If an entity is private, it means it should not be expose outside the database.
    1.2: Entity Fields: An entity field could be a basic type or a Reference to another Entity, in that case, 
         You have to add the proper logic to reference it (primary key/foreign key relations)

3. Components: A Component translates to a reusable UI component, for example React Component.
    3.1: Component Attributes: A Component Attribute is a property of the component. It could be a basic text, could be a description of the component's style/layout or it could be another component.

4.  Actions: Actions can be composed by components to provide data or perform actions, such as login, or
    requesting information. They serve as endpoint for the components to use and must be implemented 
    as a backend service if needed.

5.  Roles: A role, differentiates between different types of users. Roles are primarlily used for
    Controllers/UI to display different content based on the user's role

6.  Pages: A page serve as the highlight level of Component hierarchy. They can be translated as component,
    They serve more as an intent. Pages can contain components or could be a component.

The output should equally be a JSON array, with the following structure:
{
    "folder": <folder path>
    "filename": <name of the file>,
    "content": <file content>
}

When generating code for the first time, it is important to generate the entire structure and dependencies,
such as package.json, tsconfig, or any other configuration file that could be needed.

Split the folder structure if necessary (frontend, backend).

When it comes to design and Layout, do your best to infer it from the schema, otherwise, creativity is 
appreciated as long as it doesn't interfere with the requirements.

You generate code using latest versions of the technologies, and you are encouraged to use the latest features.
Make sure the code is clean and well structured, and adhere to the best practices of the technology you are using.
Make sure to generate beyond the user specification, for example if the user wants a website, make sure you make
an appropriate design and filler content.
`