# UI/UX DESIGN PROMPT — FINANCIAL UMKM DASHBOARD

## ROLE

Act as a senior UI/UX designer and frontend engineer specializing in modern fintech SaaS applications, financial dashboards, data visualization, and responsive web applications.

Your task is to design and implement a polished, production-quality user interface for a web application called "KasFlow".

## PROJECT OVERVIEW

KasFlow is a financial management platform for Indonesian MSMEs (UMKM).

Its main purpose is to help business owners:
- Record income and expenses.
- Monitor their current financial condition.
- Forecast future cash flow.
- Detect potential cash shortages through an Early Warning System.
- Review financial reports and make better financial decisions.

This is NOT a generic admin dashboard. The design must communicate financial clarity, trust, accuracy, and ease of use.

## DESIGN DIRECTION

Create a premium, modern fintech SaaS interface inspired by the usability of professional financial management products.

Visual characteristics:
- Minimalist and professional.
- Clean white and soft-gray surfaces.
- Deep navy for navigation and primary text.
- Emerald green for positive financial indicators.
- Muted red for negative financial indicators.
- Amber for warnings and financial risks.
- Subtle borders and restrained shadows.
- Rounded corners between 10px and 16px.
- Consistent spacing and alignment.
- Clear typography and excellent readability.
- Data-dense layouts without visual clutter.

Avoid:
- Excessive gradients.
- Excessive glassmorphism.
- Oversized decorative elements.
- Too many colorful cards.
- Unnecessary animations.
- Generic landing-page layouts inside the dashboard.
- Fake 3D illustrations.
- Excessive use of emojis.
- Excessive rounded pill buttons.

Use Lucide icons where appropriate.

## COLOR SYSTEM

Use a consistent design system:

- Primary: #173B67
- Primary hover: #102D50
- Background: #F5F7FA
- Surface: #FFFFFF
- Main text: #172B4D
- Secondary text: #64748B
- Border: #E2E8F0
- Positive: #15803D
- Positive background: #DCFCE7
- Warning: #B45309
- Warning background: #FEF3C7
- Danger: #B91C1C
- Danger background: #FEE2E2

Use colors semantically and maintain accessible contrast.

## APPLICATION LAYOUT

Build a responsive application shell with:

### 1. Sidebar Navigation

Include:
- KasFlow logo and application name.
- Dashboard.
- Transaksi.
- Prediksi Arus Kas.
- Peringatan Keuangan.
- Laporan.
- Pengaturan.

Place the user profile and logout action at the bottom.

The sidebar should be fixed or sticky on desktop and collapsible on smaller screens.

Use clear active states, consistent icon sizing, and comfortable navigation spacing.

### 2. Top Navigation

Include:
- Current page title or breadcrumb.
- Optional global search if it has a useful function.
- Notification icon with an unread indicator.
- User avatar and account menu.

Keep the header compact and aligned with the main content.

### 3. Main Content

Use a centered content area with a sensible maximum width, consistent spacing, and responsive grid layouts.

Avoid wasting too much space on oversized headers.

## PAGE 1: DASHBOARD

Create a professional financial overview.

Header:
- Greeting for the logged-in user.
- Business name.
- Current date or selected reporting period.
- Primary action button: "Tambah Transaksi".

Summary cards:
1. Saldo Saat Ini.
2. Total Pemasukan.
3. Total Pengeluaran.
4. Selisih Pemasukan dan Pengeluaran.

Each card should contain:
- Clear metric title.
- Formatted Indonesian Rupiah value.
- Optional comparison with the previous period when actual comparison data exists.
- Small contextual icon or restrained visual indicator.

Do not invent percentage changes if the underlying data is unavailable.

Cash flow chart:
- Show income and expenses over time.
- Include a period selector.
- Use readable axes, tooltips, and legends.
- Clearly distinguish actual historical data from projected values.

Forecast summary:
- Projected cash balance.
- Selected forecast horizon.
- A compact explanation of the forecast.

Early Warning Summary:
- Number of active warnings.
- Highest-priority risk.
- Link to view all warnings.

Recent transactions:
- Date.
- Description.
- Category.
- Transaction type.
- Amount.
- Appropriate positive or negative styling.

Use realistic Indonesian-language labels and Indonesian Rupiah formatting.

## PAGE 2: TRANSACTIONS

Create a financial transaction management page.

Features:
- Page heading and "Tambah Transaksi" action.
- Search by description.
- Filters for transaction type, category, and date range.
- Sortable transaction table.
- Pagination if necessary.
- Clear empty, loading, and error states.

Transaction form fields:
- Transaction type: Pemasukan or Pengeluaran.
- Amount.
- Transaction date.
- Category.
- Description.
- Optional payment method.

Use proper validation and confirmation before destructive actions.

Make the form easy to use on mobile devices.

