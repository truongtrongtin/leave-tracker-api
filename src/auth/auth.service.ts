import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async getAccessToken(id: string): Promise<string> {
    const payload: TokenPayload = { id };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      expiresIn: `${process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME}s`,
    });
  }

  async getRefreshToken(id: string): Promise<string> {
    const payload = { id };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: `${process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME}s`,
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    });
  }

  async verifyRefreshToken(token: string): Promise<User> {
    const payload: TokenPayload = this.jwtService.verify(token, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
    });
    const user = await this.userService.findById(payload.id);
    const isRefreshTokenMatching = await bcrypt.compare(
      token,
      user.hashedRefreshToken!,
    );
    if (!isRefreshTokenMatching) {
      throw new BadRequestException();
    }
    return user;
  }
}
