import { CompilerPass } from "./compiler_passes";
import {
  /* ALL_ASTYPES */ ADD,
  FIELD,
  LOGICAL_AND,
  CALL,
  EQUALITY,
  NUMBER,
  LOGICAL_OR,
  COMPARISON,
  GROUP,
  MULDIV_OP,
  STRING,
  SUB,
  NEGATIVE,
  LOGICAL_NOT,
  IDENTIFIER,
  ROOT,
  ARG_LIST,
} from "./syntax";
import { assert, NodeType, Token, Node, CompileError, Type } from "./types";

export type Expr = number | string | ([string, ...Expr[]] & { node?: Node });

export interface Options {
  resolve: (kind: any, name: string) => Expr;
  getMBQLName(expressionName: string): string;
  passes?: CompilerPass[];
}

type CompileFn = (node: Node, opts: Options) => Expr;

export function compile(node: Node, opts: Options): Expr {
  if (node.Type !== ROOT) {
    throw new CompileError("Must be root node", { node });
  }
  if (node.children.length > 1) {
    throw new CompileError("Unexpected expression", { node: node.children[1] });
  }
  const func = compileUnaryOp(node, opts);
  let expr = func(node.children[0], opts);
  const { passes = [] } = opts;
  for (const pass of passes) {
    expr = pass(expr);
  }
  return expr;
}

// ----------------------------------------------------------------

function compileField(node: Node, opts: Options): Expr {
  assert(node.Type === FIELD, "Invalid Node Type");
  assert(node.token?.text, "Empty field name");
  // Slice off the leading and trailing brackets
  const name = node.token.text.slice(1, node.token.text.length - 1);
  return withNode(opts.resolve(undefined, name), node);
}

function compileIdentifier(node: Node, opts: Options): Expr {
  assert(node.Type === IDENTIFIER, "Invalid Node Type");
  assert(node.token?.text, "Empty token text");
  const name = node.token.text;
  return withNode(opts.resolve(undefined, name), node);
}

function compileGroup(node: Node, opts: Options): Expr {
  assert(node.Type === GROUP, "Invalid Node Type");
  const func = compileUnaryOp(node, opts);
  return func(node.children[0], opts);
}

function compileString(node: Node, opts: Options): Expr {
  assert(node.Type === STRING, "Invalid Node Type");
  assert(typeof node.token?.text === "string", "No token text");
  // Slice off the leading and trailing quotes
  return withNode(node.token.text.slice(1, node.token.text.length - 1), node);
}

// ----------------------------------------------------------------

function compileLogicalNot(node: Node, opts: Options): Expr {
  assert(node.Type === LOGICAL_NOT, "Invalid Node Type");
  const func = compileUnaryOp(node, opts);
  assert(node.token?.text, "Empty token text");
  const child = node.children[0];
  return withNode(["not", func(child, opts)], node);
}

function compileLogicalAnd(node: Node, opts: Options): Expr {
  assert(node.Type === LOGICAL_AND, "Invalid Node Type");
  assert(node.token?.text, "Empty token text");
  const [left, right] = compileInfixOp(node, opts);
  return withNode([node.token?.text.toLowerCase(), ...left, ...right], node);
}

function compileLogicalOr(node: Node, opts: Options): Expr {
  assert(node.Type === LOGICAL_OR, "Invalid Node Type");
  assert(node.token?.text, "Empty token text");
  const [left, right] = compileInfixOp(node, opts);
  return withNode([node.token?.text.toLowerCase(), ...left, ...right], node);
}

function compileComparisonOp(node: Node, opts: Options): Expr {
  assert(node.Type === COMPARISON, "Invalid Node Type");
  const text = node.token?.text;
  assert(text, "Empty token text");
  const [left, right] = compileInfixOp(node, opts);
  return withNode([text, ...left, ...right], node);
}

function compileEqualityOp(node: Node, opts: Options): Expr {
  assert(node.Type === EQUALITY, "Invalid Node Type");
  assert(node.token?.text, "Empty token text");
  const [left, right] = compileInfixOp(node, opts);
  return withNode([node.token?.text, ...left, ...right], node);
}

// ----------------------------------------------------------------

function compileFunctionCall(node: Node, opts: Options): Expr {
  assert(node.Type === CALL, "Invalid Node Type");
  assert(node.token?.text, "Empty token text");
  assert(
    node.children[0].Type === ARG_LIST,
    "First argument must be an arglist",
  );
  const text = node.token?.text;
  const fn = opts.getMBQLName(text.trim().toLowerCase());
  return withNode(
    [fn ? fn : text, ...compileArgList(node.children[0], opts)],
    node,
  );
}

