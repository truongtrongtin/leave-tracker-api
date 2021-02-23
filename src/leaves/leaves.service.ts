import { QueryOrder, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { Pagination } from 'src/pagination';
import { User } from 'src/users/user.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { Leave } from './leave.entity';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: EntityRepository<Leave>,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async create(createLeaveDto: CreateLeaveDto, user: User): Promise<Leave> {
    const leave = new Leave({ ...createLeaveDto, user });
    await this.leaveRepository.persistAndFlush(leave);
    await this.leaveRepository.populate(leave, ['user']);
    return leave;
  }

  async getAll(
    user: User,
    paginateOptions: { limit?: number; page?: number; route?: string },
  ): Promise<Pagination<Leave>> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const { limit = 10, page = 1, route } = paginateOptions;
    // const qb = this.leaveRepository.createQueryBuilder('a').select('a.*');
    // if (userId) {
    //   qb.andWhere({ user: filterDto.userId });
    // }
    // qb.populate()
    // return qb.getResultList();
    const [leaves, count] = await this.leaveRepository.findAndCount(
      {},
      {
        orderBy: { createdAt: QueryOrder.DESC },
        limit: limit,
        offset: limit * (page - 1),
      },
    );
    await this.leaveRepository.populate(leaves, ['user']);
    return new Pagination<Leave>({
      items: leaves,
      totalItems: count,
      limit,
      currentPage: page,
      route,
    });
  }

  async findOneById(id: number): Promise<Leave> {
    const leave = await this.leaveRepository.findOne(id);
    if (!leave) {
      throw new NotFoundException(`leave with ID "${id}" not found`);
    }
    return leave;
  }

  async update(id: number, user: User, updateLeaveDto: UpdateLeaveDto) {
    const ability = this.caslAbilityFactory.createForUser(user);
    const leave = await this.findOneById(id);
    if (ability.cannot('update', 'all') && leave.startAt < new Date()) {
      throw new BadRequestException(
        "you don't have permission to perform this action",
      );
    }
    wrap(leave).assign(updateLeaveDto);
    await this.leaveRepository.flush();
    await this.leaveRepository.populate(leave, ['user']);
    return leave;
  }

  async delete(id: number): Promise<void> {
    const leave = await this.findOneById(id);
    await this.leaveRepository.removeAndFlush(leave);
  }
}
