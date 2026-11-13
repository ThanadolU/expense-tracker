# Weekly Engineering Summary (Sep 13 – Sep 20, 2026)
**Project:** Personal Expense Tracker  
**Period:** September 13, 2026 – September 20, 2026  
**Primary Focus:** Phase 5 Expansion (Recurring Expenses, Receipt Storage, Password Reset, Modal UX, iOS Safari Fixes)

---

## 1. Executive Summary

During this week, the Expense Tracker transitioned from a single-entry expense logging tool into a comprehensive financial management platform. Major milestones completed include:

1. **Recurring Expenses Engine (5E):** Automated recurring expense generation with template management across multiple cadences (Daily, Weekly, Monthly, Yearly).
2. **Cloudflare R2 Receipt Attachments (5F):** End-to-end receipt upload pipeline with S3-compatible cloud storage, secure image streaming, and interactive preview modal.
3. **Self-Service Password Reset Flow:** Cryptographic token generation, transactional email dispatch, and password reset interfaces.
4. **Prisma Client Cache Modernization:** Eliminated dev-server model delegate caching bugs by replacing complex Proxy wrappers with deterministic model delegate verification.
5. **iOS Safari WebKit Overflow Bug Fix:** Resolved native date picker box-model overflow breaking mobile layouts on iPhone Safari.
6. **Expense Creation Modal & Form Lifecycle UX:** Converted the static inline creation form into an accessible modal dialog, fixed React state/DOM desynchronization on form reset, and added submission pending spinners.

---

## 2. New Features Delivered

### 2.1 Recurring Expenses Engine (Feature 5E)
* **Status:** Complete & Shipped
* **Key Commits:** `90db4aa`, `604cdeb`
* **Key Files:**
  - `prisma/schema.prisma`
  - `src/lib/recurring.ts`
  - `src/lib/recurring-utils.ts`
  - `src/lib/actions/recurring.ts`
  - `src/app/(app)/recurring/page.tsx`
  - `src/components/recurring/recurring-list.tsx`
  - `src/components/recurring/recurring-form-dialog.tsx`

#### Capabilities Built:
- **Data Model:**
  - Introduced `RecurringCadence` enum: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.
  - Added `RecurringExpense` model linked to `User`, `Category`, and `PaymentMethod`.
  - Added optional `recurringExpenseId` relation on `Expense` to trace generated expenses back to their template.
- **Automated Generation Engine (`src/lib/recurring.ts`):**
  - Implemented `generateDueRecurringExpenses(userId)` which evaluates overdue active templates (`nextDueDate <= now`).
  - Generates concrete `Expense` records in batch database transactions.
  - Automatically advances `nextDueDate` using cadence math (`calculateNextDueDate`) and updates `lastGeneratedAt`.
  - Seamlessly triggers upon user navigation to expenses or dashboard to ensure data is always up-to-date.
- **Management UI:**
  - Full CRUD interface under `/recurring` with cadence badges, next due date indicators, and pause/resume active toggles.

---

### 2.2 Cloudflare R2 Receipt Attachments (Feature 5F)
* **Status:** Complete & Shipped
* **Key Commits:** `3777d1a`, `27bb8b4`
* **Key Files:**
  - `src/lib/r2.ts`
  - `src/app/api/receipts/[id]/route.ts`
  - `src/components/expenses/receipt-upload-input.tsx`
  - `src/components/expenses/receipt-modal.tsx`
  - `src/lib/actions/expenses.ts`

#### Capabilities Built:
- **Cloud Object Storage (`src/lib/r2.ts`):**
  - Integrated `@aws-sdk/client-s3` configured for Cloudflare R2's S3-compatible API.
  - Generates collision-resistant keys: `receipts/${userId}/${timestamp}-${randomUUID}.${ext}`.
  - Provides upload (`PutObjectCommand`), streaming download (`GetObjectCommand`), and deletion (`DeleteObjectCommand`).
- **Authenticated Access Control (`src/app/api/receipts/[id]/route.ts`):**
  - Secure API route verifying session ownership before streaming images or returning presigned URLs. Prevents unauthorized file access.
- **Interactive UI Components:**
  - **`ReceiptUploadInput`:** Drag-and-drop file upload with client-side thumbnail preview, file size/type validation, and quick-remove button.
  - **`ReceiptModal`:** High-resolution zoomable viewer triggered from expense list rows to inspect slips and receipts.

---

### 2.3 Password Reset Flow
* **Status:** Complete & Shipped
* **Key Commits:** `3777d1a`
* **Key Files:**
  - `prisma/schema.prisma` (`PasswordResetToken` model)
  - `src/lib/actions/password-reset.ts`
  - `src/lib/email.ts`
  - `src/app/(auth)/forgot-password/page.tsx`
  - `src/app/(auth)/reset-password/page.tsx`
  - `src/components/auth/forgot-password-form.tsx`
  - `src/components/auth/reset-password-form.tsx`

