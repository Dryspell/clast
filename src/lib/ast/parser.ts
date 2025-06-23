import { AstNode } from './types'
import * as ts from 'typescript'
import { generateId } from '@/lib/utils'

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
    const pushNode = (n: AstNode) => {
      nodes.push(n)
      return n.id
    }

    /** Recursive walker to extract Call & PropertyAccess expressions */
    const walkExpr = (expr: ts.Expression, parentId?: string) => {
      if (ts.isCallExpression(expr)) {
        const id = generateId()
        const funcName = expr.expression.getText()
        const args = expr.arguments.map(a => a.getText())
        const node: AstNode = {
          id,
          type: 'call',
          parentId,
          data: { funcName, args, type: 'call' } as any,
        }
        pushNode(node)
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
        const id = generateId()
        const objExpr = expr.expression.getText()
        const property = expr.name.getText()
        const node: AstNode = {
          id,
          type: 'propertyAccess',
          parentId,
          data: { objExpr, property, type: 'propertyAccess' } as any,
        }
        pushNode(node)
        // Walk deeper into object expression
        walkExpr(expr.expression, id)
        return id
      }

      // Binary expressions (e.g. a + b, x && y)
      if (ts.isBinaryExpression(expr)) {
        const id = generateId();

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

        pushNode(node);

        // Walk into both sides of the expression to capture nested calls, etc.
        walkExpr(expr.left, id);
        walkExpr(expr.right, id);

        return id;
      }

      // For BinaryExpression or others, you might add more cases later
      return undefined
    }

    source.statements.forEach((stmt) => {
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
        } as AstNode)
      }
    })

    return nodes
  }
} 