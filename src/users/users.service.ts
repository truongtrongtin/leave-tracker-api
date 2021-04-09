import { Storage } from '@google-cloud/storage';
import { wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { FastifyRequest } from 'fastify';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  async getAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async getByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException(`user is not found`);
    }
    return user;
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`user is not found`);
    }
    return user;
  }

  async getAuthenticated(email: string, password: string): Promise<User> {
    const user = await this.getByEmail(email);
    const isRightPassword = await user.checkPassword(password);
    if (!isRightPassword) {
      throw new BadRequestException(`wrong password`);
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
    // const timezone = (
    //   await this.httpService.get(`http://ip-api.com/json/${ip}`).toPromise()
    // ).data.timezone;
    const user = new User({ email, password, firstName, lastName });
    await this.userRepository.persistAndFlush(user);
    return user;
  }

  async setRefreshToken(refreshToken: string, id: number): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const query = this.userRepository.createQueryBuilder('t');
    query.update({ hashedRefreshToken }).where(id);
    await query.getResultList();
  }

  async removeRefreshToken(id: number) {
    const query = this.userRepository.createQueryBuilder('t');
    query.update({ hashedRefreshToken: null }).where(id);
    await query.getResultList();
  }

  async update(
    id: number,
    firstName: string,
    lastName: string,
    role?: Role,
    password?: string,
  ) {
    const user = await this.findById(id);
    wrap(user).assign({
      firstName,
      lastName,
      ...(role && { role }),
      ...(password && { password }),
    });
    this.userRepository.flush();
    return user;
  }

  async delete(id: number) {
    const user = await this.findById(id);
    await this.userRepository.removeAndFlush(user);
  }

  async updateAvatar(request: FastifyRequest, user: User) {
    const data = await request.file();
    const buffer = await data.toBuffer();
    const storage = new Storage();
    const bucket = storage.bucket(process.env.BUCKET_NAME!);

    // if (user.avatar) {
    //   const currentFileName = path.basename(user.avatar);
    //   await bucket.file(currentFileName).delete();
    // }

    // save to local
    // const fileStream = data.file;
    // const pipeline = util.promisify(stream.pipeline);
    // await pipeline(fileStream, fs.createWriteStream(`uploads/${fileName}`));

    const newFile = bucket.file(data.filename);
    await newFile.save(buffer, {
      resumable: false,
      gzip: true,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });
    user.avatar = `https://storage.googleapis.com/${bucket.name}/${data.filename}`;
    await this.userRepository.flush();
    return user;
  }
}
