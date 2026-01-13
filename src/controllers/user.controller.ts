import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const UserController = {
    async createUser(req: any, res: any) {
        const {name, email, password, role_id } = req.body;
  
        try {
            const user = await prisma.user.findFirst({
            where: {
                email: email,
            },
            });

            if (user) {
            return res
                .status(409)
                .json({ message: "El usuario ya se encuentra registrado" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const newUser = await prisma.user.create({
            data: {
                id: uuidBuffer,
                name: name,
                email: email,
                created_at: new Date(),
                updated_at: new Date(),
                password: hashedPassword,
                is_active: true,
                role_id: uuidToBuffer(role_id),
            },
            select: {
                id: true,
                name: true,
                email: true,
                created_at: true,
                updated_at: true,
                is_active: true,
                role_id: true,
                user_role: {
                select: {
                    code: true,
                    name: true
                },
                },
            },
            });

            if (!newUser) {
            return res.status(400).json({ message: "Error al insertar usuario" });
            }

            const formattedUser = {
            ...newUser,
            id: bufferToUuid(Buffer.from(newUser.id)),
            role_id: role_id
            };

            res.status(200).json(formattedUser);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async login(req: any, res: any) {
        const { email, password } = req.body;

        try {
            const user = await prisma.user.findFirst({
            where: {
                email: email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                is_active: true,
                user_role: {
                select: {
                    name:true,
                    code: true,
                },
                },
            },
            });

            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
            if(!user.is_active){
                return res.status(403).json({ message: "Usuario inactivo" });
            }

            if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { id: bufferToUuid(Buffer.from(user.id)), name: user.name, email: user.email, user_role: user.user_role},
                process.env.JWT_SECRET || "default_secret",
            ); 
            res.status(200).json({ token });
            } else {
            res.status(401).json({ message: "Credenciales inválidas" });
            }
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllUser(req: any, res: any) {
        try {
            const user = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                is_active: true,
                user_role: {
                select: {
                    name:true,
                    code: true,
                },
                },
            },
            });

            const formattedUsers = user.map((u) => ({
                ...u,
                id: bufferToUuid(Buffer.from(u.id)),
            }));

            res.status(200).json(formattedUsers);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getUserCashier(req: any, res: any) {
        try {
            const user = await prisma.user.findMany({
            where: {
                user_role: {
                    code: 'cashier'
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                is_active: true,
                user_role: {
                select: {
                    name:true,
                    code: true,
                },
                },
            },
            });

            const formattedUsers = user.map((u) => ({
                ...u,
                id: bufferToUuid(Buffer.from(u.id)),
            }));

            res.status(200).json(formattedUsers);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async updateUser(req: any, res: any) {
        const {id, name, email, password, role_id, is_active } = req.body;

        try {
            const user = await prisma.user.findFirst({
                where: {
                    id: uuidToBuffer(id)
                }
            });

            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            const updateData: any = {
                name,
                email,
                updated_at: new Date(),
                is_active
            };

            if (role_id) {
                updateData.role_id = uuidToBuffer(role_id);
            }

            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }

            const updatedUser = await prisma.user.update({
                where: {
                    id: uuidToBuffer(id)
                },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    created_at: true,
                    updated_at: true,
                    is_active: true,
                    role_id: true,
                    user_role: {
                        select: {
                            code: true,
                            name: true
                        }
                    }
                }
            });

            const formattedUser = {
                ...updatedUser,
                id: bufferToUuid(Buffer.from(updatedUser.id)),
                role_id: role_id || bufferToUuid(Buffer.from(updatedUser.role_id))
            };

            res.status(200).json(formattedUser);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async deleteUser(req: any, res: any) {
        const { id } = req.body;

        try {
            const user = await prisma.user.findFirst({
                where: {
                    id: uuidToBuffer(id)
                }
            });

            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            // Soft delete - simplemente actualiza is_active a false
            await prisma.user.update({
                where: {
                    id: uuidToBuffer(id)
                },
                data: {
                    is_active: false,
                    updated_at: new Date()
                }
            });

            res.status(200).json({ message: "Usuario desactivado correctamente" });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    }
};