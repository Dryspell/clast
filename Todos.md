# CLAST TODOs

## Current Focus: AST Visualization and Editing

### 1. Immediate Bug-Fixes

- [x] Break circular import between `FunctionNode` ↔ `node-types`
  - [x] Remove `node-types` import from `FunctionNode`
  - [x] Inject local `nodeTypes` object via `useMemo`

### 2. AST Parser & Code-Gen Pipeline

- [ ] Build AST parser service
  - [ ] Tokenise & parse TypeScript with `@babel/parser`
  - [ ] Map AST → Flow nodes (`AstNode -> ReactFlow.Node`)
  - [ ] Handle `import` / `export` statements
  - [ ] Capture source ranges for later code mapping
- [ ] Implement generator
  - [ ] Flow nodes → valid TS code
  - [ ] Preserve formatting via Prettier
  - [x] Regenerate on node changes (instant)

### 3. Function-Node UX (MVP)

- [ ] Parameter chips
  - [x] Inline add / edit / delete (basic text input implemented; chip UI TBD)
  - [ ] Drag-to-reorder (`@dnd-kit/sortable`)
  - [ ] Type badges & colour-coding
- [ ] Body section
  - [ ] Toggle between text and Nested-Flow view
  - [ ] Collapsible preview with syntax highlight
- [ ] Validation
  - [ ] Highlight unconnected params
  - [ ] Show return-type badge; warn if missing

### 4. Nested Flow Enhancements

- [ ] Scope panel drag-to-canvas to auto-create nodes
- [ ] Detect unreachable nodes & surface warnings

### 5. Editor & Preview

- [ ] Two-way sync Monaco ↔ Flow graph
- [ ] Real-time type-checking in WebWorker
- [ ] Error markers map back to offending nodes

### 6. User Experience Strategy

- [ ] Progressive disclosure: composite ↔ expanded node toggle
- [ ] Polymorphic **SmartNode** that auto-decomposes expressions
- [ ] Wizards & templates for common integration patterns
- [ ] AI intent capture input box (natural language → flow graph)
- [ ] Inline Monaco "island" editor inside any node
- [ ] Dynamic suggestion bar during edge creation (type-aware)
- [ ] Focus & clutter management (auto-collapse, breadcrumbs)
- [ ] Dual persona defaults remembered per user

### 7. Expression Nodes Roadmap

- [ ] Implement core expression nodes
  - [x] `BinaryOp`
  - [x] `Literal`
  - [x] `CallExpression` (Execute-Function node)
  - [ ] `PropertyAccess`
  - [ ] `Conditional`
- [ ] Surface inferred type badges using TypeScript checker
- [ ] Mini-flow overlay inside `FunctionNode` for pure expressions
- [ ] Store AST `pos`/`end` on every node for round-trip fidelity
- [ ] DAG layout on demand for expanded expression graphs
- [ ] Prototype slice: `BinaryOpNode` + `LiteralNode` round-trip (`a + b` → `return a + b`)

### 8. Real-Time Collaboration & Persistence (ConvexDB)

- [x] Convex schema
  - [x] `users` table
  - [x] `flows` table
  - [x] `flow_nodes` table
  - [x] `flow_edges` table
- [x] Anonymous user bootstrap
  - [x] Generate / persist `anonId` in `localStorage`
  - [x] `users.ensure` mutation to upsert row
- [x] Flow CRUD mutations & queries
  - [x] `flows.create`
  - [x] `flows.listMine`
  - [x] `flows.delete` (optional)
- [x] Node & Edge persistence
  - [x] `nodes.upsert` / `edges.upsert`
  - [x] `nodes.remove` / `edges.remove`
- [x] Wire `FlowEditor` to Convex
  - [x] Subscribe to `api.nodes.listByFlow`
  - [x] Call mutations on drag / edit events
- [x] Generated code snapshots (`flows.codePreview`)
- [ ] Presence & cursor sharing (stretch)

### Future Enhancements
- [ ] Add more node types
  - [ ] Transform nodes
  - [ ] Condition nodes
  - [ ] Loop nodes
- [ ] Implement node configuration dialogs
- [ ] Add API testing features
- [ ] Add authentication
- [ ] Create proper dashboard layout
- [ ] Add code generation templates
- [ ] Support multiple files/modules
- [ ] Add version control integration
- [ ] Implement undo/redo functionality
- [ ] Add search and navigation features
- [ ] Support code formatting options
- [ ] Add export/import functionality
- [ ] Implement code validation rules
- [ ] Add automated testing support 