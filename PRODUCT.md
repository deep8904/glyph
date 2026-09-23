# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing codebase: Next.js 16 (App Router), TypeScript 5, Tailwind v4 (via `@theme` in globals.css), Supabase (Postgres + RLS + Auth + Storage), Stripe, Resend, Vercel.

## Users

Primary: solo and small-team indie game developers who are still building — pre-launch, pre-revenue. They are documenting progress, seeking feedback, and trying to build an audience before they ship. Secondary: established indie studios using Glyph for publisher discovery and studio/team management, but the solo pre-launch dev is the dominant persona the product is designed around.

## Product Purpose

Glyph is the platform for indie game developers who are still building — profile, devlogs, playtesting, events, collaboration, and publisher discovery, all in one place. It exists to give devs a home base before launch, when they have no shipped product yet and nowhere else fits (itch.io is a storefront for finished games; Discord/Twitter are general-purpose, not built for this stage).

## Positioning

Two things together, confirmed by the user as equally real and not separable:
1. **Pre-launch focus** — purpose-built for the "still building" phase: devlogs, playtesting, and community before a game ships, not a storefront for finished games.
2. **Local/community anchor** — rooted in a real indie dev scene (Phoenix AZ / ASU / UAT / IGDA Phoenix), a home base tied to an actual community rather than a faceless global platform.

## Operating Context

Devs use Glyph to: post devlogs as they build, run playtests and collect structured feedback, discover and join game jams and events, find collaborators, follow other devs' progress, and (for studios) get discovered by publishers.

## Capabilities and Constraints

Core product is permanently free in V1 — no payments/paywalls despite Stripe being in the stack (reserved for future use, not currently gating anything). Existing feature surface (per README V-Checklist, all shipped): auth, developer profiles, project pages/devlogs, following/community feed, reactions/comments, search/explore, notifications, account settings, playtesting, events, collaboration board, game jams, studios, featured listings, publisher tools, admin dashboard, email, analytics, moderation, accessibility, i18n (en/es).

## Brand Commitments

Name "Glyph°" (with the degree-mark glyph) is the existing wordmark. Confirmed 2026-09-16: the current visual direction is kept, not replaced — user explicitly rejected a proposed visual-world redesign ("the current look is good but need refinement"). This is a refinement engagement: preserve the incumbent look, layout language, and content; improve craft, polish, and execution quality rather than introducing a new visual system.

## Evidence on Hand

Existing shipped codebase across ~20 route groups (landing, auth, dashboard, project pages, devlogs, playtesting, events, collaboration, jams, studios, publishers, admin, settings, notifications). No confirmed customer testimonials, case studies, or press to reference. Community anchor (Phoenix AZ / ASU / UAT / IGDA Phoenix) is a stated fact, not yet evidenced with specific partnership assets — treat as thematic/positioning grounding, not literal logos to display.

## Product Principles

1. Design for the "still building" moment — nothing in the UI should presume the user has already shipped or has an audience.
2. Feel like a home base, not a feed — calmer, more personal than a social network optimized for engagement.
3. Community-rooted, not generic SaaS — the local/indie-scene anchor should read as specific and real, not corporate-neutral.
4. Free-first — no upsell pressure or paywall visual language anywhere in V1 surfaces.

## Accessibility & Inclusion

i18n already shipped (en/es). No additional accessibility requirement confirmed beyond standard WCAG AA practice already noted in the existing codebase (V6 checklist item).
