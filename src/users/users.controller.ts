import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AvatarUploadDto } from './dto/avatar-upload.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from './user.decorator';
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

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AvatarUploadDto })
  updateAvatar(
    @Req() request: FastifyRequest,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.usersService.updateAvatar(request, currentUser);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.delete(id);
  }
}
