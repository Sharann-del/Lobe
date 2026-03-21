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

const BUILTINS: Record<
  string,
  (args: FormulaResult[]) => FormulaResult
> = {
  if: ([cond, t, f]) => (toBool(cond) ? t : f),
  not: ([v]) => !toBool(v),
  and: (args) => args.every(toBool),
  or: (args) => args.some(toBool),

  add: ([a, b]) => toNum(a) + toNum(b),
  subtract: ([a, b]) => toNum(a) - toNum(b),
  multiply: ([a, b]) => toNum(a) * toNum(b),
  divide: ([a, b]) => {
    const d = toNum(b);
    return d === 0 ? 0 : toNum(a) / d;
  },
  mod: ([a, b]) => toNum(a) % toNum(b),
  pow: ([a, b]) => Math.pow(toNum(a), toNum(b)),
  abs: ([v]) => Math.abs(toNum(v)),
  ceil: ([v]) => Math.ceil(toNum(v)),
  floor: ([v]) => Math.floor(toNum(v)),
  round: ([v]) => Math.round(toNum(v)),
  sqrt: ([v]) => Math.sqrt(toNum(v)),
  log: ([v]) => Math.log(toNum(v)),
  exp: ([v]) => Math.exp(toNum(v)),

  length: ([v]) => toStr(v).length,
  slice: ([s, start, end]) =>
    toStr(s).slice(toNum(start), end !== null && end !== undefined ? toNum(end) : undefined),
  contains: ([s, sub]) => toStr(s).includes(toStr(sub)),
  startsWith: ([s, sub]) => toStr(s).startsWith(toStr(sub)),
  endsWith: ([s, sub]) => toStr(s).endsWith(toStr(sub)),
  replace: ([s, from, to]) => toStr(s).replace(toStr(from), toStr(to)),
  replaceAll: ([s, from, to]) => toStr(s).replaceAll(toStr(from), toStr(to)),
  lower: ([v]) => toStr(v).toLowerCase(),
  upper: ([v]) => toStr(v).toUpperCase(),
  trim: ([v]) => toStr(v).trim(),
  split: ([s, sep]) => toStr(s).split(toStr(sep)).join(", "),
  join: ([arr, sep]) => toStr(arr).split(", ").join(toStr(sep)),

  toNumber: ([v]) => toNum(v),
  toString: ([v]) => toStr(v),
  toDate: ([v]) => toDate(v),

  now: () => new Date(),
  today: () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  },

  dateAdd: ([d, amount, unit]) => {
    const date = toDate(d);
    const n = toNum(amount);
    const u = toStr(unit);
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

  dateBetween: ([a, b, unit]) => {
    const da = toDate(a);
    const db = toDate(b);
    const u = toStr(unit);
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

  formatDate: ([d, fmt]) => {
    try {
      return fnsFormat(toDate(d), toStr(fmt));
    } catch {
      return toStr(d);
    }
  },

  month: ([d]) => getMonth(toDate(d)) + 1,
  year: ([d]) => getYear(toDate(d)),
  day: ([d]) => getDate(toDate(d)),
  hour: ([d]) => getHours(toDate(d)),
  minute: ([d]) => getMinutes(toDate(d)),
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
