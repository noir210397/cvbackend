"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const api_error_1 = require("../errors/api.error");
function errorHandler(err, _req, res, _next) {
    console.log(err);
    if (err instanceof api_error_1.AppError) {
        const body = {
            message: err.message,
            ...(err.errors !== null && { errors: err.errors }),
        };
        return res.status(err.statusCode).json(body);
    }
    else if (err instanceof Error) {
        return res.status(500).json({ message: err.message });
    }
    else {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
