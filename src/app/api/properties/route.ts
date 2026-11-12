import { NextRequest, NextResponse } from "next/server";
import { addProperty, deleteProperty, getProperties } from "@/lib/db";

export async function GET() {
  const properties = await getProperties();
  return NextResponse.json({ properties });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "vanguard2026";

    if (body.adminPassword !== adminPassword) {
      return NextResponse.json(
        { error: "Неверный пароль администратора" },
        { status: 401 }
      );
    }

    const {
      title,
      district,
      address,
      price,
      rooms,
      area,
      floor,
      totalFloors,
      imageUrl,
      description,
      features,
      badge,
      metro,
    } = body;

    if (!title || !address || !price) {
      return NextResponse.json(
        { error: "Укажите название, адрес и стоимость объекта" },
        { status: 400 }
      );
    }

    const created = await addProperty({
      title,
      district: district || "Центральный",
      address,
      price: Number(price),
      rooms: Number(rooms) || 2,
      area: Number(area) || 65,
      floor: Number(floor) || 5,
      totalFloors: Number(totalFloors) || 16,
      imageUrl:
        imageUrl ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
      description:
        description ||
        "Эксклюзивная резиденция с дизайнерской отделкой и панорамным остеклением.",
      features: Array.isArray(features)
        ? features
        : typeof features === "string"
        ? features
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : ["Панорамные окна", "Подземный паркинг", "Закрытый двор"],
      badge: badge || "Новинка",
      metro: metro || "5 мин пешком",
      completionYear: 2026,
    });

    return NextResponse.json({ property: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка при добавлении объекта", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const password = req.headers.get("x-admin-password") || searchParams.get("password");
    const adminPassword = process.env.ADMIN_PASSWORD || "vanguard2026";

    if (password !== adminPassword) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Не указан ID" }, { status: 400 });
    }

    const ok = await deleteProperty(id);
    return NextResponse.json({ deleted: ok });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка удаления", details: String(error) },
      { status: 500 }
    );
  }
}
