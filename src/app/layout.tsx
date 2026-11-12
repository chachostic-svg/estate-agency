import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";

export const metadata: Metadata = {
  title: "Vanguard Realty — Автоматизированное агентство недвижимости с ИИ",
  description:
    "Премиальный подбор недвижимости с ИИ-консультантом на базе Gemini 3.5 Flash Lite, онлайн-записью на просмотр и Telegram Mini App.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-stone-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased selection:bg-amber-500 selection:text-white transition-colors duration-300">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
