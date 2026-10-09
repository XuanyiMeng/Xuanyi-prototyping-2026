# Weather Near Me 🌤️

A real-time weather dashboard prototype that shows current conditions and a
5-day forecast for your location, powered by the free **OpenWeatherMap API**.

## What it does

- 📍 Auto-detects your location via the browser's Geolocation API
- 🔍 Falls back to a city name search
- 🌡️ Shows temperature (toggle °C / °F), feels-like, humidity, wind speed,
  sunrise and sunset times
- 📅 Displays a 5-day forecast strip with daily high/low temperatures
- 🎨 Macaron background gradients follow temperature: icy lavender below 0°C,
  mist blue below 10°C, pale aqua below 18°C, mint below 24°C, cream and peach
  below 30°C, and peach pink from 30°C. Dark text and frosted white cards keep
  weather information readable.
- Seasonal food decorations follow the current temperature: below 10°C hot
  drinks and noodles, 10–18°C autumn treats, 18–24°C strawberries and salads,
  24–30°C fruit and juice, and 30°C or above ice cream and icy drinks.
  Decorations appear after weather loads, with 16% opacity at the edges (10%
  on phones), a clear center, and no animation when reduced motion is enabled.

## Setup — Getting an API Key

This prototype uses the **free tier** of OpenWeatherMap. You don't need to
pay or provide a credit card.

1. Go to <https://openweathermap.org/api> and click **Sign Up**
2. After signing up, go to **My Profile → API keys**
3. Copy the default key (or create a new one)
4. Paste it into the API key panel in the prototype UI

> **Note:** New API keys can take up to 10 minutes to activate after sign-up.

Your key is stored in `sessionStorage` — it stays in the current browser tab
but is never sent anywhere except directly to OpenWeatherMap.

## Running locally

```bash
# From the repo root
npm run dev
```

Then open <http://localhost:3000/prototypes/weather-dashboard>

## File structure

```
weather-dashboard/
├── page.tsx            # Main React component
├── styles.module.css   # Macaron colors and frosted card styles
└── README.md           # This file
```

## Weather animation

The bottom-right illustrated buddy follows local temperature rather than the
calendar: below 10°C it is a snowman, 10–18°C adds an autumn scarf, 18–24°C
uses a mint spring shirt, and 24°C or above adds patterned beach shorts, a sun
hat, and sunglasses. Before weather loads it wears the default mint outfit.
Its gentle sway respects reduced motion, and it never intercepts clicks.

Current Rain, Drizzle, and Thunderstorm conditions show subtle falling rain;
Snow shows gently drifting snow. Other conditions have no precipitation effect.
These decorative CSS animations sit behind the weather cards and ignore pointer
events. Phones show fewer particles, and reduced-motion settings disable them.

## Local forecast motifs

The five forecast tiles use soft organic outlines and a decorative motif selected
from the weather location's country code (for example, sakura for Japan, maple
leaves for Canada, and tulips for the Netherlands). Unmapped countries use a leaf.
Weather descriptions remain visible below the motif, alongside both temperature
units, so the local decoration does not replace forecast information.