#### Capabilities Built:
- **Token Security:** Generates cryptographically strong random tokens stored with SHA-256 / hashed references and an explicit expiration window (1 hour).
- **Email Delivery:** Configured transactional email sender via `src/lib/email.ts` supporting production SMTP/API and dev-mode fallback logging.
- **Complete Auth Loop:** "Forgot password?" trigger on login page, email dispatch confirmation, token validation on `/reset-password?token=...`, secure bcrypt password update, and token invalidation.

---

### 2.4 Expense Creation Modal & Form UX
* **Status:** Complete & Shipped
* **Key Commits:** `27bb8b4`
* **Key Files:**
  - `src/app/(app)/expenses/page.tsx`
  - `src/components/expenses/expense-create-form.tsx`

#### Capabilities Built:
- Converted the static inline expense creation form on `/expenses` into an accessible modal dialog.
- Moved the primary action to a prominent `+ Add expense` button in the header.
- Implemented keyboard accessibility (`Escape` key listener) and backdrop click to close.
- Integrated a dynamic `key={formKey}` remounting mechanism that forces complete state teardown whenever the modal is opened.

---

### 2.5 Submit Button Loading Spinners
* **Status:** Complete & Shipped
* **Key Commits:** `317c0fe`
* **Key Files:**
  - `src/components/expenses/expense-create-form.tsx`
  - `src/components/expenses/expense-row.tsx`
  - `src/components/recurring/recurring-form-dialog.tsx`

#### Capabilities Built:
- Because receipt image uploads to Cloudflare R2 stream through Next.js server actions before PostgreSQL writes, requests take a few seconds on mobile networks.
- Integrated animated SVG spinners (`animate-spin`) into submit buttons when actions are in a pending state (`isPending`).
- Dynamically swapped button text (`"Add expense"` -> `"Adding..."`, `"Save"` -> `"Saving..."`).
- Disabled buttons during submission to block duplicate requests.

---

## 3. Critical Problems Encountered & Solutions

### 3.1 iOS Safari Date/Month Input Overflow Bug
* **Problem:** On iPhone Safari, `<input type="date">` and `<input type="month">` controls expanded beyond the boundaries of their parent container `<div>`, causing horizontal scrolling and broken card layouts.
* **Root Cause Analysis:**
  - WebKit’s user-agent stylesheet sets `-webkit-appearance: date-and-time-value;` on native date and time controls.
  - When this appearance rule is active, WebKit **ignores `box-sizing: border-box`**.
  - A field with `w-full` (`width: 100%`) plus `px-3` (24px horizontal padding) and `border` (2px) was computed as `100% + 26px`, causing a 26px overflow outside its parent column.
  - Additionally, CSS Grid items default to `min-width: auto`, allowing inputs to dictate column widths.
* **Solution Implemented (`commit 5340427`):**
  1. In `src/app/globals.css`, normalized date inputs:
     ```css
     input[type="date"],
     input[type="month"],
     .date-input {
       -webkit-appearance: none;
       appearance: none;
       display: block;
       max-width: 100%;
       box-sizing: border-box;
     }

     input[type="date"]::-webkit-date-and-time-value,
     input[type="month"]::-webkit-date-and-time-value {
       text-align: left;
       min-height: 1.25rem;
     }
     ```
  2. Added `min-w-0` to all grid item containers across `expense-create-form.tsx`, `expense-row.tsx`, `recurring-form-dialog.tsx`, and `budget-overall-card.tsx` to prevent child elements from expanding grid tracks.

---

### 3.2 Responsive Header Layout Squishing
* **Problem:** When setting the header summary container width to `w-[25vw]` for desktop monitors, mobile screens (~390px) squished the title and description into a narrow ~97px column.
* **Solution:** Replaced fixed viewport width with responsive breakpoint utilities:
  ```tsx
  <div className="w-full sm:w-[25vw] space-y-2">
  ```
  This ensures 100% fluid width on mobile screens while maintaining the desired 25vw constrained column on desktop screens.

---

### 3.3 Receipt Upload Input Desynchronization & Memory Leaks
* **Problem:** After successfully adding an expense, the native HTML form was reset via `formRef.current?.reset()`, but the image preview thumbnail remained visible on screen.
* **Root Cause:**
  - `form.reset()` clears DOM input values, but does **not** trigger React state changes.
  - The component's internal state (`selectedFile`, `previewUrl`) remained intact.
  - Failing to revoke previous preview URLs created persistent memory leaks from browser `blob:` references.
* **Solution Implemented (`commit 27bb8b4`):**
  1. Added a `reset` DOM event listener on the parent form within `ReceiptUploadInput`:
     ```tsx
     useEffect(() => {
       const form = inputRef.current?.form;
       if (!form) return;
       const handleReset = () => {
         setSelectedFile(null);
         setPreviewUrl((prev) => {
           if (prev) URL.revokeObjectURL(prev);
           return null;
         });
       };
       form.addEventListener("reset", handleReset);
       return () => form.removeEventListener("reset", handleReset);
     }, []);
     ```
  2. Paired this with a dynamic `key={formKey}` on the modal dialog so that opening the modal initiates a clean, unmounted state.

