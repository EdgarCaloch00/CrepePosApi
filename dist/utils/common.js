"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidToBuffer = uuidToBuffer;
exports.bufferToUuid = bufferToUuid;
function uuidToBuffer(uuid) {
    return Buffer.from(uuid.replace(/-/g, ""), "hex");
}
function bufferToUuid(buffer) {
    const hex = buffer.toString("hex");
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
    ].join("-");
}
