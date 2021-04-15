import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('content-type', 'text/html')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('holidays')
  getHolidays() {
    return this.appService.getCachedHolidays();
  }
}
