# Phase 4 Technical Specification: Expense Manager

**Version:** 1.0
**Date:** 2026-04-08
\*\*Status:\*\* Implemented
**PRD Reference:** `docs/MyFocusHub_PRD.md` v1.0
**Phase 1 Spec:** `docs/TECHNICAL_SPEC.md` v1.0
**Phase 2 Spec:** `docs/PHASE2_SPEC.md` v1.0
**Phase 3 Spec:** `docs/PHASE3_SPEC.md` v1.0

---

## 1. Overview

A full-featured expense tracking module integrated into the NoBrainy sidebar. Users can manually add expenses, bulk-import from bank/SMS CSV/TXT exports, categorize with preset or custom categories, and visualize spending through interactive charts and a month-vs-category matrix.

### 1.1 Core Capabilities

| # | Feature | Priority | Schema Change |
|---|---------|----------|---------------|
| 1 | Expense CRUD | P0 | Yes |
| 2 | Category management (preset + custom) | P0 | Yes |
| 3 | CSV/TXT file import | P0 | No |
| 4 | Monthly summary matrix (category × month) | P0 | No |
| 5 | Interactive charts & visualizations | P1 | No |
| 6 | Tags & filtering | P1 | No |
| 7 | Dashboard overview with insights | P2 | No |

### 1.2 Dependency Graph

```
[Expense CRUD] ──→ [CSV Import]
      │
      ▼
[Category Mgmt] ──→ [Monthly Matrix]
      │                    │
      ▼                    ▼
[Tags & Filtering] ──→ [Charts & Viz]
                           │
                           ▼
                    [Dashboard Overview]
```

---

## 2. Database Schema

### 2.1 New Models

```prisma
model ExpenseCategory {
  id        String    @id @default(cuid())
  userId    String
  name      String
  slug      String
  icon      String    @default("tag")       // lucide icon name
  color     String    @default("#6B7280")   // hex color for charts
  isDefault Boolean   @default(false)       // preset categories
  sortOrder Int       @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expenses Expense[]

  @@unique([userId, slug])
  @@index([userId])
}

model Expense {
  id         String   @id @default(cuid())
  userId     String
  categoryId String
  name       String
  amount     Decimal  @db.Decimal(12, 2)
  date       DateTime @db.Date
  tags       String[] @default([])
  notes      String?
  source     String   @default("manual")   // "manual" | "csv_import" | "txt_import"
  importRef  String?                        // original line from import file
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  category ExpenseCategory @relation(fields: [categoryId], references: [id])

  @@index([userId, date])
  @@index([userId, categoryId])
  @@index([userId, date, categoryId])
}
```

### 2.2 Preset Categories (seeded on first access)

| Category | Slug | Icon | Color |
|----------|------|------|-------|
| Shopping | shopping | `shopping-bag` | `#F59E0B` |
| Food Order | food-order | `utensils` | `#EF4444` |
| EMI | emi | `landmark` | `#8B5CF6` |
| My Car | my-car | `car` | `#3B82F6` |
| Grocery | grocery | `shopping-cart` | `#10B981` |
| Cabs | cabs | `map-pin` | `#F97316` |
| Medicines | medicines | `pill` | `#EC4899` |
| Family | family | `users` | `#6366F1` |
| Cats | cats | `cat` | `#A855F7` |
| Petrol | petrol | `fuel` | `#64748B` |
| Credit | credit | `credit-card` | `#DC2626` |
| Travel | travel | `plane` | `#0EA5E9` |
| Hospital | hospital | `hospital` | `#F43F5E` |
| Bills | bills | `receipt` | `#84CC16` |
| Subscriptions | subscriptions | `repeat` | `#7C3AED` |
| Self Care | self-care | `heart` | `#FB923C` |
| Leisure | leisure | `gamepad-2` | `#22D3EE` |
| Dining | dining | `wine` | `#E11D48` |
| Donations | donations | `hand-heart` | `#059669` |
| My Home | my-home | `home` | `#D97706` |
| Insurance | insurance | `shield` | `#4F46E5` |
| Investment | investment | `trending-up` | `#16A34A` |
| Unknown | unknown | `help-circle` | `#9CA3AF` |

### 2.3 Migration

One migration file: `add_expense_manager`
- Creates `ExpenseCategory` and `Expense` tables
- No changes to existing models

---

## 3. API Routes

### 3.1 Expense Categories

```
GET    /api/expenses/categories          → List user's categories (auto-seed defaults on first call)
POST   /api/expenses/categories          → Create custom category
PATCH  /api/expenses/categories/:id      → Update category (name, icon, color, sortOrder)
DELETE /api/expenses/categories/:id      → Delete category (only custom, must have 0 expenses)
```

