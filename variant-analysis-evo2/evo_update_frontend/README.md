# 🧬 Evo2 Variant Analysis — Frontend & Edge Service

Web client and edge API routing service for the **Evo2 Genomic Variant Analysis Platform**, built with Next.js 15, React 19, TypeScript, and Tailwind CSS v4.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **UI & State**: [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), PostCSS, Custom Biotech CSS tokens
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/)
- **Genomic Viewer**: [IGV.js 2.15.6](https://github.com/igvteam/igv.js/)
- **Icons & Primitives**: [Lucide React](https://lucide.dev/), [Radix UI](https://www.radix-ui.com/)
- **Validation**: [Zod](https://zod.dev/), [@t3-oss/env-nextjs](https://env.t3.gg/)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL` is set to your active Evo2 model inference microservice on Modal.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📜 Available Scripts

- `npm run dev` — Starts Next.js development server with Turbopack.
- `npm run build` — Creates an optimized production build.
- `npm run start` — Runs the production build locally.
- `npm run typecheck` — Runs TypeScript compiler checks without emitting code.
- `npm run lint` — Lints code with ESLint and Next.js rules.
- `npm run format:write` — Formats all codebase files using Prettier.

---

## 📖 Complete Documentation & Architecture

For in-depth explanations of the system architecture, mathematical delta scoring algorithms, coordinate normalization, and future roadmap, refer to the [Root Project README](../README.md).
