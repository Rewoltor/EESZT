import { CONFIG, type LogLevel } from './config';

/**
 * Structured logger for blood extractor
 * Best practice: Use structured logging for better debugging and monitoring
 * Reference: https://www.datadoghq.com/knowledge-center/structured-logging/
 */
export class Logger {
    private context: string;
    private minLevel: LogLevel;

    constructor(context: string, minLevel: LogLevel = CONFIG.LOG_LEVEL) {
        this.context = context;
        this.minLevel = minLevel;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.minLevel);
    }

    private formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const baseLog = `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`;

        if (data) {
            return `${baseLog}\n${JSON.stringify(data, null, 2)}`;
        }
        return baseLog;
    }

    debug(message: string, data?: any): void {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message, data));
        }
    }

    info(message: string, data?: any): void {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, data));
        }
    }

    warn(message: string, data?: any): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, data));
        }
    }

    error(message: string, error?: Error, data?: any): void {
        if (this.shouldLog('error')) {
            console.error(
                this.formatMessage('error', message, {
                    error: error?.message,
                    stack: error?.stack,
                    ...data
                })
            );
        }
    }

    // Convenience method for extraction metrics
    metrics(message: string, metrics: Record<string, number>): void {
        this.info(message, { metrics });
    }
}

// Factory function for creating loggers
export function createLogger(context: string): Logger {
    return new Logger(context);
}
