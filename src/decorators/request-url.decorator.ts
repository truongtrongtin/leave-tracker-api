import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestUrl = createParamDecorator(
  (data, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return `${request.protocol}://${request.hostname}${request.url}`;
  },
);
