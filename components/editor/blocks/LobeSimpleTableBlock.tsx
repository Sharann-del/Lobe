"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { useMemo } from "react";

import {
  compareCellValues,
  createDefaultSimpleTableModel,
  parseSimpleTableModel,
  stringifySimpleTableModel,
  type SimpleTableCellType,
  type SimpleTableModel,
} from "@/lib/editor/simple-table-model";

const EMPTY_JSON = stringifySimpleTableModel(createDefaultSimpleTableModel());

function sortModelByColumn(
  model: SimpleTableModel,
  columnId: string
): SimpleTableModel {
  const col = model.columns.find((c) => c.id === columnId);
  if (!col) {
    return model;
  }
  const nextDir: "asc" | "desc" =
    model.sort?.columnId === columnId && model.sort.direction === "asc"
      ? "desc"
      : "asc";
  const rows = [...model.rows].sort((a, b) => {
    const va = a.cells[columnId] ?? "";
    const vb = b.cells[columnId] ?? "";
    const cmp = compareCellValues(va, vb, col.type);
    return nextDir === "asc" ? cmp : -cmp;
  });
  return {
    ...model,
    rows,
    sort: { columnId, direction: nextDir },
  };
}

function addRow(model: SimpleTableModel): SimpleTableModel {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `r-${Date.now()}`;
  const cells: Record<string, string> = {};
  for (const c of model.columns) {
    cells[c.id] = c.type === "checkbox" ? "false" : "";
  }
  return {
    ...model,
    rows: [...model.rows, { id, cells }],
  };
}

function addColumn(model: SimpleTableModel): SimpleTableModel {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `c-${Date.now()}`;
  return {
    ...model,
    columns: [...model.columns, { id, type: "text" }],
    rows: model.rows.map((r) => ({
      ...r,
      cells: { ...r.cells, [id]: "" },
    })),
  };
}

function removeLastRow(model: SimpleTableModel): SimpleTableModel {
  if (model.rows.length <= 1) {
    return model;
  }
  return { ...model, rows: model.rows.slice(0, -1) };
}

function removeLastColumn(model: SimpleTableModel): SimpleTableModel {
  if (model.columns.length <= 1) {
    return model;
  }
  const drop = model.columns[model.columns.length - 1];
  if (!drop) {
    return model;
  }
  return {
    ...model,
    columns: model.columns.slice(0, -1),
    rows: model.rows.map((r) => {
      const cells = { ...r.cells };
      delete cells[drop.id];
      return { ...r, cells };
    }),
  };
}

function setCell(
  model: SimpleTableModel,
  rowId: string,
  colId: string,
  value: string
): SimpleTableModel {
  return {
    ...model,
    rows: model.rows.map((r) =>
      r.id === rowId
        ? { ...r, cells: { ...r.cells, [colId]: value } }
        : r
    ),
  };
}

function setColumnType(
  model: SimpleTableModel,
  colId: string,
  type: SimpleTableCellType
): SimpleTableModel {
  return {
    ...model,
    columns: model.columns.map((c) =>
      c.id === colId ? { ...c, type } : c
    ),
    rows: model.rows.map((r) => {
      const v = r.cells[colId] ?? "";
      let next = v;
      if (type === "checkbox") {
        next = v === "true" ? "true" : "false";
      }
      return { ...r, cells: { ...r.cells, [colId]: next } };
    }),
  };
}

type SimpleTableViewProps = {
  editor: {
    isEditable: boolean;
    updateBlock: (
      _block: { id: string },
      _update: { props: { tableJson: string } }
    ) => void;
  };
  block: { id: string; props: { tableJson: string } };
};

