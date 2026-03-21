"use client";

import type { PropertySchema, PropertyValueType } from "@/lib/types/properties";
import { READ_ONLY_TYPES } from "@/lib/types/properties";
import type {
  PersonValue,
  FileValue,
  RelationValue,
} from "@/lib/types/properties";
import {
  CellText,
  CellNumber,
  CellSelect,
  CellMultiSelect,
  CellDate,
  CellCheckbox,
  CellPerson,
  CellUrl,
  CellEmail,
  CellPhone,
  CellFile,
  CellRelation,
  CellFormula,
  CellRollup,
  CellTimestamp,
  CellLocation,
} from "./cells";

interface PropertyCellProps {
  schema: PropertySchema;
  value: unknown;
  onChange: (value: unknown) => void;
  onNavigate?: (pageId: string) => void;
  className?: string;
}

export function PropertyCell({
  schema,
  value,
  onChange,
  onNavigate,
  className,
}: PropertyCellProps): React.ReactElement {
  const readOnly = READ_ONLY_TYPES.includes(schema.type);
  const type: PropertyValueType = schema.type;

  switch (type) {
    case "text":
      return (
        <CellText
          value={(value as string) ?? ""}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );

    case "number":
      return (
        <CellNumber
          value={(value as number) ?? null}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );

    case "select":
      return (
        <CellSelect
          value={(value as string) ?? null}
          options={schema.options}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );

    case "multi_select":
      return (
        <CellMultiSelect
          value={(value as string[]) ?? []}
          options={schema.options}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );

    case "date":
      return (
        <CellDate
          value={(value as string) ?? null}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );

    case "checkbox":
    case "boolean":
      return (
        <CellCheckbox
          value={Boolean(value)}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );

    case "person":
    case "created_by":
    case "last_edited_by":
      return (
        <CellPerson
          value={(value as PersonValue[]) ?? []}
          readOnly
          className={className}
        />
      );

    case "url":
      return (
        <CellUrl
          value={(value as string) ?? ""}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );

    case "email":
      return (
        <CellEmail
          value={(value as string) ?? ""}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );

    case "phone":
      return (
        <CellPhone
          value={(value as string) ?? ""}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );

    case "file":
      return (
        <CellFile
          value={(value as FileValue[]) ?? []}
          readOnly
          className={className}
        />
      );

    case "relation":
      return (
        <CellRelation
          value={(value as RelationValue[]) ?? []}
          readOnly={readOnly}
          onNavigate={onNavigate}
          className={className}
        />
      );

    case "location":
      return (
        <CellLocation
          value={value}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );

    case "formula":
      return <CellFormula value={value} className={className} />;

    case "rollup":
      return <CellRollup value={value} className={className} />;

    case "created_time":
    case "last_edited_time":
      return (
        <CellTimestamp
          value={(value as string) ?? null}
          className={className}
        />
      );

    default:
      return (
        <CellText
          value={value != null ? String(value) : ""}
          onChange={(v) => onChange(v)}
          readOnly={readOnly}
          className={className}
        />
      );
  }
}
