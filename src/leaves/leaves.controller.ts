import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RequestUrl } from '../decorators/request-url.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Pagination } from '../pagination';
import { Role, User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
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
  async create(@Body() createLeaveDto: CreateLeaveDto): Promise<Leave> {
    const { startAt, endAt, reason, userId } = createLeaveDto;
    return this.leavesService.create(startAt, endAt, userId, reason);
  }

  @Get()
  getMany(
    @Query() filterDto: GetLeavesFilterDto,
    @RequestUrl() fullUrl: string,
  ): Promise<Pagination<Leave>> {
    return this.leavesService.getMany(fullUrl, filterDto);
  }

  @Get('me')
  getMe(
    @Query() filterDto: GetLeavesFilterDto,
    @CurrentUser() currentUser: User,
    @RequestUrl() fullUrl: string,
  ): Promise<Pagination<Leave>> {
    return this.leavesService.getMe(currentUser.id, fullUrl, filterDto);
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Leave> {
    return this.leavesService.findOneById(id);
  }

  @Post(':id/edit')
  @HttpCode(200)
  async update(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Body() updateLeaveDto: UpdateLeaveDto,
  ): Promise<Leave> {
    const { startAt, endAt, reason, userId } = updateLeaveDto;
    let newLeaveUser: User;
    if (currentUser.role === Role.ADMIN && userId) {
      newLeaveUser = await this.usersService.findById(userId);
    } else {
      newLeaveUser = currentUser;
    }
    return this.leavesService.update(
      id,
      startAt,
      endAt,
      newLeaveUser,
      currentUser,
      reason,
    );
  }

  @Post(':id/delete')
  @HttpCode(200)
  delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.leavesService.delete(id, currentUser);
  }

  @Get('getMyLeaveSum')
  getMyLeaveSum(
    @Query() filterDto: CountUsersLeavesDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.leavesService.getLeaveSumByUser(currentUser.id, filterDto.year);
  }

  @Get('getAllUsersLeaveSum')
  getAllUsersLeaveSum(@Query() filterDto: CountUsersLeavesDto) {
    return this.leavesService.getAllUsersLeaveSum(filterDto.year);
  }
}
