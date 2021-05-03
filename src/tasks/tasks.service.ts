import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/user.entity';
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

  async getAllWithFilter(
    filterDto: GetTasksFilterDto,
    user: User,
  ): Promise<Task[]> {
    const { status, search } = filterDto;
    const query = this.taskRepository.createQueryBuilder('t');
    query.where('t.user_id = ?', [user.id]);

    if (status) {
      query.andWhere('t.status = ?', [status]);
    }

    if (search) {
      query.andWhere('t.title LIKE ? OR t.description LIKE ?', [
        `%${search}%`,
        `%${search}%`,
      ]);
    }

    return await query.getResultList();
  }

  async getById(id: string): Promise<Task> {
    const found = await this.taskRepository.findOne(id);
    if (!found) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return found;
  }

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = new Task({ ...createTaskDto, user });
    await this.taskRepository.persistAndFlush(task);
    return task;
  }

  async delete(id: string): Promise<void> {
    const found = await this.getById(id);
    await this.taskRepository.removeAndFlush(found);
  }

  async updateStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ): Promise<Task> {
    const found = await this.getById(id);
    found.status = updateTaskStatusDto.status;
    await this.taskRepository.flush();
    return found;
  }
}
