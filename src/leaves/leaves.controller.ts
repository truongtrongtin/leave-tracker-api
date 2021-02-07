import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/users/user.decorator';
import { User } from 'src/users/user.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { Leave } from './leave.entity';
import { LeavesService } from './leaves.service';

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
  getAll(@CurrentUser() currentUser: User): Promise<Leave[]> {
    return this.leavesService.findAllByUser(currentUser);
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
    @Body() updateLeaveDto: UpdateLeaveDto,
  ): Promise<Leave> {
    return this.leavesService.update(id, updateLeaveDto);
  }

  @Post(':id/delete')
  @HttpCode(200)
  delete(@Param('id') id: number): Promise<void> {
    return this.leavesService.delete(id);
  }
}
