"use client";

/**
 * Weather Dashboard Prototype
 *
 * Displays real-time weather data for the user's current location (or a
 * manually searched city) using the free OpenWeatherMap API.
 *
 * Features:
 * - Browser Geolocation auto-detect
 * - City name search fallback
 * - Current conditions: temp, feels-like, humidity, wind, description
 * - °C / °F toggle
 * - 5-day forecast strip
 * - API key entered in the UI and stored in sessionStorage (no .env needed)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import styles from "./styles.module.css";
import WeatherMap from "./WeatherMap";
import SeasonalBuddy from "./SeasonalBuddy";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CurrentWeather {
  city: string;
  country: string;
  temp: number;       // Kelvin from API
  feelsLike: number;  // Kelvin
  humidity: number;   // %
  windSpeed: number;  // m/s
  description: string;
  icon: string;
  condition: string;  // main condition group e.g. "Rain", "Clear"
  sunrise: number;    // Unix timestamp
  sunset: number;
}

interface ForecastDay {
  date: string;       // e.g. "Mon 10"
  icon: string;
  description: string;
  tempMin: number;    // Kelvin
  tempMax: number;    // Kelvin
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert Kelvin to Celsius */
const toCelsius = (k: number) => Math.round(k - 273.15);

/** Convert Kelvin to Fahrenheit */
const toFahrenheit = (k: number) => Math.round((k - 273.15) * 9 / 5 + 32);

/** Format a unix timestamp + timezone offset into a short weekday + day string */
const formatDay = (unixTs: number, tzOffset: number) => {
  const d = new Date((unixTs + tzOffset) * 1000);
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", timeZone: "UTC" });
};

/** Use the same Celsius boundaries as the seasonal food decorations. */
const temperatureTheme = (kelvin: number): string => {
  const c = kelvin - 273.15;
  if (c < 0) return styles.themeFreezing;
  if (c < 10) return styles.themeCold;
  if (c < 18) return styles.themeCool;
  if (c < 24) return styles.themeMild;
  if (c < 30) return styles.themeWarm;
  return styles.themeHot;
};

/** Map condition to a large animated emoji icon */
const conditionEmoji = (condition: string, isNight: boolean): string => {
  if (isNight) {
    if (condition === "Clear") return "🌙";
    if (condition === "Clouds") return "☁️";
  }
  switch (condition) {
    case "Clear":        return "☀️";
    case "Clouds":       return "⛅";
    case "Rain":         return "🌧️";
    case "Drizzle":      return "🌦️";
    case "Thunderstorm": return "⛈️";
    case "Snow":         return "❄️";
    case "Mist":
    case "Fog":
    case "Haze":         return "🌫️";
    default:             return "🌡️";
  }
};

// Country codes come from the searched location, rather than the browser language.
// These are decorative design motifs; weather remains available as text.
const LOCAL_MOTIFS: Record<string, { icon: string; label: string }> = {
  JP: { icon: "🌸", label: "Sakura" },
  CN: { icon: "🏮", label: "Lantern" },
  CA: { icon: "🍁", label: "Maple leaf" },
  NL: { icon: "🌷", label: "Tulip" },
  FR: { icon: "⚜️", label: "Fleur-de-lis" },
  AU: { icon: "🐨", label: "Koala" },
  NZ: { icon: "🥝", label: "Kiwi fruit" },
  GB: { icon: "🌹", label: "Rose" },
  US: { icon: "🗽", label: "Statue of Liberty" },
  IT: { icon: "🍋", label: "Lemon" },
  KR: { icon: "🌺", label: "Hibiscus" },
  CH: { icon: "🏔️", label: "Alpine mountains" },
  BR: { icon: "🦜", label: "Parrot" },
  IN: { icon: "🪷", label: "Lotus" },
  TH: { icon: "🐘", label: "Elephant" },
  MX: { icon: "🌵", label: "Cactus" },
};

function locationMotif(country: string) {
  return LOCAL_MOTIFS[country.toUpperCase()] ?? { icon: "🌿", label: "Leaf" };
}

// ─── Food background ──────────────────────────────────────────────────────────

/**
 * Returns a set of food emojis based on temperature (Celsius).
 * Each emoji has a random but seed-stable position and animation delay
 * so the background feels organic without jumping around on re-renders.
 */
