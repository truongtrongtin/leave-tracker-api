import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { Leave } from './leave.entity';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { User } from 'src/users/user.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Leave, User]), AuthModule, UsersModule],
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule {}
