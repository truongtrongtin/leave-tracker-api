import { wrap } from '@mikro-orm/core';
import { MailerService } from '@nestjs-modules/mailer';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { google } from 'googleapis';
import { Environment } from '../configs/env.validate';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly mailerService: MailerService,
  ) {}
  private oauth2Client = new google.auth.OAuth2();

  signup(signUpDto: SignUpDto): Promise<User> {
    return this.usersService.create(signUpDto);
  }

  async getAccessCookie(user: User): Promise<string> {
    const tokenPayload = wrap(user).toObject();
    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      )}s`,
    });

    return `Authentication=${accessToken}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    )} ${
      this.configService.get('NODE_ENV') === Environment.Production
        ? ' Same-Site Secure'
        : ''
    }`;
  }

  async getRefreshCookie(userId: string): Promise<string> {
    const payload = { id: userId };
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      )}s`,
    });
    await this.usersService.saveRefreshToken(refreshToken, userId);

    return `Refresh=${refreshToken}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    )} ${
      this.configService.get('NODE_ENV') === Environment.Production
        ? ' Same-Site Secure'
        : ''
    }`;
  }

  async getCookiesForLogOut(userId: string): Promise<string[]> {
    await this.usersService.removeRefreshToken(userId);
    return [
      'Authentication=; Path=/; Max-Age=0',
      'Refresh=; Path=/; Max-Age=0',
    ];
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
    const user = await this.usersService.findById(payload.id);
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

  getGoogleAuthURL(callbackUrl: string, intendedUrl: string): string {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_OAUTH2_CLIENT_ID'),
      this.configService.get('GOOGLE_OAUTH2_CLIENT_SECRET'),
      callbackUrl,
    );
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      state: intendedUrl,
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

  async getUserByGoogleEmail(code: string): Promise<User> {
    const googleUser = await this.getGoogleUser(code);
    if (
      !googleUser.email ||
      !googleUser.email ||
      !googleUser.given_name ||
      !googleUser.family_name
    )
      throw new NotFoundException();

    let user: User;
    try {
      user = await this.usersService.findByEmail(googleUser.email);
    } catch (error) {
      throw new NotFoundException();
    }
    return user;
  }
}
