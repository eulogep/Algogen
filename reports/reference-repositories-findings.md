# Références externes — constats utiles à l’intégration

Date de consultation : 26 août 2026.

| Référence | Constats vérifiés | Transposition retenue dans Algogen |
|---|---|---|
| [Trendgetter](https://github.com/Zivsteve/trendgetter) | API open source de données de tendances. Le README liste Google, YouTube, X, Reddit, Hacker News, Pinterest, GitHub et TikTok. Il recommande une instance auto-hébergée et la configuration de clés selon les sources. | Créer une interface de fournisseur de tendances, un format canonique de signal et une passerelle HTTP configurable plutôt que coupler l’application à un endpoint ou à un contrat tiers non vérifié. |
| [TrendFinder](https://github.com/ericciarla/trendFinder) | Collecte des publications de comptes suivis et de pages web, exécution planifiée, analyse IA, identification des tendances et notification contextualisée. Il précise que les limites d’API de X restreignent la collecte sur le plan gratuit. | Séparer strictement la collecte, la normalisation, la détection de tendances, l’analyse IA et la restitution. Les signaux et leurs sources restent les données de référence, l’IA ne fait qu’interpréter les résultats calculés. |

## Décision d’architecture

La première itération ne doit pas embarquer de clés de plateformes, scraper des réseaux sociaux privés ni présumer de contrats d’API tiers. Elle établit un **Algorithm Observatory** compatible avec les sources officielles déjà en place et avec une source de flux externe configurable. Le cœur calcule de manière déterministe la vélocité, l’accélération, l’engagement, la nouveauté, la diffusion multi-plateforme, le score de tendance et un score de confiance basé sur le nombre et la diversité des preuves.

Cette base est conçue pour recevoir ultérieurement des adaptateurs dédiés aux services autorisés ou aux APIs pour lesquelles l’équipe possède des identifiants et des droits d’usage.

## Sources

1. [Zivsteve/trendgetter — GitHub](https://github.com/Zivsteve/trendgetter)
2. [ericciarla/trendFinder — GitHub](https://github.com/ericciarla/trendFinder)