function LobeSimpleTableBlockView(props: SimpleTableViewProps): React.ReactElement {
  const { editor, block } = props;
  const model = useMemo(
    () => parseSimpleTableModel(block.props.tableJson || EMPTY_JSON),
    [block.props.tableJson]
  );

  const persist = (next: SimpleTableModel): void => {
    editor.updateBlock(block, {
      props: { tableJson: stringifySimpleTableModel(next) },
    });
  };

  return (
    <div
      className="lobe-simple-table rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-1)]"
      contentEditable={false}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {editor.isEditable ? (
        <div className="flex flex-wrap gap-2 border-b border-[var(--border-default)] p-2">
          <button
            type="button"
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-2)] px-2 py-1 text-xs text-[var(--text-primary)]"
            onClick={() => persist(addRow(model))}
          >
            + Row
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-2)] px-2 py-1 text-xs text-[var(--text-primary)]"
            onClick={() => persist(addColumn(model))}
          >
            + Column
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-2)] px-2 py-1 text-xs text-[var(--text-primary)]"
            onClick={() => persist(removeLastRow(model))}
          >
            − Row
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-2)] px-2 py-1 text-xs text-[var(--text-primary)]"
            onClick={() => persist(removeLastColumn(model))}
          >
            − Column
          </button>
        </div>
      ) : null}
      <div className="overflow-x-auto p-2">
        <table className="lobe-simple-table__grid w-full border-collapse text-sm">
          <thead>
            <tr>
              {model.columns.map((col, idx) => (
                <th
                  key={col.id}
                  className="lobe-simple-table__th border border-[var(--border-default)] bg-[var(--bg-2)] p-0 text-left align-top"
                >
                  <button
                    type="button"
                    className="flex w-full flex-col gap-1 p-2 text-left text-[var(--text-primary)] hover:bg-[var(--bg-3)]"
                    onClick={() => persist(sortModelByColumn(model, col.id))}
                  >
                    <span className="text-xs font-semibold">
                      Column {idx + 1}
                      {model.sort?.columnId === col.id
                        ? model.sort.direction === "asc"
                          ? " ▲"
                          : " ▼"
                        : ""}
                    </span>
                  </button>
                  {editor.isEditable ? (
                    <div className="border-t border-[var(--border-default)] px-2 pb-2">
                      <label className="sr-only" htmlFor={`col-type-${col.id}`}>
                        Column type
                      </label>
                      <select
                        id={`col-type-${col.id}`}
                        className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-1)] px-1 py-1 text-xs text-[var(--text-primary)]"
                        value={col.type}
                        onChange={(e) =>
                          persist(
                            setColumnType(
                              model,
                              col.id,
                              e.target.value as SimpleTableCellType
                            )
                          )
                        }
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                    </div>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr key={row.id}>
                {model.columns.map((col) => {
                  const raw = row.cells[col.id] ?? "";
                  if (col.type === "checkbox") {
                    return (
                      <td
                        key={col.id}
                        className="border border-[var(--border-default)] p-2 text-center"
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--accent)]"
                          checked={raw === "true"}
                          disabled={!editor.isEditable}
                          onChange={(e) =>
                            persist(
                              setCell(
                                model,
                                row.id,
                                col.id,
                                e.target.checked ? "true" : "false"
                              )
                            )
                          }
                          aria-label="Cell checkbox"
                        />
                      </td>
                    );
                  }
                  if (col.type === "number") {
                    return (
                      <td
                        key={col.id}
                        className="border border-[var(--border-default)] p-1"
                      >
                        <input
                          type="number"
                          className="w-full min-w-[4rem] rounded-[var(--radius-sm)] border border-transparent bg-transparent px-2 py-1 text-[var(--text-primary)] focus:border-[var(--border-default)]"
                          value={raw}
                          readOnly={!editor.isEditable}
                          onChange={(e) =>
                            persist(
                              setCell(model, row.id, col.id, e.target.value)
                            )
                          }
                        />
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col.id}
                      className="border border-[var(--border-default)] p-1"
                    >
                      <input
                        type="text"
                        className="w-full min-w-[6rem] rounded-[var(--radius-sm)] border border-transparent bg-transparent px-2 py-1 text-[var(--text-primary)] focus:border-[var(--border-default)]"
                        value={raw}
                        readOnly={!editor.isEditable}
                        onChange={(e) =>
                          persist(
                            setCell(model, row.id, col.id, e.target.value)
                          )
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const lobeSimpleTableBlock = createReactBlockSpec(
  {
    type: "simpleTable",
    propSchema: {
      tableJson: { default: EMPTY_JSON },
    },
    content: "none",
  },
  {
    render: (props) => (
      <LobeSimpleTableBlockView editor={props.editor} block={props.block} />
    ),
    toExternalHTML: (props) => {
      const model = parseSimpleTableModel(
        props.block.props.tableJson || EMPTY_JSON
      );
      return (
        <table>
          <thead>
            <tr>
              {model.columns.map((c, i) => (
                <th key={c.id}>Column {i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r) => (
              <tr key={r.id}>
                {model.columns.map((c) => (
                  <td key={c.id}>{r.cells[c.id] ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    },
  }
);
