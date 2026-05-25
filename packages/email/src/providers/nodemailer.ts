import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import { EmailProvider } from "../provider"

export class NodemailerProvider implements EmailProvider {
  private transporter: Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "1025", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    })
  }

  async sendEmail(
    to: string,
    subject: string,
    textBody: string
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"News Digest" <noreply@news.com>',
        to,
        subject,
        text: textBody,
      })
      return true
    } catch (error) {
      console.error("Failed to send email via Nodemailer:", error)
      return false
    }
  }
}
