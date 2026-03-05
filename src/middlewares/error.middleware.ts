import { Request, Response, NextFunction } from 'express';
import { AppError } from 'src/errors/api.error';

interface ErrorBody {
    message: string;
    errors?: unknown;
}

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    console.log(err);
    if (err instanceof AppError) {
        const body: ErrorBody = {
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
