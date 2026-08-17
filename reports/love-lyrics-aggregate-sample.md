# Test d’optimisation lexicale — échantillon agrégé musiXmatch

## Protocole

Le script `scripts/run-lyrics-aggregate-sample.ts` applique l’algorithme à un échantillon déterministe du fichier d’entraînement musiXmatch. La règle `stableHash(track_id) % 97 < 5` a retenu **10 710 représentations agrégées**. Les données source restent dans le cache local exclu de Git ; ce rapport et son pendant JSON ne contiennent aucun texte de paroles ni aucun identifiant de chanson.

| Mesure | Valeur |
|---|---:|
| Représentations analysées | 10 710 |
| Sous-corpus d’amour heuristique | 4 680 |
| Corpus témoin | 6 030 |
| Vocabulaire observé | 4 942 |
| Plafonnement d’un terme par chanson | 3 occurrences |
| Étiquetage | Présence d’au moins un ancrage lexical d’amour |

## Résultat de l’exécution

La palette optimisée contient, dans l’ordre de saillance sur cet échantillon : **love**, **heart**, **kiss**, **babi**, **need**, **girl**, **want**, **never**, **night**, **lover**, **hold** et **give**. Les formes `babi` et d’autres termes sont stemmatisées par le jeu de données et ne doivent pas être considérées comme des mots édités.

Les cooccurrences les plus soutenues, calculées au niveau de la chanson et non comme des séquences de paroles, incluent les couples `babi ↔ girl`, `dream ↔ true`, `give ↔ need`, `ever ↔ never` et `babi ↔ need`. Elles servent à décrire des proximités conceptuelles ; elles ne sont pas affichées ni utilisées comme formulations à reproduire.

## Interprétation correcte

Ce test est un **smoke test empirique**, pas une validation finale des thèmes amoureux. Le sous-corpus est identifié par des ancrages contenant notamment `love`, `heart` et `kiss` : il est donc normal que ces mêmes termes soient saillants. Le test démontre que le moteur ingère, équilibre, filtre et restitue un grand échantillon agrégé ; il ne démontre pas à lui seul que la taxonomie romantique est calibrée.

Pour une évaluation substantive, le prochain jeu de données doit comporter des étiquettes éditoriales `isLove`, ou une sélection de titres établie de manière indépendante des mêmes termes utilisés pour classer les chansons. L’interface et l’API prennent déjà en charge ce champ.

## Source

Le fichier est issu du jeu de données musiXmatch du Million Song Dataset, présenté officiellement comme une représentation de paroles en sac de mots pour la recherche [1].

[1] [Million Song Dataset — The musiXmatch Dataset](http://millionsongdataset.com/musixmatch/)
