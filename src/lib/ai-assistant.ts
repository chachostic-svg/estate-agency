import { GoogleGenAI } from "@google/genai";
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
  const properties = getProperties();
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
1. Вежливо, экспертно и лаконично отвечать на вопросы клиента об услугах агентства (подбор новостроек и элитной вторички без комиссии для покупателя, одобрение ипотеки от 4.9%, полное юридическое сопровождение, приватные показы на автомобиле агентства).
2. Подбирать конкретные квартиры из актуального каталога ниже на основе бюджета, количества комнат и района клиента.
3. Мягко и ненавязчиво подводить клиента к записи на просмотр в удобный для него день (спросить удобный день просмотра, имя и телефон, либо предложить нажать кнопку «Записаться на просмотр» прямо под рекомендованной квартирой).

Актуальный каталог Vanguard Realty:
${catalogContext}

Отвечай строго в формате JSON со следующей структурой:
{
  "reply": "Твой ответ клиенту (используй приятное форматирование, упоминай подходящие объекты и их преимущества, мягко предложи выбрать день просмотра)",
  "recommendedPropertyIds": ["prop-1", "prop-2"],
  "suggestLeadCapture": true
}`;

  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    const ai = new GoogleGenAI({ apiKey });
    const modelsToTry = [
      preferredModel,
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
    ];

    for (const modelName of modelsToTry) {
      try {
        const conversationText = messages
          .map((m) => `${m.role === "user" ? "Клиент" : "Vanguard AI"}: ${m.content}`)
          .join("\n");

        const response = await ai.models.generateContent({
          model: modelName,
          contents: `${systemInstruction}\n\nИстория диалога:\n${conversationText}\n\nОтвет (только валидный JSON):`,
          config: {
            responseMimeType: "application/json",
            temperature: 0.5,
          },
        });

        const rawText = response.text || "";
        const parsed = JSON.parse(rawText);
        return {
          reply: parsed.reply || "Я подобрал для вас лучшие варианты из нашего каталога.",
          recommendedPropertyIds: Array.isArray(parsed.recommendedPropertyIds)
            ? parsed.recommendedPropertyIds
            : [],
          suggestLeadCapture: Boolean(parsed.suggestLeadCapture),
          modelUsed: modelName,
        };
      } catch (err) {
        console.warn(`Model ${modelName} fallback triggered:`, err);
      }
    }
  }

  // Интеллектуальный локальный движок Vanguard AI (работает мгновенно даже без API ключа)
  return buildSmartHeuristicResponse(messages, properties, preferredModel);
}

function buildSmartHeuristicResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  properties: Property[],
  modelLabel: string
): AssistantResponse {
  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.content.toLowerCase() || "";

  let matched = [...properties];

  // Фильтрация по бюджету (млн)
  const budgetMatch = lastUserMsg.match(/(\d+)\s*(млн|миллион)/i) || lastUserMsg.match(/до\s*(\d+)/i);
  if (budgetMatch) {
    const maxMillions = parseInt(budgetMatch[1], 10);
    if (maxMillions > 5 && maxMillions < 500) {
      matched = matched.filter((p) => p.price <= (maxMillions + 3) * 1_000_000);
    }
  }

  // Фильтрация по комнатам
  if (lastUserMsg.includes("1-ком") || lastUserMsg.includes("одноком") || lastUserMsg.includes("студи") || /\b1\s*ком/i.test(lastUserMsg)) {
    matched = matched.filter((p) => p.rooms === 1);
  } else if (lastUserMsg.includes("2-ком") || lastUserMsg.includes("двухком") || lastUserMsg.includes("двушк") || /\b2\s*ком/i.test(lastUserMsg)) {
    matched = matched.filter((p) => p.rooms === 2);
  } else if (lastUserMsg.includes("3-ком") || lastUserMsg.includes("трехком") || lastUserMsg.includes("трешк") || /\b3\s*ком/i.test(lastUserMsg)) {
    matched = matched.filter((p) => p.rooms === 3);
  } else if (lastUserMsg.includes("4") || lastUserMsg.includes("пентхаус")) {
    matched = matched.filter((p) => p.rooms >= 4);
  }

  // Фильтрация по району
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

  if (lastUserMsg.includes("услуг") || lastUserMsg.includes("ипотек") || lastUserMsg.includes("комисс")) {
    return {
      reply:
        "В **Vanguard Realty** мы сопровождаем сделку под ключ:\n• **0% комиссии** при покупке новостроек и клубных резиденций;\n• Одобрение семейной и IT-ипотеки от **4.9% годовых** за 24 часа;\n• Полная юридическая экспертиза и приватный трансфер на показы.\n\nПодскажите, какой район, количество комнат и бюджет вы рассматриваете? Я сразу предложу лучшие лоты и запишу вас на удобный день просмотра.",
      recommendedPropertyIds: matched.slice(0, 2).map((p) => p.id),
      suggestLeadCapture: true,
      modelUsed: `${modelLabel} (Smart Engine)`,
    };
  }

  const listText = matched
    .map(
      (p) =>
        `• **${p.title}** (${p.district}, ${p.rooms}-комн., ${p.area} м²) — **${(p.price / 1_000_000).toFixed(1)} млн ₽**`
    )
    .join("\n");

  return {
    reply: `Исходя из ваших пожеланий, я подобрал для вас актуальные лоты из закрытой базы **Vanguard Realty**:\n\n${listText}\n\nВ какой день недели вам было бы удобно приехать на персональный показ? Вы можете выбрать конкретную дату прямо сейчас — я забронирую время у ведущего брокера.`,
    recommendedPropertyIds: matched.map((p) => p.id),
    suggestLeadCapture: true,
    modelUsed: `${modelLabel} (Smart Engine)`,
  };
}
