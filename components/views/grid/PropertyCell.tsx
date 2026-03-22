"use client";

import type { PropertySchema, PropertyValueType } from "@/lib/types/properties";
import { READ_ONLY_TYPES } from "@/lib/types/properties";
import type {
  PersonValue,
  FileValue,
  RelationValue,
  StatusOption,
  NumberConfig,
  DateConfig,
  AggregationType,
} from "@/lib/types/properties";
import type { FormulaResult } from "@/lib/types/formula";
import type { SelectOption } from "@/lib/types/properties";
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
  CellStatus,
} from "./cells";

interface PropertyCellProps {
  schema: PropertySchema;
  value: unknown;
  onChange: (value: unknown) => void;
  onNavigate?: (pageId: string) => void;
  onCreateOption?: (option: SelectOption) => void;
  onUploadFile?: (file: File) => Promise<FileValue>;
  members?: PersonValue[];
  relationEntries?: RelationValue[];
  numberConfig?: Partial<NumberConfig>;
  dateConfig?: Partial<DateConfig>;
  statusOptions?: StatusOption[];
  formulaExpression?: string;
  formulaLookup?: (name: string) => FormulaResult;
  rollupAggregation?: AggregationType;
  className?: string;
}

export function PropertyCell({
  schema,
  value,
  onChange,
  onNavigate,
  onCreateOption,
  onUploadFile,
  members,
  relationEntries,
  numberConfig,
  dateConfig,
  statusOptions,
  formulaExpression,
  formulaLookup,
  rollupAggregation,
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
          config={numberConfig}
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
          onCreateOption={onCreateOption}
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
          onCreateOption={onCreateOption}
          readOnly={readOnly}
          className={className}
        />
      );

    case "status":
      return (
        <CellStatus
          value={(value as string) ?? null}
          options={statusOptions ?? []}
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
          config={dateConfig}
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
      return (
        <CellPerson
          value={(value as PersonValue[]) ?? []}
          members={members}
          onChange={(v) => onChange(v)}
          multi
          readOnly={readOnly}
          className={className}
        />
      );

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
          onChange={(v) => onChange(v)}
          onUpload={onUploadFile}
          readOnly={readOnly}
          className={className}
        />
      );

    case "relation":
      return (
        <CellRelation
          value={(value as RelationValue[]) ?? []}
          entries={relationEntries}
          onChange={(v) => onChange(v)}
          onNavigate={onNavigate}
          readOnly={readOnly}
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
      return (
        <CellFormula
          value={value}
          expression={formulaExpression}
          propertyLookup={formulaLookup}
          className={className}
        />
      );

    case "rollup":
      return (
        <CellRollup
          value={value}
          aggregation={rollupAggregation}
          className={className}
        />
      );

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
