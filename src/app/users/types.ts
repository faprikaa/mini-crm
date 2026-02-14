import { Role } from "@/generated/prisma/client";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};
