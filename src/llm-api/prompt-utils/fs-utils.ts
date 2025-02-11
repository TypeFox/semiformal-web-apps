import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../../utils/logger.js';

export async function createFile(baseFolder: string, folder: string, filename: string, content: string) {
    try {
        let dist = path.join(baseFolder, folder);
        fs.mkdirSync(dist, { recursive: true });
        fs.writeFileSync(path.join(dist, filename), content);
    } catch (error) {
        Logger.error(`Error creating file ${filename}, parameters: ${JSON.stringify({ baseFolder, folder, filename})}`, { error });
    }
}

