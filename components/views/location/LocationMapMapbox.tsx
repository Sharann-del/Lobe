"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LocationMapEntry } from "./location-entries";

export interface LocationMapMapboxProps {
  accessToken: string;
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

function entriesToGeoJson(
  list: LocationMapEntry[]
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: list.map((e) => ({
      type: "Feature",
      properties: {
        pageId: e.page.id,
        title: e.label,
        icon: e.page.icon && e.page.icon.length > 0 ? e.page.icon : "📍",
      },
      geometry: {
        type: "Point",
        coordinates: [e.lng, e.lat],
      },
    })),
  };
}

export function LocationMapMapbox({
  accessToken,
  entries,
  highlightedId,
  addPinMode,
  onSelectPage,
  onMapClickLngLat,
  onOpenPage,
  className,
}: LocationMapMapboxProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const handlersRef = useRef<{
    onSelect: (_id: string) => void;
    onPin: (_lng: number, _lat: number) => void;
    onOpen?: (_id: string) => void;
  }>({ onSelect: onSelectPage, onPin: onMapClickLngLat, onOpen: onOpenPage });

  useEffect(() => {
    handlersRef.current = {
      onSelect: onSelectPage,
      onPin: onMapClickLngLat,
      onOpen: onOpenPage,
    };
  }, [onSelectPage, onMapClickLngLat, onOpenPage]);

  useEffect(() => {
    if (!containerRef.current) return;
    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: entries[0] ? [entries[0].lng, entries[0].lat] : [-98.35, 39.5],
      zoom: entries.length ? 3 : 2,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    const emptyCollection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };

    map.on("load", () => {
      map.addSource("pins", {
        type: "geojson",
        data: emptyCollection,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "pins",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#4a7ce0",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            10,
            22,
            50,
            28,
          ],
          "circle-opacity": 0.88,
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "pins",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: {
          "text-color": "#f0f0f0",
        },
      });

      map.addLayer({
        id: "unclustered",
        type: "circle",
        source: "pins",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#4a7ce0",
          "circle-radius": 10,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#111111",
        },
      });

      map.addLayer({
        id: "unclustered-icon",
        type: "symbol",
        source: "pins",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "icon"],
          "text-size": 14,
          "text-offset": [0, 0.1],
          "text-allow-overlap": true,
        },
        paint: {
          "text-opacity": 0.95,
        },
      });

      map.on("click", "clusters", (e) => {
        const feats = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = feats[0]?.properties?.cluster_id as number | undefined;
        const src = map.getSource("pins") as mapboxgl.GeoJSONSource;
        if (clusterId == null) return;
        src.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          const geom = feats[0]?.geometry;
          if (geom?.type !== "Point") return;
          const c = geom.coordinates as [number, number];
          map.easeTo({ center: c, zoom });
        });
      });

      map.on("click", "unclustered", (e) => {
        const add = map.getCanvas().dataset.addPin === "1";
        if (add) return;
        const f = e.features?.[0];
        const id = f?.properties?.pageId as string | undefined;
        const title = f?.properties?.title as string | undefined;
        if (!id || !e.lngLat) return;

        handlersRef.current.onSelect(id);
        popupRef.current?.remove();

        const entry = entriesRef.current.find((x) => x.page.id === id);
        const quick =
          entry?.quickProps
            .map(
              (p) =>
                `<div class="lobe-qp"><span>${escapeHtml(p.name)}</span> ${escapeHtml(p.value)}</div>`
            )
            .join("") ?? "";

        const el = document.createElement("div");
        el.className = "lobe-map-popup text-[var(--text-primary)]";
        el.innerHTML = `<div class="text-sm font-medium">${escapeHtml(title ?? "")}</div>${quick}<button type="button" class="mt-2 rounded-[var(--radius-sm)] bg-[var(--accent)] px-2 py-1 text-xs text-[var(--bg-0)]">Open</button>`;
        const btn = el.querySelector("button");
        btn?.addEventListener("click", () => {
          handlersRef.current.onOpen?.(id);
        });

        popupRef.current = new mapboxgl.Popup({ offset: 12 })
          .setLngLat(e.lngLat)
          .setDOMContent(el)
          .addTo(map);
      });

      map.on("click", (e) => {
        if (map.getCanvas().dataset.addPin !== "1") return;
        const layers = ["clusters", "cluster-count", "unclustered", "unclustered-icon"];
        const existing = layers.filter((l) => map.getLayer(l));
        if (existing.length > 0) {
          const hit = map.queryRenderedFeatures(e.point, { layers: existing });
          if (hit.length > 0) return;
        }
        handlersRef.current.onPin(e.lngLat.lng, e.lngLat.lat);
      });

      const cursorPointer = (): void => {
        map.getCanvas().style.cursor = "pointer";
      };
      const cursorDefault = (): void => {
        map.getCanvas().style.cursor = "";
      };
      for (const layer of ["clusters", "unclustered", "unclustered-icon"]) {
        map.on("mouseenter", layer, cursorPointer);
        map.on("mouseleave", layer, cursorDefault);
      }

      (map.getSource("pins") as mapboxgl.GeoJSONSource).setData(
        entriesToGeoJson(entriesRef.current)
      );
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps -- map mounts once; pin data synced below

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("pins")) return;
    (map.getSource("pins") as mapboxgl.GeoJSONSource).setData(
      entriesToGeoJson(entries)
    );
  }, [entries]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("unclustered")) return;
    map.setPaintProperty("unclustered", "circle-color", [
      "case",
      ["==", ["get", "pageId"], highlightedId ?? ""],
      "#e8e8e8",
      "#4a7ce0",
    ]);
  }, [highlightedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().dataset.addPin = addPinMode ? "1" : "0";
    map.getCanvas().style.cursor = addPinMode ? "crosshair" : "";
  }, [addPinMode]);

  useEffect(() => {
    if (!highlightedId) return;
    const e = entries.find((x) => x.page.id === highlightedId);
    if (e && mapRef.current) {
      mapRef.current.flyTo({ center: [e.lng, e.lat], zoom: 14 });
    }
  }, [highlightedId, entries]);

  return <div ref={containerRef} className={className} />;
}
