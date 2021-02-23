import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SignUpDto } from './dto/sign-up.dto';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { LogInDto } from './dto/log-in.dto';
import { LocalGuard } from './local.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { FastifyReply } from 'fastify';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { UsersService } from '../users/users.service';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
  ) {}

  @Post('signup')
  @UsePipes(ValidationPipe)
  async signUp(@Body() signUpDto: SignUpDto): Promise<User> {
    const { email, password, firstName, lastName } = signUpDto;
    return await this.usersService.create({
      email,
      password,
      firstName,
      lastName,
    });
    // this.mailerService.sendMail({
    //   to: email,
    //   subject: 'Welcome to HRM',
    //   template: 'hello',
    //   context: { email },
    // });
  }

  @Post('login')
  @UseGuards(LocalGuard)
  @UsePipes(ValidationPipe)
  async logIn(
    @Body() logInDto: LogInDto,
    @CurrentUser() currentUser: User,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const accessToken = await this.authService.getAccessToken(currentUser.id);
    const refreshToken = await this.authService.getRefreshToken(currentUser.id);
    reply
      .setCookie('Authentication', accessToken, {
        path: '/',
        httpOnly: true,
        maxAge: +process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME!,
        ...(process.env.NODE_ENV === 'production' && {
          sameSite: 'none',
          secure: true,
        }),
      })
      .setCookie('Refresh', refreshToken, {
        path: '/',
        httpOnly: true,
        maxAge: +process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME!,
        ...(process.env.NODE_ENV === 'production' && {
          sameSite: 'none',
          secure: true,
        }),
      });
    await this.usersService.setRefreshToken(refreshToken, currentUser.id);
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
        ...(process.env.NODE_ENV === 'production' && {
          sameSite: 'none',
          secure: true,
        }),
      })
      .setCookie('Refresh', '', {
        path: '/',
        httpOnly: true,
        maxAge: 0,
        ...(process.env.NODE_ENV === 'production' && {
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
  ): Promise<void> {
    const accessToken = await this.authService.getAccessToken(currentUser.id);
    reply.setCookie('Authentication', accessToken, {
      path: '/',
      httpOnly: true,
      maxAge: +process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME!,
      ...(process.env.NODE_ENV === 'production' && {
        sameSite: 'none',
        secure: true,
      }),
    });
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() currentUser: User): User {
    return currentUser;
  }
}
