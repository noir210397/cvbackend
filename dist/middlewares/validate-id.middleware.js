"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIdParam = validateIdParam;
const zod_1 = __importDefault(require("zod"));
const api_error_1 = require("../errors/api.error");
const id = zod_1.default.string().regex(/^[A-Za-z0-9]{20}$/, "Invalid Firestore auto ID");
function validateIdParam(routeName) {
    return (req, res, next) => {
        const { success } = id.safeParse(req.params.id);
        if (!success) {
            throw new api_error_1.AppError(400, `Invalid ID`);
        }
        else
            next();
    };
}
