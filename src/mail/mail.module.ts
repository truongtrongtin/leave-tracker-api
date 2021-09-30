import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../configs/env.validate';

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
            : { port: 1025 }), // mailhog
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
