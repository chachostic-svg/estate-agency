import { NextRequest, NextResponse } from "next/server";
import { addLead, getProperties } from "@/lib/db";
import { sendLeadToTelegramGroup } from "@/lib/telegram";

/**
 * Webhook и API для Telegram-бота Vanguard Realty.
 * Принимает обновления от Telegram Bot API (когда клиент пишет боту)
 * и записывает клиента в Админ-панель сайта + дублирует заявку в Telegram-группу.
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Если это запрос из админки для симуляции/теста заявки из Telegram-бота
    if (update.simulateBotBooking) {
      const lead = await addLead({
        clientName: update.clientName || "Максим Белов (из Telegram)",
        phone: update.phone || "+7 (916) 800-45-12",
        telegramUsername: update.telegramUsername || "@max_belov_tg",
        propertyId: update.propertyId || "prop-2",
        propertyTitle:
          update.propertyTitle || "Апартаменты Sky-класса в «Neva Towers»",
        preferredDate: update.preferredDate || "2026-11-18",
        preferredTime: update.preferredTime || "16:30",
        budget: update.budget || "35 млн ₽",
        rooms: update.rooms || "2 комнаты",
        district: update.district || "Пресненский (Сити)",
        source: "telegram_bot",
        notes:
          update.notes ||
          "Клиент записался через интерактивного Telegram-бота Vanguard Realty",
      });

      const tgGroup = await sendLeadToTelegramGroup(lead);
      return NextResponse.json({ ok: true, lead, tgGroup });
    }

    // Стандартный Telegram Webhook payload
    const message = update.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const firstName = message.from?.first_name || "Клиент";
    const username = message.from?.username ? `@${message.from.username}` : undefined;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const properties = await getProperties();

    if (text === "/start") {
      const catalogList = properties
        .slice(0, 5)
        .map(
          (p, i) =>
            `${i + 1}. <b>${p.title}</b> (${p.district}) — ${(p.price / 1_000_000).toFixed(1)} млн ₽`
        )
        .join("\n");

      const welcomeReply =
        `🏛 Добро пожаловать в <b>Vanguard Realty</b>, ${firstName}!\n\n` +
        `Я автоматический бот записи на приватный просмотр недвижимости.\n\n` +
        `🔥 <b>Топ актуальных объектов:</b>\n${catalogList}\n\n` +
        `Чтобы записаться на просмотр и передать заявку в нашу систему, отправьте сообщение в формате:\n` +
        `<code>Запись: [Номер или название квартиры], [Дата просмотра], [Ваш телефон]</code>\n\n` +
        `Например:\n<code>Запись: Neva Towers, 18 ноября в 15:00, +79991234567</code>`;

      if (botToken) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : undefined);

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeReply,
            parse_mode: "HTML",
            reply_markup: appUrl
              ? {
                  inline_keyboard: [
                    [
                      {
                        text: "🏛 Открыть каталог Vanguard Realty (Mini App)",
                        web_app: { url: appUrl },
                      },
                    ],
                  ],
                }
              : undefined,
          }),
        });
      }
      return NextResponse.json({ ok: true });
    }

    // Любое другое сообщение с телефоном или словом "Запись" сохраняем как заявку в Админку!
    const parts = text.replace(/^запись\s*:?\s*/i, "").split(",");
    const propQuery = (parts[0] || "Подбор объекта").trim();
    const datePart = (parts[1] || "Ближайший свободный день").trim();
    const phonePart = (parts[2] || text).trim();

    const matchedProp = properties.find(
      (p) =>
        p.title.toLowerCase().includes(propQuery.toLowerCase()) ||
        p.district.toLowerCase().includes(propQuery.toLowerCase())
    );

    const createdLead = await addLead({
      clientName: firstName,
      phone: phonePart,
      telegramUsername: username,
      propertyId: matchedProp?.id,
      propertyTitle: matchedProp ? matchedProp.title : propQuery,
      preferredDate: datePart,
      source: "telegram_bot",
      notes: `Сообщение из Telegram-бота: "${text}"`,
    });

    await sendLeadToTelegramGroup(createdLead);

    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ <b>Спасибо, ${firstName}!</b>\nВаша заявка на просмотр (<b>${createdLead.propertyTitle}</b>, дата: ${createdLead.preferredDate}) передана в админ-панель Vanguard Realty и отправлена брокерам в группу.`,
          parse_mode: "HTML",
        }),
      });
    }

    return NextResponse.json({ ok: true, leadId: createdLead.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
