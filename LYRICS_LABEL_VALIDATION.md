# Validation automatique des labels d’amour exploratoires

## Objet

Le laboratoire lexical accepte des comptes de termes par chanson, pas des paroles complètes. Un champ `isLove: true` peut provenir d’une sélection exploratoire par ancrages lexicaux ; il ne doit donc pas être assimilé à une annotation éditoriale indépendante. Ce protocole ajoute une **validation automatique, explicable et conservatrice** avant l’analyse statistique.

## Contrat d’entrée

Chaque chanson peut déclarer `label_source: "editorial"` ou `label_source: "exploratory"`. La validation est appliquée uniquement aux candidats `isLove: true` de source exploratoire lorsque `validation_mode` vaut `auto_for_exploratory`. Les chansons étiquetées `isLove: false` constituent le témoin et les labels éditoriaux restent inchangés.

| Source de label | Traitement | Effet |
|---|---|---|
| `editorial` | Conservé sans filtre automatique | Annotation externe présumée indépendante |
| `exploratory` + `isLove: true` | Validation par familles d’indices | Conservé seulement si les indices sont convergents |
| `exploratory` + `isLove: false` | Conservé comme témoin | N’est pas recyclé comme chanson d’amour |
| Label absent | Heuristique historique du moteur | Signalé comme tel dans le résultat |

## Règle de validation

Un candidat exploratoire est retenu s’il comporte des termes appartenant à **au moins deux familles** et obtient un score minimal de deux points. Les occurrences sont plafonnées à une contribution par terme et par famille pour ne pas survaloriser les répétitions.

| Famille | Exemples de stems ou lemmes | Intention |
|---|---|---|
| Affection explicite | `love`, `lov`, `lover`, `heart`, `kiss`, `babi`, `darling`, `amour`, `tender` | Déclaration ou marqueur affectif |
| Lien relationnel | `hold`, `togeth`, `mine`, `need`, `feel`, `tonight`, `memori`, `care` | Proximité, relation ou besoin affectif |
| Projection romantique | `dream`, `desir`, `fall`, `forev`, `long`, `miss`, `sweet`, `honey` | Projection, désir ou imaginaire amoureux |

Les candidats rejetés sont **écartés du corpus d’analyse** ; ils ne sont pas déplacés vers le corpus témoin afin d’éviter de contaminer la comparaison. Le résultat expose le nombre de candidats évalués, retenus et rejetés, ainsi que les règles appliquées.

## Limites

Cette validation est un contrôle de cohérence lexical, non une compréhension sémantique complète. Elle réduit les faux positifs évidents mais ne remplace ni une annotation humaine indépendante, ni une taxonomie éditoriale vérifiée. Les tableaux de bord doivent donc afficher distinctement le mode de validation et ne présenter les résultats que comme exploratoires tant qu’un corpus éditorial n’est pas disponible.
