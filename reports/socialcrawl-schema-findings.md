# Schéma SocialCrawl — constat de correction

## Sources consultées

- [YouTube Videos Trending API](https://www.socialcrawl.dev/platforms/youtube/videos-trending), consultée le 26 août 2026.
- [Response Schema](https://www.socialcrawl.dev/docs/response-schema.md), consultée le 26 août 2026.

## Contrat pertinent

Les listes SocialCrawl utilisent une enveloppe `data.items[]`. Chaque élément normalisé contient un objet `post` et peut contenir `computed` :

```json
{
  "post": {
    "id": "...",
    "url": "...",
    "content": { "text": "..." },
    "author": { "username": "...", "followers": 0 },
    "engagement": { "views": 0, "likes": 0, "comments": 0, "shares": 0 },
    "published_at": "...",
    "ext": { "...": "..." }
  },
  "computed": { "engagement_rate": 0.14949 }
}
```

L’ancien mapping tentait de lire directement les propriétés de l’élément de liste ; il produisait donc les libellés de secours et des métriques vides. Le mapping corrigé déplie `item.post`, conserve un repli plat, lit les titres de plusieurs emplacements compatibles et convertit `computed.engagement_rate` de ratio en pourcentage.

## Mesures de référence Supabase

- `EXPLAIN (ANALYZE, BUFFERS)` de la requête de six tendances : index scan via `idx_trend_observations_score`, 1,435 ms d’exécution, zéro lecture disque et deux blocs partagés en cache.
- Test contrôlé de 100 lectures, concurrence 5 : 100 réponses HTTP 200 ; p50 198,50 ms et p95 502,10 ms sur le chemin REST distant.
- Comparaison de 40 lectures par variante : `select(*)` transfère 23 831 octets pour 6 lignes ; la projection requise par l’interface transfère 2 254 octets, soit environ 90,5 % de moins. Les deux variantes ont renvoyé 40 réponses HTTP 200.

## Validation de production

Le déploiement Vercel associé au commit `de32b60` a atteint l’état `READY`. L’exécution manuelle du cron `/api/cron/weekly-scrape` a répondu `HTTP 200` le 26 août 2026 à 08:05 UTC.

La requête de contrôle a retourné les **25** nouvelles observations SocialCrawl YouTube avec des titres, URLs et métriques réelles. Les lignes vérifiées comprennent notamment des vues, mentions J’aime, commentaires et taux d’engagement, ainsi que des scores de tendance désormais différenciés entre 34 et 50. Cette collecte remplace les anciens libellés de secours `youtube trending item N` pour les nouvelles écritures.

## Décision de production

Aucune migration ni index supplémentaire n’est justifié à ce stade : la requête de l’interface est déjà couverte par `idx_trend_observations_score` et s’exécute côté PostgreSQL en 1,435 ms avec zéro lecture disque dans le test. L’amélioration livrée consiste donc à remplacer `select(*)` par une projection stricte des seules colonnes rendues à l’écran. Elle réduit le volume de réponse observé de 23 831 à 2 254 octets pour six tendances, sans ajouter de complexité de cache ou de risque de données périmées.

Lorsque le trafic public dépassera les besoins actuels, la prochaine optimisation recommandée sera un cache applicatif de la liste publique des six tendances, invalidé à la fin du cron. Il ne doit être ajouté que lorsque la télémétrie Vercel montrera une charge récurrente sur cette route, car le plan actuel est déjà efficace et le cache introduirait une gestion d’invalidation supplémentaire.
