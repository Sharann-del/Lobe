export type TokenKind =
  | "number"
  | "string"
  | "boolean"
  | "ident"
  | "lparen"
  | "rparen"
  | "comma"
  | "op"
  | "dot"
  | "eof";

export interface FormulaToken {
  kind: TokenKind;
  value: string;
  pos: number;
}

export type NodeKind =
  | "literal"
  | "property"
  | "call"
  | "binary"
  | "unary"
  | "ternary";

export interface LiteralNode {
  kind: "literal";
  value: string | number | boolean;
}

export interface PropertyNode {
  kind: "property";
  name: string;
}

export interface CallNode {
  kind: "call";
  name: string;
  args: FormulaNode[];
}

export interface BinaryNode {
  kind: "binary";
  op: string;
  left: FormulaNode;
  right: FormulaNode;
}

export interface UnaryNode {
  kind: "unary";
  op: string;
  operand: FormulaNode;
}

export type FormulaNode =
  | LiteralNode
  | PropertyNode
  | CallNode
  | BinaryNode
  | UnaryNode;

export type FormulaResult = string | number | boolean | Date | null;

export const FORMULA_FUNCTIONS = [
  "if",
  "not",
  "and",
  "or",
  "add",
  "subtract",
  "multiply",
  "divide",
  "mod",
  "pow",
  "abs",
  "ceil",
  "floor",
  "round",
  "sqrt",
  "log",
  "exp",
  "length",
  "slice",
  "contains",
  "startsWith",
  "endsWith",
  "replace",
  "replaceAll",
  "lower",
  "upper",
  "trim",
  "split",
  "join",
  "toNumber",
  "toString",
  "toDate",
  "now",
  "today",
  "dateAdd",
  "dateBetween",
  "formatDate",
  "month",
  "year",
  "day",
  "hour",
  "minute",
] as const;

export type FormulaFunctionName = (typeof FORMULA_FUNCTIONS)[number];
