"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.formatZodError = formatZodError;
const node_http_1 = require("node:http");
const zod_1 = require("zod");
// custom error
function formatZodError(errors) {
    const fields = (0, zod_1.flattenError)(errors).fieldErrors;
    const formattedError = {};
    for (const key in fields) {
        const messages = fields[key];
        if (messages?.length) {
            formattedError[key] = messages[0];
        }
    }
    return formattedError;
}
class AppError extends Error {
    statusCode;
    errors;
    constructor(statusCode, message, errors) {
        super(message ?? node_http_1.STATUS_CODES[statusCode]);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errors = errors instanceof zod_1.ZodError ? formatZodError(errors) : errors ?? null;
        // Maintains proper stack trace (only on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.AppError = AppError;
