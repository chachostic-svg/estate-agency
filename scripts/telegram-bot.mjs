/**
 * Автономный скрипт Telegram-бота для Vanguard Realty (Long Polling).
 * Записывает клиентов в единую базу сайта (data/db.json) и дублирует заявки в Telegram-группу.
 * Запуск: npm run bot (или node scripts/telegram-bot.mjs)
 */

import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID;

const userSessions = new Map();

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { properties: [], leads: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function sendTelegramMessage(chatId, text, replyMarkup = undefined) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }),
  });
}

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const db = readDb();

  if (text === "/start") {
    userSessions.set(chatId, { step: "choose_property" });
    const propButtons = db.properties.slice(0, 6).map((p) => [
      { text: `🏛 ${p.title} (${(p.price / 1e6).toFixed(1)} млн ₽)` },
    ]);

    await sendTelegramMessage(
      chatId,
      `🏛 <b>Добро пожаловать в Vanguard Realty!</b>\n\nВыберите интересующий объект из актуального каталога ниже или напишите свои пожелания по району и бюджету:`,
      {
        keyboard: propButtons,
        resize_keyboard: true,
        one_time_keyboard: true,
      }
    );
    return;
  }

  const session = userSessions.get(chatId) || { step: "choose_property" };

  if (session.step === "choose_property") {
    session.propertyTitle = text.replace(/^🏛\s*/, "");
    session.step = "choose_date";
    userSessions.set(chatId, session);

    await sendTelegramMessage(
      chatId,
      `📅 Отличный выбор: <b>${session.propertyTitle}</b>.\n\nВ какой день и время вам удобно посмотреть объект? (Например: <i>Завтра в 15:00</i> или <i>18 ноября в 13:00</i>):`,
      { remove_keyboard: true }
    );
    return;
  }

  if (session.step === "choose_date") {
    session.preferredDate = text;
    session.step = "enter_contact";
    userSessions.set(chatId, session);

    await sendTelegramMessage(
      chatId,
      `👤 Укажите ваше <b>Имя и номер телефона</b> для подтверждения пропуска на объект:`
    );
    return;
  }

  if (session.step === "enter_contact") {
    const newLead = {
      id: `lead-${Date.now()}`,
      clientName: msg.from?.first_name ? `${msg.from.first_name} (${text})` : text,
      phone: text,
      telegramUsername: msg.from?.username ? `@${msg.from.username}` : undefined,
      propertyTitle: session.propertyTitle || "Подбор через Telegram",
      preferredDate: session.preferredDate || "По договоренности",
      source: "telegram_bot",
      status: "new",
      notes: "Заявка создана через пошагового Telegram-бота",
      createdAt: new Date().toISOString(),
    };

    db.leads.unshift(newLead);
    writeDb(db);
    userSessions.delete(chatId);

    await sendTelegramMessage(
      chatId,
      `✅ <b>Ваша заявка принята!</b>\n\nОбъект: <b>${newLead.propertyTitle}</b>\nДата просмотра: <b>${newLead.preferredDate}</b>\n\nДанные переданы в Админ-панель Vanguard Realty. Персональный брокер свяжется с вами в течение 10 минут!`
    );

    if (GROUP_CHAT_ID) {
      await sendTelegramMessage(
        GROUP_CHAT_ID,
        `🏛 <b>НОВАЯ ЗАЯВКА ИЗ TELEGRAM-БОТА</b>\n👤 Клиент: ${newLead.clientName}\n📍 Объект: ${newLead.propertyTitle}\n📅 Дата просмотра: ${newLead.preferredDate}\n💬 TG: ${newLead.telegramUsername || "—"}`
      );
    }
  }
}

async function startPolling() {
  if (!BOT_TOKEN) {
    console.log("⚠️ Укажите TELEGRAM_BOT_TOKEN в .env.local для запуска поллинга.");
    return;
  }
  console.log("🚀 Telegram-бот Vanguard Realty запущен и синхронизирован с data/db.json...");
  let offset = 0;
  while (true) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=25`
      );
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startPolling();
