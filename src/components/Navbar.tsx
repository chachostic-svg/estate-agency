"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Building2,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  Send,
  CalendarCheck,
} from "lucide-react";

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

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <a
            href="#catalog"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Каталог объектов
          </a>
          <a
            href="#ai-advisor"
            className="flex items-center gap-1.5 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            ИИ-Подбор и Квиз
          </a>
          <a
            href="#services"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Услуги и Автоматизация
          </a>
          <a
            href="#telegram"
            className="flex items-center gap-1.5 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-sky-500" />
            Telegram-Бот
          </a>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-colors text-xs font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            Админ-панель
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Переключить тему"
              className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-amber-500/60 transition-all"
              title={
                theme === "dark"
                  ? "Включить светлую тему (Architectural Ivory)"
                  : "Включить тёмную тему (Luxury Onyx)"
              }
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700" />
              )}
            </button>
          )}

          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold shadow-lg shadow-amber-500/25 transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              Записаться на показ
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