### 3.2 Expenses

```
GET    /api/expenses                     → List expenses (filterable by date range, category, tags)
POST   /api/expenses                     → Create single expense
PATCH  /api/expenses/:id                 → Update expense
DELETE /api/expenses/:id                 → Delete expense
POST   /api/expenses/bulk                → Bulk create (for import)
DELETE /api/expenses/bulk                → Bulk delete (by filter)
```

### 3.3 Import

```
POST   /api/expenses/import              → Parse & preview CSV/TXT file (returns parsed rows, no DB write)
POST   /api/expenses/import/confirm      → Confirm import (writes parsed rows to DB)
```

### 3.4 Analytics

```
GET    /api/expenses/summary             → Monthly totals by category (the matrix view)
       ?startMonth=2025-01&endMonth=2025-06
GET    /api/expenses/trends              → Category trends over time (for line/area charts)
       ?months=6
GET    /api/expenses/stats               → Overview stats (total, avg, top category, month-over-month change)
       ?month=2025-06
```

---

## 4. File Structure

```
src/
├── app/(dashboard)/expenses/
│   ├── page.tsx                         # Main expense list + summary view
│   ├── import/page.tsx                  # Import wizard page
│   └── categories/page.tsx              # Category management page
├── app/api/expenses/
│   ├── route.ts                         # GET (list), POST (create)
│   ├── [id]/route.ts                    # GET, PATCH, DELETE
│   ├── bulk/route.ts                    # POST (bulk create), DELETE (bulk delete)
│   ├── import/route.ts                  # POST (parse & preview)
│   ├── import/confirm/route.ts          # POST (confirm import)
│   ├── categories/route.ts             # GET, POST
│   ├── categories/[id]/route.ts        # PATCH, DELETE
│   ├── summary/route.ts                # GET (month × category matrix)
│   ├── trends/route.ts                 # GET (chart data)
│   └── stats/route.ts                  # GET (overview stats)
├── components/expenses/
│   ├── expense-list.tsx                 # Paginated expense table with inline edit
│   ├── expense-form.tsx                 # Create/edit expense dialog
│   ├── expense-filters.tsx              # Date range, category, tag filters
│   ├── expense-matrix.tsx               # Month × category summary table
│   ├── expense-import-wizard.tsx        # Multi-step import flow
│   ├── expense-import-preview.tsx       # Preview parsed data before confirm
│   ├── category-manager.tsx             # List/create/edit categories
│   ├── category-icon-picker.tsx         # Icon selection grid
│   ├── category-badge.tsx               # Colored category badge
│   ├── charts/
│   │   ├── monthly-bar-chart.tsx        # Total spend per month (bar)
│   │   ├── category-donut-chart.tsx     # Category breakdown (donut/pie)
│   │   ├── category-trend-chart.tsx     # Category trend lines over months
│   │   ├── daily-heatmap.tsx            # Spending heatmap calendar
│   │   └── top-categories-bar.tsx       # Horizontal bar — top N categories
│   └── dashboard/
│       ├── expense-overview.tsx         # Stats cards (total, avg, top)
│       └── expense-month-picker.tsx     # Month/year selector
├── hooks/
│   ├── use-expenses.ts                  # React Query hooks for expenses CRUD
│   ├── use-expense-categories.ts        # React Query hooks for categories
│   ├── use-expense-summary.ts           # React Query hook for matrix data
│   └── use-expense-import.ts            # Import flow state management
├── lib/
│   ├── types/expenses.ts                # TypeScript interfaces
│   ├── validations/expenses.ts          # Zod schemas
│   └── expenses/
│       ├── parser.ts                    # CSV/TXT parser with auto-detection
│       ├── category-matcher.ts          # Auto-match import rows to categories
│       └── formatters.ts                # Currency formatting (₹), date formatting
```

---

## 5. Import System

### 5.1 Supported Formats

**CSV (bank exports)**
```csv
Date,Description,Debit,Credit,Balance
07/04/2025,SWIGGY ORDER,450.00,,12340.00
07/04/2025,AMAZON PAY,2399.00,,9941.00
```

**TXT (SMS/message exports)**
```
INR 450.00 debited from A/c XX1234 on 07-Apr-25. UPI/SWIGGY/OrderID123
INR 2399.00 spent on HDFC CC XX5678 at AMAZON.IN on 07-Apr-25
```

### 5.2 Import Flow

