import { Module } from '@nestjs/common';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        // https://nodemailer.com/smtp/well-known
        ...(process.env.NODE_ENV === 'production'
          ? {
              service: 'Gmail',
              auth: {
                user: process.env.GMAIL,
                pass: process.env.GMAIL_PASSWORD,
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
  ],
  controllers: [],
  providers: [],
})
export class MailModule {}
