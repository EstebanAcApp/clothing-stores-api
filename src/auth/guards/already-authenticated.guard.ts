import { CanActivate, ConflictException, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { Request } from "express";

@Injectable()
export class AlreadyAuthenticatedGuard implements CanActivate {
    constructor (
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = request.cookies?.access_token;

        if (token) {
            try {
                await this.jwt.verifyAsync(token, {
                    secret: this.config.get<string>('JWT_SECRET'),
                });
                throw new ConflictException('Already authenticated');
            } catch (error) {
                if (error instanceof ConflictException) throw error;
            }
        }

        return true;
    }
}