import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { DatabaseSchema, Lead, LeadStatus, Property } from "@/types/estate";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const INITIAL_PROPERTIES: Property[] = [
  {
    id: "prop-1",
    title: "Пентхаус с террасой в ЖК «Vanguard Knightsbridge»",
    district: "Хамовники",
    address: "ул. Ефремова, д. 19, корп. 1",
    price: 68500000,
    rooms: 4,
    area: 164,
    floor: 14,
    totalFloors: 14,
    imageUrl:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85",
    description:
      "Видовой двухуровневый пентхаус с собственной озелененной террасой 45 м², панорамным остеклением в пол и камином.",
    features: [
      "Терраса 45 м²",
      "Дровяной камин",
      "Приватный лифт",
      "2 машиноместа в паркинге",
    ],
    badge: "Эксклюзив",
    createdAt: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "prop-2",
    title: "Большая семейная резиденция «Крылатские Холмы Парк»",
    district: "Крылатское",
    address: "ул. Крылатские Холмы, д. 33, корп. 2",
    price: 46800000,
    rooms: 5,
    area: 192,
    floor: 6,
    totalFloors: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85",
    description:
      "Просторная 5-комнатная квартира специально для большой семьи в самом зеленом районе города: 3 детские спальни, мастер-блок для родителей, гостиная 52 м². Во дворе частный лицей и детсад.",
    features: [
      "Для большой семьи",
      "3 детские спальни",
      "Частный лицей во дворе",
      "Выход в лесопарк",
    ],
    badge: "Для большой семьи",
    createdAt: "2026-11-02T11:00:00.000Z",
  },
  {
    id: "prop-3",
    title: "Апартаменты Sky-класса в «Neva Towers»",
    district: "Пресненский (Сити)",
    address: "1-й Красногвардейский пр-д, д. 22, стр. 2",
    price: 34900000,
    rooms: 2,
    area: 78,
    floor: 52,
    totalFloors: 68,
    imageUrl:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85",
    description:
      "Дизайнерские апартаменты с панорамным видом на город с 52 этажа. Полная комплектация мебелью Minotti и доступ в приватный SPA.",
    features: [
      "Панорама 270°",
      "Мебель Minotti",
      "Клубный SPA и парк на крыше",
      "Консьерж 24/7",
    ],
    badge: "Хит продаж",
    createdAt: "2026-11-03T12:30:00.000Z",
  },
  {
    id: "prop-4",
    title: "Двухуровневый семейный особняк-таунхаус «Сколково Форест»",
    district: "Сколково / Заречье",
    address: "ул. Весенняя, д. 8, стр. 4",
    price: 59000000,
    rooms: 6,
    area: 248,
    floor: 1,
    totalFloors: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=85",
    description:
      "Идеальный дом для большой семьи из 5–7 человек: 6 комнат, собственный придомовой участок 4 сотки, 4 спальни, камин и гараж на 2 автомобиля рядом с Мещерским парком.",
    features: [
      "Для большой семьи (6 комнат)",
      "Собственный дворик",
      "Международная гимназия",
      "Гараж на 2 авто",
    ],
    badge: "Для большой семьи",
    createdAt: "2026-11-04T09:20:00.000Z",
  },
  {
    id: "prop-5",
    title: "Семейная резиденция у воды «Остров Премиум»",
    district: "Хорошёво-Мнёвники",
    address: "ул. Нижние Мнёвники, д. 14",
    price: 26400000,
    rooms: 3,
    area: 96,
    floor: 7,
    totalFloors: 21,
    imageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
    description:
      "Просторная трехкомнатная квартира в экологичном квартале в окружении реки и природного заказника.",
    features: [
      "Первая береговая линия",
      "Собственная школа и детсад",
      "Отделка White Box",
      "Закрытый двор-парк",
    ],
    badge: "Семейный выбор",
    createdAt: "2026-11-05T15:10:00.000Z",
  },
  {
    id: "prop-6",
    title: "Клубный лофт «AURA Замоскворечье»",
    district: "Замоскворечье",
    address: "Садовническая наб., д. 69",
    price: 41200000,
    rooms: 3,
    area: 112,
    floor: 4,
    totalFloors: 6,
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    description:
      "Аутентичная резиденция в малоэтажном особняке на набережной с высотой потолков 3.8 м и французскими балконами.",
    features: [
      "Набережная у дома",
      "Потолки 3.8 м",
      "Французские балконы",
      "Малоэтажный клубный дом",
    ],
    badge: "Редкий лот",
    createdAt: "2026-11-06T09:45:00.000Z",
  },
  {
    id: "prop-7",
    title: "Семейная усадьба в парке «Сокольники Гранд»",
    district: "Сокольники",
    address: "ул. Сокольнический Вал, д. 42",
    price: 36500000,
    rooms: 5,
    area: 158,
    floor: 9,
    totalFloors: 16,
    imageUrl:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",
    description:
      "Пятикомнатная семейная квартира с видом на вековой парк Сокольники: 4 изолированные спальни, большая гостиная, 3 санузла и безопасный двор без машин.",
    features: [
      "Для большой семьи",
      "Вид на парк Сокольники",
      "4 спальни + гостиная",
      "Безопасный двор без машин",
    ],
    badge: "Для большой семьи",
    createdAt: "2026-11-07T13:15:00.000Z",
  },
  {
    id: "prop-8",
    title: "Смарт-студия бизнес-класса «Символ Прайм»",
    district: "Даниловский",
    address: "Автозаводская ул., д. 23, корп. 5",
    price: 15800000,
    rooms: 1,
    area: 43,
    floor: 11,
    totalFloors: 24,
    imageUrl:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=85",
    description:
      "Идеальный лот с готовой дизайнерской отделкой в светлых тонах и высокой доходностью аренды.",
    features: [
      "Готовый ремонт под ключ",
      "Высокая доходность аренды",
      "Ипотека от 4.9%",
    ],
    badge: "Инвест-лот",
    createdAt: "2026-11-08T11:20:00.000Z",
  },
  {
    id: "prop-9",
    title: "Видовая резиденция «Ботаника Парк»",
    district: "Раменки",
    address: "Мичуринский пр-т, д. 38",
    price: 22500000,
    rooms: 2,
    area: 68,
    floor: 16,
    totalFloors: 28,
    imageUrl:
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=85",
    description:
      "Квартира в дипломатическом районе рядом с МГУ и Ботаническим садом с панорамными окнами в пол.",
    features: ["Рядом с МГУ и парком", "Окна в пол Schüco", "2 санузла"],
    badge: "Ипотека 5%",
    createdAt: "2026-11-09T14:00:00.000Z",
  },
  {
    id: "prop-10",
    title: "Историческая резиденция «Патриаршие Делюкс»",
    district: "Патриаршие пруды",
    address: "Малый Козихинский пер., д. 11",
    price: 74000000,
    rooms: 4,
    area: 146,
    floor: 5,
    totalFloors: 7,
    imageUrl:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
    description:
      "Клубный дом на 18 квартир в тихом переулке Патриарших прудов с мраморным лобби и дровяным камином.",
    features: ["Тихий центр", "Клубный дом", "Авторский интерьер"],
    badge: "Коллекционный лот",
    createdAt: "2026-11-10T10:00:00.000Z",
  },
  {
    id: "prop-11",
    title: "Семейный квартал у залива «Покровский Берег»",
    district: "Покровское-Стрешнево",
    address: "Береговая ул., д. 6, корп. 3",
    price: 31800000,
    rooms: 4,
    area: 134,
    floor: 5,
    totalFloors: 9,
    imageUrl:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=85",
    description:
      "Просторный 4-комнатный лот для большой семьи на берегу водохранилища с собственным пляжем и английским детским садом.",
    features: [
      "Для большой семьи",
      "Собственная набережная и пляж",
      "Английский детсад",
    ],
    badge: "Для большой семьи",
    createdAt: "2026-11-10T15:30:00.000Z",
  },
  {
    id: "prop-12",
    title: "Дизайнерская квартира «Арбатские Сезоны»",
    district: "Арбат",
    address: "ул. Новый Арбат, д. 29",
    price: 29400000,
    rooms: 2,
    area: 64,
    floor: 12,
    totalFloors: 22,
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85",
    description:
      "Стильная резиденция в самом сердце исторического центра с панорамной лоджией и круглосуточным сервисом.",
    features: ["Исторический центр", "Панорамная лоджия", "Рум-сервис 24/7"],
    badge: "Премиум",
    createdAt: "2026-11-11T08:00:00.000Z",
  },
];

