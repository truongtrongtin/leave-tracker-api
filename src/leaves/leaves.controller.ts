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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { FullUrl } from 'src/decorators/full-url.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Pagination } from 'src/pagination';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { AdminCreateLeaveDto } from './dto/admin-create-leave.dto';
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
  @UsePipes(ValidationPipe)
  create(
    @Body() createLeaveDto: CreateLeaveDto,
    @CurrentUser() currentUser: User,
  ): Promise<Leave> {
    const { startAt, endAt, reason } = createLeaveDto;
    return this.leavesService.create(startAt, endAt, reason, currentUser);
  }

  @Post('admin.add')
  // @UseGuards(RolesGuard)
  // @Roles(Role.ADMIN)
  @UsePipes(ValidationPipe)
  async adminCreate(
    @Body() adminCreateLeaveDto: AdminCreateLeaveDto,
  ): Promise<Leave> {
    const { startAt, endAt, reason, userId } = adminCreateLeaveDto;
    const user = await this.usersService.findById(userId);
    return this.leavesService.create(startAt, endAt, reason, user);
  }

  @Get()
  getMany(
    @Query(ValidationPipe) filterDto: GetLeavesFilterDto,
    @CurrentUser() currentUser: User,
    @FullUrl() fullUrl: string,
  ): Promise<Pagination<Leave>> {
    return this.leavesService.getMany(currentUser, fullUrl, filterDto);
  }

  @Get(':id')
  getById(@Param('id') id: number): Promise<Leave> {
    return this.leavesService.findOneById(id);
  }

  @Post(':id/edit')
  @HttpCode(200)
  @UsePipes(ValidationPipe)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
    @Body() updateLeaveDto: UpdateLeaveDto,
  ): Promise<Leave> {
    return this.leavesService.update(id, currentUser, updateLeaveDto);
  }

  @Post(':id/delete')
  @HttpCode(200)
  delete(@Param('id') id: number): Promise<void> {
    return this.leavesService.delete(id);
  }
}