function compileArgList(node: Node, opts: Options): Expr[] {
  assert(node.Type === ARG_LIST, "Invalid Node Type");
  return node.children.map(child => {
    const func = COMPILE.get(child.Type);
    if (!func) {
      throw new CompileError("Invalid node type", { node: child });
    }
    const expr = func(child, opts);
    return (expr as any).node ? expr : withNode(expr, child);
  });
}

// ----------------------------------------------------------------

function compileNumber(node: Node, opts: Options): Expr {
  assert(node.Type === NUMBER, "Invalid Node Type");
  assert(typeof node.token?.text === "string", "No token text");
  try {
    return parseFloat(node.token.text);
  } catch (err) {
    throw new CompileError("Invalid number format", { node });
  }
}

function compileNegative(node: Node, opts: Options): Expr {
  assert(node.Type === NEGATIVE, "Invalid Node Type");
  const func = compileUnaryOp(node, opts);
  assert(node.token?.text, "Empty token text");
  const child = node.children[0];
  if (child.Type === NUMBER) {
    return -func(child, opts);
  }
  return withNode(["-", func(child, opts)], node);
}

function compileAdditionOp(node: Node, opts: Options): Expr {
  assert(node.Type === ADD, "Invalid Node Type");
  assert(node.token?.text, "Empty token text");
  const [left, right] = compileInfixOp(node, opts);
  return withNode([node.token?.text, ...left, ...right], node);
}

function compileMulDivOp(node: Node, opts: Options): Expr {
  assert(node.Type === MULDIV_OP, "Invalid Node Type");
  const text = node.token?.text;
  assert(text, "Empty token text");
  const [left, right] = compileInfixOp(node, opts);
  return withNode([text, ...left, ...right], node);
}

function compileSubtractionOp(node: Node, opts: Options): Expr {
  assert(node.Type === SUB, "Invalid Node Type");
  assert(node.token?.text, "Empty token text");
  const [left, right] = compileInfixOp(node, opts);
  return withNode([node.token?.text, ...left, ...right], node);
}

// ----------------------------------------------------------------

function compileUnaryOp(node: Node, opts: Options) {
  if (node.children.length > 1) {
    throw new CompileError("Unexpected expression", { node: node.children[1] });
  } else if (node.children.length === 0) {
    throw new CompileError("Expected expression", { node });
  }
  const func = COMPILE.get(node.children[0].Type);
  if (!func) {
    throw new CompileError("Invalid node type", { node: node.children[0] });
  }
  return func;
}

function compileInfixOp(node: Node, opts: Options) {
  if (node.children.length > 2) {
    throw new CompileError("Unexpected expression", { node: node.children[2] });
  } else if (node.children.length === 0) {
    throw new CompileError("Expected expressions", { node });
  }
  const leftFn = COMPILE.get(node.children[0].Type);
  if (!leftFn) {
    throw new CompileError("Invalid node type", { node: node.children[0] });
  }
  const rightFn = COMPILE.get(node.children[1].Type);
  if (!rightFn) {
    throw new CompileError("Invalid node type", { node: node.children[1] });
  }

  const text = node.token?.text;
  let left: any = leftFn(node.children[0], opts);
  if (Array.isArray(left) && left[0].toUpperCase() === text?.toUpperCase()) {
    const [op, ...args] = left;
    left = args;
  } else {
    left = [left];
  }

  let right: any = rightFn(node.children[1], opts);
  right = [right];
  return [left, right];
}

function withNode<T>(expr: T, node: Node): T {
  if (typeof expr === "object") {
    Object.defineProperty(expr, "node", {
      writable: false,
      enumerable: false,
      value: node,
    });
  }
  return expr;
}

// ----------------------------------------------------------------

const COMPILE = new Map<NodeType, CompileFn>([
  [FIELD, compileField],
  [ADD, compileAdditionOp],
  [LOGICAL_AND, compileLogicalAnd],
  [CALL, compileFunctionCall],
  [EQUALITY, compileEqualityOp],
  [NUMBER, compileNumber],
  [LOGICAL_NOT, compileLogicalNot],
  [NEGATIVE, compileNegative],
  [LOGICAL_OR, compileLogicalOr],
  [COMPARISON, compileComparisonOp],
  [GROUP, compileGroup],
  [MULDIV_OP, compileMulDivOp],
  [STRING, compileString],
  [SUB, compileSubtractionOp],
  [IDENTIFIER, compileIdentifier],
]);