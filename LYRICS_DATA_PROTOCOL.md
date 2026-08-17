# Protocole de données — module d’analyse de paroles d’amour

## Source de test

Le test s’appuie sur le fichier d’entraînement du jeu de données **musiXmatch** lié au Million Song Dataset. La documentation officielle indique qu’il fournit des représentations de paroles en **sac de mots** pour la recherche, et non les paroles intégrales, notamment en raison des contraintes de droit d’auteur. Le fichier d’entraînement documenté contient 210 519 lignes de représentations agrégées ; chaque ligne associe un identifiant de piste à des paires `index:compte` reliées à un vocabulaire de 5 000 termes [1].

> Le module ne télécharge, ne stocke et ne publie aucune parole complète. Le fichier de test reste dans `/.cache/`, qui est exclu du contrôle de version.

## Limites méthodologiques

| Élément | Conséquence appliquée dans le module |
|---|---|
| Termes stemmatisés | Les formes affichées peuvent être tronquées ; elles ne sont pas des lemmes édités. |
| Absence d’ordre des mots | Le module calcule des cooccurrences au niveau chanson ; il ne calcule pas de n-grammes, de chaînes de Markov ou d’extraits. |
| Langue non native dans le fichier | L’échantillon de test est traité comme majoritairement anglophone et les résultats ne sont pas généralisés au français. |
| Label « amour » absent ou exploratoire | Le test applique une règle de départ fondée sur des termes d’amour. L’interface accepte `isLove` avec `label_source: "editorial"` ou `"exploratory"`. Les positifs exploratoires sont validés automatiquement avant l’analyse. |
| Période incomplète | La mesure est présentée comme exploratoire sur l’échantillon et non comme une conclusion sur 75 ans de chansons d’amour. |

## Algorithme

La saillance lexicale compare un sous-corpus romantique au corpus témoin. Les occurrences sont plafonnées par chanson ; chaque chanson est pondérée par sa strate afin d’éviter qu’une période ou une langue trop représentée ne domine mécaniquement. La mesure centrale associe un log-odds régularisé, un support documentaire et une couverture minimale.

Les associations sont des paires de termes co-présents dans les mêmes représentations de chansons. Elles sont filtrées par support minimal et information mutuelle positive. Elles ne sont jamais interprétées comme des phrases, paroles ou suites de mots.

## Validation des labels exploratoires

Lorsque `isLove: true` provient d’une règle exploratoire, le mode `validation_mode: "auto_for_exploratory"` est actif par défaut. Le candidat doit activer au moins deux familles d’indices — affection explicite, lien relationnel et projection romantique — pour être retenu. Un candidat rejeté est retiré du calcul, **sans être déplacé dans le corpus témoin**. Le résultat affiche le nombre de candidats évalués, retenus et rejetés. Cette règle améliore la cohérence du corpus mais ne remplace pas une annotation éditoriale indépendante.

## Référence

[1] [Million Song Dataset — The musiXmatch Dataset](http://millionsongdataset.com/musixmatch/)
