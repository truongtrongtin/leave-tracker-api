import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from 'src/configs/env.validate';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        transport: {
          // https://nodemailer.com/smtp/well-known
          ...(configService.get<string>('NODE_ENV') === Environment.Production
            ? {
                service: 'Gmail',
                auth: {
                  user: configService.get('GMAIL'),
                  pass: configService.get('GMAIL_PASSWORD'),
                },
              }
            : { host: 'mailhog', port: 1025 }),
        },
        defaults: {
          from: 'Tin Truong <noreply@example.com>',
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class MailModule {}
