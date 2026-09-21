# 🛒 Geetorus Market

> **The Premier Marketplace for AI Agent Teams & Company Blueprints** — Discover, preview, and deploy pre-configured AI workforces into your Geetorus control plane with one click.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F)](https://orm.drizzle.team/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Geetorus](https://img.shields.io/badge/Orchestrated_by-Geetorus-blue)](https://github.com/geetorusai/geetorus)

---

## 🌟 Overview

**Geetorus Market** is the official hub for buying, sharing, and installing battle-tested AI agent companies. Instead of building agent organizations from scratch, browse curated teams — complete with organizational hierarchies, specialized role prompts, tool configurations, and automated routines.

- **🏢 Complete Companies**: Security auditing firms, game development studios, science research labs, and full-stack software agencies.
- **⚡ 1-Click Import**: Deploy directly to your local or cloud Geetorus instance via `geetorusai company import` or `companies.sh`.
- **📊 Org Chart Previews**: Inspect reporting lines, agent roles, and capabilities before installing.
- **🛠️ Tools & Skills Included**: Every company bundle packages domain-specific tools, MCP server bindings, and routine automations.
- **🚀 Creator Publishing**: Export your own high-performing agent teams and publish them to the community.

---

## 🚀 Quickstart

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **PostgreSQL Database** (or Supabase connection string)

### 1. Installation

```bash
git clone https://github.com/geetorusai/geetorus-market.git
cd geetorus-market
npm install
```

### 2. Environment Configuration

Create a `.env.local` file:

```env
# Database connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/geetorus_market

# Authentication (Better Auth)
BETTER_AUTH_SECRET=your_32_character_hex_secret
BETTER_AUTH_URL=http://localhost:3000

# Optional Supabase integration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Migration

```bash
# Push schema migrations
npx drizzle-kit push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the marketplace.

---

## 📦 How to Install Market Companies in Geetorus

Once you find a company on Geetorus Market:

### Via Geetorus CLI:
```bash
# Direct import from GitHub or Market bundle
geetorusai company import ./trail-of-bits-security
```

### Via `companies.sh`:
```bash
# Install directly from the open standard catalog
npx companies.sh add geetorusai/companies/gstack
```

---

## 🏗️ Architecture & Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Modern server components and edge rendering |
| **UI & Styling** | React 19 + Tailwind CSS 4 | Responsive, sleek marketplace catalog and previews |
| **Database** | PostgreSQL + Drizzle ORM | High-performance catalog, reviews, and transaction records |
| **Auth** | Better Auth | Secure session and OAuth authentication for publishers and buyers |
| **Storage** | Supabase | Storage for company blueprint bundles, logos, and preview screenshots |

---

## 🤝 Contributing

Contributions to Geetorus Market are welcome! You can:
- Submit new company blueprints via PR to [`geetorus-companies`](https://github.com/geetorusai/geetorus-companies).
- Improve the marketplace UI, search filters, and checkout flows.

---

## 📜 License

Geetorus Market is open-source software licensed under the [MIT License](LICENSE).
