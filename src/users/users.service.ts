import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException(`User is not found`);
    }
    return user;
  }

  async findById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User is not found`);
    }
    return user;
  }

  async getAuthenticatedUser(email: string, password: string): Promise<User> {
    const user = await this.findByEmail(email);
    const isRightPassword = await user.checkPassword(password);
    if (!isRightPassword) {
      throw new BadRequestException(`Wrong password`);
    }
    return user;
  }

  async create({
    email,
    password,
    firstName,
    lastName,
  }: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const exists = await this.userRepository.count({ email });
    if (exists > 0) {
      throw new BadRequestException('email existed');
    }
    const user = new User({ email, password, firstName, lastName });
    await this.userRepository.persistAndFlush(user);
    return user;
  }

  async setCurrentRefreshToken(
    refreshToken: string,
    userId: number,
  ): Promise<void> {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const query = this.userRepository.createQueryBuilder('t');
    query.update({ currentHashedRefreshToken }).where(userId);
    await query.getResultList();
  }

  async removeRefreshToken(userId: number) {
    const query = this.userRepository.createQueryBuilder('t');
    query.update({ currentHashedRefreshToken: null }).where(userId);
    await query.getResultList();
  }
}
