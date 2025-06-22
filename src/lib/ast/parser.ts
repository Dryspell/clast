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

        nodes.push({
          id,
          type: 'function',
          data: {
            name,
            parameters,
            returnType,
            async: isAsync,
          },
        } as AstNode)
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