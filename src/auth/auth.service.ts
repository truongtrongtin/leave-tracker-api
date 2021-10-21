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
import { lastValueFrom } from 'rxjs';
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
      throw new BadRequestException('refresh_token_not_found');
    }
    const isRefreshTokenMatching = await bcrypt.compare(
      token,
      user.hashedRefreshToken,
    );
    if (!isRefreshTokenMatching) throw new BadRequestException();
    return user;
  }

  getGoogleAuthUrl(callbackUrl: string, intendedUrl: string): string {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_OAUTH2_CLIENT_ID'),
      this.configService.get('GOOGLE_OAUTH2_CLIENT_SECRET'),
      callbackUrl,
    );
    return this.oauth2Client.generateAuthUrl({
      scope: 'openid email',
      state: intendedUrl,
    });
  }

  async getUserByGoogleEmail(code: string): Promise<User> {
    const { tokens } = await this.oauth2Client.getToken(code);
    const userInfo = this.jwtService.decode(tokens['id_token']);
    return this.usersService.findByEmail(userInfo['email']);
  }

  // getGoogleAuthUrlNoLib(redirectUri: string, state: string) {
  //   const query = new URLSearchParams({
  //     client_id: this.configService.get('GOOGLE_OAUTH2_CLIENT_ID'),
  //     response_type: 'code',
  //     scope: 'openid email',
  //     state,
  //     redirect_uri: redirectUri,
  //   }).toString();
  //   return `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
  // }

  // async getUserByGoogleEmailNoLib(redirectUri: string, code: string) {
  //   const { data: tokens } = await lastValueFrom(
  //     this.httpService.post('https://oauth2.googleapis.com/token', {
  //       code,
  //       client_id: this.configService.get('GOOGLE_OAUTH2_CLIENT_ID'),
  //       client_secret: this.configService.get('GOOGLE_OAUTH2_CLIENT_SECRET'),
  //       grant_type: 'authorization_code',
  //       redirect_uri: redirectUri,
  //     }),
  //   );
  //   const userInfo = this.jwtService.decode(tokens['id_token']);
  //   return this.usersService.findByEmail(userInfo['email']);
  // }

  getGithubAuthURL(redirectUri: string, state: string): string {
    const query = new URLSearchParams({
      client_id: this.configService.get('GITHUB_OAUTH2_CLIENT_ID'),
      scope: 'read:user',
      state,
      redirect_uri: redirectUri,
    }).toString();
    return `https://github.com/login/oauth/authorize?${query}`;
  }

  async getGithubAccessToken(redirectUri: string, code: string) {
    const { data } = await lastValueFrom(
      this.httpService.post(
        'https://github.com/login/oauth/access_token',
        {
          code,
          client_id: this.configService.get('GITHUB_OAUTH2_CLIENT_ID'),
          client_secret: this.configService.get('GITHUB_OAUTH2_CLIENT_SECRET'),
          redirect_uri: redirectUri,
        },
        { headers: { Accept: 'application/json' } },
      ),
    );
    return data['access_token'];
  }

  async getUserByGithubEmail(redirectUri: string, code: string) {
    const accessToken = await this.getGithubAccessToken(redirectUri, code);
    const { data: githubUser } = await lastValueFrom(
      this.httpService.get('https://api.github.com/user', {
        headers: {
          Authorization: `Token ${accessToken}`,
        },
      }),
    );
    return this.usersService.findByEmail(githubUser['email']);
  }

  getFacebookAuthURL(redirectUri: string, state: string): string {
    const query = new URLSearchParams({
      client_id: this.configService.get('FACEBOOK_OAUTH2_APP_ID'),
      redirect_uri: redirectUri,
      state,
      scope: 'email',
      auth_type: 'rerequest',
    }).toString();
    return `https://www.facebook.com/dialog/oauth?${query}`;
  }

  async getFacebookAccessToken(redirectUri: string, code: string) {
    const query = new URLSearchParams({
      client_id: this.configService.get('FACEBOOK_OAUTH2_APP_ID'),
      client_secret: this.configService.get('FACEBOOK_OAUTH2_APP_SECRET'),
      code,
      redirect_uri: redirectUri,
      scope: 'email',
    }).toString();
    const { data } = await lastValueFrom(
      this.httpService.get(
        `https://graph.facebook.com/oauth/access_token?${query}`,
      ),
    );
    return data['access_token'];
  }

  async getUserByFacebookEmail(redirectUri: string, code: string) {
    const accessToken = await this.getFacebookAccessToken(redirectUri, code);
    const { data: facebookUser } = await lastValueFrom(
      this.httpService.get('https://graph.facebook.com/me?fields=email', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );
    if (!facebookUser['email']) {
      throw new NotFoundException('email_permission_required');
    }
    return this.usersService.findByEmail(facebookUser['email']);
  }
}
