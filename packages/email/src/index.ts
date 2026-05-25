import { EmailProvider } from "./provider"
import { NodemailerProvider } from "./providers/nodemailer"

// Initialize the active provider
const activeProvider: EmailProvider = new NodemailerProvider()

export interface ArticlePreview {
  title: string
  url: string
}

export const sendNewsEmail = async (to: string, articles: ArticlePreview[]) => {
  const subject = "Your Personalized News Update"

  if (articles.length === 0) {
    return false
  }

  let textBody =
    "Here are your latest news updates based on your subscriptions:\n\n"
  articles.forEach((article, index) => {
    textBody += `${index + 1}. ${article.title}\n   Read more: ${article.url}\n\n`
  })
  textBody += "\nThank you for reading!"

  return activeProvider.sendEmail(to, subject, textBody)
}

export * from "./provider"
