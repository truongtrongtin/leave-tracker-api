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
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  async getAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async getAllDateOfBirths(): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('t');
    query.select(['id', 'firstName', 'lastName', 'dateOfBirth']);
    return query.execute();
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

  async create(signUpDto: SignUpDto): Promise<User> {
    const exists = await this.userRepository.count({ email: signUpDto.email });
    if (exists > 0) {
      throw new BadRequestException('email existed');
    }
    // const timezone = (
    //   await this.httpService.get(`http://ip-api.com/json/${ip}`).toPromise()
    // ).data.timezone;
    const password = await bcrypt.hash(signUpDto.password, 10);
    const user = new User({ ...signUpDto, password });
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

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    let password;
    if (updateUserDto.newPassword) {
      password = await bcrypt.hash(updateUserDto.newPassword, 10);
    }
    wrap(user).assign({ ...updateUserDto, ...(password && { password }) });
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
    const storage = new Storage({
      keyFilename: process.env.GOOGLE_STORAGE_KEY_PATH,
    });
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
