import { getProperties } from "@/lib/db";
import { Property } from "@/types/estate";

interface AssistantResponse {
  reply: string;
  recommendedPropertyIds: string[];
  suggestLeadCapture: boolean;
  modelUsed: string;
}

export async function generateAssistantResponse(
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<AssistantResponse> {
  const properties = await getProperties();
  const apiKey = process.env.GEMINI_API_KEY;
  const preferredModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  const catalogContext = properties
    .map(
      (p) =>
        `- ID: ${p.id} | "${p.title}" | Район: ${p.district} (${p.address}) | Цена: ${(p.price / 1_000_000).toFixed(1)} млн ₽ | Комнат: ${p.rooms} | Площадь: ${p.area} м² | Этаж: ${p.floor}/${p.totalFloors} | Особенности: ${p.features.join(", ")}`
    )
    .join("\n");

  const systemInstruction = `Ты — персональный ИИ-брокер премиального агентства недвижимости «Vanguard Realty» (работаешь на модели ${preferredModel}).
Твоя задача:
1. Вежливо, экспертно и лаконично отвечать на вопросы клиента об услугах агентства (подбор новостроек, семейных резиденций и элитной вторички без комиссии для покупателя, одобрение семейной ипотеки от 4.9%, полное юридическое сопровождение).
2. Подбирать конкретные квартиры из актуального каталога ниже на основе бюджета, количества комнат (включая большие квартиры 4–6 комнат для больших семей) и района клиента.
3. Мягко и ненавязчиво подводить клиента к записи на просмотр в удобный для него день.

Актуальный каталог Vanguard Realty:
${catalogContext}

Отвечай строго в формате JSON со следующей структурой:
{
  "reply": "Твой ответ клиенту",
  "recommendedPropertyIds": ["prop-1", "prop-2"],
  "suggestLeadCapture": true
}`;

  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    const modelsToTry = [
      preferredModel,
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
    ];

    for (const modelName of modelsToTry) {
      try {
        const conversationText = messages
          .map(
            (m) =>
              `${m.role === "user" ? "Клиент" : "Vanguard AI"}: ${m.content}`
          )
          .join("\n");

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${systemInstruction}\n\nИстория диалога:\n${conversationText}\n\nОтвет (только валидный JSON):`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.5,
              },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const rawText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const parsed = JSON.parse(rawText);
          return {
            reply:
              parsed.reply ||
              "Я подобрал для вас лучшие варианты из нашего каталога.",
            recommendedPropertyIds: Array.isArray(parsed.recommendedPropertyIds)
              ? parsed.recommendedPropertyIds
              : [],
            suggestLeadCapture: Boolean(parsed.suggestLeadCapture),
            modelUsed: modelName,
          };
        }
      } catch (err) {
        console.warn(`Model ${modelName} fallback triggered:`, err);
      }
    }
  }

  return buildSmartHeuristicResponse(messages, properties, preferredModel);
}

function buildSmartHeuristicResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  properties: Property[],
  modelLabel: string
): AssistantResponse {
  const lastUserMsg =
    [...messages]
      .reverse()
      .find((m) => m.role === "user")
      ?.content.toLowerCase() || "";

  let matched = [...properties];

  const budgetMatch =
    lastUserMsg.match(/(\d+)\s*(млн|миллион)/i) ||
    lastUserMsg.match(/до\s*(\d+)/i);
  if (budgetMatch) {
    const maxMillions = parseInt(budgetMatch[1], 10);
    if (maxMillions > 5 && maxMillions < 500) {
      matched = matched.filter((p) => p.price <= (maxMillions + 3) * 1_000_000);
    }
  }

  if (
    lastUserMsg.includes("сем") ||
    lastUserMsg.includes("больш") ||
    lastUserMsg.includes("5") ||
    lastUserMsg.includes("6") ||
    lastUserMsg.includes("дет")
  ) {
    matched = matched.filter((p) => p.rooms >= 4);
  } else if (
    lastUserMsg.includes("1-ком") ||
    lastUserMsg.includes("одноком") ||
    lastUserMsg.includes("студи") ||
    /\b1\s*ком/i.test(lastUserMsg)
  ) {
    matched = matched.filter((p) => p.rooms === 1);
  } else if (
    lastUserMsg.includes("2-ком") ||
    lastUserMsg.includes("двухком") ||
    lastUserMsg.includes("двушк") ||
    /\b2\s*ком/i.test(lastUserMsg)
  ) {
    matched = matched.filter((p) => p.rooms === 2);
  } else if (
    lastUserMsg.includes("3-ком") ||
    lastUserMsg.includes("трехком") ||
    lastUserMsg.includes("трешк") ||
    /\b3\s*ком/i.test(lastUserMsg)
  ) {
    matched = matched.filter((p) => p.rooms === 3);
  }

  const districtMatches = properties.filter((p) =>
    lastUserMsg.includes(p.district.toLowerCase().slice(0, 5))
  );
  if (districtMatches.length > 0) {
    matched = districtMatches;
  }

  if (matched.length === 0) {
    matched = properties.slice(0, 2);
  } else {
    matched = matched.slice(0, 3);
  }

  if (
    lastUserMsg.includes("услуг") ||
    lastUserMsg.includes("ипотек") ||
    lastUserMsg.includes("комисс")
  ) {
    return {
      reply:
        "В Vanguard Realty мы сопровождаем сделку под ключ:\n• 0% комиссии при покупке новостроек и семейных резиденций;\n• Одобрение семейной и IT-ипотеки от 4.9% годовых за 24 часа;\n• Полная юридическая экспертиза и приватный трансфер на показы.\n\nПодскажите, какой район, количество комнат и бюджет вы рассматриваете?",
      recommendedPropertyIds: matched.slice(0, 2).map((p) => p.id),
      suggestLeadCapture: true,
      modelUsed: `${modelLabel}`,
    };
  }

  const listText = matched
    .map(
      (p) =>
        `• ${p.title} (${p.district}, ${p.rooms}-комн., ${p.area} м²) — ${(p.price / 1_000_000).toFixed(1)} млн ₽`
    )
    .join("\n");

  return {
    reply: `Исходя из ваших пожеланий, я подобрал актуальные лоты из базы Vanguard Realty:\n\n${listText}\n\nВ какой день недели вам удобно приехать на персональный просмотр? Нажмите кнопку «Запись» под понравившимся объектом или заполните форму ниже!`,
    recommendedPropertyIds: matched.map((p) => p.id),
    suggestLeadCapture: true,
    modelUsed: `${modelLabel}`,
  };
}
