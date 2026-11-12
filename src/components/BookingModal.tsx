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
  const [preferredDate, setPreferredDate] = useState("2026-11-16");
  const [preferredTime, setPreferredTime] = useState("14:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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

      // Сразу очищаем заполненные поля
      setClientName("");
      setPhone("");
      setTelegramUsername("");
      setNotes("");

      setSuccessMsg(
        "Заявка успешно отправлена! Уведомление скроется через 15 секунд."
      );
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 15000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                  ПРИВАТНЫЙ ПОКАЗ VANGUARD REALTY
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
                  Запись на просмотр недвижимости
                </h3>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Выберите объект недвижимости
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-amber-500 absolute left-4 top-4" />
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base text-zinc-900 dark:text-white"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.district}, {p.rooms} комн. —{" "}
                        {(p.price / 1e6).toFixed(1)} млн ₽)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Ваше имя *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-4 top-4" />
                    <input
                      type="text"
                      required
                      placeholder="Иван Романов"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Телефон для связи *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-4 top-4" />
                    <input
                      type="tel"
                      required
                      placeholder="+7 (999) 000-00-00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    День просмотра *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-amber-500 absolute left-4 top-4" />
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Удобное время
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-amber-500 absolute left-4 top-4" />
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base text-zinc-900 dark:text-white"
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
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Пожелания к просмотру (необязательно)
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-zinc-400 absolute left-4 top-4" />
                  <input
                    type="text"
                    placeholder="Например: просмотр всей семьей, нужна парковка"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-base text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-base shadow-xl shadow-amber-500/25 transition-all"
              >
                {submitting
                  ? "Отправка заявки..."
                  : "Подтвердить запись на просмотр"}
              </button>

              {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-sm font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  {successMsg}
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
