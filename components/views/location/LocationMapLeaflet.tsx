"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster";
import type { LocationMapEntry } from "./location-entries";

export interface LocationMapLeafletProps {
  entries: LocationMapEntry[];
  highlightedId: string | null;
  addPinMode: boolean;
  onSelectPage: (_pageId: string) => void;
  onMapClickLngLat: (_lng: number, _lat: number) => void;
  onOpenPage?: (_pageId: string) => void;
  className?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type MarkerClusterGroup = L.Layer & {
  clearLayers(): void;
  addLayer(_layer: L.Layer): void;
};

export function LocationMapLeaflet({
  entries,
  highlightedId,
  addPinMode,
  onSelectPage,
  onMapClickLngLat,
  onOpenPage,
  className,
}: LocationMapLeafletProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<MarkerClusterGroup | null>(null);
  const addPinRef = useRef(addPinMode);
  addPinRef.current = addPinMode;

  const handlersRef = useRef({
    onSelect: onSelectPage,
    onPin: onMapClickLngLat,
    onOpen: onOpenPage,
  });
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    handlersRef.current = {
      onSelect: onSelectPage,
      onPin: onMapClickLngLat,
      onOpen: onOpenPage,
    };
  }, [onSelectPage, onMapClickLngLat, onOpenPage]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const cluster = (
      L as unknown as {
        markerClusterGroup(_options?: object): MarkerClusterGroup;
      }
    ).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
    });
    map.addLayer(cluster);
    clusterRef.current = cluster;
    mapRef.current = map;

    const first = entriesRef.current[0];
    if (first) {
      map.setView([first.lat, first.lng], 5);
    } else {
      map.setView([39.5, -98.35], 3);
    }

    map.on("click", (e) => {
      if (!addPinRef.current) return;
      const t = e.originalEvent.target as HTMLElement | null;
      if (t?.closest?.(".leaflet-marker-icon, .marker-cluster")) return;
      handlersRef.current.onPin(e.latlng.lng, e.latlng.lat);
    });

    return () => {
      cluster.clearLayers();
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;

    cluster.clearLayers();

    for (const e of entries) {
      const iconHtml = `<div class="lobe-leaflet-pin-inner">${escapeHtml(e.page.icon ?? "📍")}</div>`;
      const icon = L.divIcon({
        html: iconHtml,
        className: "lobe-leaflet-pin-wrap",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([e.lat, e.lng], { icon });
      const quick = e.quickProps
        .map(
          (p) =>
            `<div class="text-xs"><span class="font-medium">${escapeHtml(p.name)}</span> ${escapeHtml(p.value)}</div>`
        )
        .join("");
      marker.bindPopup(
        `<div class="min-w-[180px] p-1"><div class="mb-1 text-sm font-medium">${escapeHtml(e.label)}</div>${quick}<button type="button" class="lobe-leaflet-open mt-2 w-full rounded-[var(--radius-sm)] bg-[var(--accent)] px-2 py-1 text-xs text-[var(--bg-0)]" data-page="${e.page.id}">Open</button></div>`
      );

      marker.on("click", () => {
        if (addPinRef.current) return;
        handlersRef.current.onSelect(e.page.id);
      });

      marker.on("popupopen", () => {
        const popup = marker.getPopup();
        const el = popup?.getElement() ?? null;
        const btn = el?.querySelector(
          "button.lobe-leaflet-open"
        ) as HTMLButtonElement | null;
        if (btn) {
          const pid = btn.dataset.page;
          btn.onclick = () => {
            if (pid) handlersRef.current.onOpen?.(pid);
          };
        }
      });

      cluster.addLayer(marker);
    }
  }, [entries]);

  useEffect(() => {
    if (!highlightedId || !mapRef.current) return;
    const e = entries.find((x) => x.page.id === highlightedId);
    if (e) {
      mapRef.current.setView([e.lat, e.lng], 14, { animate: true });
    }
  }, [highlightedId, entries]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    if (addPinMode) {
      root.classList.add("cursor-crosshair");
    } else {
      root.classList.remove("cursor-crosshair");
    }
  }, [addPinMode]);

  return <div ref={containerRef} className={className} />;
}