let memoryFallback: DatabaseSchema = {
  properties: [...INITIAL_PROPERTIES],
  leads: [],
};

// Ленивая инициализация клиента Neon Postgres (безопасно для сборки на Vercel)
function getNeonSql() {
  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  if (!connectionString) return null;
  return neon(connectionString);
}

let neonInitialized = false;

async function ensureNeonTables() {
  const sql = getNeonSql();
  if (!sql || neonInitialized) return sql;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS vanguard_properties (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS vanguard_leads (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const existing = await sql`SELECT COUNT(*)::int AS cnt FROM vanguard_properties`;
    const count = existing[0]?.cnt ?? 0;

    if (count === 0) {
      for (const prop of INITIAL_PROPERTIES) {
        await sql`
          INSERT INTO vanguard_properties (id, data)
          VALUES (${prop.id}, ${JSON.stringify(prop)}::jsonb)
          ON CONFLICT (id) DO NOTHING
        `;
      }
    }
    neonInitialized = true;
  } catch (err) {
    console.warn("Neon table init warning:", err);
  }
  return sql;
}

export function readLocalDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw) as DatabaseSchema;
    }
  } catch {
    // На Vercel файловая система read-only, используем memoryFallback
  }
  return memoryFallback;
}

export function writeLocalDb(data: DatabaseSchema): void {
  memoryFallback = data;
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Игнорируем ошибку записи на read-only ФС в облаке
  }
}

