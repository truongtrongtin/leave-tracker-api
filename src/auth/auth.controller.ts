import { MailerService } from '@nestjs-modules/mailer';
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import { FastifyReply } from 'fastify';
import { Environment } from '../configs/env.validate';
import { CurrentUser } from '../decorators/current-user.decorator';
import { FullUrl } from '../decorators/full-url.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { LocalGuard } from '../guards/local.guard';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LogInDto } from './dto/log-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  async signUp(
    @Body() signUpDto: SignUpDto,
    // @Req() request: FastifyRequest,
  ): Promise<User> {
    // const ip = request.ip;
    return await this.usersService.create(signUpDto);
    // this.mailerService.sendMail({
    //   to: email,
    //   subject: 'Welcome to HRM',
    //   template: 'hello',
    //   context: { email },
    // });
  }

  @Post('login')
  @UseGuards(LocalGuard)
  async logIn(
    @CurrentUser() user: User,
    @Body() logInDto: LogInDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<User> {
    const accessToken = await this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user.id);
    reply
      .setCookie('Authentication', accessToken, {
        path: '/',
        httpOnly: true,
        maxAge: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
        ...(this.configService.get('NODE_ENV') === Environment.Production && {
          sameSite: 'none',
          secure: true,
        }),
      })
      .setCookie('Refresh', refreshToken, {
        path: '/',
        httpOnly: true,
        maxAge: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
        ...(this.configService.get('NODE_ENV') === Environment.Production && {
          sameSite: 'none',
          secure: true,
        }),
      });
    await this.usersService.setRefreshToken(refreshToken, user.id);
    return user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logOut(
    @CurrentUser() currentUser: User,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.usersService.removeRefreshToken(currentUser.id);
    reply
      .setCookie('Authentication', '', {
        path: '/',
        httpOnly: true,
        maxAge: 0,
        ...(this.configService.get('NODE_ENV') === Environment.Production && {
          sameSite: 'none',
          secure: true,
        }),
      })
      .setCookie('Refresh', '', {
        path: '/',
        httpOnly: true,
        maxAge: 0,
        ...(this.configService.get('NODE_ENV') === Environment.Production && {
          sameSite: 'none',
          secure: true,
        }),
      });
  }

  @Get('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @CurrentUser() currentUser: User,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<User> {
    const accessToken = await this.authService.generateAccessToken(currentUser);
    reply.setCookie('Authentication', accessToken, {
      path: '/',
      httpOnly: true,
      maxAge: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
      ...(this.configService.get('NODE_ENV') === Environment.Production && {
        sameSite: 'none',
        secure: true,
      }),
    });
    return currentUser;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() currentUser: User): User {
    return currentUser;
  }

  @Get('google')
  generateGoogleAuthURL(@Res() reply: FastifyReply, @FullUrl() url: string) {
    const googleAuthUrl = this.authService.getGoogleAuthURL(`${url}/callback`);
    reply.status(302).redirect(googleAuthUrl);
  }

  @Get('google/callback')
  async googleAuth(@Query('code') code: string, @Res() reply: FastifyReply) {
    const googleUser = await this.authService.getGoogleUser(code);
    if (
      !googleUser.email ||
      !googleUser.email ||
      !googleUser.given_name ||
      !googleUser.family_name
    )
      throw new NotFoundException();
    let user;
    try {
      user = await this.usersService.findByEmail(googleUser.email);
    } catch (error) {
      user = await this.usersService.create({
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        password: randomBytes(20).toString('hex'),
      });
    }
    const accessToken = await this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user.id);
    await this.usersService.setRefreshToken(refreshToken, user.id);
    reply
      .setCookie('Authentication', accessToken, {
        path: '/',
        httpOnly: true,
        maxAge: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
        ...(this.configService.get('NODE_ENV') === Environment.Production && {
          sameSite: 'none',
          secure: true,
        }),
      })
      .setCookie('Refresh', refreshToken, {
        path: '/',
        httpOnly: true,
        maxAge: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
        ...(this.configService.get('NODE_ENV') === Environment.Production && {
          sameSite: 'none',
          secure: true,
        }),
      })
      .status(302)
      .redirect(this.configService.get('CLIENT_URL'));
  }
}
