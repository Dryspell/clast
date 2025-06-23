import { AstNode } from './types';
import { Project, SourceFile, VariableDeclarationKind } from 'ts-morph';

/**
 * Service for generating TypeScript code from AST nodes
 */
export class CodeGenerator {
  private project: Project;
  private sourceFile: SourceFile;

  constructor() {
    // Create a new in-memory ts-morph project so we never touch Node fs.
    this.project = new Project({ useInMemoryFileSystem: true });
    this.sourceFile = this.project.createSourceFile('generated.ts', '', { overwrite: true });
  }

  /**
   * Generate TypeScript code from AST nodes
   */
  generateCode(nodes: AstNode[]): string {
    // Clear any previous statements
    this.project.removeSourceFile(this.sourceFile);
    this.sourceFile = this.project.createSourceFile('generated.ts', '', { overwrite: true });

    // Pre-compute child map
    const childrenByParent: Record<string, AstNode[]> = {};

    for (const n of nodes) {
      if (n.parentId) {
        childrenByParent[n.parentId] = childrenByParent[n.parentId] || [];
        childrenByParent[n.parentId].push(n);
      }
    }

    // Add each top-level construct to the source file
    for (const node of nodes) {
      if (node.parentId) continue; // Only handle top-level here
      switch (node.type) {
        case 'interface':
          this.addInterface(node);
          break;
        case 'function':
          this.addFunction(node, childrenByParent[node.id] ?? []);
          break;
        case 'variable':
          this.addVariable(node);
          break;
        case 'literal':
          this.addLiteral(node);
          break;
        case 'binaryOp':
          this.addBinaryOp(node);
          break;
        case 'api':
          this.addApi(node);
          break;
        case 'console':
          this.addConsole(node);
          break;
        case 'call':
          this.addCall(node);
          break;
        case 'propertyAccess':
          this.addPropertyAccess(node);
          break;
        default:
          // Unknown – just place a comment so users see an issue instead of silent failure
          this.sourceFile.addStatements(`// Unknown node type: ${node.type}`);
      }
      // Separate statements with blank line for readability
      this.sourceFile.addStatements('\n');
    }

    return this.sourceFile.getFullText();
  }

  private addInterface(node: AstNode) {
    this.sourceFile.addInterface({
      name: node.data.name,
      isExported: true,
      properties: (node.data.members ?? []).map(m => ({ name: m.name, type: m.type })),
    });
  }

