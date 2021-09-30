import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
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
  constructor(private readonly usersService: UsersService) {}

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
  ): Promise<User> {
    return this.usersService.update(currentUser.id, updateUserDto);
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
  ): Promise<User> {
    const fileData = await request.file();
    return this.usersService.updateAvatar(fileData, currentUser.id);
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
