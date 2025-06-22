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

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](.github/CONTRIBUTING.md) before submitting pull requests.
