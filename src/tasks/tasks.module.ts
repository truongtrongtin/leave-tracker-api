import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AuthModule } from 'auth/auth.module';
import { Task } from './task.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [MikroOrmModule.forFeature([Task]), AuthModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
