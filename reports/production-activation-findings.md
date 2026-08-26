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

| Base de production | Le projet Supabase `oxxmywjqmoaxavfcohgh` a été restauré. La migration `algorithm_observatory_schema_reconciliation` a ensuite été appliquée avec succès, après correction du décalage historique `title`/`impact`/`detected_at` vers `summary`/`impact_level`/`date_detected`. | Les tables, index, politiques RLS et vue de l’observatoire sont présents en production. |
| Planification Vercel | Le snapshot de cache a été ramené d’une cadence de 30 minutes à une exécution quotidienne afin de respecter la contrainte Vercel Hobby ; le cron hebdomadaire de veille demeure actif. | Les deux crons sont reconnus et activés dans Vercel. |
| Test du cron | Une exécution manuelle de `/api/cron/weekly-scrape` a été déclenchée depuis Vercel. Les logs indiquent l’entrée dans l’analyse ; une erreur de traitement d’un article officiel apparaît et doit être distinguée du résultat de la collecte SocialCrawl. | La trace détaillée et la réponse HTTP sont en cours de vérification. |

| Persistance serveur | Les logs du test montrent que le déploiement ne possède pas encore de clé de service Supabase (`supabaseKey is required`). Une clé secrète dédiée existe dans les réglages API Keys du projet Supabase ; elle sera ajoutée à Vercel uniquement comme secret de production, sans être enregistrée dans le dépôt ni les rapports. | La collecte SocialCrawl a été démarrée, mais la persistance finale est actuellement bloquée par cette configuration manquante. |

| Clé Supabase de service | La clé secrète du projet a été vérifiée dans Supabase et sera exclusivement injectée comme variable secrète de production Vercel sous `SUPABASE_SERVICE_ROLE_KEY`. | Aucune valeur de secret n’est ajoutée à ce rapport, au dépôt ou aux échanges de livraison. |

| Correctif de persistance | `SUPABASE_SERVICE_ROLE_KEY` a été ajoutée comme variable secrète limitée à l’environnement Production dans Vercel. | Un nouveau déploiement de production est nécessaire avant de rejouer le cron. |

| Test de bout en bout | Après redéploiement, l’exécution manuelle de `/api/cron/weekly-scrape` a répondu `200` sur le déploiement de production `dpl_6Z8kVRp8KFs1MXyRTqG6yajmb3cP`. | Le pipeline a collecté et persisté **53 observations** ; la plus récente est horodatée `2026-08-26 07:36:57.812+00`. |
| Provenance du flux | Les observations de test incluent `platforms = ['youtube']` et `source_types = ['trend_feed']`, soit le type attribué par l’adaptateur SocialCrawl. | Le flux SocialCrawl est connecté, exploité et persistant en production. |
| Limite indépendante | Le compte Anthropic configuré dans Vercel ne dispose plus de crédit. L’analyse IA des newsrooms officielles journalise des erreurs `400` mais ne bloque plus la collecte/persistance SocialCrawl, puisque le cron finalise avec un statut `200`. | Recharger ou remplacer cette clé sera nécessaire pour réactiver l’analyse sémantique des changements officiels. |

| Répartition vérifiée | La base contient **25 observations `trend_feed`** issues du flux SocialCrawl et **28 observations `official_newsroom`** issues des sources de veille officielles. | La contribution SocialCrawl est séparée, identifiée et correctement persistée. |
