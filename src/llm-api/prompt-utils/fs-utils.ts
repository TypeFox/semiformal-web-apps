import * as fs from 'node:fs';
import * as path from 'node:path';

export async function createFile(baseFolder: string, folder: string, filename: string, content: string) {
    let dist = path.join(baseFolder, folder);
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(path.join(dist, filename), content);
    console.log(`Created file ${path.join(dist, filename)}`);
}

