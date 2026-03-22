import type { FormulaToken, TokenKind } from "@/lib/types/formula";

const OPERATORS = new Set(["+", "-", "*", "/", "%", "==", "!=", "<", ">", "<=", ">=", "&&", "||"]);
const DOUBLE_CHAR_OPS = new Set(["==", "!=", "<=", ">=", "&&", "||"]);

export function tokenize(input: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input.charAt(i);

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
      while (i < input.length && input.charAt(i) !== quote) {
        if (input.charAt(i) === "\\") {
          i++;
          str += input.charAt(i);
        } else {
          str += input.charAt(i);
        }
        i++;
      }
      i++;
      tokens.push({ kind: "string", value: str, pos: i });
      continue;
    }

    const prevTok = tokens.length > 0 ? tokens[tokens.length - 1] : undefined;
    const prevKind = prevTok?.kind;
    const nextCh = i + 1 < input.length ? input.charAt(i + 1) : "";
    if (
      /\d/.test(ch) ||
      (ch === "-" &&
        /\d/.test(nextCh) &&
        (tokens.length === 0 ||
          prevKind === "lparen" ||
          prevKind === "comma" ||
          prevKind === "op"))
    ) {
      let num = "";
      if (ch === "-") {
        num += "-";
        i++;
      }
      while (
        i < input.length &&
        (/\d/.test(input.charAt(i)) || input.charAt(i) === ".")
      ) {
        num += input.charAt(i);
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
      while (i < input.length && /[a-zA-Z0-9_]/.test(input.charAt(i))) {
        ident += input.charAt(i);
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
      while (i < input.length && input.charAt(i) !== "}") {
        prop += input.charAt(i);
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
