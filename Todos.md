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

### Future Enhancements
- [ ] Add more node types
  - [ ] Transform nodes
  - [ ] Condition nodes
  - [ ] Loop nodes
- [ ] Implement node configuration dialogs
- [ ] Set up real-time collaboration with Convex
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