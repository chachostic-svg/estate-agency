"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Building2 } from "lucide-react";

export function Navbar({ onOpenBooking }: { onOpenBooking?: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 py-3.5 shadow-lg shadow-black/5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-wider uppercase text-zinc-900 dark:text-white block leading-none">
              Vanguard
            </span>
            <span className="text-[10px] tracking-[0.28em] uppercase text-amber-600 dark:text-amber-400 font-semibold">
              Realty & AI
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <a
            href="#catalog"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Каталог объектов
          </a>
          <a
            href="#ai-advisor"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            ИИ-Консультант
          </a>
          <a
            href="#booking-section"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Запись на просмотр
          </a>
          <a
            href="#telegram"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Telegram-Бот
          </a>
          <Link
            href="/admin"
            className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors text-xs font-bold"
          >
            Админ-панель
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Эстетичный минималистичный переключатель темы без символов и стикеров */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative inline-flex items-center p-1 rounded-full bg-zinc-200/90 dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 text-[11px] font-semibold tracking-wide transition-all duration-300"
            >
              <span
                className={`px-3 py-1 rounded-full transition-all duration-300 ${
                  theme !== "dark"
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                Светлая
              </span>
              <span
                className={`px-3 py-1 rounded-full transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-zinc-500"
                }`}
              >
                Тёмная
              </span>
            </button>
          )}

          <a
            href="https://t.me/esate_agent_bot?start=booking"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-sky-500/20 transition-all"
          >
            Записаться через Telegram-бот
          </a>

          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-amber-500/25 transition-all"
            >
              Записаться на показ
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