export async function getProperties(): Promise<Property[]> {
  const sql = await ensureNeonTables();
  if (sql) {
    try {
      const rows = await sql`
        SELECT data FROM vanguard_properties ORDER BY created_at DESC
      `;
      if (rows.length > 0) {
        return rows.map((r) => r.data as Property);
      }
    } catch (err) {
      console.error("Neon getProperties error:", err);
    }
  }
  return readLocalDb().properties;
}

export async function addProperty(
  input: Omit<Property, "id" | "createdAt">
): Promise<Property> {
  const newProp: Property = {
    ...input,
    id: `prop-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const sql = await ensureNeonTables();
  if (sql) {
    try {
      await sql`
        INSERT INTO vanguard_properties (id, data)
        VALUES (${newProp.id}, ${JSON.stringify(newProp)}::jsonb)
      `;
      return newProp;
    } catch (err) {
      console.error("Neon addProperty error:", err);
    }
  }

  const db = readLocalDb();
  db.properties.unshift(newProp);
  writeLocalDb(db);
  return newProp;
}

export async function deleteProperty(id: string): Promise<boolean> {
  const sql = await ensureNeonTables();
  if (sql) {
    try {
      await sql`DELETE FROM vanguard_properties WHERE id = ${id}`;
      return true;
    } catch (err) {
      console.error("Neon deleteProperty error:", err);
    }
  }

  const db = readLocalDb();
  const initialLength = db.properties.length;
  db.properties = db.properties.filter((p) => p.id !== id);
  if (db.properties.length !== initialLength) {
    writeLocalDb(db);
    return true;
  }
  return false;
}

export async function getLeads(): Promise<Lead[]> {
  const sql = await ensureNeonTables();
  if (sql) {
    try {
      const rows = await sql`
        SELECT data FROM vanguard_leads ORDER BY created_at DESC
      `;
      return rows.map((r) => r.data as Lead);
    } catch (err) {
      console.error("Neon getLeads error:", err);
    }
  }
  return readLocalDb().leads;
}

export async function addLead(
  input: Omit<Lead, "id" | "createdAt" | "status"> & { status?: LeadStatus }
): Promise<Lead> {
  const newLead: Lead = {
    ...input,
    id: `lead-${Date.now()}`,
    status: input.status || "new",
    createdAt: new Date().toISOString(),
  };

  const sql = await ensureNeonTables();
  if (sql) {
    try {
      await sql`
        INSERT INTO vanguard_leads (id, data)
        VALUES (${newLead.id}, ${JSON.stringify(newLead)}::jsonb)
      `;
      return newLead;
    } catch (err) {
      console.error("Neon addLead error:", err);
    }
  }

  const db = readLocalDb();
  db.leads.unshift(newLead);
  writeLocalDb(db);
  return newLead;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<Lead | null> {
  const sql = await ensureNeonTables();
  if (sql) {
    try {
      const rows = await sql`
        SELECT data FROM vanguard_leads WHERE id = ${id}
      `;
      if (rows.length === 0) return null;
      const updated: Lead = { ...(rows[0].data as Lead), status };
      await sql`
        UPDATE vanguard_leads SET data = ${JSON.stringify(updated)}::jsonb WHERE id = ${id}
      `;
      return updated;
    } catch (err) {
      console.error("Neon updateLeadStatus error:", err);
    }
  }

  const db = readLocalDb();
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) return null;
  lead.status = status;
  writeLocalDb(db);
  return lead;
}
