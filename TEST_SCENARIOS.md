# CLAST – Manual Test Scenarios

This checklist lets any teammate verify that a fresh checkout of **main** works end-to-end before pushing changes. Run through it whenever you touch auth, persistence, or billing.

> NOTE  These are *manual* steps. A future task will migrate them to Playwright / Cypress.

---

## 1  Environment bootstrap

| # | Step | Expected Result |
|---|------|----------------|
|1|`pnpm install`| Dependencies install w/o errors |
|2|`npx convex dev`| Convex dev server starts, prints URL |
|3|Create `.env.local` from `.env.example`| All vars present, no missing-var warnings |
|4|`pnpm dev`| Next.js compiles, opens http://localhost:3000 |

---

## 2  Anonymous flow (unauthenticated)

1. **Visit** `/flows` → Click "+" New Flow".<br/>   • A new flow document opens.<br/>   • URL = `/flows/<id>`.
2. **Drag** a node, refresh page.<br/>   • Node position persists (anonymous `users.ensure` is working).

---

## 3  Sign-in / Sign-out (AuthJS + Convex)

1. Click **Sign in** button in header → Choose GitHub.<br/>   • OAuth completes, you return to `/flows`.
2. **DevTools > Application > Cookies**: `next-auth.session-token` present.<br/>   • `session.user.email` matches GitHub email.
3. **Network tab**: first Convex WS frame includes `Authorization: Bearer <jwt>`.<br/>   • No 401s printed in Convex dev console.
4. Refresh page.<br/>   • Header shows avatar dropdown (not *Sign in*).<br/>   • Anonymous flow you created now belongs to your auth user (optional but nice-to-have).
5. Click **Sign out** in avatar menu.<br/>   • Cookie cleared, header returns to *Sign in*.

---

## 4  Realtime collaboration

1. Open two browser tabs signed in with same account.<br/>2. Move a node in Tab A → Tab B updates within <1 s.<br/>3. Delete a node in Tab B → Tab A updates.

---

## 5  JWT validation (JWKS)

1. Copy JWT from Network → paste into <https://jwt.io>.<br/>   • *Signature Verified* (public key from `/.well-known/jwks.json`).
2. Stop Convex, run `JWKS=invalid npx convex dev`.<br/>   • Page reload fails Convex queries with **401**. *(Don't commit – just sanity check)*

---

## 6  Code-gen round-trip

1. In Flow editor, add a **Literal** node and connect it to **BinaryOp**.<br/>2. Check **Code Preview** pane → shows updated TS code.
3. Edit code in Monaco, save → Flow graph updates accordingly (two-way sync TBD).

---

## 7  Stripe billing (only when keys configured)

1. Visit **/pricing** → Click *Upgrade*.<br/>2. Stripe Checkout opens, pay with test card `4242 4242 4242 4242`.<br/>3. Success URL `/dashboard/billing` loads, Convex `subscriptions` row created with `status=active`.<br/>4. Header shows **PRO** badge or premium feature unlocked.

*(Skip if Stripe keys not configured—mark test as N/A.)*

---

## 8  Regression quick-suite

After every PR:
1. Run **steps 2.1-2.2** (anonymous flow).  
2. Run **steps 3.1-3.2** (sign-in works).  
3. Ensure `pnpm lint` passes.

---

Happy testing! 🎉 