```
[Upload File] → [Auto-detect format] → [Parse rows] → [Preview table]
                                                            │
                                              [Auto-categorize using keyword matching]
                                                            │
                                              [User reviews & adjusts categories]
                                                            │
                                              [Confirm] → [Bulk insert to DB]
```

### 5.3 Auto-Categorization Rules

Keyword-based matching (configurable per user in future):

```typescript
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'food-order': ['swiggy', 'zomato', 'uber eats', 'dominos'],
  'grocery': ['bigbasket', 'blinkit', 'zepto', 'dmart', 'more'],
  'cabs': ['uber', 'ola', 'rapido'],
  'shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho'],
  'petrol': ['hp petrol', 'bharat petroleum', 'iocl', 'fuel'],
  'subscriptions': ['netflix', 'spotify', 'hotstar', 'prime', 'youtube'],
  'bills': ['electricity', 'airtel', 'jio', 'water', 'broadband'],
  'emi': ['emi', 'loan', 'bajaj finserv'],
  'dining': ['restaurant', 'cafe', 'starbucks'],
  'medicines': ['pharmeasy', 'netmeds', '1mg', 'apollo pharmacy'],
  'travel': ['irctc', 'makemytrip', 'goibibo', 'cleartrip'],
  'insurance': ['lic', 'hdfc life', 'icici prudential'],
}
```

---

## 6. UI Design

### 6.1 Main Expenses Page (`/expenses`)

**Layout:** Three-tab view

```
[Expenses]  [Summary]  [Charts]
─────────────────────────────────
```

**Tab 1 — Expenses (default)**
- Filterable table: date, name, category badge, tags, amount
- Quick-add button (opens dialog)
- Import button (navigates to /expenses/import)
- Date range picker (defaults to current month)
- Category filter dropdown
- Sortable columns (date, amount, name)
- Inline delete with confirmation

**Tab 2 — Summary (matrix)**
- Month × category grid (as shown in requirements)
- Scrollable horizontally for many months
- Totals row at bottom, totals column on right
- Cell click → drills down to filtered expense list
- Month range picker (e.g., Jan 2025 – Jun 2025)
- Currency formatted with ₹ and Indian number system (₹1,23,456)

**Tab 3 — Charts**
- Month selector at top
- Grid of interactive charts:
  1. **Monthly spending bar chart** — last 6–12 months total
  2. **Category donut chart** — current month breakdown
  3. **Category trend lines** — multi-line chart, one per category
  4. **Daily spending heatmap** — calendar view like GitHub contributions
  5. **Top 5 categories** — horizontal bar chart

### 6.2 Import Page (`/expenses/import`)

**Step 1:** File upload (drag-and-drop or click)
**Step 2:** Preview table with auto-detected columns
**Step 3:** Category mapping (auto-suggested, user-editable per row)
**Step 4:** Confirm & import — shows count + total amount

### 6.3 Category Management (`/expenses/categories`)

- Grid of category cards with icon, name, color, expense count
- Drag to reorder
- "Add Category" card at end
- Edit dialog: name, icon picker, color picker
- Delete button (disabled if category has expenses, shows count)

---

## 7. Charts & Visualization

### 7.1 Library Choice

Use **Recharts** (`recharts`) — lightweight, React-native, good for the chart types needed. Add to dependencies:

```bash
pnpm add recharts
```

### 7.2 Chart Specifications

**Monthly Bar Chart**
- Type: Vertical bar
- X-axis: Months (Jan 25, Feb 25, ...)
- Y-axis: Total amount (₹)
- Hover: Tooltip with exact amount
- Click: Navigates to that month's summary
- Color: Gradient fill

**Category Donut Chart**
- Type: Donut/ring
- Segments: One per category (colored by category color)
- Center: Total amount for period
- Hover: Category name + amount + percentage
- Legend: Category names with colors

**Category Trend Lines**
- Type: Multi-line chart
- X-axis: Months
- Y-axis: Amount
- Lines: One per top-N category (user-selectable)
- Hover: Crosshair with all category values

