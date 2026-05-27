import { EmailProvider } from "./provider"
import { NodemailerProvider } from "./providers/nodemailer"

let activeProvider: EmailProvider | null = null

export const getEmailProvider = (): EmailProvider => {
  if (!activeProvider) {
    activeProvider = new NodemailerProvider()
  }
  return activeProvider
}

export const setEmailProvider = (provider: EmailProvider) => {
  activeProvider = provider
}

export interface ArticlePreview {
  title: string
  url: string
}

export const sendNewsEmail = async (to: string, articles: ArticlePreview[]) => {
  const subject = "Your Personalized News Update"

  if (articles.length === 0) {
    return true  // No emails to send is not a failure
  }

  let textBody =
    "Here are your latest news updates based on your subscriptions:\n\n"
  articles.forEach((article, index) => {
    textBody += `${index + 1}. ${article.title}\n   Read more: ${article.url}\n\n`
  })
  textBody += "\nThank you for reading!"

  return getEmailProvider().sendEmail(to, subject, textBody)
}

export * from "./provider"
