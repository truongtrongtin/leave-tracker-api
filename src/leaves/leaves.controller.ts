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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Pagination } from 'src/pagination';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { GetLeavesFilterDto } from './dto/get-leaves-filter.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { Leave } from './leave.entity';
import { LeavesService } from './leaves.service';
import { FullUrl } from 'src/decorators/full-url.decorator';

@Controller('leaves')
@ApiTags('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post('add')
  @UsePipes(ValidationPipe)
  create(
    @Body() createLeaveDto: CreateLeaveDto,
    @CurrentUser() currentUser: User,
  ): Promise<Leave> {
    return this.leavesService.create(createLeaveDto, currentUser);
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
