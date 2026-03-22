"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Input, Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { LocationValue } from "@/lib/types/properties";
import type { GeocodeSuggestion } from "@/lib/location/geocode-types";
import {
  formatLocationTableDisplay,
  parseLocationValue,
} from "@/lib/location/location-value";
import { toast } from "sonner";

interface CellLocationProps {
  value: unknown;
  onChange: (_value: LocationValue) => void;
  readOnly?: boolean;
  className?: string;
}

export function CellLocation({
  value,
  onChange,
  readOnly,
  className,
}: CellLocationProps): React.ReactElement {
  const parsed = parseLocationValue(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(q)}`,
        { method: "GET" }
      );
      const data = (await res.json()) as {
        suggestions?: GeocodeSuggestion[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Search failed");
      }
      setSuggestions(data.suggestions ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Geocoding failed");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || readOnly) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, readOnly, runSearch]);

  const pick = useCallback(
    (s: GeocodeSuggestion) => {
      const full: LocationValue = {
        address: s.location.address,
        lat: s.location.lat,
        lng: s.location.lng,
        place_name: s.location.place_name,
        city: s.location.city,
        country: s.location.country,
      };
      onChange(full);
      setOpen(false);
      setQuery("");
      setSuggestions([]);
    },
    [onChange]
  );

  if (readOnly) {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-1.5 px-2 py-1 text-xs text-[var(--text-secondary)]",
          className
        )}
      >
        <MapPin size={14} className="shrink-0 text-[var(--text-tertiary)]" />
        <span className="min-w-0 truncate">
          {parsed ? formatLocationTableDisplay(parsed) : "—"}
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-1.5 px-2 py-1 text-left text-xs",
            "text-[var(--text-secondary)] transition-colors duration-fast",
            "hover:bg-[var(--bg-3)]",
            className
          )}
        >
          <MapPin size={14} className="shrink-0 text-[var(--text-tertiary)]" />
          <span className="min-w-0 truncate">
            {parsed ? formatLocationTableDisplay(parsed) : "Set location…"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start" sideOffset={4}>
        <div className="flex flex-col gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address or place…"
            className="h-8 text-sm"
            autoFocus
          />
          {parsed && (
            <div className="rounded-[var(--radius-sm)] bg-[var(--bg-2)] px-2 py-1.5 text-[10px] text-[var(--text-tertiary)]">
              Current: {formatLocationTableDisplay(parsed)}
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {loading && (
              <p className="px-2 py-1 text-xs text-[var(--text-tertiary)]">
                Searching…
              </p>
            )}
            {!loading &&
              suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-left",
                    "text-xs text-[var(--text-primary)]",
                    "transition-colors duration-fast hover:bg-[var(--bg-3)]"
                  )}
                >
                  <span className="font-medium leading-tight">{s.label}</span>
                </button>
              ))}
            {!loading && query.length >= 2 && suggestions.length === 0 && (
              <p className="px-2 py-1 text-xs text-[var(--text-tertiary)]">
                No results
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
