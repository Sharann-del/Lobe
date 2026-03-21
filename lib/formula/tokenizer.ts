import type { FormulaToken, TokenKind } from "@/lib/types/formula";

const OPERATORS = new Set(["+", "-", "*", "/", "%", "==", "!=", "<", ">", "<=", ">=", "&&", "||"]);
const DOUBLE_CHAR_OPS = new Set(["==", "!=", "<=", ">=", "&&", "||"]);

export function tokenize(input: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === "(") {
      tokens.push({ kind: "lparen", value: "(", pos: i });
      i++;
      continue;
    }

    if (ch === ")") {
      tokens.push({ kind: "rparen", value: ")", pos: i });
      i++;
      continue;
    }

    if (ch === ",") {
      tokens.push({ kind: "comma", value: ",", pos: i });
      i++;
      continue;
    }

    if (ch === ".") {
      tokens.push({ kind: "dot", value: ".", pos: i });
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let str = "";
      i++;
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\") {
          i++;
          str += input[i] ?? "";
        } else {
          str += input[i];
        }
        i++;
      }
      i++;
      tokens.push({ kind: "string", value: str, pos: i });
      continue;
    }

    if (/\d/.test(ch) || (ch === "-" && i + 1 < input.length && /\d/.test(input[i + 1]) && (tokens.length === 0 || tokens[tokens.length - 1].kind === "lparen" || tokens[tokens.length - 1].kind === "comma" || tokens[tokens.length - 1].kind === "op"))) {
      let num = "";
      if (ch === "-") {
        num += "-";
        i++;
      }
      while (i < input.length && (/\d/.test(input[i]) || input[i] === ".")) {
        num += input[i];
        i++;
      }
      tokens.push({ kind: "number", value: num, pos: i });
      continue;
    }

    const twoChar = input.slice(i, i + 2);
    if (DOUBLE_CHAR_OPS.has(twoChar)) {
      tokens.push({ kind: "op", value: twoChar, pos: i });
      i += 2;
      continue;
    }

    if (OPERATORS.has(ch)) {
      tokens.push({ kind: "op", value: ch, pos: i });
      i++;
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let ident = "";
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        ident += input[i];
        i++;
      }
      const kind: TokenKind =
        ident === "true" || ident === "false" ? "boolean" : "ident";
      tokens.push({ kind, value: ident, pos: i });
      continue;
    }

    if (ch === "{") {
      i++;
      let prop = "";
      while (i < input.length && input[i] !== "}") {
        prop += input[i];
        i++;
      }
      i++;
      tokens.push({ kind: "ident", value: `{${prop}}`, pos: i });
      continue;
    }

    i++;
  }

  tokens.push({ kind: "eof", value: "", pos: i });
  return tokens;
}
