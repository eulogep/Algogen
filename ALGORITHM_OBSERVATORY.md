# Algorithm Observatory

L’**Algorithm Observatory** transforme la veille actuelle d’AlgoLens en une chaîne de données vérifiable. Les articles des newsrooms officielles restent les sources de référence pour les changements confirmés. En parallèle, des fournisseurs de tendances transmettent des observations normalisées qui sont regroupées, mesurées et classées avant toute interprétation éditoriale.

> Les scores ne prétendent pas mesurer les signaux internes d’une plateforme. Ils classent les **preuves observées** afin de prioriser les sujets à vérifier et à tester.

## Chaîne de traitement

```text
Newsrooms officielles ───────────┐
Flux de tendances configuré ─────┼──> Normalisation ─> Clustering par sujet
                                 │                         │
                                 │                         v
                                 └────────────────> Trend Engine ─> Persistance /updates
                                                           │
Newsrooms officielles ─> Analyse IA contrôlée ────────────┘
```

| Étape | Responsabilité | Résultat |
|---|---|---|
| Collecte | Les fournisseurs récupèrent les éléments depuis des sources autorisées. | `SocialSignal[]` |
| Normalisation | Chaque source est ramenée au même contrat de données minimal. | Plateforme, sujet, dates, métriques et URL de preuve. |
| Détection | Les signaux sont regroupés par `topicKey` normalisé. | Une observation par sujet et par jour. |
| Scoring | Le moteur calcule la vélocité, l’accélération, l’engagement, la nouveauté et la diffusion multi-plateforme. | `trendScore` sur 100. |
| Confiance | Le niveau dépend du nombre, de la diversité et de l’autorité des preuves. | `confidence` sur 100. |
| Interprétation | Claude analyse uniquement les articles officiels afin de qualifier les changements confirmés. | Recommandation actionnable avec provenance. |

## Modèle de signal canonique

Le connecteur HTTP attend la forme suivante. Les entrées invalides sont ignorées ; une indisponibilité de cette source ne bloque pas les newsrooms officielles.

```json
{
  "signals": [
    {
      "id": "youtube:video:abc123",
      "platform": "youtube",
      "sourceType": "trend_feed",
      "topic": "Tutoriels de montage court",
      "url": "https://example.com/evidence/abc123",
      "title": "Exemple de contenu observé",
      "publishedAt": "2026-08-26T08:00:00.000Z",
      "detectedAt": "2026-08-26T10:00:00.000Z",
      "metrics": {
        "views": 24000,
        "likes": 1900,
        "comments": 210,
        "shares": 160,
        "viewsPerHour": 12000
      },
      "author": {
        "id": "creator-42",
        "followers": 125000
      },
      "evidence": "Extrait ou contexte utile à la vérification humaine."
    }
  ]
}
```

| Champ | Exigence | Description |
|---|---|---|
| `id`, `platform`, `sourceType`, `topic`, `url` | Obligatoire | Identifient la preuve, sa provenance et son sujet. |
| `publishedAt`, `detectedAt` | Recommandé | Permettent de calculer la fraîcheur et la vélocité. |
| `metrics` | Optionnel | `views`, interactions, `followers`, `engagementRate` ou `viewsPerHour`. |
| `evidence` | Recommandé | Contexte qui facilite une vérification humaine ultérieure. |

Les valeurs autorisées de `platform` sont `tiktok`, `instagram`, `youtube`, `reddit`, `x_twitter`, `google`, `github`, `linkedin` et `web`. Les valeurs autorisées de `sourceType` sont `official_newsroom`, `creator_post`, `trend_feed`, `community_discussion`, `competitor_content` et `manual`.

## Calculs et limites

La vélocité équivaut à `viewsPerHour` quand la source la fournit. Sinon, elle est estimée par `views / heures depuis publication`. L’engagement utilise le taux fourni ou, à défaut, le rapport entre les interactions disponibles et les vues ou abonnés. La nouveauté décroît avec l’ancienneté moyenne des détections.

Le score de tendance est borné entre 0 et 100 et pondère ces indicateurs : **vélocité 30 %**, **engagement 22 %**, **accélération 18 %**, **nouveauté 15 %** et **diffusion multi-plateforme 15 %**. Ces coefficients sont une base explicite et doivent être calibrés sur des résultats observés avant toute utilisation à des fins de décision.

La confiance est distincte du score de tendance. Elle dépend du nombre de preuves, de la diversité des types de source et de plateforme, ainsi que du nombre de sources officielles. Une tendance forte mais peu sourcée reste donc clairement signalée comme peu certaine.

## Installation

1. Exécutez `supabase/migrations/008_algorithm_observatory.sql` dans le projet Supabase après les migrations existantes.
2. Conservez la veille officielle sans configuration supplémentaire.
3. Pour connecter une instance ou un adaptateur de tendances, définissez `ALGOLENS_SIGNAL_FEED_URL` et, si nécessaire, `ALGOLENS_SIGNAL_FEED_TOKEN` dans les variables de déploiement.
4. Déclenchez la route de veille prévue ou utilisez le rafraîchissement manuel depuis l’application avec un compte éligible.

La collecte est volontairement découplée des API de tiers. Pour connecter Trendgetter, SocialCrawl ou une API propriétaire, implémentez un adaptateur qui émet ce contrat plutôt que de lier le cœur d’Algogen à un endpoint non versionné.

## Références

La conception s’inspire de l’approche de collecte planifiée, d’analyse et de notification de [TrendFinder](https://github.com/ericciarla/trendFinder), ainsi que de l’abstraction multi-plateformes de [Trendgetter](https://github.com/Zivsteve/trendgetter). Les constats de consultation sont consignés dans [`reports/reference-repositories-findings.md`](./reports/reference-repositories-findings.md).
