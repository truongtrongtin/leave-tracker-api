import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { Leave } from './leave.entity';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/users/user.decorator';
import { User } from 'src/users/user.entity';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';

@Controller('leaves')
@ApiTags('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  @UsePipes(ValidationPipe)
  create(
    @Body() createLeaveDto: CreateLeaveDto,
    @CurrentUser() currentUser: User,
  ): Promise<Leave> {
    return this.leavesService.create(createLeaveDto, currentUser);
  }

  @Get()
  getAll(@CurrentUser() currentUser: User): Promise<Leave[]> {
    return this.leavesService.findAllByUser(currentUser);
  }

  @Get(':id')
  getById(@Param('id') id: number): Promise<Leave> {
    return this.leavesService.findOneById(id);
  }

  @Patch(':id')
  @UsePipes(ValidationPipe)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeaveDto: UpdateLeaveDto,
  ): Promise<Leave> {
    return this.leavesService.update(id, updateLeaveDto);
  }

  @Patch(':id/status')
  @UsePipes(ValidationPipe)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeaveStatusDto: UpdateLeaveStatusDto,
  ): Promise<Leave> {
    return this.leavesService.updateStatus(id, updateLeaveStatusDto.status);
  }

  @Delete(':id')
  delete(@Param('id') id: number): Promise<void> {
    return this.leavesService.delete(id);
  }
}
