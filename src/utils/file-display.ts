import Table from 'cli-table3';
import chalk from 'chalk';
import * as path from 'path';

/**
 * Cool table
 */
export function displayGeneratedFiles(files: string[], baseDir: string, category: string) {
    if (files.length === 0) return;

    console.log(`\n${chalk.blue.bold(`📦 Generated ${category} Files:`)}`);

    const table = new Table({
        style: {
            head: ['blue'],
            border: ['grey']
        },
        head: ['Type', 'Path'],
        wordWrap: true,
        wrapOnWordBoundary: false
    });

    const filesByType = files.reduce((acc, file) => {
        const ext = path.extname(file).toLowerCase();
        const type = getFileType(ext);
        
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(file);
        return acc;
    }, {} as Record<string, string[]>);

    Object.entries(filesByType)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([type, paths]) => {
            paths.sort().forEach((filePath, index) => {
                if (index === 0) {
                    table.push([{ content: chalk.yellow(type), rowSpan: paths.length }, chalk.white(filePath)]);
                } else {
                    table.push([chalk.white(filePath)]);
                }
            });
        });

    console.log(table.toString());
    console.log();
}

function getFileType(ext: string): string {
    const typeMap: Record<string, string> = {
        '.ts': 'TypeScript',
        '.tsx': 'React',
        '.js': 'JavaScript',
        '.jsx': 'React',
        '.json': 'Config',
        '.html': 'HTML',
        '.css': 'Styles',
        '.scss': 'Styles',
        '.md': 'Documentation',
        '.yml': 'Config',
        '.yaml': 'Config',
        '.dockerfile': 'Docker',
        '.dockerignore': 'Docker',
        '.env': 'Config',
        '.gitignore': 'Git',
        '.npmrc': 'Config',
        '.nvmrc': 'Config',
        '.eslintrc': 'Config',
        '.prettierrc': 'Config',
    };

    const extension = ext.toLowerCase();
    return typeMap[extension] || 'Other';
} 