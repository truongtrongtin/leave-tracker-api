import { wrap } from '@mikro-orm/core';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { google } from 'googleapis';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  private oauth2Client = new google.auth.OAuth2();

  async generateAccessToken(user: User): Promise<string> {
    const tokenPayload = wrap(user).toObject();
    return this.jwtService.sign(tokenPayload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      expiresIn: `${process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME}s`,
    });
  }

  async generateRefreshToken(id: string): Promise<string> {
    const payload = { id };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: `${process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME}s`,
    });
  }

  verifyAccessToken(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    });
  }

  async verifyRefreshToken(token: string): Promise<User> {
    const payload = this.jwtService.verify(token, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
    });
    const user = await this.userService.findById(payload.id);
    const isRefreshTokenMatching = await bcrypt.compare(
      token,
      user.hashedRefreshToken!,
    );
    if (!isRefreshTokenMatching) throw new BadRequestException();
    return user;
  }

  getGoogleAuthURL(callbackUrl: string): string {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH2_CLIENT_ID,
      process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
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
