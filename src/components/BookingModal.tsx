"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Building2,
  MessageSquare,
} from "lucide-react";
import { Property } from "@/types/estate";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProperty: Property | null;
  properties: Property[];
}

export function BookingModal({
  isOpen,
  onClose,
  selectedProperty,
  properties,
}: BookingModalProps) {
  const [propertyId, setPropertyId] = useState<string>(
    selectedProperty?.id || properties[0]?.id || ""
  );
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [preferredDate, setPreferredDate] = useState("2026-11-15");
  const [preferredTime, setPreferredTime] = useState("14:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (selectedProperty) {
      setPropertyId(selectedProperty.id);
    }
  }, [selectedProperty]);

  const activeProp =
    properties.find((p) => p.id === propertyId) || selectedProperty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !phone) return;

    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          phone,
          telegramUsername,
          propertyId: activeProp?.id,
          propertyTitle: activeProp?.title || "Индивидуальный показ",
          preferredDate,
          preferredTime,
          district: activeProp?.district,
          budget: activeProp
            ? `${(activeProp.price / 1_000_000).toFixed(1)} млн ₽`
            : undefined,
          rooms: activeProp ? `${activeProp.rooms} комн.` : undefined,
          source: "website_booking",
          notes,
        }),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setClientName("");
    setPhone("");
    setNotes("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-2xl"
          >
            <button
              onClick={resetAndClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  Запись на просмотр подтверждена!
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
                  Ваша заявка на просмотр объекта{" "}
                  <b>«{activeProp?.title || "Выбранная резиденция"}»</b> на дату{" "}
                  <b>
                    {preferredDate} в {preferredTime}
                  </b>{" "}
                  передана в Админ-панель и отправлена брокерам в Telegram-группу.
                </p>
                <button
                  onClick={resetAndClose}
                  className="mt-4 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm"
                >
                  Отлично, жду звонка
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                    ПРИВАТНЫЙ ПОКАЗ VANGUARD REALTY
                  </span>
                  <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">
                    Запись на просмотр квартиры
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Выберите объект недвижимости
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                    <select
                      value={propertyId}
                      onChange={(e) => setPropertyId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.district} — {(p.price / 1e6).toFixed(1)} млн ₽)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Ваше имя *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Иван Романов"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Телефон для связи *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="+7 (999) 000-00-00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      День просмотра *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                      <input
                        type="date"
                        required
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Удобное время
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                      <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white"
                      >
                        <option value="11:00">11:00 (Утро)</option>
                        <option value="14:00">14:00 (День)</option>
                        <option value="16:30">16:30 (День)</option>
                        <option value="19:00">19:00 (Вечерний показ)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Ваш Telegram и пожелания (необязательно)
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="@username или комментарий к просмотру"
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        if (e.target.value.startsWith("@")) {
                          setTelegramUsername(e.target.value.split(" ")[0]);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-xl shadow-amber-500/25 transition-all"
                >
                  {submitting
                    ? "Отправка заявки в систему и Telegram..."
                    : "Подтвердить запись на просмотр"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
