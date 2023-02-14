import { ApiProperty } from '@nestjs/swagger';
import { Multipart } from '@fastify/multipart';

export class UpdateAvatarDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: Multipart;
}
