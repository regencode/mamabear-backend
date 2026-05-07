import { Role } from "@/generated/prisma";
import { JwtPayload } from "@/types/JwtPayload";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Roles } from "../decorators/roles.decorator";

@Injectable() 
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
    canActivate(ctx: ExecutionContext): boolean {
        const allowedRoles: Role[] = this.reflector.get(Roles, ctx.getHandler());
        if(!allowedRoles) return true;
        const request: JwtPayload = ctx.switchToHttp().getRequest();
        return (allowedRoles.includes(request.role));
    }
}
