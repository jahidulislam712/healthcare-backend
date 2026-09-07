import { Role } from "../../generated/prisma/enums";

export interface IRequestUser{
  sub: string;
  role: Role | string;
}