"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, CheckCircle2 } from "lucide-react";
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

  // Состояния для большой формы записи на странице
  const [mainPropertyId, setMainPropertyId] = useState("");
  const [mainName, setMainName] = useState("");
  const [mainPhone, setMainPhone] = useState("");
  const [mainDate, setMainDate] = useState("2026-11-16");
  const [mainTime, setMainTime] = useState("14:00");
  const [mainFormat, setMainFormat] = useState("Для большой семьи с детьми");
  const [mainComment, setMainComment] = useState("");
  const [mainNotice, setMainNotice] = useState("");

  useEffect(() => {
    // Инициализация Telegram Mini App (если открыто внутри Telegram)
    const tg = (window as unknown as { Telegram?: { WebApp?: { ready: () => void; expand: () => void; initDataUnsafe?: { user?: { first_name?: string; username?: string } } } } }).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.initDataUnsafe?.user?.first_name) {
        setMainName(tg.initDataUnsafe.user.first_name);
      }
    }

    fetch("/api/properties")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.properties) && d.properties.length > 0) {
          setProperties(d.properties);
          setMainPropertyId(d.properties[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const handleOpenBookingForProperty = (prop?: Property) => {
    setSelectedProperty(prop || properties[0] || null);
    setBookingModalOpen(true);
  };

  const handleSubmitMainBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainName || !mainPhone) return;

    const chosenProp =
      properties.find((p) => p.id === mainPropertyId) || properties[0];

    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: mainName,
        phone: mainPhone,
        propertyId: chosenProp?.id,
        propertyTitle: chosenProp?.title || "Выбранная квартира",
        preferredDate: mainDate,
        preferredTime: mainTime,
        district: chosenProp?.district,
        source: "website_booking",
        notes: `${mainFormat}${mainComment ? " | " + mainComment : ""}`,
      }),
    });

    // Сразу очищаем заполненные поля формы
    setMainName("");
    setMainPhone("");
    setMainComment("");

    // Показываем уведомление и скрываем ровно через 15 секунд
    setMainNotice(
      "Заявка успешно отправлена! Брокер свяжется с вами для подтверждения показа (это уведомление скроется через 15 секунд)."
    );
    setTimeout(() => {
      setMainNotice("");
    }, 15000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenBooking={() => handleOpenBookingForProperty()} />

      <main className="flex-1">
        <HeroParallax onOpenBooking={() => handleOpenBookingForProperty()} />

        <PropertyCatalog
          properties={properties}
          onSelectPropertyForBooking={(prop) =>
            handleOpenBookingForProperty(prop)
          }
        />

        <AIQuizAndChat
          properties={properties}
          onBookProperty={(prop) => handleOpenBookingForProperty(prop)}
        />

        {/* БОЛЬШАЯ СЕКЦИЯ ЗАПИСИ КЛИЕНТОВ НА ПРОСМОТР */}
        <section id="booking-section" className="py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 sm:p-14 shadow-2xl space-y-8"
            >
              <div className="max-w-2xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-500">
                  ПЕРСОНАЛЬНЫЙ ПОКАЗ НЕДВИЖИМОСТИ
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight">
                  Запись на просмотр выбранной квартиры
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-400">
                  Укажите ваши контактные данные, выберите интересующий объект
                  недвижимости и удобный день для визита.
                </p>
              </div>

              <form onSubmit={handleSubmitMainBooking} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                    Выберите объект недвижимости для просмотра *
                  </label>
                  <select
                    value={mainPropertyId}
                    onChange={(e) => setMainPropertyId(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base font-medium focus:outline-none focus:border-amber-500"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.district}, {p.rooms} комн. —{" "}
                        {(p.price / 1e6).toFixed(1)} млн ₽)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      Ваше ФИО или Имя *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Например: Александр Романов"
                      value={mainName}
                      onChange={(e) => setMainName(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      Контактный телефон *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+7 (999) 000-00-00"
                      value={mainPhone}
                      onChange={(e) => setMainPhone(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      В какой день удобно посмотреть *
                    </label>
                    <input
                      type="date"
                      required
                      value={mainDate}
                      onChange={(e) => setMainDate(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      Удобное время показа
                    </label>
                    <select
                      value={mainTime}
                      onChange={(e) => setMainTime(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base focus:outline-none focus:border-amber-500"
                    >
                      <option value="11:00">11:00 (Утренний показ)</option>
                      <option value="14:00">14:00 (Дневной показ)</option>
                      <option value="16:30">16:30 (Дневной показ)</option>
                      <option value="19:00">19:00 (Вечерний показ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      Формат покупки / Семья
                    </label>
                    <select
                      value={mainFormat}
                      onChange={(e) => setMainFormat(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base focus:outline-none focus:border-amber-500"
                    >
                      <option value="Для большой семьи с детьми">
                        Для большой семьи с детьми
                      </option>
                      <option value="Для собственного проживания">
                        Для собственного проживания
                      </option>
                      <option value="Семейная ипотека">
                        Покупка по семейной ипотеке
                      </option>
                      <option value="Инвестиции">Инвестиции</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                    Дополнительные пожелания к просмотру (необязательно)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Укажите ваш @username в Telegram, желаемый бюджет или вопросы по квартире..."
                    value={mainComment}
                    onChange={(e) => setMainComment(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex-1 py-5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-base shadow-xl shadow-amber-500/25 transition-all"
                  >
                    Оставить заявку на просмотр квартиры
                  </button>
                  <a
                    href="https://t.me/esate_agent_bot?start=booking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-5 px-8 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-base text-center shadow-xl shadow-sky-500/20 transition-all"
                  >
                    Записаться через Telegram-бот
                  </a>
                </div>

                {mainNotice && (
                  <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-sm font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {mainNotice}
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        </section>

        {/* СЕКЦИЯ TELEGRAM БОТА ДЛЯ КЛИЕНТОВ */}
        <section id="telegram" className="pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white p-8 sm:p-14 border border-zinc-800 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10"
            >
              <div className="space-y-4 max-w-2xl">
                <span className="px-3.5 py-1.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider">
                  TELEGRAM АВТОМАТИЗАЦИЯ VANGUARD REALTY
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold">
                  Удобнее общаться в мессенджере? Запишитесь через наш Telegram-бот
                </h2>
                <p className="text-base text-zinc-300 leading-relaxed">
                  Наш официальный Telegram-бот покажет актуальные квартиры,
                  поможет выбрать день и время просмотра в 2 клика и сразу
                  передаст вашу заявку персональному брокеру агентства.
                </p>
              </div>
              <div className="shrink-0">
                <a
                  href="https://t.me/esate_agent_bot?start=booking"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-9 py-5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-base shadow-2xl shadow-sky-500/30 transition-all transform hover:-translate-y-0.5"
                >
                  Записаться через Telegram-бот →
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200">
            <Building2 className="w-4 h-4 text-amber-500" />
            VANGUARD REALTY • AI REAL ESTATE & TELEGRAM MINI APP
          </div>
          <div>
            © 2026 Vanguard Realty. Powered by Gemini 3.5 Flash Lite & Neon Postgres.
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
