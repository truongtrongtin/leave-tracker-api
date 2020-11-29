import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'auth/guards/jwt.guard';
import { CurrentUser } from 'users/user.decorator';
import { User } from 'users/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtGuard)
@ApiTags('tasks')
@ApiBearerAuth()
export class TasksController {
  constructor(private taskService: TasksService) {}

  @Get()
  @UsePipes(ValidationPipe)
  getTasks(
    @Query(ValidationPipe) filterDto: GetTasksFilterDto,
    @CurrentUser() user: User,
  ): Promise<Task[]> {
    return this.taskService.getTasks(filterDto, user);
  }

  @Get(':id')
  getTaskById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.taskService.getTaskById(id, user);
  }

  @Post()
  @UsePipes(ValidationPipe)
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.taskService.createTask(createTaskDto, user);
  }

  @Delete(':id')
  deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.taskService.deleteTask(id, user);
  }

  @Patch(':id/status')
  @UsePipes(ValidationPipe)
  updateTaskStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.taskService.updateTaskStatus(id, updateTaskStatusDto, user);
  }
}
