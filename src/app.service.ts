import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Cache } from 'cache-manager';
import { google } from 'googleapis';

@Injectable()
export class AppService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  getHello(): string {
    return `Read API document <a href="/doc">here</>`;
  }

  @Cron('0 0 0 * * *') // everyday
  async fetchAndCacheHolidays() {
    const googleCalendarJsonKey = Buffer.from(
      process.env.GOOGLE_CALENDAR_KEY_BASE64!,
      'base64',
    ).toString('ascii');
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(googleCalendarJsonKey),
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    const authClient = await auth.getClient();
    const calendar = google.calendar({
      version: 'v3',
      auth: authClient,
    });
    const holidayResponse = await calendar.events.list({
      calendarId: 'en.vietnamese#holiday@group.v.calendar.google.com',
      singleEvents: true,
      orderBy: 'startTime',
    });
    const holidays = holidayResponse.data.items;
    return this.cacheManager.set('holidays', holidays, { ttl: 86400 }); // 1 day
  }

  async getCachedHolidays() {
    const holidays = await this.cacheManager.get('holidays');
    if (!holidays) return this.fetchAndCacheHolidays();
    return holidays;
  }
}
