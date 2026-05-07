import { MailerOptions } from "@nestjs-modules/mailer";

export const MailHogOptions : MailerOptions = {
    defaults: {
        from: '"No Reply" <noreply@mamabear.com>',
        to: "test@mailhog.local",
    },
    transport: {
        host: "localhost",
        port: 1025,
        secure: false
    },
}
