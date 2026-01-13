"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
    const headerToken = req.headers.authorization;
    if (!headerToken) {
        return res.status(401).json({ message: "Token no proporcionado" });
    }
    const token = headerToken.split(" ")[1];
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "default_secret", (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Token inválido" });
        }
        req.user = decoded;
        next();
    });
};
exports.verifyToken = verifyToken;
