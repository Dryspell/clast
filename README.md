# CLAST - Code-Less API Sync Tool

CLAST is a modern web application that enables non-technical users to create and manage data synchronization flows between different third-party APIs through an intuitive visual interface. Built with Next.js 15 and leveraging the power of React Server Components, CLAST transforms visual flow diagrams into executable TypeScript code.

## 🌟 Key Features

- **Visual Flow Editor**: Built with React Flow for intuitive drag-and-drop flow creation and always-editable inline node controls (no modals required)
- **Code Generation**: Automatic TypeScript code generation that reflects every keystroke in the diagram
- **Live Code Preview**: Monaco Editor integration that re-generates instantly whenever a node changes
- **Modern UI**: Beautiful and accessible interface using ShadcN components
- **Real-time Collaboration**: Powered by ConvexDB for live updates
- **Type-Safe**: Full TypeScript support throughout the application

## 🏗️ Technical Architecture

### Frontend Stack

- **Framework**: Next.js 15 with App Router
- **UI Components**: ShadcN (Radix UI + Tailwind CSS)
- **Flow Editor**: React Flow (@xyflow/react)
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **State Management**: React Server Components + ConvexDB
- **Styling**: Tailwind CSS

### Backend Stack

- **Database**: ConvexDB (Real-time Database)
- **API Layer**: Next.js API Routes + React Server Components
- **Code Generation**: TypeScript AST manipulation

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   ├── error.tsx          # Error boundary
│   ├── layout.tsx         # Root layout
│   ├── loading.tsx        # Loading state
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── flow/             # Flow editor components
│   ├── monaco/           # Code editor components
│   └── ui/               # ShadcN components
├── lib/                   # Utility functions
│   ├── ast/              # TypeScript AST utilities
│   ├── convex/           # ConvexDB configuration
│   └── utils/            # Helper functions
└── types/                # TypeScript type definitions
```

## 🚀 Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/clast.git
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application

## 📖 Documentation

- [AI Development Context](.github/AI_CONTEXT.md) - Comprehensive guide for AI assistants working with this codebase
- [Contributing Guidelines](.github/CONTRIBUTING.md) - How to contribute to the project
- [Security](.github/SECURITY.md) - Security policies and procedures

## 🧭 Roadmap & UX Strategy

### Expression Graph & AST Round-Trip

- **Model**: Parse TypeScript AST into granular Flow nodes only when the user drills into a function or expression.
- **Node taxonomy**: `CallExpression`, `BinaryOp`, `Literal`, `PropertyAccess`, `Conditional`, etc.
- **Round-trip guarantee**: Each flow node stores the original `pos`/`end` source positions, so we can always regenerate the exact TypeScript representation.
- **Layout & performance**: Run a lightweight DAG layout on the *currently expanded* sub-flow and auto-collapse into a compact card when zoomed out or off-screen.

### Progressive Complexity Patterns

1. **Progressive disclosure** – present high-level composite blocks by default; allow experts to expand into fine-grained nodes with one click.
2. **Polymorphic "Smart" node** – a single omni-node that infers its exact internal graph from a free-text expression (e.g. `price * qty + tax`).
3. **Wizards & templates** – guided UI for common patterns (CRUD, pagination loop, retry-with-backoff).
4. **AI-assisted intent capture** – natural-language prompt ("Generate Shopify order sync that retries 3× on 5xx") produces a pre-wired flow.
5. **Inline Monaco "islands"** – any node can switch to a mini code editor; the snippet is parsed back into expression nodes behind the scenes.
6. **Dynamic suggestion bar** – when the user starts a connection, show a filtered palette based on type compatibility.
7. **Focus & clutter management** – auto-collapse distant sub-flows, hover to preview, breadcrumb path for navigation.
8. **Dual-persona defaults** – remember whether the user prefers high-level or detailed view and default future nodes accordingly.

### Minimum Viable Slice

- Add `BinaryOpNode` and `LiteralNode` components.
- Extend `createNestedFlowData()` demo to render `a + b` wired into `return`.
- Verify round-trip by regenerating `return a + b` via the code-gen pipeline.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](.github/CONTRIBUTING.md) before submitting pull requests.