const FOOD_SETS: Record<string, string[]> = {
  // < 0 °C — 严冬：热可可、乌冬面、火锅、拉面
  freezing:  ["☕", "🍜", "🫕", "🍲", "🧇", "🫖", "🍵", "🥟", "☕", "🍜"],
  // 0–10 °C — 寒冷：热汤、面包、姜饼
  cold:      ["☕", "🍜", "🫖", "🍲", "🥐", "🍵", "🥮", "☕", "🍞", "🍜"],
  // 10–18 °C — 凉爽：秋日南瓜、苹果派、板栗
  cool:      ["🎃", "🍎", "🌰", "🥧", "🍂", "🍄", "🫐", "🍎", "🌰", "🥧"],
  // 18–24 °C — 温和：草莓、沙拉、春日便当
  mild:      ["🍓", "🥗", "🧁", "🍱", "🌸", "🍡", "🍓", "🥗", "🌸", "🍱"],
  // 24–30 °C — 温暖：橙汁、西瓜、柠檬水
  warm:      ["🍊", "🍉", "🍋", "🥤", "🧃", "🌽", "🍹", "🍊", "🍉", "🍋"],
  // > 30 °C — 盛夏：冰淇淋、刨冰、雪糕
  hot:       ["🍦", "🧊", "🍧", "🍡", "🥭", "🍹", "🍦", "🧃", "🍧", "🍡"],
};

/** Pick the right food set from temperature in Kelvin */
function foodSetFromKelvin(kelvin: number): string[] {
  const c = kelvin - 273.15;
  if (c < 0)   return FOOD_SETS.freezing;
  if (c < 10)  return FOOD_SETS.cold;
  if (c < 18)  return FOOD_SETS.cool;
  if (c < 24)  return FOOD_SETS.mild;
  if (c < 30)  return FOOD_SETS.warm;
  return FOOD_SETS.hot;
}

interface FoodItem {
  emoji: string;
  top: number;    // % from top
  left: number;   // % from left
  size: number;   // rem
  delay: number;  // animation-delay in seconds
  duration: number; // animation-duration in seconds
  rotate: number; // initial rotation in deg
}

/** Generate stable food item positions from a simple seeded PRNG */
function buildFoodItems(emojis: string[]): FoodItem[] {
  // Simple LCG-style seeded random so positions stay constant between renders
  let s = 42;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; };

  return emojis.map((emoji, index) => ({
    emoji,
    top:      15 + Math.floor(index / 2) * 17 + rand() * 4,
    left:     index % 2 === 0 ? 4 + rand() * 10 : 86 + rand() * 10,
    size:     2.8 + rand() * 2,   // 2.8–4.8 rem
    delay:    -rand() * 20,      // Start at different points in the gentle float
    duration: 24 + rand() * 12,
    rotate:   rand() * 30 - 15,   // –15° to +15° tilt
  }));
}

