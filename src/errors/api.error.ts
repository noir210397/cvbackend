import { STATUS_CODES } from "node:http";
import { flattenError, ZodError } from "zod";

// custom error
export function formatZodError(errors: ZodError<unknown>) {
    const fields = flattenError(errors).fieldErrors as Record<string, string[]>
    const formattedError: Record<string, string> = {};

    for (const key in fields) {
        const messages = fields[key];
        if (messages?.length) {
            formattedError[key] = messages[0];
        }
    }

    return formattedError;
}
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errors?: unknown;

    constructor(
        statusCode: number,
        message?: string,
        errors?: unknown
    ) {
        super(message ?? STATUS_CODES[statusCode]);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errors = errors instanceof ZodError ? formatZodError(errors) : errors ?? null

        // Maintains proper stack trace (only on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
