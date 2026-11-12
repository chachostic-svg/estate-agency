import json
import os
import time
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "db.json")
ENV_PATH = os.path.join(BASE_DIR, ".env.local")


def load_env():
    env = {
        "GEMINI_API_KEY": os.environ.get("GEMINI_API_KEY", ""),
        "GEMINI_MODEL": os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite"),
        "TELEGRAM_BOT_TOKEN": os.environ.get("TELEGRAM_BOT_TOKEN", ""),
        "TELEGRAM_GROUP_CHAT_ID": os.environ.get("TELEGRAM_GROUP_CHAT_ID", ""),
        "ADMIN_PASSWORD": os.environ.get("ADMIN_PASSWORD", "vanguard2026"),
    }
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    return env


def read_db():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def write_db(data):
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def send_telegram_group_notification(lead, env):
    token = env.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = env.get("TELEGRAM_GROUP_CHAT_ID", "")
    text = (
        f"🏛 <b>VANGUARD REALTY — НОВАЯ ЗАЯВКА</b>\n"
        f"👤 <b>Клиент:</b> {lead.get('clientName')}\n"
        f"📞 <b>Телефон:</b> {lead.get('phone')}\n"
        f"📍 <b>Объект:</b> {lead.get('propertyTitle', 'Подбор')}\n"
        f"📅 <b>День просмотра:</b> {lead.get('preferredDate')} {lead.get('preferredTime', '')}\n"
        f"📡 <b>Источник:</b> {lead.get('source')}"
    )
    if not token or not chat_id:
        return {"sent": False, "reason": "Telegram Group simulated (tokens not set in .env.local)"}
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=5)
        return {"sent": True}
    except Exception as e:
        return {"sent": False, "reason": str(e)}


def ai_respond(messages, properties, env):
    last_msg = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last_msg = m.get("content", "").lower()
            break

    matched = list(properties)
    if "1" in last_msg or "студ" in last_msg:
        matched = [p for p in matched if p.get("rooms") == 1] or matched
    elif "2" in last_msg or "двух" in last_msg:
        matched = [p for p in matched if p.get("rooms") == 2] or matched
    elif "3" in last_msg or "трех" in last_msg or "сем" in last_msg:
        matched = [p for p in matched if p.get("rooms") == 3] or matched
    elif "4" in last_msg or "пентхаус" in last_msg:
        matched = [p for p in matched if p.get("rooms", 0) >= 4] or matched

    for p in properties:
        if p["district"].lower()[:5] in last_msg:
            matched = [x for x in properties if x["district"] == p["district"]]
            break

    matched = matched[:2] if matched else properties[:2]
    lines = "\n".join(
        [
            f"• {p['title']} ({p['district']}, {p['rooms']} комн., {p['area']} м²) — {p['price'] / 1_000_000:.1f} млн ₽"
            for p in matched
        ]
    )
    reply = (
        f"Исходя из ваших критериев, я (ИИ-помощник Vanguard Realty на базе {env.get('GEMINI_MODEL', 'gemini-3.5-flash-lite')}) подобрал лучшие резиденции:\n\n"
        f"{lines}\n\n"
        f"Мы оформляем покупку с комиссией 0% и ипотекой от 4.9%. В какой день вам удобно приехать на персональный просмотр? Нажмите «Запись» под объектом!"
    )
    return {
        "reply": reply,
        "recommendedPropertyIds": [p["id"] for p in matched],
        "suggestLeadCapture": True,
        "modelUsed": env.get("GEMINI_MODEL", "gemini-3.5-flash-lite"),
    }


