<div align="center">

<!-- ANIMATED BANNER SVG -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:09090b,50:22c55e,100:09090b&height=200&section=header&text=AlgoLens&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Decode%20the%20Algorithm.%20Own%20Your%20Reach.&descAlignY=60&descSize=18&descColor=a1a1aa&animation=fadeIn" width="100%"/>

<br/>

<!-- LIVE BADGES -->
<a href="#"><img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/></a>
<a href="#"><img src="https://img.shields.io/badge/Claude_3.5_Sonnet-AI_Engine-FF6B35?style=for-the-badge&logo=anthropic&logoColor=white"/></a>
<a href="#"><img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/></a>
<a href="#"><img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white"/></a>
<a href="#"><img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white"/></a>

<br/><br/>

<img src="https://img.shields.io/badge/Cache_Hit_Rate-93%25-22c55e?style=flat-square&labelColor=18181b"/>
<img src="https://img.shields.io/badge/API_Cost_Reduction-93%25-22c55e?style=flat-square&labelColor=18181b"/>
<img src="https://img.shields.io/badge/Platforms_Covered-7-818cf8?style=flat-square&labelColor=18181b"/>
<img src="https://img.shields.io/badge/Response_Time-<1ms_L1-f59e0b?style=flat-square&labelColor=18181b"/>

<br/><br/>

> **AlgoLens** est le premier SaaS de rétro-ingénierie algorithmique en temps réel.
> Il transforme les signaux cachés des plateformes en stratégies de contenu actionnables — en secondes.

<br/>

