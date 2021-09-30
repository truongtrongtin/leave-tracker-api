import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Cache } from 'cache-manager';
import { google } from 'googleapis';

@Injectable()
export class AppService {
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  getHello(): string {
    return `Read API document <a href="/doc">here</>`;
  }

  @Cron('0 0 0 * * *') // everyday
  async fetchAndCacheHolidays() {
    const auth = new google.auth.GoogleAuth({
      keyFilename: this.configService.get<string>('GOOGLE_CALENDAR_KEY_PATH'),
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const holidayResponse = await calendar.events.list({
      calendarId: 'en.vietnamese#holiday@group.v.calendar.google.com',
      singleEvents: true,
      orderBy: 'startTime',
    });
    const holidays = holidayResponse.data.items;
    await this.cacheManager.set('holidays', holidays, { ttl: 86400 }); // 1 day
    return holidays;
  }

  async getCachedHolidays() {
    const holidays = await this.cacheManager.get('holidays');
    if (!holidays) return this.fetchAndCacheHolidays();
    return holidays;
  }
}
