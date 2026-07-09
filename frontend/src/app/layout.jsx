import { AuthProvider } from '@/lib/AuthContext'
import { Lora, DM_Sans } from 'next/font/google'
import './globals.css'

export const metadata = {
  title: 'DeutschLesen — Learn German Through Stories',
  description: 'Read daily German stories from A1 to C1. Click any word to learn.',
}
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-display'
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body'
})

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className={`${lora.variable} ${dmSans.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