[**Démo Live →**](#) &nbsp;·&nbsp; [**Documentation →**](#) &nbsp;·&nbsp; [**Commencer gratuitement →**](#)

</div>

---

## 🎬 Aperçu

<div align="center">

### Génération de stratégie · TikTok FYP

![Demo Strategy](./public/demos/strategy.png)

*Décrivez votre profil. Obtenez un plan de contenu sur 30 jours en 3 secondes.*

</div>

<details>
<summary><b>📊 Dashboard Analytics</b> — Surveillance cache temps réel</summary>

<br/>

![Demo Analytics](./public/demos/analytics.png)

Le dashboard expose en live le ratio L1/L2/API miss, les économies générées et la distribution des requêtes par plateforme — avec auto-refresh toutes les 30 secondes.

</details>

<details>
<summary><b>🔍 Veille Algorithmique</b> — Feed des changements détectés</summary>

<br/>

![Demo Updates](./public/demos/updates.png)

Chaque lundi à 8h UTC, le cron scrape les newsrooms officielles (TikTok, Instagram, YouTube...) et publie automatiquement les changements d'algo avec leur niveau d'impact.

</details>

<details>
<summary><b>🔐 Auth & Dashboard utilisateur</b> — Magic links Supabase</summary>

<br/>

![Demo Auth](./public/demos/auth.png)

Connexion sans mot de passe via magic link. Chaque utilisateur dispose de son historique de stratégies, son quota mensuel et son statut Pro.

</details>

---

## ⚡ Ce qui rend AlgoLens différent

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   USER REQUEST                                                      │
│       │                                                             │
│       ▼                                                             │
│   ┌─────────┐   HIT    ┌──────────────────────┐                    │
│   │  L1     │ ──────▶  │  Response < 1ms      │  66% of traffic   │
│   │  RAM    │          │  In-Memory Map        │                    │
│   └────┬────┘          └──────────────────────┘                    │
│        │ MISS                                                        │
│        ▼                                                             │
│   ┌─────────┐   HIT    ┌──────────────────────┐                    │
│   │  L2     │ ──────▶  │  Response ~50ms      │  27% of traffic   │
│   │  DB     │          │  Supabase Postgres    │                    │
│   └────┬────┘          └──────────────────────┘                    │
│        │ MISS                                                        │
│        ▼                                                             │
│   ┌─────────┐          ┌──────────────────────┐                    │
│   │ Claude  │ ──────▶  │  Response 2-5s       │   7% of traffic   │
│   │   API   │          │  Anthropic Sonnet     │                    │
│   └─────────┘          └──────────────────────┘                    │
│                                                                     │
│   💰 $35/mois estimé  vs  $500/mois sans cache  →  -93% de coût   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Fonctionnalités

<table>
<tr>
<td width="50%">

### 🤖 Génération de stratégie IA

- 7 plateformes couvertes (TikTok, Reels, Feed, YT Shorts, YT Long, LinkedIn, X)
- Prompt engineering hyper-structuré par plateforme
- Réponse JSON validée + fallback automatique si API down
- Plan d'action 30 jours personnalisé par profil créateur

</td>
<td width="50%">

### 🗄️ Cache Hybride L1/L2

- **L1** : In-Memory Map Node.js, TTL 1h, max 500 entrées, `<1ms`
- **L2** : Supabase Postgres persistant, `~50ms`, survit aux redéploiements
- Hash SHA-256 par profil + plateforme comme clé de cache
- Stats temps réel via `/api/cache/stats`

</td>
</tr>
<tr>
<td width="50%">

### 🕵️ Veille Algorithmique Auto

- Cron Vercel chaque lundi 8h UTC
- Scraping des newsrooms officielles (zero dépendance Puppeteer)
- Analyse par Claude → JSON structuré avec impact `low/medium/high`
- Feed `/updates` filtrable par plateforme

</td>
<td width="50%">

### 📊 Dashboard Analytics Premium

- Design dark inspiré Vercel Analytics + Linear
- Inter 300 + JetBrains Mono
- Chart.js : courbes L1/L2/misses sur 24h
- Snapshots toutes les 30min en DB
- Export CSV intégré

</td>
</tr>
<tr>
<td width="50%">

### 💳 Monétisation Stripe

- Freemium : 3 analyses/mois
- Pro : illimité à 9€/mois
- Webhook Stripe → mise à jour plan en DB automatique
- Gating côté API (pas côté client)

</td>
<td width="50%">

### 🔐 Auth Multi-user

- Magic links Supabase (zero mot de passe)
- Middleware Next.js SSR — routes protégées
- Profil utilisateur + compteur d'analyses
- Dashboard historique personnel

</td>
</tr>
</table>

---

## 🛠️ Stack Technique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **Frontend** | Next.js 14 App Router | Server Components + routing |
| **Styling** | Tailwind CSS + Chart.js | UI + visualisations |
| **IA** | Claude 3.5 Sonnet via SDK | Génération stratégies |
| **Auth** | Supabase Auth SSR | Magic links + sessions |
| **Database** | Supabase Postgres | Cache L2 + profils + updates |
| **Cache L1** | In-Memory Map (Node.js) | `<1ms` — volatile |
| **Paiements** | Stripe | Webhooks + abonnements |
| **Cron** | Vercel Cron Jobs | Veille algo hebdomadaire |
| **Déploiement** | Vercel Serverless | Edge + serverless functions |

---

## 🚀 Installation locale

### Prérequis

- Node.js 20+
- Compte Supabase
- Clé API Anthropic
- Compte Stripe (optionnel pour les paiements)

### 1. Cloner et installer

```bash
git clone https://github.com/ton-user/algolens.git
cd algolens
npm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Remplir `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
VERCEL_CRON_SECRET=ton_secret_random
```

### 3. Migrations Supabase

Dans **Supabase Dashboard → SQL Editor**, exécuter dans l'ordre :

```bash
supabase/migrations/001_init.sql           # Profils + stratégies
supabase/migrations/002_strategy_cache.sql  # Cache L2
supabase/migrations/003_algorithm_updates.sql # Veille algo
supabase/migrations/004_cache_stats_history.sql # Snapshots analytics
supabase/migrations/005_profiles.sql        # Auth multi-user
```

### 4. Lancer

```bash
npm run dev
```

| URL | Description |
|-----|-------------|
| `localhost:3000` | Landing + sélection plateforme |
| `localhost:3000/dashboard/analytics` | Dashboard cache |
| `localhost:3000/updates` | Feed veille algorithmique |
| `localhost:3000/api/cache/stats` | Stats cache JSON |

---

## 📁 Structure du projet

```
algolens/
├── app/
│   ├── page.tsx                          # Landing
│   ├── login/page.tsx                    # Auth magic link
│   ├── auth/callback/route.ts            # OAuth callback
│   ├── analyze/[platform]/page.tsx       # Formulaire profil
│   ├── results/page.tsx                  # Stratégie générée
│   ├── updates/page.tsx                  # Feed veille algo
│   ├── history/page.tsx                  # Historique
│   ├── dashboard/
│   │   ├── layout.tsx                    # Layout protégé
│   │   └── analytics/page.tsx            # Dashboard cache
│   └── api/
│       ├── analyze/route.ts              # POST → stratégie
│       ├── cache/stats/route.ts          # GET → stats cache
│       ├── cache/history/route.ts        # GET → historique 24h
│       ├── stripe/route.ts               # Webhook Stripe
│       └── cron/
│           ├── weekly-scrape/route.ts    # Veille algo (lundi 8h)
│           └── cache-snapshot/route.ts   # Snapshot stats (toutes 30min)
├── lib/
│   ├── anthropic.ts                      # SDK Claude + retry + fallback
│   ├── cache.ts                          # Cache hybride L1/L2
│   ├── scraper.ts                        # Web scraping natif
│   ├── algo-analyzer.ts                  # Analyse updates par Claude
│   ├── supabase/                         # Clients Supabase
│   ├── supabase-server.ts                # Helper SSR
│   ├── rate-limit.ts                     # Rate limiting 5 req/min
│   └── types.ts                          # Types TypeScript
├── supabase/migrations/                  # 5 migrations SQL
├── middleware.ts                         # Protection routes
└── vercel.json                           # Cron jobs config
```

---

## 🔐 Sécurité

- Les clés Anthropic ne sont **jamais exposées** côté client — tous les appels passent par les API Routes Next.js
- **Rate limiting** : 5 requêtes/minute/IP (`lib/rate-limit.ts`)
- **RLS Supabase** sur toutes les tables — chaque user ne voit que ses données
- **Cron protégé** par header `Authorization: Bearer` + secret
- **Webhook Stripe** vérifié par signature cryptographique

---

## 📊 Performance & Coûts

```
Avant cache :  ~1 000 req/mois × $0.50/req = $500/mois
Après cache :  ~70 req Claude (7%) × $0.50 = $35/mois

Économie : $465/mois · Réduction : 93%
```

| Métrique | Valeur |
|----------|--------|
| L1 Hit Rate | ~66% · `<1ms` |
| L2 Hit Rate | ~27% · `~50ms` |
| API Miss Rate | ~7% · `2-5s` |
| Fallback strategy | `<10ms` · score 65/100 |

---

## 🗓️ Roadmap

- [x] SDK Anthropic + Fallback strategy
- [x] Cache hybride L1/L2
- [x] Intégration Stripe + paywalls
- [x] Veille algorithmique automatisée
- [x] Dashboard analytics premium
- [x] Auth multi-user Supabase
- [ ] Mode comparaison 2 plateformes
- [ ] Streaming responses (progressive rendering)
- [ ] Smart TTL adaptatif
- [ ] API publique AlgoLens

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:09090b,50:22c55e,100:09090b&height=100&section=footer&animation=fadeIn" width="100%"/>

**Fait pour les créateurs qui veulent comprendre les règles du jeu.**

[algolens.app](https://algolens.app) · [Twitter](https://x.com) · [LinkedIn](https://linkedin.com)

</div>
