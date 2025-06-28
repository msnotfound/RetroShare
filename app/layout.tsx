import type { Metadata } from 'next'
import './globals.css'
import { Press_Start_2P } from "next/font/google";
import { IBM_Plex_Mono } from "next/font/google";

import "nes.css/css/nes.min.css";

const pixelFont = Press_Start_2P({
  weight: "400", 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pixel",
});

const monoFont = IBM_Plex_Mono({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: 'RetroShare',
  description: 'Retro themed instant file sharing service',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
    <head>
    <link rel="stylesheet" href="./node_modules/nes.css/css/nes.min.css"></link>
    </head>
      <body className={`${pixelFont.variable} ${monoFont.variable}`}>{children}</body>
    </html>
  )
}