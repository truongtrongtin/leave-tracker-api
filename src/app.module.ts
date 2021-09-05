import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { LeavesModule } from './leaves/leaves.module';
import { MailModule } from './mail/mail.module';
import { TasksModule } from './tasks/tasks.module';
import * as fsStore from 'cache-manager-fs-hash';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    CacheModule.register({
      store: fsStore,
      path: 'cache',
    }),
    MikroOrmModule.forRoot(),
    ScheduleModule.forRoot(),
    EventsModule,
    TasksModule,
    AuthModule,
    MailModule,
    LeavesModule,
  ],
})
export class AppModule {}