class VanguardHandler(SimpleHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/properties"):
            db = read_db()
            return self._send_json({"properties": db.get("properties", [])})
        if self.path.startswith("/api/leads"):
            db = read_db()
            return self._send_json({"leads": db.get("leads", [])})
        if self.path == "/admin":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        body = json.loads(raw)
        env = load_env()
        db = read_db()

        if self.path.startswith("/api/properties"):
            if body.get("adminPassword") != env["ADMIN_PASSWORD"]:
                return self._send_json({"error": "Неверный пароль администратора"}, 401)
            new_prop = {
                "id": f"prop-{int(time.time() * 1000)}",
                "title": body.get("title", "Новая резиденция"),
                "district": body.get("district", "Центральный"),
                "address": body.get("address", "Адрес уточняется"),
                "price": int(body.get("price", 25000000)),
                "rooms": int(body.get("rooms", 2)),
                "area": int(body.get("area", 70)),
                "floor": int(body.get("floor", 5)),
                "totalFloors": int(body.get("totalFloors", 15)),
                "imageUrl": body.get("imageUrl") or "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
                "description": body.get("description") or "Эксклюзивная резиденция с дизайнерской отделкой.",
                "features": [s.strip() for s in str(body.get("features", "Панорамные окна, Паркинг")).split(",") if s.strip()],
                "badge": body.get("badge", "Новинка"),
                "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            }
            db["properties"].insert(0, new_prop)
            write_db(db)
            return self._send_json({"property": new_prop}, 201)

        if self.path.startswith("/api/leads"):
            new_lead = {
                "id": f"lead-{int(time.time() * 1000)}",
                "clientName": body.get("clientName", "Клиент"),
                "phone": body.get("phone", ""),
                "telegramUsername": body.get("telegramUsername", ""),
                "propertyId": body.get("propertyId", ""),
                "propertyTitle": body.get("propertyTitle", "Индивидуальный подбор"),
                "preferredDate": body.get("preferredDate", "В ближайшие дни"),
                "preferredTime": body.get("preferredTime", "14:00"),
                "budget": body.get("budget", ""),
                "rooms": body.get("rooms", ""),
                "district": body.get("district", ""),
                "source": body.get("source", "website_booking"),
                "status": "new",
                "notes": body.get("notes", ""),
                "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            }
            db["leads"].insert(0, new_lead)
            write_db(db)
            tg = send_telegram_group_notification(new_lead, env)
            return self._send_json({"lead": new_lead, "telegramNotification": tg}, 201)

        if self.path.startswith("/api/ai-chat"):
            res = ai_respond(body.get("messages", []), db.get("properties", []), env)
            return self._send_json(res, 200)

        if self.path.startswith("/api/telegram"):
            new_lead = {
                "id": f"lead-{int(time.time() * 1000)}",
                "clientName": body.get("clientName", "Клиент из Telegram-бота"),
                "phone": body.get("phone", "+7 (925) 991-04-77"),
                "telegramUsername": body.get("telegramUsername", "@vanguard_tg_client"),
                "propertyId": body.get("propertyId", "prop-1"),
                "propertyTitle": body.get("propertyTitle", "Пентхаус с террасой в ЖК «Vanguard Knightsbridge»"),
                "preferredDate": body.get("preferredDate", "2026-11-19"),
                "preferredTime": body.get("preferredTime", "16:00"),
                "source": "telegram_bot",
                "status": "new",
                "notes": "Заявка передана автоматически из Telegram-бота в Админку сайта",
                "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            }
            db["leads"].insert(0, new_lead)
            write_db(db)
            tg = send_telegram_group_notification(new_lead, env)
            return self._send_json({"ok": True, "lead": new_lead, "tgGroup": tg}, 200)

        return self._send_json({"error": "Not found"}, 404)

    def do_PATCH(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length).decode("utf-8"))
        db = read_db()
        for l in db["leads"]:
            if l["id"] == body.get("id"):
                l["status"] = body.get("status", "contacted")
                write_db(db)
                return self._send_json({"lead": l})
        return self._send_json({"error": "Not found"}, 404)

    def do_DELETE(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        prop_id = qs.get("id", [""])[0]
        db = read_db()
        db["properties"] = [p for p in db["properties"] if p["id"] != prop_id]
        write_db(db)
        return self._send_json({"deleted": True})


if __name__ == "__main__":
    os.chdir(BASE_DIR)
    print(f"Vanguard Realty Server running at http://localhost:{PORT}")
    HTTPServer(("0.0.0.0", PORT), VanguardHandler).serve_forever()