**Daily Spending Heatmap**
- Type: Calendar heatmap (GitHub-style)
- Color scale: Light → dark green (or user's theme)
- Hover: Date + total spend
- 12-month view

**Top Categories Horizontal Bar**
- Type: Horizontal bar chart
- Sorted by amount descending
- Category badge (icon + color) as label
- Percentage label on bar

---

## 8. Implementation Roadmap

### Sprint 1 (P0 — Foundation)

| Task | Estimate | Dependencies |
|------|----------|-------------|
| Prisma schema + migration | 1h | None |
| Seed preset categories logic | 1h | Schema |
| Category API routes (CRUD) | 2h | Schema |
| Expense API routes (CRUD + bulk) | 3h | Schema |
| Summary API route (matrix query) | 2h | Schema |
| TypeScript types + Zod validations | 1h | None |
| React Query hooks (expenses, categories, summary) | 2h | API routes |
| **Sprint 1 total** | **~12h** | |

### Sprint 2 (P0 — Core UI)

| Task | Estimate | Dependencies |
|------|----------|-------------|
| Sidebar nav item (Wallet icon) | 0.5h | None |
| Expense list page with table | 3h | Hooks |
| Expense create/edit form dialog | 2h | Categories hook |
| Expense filters (date, category, tags) | 2h | Hooks |
| Category badge component | 0.5h | None |
| Expense matrix (month × category table) | 3h | Summary hook |
| Currency + date formatters (₹ Indian system) | 1h | None |
| **Sprint 2 total** | **~12h** | |

### Sprint 3 (P0 — Import)

| Task | Estimate | Dependencies |
|------|----------|-------------|
| CSV parser | 2h | None |
| TXT/SMS parser | 2h | None |
| Auto-categorization engine | 2h | Categories |
| Import preview UI | 3h | Parsers |
| Import confirm + bulk insert | 2h | Preview |
| Import API routes | 2h | Parsers |
| **Sprint 3 total** | **~13h** | |

### Sprint 4 (P1 — Charts & Polish)

| Task | Estimate | Dependencies |
|------|----------|-------------|
| Install Recharts | 0.5h | None |
| Monthly bar chart | 2h | Summary data |
| Category donut chart | 2h | Summary data |
| Category trend lines | 2h | Trends API |
| Daily spending heatmap | 3h | Expense data |
| Top categories bar | 1h | Summary data |
| Stats overview cards | 1h | Stats API |
| **Sprint 4 total** | **~11.5h** | |

### Sprint 5 (P1 — Category Management + Tags)

| Task | Estimate | Dependencies |
|------|----------|-------------|
| Category management page | 3h | Category API |
| Icon picker component | 2h | None |
| Color picker component | 1h | None |
| Tag input component | 1h | None |
| Tag-based filtering | 1h | Filters |
| Category reordering (drag-and-drop) | 2h | Categories |
| **Sprint 5 total** | **~10h** | |

### Total Estimate: ~58.5 hours across 5 sprints

---

## 9. Data Queries (Key SQL)

### 9.1 Monthly Category Matrix

```sql
SELECT
  ec.name AS category,
  TO_CHAR(e.date, 'YYYY-MM') AS month,
  SUM(e.amount) AS total
FROM "Expense" e
JOIN "ExpenseCategory" ec ON e."categoryId" = ec.id
WHERE e."userId" = $1
  AND e.date >= $2
  AND e.date <= $3
GROUP BY ec.name, TO_CHAR(e.date, 'YYYY-MM')
ORDER BY ec."sortOrder", month;
```

### 9.2 Monthly Totals

```sql
SELECT
  TO_CHAR(e.date, 'YYYY-MM') AS month,
  SUM(e.amount) AS total
FROM "Expense" e
WHERE e."userId" = $1
GROUP BY TO_CHAR(e.date, 'YYYY-MM')
ORDER BY month;
```

### 9.3 Stats for a Month

```sql
SELECT
  COUNT(*) AS transaction_count,
  SUM(amount) AS total,
  AVG(amount) AS average,
  MAX(amount) AS highest
FROM "Expense"
WHERE "userId" = $1
  AND date >= $2
  AND date < $3;
```

---

## 10. Edge Cases & Considerations

1. **Currency**: All amounts stored as `Decimal(12,2)`. Display uses Indian numbering system (₹1,23,456.78)
2. **Timezone**: Dates stored as `@db.Date` (no timezone). Display respects user's timezone setting
3. **Import deduplication**: Use `importRef` field to prevent duplicate imports of same transaction
4. **Large imports**: Batch inserts in chunks of 100 rows via `createMany`
5. **Category deletion**: Soft-prevent — cannot delete category with existing expenses. User must reassign first
6. **Default categories**: Seeded per-user on first API call to `/api/expenses/categories`. Not global
7. **Zero amounts**: Allow ₹0 entries (e.g., free items, cashback adjustments)
8. **Negative amounts**: Treat as credits/refunds, displayed differently in UI
9. **Mobile responsiveness**: Matrix table scrolls horizontally, charts stack vertically
10. **Performance**: Index on `(userId, date, categoryId)` for fast matrix queries
