import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiTags('tasks')
export class TasksController {
  constructor(private taskService: TasksService) {}

  @Get()
  @UsePipes(ValidationPipe)
  getAll(
    @Query(ValidationPipe) filterDto: GetTasksFilterDto,
    @CurrentUser() user: User,
  ): Promise<Task[]> {
    return this.taskService.getAllWithFilter(filterDto, user);
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<Task> {
    return this.taskService.getById(id);
  }

  @Post('/add')
  @UsePipes(ValidationPipe)
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.taskService.create(createTaskDto, user);
  }

  @Post(':id/delete')
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.taskService.delete(id);
  }

  @Post(':id/editStatus')
  @UsePipes(ValidationPipe)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ): Promise<Task> {
    return this.taskService.updateStatus(id, updateTaskStatusDto);
  }
}
