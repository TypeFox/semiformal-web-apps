import Anthropic from '@anthropic-ai/sdk';
import { NodeFileSystem } from 'langium/node';
import { createLaDslServices } from '../../language/la-dsl-module.js';
import type { Model } from '../../language/generated/ast.js';
import { anthropicTools, ToolResponse } from './anthropic-tools.js';
import { createFile } from '../prompt-utils/fs-utils.js';
import path from 'path';

export async function anthropicPrompt(generatedFilePath: string, destination: string, name: string, model: Model) {
    const baseFolder = path.join(destination, name);
    const client = new Anthropic({
        apiKey: process.env["ANTHROPIC_API_KEY"]
    })

    const services = createLaDslServices(NodeFileSystem).LaDsl;
    const json = services.serializer.JsonSerializer.serialize(model, {
        comments: true,
        space: 4
    });

    // anthropic is stateless, we have to keep track of the thread
    const messagesStack: Anthropic.MessageParam[] = [
        { role: "assistant", content: "Sure thing, I'll generate the code for you. Please share the schema with me." },
        { role: "user", content: json }
    ]

    /**
     * We will be reusing the same response object
     * in a loop
     */
    let response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        system: SYSTEM_PROMPT,
        max_tokens: 5000,
        messages: messagesStack,
        tools: anthropicTools
    });

    while(response.stop_reason === "tool_use") {
        // push the assistant message to the stack
        messagesStack.push({ role: "assistant", content: response.content });

        // iterate over the content and find the tool call
        for(let content of response.content) {
            if (content.type === "text") {
                // send the message to the user
                console.info("behind the scenes llm dialog: ", content.text);
            } else if (content.type === "tool_use") {
                let toolCall = content as ToolResponse;
                if (toolCall.name !== "write_file") {
                    console.error("Invalid tool call received from anthropic: ", toolCall);
                    break;
                }

                let tool: ToolResponse = toolCall as ToolResponse;

                let fileName = tool.input.filename;
                let fileContent = tool.input.content;
                let filePath = tool.input.folder;
                console.info("Creating file: ", fileName, " in ", filePath);
                createFile(baseFolder, filePath, fileName, fileContent);

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
            model: "claude-3-5-sonnet-20241022",
            system: SYSTEM_PROMPT,
            max_tokens: 5000,
            messages: messagesStack,
            tools: anthropicTools
        });
    }

    console.info("Final response: ", response.content);
    console.info("Stop reason: ", response.stop_reason);
}


const SYSTEM_PROMPT = `
You are a code generator, you generate code given a well structured schema.
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

When generating code for the first time, it is important to generate the entire structure and dependencies,
such as package.json, tsconfig.json, or any other configuration file that could be needed.

When it comes to design and Layout, do your best to infer it from the schema, otherwise, creativity is 
appreciated as long as it doesn't interfere with the requirements.

Generate a fully functional source-code with necessary imports and dependencies included.
The user must be able to directly use the code in their project without any additional changes.

For react projects, make sure to generate all the required files such as tsconfig.json, package.json, index.html, etc.
The project must be runnable out of the box.

You generate code using latest versions of the technologies, and you are encouraged to use the latest features.
Make sure the code is clean and well structured, and adhere to the best practices of the technology you are using.
Make sure to generate beyond the user specification, for example if the user wants a website, make sure you make
an appropriate design and filler content.
`