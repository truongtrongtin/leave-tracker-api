import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from '../auth/auth.service';
import { Environment } from '../configs/env.validate';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getAll(): Promise<User[]> {
    return this.usersService.getAll();
  }

  @Get('me')
  getCurrentUser(@CurrentUser() currentUser: User): User {
    return currentUser;
  }

  @Get('dateOfBirth')
  getAllDateOfBirths(): Promise<User[]> {
    return this.usersService.getAllDateOfBirths();
  }

  @Get(':email')
  getByEmail(@Param('email') email: string): Promise<User> {
    return this.usersService.findByEmail(email);
  }

  @Post('me/update')
  async updateInfo(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<User> {
    const user = await this.usersService.update(currentUser.id, updateUserDto);
    const accessToken = await this.authService.generateAccessToken(user);
    reply.setCookie('Authentication', accessToken, {
      path: '/',
      httpOnly: true,
      maxAge: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
      ...(this.configService.get('NODE_ENV') === Environment.Production && {
        sameSite: 'none',
        secure: true,
      }),
    });
    return user;
  }

  @Post('me/updatePassword')
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.usersService.updatePassword(
      currentUser.email,
      updatePasswordDto,
    );
  }

  @Post('me/updateAvatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateAvatarDto })
  async updateAvatar(
    @Req() request: FastifyRequest,
    @CurrentUser() currentUser: User,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<User> {
    const fileData = await request.file();
    const user = await this.usersService.updateAvatar(fileData, currentUser.id);
    const accessToken = await this.authService.generateAccessToken(user);
    reply.setCookie('Authentication', accessToken, {
      path: '/',
      httpOnly: true,
      maxAge: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
      ...(this.configService.get('NODE_ENV') === Environment.Production && {
        sameSite: 'none',
        secure: true,
      }),
    });
    return user;
  }

  @Post(':id/delete')
  delete(@Param('id') id: string): Promise<void> {
    return this.usersService.deleteOneById(id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string): Promise<User> {
    return this.usersService.restore(id);
  }
}
