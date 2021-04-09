import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AvatarUploadDto } from './dto/avatar-upload.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAll(): Promise<User[]> {
    return this.usersService.getAll();
  }

  @Get(':email')
  getByEmail(@Param('email') email: string): Promise<User> {
    return this.usersService.getByEmail(email);
  }

  @Post('edit/me')
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    const {
      firstName,
      lastName,
      role,
      currentPassword,
      password,
    } = updateUserDto;
    if (currentPassword && password) {
      const user = await this.usersService.getAuthenticated(
        currentUser.email,
        currentPassword,
      );
      if (!user) {
        throw new BadRequestException('wrong password');
      }
      return this.usersService.update(
        currentUser.id,
        firstName,
        lastName,
        role,
        password,
      );
    }
    return this.usersService.update(currentUser.id, firstName, lastName, role);
  }

  @Post(':id/editAvatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AvatarUploadDto })
  updateAvatar(
    @Req() request: FastifyRequest,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.usersService.updateAvatar(request, currentUser);
  }

  @Post(':id/delete')
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.delete(id);
  }
}
