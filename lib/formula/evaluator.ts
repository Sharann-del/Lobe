import type { FormulaNode, FormulaResult } from "@/lib/types/formula";
import {
  addDays,
  addHours,
  addMonths,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInMonths,
  differenceInYears,
  format as fnsFormat,
  getDate,
  getHours,
  getMinutes,
  getMonth,
  getYear,
} from "date-fns";

type PropertyLookup = (name: string) => FormulaResult;

function toNum(v: FormulaResult): number {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

function toStr(v: FormulaResult): string {
  if (v === null) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function toBool(v: FormulaResult): boolean {
  return !!v;
}

function toDate(v: FormulaResult): Date {
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(v);
  if (typeof v === "number") return new Date(v);
  return new Date();
}

/** Safe indexed read for variadic formula builtins (strict noUncheckedIndexedAccess). */
function arg(args: FormulaResult[], i: number): FormulaResult {
  return args[i] ?? null;
}

const BUILTINS: Record<
  string,
  (args: FormulaResult[]) => FormulaResult
> = {
  if: (args) => (toBool(arg(args, 0)) ? arg(args, 1) : arg(args, 2)),
  not: (args) => !toBool(arg(args, 0)),
  and: (args) => args.every((a) => toBool(a)),
  or: (args) => args.some((a) => toBool(a)),

  add: (args) => toNum(arg(args, 0)) + toNum(arg(args, 1)),
  subtract: (args) => toNum(arg(args, 0)) - toNum(arg(args, 1)),
  multiply: (args) => toNum(arg(args, 0)) * toNum(arg(args, 1)),
  divide: (args) => {
    const d = toNum(arg(args, 1));
    return d === 0 ? 0 : toNum(arg(args, 0)) / d;
  },
  mod: (args) => toNum(arg(args, 0)) % toNum(arg(args, 1)),
  pow: (args) => Math.pow(toNum(arg(args, 0)), toNum(arg(args, 1))),
  abs: (args) => Math.abs(toNum(arg(args, 0))),
  ceil: (args) => Math.ceil(toNum(arg(args, 0))),
  floor: (args) => Math.floor(toNum(arg(args, 0))),
  round: (args) => Math.round(toNum(arg(args, 0))),
  sqrt: (args) => Math.sqrt(toNum(arg(args, 0))),
  log: (args) => Math.log(toNum(arg(args, 0))),
  exp: (args) => Math.exp(toNum(arg(args, 0))),

  length: (args) => toStr(arg(args, 0)).length,
  slice: (args) => {
    const endRaw = arg(args, 2);
    return toStr(arg(args, 0)).slice(
      toNum(arg(args, 1)),
      endRaw !== null && endRaw !== undefined ? toNum(endRaw) : undefined
    );
  },
  contains: (args) =>
    toStr(arg(args, 0)).includes(toStr(arg(args, 1))),
  startsWith: (args) =>
    toStr(arg(args, 0)).startsWith(toStr(arg(args, 1))),
  endsWith: (args) =>
    toStr(arg(args, 0)).endsWith(toStr(arg(args, 1))),
  replace: (args) =>
    toStr(arg(args, 0)).replace(toStr(arg(args, 1)), toStr(arg(args, 2))),
  replaceAll: (args) =>
    toStr(arg(args, 0)).replaceAll(toStr(arg(args, 1)), toStr(arg(args, 2))),
  lower: (args) => toStr(arg(args, 0)).toLowerCase(),
  upper: (args) => toStr(arg(args, 0)).toUpperCase(),
  trim: (args) => toStr(arg(args, 0)).trim(),
  split: (args) =>
    toStr(arg(args, 0)).split(toStr(arg(args, 1))).join(", "),
  join: (args) =>
    toStr(arg(args, 0)).split(", ").join(toStr(arg(args, 1))),

  toNumber: (args: FormulaResult[]) => toNum(arg(args, 0)),
  toString: (args: FormulaResult[]) => toStr(arg(args, 0)),
  toDate: (args: FormulaResult[]) => toDate(arg(args, 0)),

  now: (_args: FormulaResult[]) => new Date(),
  today: (_args: FormulaResult[]) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  },

  dateAdd: (args) => {
    const date = toDate(arg(args, 0));
    const n = toNum(arg(args, 1));
    const u = toStr(arg(args, 2));
    switch (u) {
      case "hours":
        return addHours(date, n);
      case "days":
        return addDays(date, n);
      case "months":
        return addMonths(date, n);
      case "years":
        return addYears(date, n);
      default:
        return addDays(date, n);
    }
  },

  dateBetween: (args) => {
    const da = toDate(arg(args, 0));
    const db = toDate(arg(args, 1));
    const u = toStr(arg(args, 2));
    switch (u) {
      case "hours":
        return differenceInHours(da, db);
      case "days":
        return differenceInDays(da, db);
      case "months":
        return differenceInMonths(da, db);
      case "years":
        return differenceInYears(da, db);
      default:
        return differenceInDays(da, db);
    }
  },

  formatDate: (args) => {
    try {
      return fnsFormat(toDate(arg(args, 0)), toStr(arg(args, 1)));
    } catch {
      return toStr(arg(args, 0));
    }
  },

  month: (args) => getMonth(toDate(arg(args, 0))) + 1,
  year: (args) => getYear(toDate(arg(args, 0))),
  day: (args) => getDate(toDate(arg(args, 0))),
  hour: (args) => getHours(toDate(arg(args, 0))),
  minute: (args) => getMinutes(toDate(arg(args, 0))),
};

function evalBinaryOp(
  op: string,
  left: FormulaResult,
  right: FormulaResult
): FormulaResult {
  switch (op) {
    case "+":
      if (typeof left === "string" || typeof right === "string") {
        return toStr(left) + toStr(right);
      }
      return toNum(left) + toNum(right);
    case "-":
      return toNum(left) - toNum(right);
    case "*":
      return toNum(left) * toNum(right);
    case "/": {
      const d = toNum(right);
      return d === 0 ? 0 : toNum(left) / d;
    }
    case "%":
      return toNum(left) % toNum(right);
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case "<":
      return toNum(left) < toNum(right);
    case ">":
      return toNum(left) > toNum(right);
    case "<=":
      return toNum(left) <= toNum(right);
    case ">=":
      return toNum(left) >= toNum(right);
    case "&&":
      return toBool(left) && toBool(right);
    case "||":
      return toBool(left) || toBool(right);
    default:
      return null;
  }
}

export function evaluate(
  node: FormulaNode,
  lookup: PropertyLookup
): FormulaResult {
  switch (node.kind) {
    case "literal":
      return node.value;

    case "property":
      return lookup(node.name);

    case "call": {
      const fn = BUILTINS[node.name];
      if (!fn) return null;
      const args = node.args.map((a) => evaluate(a, lookup));
      return fn(args);
    }

    case "binary": {
      const left = evaluate(node.left, lookup);
      const right = evaluate(node.right, lookup);
      return evalBinaryOp(node.op, left, right);
    }

    case "unary": {
      const operand = evaluate(node.operand, lookup);
      if (node.op === "-") return -toNum(operand);
      return operand;
    }

    default:
      return null;
  }
}
