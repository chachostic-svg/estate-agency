"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  PlusCircle,
  Trash2,
  Users,
  Home,
  Lock,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Upload,
} from "lucide-react";
import { Lead, LeadStatus, Property } from "@/types/estate";

export default function AdminPage() {
  const [password, setPassword] = useState("vanguard2026");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"leads" | "properties">("leads");

  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [title, setTitle] = useState("");
  const [district, setDistrict] = useState("Крылатское");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [rooms, setRooms] = useState("");
  const [area, setArea] = useState("");
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("16");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedPhotoDataUrl, setUploadedPhotoDataUrl] = useState("");
  const [features, setFeatures] = useState(
    "Для большой семьи, Панорамные окна, Закрытый двор-парк"
  );
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("Для большой семьи");
  const [addingMsg, setAddingMsg] = useState("");

  const fetchAll = async () => {
    const [pRes, lRes] = await Promise.all([
      fetch("/api/properties"),
      fetch("/api/leads"),
    ]);
    const pData = await pRes.json();
    const lData = await lRes.json();
    setProperties(pData.properties || []);
    setLeads(lData.leads || []);
  };

  useEffect(() => {
    if (authenticated) {
      fetchAll();
    }
  }, [authenticated]);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setUploadedPhotoDataUrl(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPhoto =
      uploadedPhotoDataUrl ||
      imageUrl.trim() ||
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85";

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: password,
        title,
        district,
        address,
        price: Number(price),
        rooms: Number(rooms),
        area: Number(area),
        floor: Number(floor),
        totalFloors: Number(totalFloors),
        imageUrl: finalPhoto,
        features,
        description,
        badge,
      }),
    });

    if (res.ok) {
      // Полная очистка всех полей после публикации
      setTitle("");
      setAddress("");
      setPrice("");
      setRooms("");
      setArea("");
      setFloor("");
      setImageUrl("");
      setUploadedPhotoDataUrl("");
      setDescription("");

      setAddingMsg(
        "Квартира с фотографией успешно опубликована! (уведомление скроется через 15 секунд)"
      );
      fetchAll();
      setTimeout(() => setAddingMsg(""), 15000);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    await fetch(`/api/properties?id=${id}&password=${password}`, {
      method: "DELETE",
    });
    fetchAll();
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminPassword: password }),
    });
    fetchAll();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50 dark:bg-zinc-950">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                Vanguard Realty Admin
              </h1>
              <p className="text-xs text-zinc-500">
                Управление недвижимостью и заявками клиентов
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password.trim().length > 0) setAuthenticated(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5">
                Пароль администратора (по умолчанию: vanguard2026)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm"
            >
              Войти в панель управления
            </button>
          </form>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-500"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Вернуться на главную страницу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">
                Vanguard Realty — Админ-панель
              </h1>
              <p className="text-xs text-zinc-500">
                Синхронизировано с Neon Postgres и Telegram-ботом
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("leads")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                activeTab === "leads"
                  ? "bg-amber-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Users className="w-4 h-4" />
              Заявки клиентов ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab("properties")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                activeTab === "properties"
                  ? "bg-amber-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Home className="w-4 h-4" />
              Объекты недвижимости ({properties.length})
            </button>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:border-amber-500"
            >
              На сайт →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {activeTab === "leads" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">
                Все заявки на просмотр и подбор
              </h2>
              <p className="text-xs text-zinc-500">
                Сюда поступают заявки с сайта и из Telegram-бота (а также дублируются в Telegram-группу)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        {lead.source === "telegram_bot"
                          ? "Telegram-Бот"
                          : "Запись с сайта"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        ID: {lead.id}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold">
                      {lead.clientName}{" "}
                      {lead.telegramUsername && (
                        <span className="text-sm font-normal text-sky-500">
                          ({lead.telegramUsername})
                        </span>
                      )}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-300">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <b>{lead.phone}</b>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        Объект: <b>{lead.propertyTitle || "Подбор"}</b>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        День просмотра:{" "}
                        <b>
                          {lead.preferredDate}{" "}
                          {lead.preferredTime ? `в ${lead.preferredTime}` : ""}
                        </b>
                      </span>
                    </div>

                    {lead.notes && (
                      <p className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                        {lead.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(
                      [
                        ["new", "Новая"],
                        ["contacted", "В работе"],
                        ["viewing_scheduled", "Показ назначен"],
                        ["closed", "Сделка закрыта"],
                      ] as [LeadStatus, string][]
                    ).map(([st, label]) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(lead.id, st)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          lead.status === st
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <form
                onSubmit={handleAddProperty}
                className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-4 sticky top-6"
              >
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-amber-500" />
                  Добавить недвижимость
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">
                    Название ЖК / Резиденции *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Семейная резиденция в ЖК «Prime Park»"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">
                      Район *
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">
                      Стоимость (₽) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="34000000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">
                    Точный адрес *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ленинградский пр-т, д. 37"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">
                      Комнат *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="4"
                      value={rooms}
                      onChange={(e) => setRooms(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">
                      Площадь (м²) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="145"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">
                      Этаж *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="7"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                    />
                  </div>
                </div>

                {/* Бланк для загрузки фотографии квартиры */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-500">
                    Фотография квартиры (выберите файл с компьютера)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-amber-500/50 hover:border-amber-500 bg-zinc-50 dark:bg-zinc-950 cursor-pointer overflow-hidden relative">
                    {uploadedPhotoDataUrl ? (
                      <img
                        src={uploadedPhotoDataUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 space-y-1">
                        <Upload className="w-5 h-5 text-amber-500 mx-auto" />
                        <div className="text-xs font-bold text-amber-500">
                          Нажмите для выбора фото квартиры
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          JPG, PNG, WEBP
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    placeholder="Или вставьте ссылку на фото (необязательно)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">
                    Описание квартиры
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опишите видовые характеристики, планировку и преимущества..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20"
                >
                  Опубликовать квартиру в каталоге
                </button>

                {addingMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {addingMsg}
                  </div>
                )}
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={prop.imageUrl}
                      alt={prop.title}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-amber-500">
                        {prop.district} • {(prop.price / 1e6).toFixed(1)} млн ₽
                      </span>
                      <h3 className="text-base font-bold truncate">
                        {prop.title}
                      </h3>
                      <p className="text-xs text-zinc-500 truncate">
                        {prop.address} • {prop.rooms} комн. • {prop.area} м²
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProperty(prop.id)}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors shrink-0"
                    title="Удалить объект"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
