import './globals.css';
import { Bricolage_Grotesque } from 'next/font/google';
const font = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'OutbidIndia — Pay more. Rank higher. Get seen.',
  description: 'A public leaderboard where rank is decided only by the total amount paid, in rupees.'
};
export default function RootLayout({ children }) {
  return (<html lang="en" className={font.variable}><body>{children}</body></html>);
}
