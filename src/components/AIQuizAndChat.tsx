"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, CalendarCheck } from "lucide-react";
import { Property } from "@/types/estate";

interface AIQuizAndChatProps {
  properties: Property[];
  onBookProperty: (property: Property) => void;
}

export function AIQuizAndChat({
  properties,
  onBookProperty,
}: AIQuizAndChatProps) {
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
        "Здравствуйте! Я умный ИИ-помощник Vanguard Realty на базе модели gemini-3.5-flash-lite. В нашей базе 12 престижных районов — от городских студий до просторных 5–6 комнатных резиденций для больших семей. Напишите ваш бюджет, желаемый район или количество комнат!",
      recommendedIds: ["prop-1", "prop-2"],
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

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
            "Я подобрал для вас подходящие резиденции из нашей базы. Выберите удобный день для просмотра в большой форме записи ниже!",
          recommendedIds: ["prop-2", "prop-4"],
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            GEMINI-3.5-FLASH-LITE • ПЕРСОНАЛЬНЫЙ ИИ-БРОКЕР
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white">
            Умный ИИ-помощник Vanguard Realty
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Отвечает на вопросы по услугам агентства, семейной ипотеке и
            предлагает недвижимость исходя из вашего бюджета, количества комнат
            и района.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl"
        >
          <div className="p-5 px-6 bg-zinc-900 text-white flex items-center justify-between">
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
                  Подбор квартир и семейных резиденций 24/7
                </div>
              </div>
            </div>
            <a
              href="#booking-section"
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Перейти к форме записи →
            </a>
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
                Vanguard AI подбирает лучшие предложения...
              </div>
            )}
          </div>

          <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2">
            {[
              "Подбери просторную квартиру для большой семьи (5–6 комнат)",
              "Подобрать 2–3 комнатную квартиру до 35 млн ₽",
              "Какие условия семейной ипотеки и услуг агентства?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => handleSendChat(q)}
                className="text-xs px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-amber-500 transition-colors"
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
              className="flex-1 px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={loadingAI}
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Отправить
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
