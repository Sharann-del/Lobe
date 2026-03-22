import type { FormulaToken } from "@/lib/types/formula";
import type {
  FormulaNode,
  LiteralNode,
  PropertyNode,
  CallNode,
  BinaryNode,
} from "@/lib/types/formula";

export class FormulaParseError extends Error {
  constructor(
    message: string,
    public pos: number
  ) {
    super(message);
    this.name = "FormulaParseError";
  }
}

export function parse(tokens: FormulaToken[]): FormulaNode {
  let idx = 0;

  function peek(): FormulaToken {
    const t = tokens[idx];
    if (t === undefined) {
      throw new FormulaParseError("Unexpected end of formula", idx);
    }
    return t;
  }

  function advance(): FormulaToken {
    const t = tokens[idx];
    if (t === undefined) {
      throw new FormulaParseError("Unexpected end of formula", idx);
    }
    idx += 1;
    return t;
  }

  function expect(kind: string): FormulaToken {
    const t = advance();
    if (t.kind !== kind) {
      throw new FormulaParseError(
        `Expected ${kind}, got ${t.kind} "${t.value}"`,
        t.pos
      );
    }
    return t;
  }

  function parseExpression(): FormulaNode {
    return parseOr();
  }

  function parseOr(): FormulaNode {
    let left = parseAnd();
    while (peek().kind === "op" && peek().value === "||") {
      const op = advance().value;
      const right = parseAnd();
      left = { kind: "binary", op, left, right } satisfies BinaryNode;
    }
    return left;
  }

  function parseAnd(): FormulaNode {
    let left = parseEquality();
    while (peek().kind === "op" && peek().value === "&&") {
      const op = advance().value;
      const right = parseEquality();
      left = { kind: "binary", op, left, right } satisfies BinaryNode;
    }
    return left;
  }

  function parseEquality(): FormulaNode {
    let left = parseComparison();
    while (
      peek().kind === "op" &&
      (peek().value === "==" || peek().value === "!=")
    ) {
      const op = advance().value;
      const right = parseComparison();
      left = { kind: "binary", op, left, right } satisfies BinaryNode;
    }
    return left;
  }

  function parseComparison(): FormulaNode {
    let left = parseAddSub();
    while (
      peek().kind === "op" &&
      (peek().value === "<" ||
        peek().value === ">" ||
        peek().value === "<=" ||
        peek().value === ">=")
    ) {
      const op = advance().value;
      const right = parseAddSub();
      left = { kind: "binary", op, left, right } satisfies BinaryNode;
    }
    return left;
  }

  function parseAddSub(): FormulaNode {
    let left = parseMulDiv();
    while (
      peek().kind === "op" &&
      (peek().value === "+" || peek().value === "-")
    ) {
      const op = advance().value;
      const right = parseMulDiv();
      left = { kind: "binary", op, left, right } satisfies BinaryNode;
    }
    return left;
  }

  function parseMulDiv(): FormulaNode {
    let left = parseUnary();
    while (
      peek().kind === "op" &&
      (peek().value === "*" || peek().value === "/" || peek().value === "%")
    ) {
      const op = advance().value;
      const right = parseUnary();
      left = { kind: "binary", op, left, right } satisfies BinaryNode;
    }
    return left;
  }

  function parseUnary(): FormulaNode {
    if (peek().kind === "op" && peek().value === "-") {
      advance();
      const operand = parsePrimary();
      return { kind: "unary", op: "-", operand };
    }
    return parsePrimary();
  }

  function parsePrimary(): FormulaNode {
    const token = peek();

    if (token.kind === "number") {
      advance();
      return { kind: "literal", value: Number(token.value) } satisfies LiteralNode;
    }

    if (token.kind === "string") {
      advance();
      return { kind: "literal", value: token.value } satisfies LiteralNode;
    }

    if (token.kind === "boolean") {
      advance();
      return {
        kind: "literal",
        value: token.value === "true",
      } satisfies LiteralNode;
    }

    if (token.kind === "ident") {
      advance();
      const name = token.value;

      if (name.startsWith("{") && name.endsWith("}")) {
        return {
          kind: "property",
          name: name.slice(1, -1),
        } satisfies PropertyNode;
      }

      if (peek().kind === "lparen") {
        advance();
        const args: FormulaNode[] = [];
        if (peek().kind !== "rparen") {
          args.push(parseExpression());
          while (peek().kind === "comma") {
            advance();
            args.push(parseExpression());
          }
        }
        expect("rparen");
        return { kind: "call", name, args } satisfies CallNode;
      }

      return { kind: "property", name } satisfies PropertyNode;
    }

    if (token.kind === "lparen") {
      advance();
      const expr = parseExpression();
      expect("rparen");
      return expr;
    }

    throw new FormulaParseError(
      `Unexpected token: ${token.kind} "${token.value}"`,
      token.pos
    );
  }

  const ast = parseExpression();

  if (peek().kind !== "eof") {
    throw new FormulaParseError(
      `Unexpected token after expression: ${peek().value}`,
      peek().pos
    );
  }

  return ast;
}
