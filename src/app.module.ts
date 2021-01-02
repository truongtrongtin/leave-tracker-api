import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [MikroOrmModule.forRoot(), TasksModule, AuthModule, MailModule],
})
export class AppModule {}
