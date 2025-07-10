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
        const id = idFromNode(stmt) // Use deterministic ID based on AST position
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
        const id = idFromNode(stmt) // Use deterministic ID based on AST position
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

        const id = idFromNode(stmt) // Use deterministic ID based on AST position
        const name = firstDecl.name.text
        const variableType = firstDecl.type ? firstDecl.type.getText() : undefined
        const initializer = firstDecl.initializer ? firstDecl.initializer.getText() : undefined

        // Improved handling: Detect call expressions and convert back to CallNode
        // This handles any variable initialized with a function call, not just those with specific naming
        if (firstDecl.initializer && ts.isCallExpression(firstDecl.initializer)) {
          const callExpr = firstDecl.initializer;
          const funcName = callExpr.expression.getText();
          const args = callExpr.arguments.map(a => a.getText());
          
          // Heuristics to determine if this was a generated CallNode vs user variable:
          // 1. Naming pattern suggests generated (call_, log_, etc.)
          // 2. Variable name matches the function being called (suggesting auto-generated)
          // 3. Simple function call with no complex expressions
          const looksGenerated = 
            name.startsWith('call_') || 
            name.startsWith('log_') ||
            name === `call_${funcName}` ||
            /^(call|result|output)_[a-f0-9]+$/.test(name); // Generated ID pattern
          
          if (looksGenerated) {
            nodes.push({
              id,
              type: 'call',
              data: {
                name: name, // Use the variable name as the node name
                funcName,
                args,
                expectedArgs: args, // Use actual args as expected for now
                label: name,
                type: 'call'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            // Also walk the call expression for nested patterns
            walkExpr(callExpr);
          } else {
            // Treat as regular variable but walk the call expression
            nodes.push({
              id,
              type: 'variable',
              data: {
                name,
                variableType,
                initializer,
                type: 'variable'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            // Still walk the expression to capture nested calls
            walkExpr(callExpr);
          }
        }
        // Binary operations: variables containing binary expressions
        else if (firstDecl.initializer && ts.isBinaryExpression(firstDecl.initializer)) {
          const binExpr = firstDecl.initializer;
          const operator = binExpr.operatorToken.getText();
          const lhs = binExpr.left.getText();
          const rhs = binExpr.right.getText();
          
          // Detect generated binary operations
          const looksGenerated = 
            name.startsWith('bin_') ||
            /^(bin|binary|op)_[a-f0-9_]+$/.test(name);
          
          if (looksGenerated) {
            nodes.push({
              id,
              type: 'binaryOp',
              data: {
                name,
                operator,
                lhs,
                rhs,
                type: 'binaryOp'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            walkExpr(binExpr);
          } else {
            // Treat as regular variable but walk the expression
            nodes.push({
              id,
              type: 'variable',
              data: {
                name,
                variableType,
                initializer,
                type: 'variable'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            walkExpr(binExpr);
          }
        }
        // Console logs: variables with IIFE patterns like `(() => { console.log(x); return x; })()`
        else if (firstDecl.initializer && ts.isCallExpression(firstDecl.initializer) && 
                 ts.isArrowFunction(firstDecl.initializer.expression)) {
          const callExpr = firstDecl.initializer;
          const arrowFunc = callExpr.expression;
          
          // Detect console.log IIFE pattern
          const looksLikeConsoleLog = 
            name.startsWith('log_') ||
            /^log_[a-f0-9_]+$/.test(name) ||
            (ts.isArrowFunction(arrowFunc) && ts.isBlock(arrowFunc.body) && 
             arrowFunc.body.statements.some((stmt: ts.Statement) => 
               ts.isExpressionStatement(stmt) && 
               ts.isCallExpression(stmt.expression) &&
               stmt.expression.expression.getText().includes('console.log')
             ));
          
          if (looksLikeConsoleLog) {
            // Extract the logged expression from the IIFE
            let valueExpr = 'undefined';
            if (ts.isArrowFunction(arrowFunc) && ts.isBlock(arrowFunc.body)) {
              const consoleStmt = arrowFunc.body.statements.find((stmt: ts.Statement) => 
                ts.isExpressionStatement(stmt) && 
                ts.isCallExpression(stmt.expression) &&
                stmt.expression.expression.getText().includes('console.log')
              );
              if (consoleStmt && ts.isExpressionStatement(consoleStmt) && 
                  ts.isCallExpression(consoleStmt.expression)) {
                const logArgs = consoleStmt.expression.arguments;
                if (logArgs.length > 0) {
                  valueExpr = logArgs[0].getText();
                }
              }
            }
            
            nodes.push({
              id,
              type: 'console',
              data: {
                name,
                label: name,
                valueExpr,
                type: 'console'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            walkExpr(callExpr);
          } else {
            // Regular variable
            nodes.push({
              id,
              type: 'variable',
              data: {
                name,
                variableType,
                initializer,
                type: 'variable'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            walkExpr(callExpr);
          }
        }
        // Property access: variables with property access expressions
        else if (firstDecl.initializer && ts.isPropertyAccessExpression(firstDecl.initializer)) {
          const propExpr = firstDecl.initializer;
          const objExpr = propExpr.expression.getText();
          const property = propExpr.name.getText();
          
          // Detect generated property access
          const looksGenerated = 
            name.startsWith('prop_') ||
            /^prop_[a-f0-9_]+$/.test(name);
          
          if (looksGenerated) {
            nodes.push({
              id,
              type: 'propertyAccess',
              data: {
                name,
                objExpr,
                property,
                type: 'propertyAccess'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            walkExpr(propExpr);
          } else {
            // Regular variable
            nodes.push({
              id,
              type: 'variable',
              data: {
                name,
                variableType,
                initializer,
                type: 'variable'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            walkExpr(propExpr);
          }
        }
        // Conditional expressions: variables with ternary operators
        else if (firstDecl.initializer && ts.isConditionalExpression(firstDecl.initializer)) {
          const condExpr = firstDecl.initializer;
          const testExpr = condExpr.condition.getText();
          const whenTrue = condExpr.whenTrue.getText();
          const whenFalse = condExpr.whenFalse.getText();
          
          // Detect generated conditional
          const looksGenerated = 
            name.startsWith('cond_') ||
            /^cond_[a-f0-9_]+$/.test(name);
          
          if (looksGenerated) {
            nodes.push({
              id,
              type: 'conditional',
              data: {
                name,
                testExpr,
                whenTrue,
                whenFalse,
                type: 'conditional'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            walkExpr(condExpr);
          } else {
            // Regular variable
            nodes.push({
              id,
              type: 'variable',
              data: {
                name,
                variableType,
                initializer,
                type: 'variable'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            walkExpr(condExpr);
          }
        }
        // Literal values: variables with simple literal initializers
        else if (firstDecl.initializer && (
          ts.isStringLiteral(firstDecl.initializer) ||
          ts.isNumericLiteral(firstDecl.initializer) ||
          firstDecl.initializer.kind === ts.SyntaxKind.TrueKeyword ||
          firstDecl.initializer.kind === ts.SyntaxKind.FalseKeyword
        )) {
          const literalExpr = firstDecl.initializer;
          
          // Detect generated literals
          const looksGenerated = 
            name.startsWith('lit_') ||
            /^lit_[a-f0-9_]+$/.test(name);
          
          if (looksGenerated) {
            const valueText = literalExpr.getText();
            const literalType = ts.isStringLiteral(literalExpr)
              ? 'string'
              : ts.isNumericLiteral(literalExpr)
              ? 'number'
              : 'boolean';
            
            nodes.push({
              id,
              type: 'literal',
              data: {
                name,
                value: valueText.replace(/^['\"]|['\"]$/g, ''),
                literalType,
                type: 'literal'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
          } else {
            // Regular variable
            nodes.push({
              id,
              type: 'variable',
              data: {
                name,
                variableType,
                initializer,
                type: 'variable'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
          }
        }
        // Object literals: variables with object literal expressions
        else if (firstDecl.initializer && ts.isObjectLiteralExpression(firstDecl.initializer)) {
          const objExpr = firstDecl.initializer;
          
          // Detect generated object literals
          const looksGenerated = 
            name.startsWith('obj_') ||
            /^obj_[a-f0-9_]+$/.test(name);
          
          if (looksGenerated) {
            const properties = objExpr.properties
              .filter(ts.isPropertyAssignment)
              .map((p) => ({
                key: (p.name as ts.Identifier).text,
                value: p.initializer?.getText(),
              }));
            
            nodes.push({
              id,
              type: 'object',
              data: {
                name,
                properties,
                type: 'object'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            walkExpr(objExpr);
          } else {
            // Regular variable
            nodes.push({
              id,
              type: 'variable',
              data: {
                name,
                variableType,
                initializer,
                type: 'variable'
              },
              pos: stmt.pos,
              end: stmt.end,
            } as AstNode);
            
            walkExpr(objExpr);
          }
        }
        // Regular variable handling
        else {
          nodes.push({
            id,
            type: 'variable',
            data: {
              name,
              variableType,
              initializer,
              type: 'variable'
            },
            pos: stmt.pos,
            end: stmt.end,
          } as AstNode)
        }
      }
    })

    return nodes
  }
} 