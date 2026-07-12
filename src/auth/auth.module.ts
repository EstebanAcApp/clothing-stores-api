import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { StaffAuthController, CustomerAuthController } from './auth.controller';

import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthGuard } from './guards/auth/auth.guard';
import { AlreadyAuthenticatedGuard } from './guards/already-authenticated.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  controllers: [StaffAuthController, CustomerAuthController],
  providers: [AuthService, AuthGuard, AlreadyAuthenticatedGuard],
  exports: [JwtModule, AuthGuard],
})
export class AuthModule { }