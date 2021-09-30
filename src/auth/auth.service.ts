import { wrap } from '@mikro-orm/core';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { google } from 'googleapis';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {}
  private oauth2Client = new google.auth.OAuth2();

  async generateAccessToken(user: User): Promise<string> {
    const tokenPayload = wrap(user).toObject();
    return this.jwtService.sign(tokenPayload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      )}s`,
    });
  }

  async generateRefreshToken(id: string): Promise<string> {
    const payload = { id };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      )}s`,
    });
  }

  verifyAccessToken(token: string): User & { iat: string; exp: string } {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async verifyRefreshToken(token: string): Promise<User> {
    const payload = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
    });
    const user = await this.userService.findById(payload.id);
    if (!user.hashedRefreshToken) {
      throw new BadRequestException('Hashed refresh token not found');
    }
    const isRefreshTokenMatching = await bcrypt.compare(
      token,
      user.hashedRefreshToken,
    );
    if (!isRefreshTokenMatching) throw new BadRequestException();
    return user;
  }

  getGoogleAuthURL(callbackUrl: string): string {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_OAUTH2_CLIENT_ID'),
      this.configService.get('GOOGLE_OAUTH2_CLIENT_SECRET'),
      callbackUrl,
    );
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
    });
  }

  async getGoogleUser(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    const { data } = await google
      .oauth2({ auth: this.oauth2Client, version: 'v2' })
      .userinfo.get();

    // alternative way
    // const { data } = await lastValueFrom(
    //   this.httpService.get(
    //     `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`,
    //   ),
    // );

    return data;
  }
}
