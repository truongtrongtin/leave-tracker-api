import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
  ) {}

  async getAccessToken(userId: number): Promise<string> {
    const payload: TokenPayload = { userId };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      expiresIn: `${process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME}s`,
    });
  }

  async getRefreshToken(userId: number): Promise<string> {
    const payload = { userId };
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
    const user = await this.userService.findById(payload.userId);
    const isRefreshTokenMatching = await bcrypt.compare(
      token,
      user.currentHashedRefreshToken!,
    );
    if (!isRefreshTokenMatching) {
      throw new BadRequestException();
    }
    return user;
  }
}
