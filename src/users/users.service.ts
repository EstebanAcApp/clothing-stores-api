import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import argon2 from 'argon2';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async getSelfData(
    id: string,
  ) {
    return await this.prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        name: true,
        role: true,
        status: true,
        temporaryPassword: true,
      },
    });
  }

  async getUsers(
    selfId: string,
    page: number,
    limit: number,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [users, totalManagers, totalWorkers, activeUsers, totalUsers] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where: { id: { not: selfId } },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            temporaryPassword: true,
            createdAt: true,
          },
          skip,
          take: limit,
        }),
        this.prisma.user.count({ where: { role: 'MANAGER' } }),
        this.prisma.user.count({ where: { role: 'WORKER' } }),
        this.prisma.user.count({ where: { status: 'ACTIVE' } }),
        this.prisma.user.count(),
      ]);

      return {
        data: users,
        meta: {
          totalManagers,
          totalWorkers,
          activeUsers,
          totalUsers,
          page,
          limit,
          totalPages: Math.ceil(totalUsers / limit),
        },
      };
    } catch (error) {
      this.prisma.handleError(error, 'Error retrieving users');
    }
  }

  async createUser(
    { email, name, role, status }: CreateUserDto
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(`A user with the following email address already exists: ${email}`)
    }

    const temporaryPassword = randomUUID().replace(/-/g, '').slice(0, 15);
    const hashedPassword = await argon2.hash(temporaryPassword);

    const newUserData = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        status,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        temporaryPassword: true,
        createdAt: true,
      },
    });

    return {
      ...newUserData,
      password: temporaryPassword,
    };
  }

  async updateUser(
    userId: string,
    { name, role, status }: UpdateUserDto,
  ) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          name,
          role,
          status,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          temporaryPassword: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error updating user');
    }
  }

  async deleteUser(
    userId: string,
  ) {
    try {
      return await this.prisma.user.delete({
        where: { id: userId },
        select: {
          id: true,
        },
      });
    } catch (error) {
      this.prisma.handleError(error, 'Error deleting user');
    }
  }
}
