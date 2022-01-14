import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { LocalGuard } from '../guards/local.guard';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { LogInDto } from './dto/log-in.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(
    @Body() signUpDto: SignUpDto,
    // @Req() request: FastifyRequest,
  ): Promise<User> {
    // const ip = request.ip;
    // this.mailerService.sendMail({
    //   to: user.email,
    //   subject: 'Welcome to Leave Tracker',
    //   template: './hello',
    //   context: { email: user.email },
    // });
    return this.authService.signup(signUpDto);
  }

  @Post('login')
  @ApiConsumes('application/x-www-form-urlencoded')
  @UseGuards(LocalGuard)
  async logIn(
    @CurrentUser() user: User,
    @Body() logInDto: LogInDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<User> {
    const accessCookie = await this.authService.getAccessCookie(user);
    const refreshCookie = await this.authService.getRefreshCookie(user.id);
    reply.header('Set-Cookie', [accessCookie, refreshCookie]);
    return user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logOut(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const logOutCookies = await this.authService.getCookiesForLogOut(user.id);
    reply.header('Set-Cookie', logOutCookies);
  }

  @Get('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<User> {
    const accessCookie = await this.authService.getAccessCookie(user);
    reply.header('Set-Cookie', accessCookie);
    return user;
  }

  @Post('requestPasswordReset')
  requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ) {
    const { email, resetPath } = requestPasswordResetDto;
    return this.authService.requestPasswordReset(email, resetPath);
  }

  @Post('resetPassword')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;
    return this.authService.resetPassword(token, newPassword);
  }

  @Get('google')
  generateGoogleAuthURL(
    @Query('intended_url') intendedUrl: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const redirectUri = `${request.protocol}://${request.hostname}/auth/google/callback`;
    const googleAuthUrl = this.authService.getGoogleAuthUrl(
      redirectUri,
      intendedUrl,
    );
    reply.status(302).redirect(googleAuthUrl);
  }

  @Get('google/callback')
  async googleAuth(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() reply: FastifyReply,
  ) {
    const clientOriginUrl = new URL(state).origin;
    let user: User;
    try {
      user = await this.authService.getUserByGoogleEmail(code);
    } catch (error) {
      return reply
        .status(302)
        .redirect(`${clientOriginUrl}/login?error=${error.message}`);
    }
    const accessCookie = await this.authService.getAccessCookie(user);
    const refreshCookie = await this.authService.getRefreshCookie(user.id);
    reply
      .header('Set-Cookie', [accessCookie, refreshCookie])
      .status(302)
      .redirect(state);
  }

  @Get('github')
  generateGithubAuthURL(
    @Query('intended_url') intendedUrl: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const redirectUri = `${request.protocol}://${request.hostname}/auth/github/callback`;
    const githubAuthUrl = this.authService.getGithubAuthURL(
      redirectUri,
      intendedUrl,
    );
    reply.status(302).redirect(githubAuthUrl);
  }

  @Get('github/callback')
  async githubAuth(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const clientOriginUrl = new URL(state).origin;
    if (error) return reply.status(302).redirect(`${clientOriginUrl}/login`);
    const redirectUri = `${request.protocol}://${request.hostname}/auth/github/callback`;
    const user = await this.authService.getUserByGithubEmail(redirectUri, code);
    const accessCookie = await this.authService.getAccessCookie(user);
    const refreshCookie = await this.authService.getRefreshCookie(user.id);
    reply
      .header('Set-Cookie', [accessCookie, refreshCookie])
      .status(302)
      .redirect(state);
  }

  @Get('facebook')
  generateFacebookAuthURL(
    @Query('intended_url') intendedUrl: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const redirectUri = `${request.protocol}://${request.hostname}/auth/facebook/callback`;
    const facebookAuthUrl = this.authService.getFacebookAuthURL(
      redirectUri,
      intendedUrl,
    );
    reply.status(302).redirect(facebookAuthUrl);
  }

  @Get('facebook/callback')
  async facebookAuth(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const clientOriginUrl = new URL(state).origin;
    if (error) return reply.status(302).redirect(`${clientOriginUrl}/login`);
    const redirectUri = `${request.protocol}://${request.hostname}/auth/facebook/callback`;
    let user: User;
    try {
      user = await this.authService.getUserByFacebookEmail(redirectUri, code);
    } catch (error) {
      return reply
        .status(302)
        .redirect(`${clientOriginUrl}/login?error=${error.message}`);
    }
    const accessCookie = await this.authService.getAccessCookie(user);
    const refreshCookie = await this.authService.getRefreshCookie(user.id);
    reply
      .header('Set-Cookie', [accessCookie, refreshCookie])
      .status(302)
      .redirect(state);
  }
}
