"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  ShieldCheck,
  Sparkles,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { HeroParallax } from "@/components/HeroParallax";
import { PropertyCatalog } from "@/components/PropertyCatalog";
import { AIQuizAndChat } from "@/components/AIQuizAndChat";
import { BookingModal } from "@/components/BookingModal";
import { Property } from "@/types/estate";

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [simulatingBot, setSimulatingBot] = useState(false);
  const [botSimSuccess, setBotSimSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.properties)) {
          setProperties(d.properties);
        }
      })
      .catch(console.error);
  }, []);

  const handleOpenBookingForProperty = (prop?: Property) => {
    setSelectedProperty(prop || properties[0] || null);
    setBookingModalOpen(true);
  };

  const handleSimulateTelegramBotBooking = async () => {
    setSimulatingBot(true);
    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulateBotBooking: true,
          clientName: "Артем Волков (через Telegram-бот)",
          phone: "+7 (925) 991-04-77",
          telegramUsername: "@artem_volkov_estate",
          propertyId: properties[0]?.id || "prop-1",
          propertyTitle:
            properties[0]?.title ||
            "Пентхаус с террасой в ЖК «Vanguard Knightsbridge»",
          preferredDate: "2026-11-19",
          preferredTime: "16:00",
        }),
      });
      setBotSimSuccess(true);
    } finally {
      setSimulatingBot(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenBooking={() => handleOpenBookingForProperty()} />

      <main className="flex-1">
        {/* Главный экран с параллаксом при скролле */}
        <HeroParallax onOpenBooking={() => handleOpenBookingForProperty()} />

        {/* Секция каталога квартир с фильтрацией и записью на конкретный день */}
        <PropertyCatalog
          properties={properties}
          onSelectPropertyForBooking={(prop) =>
            handleOpenBookingForProperty(prop)
          }
        />

        {/* Умный ИИ-помощник (gemini-3.5-flash-lite) + Квиз */}
        <AIQuizAndChat
          properties={properties}
          onBookProperty={(prop) => handleOpenBookingForProperty(prop)}
        />

        {/* Секция преимуществ и автоматизации услуг */}
        <section id="services" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto space-y-3"
            >
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-500">
                ЭКОСИСТЕМА АВТОМАТИЗАЦИИ БИЗНЕСА
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white">
                Как работает автоматизация Vanguard Realty
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Sparkles,
                  title: "ИИ-Брокер Gemini 3.5 Flash Lite",
                  desc: "Консультирует клиентов 24/7 по услугам, ипотеке и юридической чистоте, подбирает лоты по бюджету, комнатам и району и мягко переводит в заявку.",
                },
                {
                  icon: Calendar,
                  title: "Онлайн-запись на день просмотра",
                  desc: "Клиент выбирает конкретную квартиру, указывает удобный день и время показа. Заявка мгновенно фиксируется в CRM/Админке сайта.",
                },
                {
                  icon: Send,
                  title: "Двусторонняя связка с Telegram",
                  desc: "Все заявки с сайта дублируются в рабочую Telegram-группу агентства, а Telegram-бот принимает заявки клиентов и передает их на сайт.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.12 }}
                  className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Секция Telegram-бота и синхронизации с Админкой */}
        <section id="telegram" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white p-8 sm:p-12 border border-zinc-800 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold">
                  <Send className="w-3.5 h-3.5" />
                  TELEGRAM BOT + УВЕДОМЛЕНИЯ В ГРУППУ
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold">
                  Запись клиентов через Telegram-бота с передачей в Админку
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Клиенты могут записаться на просмотр как на сайте, так и в
                  Telegram-боте. Бот проводит клиента по воронке (выбор квартиры
                  → выбор дня просмотра → контакт), сохраняет заявку в единую
                  Админ-панель сайта и отправляет уведомление в вашу рабочую
                  Telegram-группу.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={handleSimulateTelegramBotBooking}
                    disabled={simulatingBot}
                    className="px-6 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    {simulatingBot
                      ? "Отправка из ТГ-бота..."
                      : "Протестировать заявку из Telegram-бота"}
                  </button>

                  <Link
                    href="/admin"
                    className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center gap-2 border border-white/15 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Открыть Админ-панель
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                {botSimSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Тестовая заявка из Telegram-бота успешно записана в Админ-панель и отправлена в группу!
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 space-y-3 text-xs font-mono text-zinc-300">
                <div className="text-amber-400 font-bold">
                  🏛 VANGUARD REALTY — TELEGRAM УВЕДОМЛЕНИЕ
                </div>
                <div>👤 Клиент: Артем Волков (@artem_volkov_estate)</div>
                <div>📞 Телефон: +7 (925) 991-04-77</div>
                <div>
                  📍 Объект: Пентхаус в ЖК «Vanguard Knightsbridge»
                </div>
                <div>📅 День просмотра: 2026-11-19 в 16:00</div>
                <div className="text-sky-400">
                  📡 Источник: ✈️ Telegram-Бот → Синхронизировано с /admin
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Подвал */}
      <footer className="py-10 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200">
            <Building2 className="w-4 h-4 text-amber-500" />
            VANGUARD REALTY • AI REAL ESTATE AUTOMATION
          </div>
          <div>
            © 2026 Vanguard Realty. Умный подбор на базе Gemini 3.5 Flash Lite и Telegram Bot API.
          </div>
        </div>
      </footer>

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedProperty={selectedProperty}
        properties={properties}
      />
    </div>
  );
}
