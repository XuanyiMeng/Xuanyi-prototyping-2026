"use client";

import { useEffect, useRef, useState } from "react";
import type { Map, CircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./styles.module.css";

type Point = { lat: number; lon: number };

export default function WeatherMap({ point, onSelect, busy, summary }: {
  point: Point | null;
  onSelect: (lat: number, lon: number) => void;
  busy: boolean;
  summary: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<CircleMarker | null>(null);
  const select = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  select.current = onSelect;

  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    import("leaflet").then(L => {
      if (disposed || !container.current) return;
      const instance = L.map(container.current, {
        center: [25, 10], zoom: 2, minZoom: 2, maxZoom: 18,
        scrollWheelZoom: false, worldCopyJump: true,
      });
      map.current = instance;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).on("tileerror", () => setFailed(true)).addTo(instance);
      marker.current = L.circleMarker([0, 0], {
        radius: 9, color: "#685c93", fillColor: "#e8b9d0", fillOpacity: 1, weight: 3,
      });
      instance.on("click", (event: L.LeafletMouseEvent) => {
        const location = event.latlng.wrap();
        select.current(Math.max(-90, Math.min(90, location.lat)), location.lng);
      });
      observer = new ResizeObserver(() => instance.invalidateSize());
      observer.observe(container.current);
      setReady(true);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => {
      disposed = true;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !point || !map.current || !marker.current) return;
    marker.current.setLatLng([point.lat, point.lon]).addTo(map.current);
    map.current.setView([point.lat, point.lon], Math.max(4, map.current.getZoom()), { animate: false });
  }, [point, ready]);

  return (
    <section className={styles.mapSection} aria-labelledby="weather-map-title">
      <h2 className={styles.mapTitle} id="weather-map-title">Explore today’s weather</h2>
      <p className={styles.mapHint}>Click anywhere to check the weather. Drag to explore and use + / − to zoom.</p>
      <div ref={container} className={styles.mapCanvas} aria-label="Interactive weather map" />
      <div className={styles.mapBottom}>
        <p className={styles.mapStatus} role="status">
          {busy ? "Fetching weather for your selection…" : summary || "Choose a spot on the map to get started."}
        </p>
        <button className={styles.citySubmit} disabled={!ready || busy} onClick={() => {
          const center = map.current?.getCenter().wrap();
          if (center) select.current(Math.max(-90, Math.min(90, center.lat)), center.lng);
        }}>Check map center</button>
      </div>
      {failed && <p className={styles.mapHint}>Map tiles could not load. You can still search by city above or try refreshing.</p>}
    </section>
  );
}
