"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  TooltipProvider,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useGridViewStore } from "@/lib/stores/gridViewStore";
import { useSectionTreeStore } from "@/lib/stores/sectionTreeStore";
import { useLocationViewStore } from "@/lib/stores/locationViewStore";
import { getSortedDatabaseRows } from "@/lib/views/section-view-rows";
import { PROPERTY_TYPE_ICONS } from "@/lib/views/property-icons";
import { buildLocationEntries } from "./location/location-entries";
import { filterLocationEntries } from "./location/filter-entries";
import { LocationSidePanel } from "./location/LocationSidePanel";
import type { NodeRow } from "@/lib/types/nodes";
import type { PropertySchema } from "@/lib/types/properties";
import type { LocationValue } from "@/lib/types/properties";
import "./location/location.css";

const LocationMapMapbox = dynamic(
  () =>
    import("./location/LocationMapMapbox").then((m) => m.LocationMapMapbox),
  { ssr: false }
);

const LocationMapLeaflet = dynamic(
  () =>
    import("./location/LocationMapLeaflet").then((m) => m.LocationMapLeaflet),
  { ssr: false }
);

const EMPTY_IDS: string[] = [];

export interface LocationViewProps {
  workspaceId: string;
  sectionNodeId: string;
  userId: string;
  onOpenPage: (_pageId: string) => void;
  className?: string;
}

