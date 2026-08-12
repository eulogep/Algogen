# Bilan d’implémentation — Socle production et parcours B2B

**Date : 12 août 2026**  
**Périmètre : Algogen / AlgoLens**

## Résultat livré

Le dépôt contient désormais un premier parcours B2B cohérent : une analyse peut devenir un **brouillon de test**, puis être gérée dans un espace d’équipe sous la forme d’une boucle **hypothèse → publication → analyse → apprentissage**. En parallèle, les incohérences les plus risquées du socle de production ont été corrigées dans le code et réconciliées avec de nouvelles migrations versionnées.

| Domaine | Livré |
|---|---|
| **Facturation et quotas** | Migration `006_billing_history_and_security.sql` : champs de profil manquants, historique d’analyses, table de stratégies, RLS et fonctions de facturation Stripe versionnées. Les webhooks et le checkout emploient désormais le client Supabase de service et retournent une erreur exploitable en cas de synchronisation échouée. |
| **Historique réel** | La route `/api/analyze` persiste désormais les analyses réussies, y compris en cas de cache hit, dans `analysis_history` et `strategies`. Les quotas Free reposent donc sur des événements réels. |
| **Build et streaming** | Le limiteur de débit accepte désormais les `Response` de streaming. Les initialisations Supabase sensibles sont différées dans les routes cron/cache, ce qui permet de builder hors environnement de production. Le callback auth est compatible avec l’API asynchrone de cookies de Next.js 16. |
| **Comparaison et données de démonstration** | Le comparateur transmet réellement `compareMode: true` et explique le refus d’accès Pro. Les pages de cache analytics et de veille cessent d’inventer des métriques ou changements : elles affichent des états vides lorsqu’aucune donnée réelle n’est disponible. |
| **Observabilité** | L’endpoint `/api/analytics` expose le snapshot d’événements réellement collectés ; le dashboard affiche les analyses réellement observées par plateforme sur l’instance courante. |
| **Parcours B2B** | Migration `007_b2b_workspaces_and_experiments.sql` : espaces, membres, marques et expériences de contenu avec règles RLS. L’espace `/dashboard/experiments` permet la création d’un workspace et d’une marque, la création de tests, et l’avancement de leur statut. |
| **Conversion diagnostic → action** | La page de résultats comporte un CTA qui transforme le premier quick win en test de contenu prérempli dans l’espace B2B. La navigation affiche désormais **Tests de contenu**. |

## Fichiers structurants

| Fichier | Rôle |
|---|---|
| `supabase/migrations/006_billing_history_and_security.sql` | Réconciliation profils/facturation/historique/quotas. |
| `supabase/migrations/007_b2b_workspaces_and_experiments.sql` | Modèle multi-espace, marques, expériences et RLS B2B. |
| `app/api/workspace/route.ts` | API authentifiée pour créer un workspace, un test et mettre à jour son statut. |
| `app/dashboard/experiments/page.tsx` | Interface B2B de backlog d’expériences. |
| `app/api/analytics/route.ts` | Snapshot d’observabilité par plateforme. |

## Validation exécutée

| Vérification | Résultat |
|---|---|
| `pnpm build` | **Réussi.** Next.js 16 compile les 24 routes, y compris `/api/workspace` et `/dashboard/experiments`. |
| ESLint ciblé sur les fichiers modifiés | **Réussi.** |
| ESLint global | **Échec restant : 18 erreurs et 3 avertissements**, dans des fichiers préexistants hors périmètre direct, notamment `app/page.tsx`, `app/pricing/page.tsx`, `hooks/useAnalyzeStream.ts`, `lib/anthropic.ts` et `lib/cache.ts`. |

## Étapes obligatoires avant mise en production

1. Appliquer dans Supabase les migrations `006` puis `007`, dans cet ordre.
2. Vérifier que les variables `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_STUDENT_PRICE_ID` et `NEXT_PUBLIC_APP_URL` sont présentes dans l’environnement de déploiement.
3. Tester Stripe en mode test : checkout Pro, activation par webhook, annulation, paiement échoué et achat étudiant unique.
4. Tester deux comptes distincts : création d’un workspace, accès aux expériences, et impossibilité de lire un autre espace.
5. Planifier une passe dédiée de correction du lint global restant avant un durcissement CI (`pnpm lint` comme gate de merge).

> **Limite assumée de la première livraison :** les tests de contenu sont saisis manuellement. La connexion de comptes sociaux et la remontée automatique des métriques restent le prochain incrément, nécessaire pour calculer un baseline et mesurer les résultats sans saisie manuelle.
