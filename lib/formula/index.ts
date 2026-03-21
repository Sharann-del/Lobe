import type { FormulaNode, FormulaResult } from "@/lib/types/formula";
import { tokenize } from "./tokenizer";
import { parse, FormulaParseError } from "./parser";
import { evaluate } from "./evaluator";

export { FormulaParseError } from "./parser";

export function compileFormula(expression: string): FormulaNode {
  const tokens = tokenize(expression);
  return parse(tokens);
}

export function evaluateFormula(
  ast: FormulaNode,
  propertyLookup: (name: string) => FormulaResult
): FormulaResult {
  return evaluate(ast, propertyLookup);
}

export function tryEvaluateFormula(
  expression: string,
  propertyLookup: (name: string) => FormulaResult
): { value: FormulaResult; error: null } | { value: null; error: string } {
  try {
    const ast = compileFormula(expression);
    const value = evaluateFormula(ast, propertyLookup);
    return { value, error: null };
  } catch (e) {
    return {
      value: null,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
