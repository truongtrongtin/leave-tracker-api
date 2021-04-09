import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { FullUrl } from 'src/decorators/full-url.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Pagination } from 'src/pagination';
import { Role, User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { CountUsersLeavesDto } from './dto/count-users-leaves.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { GetLeavesFilterDto } from './dto/get-leaves-filter.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { Leave } from './leave.entity';
import { LeavesService } from './leaves.service';

@Controller('leaves')
@ApiTags('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(
    private readonly leavesService: LeavesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('add')
  async create(
    @Body() createLeaveDto: CreateLeaveDto,
    @CurrentUser() currentUser: User,
  ): Promise<Leave> {
    const { startAt, endAt, reason, userId } = createLeaveDto;
    let user;
    if (currentUser.role === Role.ADMIN && userId) {
      user = await this.usersService.findById(userId);
    } else {
      user = currentUser;
    }
    return this.leavesService.create(startAt, endAt, reason, user);
  }

  @Get()
  getMany(
    @Query() filterDto: GetLeavesFilterDto,
    @FullUrl() fullUrl: string,
  ): Promise<Pagination<Leave>> {
    return this.leavesService.getMany(fullUrl, filterDto);
  }

  @Get('me')
  getMe(
    @Query() filterDto: GetLeavesFilterDto,
    @CurrentUser() currentUser: User,
    @FullUrl() fullUrl: string,
  ): Promise<Pagination<Leave>> {
    return this.leavesService.getMe(currentUser, fullUrl, filterDto);
  }

  @Get(':id')
  getById(@Param('id') id: number): Promise<Leave> {
    return this.leavesService.findOneById(id);
  }

  @Post(':id/edit')
  @HttpCode(200)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
    @Body() updateLeaveDto: UpdateLeaveDto,
  ): Promise<Leave> {
    const { startAt, endAt, reason, userId } = updateLeaveDto;
    let newLeaveUser;
    if (currentUser.role === Role.ADMIN && userId) {
      newLeaveUser = await this.usersService.findById(userId);
    } else {
      newLeaveUser = currentUser;
    }
    return this.leavesService.update(
      id,
      startAt,
      endAt,
      reason,
      newLeaveUser,
      currentUser,
    );
  }

  @Post(':id/delete')
  @HttpCode(200)
  delete(
    @Param('id') id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.leavesService.delete(id, currentUser);
  }

  @Get('countUsersLeaves')
  countUsersLeaves(@Query() filterDto: CountUsersLeavesDto) {
    return this.leavesService.countUsersLeaves(filterDto.year);
  }
}
