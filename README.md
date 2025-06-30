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

### Database Schema (ConvexDB)

| Table | Purpose |
|-------|---------|
| `users` | Authenticated or anonymous visitor records (`authId` OR `anonId`) |
| `flows` | Top-level visual flows owned by a user; stores title & `codePreview` snapshot |
| `flow_nodes` | Individual diagram nodes (`type`, position, `data`) |
| `flow_edges` | Edges between nodes (`source`, `target`, handles) |

> All tables are reactive—every client subscribed to a query automatically receives live updates.

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

3. Start a Convex dev deployment (leave this running in a separate terminal):

   ```bash
   npx convex dev
   ```

   This command will:
   • prompt for GitHub login & create a project
   • write `NEXT_PUBLIC_CONVEX_URL` & `CONVEX_DEPLOYMENT_URL` into `.env.local`
   • generate a `convex/` folder for your server functions

4. Set up any remaining environment variables:

   ```bash
   cp .env.example .env.local
   ```

5. Start the development server:

   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to view the application

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

## 🔐 Authentication (AuthJS + Convex)

CLAST uses [AuthJS](https://authjs.dev/) (formerly **NextAuth**) to provide a secure, standards-based authentication flow on top of the Next.js App Router. AuthJS handles the heavy lifting of OAuth hand-shakes and session management, while Convex stores application-specific user data.

### High-Level Flow

1. **Client** triggers `signIn()` – AuthJS redirects to the chosen OAuth provider.
2. After the callback, AuthJS issues a stateless **JWT session** stored in a cookie.
3. The **AuthJS server route** ( `/api/auth/[...nextauth]/route.ts` ) exposes helper utilities (`auth()`, `getServerSession()`).
4. A Convex mutation `users.ensureFromAuth` runs on first login to upsert the user record, linking the AuthJS `sub` to our `users` table.
5. Protected server actions/components call `auth()` to retrieve the session and enforce access rules.

### Implementation Checklist

- Install packages:
  ```bash
  pnpm add next-auth @auth/core
  ```
- Create `/src/app/api/auth/[...nextauth]/route.ts` with:
  ```ts
  export const { auth, handlers } = NextAuth({
    providers: [
      GitHub({ clientId: process.env.GITHUB_ID!, clientSecret: process.env.GITHUB_SECRET! }),
      /* add more providers */
    ],
    session: { strategy: "jwt" },
    callbacks: {
      async signIn({ user }) {
        await convex.mutation("users:ensureFromAuth", { user })
        return true
      },
    },
  })
  ```
- Wrap RSC tree with `<SessionProvider>` in `src/app/layout.tsx` for client side access.
- Use the `auth()` helper in server components and API routes to gate access.
- Add simple UI controls in the **SiteHeader**: *Sign in / Sign out* button and user avatar dropdown.
- Add the following to `.env.local`:
  ```bash
  NEXTAUTH_SECRET=...           # openssl rand -base64 32
  NEXTAUTH_URL=http://localhost:3000
  GITHUB_ID=...
  GITHUB_SECRET=...
  ```

### Key Generation & Convex JWKS Setup

1. **Generate RSA key-pair** (private key stays in Next.js env):
   ```bash
   # Private key (PEM)
   openssl genrsa -out convex-private.pem 2048
   # Public key
   openssl rsa -in convex-private.pem -pubout -out convex-public.pem
   ```

2. **Convert public key → JWKS**  
   Visit <https://mkjwk.org> (or any tool) → paste _convex-public.pem_ → select RSA-256 → copy the JSON under "JWK Set".

3. **Environment variables**
   Add the following to `.env.local` (Next.js) **and** to Convex env vars:
   ```bash
   # NextAuth / Adapter
   CONVEX_AUTH_PRIVATE_KEY="$(cat convex-private.pem)"
   CONVEX_AUTH_ADAPTER_SECRET=superSharedValue

   # The JWKS JSON string (public key) – **only in Convex env**
   JWKS='{ "keys": [ … ] }'
   ```

   • In local dev you can run `JWKS='{"keys":[…]}' npx convex dev` or pass `--env-file`.  
   • In the Convex dashboard open *Environment Variables* → add `JWKS`.

4. Restart `npx convex dev` & `pnpm dev` – AuthJS tokens will now validate end-to-end.

## 💸 Payments & Billing (Stripe)

Stripe powers CLAST's subscription and billing flows. We use **Checkout Sessions** for purchases and **Customer Portal** for self-service plan management.

### High-Level Flow

1. Authenticated user clicks *Upgrade* → calls `/api/stripe/checkout` to create a Checkout Session.
2. Stripe redirects back to `/dashboard/billing?session_id=…` on success.
3. Webhook at `/api/stripe/webhook` receives `checkout.session.completed`, `invoice.paid`, etc.
4. Webhook handler verifies the signature, then a Convex mutation `subscriptions.upsert` records the active plan.
5. Front-end components query `api.billing.getStatus` to unlock paid-only features.

### Implementation Checklist

- Install packages:
  ```bash
  pnpm add stripe @stripe/stripe-js
  ```
- Create `/src/app/api/stripe/checkout/route.ts`:
  ```ts
  const session = await stripe.checkout.sessions.create({
    customer_email: session.user.email,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_PRO_ID, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  })
  return NextResponse.json({ url: session.url })
  ```
- Add `/src/app/api/stripe/webhook/route.ts` to handle events and update Convex.
- Build `/pricing` page with plan cards and a call-to-action button.
- Add *Billing* section in user **Settings** with *Manage Subscription* (Customer Portal) link.
- Protect premium functionality with a `useSubscriptionStatus()` hook that reads Convex data.
- Environment variables required in `.env.local`:
  ```bash
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  STRIPE_PRICE_PRO_ID=price_...
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

> 💡 *Tip*: Use Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) during local development.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](.github/CONTRIBUTING.md) before submitting pull requests.

### Try it out locally

After running both `npx convex dev` and `pnpm dev`, open http://localhost:3000/flows to:

1. Create a new flow with "+" New Flow".
2. Get redirected to `/flows/<id>` where every node / edge change is saved live to Convex.

Multiple browser tabs (or teammates) will see updates in real-time.
