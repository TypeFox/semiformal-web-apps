import type { Model } from '../language/generated/ast.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';
import { NodeFileSystem } from 'langium/node';
import { createSWAServices } from '../language/swa-module.js';

export function generateJSON(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.json`;

    const services = createSWAServices(NodeFileSystem).SWA;
    const json = services.serializer.JsonSerializer.serialize(model, {
        comments: true,
        space: 4
    });

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, json);
    return json;
}