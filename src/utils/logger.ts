import winston from 'winston';
import * as path from 'path';

export class Logger {
    private static instance: winston.Logger;

    private constructor() {}

    public static initialize(outputPath: string): void {
        if (!Logger.instance) {
            Logger.instance = winston.createLogger({
                level: 'info',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                transports: [
                    new winston.transports.File({ 
                        filename: path.join(outputPath, 'error.log'), 
                        level: 'error' 
                    }),
                    new winston.transports.File({ 
                        filename: path.join(outputPath, 'combined.log') 
                    }),
                    new winston.transports.Console({
                        format: winston.format.combine(
                            winston.format.colorize(),
                            winston.format.simple()
                        )
                    })
                ]
            });
        }
    }

    public static getInstance(): winston.Logger {
        if (!Logger.instance) {
            throw new Error('Logger has not been initialized. Call Logger.initialize() first.');
        }
        return Logger.instance;
    }

    public static info(message: string, meta?: any): void {
        Logger.getInstance().info(message, meta);
    }

    public static error(message: string, meta?: any): void {
        Logger.getInstance().error(message, meta);
    }

    public static warn(message: string, meta?: any): void {
        Logger.getInstance().warn(message, meta);
    }

    public static debug(message: string, meta?: any): void {
        Logger.getInstance().debug(message, meta);
    }
} 