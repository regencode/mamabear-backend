import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailService: MailerService) {}

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.BACKEND_URL}/auth/verify-email/${token}`;
    await this.mailService.sendMail({
      to: email,
      subject: 'Please verify your email',
      text: `Verify your email here ${verifyUrl}`,
    });
  }
}
