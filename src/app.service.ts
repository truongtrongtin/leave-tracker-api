import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `Read API document <a href="/api">here</>`;
  }
}
