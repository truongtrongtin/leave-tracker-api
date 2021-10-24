import { QueryOrder, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pagination } from '../pagination';
import { Role, User } from '../users/user.entity';
import { GetLeavesFilterDto } from './dto/get-leaves-filter.dto';
import { Leave } from './leave.entity';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: EntityRepository<Leave>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  async create(
    startAt: Date,
    endAt: Date,
    userId: string,
    reason?: string,
  ): Promise<Leave> {
    const max = new Date();
    max.setMonth(max.getMonth() + 6);
    if (startAt > max) {
      throw new BadRequestException('out of range');
    }
    const count = await this.leaveRepository.count({
      $or: [{ startAt }, { endAt }],
      user: userId,
    });
    if (count) {
      throw new BadRequestException(
        "you've already had a leave on this day, please edit it instead",
      );
    }
    const user = await this.userRepository.findOne(userId);
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
      from,
      to,
      reason,
      userId,
    } = filterDto;

    const [leaves, count] = await this.leaveRepository.findAndCount(
      {
        ...(userId && { user: userId }),
        ...(reason && { reason }),
        ...(from && { startAt: { $gte: from } }),
        ...(to && { endAt: { $lte: to } }),
      },
      {
        orderBy: { [orderBy]: order },
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

  async getMe(
    userId: string,
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
      { user: userId, ...(reason && { reason }) },
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

  async getLeaveSumByUser(userId: string, year?: number) {
    const qb = this.leaveRepository
      .createQueryBuilder('l')
      .select(
        'cast(sum(case when extract(hour from (l.end_at - l.start_at)) = 9 then 1 else 0.5 end) as float)',
      )
      .where(`l.user_id = '${userId}'`);
    if (year) {
      qb.andWhere(`extract(year from l.start_at) = ${year}`);
    }
    const result = await qb.execute();
    return result[0];
  }

  async getAllUsersLeaveSum(year?: number) {
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

  async findOneById(id: string): Promise<Leave> {
    const leave = await this.leaveRepository.findOne(id);
    if (!leave) {
      throw new NotFoundException(`leave with ID "${id}" not found`);
    }
    return leave;
  }

  async update(
    id: string,
    startAt: Date,
    endAt: Date,
    user: User,
    currentUser: User,
    reason?: string,
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

  async delete(id: string, currentUser: User): Promise<void> {
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
    await this.leaveRepository.removeAndFlush(leave);
  }
}