---

### 3.4 Next.js Dev Server Prisma Client Invalidation
* **Problem:** During development, schema migrations (adding `PasswordResetToken` or `RecurringExpense`) caused runtime crashes where `prisma.passwordResetToken` was `undefined` because Next.js HMR preserved the stale `globalThis.prisma` singleton. An earlier experimental Proxy wrapper added overhead and inconsistency.
* **Solution Implemented (`commit 33f856c`):**
  Replaced the Proxy with an explicit model validation check in `src/lib/prisma.ts`:
  ```typescript
  function getPrismaClient(): PrismaClient {
    const cached = globalForPrisma.prisma;
    if (
      cached &&
      typeof cached === "object" &&
      "category" in cached && cached.category != null &&
      "expense" in cached && cached.expense != null &&
      "user" in cached && cached.user != null &&
      "budget" in cached && cached.budget != null &&
      "recurringExpense" in cached && cached.recurringExpense != null &&
      "passwordResetToken" in cached && cached.passwordResetToken != null
    ) {
      return cached;
    }
    const client = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
    return client;
  }
  export const prisma = getPrismaClient();
  ```

---

## 4. Technical Knowledge Gained

| Topic | Key Finding | Best Practice Established |
| :--- | :--- | :--- |
| **WebKit Input Styling** | `-webkit-appearance: date-and-time-value` overrides CSS `box-sizing: border-box`. | Always pair `-webkit-appearance: none` with `box-sizing: border-box` and style `::-webkit-date-and-time-value`. |
| **Grid Column Containment** | CSS Grid children with intrinsic sizing overflow parent containers. | Always apply `min-w-0` to grid column wrapper cells containing forms or text. |
| **Blob URL Lifecycle** | `URL.createObjectURL` allocates browser memory that persists until page reload unless explicitly released. | Always call `URL.revokeObjectURL(prev)` when replacing or clearing image previews. |
| **DOM vs. React Form State** | Native `form.reset()` clears input values in the DOM but never triggers React `onChange` or resets React state. | Listen for the native `reset` event on the form element to synchronize React state with DOM resets. |
| **Server Actions with File Uploads** | Streaming files to S3 inside Server Actions blocks until upload completion. | Always expose pending states (`useActionState`) and provide visual spinner feedback to prevent duplicate submissions. |
| **Prisma Singletons in Next.js HMR** | Global singletons survive hot reload but miss schema updates. | Use deterministic model key presence checks rather than complicated Proxies to recreate clients when models are added. |

---

## 5. Database Migrations Applied This Week

1. **`20260913132939_add_recurring_expenses`**
   - Added `RecurringCadence` enum (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).
   - Created `RecurringExpense` table with foreign keys to `User`, `Category`.
   - Added `recurringExpenseId` foreign key to `Expense`.
2. **`20260913132939_add_expense_receipts`**
   - Added `receiptKey` (`String?`) and `receiptUrl` (`String?`) to `Expense`.
3. **`20260919020138_add_password_reset_token`**
   - Created `PasswordResetToken` table (`id`, `token`, `userId`, `expiresAt`, `createdAt`).

---

## 6. Git Commit Log Reference

```
commit 4bb4efa - 2026-09-20 - Merge branch 'dev'
commit 317c0fe - 2026-09-20 - feat: add loading spinner to submit buttons during pending state
commit 27bb8b4 - 2026-09-20 - refactor: convert expense creation form into a modal dialog and improve receipt upload cleanup
commit 5340427 - 2026-09-20 - fix: prevent input overflow and improve native date picker layout responsiveness
commit d675db5 - 2026-09-20 - Merge branch 'dev'
commit 33f856c - 2026-09-20 - refactor: replace prisma proxy with direct client initialization and simplified model checks
commit 798be81 - 2026-09-20 - Merge branch 'dev'
commit 3777d1a - 2026-09-20 - feat: implement password reset flow and receipt attachments for expenses
commit 604cdeb - 2026-09-13 - feat: add server actions for managing recurring expenses
commit 90db4aa - 2026-09-13 - feat: add recurring expenses support with templates, management UI, and automated generation
```

---

## 7. Current Project Status & What's Next

### Current Feature Status (Phase 5)
- [x] **5A — Budgets:** Monthly total and category caps.
- [x] **5B — Payment Methods:** Categorization by Thai banks, cash, PromptPay with SVG badge iconography.
- [x] **5C — CSV Export:** Filtered export of expenses.
- [x] **5E — Recurring Expenses:** Automated recurring cadence generation & template UI.
- [x] **5F — Receipts:** Cloudflare R2 uploads, streaming route, viewer modal.
- [x] **Password Reset:** Self-service token reset with transactional email.
- [x] **Mobile UX Polish:** Fixed WebKit date overflow, modal dialog workflow, and pending submission spinners.

### Next Roadmap Item:
- **5G — Shared Household / Multi-member Support:**
  - Multi-user membership within shared spaces.
  - Shared expense logs with optional split & settle tracking.
