import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'users/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: EntityRepository<Task>,
  ) {}

  async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
    // return this.taskRepository.find({ status: filterDto.status });
    const { status, search } = filterDto;
    const query = this.taskRepository.createQueryBuilder('t');

    if (status) {
      query.andWhere('t.status = ?', [status]);
    }

    if (search) {
      query.andWhere('t.title LIKE ? OR t.description LIKE ?', [
        `%${search}%`,
        `%${search}%`,
      ]);
    }

    return await query.getResult();
  }

  async getTaskById(id: number): Promise<Task> {
    const found = await this.taskRepository.findOne(id);
    if (!found) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return found;
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;
    const task = new Task(title, description, user);
    await this.taskRepository.persistAndFlush(task);
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    const found = await this.getTaskById(id);
    await this.taskRepository.removeAndFlush(found);
  }

  async updateTaskStatus(
    id: number,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ): Promise<Task> {
    const found = await this.getTaskById(id);
    found.status = updateTaskStatusDto.status;
    await this.taskRepository.flush();
    return found;
  }
}
