import { wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'src/users/user.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { Leave } from './leave.entity';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: EntityRepository<Leave>,
  ) {}

  async create(createLeaveDto: CreateLeaveDto, user: User): Promise<Leave> {
    const leave = new Leave({ ...createLeaveDto, user });
    await this.leaveRepository.persistAndFlush(leave);
    await this.leaveRepository.populate(leave, ['user']);
    return leave;
  }

  findAll(): Promise<Leave[]> {
    return this.leaveRepository.findAll();
  }

  findAllByUser(user: User): Promise<Leave[]> {
    return this.leaveRepository.find({ user }, ['user']);
  }

  async findOneById(id: number): Promise<Leave> {
    const leave = await this.leaveRepository.findOne(id);
    if (!leave) {
      throw new NotFoundException(`Leave with ID "${id}" not found`);
    }
    return leave;
  }

  async update(id: number, updateLeaveDto: UpdateLeaveDto) {
    const leave = await this.findOneById(id);
    wrap(leave).assign(updateLeaveDto);
    await this.leaveRepository.flush();
    await this.leaveRepository.populate(leave, ['user']);
    return leave;
  }

  async delete(id: number): Promise<void> {
    const leave = await this.findOneById(id);
    await this.leaveRepository.removeAndFlush(leave);
    await this.leaveRepository.populate(leave, ['user']);
  }
}
