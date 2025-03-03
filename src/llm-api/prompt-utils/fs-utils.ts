import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../../utils/logger.js';

export async function createFile(baseFolder: string, folder: string, filename: string, content: string | object) {
    try {
        let dist = path.join(baseFolder, folder);
        
        // incase of notes file, we override the folder to be the base folder
        let fullPath = filename.endsWith("/NOTES.md") ? path.join(baseFolder, 'NOTES.md') : path.join(dist, filename);

        if (filename.endsWith("/NOTES.md")) {
            Logger.info(`Creating notes file in ${fullPath}`);
        }

        let baseDir = path.dirname(fullPath);
        fs.mkdirSync(baseDir, { recursive: true });
        fs.writeFileSync(fullPath, typeof content === "string" ? content : JSON.stringify(content));
    } catch (error) {
        Logger.error(`Error creating file ${filename}, parameters: ${JSON.stringify({ baseFolder, folder, filename})}`, { error });
    }
}

