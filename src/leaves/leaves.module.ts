import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Leave } from './leave.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [MikroOrmModule.forFeature([Leave]), AuthModule],
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule {}
