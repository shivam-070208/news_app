export interface EmailProvider {
  sendEmail(to: string, subject: string, textBody: string): Promise<{ success: true } | { success: false; error: string }>
}
