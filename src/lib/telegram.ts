import { Lead } from "@/types/estate";

const SOURCE_LABELS: Record<Lead["source"], string> = {
  website_booking: "🌐 Запись на сайте (Карточка объекта)",
  ai_quiz: "🎯 Интерактивный ИИ-Квиз",
  ai_chat: "🤖 Умный ИИ-Ассистент (Gemini)",
  telegram_bot: "✈️ Telegram-Бот (@VanguardRealtyBot)",
};

export async function sendLeadToTelegramGroup(lead: Lead): Promise<{
  sent: boolean;
  reason?: string;
}> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID || "-5387102105";

  const messageText = [
    `🏛 <b>VANGUARD REALTY — НОВАЯ ЗАЯВКА</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 <b>Клиент:</b> ${escapeHtml(lead.clientName)}`,
    `📞 <b>Телефон:</b> <code>${escapeHtml(lead.phone)}</code>`,
    lead.telegramUsername
      ? `💬 <b>Telegram:</b> ${escapeHtml(lead.telegramUsername)}`
      : null,
    `📍 <b>Объект:</b> ${escapeHtml(lead.propertyTitle || "Подбор по параметрам")}`,
    `📅 <b>День просмотра:</b> ${escapeHtml(lead.preferredDate)}${lead.preferredTime ? ` в ${escapeHtml(lead.preferredTime)}` : ""}`,
    lead.budget ? `💰 <b>Бюджет:</b> ${escapeHtml(lead.budget)}` : null,
    lead.rooms ? `🚪 <b>Комнат:</b> ${escapeHtml(lead.rooms)}` : null,
    lead.district ? `🗺 <b>Район:</b> ${escapeHtml(lead.district)}` : null,
    lead.notes ? `📝 <b>Комментарий:</b> ${escapeHtml(lead.notes)}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📡 <b>Источник:</b> ${SOURCE_LABELS[lead.source] || lead.source}`,
    `🆔 <code>${lead.id}</code>`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!botToken || !groupChatId) {
    console.log(
      "[Telegram Group Notification Simulated - Set TELEGRAM_BOT_TOKEN & TELEGRAM_GROUP_CHAT_ID in .env.local]:\n",
      messageText
    );
    return {
      sent: false,
      reason:
        "TELEGRAM_BOT_TOKEN или TELEGRAM_GROUP_CHAT_ID не заданы в .env.local (заявка сохранена в Админ-панели)",
    };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: groupChatId,
          text: messageText,
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Telegram API error:", errText);
      return { sent: false, reason: errText };
    }

    return { sent: true };
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
    return { sent: false, reason: String(error) };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
