import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { Leave } from './leave.entity';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

@Module({
  imports: [MikroOrmModule.forFeature([Leave]), AuthModule],
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule {}
