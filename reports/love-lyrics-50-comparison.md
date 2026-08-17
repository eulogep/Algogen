# Comparaison — analyse lexicale des chansons d’amour

Le second passage élargit le corpus à **50 représentations agrégées réelles** issues du jeu musiXmatch associé au Million Song Dataset. Les données utilisées sont des sacs de mots et non des paroles complètes ; aucun texte de chanson ni ordre de mots n’est conservé ou rendu. [1]

| Indicateur | Premier test visible | Test élargi avec validation | Évolution |
|---|---:|---:|---:|
| Documents soumis | 12 | 50 | +38 |
| Documents retenus par le moteur | 12 | 40 | +28 |
| Documents « amour » | 6 | 15 | +9 |
| Corpus témoin | 6 | 25 | +19 |
| Vocabulaire observé | 39 | 1 263 | +1 224 |
| Validation exploratoire automatique | Non appliquée | 15 retenus / 25 candidats ; 10 rejetés | Nouveau contrôle |

## Palette lexicale

| Position | Premier test | Test élargi validé |
|---:|---|---|
| 1 | `love` | `love` |
| 2 | `babi` | `need` |
| 3 | `hold` | `heart` |
| 4 | `need` | `babi` |
| 5 | `feel` | `tonight` |
| 6 | `tonight` | `hold` |
| 7 | `night` | `kiss` |
| 8 | `kiss` | `mine` |
| 9 | `lover` | `memori` |
| 10 | `tender` | `togeth` |
| 11 | `fall` | `lover` |
| 12 | `desir` | `desir` |

Huit termes sont communs aux deux palettes : `love`, `babi`, `hold`, `need`, `tonight`, `kiss`, `lover` et `desir`. La persistance de ces termes malgré le changement d’échelle suggère un noyau lexical stable dans cet échantillon. Les formes sont des **stems** et ne doivent pas être lues comme des lemmes ou comme des fragments de paroles.

## Associations au niveau chanson

Le premier test faisait ressortir `babi ↔ hold` et `love ↔ need`. Le test élargi conserve ces signaux : `babi ↔ hold` atteint trois documents avec un PMI de 0,63 ; `love ↔ need` apparaît dans six documents avec un PMI de 0,16. Il ajoute aussi `heart ↔ need` et `babi ↔ need`, chacun observé dans quatre documents.

> Une association désigne une cooccurrence au niveau de la chanson dans une représentation agrégée. Elle ne restitue ni phrase, ni n-gramme, ni ordre de mots.

## Validation automatique ajoutée

Les 25 candidats initialement marqués `isLove: true` et de source exploratoire sont testés par trois familles d’indices : **affection explicite**, **lien relationnel** et **projection romantique**. Un candidat est retenu seulement s’il active au moins deux familles. Quinze candidats satisfont cette règle ; les dix autres sont retirés du corpus et ne sont pas basculés dans le témoin, afin de ne pas contaminer la comparaison.

Cette validation est volontairement conservatrice. Elle améliore la cohérence de l’échantillon, sans équivaloir à une annotation éditoriale indépendante. Une étape ultérieure devra confronter les décisions automatiques à des labels humains aveugles au signal lexical initial.

## Références

[1] [Million Song Dataset — musiXmatch dataset](http://millionsongdataset.com/musixmatch/)
