import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Cache } from 'cache-manager';
import { calendar_v3, google } from 'googleapis';

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  getHello(): string {
    return `Read API document <a href="/doc">here</>`;
  }

  @Cron('0 0 0 * * *') // everyday
  async fetchHolidays() {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    const authClient = await auth.getClient();
    const calendar = google.calendar({
      auth: authClient,
    } as calendar_v3.Options);
    const holidayResponse = await calendar.events.list({
      calendarId: 'en.vietnamese#holiday@group.v.calendar.google.com',
      singleEvents: true,
      orderBy: 'startTime',
    });
    const holidays = holidayResponse.data.items;
    await this.cacheManager.set('holidays', holidays, 86400); // 1 day
    return holidays;
  }

  // async getGoogleAccessTokenNoLib(keyFilename: string) {
  //   const fileJson = fs.readFileSync(keyFilename, 'utf8');
  //   const fileData = JSON.parse(fileJson);
  //   console.log('fileData', fileData);
  //   const jwt = this.jwtService.sign(
  //     { scope: 'https://www.googleapis.com/auth/calendar.readonly' },
  //     {
  //       algorithm: 'RS256',
  //       issuer: fileData.client_email,
  //       audience: fileData.token_uri,
  //       expiresIn: '1h',
  //       privateKey: fileData.private_key,
  //     },
  //   );
  //   console.log('jwt', jwt);
  //   const { data } = await lastValueFrom(
  //     this.httpService.post('https://oauth2.googleapis.com/token', {
  //       grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  //       assertion: jwt,
  //     }),
  //   );
  //   return data.access_token;
  // }

  // async fetchHolidaysNoLib() {
  //   const accessToken = await this.getGoogleAccessToken(
  //     this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS'),
  //   );
  //   const calendarId = encodeURIComponent(
  //     'en.vietnamese#holiday@group.v.calendar.google.com',
  //   );
  //   const { data: publicHoliday } = await lastValueFrom(
  //     this.httpService.get(
  //       `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
  //       { headers: { Authorization: `Bearer ${accessToken}` } },
  //     ),
  //   );
  //   return publicHoliday.items;
  // }

  async getCachedHolidays() {
    const holidays = await this.cacheManager.get('holidays');
    if (!holidays) return this.fetchHolidays();
    return holidays;
  }
}