/** Decorative floating food background — pointer-events: none so it's inert */
function FoodBackground({ tempKelvin }: { tempKelvin: number }) {
  const emojis = foodSetFromKelvin(tempKelvin);
  const items  = buildFoodItems(emojis);

  return (
    <div className={styles.foodBg} aria-hidden="true">
      {items.map((item, i) => (
        <span
          key={i}
          className={styles.foodItem}
          style={{
            top:             `${item.top}%`,
            left:            `${item.left}%`,
            fontSize:        `${item.size}rem`,
            animationDelay:  `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            rotate:          `${item.rotate}deg`,
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}

/** Stable positions and negative delays make precipitation start across the sky. */
function WeatherBackground({ condition }: { condition: string }) {
  const snow = condition === "Snow";
  const rain = ["Rain", "Drizzle", "Thunderstorm"].includes(condition);
  if (!snow && !rain) return null;

  const count = snow ? 36 : condition === "Drizzle" ? 24 : 52;
  return (
    <div className={styles.weatherBg} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const variation = ((i * 37 + 11) % 101) / 100;
        const duration = snow ? 10 + variation * 9 : 1.4 + variation * 1.2;
        return (
          <span
            key={`${condition}-${i}`}
            className={snow ? styles.snowflake : styles.raindrop}
            style={{
              left: `${(i * 61.8) % 108 - 4}%`,
              opacity: snow ? 0.3 + variation * 0.35 : 0.15 + variation * 0.18,
              animationDuration: `${duration}s`,
              animationDelay: `${-duration * ((i * 0.381) % 1)}s`,
              ...(snow ? { width: `${4 + variation * 5}px`, height: `${4 + variation * 5}px` } : {}),
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeatherDashboard() {
  // API key stored in session so user only types it once per browser tab
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [showKeyPanel, setShowKeyPanel] = useState(false);

  // Location & search state
  const [cityInput, setCityInput] = useState("");
  const [locating, setLocating] = useState(false);

  const [mapPoint, setMapPoint] = useState<{ lat: number; lon: number } | null>(null);
  const requestBusy = useRef(false);

  // Weather data
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load saved API key from sessionStorage on mount, fallback to env variable
  useEffect(() => {
    const saved = sessionStorage.getItem("owm_api_key");
    const envKey = process.env.NEXT_PUBLIC_OWM_API_KEY ?? "";
    if (saved) {
      setApiKey(saved);
    } else if (envKey) {
      // Env variable is set — use it silently (no panel needed)
      setApiKey(envKey);
      setShowKeyPanel(false);
    } else {
      setShowKeyPanel(true); // Show panel if no key found anywhere
    }
  }, []);

  // ── Format temperature showing both °C and °F at the same time
  const formatTempBoth = (kelvin: number) =>
    ({ c: `${toCelsius(kelvin)}°C`, f: `${toFahrenheit(kelvin)}°F` });

  // ── Fetch weather by coordinates
  const fetchByCoords = useCallback(
    async (lat: number, lon: number, key: string) => {
      if (requestBusy.current) return;
      requestBusy.current = true;
      setLoading(true);
      setError(null);
      try {
        const [curRes, fcsRes] = await Promise.all([
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}`
          ),
          fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}`
          ),
        ]);

        if (!curRes.ok) {
          const data = await curRes.json();
          throw new Error(data.message || "Failed to fetch weather");
        }
        if (!fcsRes.ok) {
          const data = await fcsRes.json();
          throw new Error(data.message || "Failed to fetch forecast");
        }

        const curData = await curRes.json();
        const fcsData = await fcsRes.json();

        // Parse current conditions
        setCurrent({
          city: curData.name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
          country: curData.sys.country ?? "",
          temp: curData.main.temp,
          feelsLike: curData.main.feels_like,
          humidity: curData.main.humidity,
          windSpeed: curData.wind.speed,
          description: curData.weather[0].description,
          icon: curData.weather[0].icon,
          condition: curData.weather[0].main,
          sunrise: curData.sys.sunrise,
          sunset: curData.sys.sunset,
        });

        // Parse 5-day forecast: group the 3-hour slots by calendar day
        const tzOffset: number = curData.timezone; // seconds
        const dayMap = new Map<string, { min: number; max: number; icon: string; desc: string }>();

        for (const slot of fcsData.list) {
          const dayLabel = formatDay(slot.dt, tzOffset);
          const existing = dayMap.get(dayLabel);
          if (!existing) {
            dayMap.set(dayLabel, {
              min: slot.main.temp_min,
              max: slot.main.temp_max,
              icon: slot.weather[0].icon,
              desc: slot.weather[0].description,
            });
          } else {
            existing.min = Math.min(existing.min, slot.main.temp_min);
            existing.max = Math.max(existing.max, slot.main.temp_max);
          }
        }

        // Take the next 5 days (skip today if we already have it)
        const days: ForecastDay[] = [];
        for (const [date, data] of dayMap.entries()) {
          if (days.length >= 5) break;
          days.push({
            date,
            icon: data.icon,
            description: data.desc,
            tempMin: data.min,
            tempMax: data.max,
          });
        }
        setForecast(days);
        setMapPoint({ lat, lon });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        requestBusy.current = false;
        setLoading(false);
      }
    },
    []
  );

  // ── Fetch weather by city name
  const fetchByCity = useCallback(
    async (city: string, key: string) => {
      setLoading(true);
      setError(null);
      try {
        const geoRes = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${key}`
        );
        if (!geoRes.ok) throw new Error("Geocoding request failed");
        const geoData = await geoRes.json();
        if (!geoData.length) throw new Error(`City "${city}" not found`);
        await fetchByCoords(geoData[0].lat, geoData[0].lon, key);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    },
    [fetchByCoords]
  );

  // ── Use browser geolocation
  const handleGeolocate = useCallback(() => {
    if (!apiKey) {
      setShowKeyPanel(true);
      setError("Please enter your OpenWeatherMap API key first.");
      return;
    }
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        fetchByCoords(pos.coords.latitude, pos.coords.longitude, apiKey);
      },
      () => {
        setLocating(false);
        setError("Location access denied. Try searching for a city instead.");
      }
    );
  }, [apiKey, fetchByCoords]);

  // ── Search by city name
  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setShowKeyPanel(true);
      setError("Please enter your OpenWeatherMap API key first.");
      return;
    }
    if (!cityInput.trim()) return;
    fetchByCity(cityInput.trim(), apiKey);
  };

  // ── Save API key
  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    sessionStorage.setItem("owm_api_key", trimmed);
    setApiKey(trimmed);
    setApiKeyInput("");
    setShowKeyPanel(false);
    setError(null);
    // Auto-trigger geolocation after key is saved
    handleGeolocateAfterKey(trimmed);
  };

  // Helper: geolocate immediately after saving key (avoids stale closure)
  const handleGeolocateAfterKey = (key: string) => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        fetchByCoords(pos.coords.latitude, pos.coords.longitude, key);
      },
      () => {
        setLocating(false);
      }
    );
  };

  // ── Determine day/night
  const isNight = current
    ? Date.now() / 1000 > current.sunset || Date.now() / 1000 < current.sunrise
    : false;

  const themeClass = current
    ? temperatureTheme(current.temp)
    : styles.themeDefault;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`${styles.wrapper} ${themeClass}`}>
      {current && <FoodBackground tempKelvin={current.temp} />}
      {current && <WeatherBackground condition={current.condition} />}
      <SeasonalBuddy tempKelvin={current?.temp} />

      {/* ── Top Navigation ── */}
      <header className={styles.topNav}>
        <Link href="/" className={styles.backLink}>← Home</Link>
        <span className={styles.navTitle}>Weather Near Me</span>
        <button
          className={`${styles.keyBtn} ${apiKey ? styles.keyBtnActive : ""}`}
          onClick={() => setShowKeyPanel(!showKeyPanel)}
          title="OpenWeatherMap API Key"
        >
          🔑 {apiKey ? "Key saved" : "Add API key"}
        </button>
      </header>

      {/* ── API Key Panel ── */}
      {showKeyPanel && (
        <div className={styles.keyPanel}>
          <p className={styles.keyPanelTitle}>OpenWeatherMap API Key</p>
          <p className={styles.keyPanelHint}>
            Get a free key at{" "}
            <a href="https://openweathermap.org/api" target="_blank" rel="noreferrer">
              openweathermap.org
            </a>
            . It&apos;s free and takes ~2 minutes. Your key is only stored in this browser tab.
          </p>
          <form className={styles.keyForm} onSubmit={handleSaveKey}>
            <input
              id="api-key-input"
              className={styles.keyInput}
              type="password"
              placeholder="Paste your API key here…"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              autoFocus
            />
            <button className={styles.keySubmit} type="submit" disabled={!apiKeyInput.trim()}>
              Save & Fetch Weather
            </button>
          </form>
          {apiKey && (
            <button
              className={styles.keyRemove}
              onClick={() => {
                sessionStorage.removeItem("owm_api_key");
                setApiKey("");
                setCurrent(null);
                setMapPoint(null);
                setForecast([]);
                setShowKeyPanel(true);
              }}
            >
              Remove saved key
            </button>
          )}
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className={styles.searchBar}>
        <button
          className={styles.geoBtn}
          onClick={handleGeolocate}
          disabled={locating || loading}
          title="Use my current location"
        >
          {locating ? "📡 Locating…" : "📍 Use my location"}
        </button>

        <form className={styles.cityForm} onSubmit={handleCitySearch}>
          <input
            id="city-search-input"
            className={styles.cityInput}
            type="text"
            placeholder="Or search a city…"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
          />
          <button
            className={styles.citySubmit}
            type="submit"
            disabled={loading || !cityInput.trim()}
          >
            Search
          </button>
        </form>

      </div>

      <WeatherMap
        point={mapPoint}
        busy={loading || locating}
        summary={current ? `${current.city} · ${formatTempBoth(current.temp).c} / ${formatTempBoth(current.temp).f} · ${current.description}` : ""}
        onSelect={(lat, lon) => {
          if (loading || locating || requestBusy.current) return;
          if (!apiKey) {
            setShowKeyPanel(true);
            setError("Please enter your OpenWeatherMap API key first.");
            return;
          }
          fetchByCoords(lat, lon, apiKey);
        }}
      />

      {/* ── Error Banner ── */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && (
        <div className={styles.loadingWrap} aria-live="polite">
          <div className={styles.spinner} />
          <p>Fetching weather…</p>
        </div>
      )}

      {/* ── Empty / Welcome State ── */}
      {!loading && !current && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🌍</div>
          <h1 className={styles.emptyTitle}>Weather Near Me</h1>
          <p className={styles.emptySubtitle}>
            {apiKey
              ? "Click \"Use my location\" or search for a city to get started."
              : "Add your OpenWeatherMap API key above to get started."}
          </p>
          {!apiKey && (
            <button className={styles.emptyKeyBtn} onClick={() => setShowKeyPanel(true)}>
              🔑 Add API Key
            </button>
          )}
          {apiKey && (
            <button className={styles.geoBtn} onClick={handleGeolocate} disabled={locating}>
              📍 Use my location
            </button>
          )}
        </div>
      )}

      {/* ── Main Weather Display ── */}
      {!loading && current && (
        <main className={styles.main}>

          {/* Current Conditions Card */}
          <section className={styles.currentCard} aria-label="Current weather">
            <div className={styles.currentTop}>
              <div className={styles.locationInfo}>
                <h1 className={styles.cityName}>
                  {current.city}
                  <span className={styles.countryBadge}>{current.country}</span>
                </h1>
                <p className={styles.conditionDesc}>{current.description}</p>
              </div>
              <div className={styles.weatherIcon} aria-hidden="true">
                {conditionEmoji(current.condition, isNight)}
              </div>
            </div>

            <div className={styles.tempRow}>
              <div className={styles.mainTempWrap}>
                <span className={styles.mainTemp}>{formatTempBoth(current.temp).c}</span>
                <span className={styles.mainTempAlt}>{formatTempBoth(current.temp).f}</span>
              </div>
              <div className={styles.feelsLike}>
                Feels like{" "}
                <strong>{formatTempBoth(current.feelsLike).c}</strong>
                <span className={styles.feelsLikeAlt}> / {formatTempBoth(current.feelsLike).f}</span>
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>💧</span>
                <span className={styles.statValue}>{current.humidity}%</span>
                <span className={styles.statLabel}>Humidity</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>🌬️</span>
                <span className={styles.statValue}>{Math.round(current.windSpeed * 3.6)} km/h</span>
                <span className={styles.statLabel}>Wind</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>🌅</span>
                <span className={styles.statValue}>
                  {new Date(current.sunrise * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={styles.statLabel}>Sunrise</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>🌇</span>
                <span className={styles.statValue}>
                  {new Date(current.sunset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={styles.statLabel}>Sunset</span>
              </div>
            </div>
          </section>

          {/* 5-Day Forecast Strip */}
          {forecast.length > 0 && (
            <section className={styles.forecastSection} aria-label="5-day forecast">
              <h2 className={styles.forecastTitle}>5-Day Forecast · {current.city}</h2>
              <div className={styles.forecastStrip}>
                {forecast.map((day) => (
                  <div key={day.date} className={`${styles.forecastCard} ${current.country === "JP" ? styles.forecastSakura : ""}`}>
                    <span className={styles.forecastDate}>{day.date}</span>
                    <span
                      className={styles.forecastMotif}
                      role="img"
                      aria-label={locationMotif(current.country).label}
                      title={locationMotif(current.country).label}
                    >
                      {locationMotif(current.country).icon}
                    </span>
                    <span className={styles.forecastDescription}>{day.description}</span>
                    <div className={styles.forecastTemps}>
                      <span className={styles.forecastHigh}>{formatTempBoth(day.tempMax).c}</span>
                      <span className={styles.forecastHighAlt}>{formatTempBoth(day.tempMax).f}</span>
                    </div>
                    <div className={styles.forecastTemps}>
                      <span className={styles.forecastLow}>{formatTempBoth(day.tempMin).c}</span>
                      <span className={styles.forecastLowAlt}>{formatTempBoth(day.tempMin).f}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      <footer className={styles.footer}>
        <p>Powered by <a href="https://openweathermap.org" target="_blank" rel="noreferrer">OpenWeatherMap</a></p>
      </footer>
    </div>
  );
}
