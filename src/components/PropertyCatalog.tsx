"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  BedDouble,
  Maximize2,
  Building,
  CalendarCheck,
  Filter,
  RotateCcw,
} from "lucide-react";
import { Property } from "@/types/estate";

interface PropertyCatalogProps {
  properties: Property[];
  onSelectPropertyForBooking: (property: Property) => void;
}

export function PropertyCatalog({
  properties,
  onSelectPropertyForBooking,
}: PropertyCatalogProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedRooms, setSelectedRooms] = useState<string>("all");
  const [maxPriceMillions, setMaxPriceMillions] = useState<number>(80);

  const districts = useMemo(() => {
    const set = new Set(properties.map((p) => p.district));
    return Array.from(set);
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchDistrict =
        selectedDistrict === "all" || p.district === selectedDistrict;
      const matchRooms =
        selectedRooms === "all" ||
        (selectedRooms === "4+"
          ? p.rooms >= 4
          : p.rooms === Number(selectedRooms));
      const matchBudget = p.price <= maxPriceMillions * 1_000_000;
      return matchDistrict && matchRooms && matchBudget;
    });
  }, [properties, selectedDistrict, selectedRooms, maxPriceMillions]);

  const resetFilters = () => {
    setSelectedDistrict("all");
    setSelectedRooms("all");
    setMaxPriceMillions(80);
  };

  return (
    <section id="catalog" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Заголовок секции с плавным появлением при скролле */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
              КАТАЛОГ РЕЗИДЕНЦИЙ VANGUARD
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white mt-2">
              Актуальные предложения недвижимости
            </h2>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
            Фильтруйте объекты по району, количеству комнат и бюджету. Нажмите
            «Записаться на просмотр», чтобы выбрать удобный день визита.
          </p>
        </motion.div>

        {/* Панель фильтров */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6 rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Район города
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">Все районы ({properties.length})</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Количество комнат
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {["all", "1", "2", "3", "4+"].map((roomOpt) => (
                <button
                  key={roomOpt}
                  onClick={() => setSelectedRooms(roomOpt)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedRooms === roomOpt
                      ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                      : "bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50"
                  }`}
                >
                  {roomOpt === "all" ? "Все" : roomOpt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              <span>Бюджет до:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {maxPriceMillions} млн ₽
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={85}
              step={1}
              value={maxPriceMillions}
              onChange={(e) => setMaxPriceMillions(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              Найдено: <b>{filteredProperties.length}</b>
            </span>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Сбросить
            </button>
          </div>
        </motion.div>

        {/* Сетка карточек с каскадной анимацией при скролле */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property, index) => (
            <motion.article
              key={property.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="group rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/90 shadow-lg hover:shadow-2xl hover:border-amber-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={property.imageUrl}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                  {property.badge && (
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md">
                      {property.badge}
                    </span>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                    <div>
                      <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {property.district}
                      </span>
                      <div className="text-2xl font-extrabold tracking-tight">
                        {(property.price / 1_000_000).toFixed(1)} млн ₽
                      </div>
                    </div>
                    <span className="text-xs bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
                      {Math.round(property.price / property.area / 1000)} тыс. ₽/м²
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {property.address}
                    </p>
                  </div>

                  {/* Характеристики */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-100 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-amber-500" />
                      <span>{property.rooms} комн.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-4 h-4 text-amber-500" />
                      <span>{property.area} м²</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-amber-500" />
                      <span>
                        {property.floor}/{property.totalFloors} эт.
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {property.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {property.features.slice(0, 3).map((feat) => (
                      <span
                        key={feat}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => onSelectPropertyForBooking(property)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 dark:bg-amber-500 hover:bg-amber-600 dark:hover:bg-amber-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Выбрать день просмотра
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
