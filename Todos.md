# CLAST TODOs

## 🚨 High-Priority (Q2)

- [x] Refactor state flow to minimise `useEffect` cascades
  - [x] Single source-of-truth `code` string lives in `FlowEditor`
  - [x] `nodes`/`edges` derived from `parser.parseCode(code)`
  - [x] `CodePreview` is controlled by `code` prop
  - [x] `FlowCanvas` receives controlled graph + change callbacks
- [ ] Deep-parse expression chains in `Parser`
  - [x] Walk function bodies to detect `PropertyAccessExpression` and `CallExpression`
  - [x] Create `propertyAccess`, `call`, and `object` nodes with proper `parentId`
  - [x] Record edges during walk for React-Flow
  - [x] Support nested chains like `Math.random().toString(36).substring(7)`
- [ ] Auto-layout / edge reconstruction on parser output
  - [x] Map AST hierarchy → node positions (simple vertical stack first)
  - [x] Build edges array so graph renders functional dependencies immediately
- [x] Remove placeholder binary-op auto-insert in `FunctionNode`; real body is always expressed via parsed child nodes

---

## Current Focus: AST Visualization and Editing

### 1. Immediate Bug-Fixes

- [x] Break circular import between `FunctionNode` ↔ `node-types`
  - [x] Remove `node-types` import from `FunctionNode`
  - [x] Inject local `nodeTypes` object via `useMemo`
- [ ] Restore node & edge update persistence after FlowEditor refactor
  - [x] Persist node position moves (`nodes.upsert`)
  - [x] Persist node deletions (`nodes.remove`)
  - [x] Persist edge deletions (`edges.remove`)
- [x] Re-add `flows.updatePreview` save on code changes in sidebar
- [x] Re-introduce initial code → flow graph parsing on mount
- [x] Tighten `FlowContextMenu.wrapperRef` prop typing (remove `null` union)
- [x] Remove residual barrel `node-types.ts` by inlining map into `FlowCanvas`

### 🚧 Follow-ups for state-flow refactor
  - [x] When canvas connections change, set `parentId`/edges for round-trip fidelity
  - [x] Regenerate code after edge additions/removals
  - [x] Wrap new `onNodesChange/onEdgesChange` with Convex persistence helpers
  - [x] Remove legacy local state & demo helpers in `FlowCanvas`

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

### 9. Authentication & Billing (AuthJS + Stripe)

#### 9A  AuthJS × Convex

- [ ] Finish **client-side** `src/lib/ConvexAdapter.ts` proxy
  - [ ] Import generated API and call `api.authAdapter.*` functions with `secret`
  - [ ] Remove temporary `@ts-ignore` once compiled
- [ ] Add required **environment variables** to `.env.local`
  - `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`
  - `CONVEX_AUTH_ADAPTER_SECRET`, `CONVEX_AUTH_PRIVATE_KEY`
- [ ] Set up `convex/auth.config.ts` with JWT provider entry
- [ ] Publish JWKS via Convex HTTP action (`/.well-known/jwks.json`)
- [ ] Run `npx convex dev` to regenerate types; deploy when stable
- [ ] UI wiring
  - [ ] Sign-In / Sign-Out buttons + avatar in `SiteHeader`
  - [ ] Server route guards (`auth()` + `redirect`)
- [ ] Retire / refactor `EnsureUser` once `users.ensureFromAuth` is active

#### 9B  Stripe Billing

- [ ] Extend Convex schema with `subscriptions` table (plan, status, etc.)
- [ ] `/api/stripe/checkout` — create Checkout Session
- [ ] `/api/stripe/webhook` — verify signature & upsert subscription row
- [ ] `/api/stripe/portal` — Customer Portal redirect helper _(optional)_
- [ ] Build **/pricing** page with plan cards + Upgrade CTA
- [ ] Add Billing section in Settings → *Manage Subscription* link
- [ ] Implement `useSubscriptionStatus()` hook & `hasActivePlan()` Convex query
- [ ] Gate premium features via hook / query
- [ ] Cypress e2e: free → paid upgrade flow

#### 9C  DX & Docs

- [ ] `.env.example` updated with new variables
- [ ] README "Auth & Billing" quick-start section
- [ ] Remove temporary `@ts-ignore` + placeholder stubs once complete

### 10. Secure Environment Variable Storage

- [x] Convex schema: `env_vars` table
- [x] Node-based AES-256-GCM encryption actions (`convex/envVars.ts`)
- [x] Core queries/mutations in default runtime (`convex/envVarsCore.ts`)
- [x] Client helper wrapper (`src/lib/EnvVarsClient.ts`)
- [x] Shared-secret auth (`CONVEX_ENV_VARS_SECRET`)
- [x] Docs & README update
- [ ] UI surface in Settings → add/edit/delete secrets (TBD)
- [ ] Role-based access to secrets for collaborators (stretch)

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