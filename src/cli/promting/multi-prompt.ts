import OpenAI from "openai";
import * as fs from 'node:fs';
import * as path from 'node:path';
import { NodeFileSystem } from 'langium/node';
import { createLaDslServices } from '../../language/la-dsl-module.js';
import type { Model } from '../../language/generated/ast.js';

type LLMFolderStructure = {
    folder: string,
    filename: string,
    content: string
}

function createFoldersFromStructure(baseFolder: string, structure: LLMFolderStructure[]) {
    // create the structure
    for (let file of structure) {
        let folder = path.join(baseFolder, file.folder);
        fs.mkdirSync(folder, { recursive: true });
        fs.writeFileSync(path.join(folder, file.filename), file.content);
    }
}

export async function multiPrompt(client: OpenAI, generatedFilePath: string, destination: string, name: string, model: Model) {
    const services = createLaDslServices(NodeFileSystem).LaDsl;
    const entitiesJson = model.entities.map(e => services.serializer.JsonSerializer.serialize(e, {
        comments: true,
        space: 4
    }));

    const actionsJson = model.controllers.map(e => services.serializer.JsonSerializer.serialize(e, {
        comments: true,
        space: 4
    }));

    let backendJsonContent = `{"entities": ${entitiesJson}, "actions": ${actionsJson}}`;
            

    const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                "role": "developer",
                "content": [
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT_BRIEF
                    }
                ]
            },
            {
                "role": "developer",
                "content":  [{
                    "type": "text",
                    "text": SYSTEM_PROMPT_BACKEND
                }]
            },
            {
                "role": "user",
                "content":  backendJsonContent
            }

        ],
        store: true,
    });

    console.log("Backend response", response.choices[0].message.content);

    fs.writeFileSync(generatedFilePath, JSON.stringify(response, null, 4));

    let baseFolder = path.join(destination, name);
    fs.mkdirSync(baseFolder, { recursive: true });
    
    let rawStructure = response.choices[0].message.content?.replace("```json", "").replace("```", "") || "[]";
    let structure: LLMFolderStructure[] = JSON.parse(rawStructure);
    createFoldersFromStructure(baseFolder, structure);

    let pages = model.pages.map(e => services.serializer.JsonSerializer.serialize(e, {
        comments: true,
        space: 4
    }));

    let frontendJsonContent = `{"pages": ${pages}}`;

    const frontendResponse = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                "role": "developer",
                "content":  [{
                    "type": "text",
                    "text": SYSTEM_PROMPT_FRONTEND
                }]
            },
            {
                "role": "user",
                "content":  frontendJsonContent
            }

        ],
        store: true,
    });
    console.log("Frontend response", frontendResponse.choices[0].message.content);
    
    let rawFrontEndStructure = frontendResponse.choices[0].message.content?.replace("```json", "").replace("```", "") || "[]";
    let frontendStructure: LLMFolderStructure[] = JSON.parse(rawFrontEndStructure);
    createFoldersFromStructure(baseFolder, frontendStructure);
}



const SYSTEM_PROMPT_BRIEF = `
You are a code generator, you generate code given a well structured Syntax.
You have the freedom and ideally you generate extra content beyong what the user
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
`

const SYSTEM_PROMPT_BACKEND = `
First, you will generate the backend structure. This includes the database schema, the controllers, the services and the routes.
Make sure that you fill the database with some dummy data, so that the frontend can be tested properly.

Pay close attention to the relationships between the entities, as they will be used to generate the database schema.

Generate the proper routes, using proper methods (GET, POST, PUT, DELETE) and make sure that the controllers are properly connected to the services.
`

const SYSTEM_PROMPT_FRONTEND = `
Now you will generate the frontend structure. This includes the components, the pages and the routes.
Make sure you are properly consuming the backend API, and that you are displaying the data correctly.

Insert placeholder text where needed, and make sure that the components are properly styled.
Make sure the pages are complete and up to standard.

Make sure to use latest technologies and best practices, and make sure that the frontend is responsive and accessible.
`