  private addVariable(node: AstNode) {
    this.sourceFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [{
        name: node.data.name,
        initializer: node.data.initializer ?? 'undefined',
        type: node.data.variableType,
      }],
    });
  }

  private addFunction(node: AstNode, children: AstNode[]) {
    const scopedVars = children.filter(c => c.type === 'variable');
    const binaryOps = children.filter(c => c.type === 'binaryOp');

    // Build parameter structures
    const rawParams = node.data.parameters ?? [];
    const normalizedParams = (rawParams as any[]).map((p) => {
      if (typeof p === 'string') {
        const [name, type] = p.split(':').map((s) => s.trim());
        return { name, type };
      }
      return p;
    });

    // Parameter names for shadowing avoidance
    const paramNames = new Set(normalizedParams.map(p => p.name));

    // Create the function declaration
    const func = this.sourceFile.addFunction({
      isExported: true,
      name: node.data.name,
      parameters: normalizedParams.map(p => ({ name: p.name, type: p.type })),
      returnType: node.data.returnType ?? undefined,
      isAsync: node.data.async ?? false,
    });

    // Add inner variable declarations (no shadows, no duplicates)
    const seen = new Set<string>();
    for (const v of scopedVars) {
      if (paramNames.has(v.data.name) || seen.has(v.data.name)) continue;
      seen.add(v.data.name);
      func.addStatements(`const ${v.data.name}${v.data.variableType ? `: ${v.data.variableType}` : ''} = ${v.data.initializer ?? 'undefined'};`);
    }

    // If there's a binary operation node with both operands defined, use it as return expression
    const firstBin = binaryOps.find(b => b.data.lhs && b.data.rhs);

    if (firstBin) {
      func.addStatements(`return ${firstBin.data.lhs} ${firstBin.data.operator ?? '+'} ${firstBin.data.rhs};`);
    } else if (normalizedParams.length >= 2) {
      func.addStatements(`return ${normalizedParams[0].name} + ${normalizedParams[1].name};`);
    } else {
      func.addStatements('// TODO: Implement function body');
    }
  }

  private addLiteral(node: AstNode) {
    let initializer = node.data.value ?? 'undefined';
    const lt = node.data.literalType ?? 'string';
    if (lt === 'string') initializer = `"${initializer}"`;
    else if (lt === 'number' || lt === 'boolean') {
      // leave as-is, assume value is valid
    }
    this.sourceFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [{ name: `lit_${node.id.replace(/-/g,'_')}`, initializer }],
    });
  }

  private addBinaryOp(node: AstNode) {
    if (node.data.lhs && node.data.rhs) {
      const expr = `${node.data.lhs} ${node.data.operator ?? '+'} ${node.data.rhs}`;
      this.sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [{ name: `bin_${node.id.replace(/-/g,'_')}`, initializer: expr }],
      });
    } else {
      this.sourceFile.addStatements(`// Binary operation '${node.data.operator ?? '?'}' is not yet fully connected`);
    }
  }

  /**
   * Add an async fetch wrapper function for API nodes
   */
  private addApi(node: AstNode) {
    // Determine a safe function name based on the label or fallback
    const rawLabel = (node.data as any).label || (node.data as any).name || `api_${node.id}`;
    const funcName = rawLabel
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, '_') // replace invalid chars
      .replace(/^([0-9])/, '_$1'); // cannot start with digit

    const endpoint = (node.data as any).endpoint ?? '';
    const method = (node.data as any).method ?? 'GET';
    const headers = (node.data as any).headers as Record<string, string> | undefined;
    const body = (node.data as any).body as string | undefined;

    const optsLines: string[] = [];
    if (method && method !== 'GET') optsLines.push(`method: '${method}'`);
    if (headers && Object.keys(headers).length) {
      optsLines.push(`headers: ${JSON.stringify(headers, null, 2)}`);
    }
    if (body && method !== 'GET') {
      // Try to detect if body seems like JSON string already
      const maybeJSON = body.trim().startsWith('{') || body.trim().startsWith('[');
      const bodyValue = maybeJSON ? body : JSON.stringify(body);
      optsLines.push(`body: ${bodyValue}`);
    }

    const optsObject = optsLines.length
      ? `{
${optsLines.map(l => '  ' + l).join(',\n')}
}`
      : '{}';

    const func = this.sourceFile.addFunction({
      name: funcName,
      isExported: true,
      isAsync: true,
      returnType: 'Promise<any>',
      parameters: [],
    });

    // Build the fetch call statements line by line for clarity
    func.addStatements([
      `const response = await fetch('${endpoint}', ${optsObject});`,
      'if (!response.ok) {',
      '  throw new Error(`Request failed: ${response.status}`);',
      '}',
      'return await response.json();',
    ]);
  }

  /**
   * Add console.log side-effect with pass-through variable so downstream nodes can use the value
   */
  private addConsole(node: AstNode) {
    const expr = (node.data as any).valueExpr ?? 'undefined';
    const varName = `log_${node.id.replace(/-/g, '_')}`;
    const initializer = `(() => { console.log(${expr}); return ${expr}; })()`;
    this.sourceFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [{ name: varName, initializer }],
    });
  }

  /**
   * Add call expression node which invokes another function and stores result
   */
  private addCall(node: AstNode) {
    const funcName = (node.data as any).funcName ?? 'unknownFunc';
    const argsArr = ((node.data as any).args ?? []) as string[];
    const args = argsArr.map((a) => a ?? 'undefined').join(', ');
    const varName = `call_${node.id.replace(/-/g, '_')}`;
    this.sourceFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [
        {
          name: varName,
          initializer: `${funcName}(${args})`,
        },
      ],
    });
  }

  private addPropertyAccess(node: AstNode) {
    const prop = (node.data as any).property ?? 'prop';
    const objExpr = (node.data as any).objExpr ?? 'undefined';
    const varName = `prop_${node.id.replace(/-/g, '_')}`;
    const initializer = `(${objExpr}).${prop}`;
    this.sourceFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [{ name: varName, initializer }],
    });
  }
} 