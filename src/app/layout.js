// layout.js
import { Inter } from 'next/font/google'; // Replace Geist with standard font
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: "Meal Snap",
    description: "Generate recipes from your fridge contents",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className={inter.className}>
        {children}
        </body>
        </html>
    );
}