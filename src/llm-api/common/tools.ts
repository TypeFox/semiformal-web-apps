import { z } from 'zod';
import { Logger } from '../../utils/logger.js';

export const createFilesSchema = z.object({
    files: z.union([
        z.array(z.object({
            filepath: z.string().describe("The full path of the file to create (with filename)"),
            content: z.any().describe("The content of the file to create")
        })).describe("Array of files to create with filepath and content"),
        z.string().describe("A single string representing a file (alternative format)")
    ])
}).describe("The result of the generation");


export type CreateSingleFile = {
    filepath: string;
    content?: any;
}
export type CreateFileType = CreateSingleFile[]

export function parseCreateFiles(files: string): CreateFileType {
    let result = JSON.parse(files);

    // This is a critical error, the response should be an array
    if (!Array.isArray(result)) {
        throw new Error("Response object is not an array");
    }

    let validFiles: CreateSingleFile[] = []

    for (const file of result) {
        if (typeof file === "object" && file.filepath && file.content) {
            validFiles.push(file);
        }
        else {
            Logger.warn("Invalid file object", { file });
        }
    }

    return validFiles;
}