import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LeavesModule } from './leaves/leaves.module';
import { MailModule } from './mail/mail.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    MikroOrmModule.forRoot(),
    TasksModule,
    AuthModule,
    MailModule,
    LeavesModule,
  ],
})
export class AppModule {}
