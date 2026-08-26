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
