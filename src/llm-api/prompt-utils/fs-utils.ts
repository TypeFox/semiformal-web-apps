import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../../utils/logger.js';

export async function createFile(baseFolder: string, folder: string, filename: string, content: string) {
    try {
        let dist = path.join(baseFolder, folder);
        let fullPath = path.join(dist, filename);
        let baseDir = path.dirname(fullPath);
        fs.mkdirSync(baseDir, { recursive: true });
        fs.writeFileSync(fullPath, content);
    } catch (error) {
        Logger.error(`Error creating file ${filename}, parameters: ${JSON.stringify({ baseFolder, folder, filename})}`, { error });
    }
}

