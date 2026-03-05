import { RequestHandler } from "express";
import { AppError } from "src/errors/api.error";


export const notfoundHandler: RequestHandler = (req, _res) => {
    throw new AppError(404, `no route matches your path ${req.originalUrl}`)
}