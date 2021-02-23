import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Leave } from './leave.entity';
import { AuthModule } from 'src/auth/auth.module';
import { CaslModule } from 'src/casl/casl.module';

@Module({
  imports: [MikroOrmModule.forFeature([Leave]), AuthModule, CaslModule],
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule {}
