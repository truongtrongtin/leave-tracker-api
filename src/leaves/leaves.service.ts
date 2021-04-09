import { QueryOrder, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pagination } from 'src/pagination';
import { Role, User } from 'src/users/user.entity';
import { GetLeavesFilterDto } from './dto/get-leaves-filter.dto';
import { Leave } from './leave.entity';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: EntityRepository<Leave>,
  ) {}

  async create(
    startAt: Date,
    endAt: Date,
    reason: string,
    user: User,
  ): Promise<Leave> {
    const max = new Date();
    max.setMonth(max.getMonth() + 6);
    if (startAt > max) {
      throw new BadRequestException('out of range');
    }
    const count = await this.leaveRepository.count({
      $or: [{ startAt }, { endAt }],
      user,
    });
    if (count) {
      throw new BadRequestException(
        "you've already had a leave on this day, please edit it instead",
      );
    }
    const leave = new Leave({ startAt, endAt, reason, user });
    await this.leaveRepository.persistAndFlush(leave);
    await this.leaveRepository.populate(leave, ['user']);
    return leave;
  }

  async getMany(
    route: string,
    filterDto: GetLeavesFilterDto,
  ): Promise<Pagination<Leave>> {
    const {
      limit = 1000,
      page = 1,
      orderBy = 'createdAt',
      order = QueryOrder.DESC,
      reason,
      userId,
    } = filterDto;

    const [leaves, count] = await this.leaveRepository.findAndCount(
      { ...(userId && { user: userId }), ...(reason && { reason }) },
      {
        orderBy: { [orderBy]: order },
        limit: limit,
        offset: limit * (page - 1),
      },
    );
    if (!userId) {
      await this.leaveRepository.populate(leaves, ['user']);
    }
    return new Pagination<Leave>({
      items: leaves,
      totalItems: count,
      limit,
      currentPage: page,
      route,
    });
  }

  async getMe(
    user: User,
    route: string,
    filterDto: GetLeavesFilterDto,
  ): Promise<Pagination<Leave>> {
    const {
      limit = 1000,
      page = 1,
      orderBy = 'createdAt',
      order = QueryOrder.DESC,
      reason,
    } = filterDto;

    const [leaves, count] = await this.leaveRepository.findAndCount(
      { user },
      {
        orderBy: { [orderBy]: order },
        limit: limit,
        offset: limit * (page - 1),
      },
    );
    return new Pagination<Leave>({
      items: leaves,
      totalItems: count,
      limit,
      currentPage: page,
      route,
    });
  }

  async countUsersLeaves(year?: number) {
    const qb = this.leaveRepository
      .createQueryBuilder('l')
      .select([
        'u.id',
        'u.email',
        'u.first_name',
        'u.last_name',
        'cast(sum(case when extract(hour from (l.end_at - l.start_at)) = 9 then 1 else 0.5 end) as float)',
      ])
      .join('l.user', 'u')
      .groupBy('u.id');
    if (year) {
      qb.where(`extract(year from l.start_at) = ${year}`);
    }
    return qb.execute();
  }

  async findOneById(id: number): Promise<Leave> {
    const leave = await this.leaveRepository.findOne(id);
    if (!leave) {
      throw new NotFoundException(`leave with ID "${id}" not found`);
    }
    return leave;
  }

  async update(
    id: number,
    startAt: Date,
    endAt: Date,
    reason: string,
    user: User,
    currentUser: User,
  ) {
    const leave = await this.findOneById(id);
    if (currentUser.role === Role.MEMBER) {
      const today = new Date();
      today.setDate(today.getDate() - 1);
      // Allow normal user to edit within 1 day after startAt
      if (currentUser.id !== leave.user.id) {
        throw new BadRequestException(
          "you can not edit other's leave, please contact the admin",
        );
      }
      if (leave.startAt < today) {
        throw new BadRequestException(
          'you can not edit old leave, please contact the admin',
        );
      }
    }
    wrap(leave).assign({ startAt, endAt, reason, user });
    await this.leaveRepository.flush();
    await this.leaveRepository.populate(leave, ['user']);
    return leave;
  }

  async delete(id: number, currentUser: User): Promise<void> {
    const leave = await this.findOneById(id);
    const today = new Date();
    today.setDate(today.getDate() - 1);
    // Allow normal user to delete within 1 day after startAt
    if (currentUser.role === Role.MEMBER && leave.startAt < today) {
      throw new BadRequestException(
        'you can not edit old leave, please contact the admin',
      );
    }
    await this.leaveRepository.removeAndFlush(leave);
  }
}
