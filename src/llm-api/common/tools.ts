import { z } from 'zod';

export const createFilesSchema = z.object({
    files: z.array(z.object({
        filepath: z.string().describe("The full path of the file to create (with filename)"),
        content: z.any().describe("The content of the file to create")
    })).describe("Array of files to create with filepath and content")
}).describe("The result of the generation")