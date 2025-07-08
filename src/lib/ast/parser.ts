import { AstNode } from './types'
import * as ts from 'typescript'
import { generateId } from '@/lib/utils'

/** Create deterministic id based on source node range & kind to enable two-way sync */
const idFromNode = (n: ts.Node) => `${n.pos}_${n.end}_${n.kind}`;

/**
 * VERY lightweight parser that converts top-level TypeScript constructs into
 * our internal `AstNode` representation.  This is **NOT** a full TypeScript
 * parser – it only handles a handful of common declarations that we care
 * about for seeding the flow editor from example code.
 */
export class Parser {
  /**
   * Parse TypeScript/TSX code into AST nodes understood by the FlowEditor.
   * Currently supports:
   *  • Interface declarations
   *  • Function declarations (non-overloaded)
   *  • `const` variable statements (first declaration only)
   */
  parseCode(code: string): AstNode[] {
    const nodes: AstNode[] = []

    const source = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, /*setParentNodes*/ true)

    /** Helper: create node & push, returns id */
    const pushNode = (n: AstNode, source: ts.Node) => {
      n.pos = source.pos;
      n.end = source.end;
      nodes.push(n);
      return n.id;
    }

    /** Recursive walker to extract Call & PropertyAccess expressions */
    const walkExpr = (expr: ts.Expression, parentId?: string) => {
      if (ts.isCallExpression(expr)) {
        const id = idFromNode(expr)
        const funcName = expr.expression.getText()
        const args = expr.arguments.map(a => a.getText())
        const node: AstNode = {
          id,
          type: 'call',
          parentId,
          data: { funcName, args, type: 'call' } as any,
        }
        pushNode(node, expr)
        // Walk callee expression as child of this call
        if (ts.isPropertyAccessExpression(expr.expression) || ts.isCallExpression(expr.expression)) {
          walkExpr(expr.expression, id)
        }
        // Also walk argument expressions
        expr.arguments.forEach(a => {
          if (ts.isExpression(a)) walkExpr(a, id)
        })
        return id
      }

      if (ts.isPropertyAccessExpression(expr)) {
        const id = idFromNode(expr)
        const objExpr = expr.expression.getText()
        const property = expr.name.getText()
        const node: AstNode = {
          id,
          type: 'propertyAccess',
          parentId,
          data: { objExpr, property, type: 'propertyAccess' } as any,
        }
        pushNode(node, expr)
        // Walk deeper into object expression
        walkExpr(expr.expression, id)
        return id
      }

      // Binary expressions (e.g. a + b, x && y)
      if (ts.isBinaryExpression(expr)) {
        const id = idFromNode(expr);

        // Binary operator token text (e.g. '+', '===', '&&')
        const operator = expr.operatorToken.getText();

        // Left-hand and right-hand side raw expression text
        const lhsText = expr.left.getText();
        const rhsText = expr.right.getText();

        const node: AstNode = {
          id,
          type: 'binaryOp',
          parentId,
          data: {
            operator,
            lhs: lhsText,
            rhs: rhsText,
            type: 'binaryOp',
          } as any,
        };

        pushNode(node, expr);

        // Walk into both sides of the expression to capture nested calls, etc.
        walkExpr(expr.left, id);
        walkExpr(expr.right, id);

        return id;
      }

      // Identifier treated as object reference within chain
      if (ts.isIdentifier(expr)) {
        const id = idFromNode(expr);
        const name = expr.text;
        const node: AstNode = {
          id,
          type: 'object',
          parentId,
          data: { name, type: 'object' } as any,
        };
        pushNode(node, expr);
        return id;
      }

      // Object literal expression
      if (ts.isObjectLiteralExpression(expr)) {
        const id = idFromNode(expr);
        const properties = expr.properties
          .filter(ts.isPropertyAssignment)
          .map((p) => ({
            key: (p.name as ts.Identifier).text,
            value: p.initializer?.getText(),
          }));

        const node: AstNode = {
          id,
          type: 'object',
          parentId,
          data: { properties, type: 'object' } as any,
        };
        pushNode(node, expr);

        // Walk property values for nested expressions
        expr.properties.forEach((p) => {
          if (ts.isPropertyAssignment(p)) {
            walkExpr(p.initializer, id);
          }
        });
        return id;
      }

      // Literal expressions
      if (
        ts.isStringLiteral(expr) ||
        ts.isNumericLiteral(expr) ||
        (expr.kind === ts.SyntaxKind.TrueKeyword) ||
        (expr.kind === ts.SyntaxKind.FalseKeyword)
      ) {
        const id = idFromNode(expr);
        const valueText = expr.getText();
        const literalType = ts.isStringLiteral(expr)
          ? 'string'
          : ts.isNumericLiteral(expr)
          ? 'number'
          : 'boolean';

        const node: AstNode = {
          id,
          type: 'literal',
          parentId,
          data: {
            value: valueText.replace(/^['\"]|['\"]$/g, ''),
            literalType,
            type: 'literal',
          } as any,
        };
        pushNode(node, expr);
        return id;
      }

      if (ts.isConditionalExpression(expr)) {
        const id = idFromNode(expr);
        // Extract raw texts for condition, whenTrue, whenFalse
        const testText = expr.condition.getText();
        const whenTrueText = expr.whenTrue.getText();
        const whenFalseText = expr.whenFalse.getText();

        const node: AstNode = {
          id,
          type: 'conditional',
          parentId,
          data: {
            testExpr: testText,
            whenTrue: whenTrueText,
            whenFalse: whenFalseText,
            type: 'conditional',
          } as any,
        };
        pushNode(node, expr);

        // Walk into nested expressions
        walkExpr(expr.condition, id);
        walkExpr(expr.whenTrue, id);
        walkExpr(expr.whenFalse, id);

        return id;
      }

      // For BinaryExpression or others, you might add more cases later
      return undefined
    }

    source.statements.forEach((stmt) => {
      // Import declarations
      if (ts.isImportDeclaration(stmt)) {
        const id = idFromNode(stmt);
        const moduleSpecifier = (stmt.moduleSpecifier as ts.StringLiteral).text;
        let defaultImport: string | undefined;
        let namespaceImport: string | undefined;
        const named: string[] = [];

        if (stmt.importClause) {
          if (stmt.importClause.name) {
            defaultImport = stmt.importClause.name.getText();
          }
          if (stmt.importClause.namedBindings) {
            if (ts.isNamespaceImport(stmt.importClause.namedBindings)) {
              namespaceImport = stmt.importClause.namedBindings.name.getText();
            } else if (ts.isNamedImports(stmt.importClause.namedBindings)) {
              stmt.importClause.namedBindings.elements.forEach(el => {
                named.push(el.name.getText());
              });
            }
          }
        }

        nodes.push({
          id,
          type: 'import',
          pos: stmt.pos,
          end: stmt.end,
          data: {
            module: moduleSpecifier,
            imported: named,
            defaultImport,
            namespaceImport,
            type: 'import',
          } as any,
        } as AstNode);
        return; // continue
      }

      // Export declarations (named)
      if (ts.isExportDeclaration(stmt)) {
        const id = idFromNode(stmt);
        const moduleSpecifier = stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)
          ? stmt.moduleSpecifier.text
          : undefined;
        const exported: string[] = [];
        if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
          stmt.exportClause.elements.forEach(el => exported.push(el.name.getText()));
        }

        nodes.push({
          id,
          type: 'export',
          pos: stmt.pos,
          end: stmt.end,
          data: {
            module: moduleSpecifier,
            exported,
            type: 'export',
          } as any,
        } as AstNode);
        return;
      }
      // Interface declarations
      if (ts.isInterfaceDeclaration(stmt)) {
        const id = generateId()
        const name = stmt.name.text
        const members = stmt.members
          .filter(ts.isPropertySignature)
          .map((m) => ({
            name: (m.name as ts.Identifier).text,
            type: m.type ? m.type.getText() : 'any',
          }))

        nodes.push({
          id,
          type: 'interface',
          data: { name, members },
          pos: stmt.pos,
          end: stmt.end,
        } as AstNode)
      }

      // Function declarations
      else if (ts.isFunctionDeclaration(stmt) && stmt.name) {
        const id = generateId()
        const name = stmt.name.text
        const parameters = stmt.parameters.map((p) => ({
          name: p.name.getText(),
          type: p.type ? p.type.getText() : undefined,
        }))
        const returnType = stmt.type ? stmt.type.getText() : undefined
        const isAsync = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false

        // Extract raw body text (without surrounding braces) so we can
        // faithfully regenerate the original implementation when no graph
        // changes have been made yet.
        let body: string | undefined = undefined
        if (stmt.body && ts.isBlock(stmt.body)) {
          // Collect each statement text to avoid leading/trailing braces
          body = stmt.body.statements.map((s) => s.getText()).join('\n')
        }

        nodes.push({
          id,
          type: 'function',
          data: {
            name,
            parameters,
            returnType,
            async: isAsync,
            body,
          },
          pos: stmt.pos,
          end: stmt.end,
        } as AstNode)

        // Walk body to extract nested expressions (call, property access)
        if (stmt.body) {
          stmt.body.forEachChild(child => {
            if (ts.isReturnStatement(child) && child.expression) {
              walkExpr(child.expression, id)
            } else if (ts.isExpressionStatement(child)) {
              const inner = child.expression
              walkExpr(inner, id)
            }
          })
        }
      }

      // Variable declarations (only handle const for now)
      else if (ts.isVariableStatement(stmt)) {
        const firstDecl = stmt.declarationList.declarations[0]
        if (!firstDecl || !ts.isIdentifier(firstDecl.name)) return

        const id = generateId()
        const name = firstDecl.name.text
        const variableType = firstDecl.type ? firstDecl.type.getText() : undefined
        const initializer = firstDecl.initializer ? firstDecl.initializer.getText() : undefined

        nodes.push({
          id,
          type: 'variable',
          data: {
            name,
            variableType,
            initializer,
          },
          pos: stmt.pos,
          end: stmt.end,
        } as AstNode)
      }
    })

    return nodes
  }
} 