export interface EmailProvider {
  sendEmail(to: string, subject: string, textBody: string): Promise<boolean>
}
