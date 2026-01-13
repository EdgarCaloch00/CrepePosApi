export function uuidToBuffer(uuid: string): any {
  if (!uuid || typeof uuid !== 'string') {
    throw new Error(`Invalid UUID provided: ${uuid}`);
  }
  return Buffer.from(uuid.replace(/-/g, ""), "hex") as any;
}

export function bufferToUuid(buffer: Buffer): string {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error(`Invalid buffer provided: ${buffer}`);
  }
  const hex = buffer.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}