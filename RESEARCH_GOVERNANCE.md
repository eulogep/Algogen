# Gouvernance des recommandations AlgoLens

## Objet

AlgoLens fournit des **recommandations éditoriales à tester**. Il ne prétend pas observer les systèmes internes des plateformes, ni prédire une portée ou une croissance garanties. Cette règle traduit un principe de recherche appliquée : distinguer les données disponibles, les hypothèses interprétatives et la validation empirique.

> Toute recommandation doit être interprétée comme une hypothèse opérationnelle, puis évaluée sur les contenus et la communauté propres au créateur.

## Contrat de transparence

Chaque réponse de l’API d’analyse inclut désormais un objet `analysis_metadata` déterministe. Cet objet n’est pas généré par le modèle de langage ; il est construit côté serveur à partir de la base de connaissances versionnée.

| Champ | Signification | Usage dans l’interface |
|---|---|---|
| `data_mode` | Nature de la réponse : contexte éditorial, cache ou plan de continuité | Empêche de confondre cache, base locale et observation temps réel |
| `knowledge_base.version` | Version de la base injectée dans l’analyse | Rend la recommandation reproductible |
| `knowledge_base.last_updated` | Date de dernière mise à jour déclarée | Sert à estimer la fraîcheur |
| `confidence` | Niveau de confiance basé sur l’âge de la base et le mode de réponse | Invite à vérifier une source lorsque les informations sont anciennes |
| `source_urls` | Sources rattachées à la plateforme | Permet un examen humain des références |
| `limitations` | Limites applicables à la réponse | Encadre les usages et évite les promesses excessives |

## Politique de confiance

| Condition | Niveau affiché | Conséquence |
|---|---|---|
| Base mise à jour depuis au plus 90 jours | Élevé | Recommandation exploitable comme point de départ de test |
| Base mise à jour depuis 91 à 365 jours | Modéré | Vérifier les références officielles avant une décision significative |
| Base plus ancienne, sans date valide, ou plan de continuité | Limité | Effectuer un contrôle des sources et privilégier de petits tests réversibles |

Le niveau de confiance qualifie la **fraîcheur et la provenance du contexte**, non le résultat futur d’un contenu.

## Expérimentation mesurable

Le schéma de réponse comporte aussi un tableau `experiments`. Chaque élément doit préciser un test, une hypothèse falsifiable, une métrique primaire, une fenêtre de test et une règle de décision. L’interface de résultats affiche ces éléments et préremplit la création d’une expérience avec le premier test recommandé.

| Élément | Exigence |
|---|---|
| Hypothèse | Une relation explicite entre changement de contenu et signal mesurable |
| Métrique primaire | Un indicateur observable, déterminé avant le test |
| Fenêtre de test | Un volume de publications et une durée compatibles avec le format |
| Règle de décision | Une condition qui indique quand conserver, modifier ou abandonner le test |

Cette conception s’inspire des principes retenus lors de la recherche sur les corpus de paroles : les tendances issues d’un corpus servent à formuler des hypothèses, mais les biais de couverture, de période et de source empêchent d’en faire des certitudes universelles. Les études longitudinales de paroles de classements mettent elles-mêmes en évidence des différences selon pays, périodes et méthodes [1] [2] [3].

## Limites actuelles

La base `data/social_algorithms.json` est une ressource éditoriale locale. Elle ne remplace ni une intégration officielle aux plateformes, ni les données analytiques d’un compte, ni une veille juridique ou produit à jour. Les réponses créatives générées à partir de cette base doivent être relues avant publication.

L’usage du cache reste un accélérateur technique ; il ne modifie pas les données de provenance affichées. Une réponse renvoyée depuis le cache est explicitement identifiée comme telle et reçoit de nouvelles métadonnées de service au moment de sa restitution.

## Références

[1] [Brand, Acerbi & Mesoudi — Cultural evolution of emotional expression in 50 years of song lyrics, 2019](https://www.cambridge.org/core/journals/evolutionary-human-sciences/article/cultural-evolution-of-emotional-expression-in-50-years-of-song-lyrics/E6E64C02BDB0480DB13B8B6BB7DFF598)

[2] [Foramitti et al. — Societal crises disrupt long-term increases in stress, negativity, and simplicity in US Billboard song lyrics from 1973 to 2023, 2025](https://www.nature.com/articles/s41598-025-28327-5)

[3] [Hunke, Huber & Steffens — The Evolution of Song Lyrics: An NLP-Based Analysis of Popular Music in Germany from 1954 to 2022, 2025](https://journals.sagepub.com/doi/10.1177/20592043251331155)
