# Constat d’activation de production — 26 août 2026

| Sujet | Résultat constaté | Incidence |
|---|---|---|
| Projet Vercel | Un projet Vercel nommé `algolens`, associé au domaine `algolens-five.vercel.app`, est visible dans l’espace utilisateur. Il n’est pas relié à un dépôt Git d’après le tableau de bord. | La branche `feat/algorithm-observatory` doit être déployée explicitement ou le projet doit être reconnecté au dépôt avant que les nouveaux endpoints ne soient disponibles en production. |
| Connexion Vercel automatisée | L’intégration est activée, mais l’inventaire programmatique ne répond pas dans le délai imparti. | La configuration peut être poursuivie depuis l’interface Vercel déjà ouverte, avec confirmation avant toute modification de variables ou de déploiement. |
| Trendgetter public | `https://trendgetter.vercel.app/` retourne `HTTP 402` avec `DEPLOYMENT_DISABLED`. | Cette instance ne peut pas servir de flux de production. Une instance auto-hébergée ou un adaptateur dédié est requis. |
| SocialCrawl | La documentation officielle indique que les requêtes de données exigent une clé `sc_…`; la découverte des endpoints est gratuite, mais pas la collecte. | L’utilisateur doit fournir une clé SocialCrawl ou confirmer la création d’une intégration BYOK avant la configuration et le test de données réelles. |

## Décision provisoire

L’option de production la plus directe est un adaptateur SocialCrawl détenu par le projet, exposant le contrat `{ "signals": SocialSignal[] }` attendu par Algogen. Sa configuration nécessite une clé SocialCrawl et une URL de déploiement Vercel utilisable par Algogen.

| Projet Vercel confirmé | Le projet de production pertinent est `algolens`, domaine `algolens-five.vercel.app`, statut `Ready`. Le déploiement actuellement visible date d’avril et sa source est `vercel deploy`, sans liaison Git. | La branche d’extension ne sera pas déployée automatiquement. Une mise en production exige d’importer explicitement le code via CLI ou de relier le projet à `eulogep/Algogen`. |