## PAGE 3: CASH FLOW FORECAST

This is one of the most important pages.

Create a dedicated forecasting workspace.

Include:
- Forecast horizon selector: 7, 14, or 30 days.
- Current cash balance.
- Projected ending balance.
- Expected income.
- Expected expenses.
- Forecast cash flow chart.
- Actual versus projected legend.
- A forecast assumptions and methodology section.

Clearly differentiate historical actual values from future estimates.

Display a short explanation of how the projection is generated and communicate uncertainty appropriately.

Do not present estimates as guaranteed outcomes.

If insufficient historical data exists, show a useful empty state explaining which data the user needs to record first.

## PAGE 4: EARLY WARNING SYSTEM

Create a financial risk monitoring page.

Display alerts as structured cards or a clear table.

Each alert should include:
- Risk title.
- Severity: Rendah, Sedang, or Tinggi.
- Date detected.
- Expected risk date if applicable.
- Projected cash balance.
- Configured minimum cash threshold.
- Explanation of why the alert was triggered.
- Suggested next actions.
- Alert status.

Example alert:

"Potensi Kekurangan Kas"

"Proyeksi saldo diperkirakan berada di bawah batas minimum kas yang telah ditentukan."

Suggested actions:
- Review planned expenses.
- Follow up on outstanding receivables.
- Reassess inventory purchasing plans.

Provide filters for severity, status, and date.

Use red sparingly for high-risk alerts and amber for moderate warnings.

Warnings must reflect actual backend rules and data, not random or hardcoded conditions.

## PAGE 5: FINANCIAL REPORTS

Include:
- Reporting period selector.
- Income and expense summary.
- Cash flow chart.
- Expense breakdown by category.
- Transaction history.
- Comparison between projected and actual cash flow when both are available.
- Export action if supported.

Use a clear reporting hierarchy and avoid unnecessary decorative charts.

## PAGE 6: SETTINGS

Include sections for:
- User profile.
- Business profile.
- Opening cash balance.
- Minimum safe cash threshold.
- Transaction categories.
- Notification preferences.

Use clear forms, inline validation, and explicit save feedback.

## COMPONENTS AND INTERACTIONS

Create reusable components for:
- Sidebar.
- Header.
- Financial summary cards.
- Charts.
- Transaction table.
- Transaction form.
- Warning cards.
- Filters.
- Date selectors.
- Confirmation dialogs.
- Toast notifications.
- Loading skeletons.
- Empty states.

Buttons, navigation links, filters, forms, and dialogs must have meaningful behavior.

Do not create decorative controls that do nothing.

Use accessible labels, keyboard-friendly interactions, and visible focus states.

## RESPONSIVE DESIGN

Desktop:
- Persistent sidebar.
- Multi-column summary cards.
- Wide charts and transaction tables.

Tablet:
- Compact navigation.
- Responsive card grids.
- Adaptable chart widths.

Mobile:
- Collapsible navigation or a suitable mobile navigation pattern.
- Single-column financial cards.
- Forms that fit the screen.
- Tables that remain usable through responsive layouts.
- Touch-friendly buttons and controls.

Prevent horizontal overflow.

## TECHNICAL REQUIREMENTS

- Use the existing Vue.js frontend project.
- Use reusable Vue components.
- Follow the existing project architecture and coding conventions.
- Use Chart.js for data visualizations if it is already installed or can be added appropriately.
- Integrate with the existing Express.js API when available.
- Use MySQL-backed data through the backend.
- Never connect the browser directly to the database.
- Keep financial calculations in a clearly defined and testable layer.
- Do not expose secrets or database credentials in frontend code.
- Preserve working existing features.
- Do not replace the entire project unnecessarily.

If the backend is not ready, use clearly identified mock data for UI development and keep the data layer easy to replace with API calls later.

## IMPLEMENTATION WORKFLOW

1. Inspect the existing project and identify the frontend framework, installed libraries, routes, and current components.
2. Explain the proposed UI structure and identify which files need changes.
3. Establish reusable layout components and design tokens.
4. Implement the dashboard first.
5. Implement the transaction page and transaction form.
6. Implement the forecast page.
7. Implement the Early Warning System page.
8. Implement reports and settings.
9. Make the interface responsive.
10. Test navigation, forms, loading states, error states, and calculations where applicable.

Do not stop at a static mockup. Implement the interface in the actual project.

Do not rewrite working code without a reason.

After implementation, summarize:
- Pages completed.
- Files created or modified.
- Dependencies added.
- Features that use mock data.
- Features connected to the real backend.
- Any remaining issues.

## FINAL QUALITY STANDARD

The finished application should look like a credible, polished financial SaaS product that an Indonesian MSME owner could realistically use every day.

Prioritize usability, clarity, visual consistency, trustworthy financial presentation, and working interactions over decorative complexity.
S