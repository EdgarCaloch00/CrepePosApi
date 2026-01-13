import jwt from "jsonwebtoken";

export const verifyToken = (req:  any, res: any, next: any) => {
  const headerToken = req.headers.authorization;

  if (!headerToken) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = headerToken.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "default_secret", (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }

    req.user = decoded;
    next();
  });
};