import { ApiProperty } from '@nestjs/swagger';
import { Multipart } from 'fastify-multipart';

export class AvatarUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: Multipart;
}
