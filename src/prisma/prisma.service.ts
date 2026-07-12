import { Injectable, OnModuleInit, OnModuleDestroy, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    handleError (error: any, message: string): never {
        if (error.code === 'P2002') {
            throw new ConflictException(message)
        }
        if (error.code === 'P2003') {
            throw new BadRequestException(message)
        }
        if (error.code === 'P2025') {
            throw new NotFoundException(message);
        }
        if (error.cause.code === '23001') {
            throw new ConflictException(message)
        }
        throw error;
    }
}
