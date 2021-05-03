import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
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
  getAll(
    @Query() filterDto: GetTasksFilterDto,
    @CurrentUser() user: User,
  ): Promise<Task[]> {
    return this.taskService.getAllWithFilter(filterDto, user);
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Task> {
    return this.taskService.getById(id);
  }

  @Post('/add')
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.taskService.create(createTaskDto, user);
  }

  @Post(':id/delete')
  delete(@Param('id') id: string): Promise<void> {
    return this.taskService.delete(id);
  }

  @Post(':id/editStatus')
  updateStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ): Promise<Task> {
    return this.taskService.updateStatus(id, updateTaskStatusDto);
  }
}
