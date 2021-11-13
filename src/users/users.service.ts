import { Storage } from '@google-cloud/storage';
import { wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MultipartFile } from 'fastify-multipart';
// import * as stream from 'stream';
// import * as util from 'util';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly configService: ConfigService,
  ) {}

  getAll(): Promise<User[]> {
    return this.userRepository.findAll({
      filters: ['isActive'],
    });
  }

  async getAllDateOfBirths(): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('t');
    query.select(['id', 'firstName', 'lastName', 'dateOfBirth']);
    return query.execute();
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException(`user_not_found`);
    }
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`user_not_found`);
    }
    return user;
  }

  async getAuthenticated(email: string, password: string): Promise<User> {
    const user = await this.findByEmail(email);
    const isRightPassword = await bcrypt.compare(password, user.password);
    if (!isRightPassword) {
      throw new BadRequestException('password_mismatch');
    }
    return user;
  }

  async create(signUpDto: SignUpDto): Promise<User> {
    const exists = await this.userRepository.count({ email: signUpDto.email });
    if (exists > 0) {
      throw new BadRequestException('user_email_existed');
    }
    // const timezone = (
    //   await this.httpService.get(`http://ip-api.com/json/${ip}`).toPromise()
    // ).data.timezone;
    const password = await bcrypt.hash(signUpDto.password, 10);
    const user = new User({ ...signUpDto, password });
    await this.userRepository.persistAndFlush(user);
    return user;
  }

  async saveRefreshToken(refreshToken: string, id: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const query = this.userRepository.createQueryBuilder('t');
    query.update({ hashedRefreshToken }).where({ id });
    await query.getResultList();
  }

  async removeRefreshToken(id: string) {
    const query = this.userRepository.createQueryBuilder('t');
    query.update({ hashedRefreshToken: null }).where({ id });
    await query.getResultList();
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    wrap(user).assign(updateUserDto);
    this.userRepository.flush();
    return user;
  }

  async updatePassword(email: string, updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword } = updatePasswordDto;
    const user = await this.getAuthenticated(email, currentPassword);
    const password = await bcrypt.hash(newPassword, 10);
    user.password = password;
    await this.userRepository.flush();
    return user;
  }

  async resetPassword(id: string, newPassword: string) {
    const user = await this.findById(id);
    const password = await bcrypt.hash(newPassword, 10);
    user.password = password;
    await this.userRepository.flush();
    return user;
  }

  async deleteOneById(id: string): Promise<void> {
    // hard delete
    // const user = await this.userRepository.findOneOrFail(id, ['leaves']);
    // this.userRepository.removeAndFlush(user);

    //soft delete
    const user = await this.userRepository.findOneOrFail(id);
    user.deletedAt = new Date();
    this.userRepository.flush();
  }

  async restore(id: string): Promise<User> {
    const user = await this.userRepository.findOneOrFail(id);
    user.deletedAt = undefined;
    this.userRepository.flush();
    return user;
  }

  async updateAvatar(fileData: MultipartFile, userId: string): Promise<User> {
    const storage = new Storage({
      keyFilename: this.configService.get('GOOGLE_STORAGE_KEY_PATH'),
    });
    const bucket = storage.bucket(this.configService.get('BUCKET_NAME'));
    const user = await this.userRepository.findOneOrFail(userId);

    // save to local disk
    // const fileStream = fileData.file;
    // const pipeline = util.promisify(stream.pipeline);
    // await pipeline(fileStream, fs.createWriteStream(`uploads/${fileName}`));

    // stream upload
    // const fileStream = fileData.file;
    // const fileName = fileData.filename;
    // const pipeline = util.promisify(stream.pipeline);
    // await pipeline(
    //   fileStream,
    //   bucket.file(`hehe/${fileName}`).createWriteStream(),
    // );

    // accumulate the file in memory! Be careful!
    const fileName = fileData.filename;
    const buffer = await fileData.toBuffer();
    const objectName = `${crypto.randomUUID()}/${fileName}`;
    await bucket.file(objectName).save(buffer, {
      gzip: true,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });

    // delete old avatar
    if (user.avatar) {
      const fileName = user.avatar.split(`${bucket.name}/`).pop();
      await bucket.file(fileName).delete();
    }

    user.avatar = `https://storage.googleapis.com/${bucket.name}/${objectName}`;
    await this.userRepository.flush();
    return user;
  }
}
