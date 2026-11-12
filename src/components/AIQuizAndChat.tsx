"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  ListChecks,
  MessageSquareText,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { Property } from "@/types/estate";

interface AIQuizAndChatProps {
  properties: Property[];
  onBookProperty: (property: Property) => void;
}

export function AIQuizAndChat({
  properties,
  onBookProperty,
}: AIQuizAndChatProps) {
  const [activeTab, setActiveTab] = useState<"quiz" | "chat">("quiz");

  // Состояние для ИИ-Квиза
  const [quizStep, setQuizStep] = useState(0);
  const [quizDistrict, setQuizDistrict] = useState("Любой престижный район");
  const [quizRooms, setQuizRooms] = useState("2 комнаты");
  const [quizBudget, setQuizBudget] = useState("До 35 млн ₽");
  const [quizDate, setQuizDate] = useState("2026-11-16");
  const [quizName, setQuizName] = useState("");
  const [quizPhone, setQuizPhone] = useState("");
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Состояние для ИИ-Чата (gemini-3.5-flash-lite)
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
      recommendedIds?: string[];
    }[]
  >([
    {
      role: "assistant",
      content:
        "Здравствуйте! Я ИИ-брокер Vanguard Realty на базе модели gemini-3.5-flash-lite. Я помогу подобрать квартиру по вашему бюджету, количеству комнат и району, отвечу на вопросы по ипотеке и запишу вас на удобный день просмотра. Какую недвижимость вы ищете?",
      recommendedIds: ["prop-1", "prop-2"],
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  // Подбор квартир по ответам квиза
  const quizMatchedProperties = React.useMemo(() => {
    return properties
      .filter((p) => {
        const matchDist =
          quizDistrict === "Любой престижный район" ||
          p.district.toLowerCase().includes(quizDistrict.toLowerCase());
        const matchRoom =
          quizRooms === "1 комната / студия"
            ? p.rooms === 1
            : quizRooms === "2 комнаты"
            ? p.rooms === 2
            : quizRooms === "3 комнаты"
            ? p.rooms === 3
            : p.rooms >= 3;
        return matchDist || matchRoom;
      })
      .slice(0, 2);
  }, [properties, quizDistrict, quizRooms]);

  const submitQuizLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizName || !quizPhone) return;

    const topProp = quizMatchedProperties[0] || properties[0];
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: quizName,
        phone: quizPhone,
        propertyId: topProp?.id,
        propertyTitle: topProp?.title || "Подбор по ИИ-Квизу",
        preferredDate: quizDate,
        preferredTime: "15:00",
        district: quizDistrict,
        rooms: quizRooms,
        budget: quizBudget,
        source: "ai_quiz",
        notes: `Квиз-подбор: район ${quizDistrict}, ${quizRooms}, бюджет ${quizBudget}`,
      }),
    });
    setQuizSubmitted(true);
  };

  const handleSendChat = async (customPrompt?: string) => {
    const text = (customPrompt ?? inputMsg).trim();
    if (!text) return;

    const updated = [...messages, { role: "user" as const, content: text }];
    setMessages(updated);
    setInputMsg("");
    setLoadingAI(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      setMessages([
        ...updated,
        {
          role: "assistant",
          content: data.reply,
          recommendedIds: data.recommendedPropertyIds || [],
        },
      ]);
    } catch {
      setMessages([
        ...updated,
        {
          role: "assistant",
          content:
            "Я подобрал для вас подходящие резиденции из нашей базы. Выберите удобный день для просмотра!",
          recommendedIds: ["prop-2", "prop-3"],
        },
      ]);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <section
      id="ai-advisor"
      className="py-24 bg-zinc-100/70 dark:bg-zinc-900/40 border-y border-zinc-200/70 dark:border-zinc-800/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            GEMINI-3.5-FLASH-LITE • ИИ-КВИЗ И КОНСУЛЬТАНТ
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white">
            Умный ИИ-помощник подберет квартиру за 1 минуту
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Пройдите интерактивный квиз из 4 шагов или пообщайтесь в свободном
            диалоге с ИИ-брокером: он учтет ваш бюджет, количество комнат и
            район, предложит конкретные лоты и запишет на просмотр.
          </p>

          {/* Переключатель режима: Квиз / Живой ИИ-чат */}
          <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm mt-4">
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "quiz"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <ListChecks className="w-4 h-4" />
              Интерактивный ИИ-Квиз (Пошагово)
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "chat"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              Диалог с ИИ-Брокером (Gemini 3.5)
            </button>
          </div>
        </motion.div>

        {activeTab === "quiz" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 shadow-2xl"
          >
            {quizSubmitted ? (
              <div className="text-center py-8 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  Персональная подборка сформирована и заявка отправлена!
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
                  Мы зафиксировали ваш показ на <b>{quizDate}</b> и продублировали
                  заявку в нашу рабочую Telegram-группу и Админ-панель.
                </p>
                <button
                  onClick={() => {
                    setQuizSubmitted(false);
                    setQuizStep(0);
                  }}
                  className="px-6 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold"
                >
                  Пройти квиз заново
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Прогресс-бар квиза */}
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <span>ШАГ {quizStep + 1} ИЗ 4</span>
                  <span className="text-amber-500">
                    {Math.round(((quizStep + 1) / 4) * 100)}% готово
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-300"
                    style={{ width: `${((quizStep + 1) / 4) * 100}%` }}
                  />
                </div>

                {quizStep === 0 && (
                  <div className="space-y-5">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                      1. Какой район города вам наиболее интересен?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Хамовники",
                        "Пресненский (Сити)",
                        "Хорошёво-Мнёвники",
                        "Замоскворечье",
                        "Раменки",
                        "Любой престижный район",
                      ].map((dist) => (
                        <button
                          key={dist}
                          onClick={() => {
                            setQuizDistrict(dist);
                            setQuizStep(1);
                          }}
                          className={`p-4 rounded-2xl border text-left font-semibold text-sm flex items-center justify-between transition-all ${
                            quizDistrict === dist
                              ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          <span>{dist}</span>
                          <ArrowRight className="w-4 h-4 text-amber-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quizStep === 1 && (
                  <div className="space-y-5">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                      2. Сколько комнат необходимо для комфортной жизни?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "1 комната / студия",
                        "2 комнаты",
                        "3 комнаты",
                        "4+ комнат / Пентхаус",
                      ].map((rm) => (
                        <button
                          key={rm}
                          onClick={() => {
                            setQuizRooms(rm);
                            setQuizStep(2);
                          }}
                          className={`p-4 rounded-2xl border text-left font-semibold text-sm flex items-center justify-between transition-all ${
                            quizRooms === rm
                              ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          <span>{rm}</span>
                          <ArrowRight className="w-4 h-4 text-amber-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quizStep === 2 && (
                  <div className="space-y-5">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                      3. В какой комфортный бюджет мы ориентируемся?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "До 20 млн ₽",
                        "20 – 35 млн ₽",
                        "35 – 50 млн ₽",
                        "От 50 млн ₽ (Prime Luxury)",
                      ].map((bdg) => (
                        <button
                          key={bdg}
                          onClick={() => {
                            setQuizBudget(bdg);
                            setQuizStep(3);
                          }}
                          className={`p-4 rounded-2xl border text-left font-semibold text-sm flex items-center justify-between transition-all ${
                            quizBudget === bdg
                              ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          <span>{bdg}</span>
                          <ArrowRight className="w-4 h-4 text-amber-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quizStep === 3 && (
                  <form onSubmit={submitQuizLead} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                        4. ИИ подобрал для вас лучшие лоты! Выберите день просмотра:
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {quizMatchedProperties.map((p) => (
                          <div
                            key={p.id}
                            className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-3"
                          >
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-16 h-16 rounded-xl object-cover shrink-0"
                            />
                            <div>
                              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                {p.district} • {(p.price / 1e6).toFixed(1)} млн ₽
                              </div>
                              <div className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                                {p.title}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {p.rooms} комн. • {p.area} м²
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Ваше имя *"
                        value={quizName}
                        onChange={(e) => setQuizName(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Ваш телефон *"
                        value={quizPhone}
                        onChange={(e) => setQuizPhone(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                      />
                      <input
                        type="date"
                        required
                        value={quizDate}
                        onChange={(e) => setQuizDate(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setQuizStep(0)}
                        className="text-xs text-zinc-500 hover:underline"
                      >
                        ← Изменить параметры
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25"
                      >
                        Получить подборку и записаться на показ
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          /* Живой ИИ-Ассистент (Чат на базе gemini-3.5-flash-lite) */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl"
          >
            <div className="p-4 sm:px-6 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-2">
                    Vanguard AI Консультант
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">
                      gemini-3.5-flash-lite
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    Отвечает по услугам, подбирает квартиры по бюджету и записывает на показ
                  </div>
                </div>
              </div>
            </div>

            <div className="h-96 overflow-y-auto p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-xl rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                      m.role === "user"
                        ? "bg-amber-500 text-white"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.recommendedIds && m.recommendedIds.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 w-full max-w-xl">
                      {m.recommendedIds.map((id) => {
                        const prop = properties.find((p) => p.id === id);
                        if (!prop) return null;
                        return (
                          <div
                            key={prop.id}
                            className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-sm"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-amber-500 truncate">
                                {prop.district} • {(prop.price / 1e6).toFixed(1)} млн ₽
                              </div>
                              <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                {prop.title}
                              </div>
                            </div>
                            <button
                              onClick={() => onBookProperty(prop)}
                              className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                              Запись
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              {loadingAI && (
                <div className="text-xs text-zinc-500 animate-pulse">
                  Vanguard AI анализирует каталог квартир...
                </div>
              )}
            </div>

            {/* Быстрые подсказки */}
            <div className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2">
              {[
                "Подобрать 2-комнатную до 35 млн ₽",
                "Квартира для семьи в Хамовниках или у воды",
                "Какие условия ипотеки и услуг агентства?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendChat(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-amber-500 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-3"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Напишите бюджет, район, кол-во комнат или вопрос по услугам..."
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={loadingAI}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Отправить
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  );
}