export function LocationView({
  workspaceId,
  sectionNodeId,
  userId,
  onOpenPage,
  className,
}: LocationViewProps): React.ReactElement {
  const [mapReady, setMapReady] = useState(false);

  const setContext = useGridViewStore((s) => s.setContext);
  const fetchSchemas = useGridViewStore((s) => s.fetchSchemas);
  const fetchProperties = useGridViewStore((s) => s.fetchProperties);
  const schemas = useGridViewStore((s) => s.schemas);
  const propertiesByNode = useGridViewStore((s) => s.propertiesByNode);
  const sort = useGridViewStore((s) => s.sort);
  const updatePropertyValue = useGridViewStore((s) => s.updatePropertyValue);

  const nodesById = useSectionTreeStore((s) => s.nodesById);
  const childIdsByParent = useSectionTreeStore((s) => s.childIdsByParent);
  const childIds = useMemo(
    () =>
      childIdsByParent[sectionNodeId] ??
      childIdsByParent["root"] ??
      EMPTY_IDS,
    [childIdsByParent, sectionNodeId]
  );
  const addChildNodeOptimistic = useSectionTreeStore(
    (s) => s.addChildNodeOptimistic
  );
  const persistNewNode = useSectionTreeStore((s) => s.persistNewNode);

  const locationPropertyId = useLocationViewStore((s) => s.locationPropertyId);
  const searchQuery = useLocationViewStore((s) => s.searchQuery);
  const highlightedPageId = useLocationViewStore((s) => s.highlightedPageId);
  const addPinMode = useLocationViewStore((s) => s.addPinMode);
  const setLocationPropertyId = useLocationViewStore(
    (s) => s.setLocationPropertyId
  );
  const setSearchQuery = useLocationViewStore((s) => s.setSearchQuery);
  const setHighlightedPageId = useLocationViewStore(
    (s) => s.setHighlightedPageId
  );
  const setAddPinMode = useLocationViewStore((s) => s.setAddPinMode);

  useEffect(() => {
    setContext(workspaceId, sectionNodeId);
    void fetchSchemas();
  }, [workspaceId, sectionNodeId, setContext, fetchSchemas]);

  const childIdsKey = childIds.join(",");
  useEffect(() => {
    if (childIds.length > 0) {
      void fetchProperties(childIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childIdsKey]);

  const schemaMap = useMemo(() => {
    const map = new Map<string, PropertySchema>();
    for (const s of schemas) map.set(s.id, s);
    return map;
  }, [schemas]);

  const locationSchemas = useMemo(
    () => schemas.filter((s) => s.type === "location"),
    [schemas]
  );

  useEffect(() => {
    if (locationPropertyId) return;
    const first = locationSchemas[0];
    if (first) setLocationPropertyId(first.id);
  }, [locationPropertyId, locationSchemas, setLocationPropertyId]);

  const locationSchema = locationPropertyId
    ? schemaMap.get(locationPropertyId) ?? null
    : null;

  const rows = useMemo(
    (): NodeRow[] =>
      getSortedDatabaseRows(
        childIds,
        nodesById,
        propertiesByNode,
        schemaMap,
        sort
      ),
    [childIds, nodesById, propertiesByNode, schemaMap, sort]
  );

  const previewSchemas = useMemo(() => {
    return schemas.filter(
      (s) =>
        s.type !== "location" &&
        ["text", "select", "number", "date", "checkbox"].includes(s.type)
    );
  }, [schemas]);

  const mapEntries = useMemo(() => {
    if (!locationSchema) return [];
    return buildLocationEntries(
      rows,
      propertiesByNode,
      locationSchema,
      previewSchemas,
      4
    );
  }, [rows, propertiesByNode, locationSchema, previewSchemas]);

  const visibleMapEntries = useMemo(
    () => filterLocationEntries(mapEntries, searchQuery),
    [mapEntries, searchQuery]
  );

  const mapboxToken =
    typeof process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN === "string"
      ? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      : "";

  useEffect(() => {
    setMapReady(true);
  }, []);

  const handleMapClickLngLat = useCallback(
    async (lng: number, lat: number) => {
      if (!locationSchema) {
        toast.error("Add a Location property first");
        setAddPinMode(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/reverse-geocode?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`
        );
        const data = (await res.json()) as {
          location?: LocationValue | null;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Reverse geocode failed");
        }
        if (!data.location) {
          toast.error("Could not resolve address");
          return;
        }

        const pageId = addChildNodeOptimistic(sectionNodeId, userId);
        if (!pageId) {
          toast.error("Could not create page");
          return;
        }
        await persistNewNode(pageId);
        await updatePropertyValue(
          pageId,
          locationSchema.name,
          "location",
          data.location
        );
        toast.success("Article added at pin");
        setAddPinMode(false);
        setHighlightedPageId(pageId);
        void fetchProperties([pageId]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add pin");
      }
    },
    [
      locationSchema,
      sectionNodeId,
      userId,
      addChildNodeOptimistic,
      persistNewNode,
      updatePropertyValue,
      setAddPinMode,
      setHighlightedPageId,
      fetchProperties,
    ]
  );

  const mapClass = "absolute inset-0 h-full min-h-[400px] w-full";

  return (
    <TooltipProvider>
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-1.5">
          {locationSchemas.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] px-2",
                    "text-xs text-[var(--text-secondary)]",
                    "transition-colors duration-fast hover:bg-[var(--bg-3)]"
                  )}
                >
                  <MapPin size={14} />
                  {locationSchema?.name ?? "Location"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Location property</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {locationSchemas.map((s) => {
                  const Icon = PROPERTY_TYPE_ICONS[s.type];
                  return (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => setLocationPropertyId(s.id)}
                      className={cn(
                        s.id === locationPropertyId && "bg-[var(--bg-3)]"
                      )}
                    >
                      <Icon size={14} />
                      {s.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="text-xs text-[var(--text-tertiary)]">
              Add a &quot;Location&quot; property in Table view
            </span>
          )}

          <div className="max-w-[200px] flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter pins & list…"
              className="h-7 text-xs"
            />
          </div>

          <Button
            type="button"
            variant={addPinMode ? "default" : "outline"}
            size="sm"
            className="h-7 gap-1 text-xs"
            disabled={!locationSchema}
            onClick={() => setAddPinMode(!addPinMode)}
          >
            <Crosshair size={14} />
            {addPinMode ? "Click map…" : "Add pin"}
          </Button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="relative min-h-[400px] flex-1 bg-[var(--bg-2)]">
            {addPinMode && (
              <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-[var(--radius-sm)] bg-[var(--bg-1)] px-2 py-1 text-[10px] text-[var(--text-secondary)] shadow-[var(--shadow-sm)]">
                Click the map to create an entry at that location
              </div>
            )}
            {mapReady && locationSchema && (
              <>
                {mapboxToken.length > 0 ? (
                  <LocationMapMapbox
                    accessToken={mapboxToken}
                    entries={visibleMapEntries}
                    highlightedId={highlightedPageId}
                    addPinMode={addPinMode}
                    onSelectPage={setHighlightedPageId}
                    onMapClickLngLat={handleMapClickLngLat}
                    onOpenPage={onOpenPage}
                    className={mapClass}
                  />
                ) : (
                  <LocationMapLeaflet
                    entries={visibleMapEntries}
                    highlightedId={highlightedPageId}
                    addPinMode={addPinMode}
                    onSelectPage={setHighlightedPageId}
                    onMapClickLngLat={handleMapClickLngLat}
                    onOpenPage={onOpenPage}
                    className={mapClass}
                  />
                )}
              </>
            )}
            {locationSchema && !mapReady && (
              <div className="flex h-full items-center justify-center text-xs text-[var(--text-tertiary)]">
                Loading map…
              </div>
            )}
          </div>

          {locationSchema && (
            <LocationSidePanel
              entries={visibleMapEntries}
              totalCount={mapEntries.length}
              highlightedId={highlightedPageId}
              onHighlight={setHighlightedPageId}
              onOpenPage={onOpenPage}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
