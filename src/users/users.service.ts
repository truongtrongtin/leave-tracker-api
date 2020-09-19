import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  async findAll() {
    return await this.userRepository.findAll();
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException(`User is not found`);
    }
    return user;
  }

  async create(signUpDto: SignUpDto): Promise<User> {
    const { email, password } = signUpDto;

    const exists = await this.userRepository.count({ email });
    if (exists > 0) {
      throw new BadRequestException('email existed');
    }
    const user = new User(email, password);
    await this.userRepository.persistAndFlush(user);
    return user;
  }
}
