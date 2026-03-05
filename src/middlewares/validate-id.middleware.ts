import z from "zod"
import { NextFunction, Request, Response } from "express";
import { AppError } from "src/errors/api.error";
const id = z.string().regex(/^[A-Za-z0-9]{20}$/, "Invalid Firestore auto ID");


export function validateIdParam(routeName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const { success } = id.safeParse(req.params.id)
        if (!success) {
            throw new AppError(400, `Invalid ID`)
        }
        else next()
    }
}