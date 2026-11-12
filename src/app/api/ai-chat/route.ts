import { NextRequest, NextResponse } from "next/server";
import { generateAssistantResponse } from "@/lib/ai-assistant";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const result = await generateAssistantResponse(messages);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        reply:
          "Я готов помочь подобрать идеальную квартиру по вашему бюджету и району! Укажите желаемый район и количество комнат.",
        recommendedPropertyIds: ["prop-1", "prop-2"],
        suggestLeadCapture: true,
        modelUsed: "gemini-3.5-flash-lite",
        error: String(error),
      },
      { status: 200 }
    );
  }
}
