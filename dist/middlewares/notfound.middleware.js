"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notfoundHandler = void 0;
const api_error_1 = require("../errors/api.error");
const notfoundHandler = (req, _res) => {
    throw new api_error_1.AppError(404, `no route matches your path ${req.originalUrl}`);
};
exports.notfoundHandler = notfoundHandler;
