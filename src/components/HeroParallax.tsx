"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sparkles,
  ArrowUpRight,
  Calendar,
  MapPin,
  ShieldCheck,
  Bot,
} from "lucide-react";

export function HeroParallax({
  onOpenBooking,
}: {
  onOpenBooking: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Параллакс-смещения слоев при скролле
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const cardFloatingY = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);

  return (
    <section
      ref={ref}
      className="relative min-h-[94vh] flex items-center overflow-hidden pt-28 pb-20"
    >
      {/* Параллакс-фон */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 -z-10 pointer-events-none"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-30 scale-110 transition-opacity duration-500"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=85')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/90 via-stone-50/75 to-stone-50 dark:from-zinc-950/90 dark:via-zinc-950/75 dark:to-zinc-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Левая колонка */}
          <motion.div
            style={{ opacity: textOpacity }}
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              ИИ-АВТОМАТИЗАЦИЯ НЕДВИЖИМОСТИ • GEMINI 3.5 FLASH LITE
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] text-zinc-900 dark:text-white">
              Интеллектуальный подбор резиденций{" "}
              <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 bg-clip-text text-transparent">
                Vanguard Realty
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
              Первая цифровая экосистема элитной и бизнес-недвижимости: умный
              ИИ-брокер подберет квартиру по вашему бюджету, количеству комнат и
              району за 30 секунд, а система онлайн-бронирования и Telegram-бот
              запишут вас на приватный показ в удобный день.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#ai-advisor"
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Bot className="w-5 h-5" />
                Подобрать с ИИ-помощником
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <button
                onClick={onOpenBooking}
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 font-semibold transition-all"
              >
                <Calendar className="w-5 h-5 text-amber-500" />
                Выбрать день просмотра
              </button>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  140+
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Эксклюзивных лотов в базе
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                  24/7
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  ИИ-консультант и ТГ-бот
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  0%
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Комиссия при покупке новостроек
                </div>
              </div>
            </div>
          </motion.div>

          {/* Правая колонка с параллакс-карточкой */}
          <motion.div
            style={{ y: cardFloatingY }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.15 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=85"
                alt="Vanguard Knightsbridge Penthouse"
                className="w-full h-80 object-cover"
              />
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    Флагманский лот недели
                  </span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    68.5 млн ₽
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Пентхаус с террасой в ЖК «Vanguard Knightsbridge»
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  Хамовники • ул. Ефремова, д. 19 • 4 комн. • 164 м²
                </p>
              </div>
            </div>

            {/* Плавающий бейдж ИИ */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mt-4 sm:mt-0 sm:absolute -bottom-6 -left-6 p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">
                    Мгновенная синхронизация
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Заявки с сайта и ТГ-бота сразу поступают в Админку и группу
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
