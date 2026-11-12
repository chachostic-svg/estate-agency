import { NextRequest, NextResponse } from "next/server";
import { addLead, getLeads, updateLeadStatus } from "@/lib/db";
import { sendLeadToTelegramGroup } from "@/lib/telegram";

export async function GET() {
  const leads = await getLeads();
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientName,
      phone,
      telegramUsername,
      propertyId,
      propertyTitle,
      preferredDate,
      preferredTime,
      budget,
      rooms,
      district,
      source,
      notes,
    } = body;

    if (!clientName || !phone) {
      return NextResponse.json(
        { error: "Пожалуйста, укажите ваше имя и телефон" },
        { status: 400 }
      );
    }

    const newLead = await addLead({
      clientName,
      phone,
      telegramUsername,
      propertyId,
      propertyTitle: propertyTitle || "Индивидуальный подбор",
      preferredDate: preferredDate || "В ближайшие дни",
      preferredTime: preferredTime || "14:00",
      budget,
      rooms,
      district,
      source: source || "website_booking",
      notes,
    });

    const tgResult = await sendLeadToTelegramGroup(newLead);

    return NextResponse.json(
      {
        lead: newLead,
        telegramNotification: tgResult,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка сохранения заявки", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, adminPassword } = body;
    const expectedPassword = process.env.ADMIN_PASSWORD || "vanguard2026";

    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 401 });
    }

    const updated = await updateLeadStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    return NextResponse.json({ lead: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка обновления статуса", details: String(error) },
      { status: 500 }
    );
  }
}
