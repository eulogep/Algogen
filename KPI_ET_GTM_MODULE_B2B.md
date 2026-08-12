# KPIs et stratégie GTM — Module B2B d’expérimentation Algogen

**Version de travail — 12 août 2026**

## 1. Principe de mesure

Le module ne doit pas être jugé sur le nombre de recommandations générées. Son succès est d’amener une équipe à convertir un diagnostic en une **expérience publiée puis documentée**, assez souvent pour devenir son mode de pilotage du contenu. La chaîne de valeur à instrumenter est donc :

> **Compte qualifié → diagnostic → espace créé → premier test créé → test publié → apprentissage consigné → retour hebdomadaire → abonnement/expansion.**

L’indicateur cardinal, ou **North Star Metric**, est le nombre d’**espaces actifs avec au moins un apprentissage documenté sur les 28 derniers jours**. Il ne compte ni une simple inscription, ni un test brouillon ; il mesure l’usage de la boucle qui différencie le module B2B.

| Niveau | Indicateur | Définition opérationnelle | Décision qu’il éclaire |
|---|---|---|---|
| **North Star** | Espaces apprenants actifs à 28 jours | Espaces ayant au moins une expérience passée au statut `completed` au cours des 28 derniers jours. | Le module devient-il un workflow récurrent ? |
| **Activation** | Temps jusqu’au premier test (TTFT) | Médiane entre `workspace_created` et `experiment_created`. | L’onboarding mène-t-il rapidement à une action ? |
| **Exécution** | Taux de publication | `expériences avec status published, learning ou completed / expériences planned`. | Les hypothèses deviennent-elles du contenu réellement exécuté ? |
| **Apprentissage** | Taux d’apprentissage | `expériences completed / expériences published`. | L’équipe ferme-t-elle la boucle au lieu de l’abandonner après publication ? |
| **Business** | Conversion espace activé → payant | Comptes payants issus d’un espace ayant créé au moins un test / espaces ayant créé au moins un test. | L’usage de la boucle prédit-il la disposition à payer ? |

## 2. Tableau de bord prioritaire

| Priorité | KPI | Formule | Cible pilote indicative (90 jours) | Seuil d’alerte | Action si l’alerte est déclenchée |
|---|---|---|---|---|---|
| **P0** | **Taux d’activation B2B** | Espaces créant un premier test en 7 jours / espaces créés. | **≥ 60 %** | < 40 % | Réduire le formulaire, préremplir depuis le diagnostic, accompagner la première création. |
| **P0** | **TTFT médian** | Médiane `experiment_created_at − workspace_created_at`. | **≤ 15 min** lors de la première session. | > 1 jour | Auditer l’onboarding, le besoin de marque et la clarté du CTA des résultats. |
| **P0** | **Taux de publication** | Tests `published|learning|completed` / tests `planned`. | **≥ 55 %** à J14. | < 35 % | Ajouter rappels, date prévue, modèle de publication et check-in humain. |
| **P0** | **Taux d’apprentissage** | Tests `completed` / tests `published`. | **≥ 40 %** à J28. | < 25 % | Simplifier la saisie du résultat, demander un enseignement court, déclencher une revue hebdomadaire. |
| **P0** | **Espaces apprenants actifs** | Espaces avec ≥ 1 test `completed` sur 28 jours. | **15** espaces pilotes au jour 90. | < 8 | Réduire la taille du pilote et mener des entretiens de désengagement. |
| **P1** | Tests créés par espace actif | Tests créés / espaces ayant visité le module sur 28 jours. | **≥ 3** | < 1,5 | Vérifier si les diagnostics produisent assez d’actions priorisées. |
| **P1** | Rétention de workspace | Espaces actifs à J28 ou J56 / espaces créés à J0. | **≥ 45 % à J28** | < 30 % | Renforcer les alertes, le reporting et la valeur collaborative. |
| **P1** | Adoption multi-utilisateur | Espaces avec ≥ 2 membres actifs / espaces actifs. | **≥ 35 %** parmi les comptes Team/Agency. | < 20 % | Introduire invitations, commentaires, rôles et rapport partageable. |
| **P1** | Adoption du diagnostic vers backlog | Diagnostics dont le CTA crée ou préremplit un test / diagnostics affichés. | **≥ 20 %** | < 10 % | Améliorer la formulation du CTA et proposer 1–3 tests classés par impact. |
| **P2** | Qualité perçue de l’hypothèse | Réponse 4–5/5 à « ce test est exploitable » / réponses. | **≥ 70 %** | < 50 % | Améliorer la provenance, la formulation et le contexte de marque. |
| **P2** | Délai de décision | Médiane `completed_at − published_at`. | **≤ 14 jours** | > 21 jours | Proposer une date de revue et des rappels fondés sur le KPI choisi. |
| **P2** | Conversion activé → payant | Comptes payants / espaces ayant créé au moins un test. | **≥ 15 %** sur cohorte pilote. | < 8 % | Revoir packaging, preuve de valeur et accompagnement commercial. |

Les cibles sont des **seuils de pilotage initiaux**, non des benchmarks sectoriels. Elles doivent être recalibrées après 15 à 20 espaces pilotes et deux cycles complets de 28 jours.

## 3. Événements à instrumenter dès le lancement

Les événements suivants permettent de calculer les KPIs sans analyser manuellement des logs. Les identifiants `workspace_id`, `brand_id`, `user_id`, `persona`, `source` et `plan` doivent accompagner l’événement lorsque cela est compatible avec le respect de la vie privée.

| Étape | Événement | Propriétés essentielles |
|---|---|---|
| Découverte | `b2b_module_viewed` | `source`, `persona`, `plan`, `workspace_id?` |
| Diagnostic | `diagnostic_completed` | `platform`, `score_band`, `source`, `user_id?` |
| Passage à l’action | `experiment_cta_clicked` | `platform`, `recommendation_rank`, `diagnostic_id?` |
| Onboarding | `workspace_created` | `workspace_kind`, `brand_count_initial`, `persona`, `source` |
| Activation | `experiment_created` | `platform`, `priority`, `target_kpi`, `prefilled_from_diagnostic` |
| Exécution | `experiment_status_changed` | `from_status`, `to_status`, `days_since_created` |
| Valeur | `experiment_learning_recorded` | `target_kpi`, `result_direction`, `days_since_published` |
| Collaboration | `member_invited`, `member_active` | `workspace_kind`, `role` |
| Monétisation | `upgrade_viewed`, `checkout_started`, `subscription_activated` | `plan`, `workspace_kind`, `experiments_completed_28d` |

La première version du dépôt stocke le cycle de vie des expériences mais ne journalise pas encore tous ces événements. La prochaine itération doit ajouter une table d’événements append-only ou un outil analytics conforme, puis construire les cohortes par date de création de workspace.

## 4. Rituels de pilotage

| Cadence | Participants | Questions à trancher | Artefact attendu |
|---|---|---|---|
| **Hebdomadaire** | Produit, fondateur, customer success. | Où le funnel bloque-t-il ? Quels tests sont abandonnés ? | Tableau activation/exécution, 3 frictions et 3 actions de la semaine. |
| **Toutes les 2 semaines** | Produit + 3 à 5 clients pilotes. | Les hypothèses sont-elles assez concrètes ? Le résultat est-il simple à renseigner ? | Compte rendu d’entretiens, demandes classées par fréquence/impact. |
| **Mensuel** | Fondateur, produit, GTM. | Quelle cohorte retient/apprend/paye ? Faut-il changer segment ou packaging ? | Cohortes J28/J56, analyse des conversions et décision de roadmap. |

## 5. Garde-fous

Les KPIs de volume — analyses générées, vues du dashboard, compteurs de cache — restent utiles pour l’observabilité mais ne doivent pas devenir les objectifs du module B2B. Une hausse de tests créés sans hausse de publication, d’apprentissage et de rétention indiquerait une adoption superficielle. À l’inverse, une petite cohorte qui effectue plusieurs boucles complètes est un signal de product-market fit plus robuste qu’un grand volume de diagnostics isolés.

## 6. Stratégie GTM — lancement du module B2B

### 6.1 Thèse de lancement

Le module doit être lancé comme une **boucle de pilotage de contenu**, et non comme une fonctionnalité IA de plus. La promesse est :

> **« Transformez chaque diagnostic social en un test priorisé, publiable et mesurable — puis capitalisez les apprentissages au niveau de la marque. »**

Le lancement débute par un mouvement **founder-led, assisté par le produit**. Le diagnostic reste le point d’entrée libre-service, tandis que la création du premier workspace et la revue du premier test reçoivent une intervention humaine légère. Cette approche hybride est adaptée à une fonctionnalité nouvelle qui doit démontrer son impact avant de chercher une diffusion large.

| Élément | Choix de lancement | Raison |
|---|---|---|
| **Wedge** | Agences sociales spécialisées et équipes marketing de PME qui gèrent au moins 2 marques/canaux et produisent un reporting régulier. | Elles ressentent fortement le coût de la veille, de l’idéation et de la preuve de valeur ; elles peuvent produire plusieurs tests en peu de temps. |
| **Job to be done** | « Aider mon équipe à décider quoi tester cette semaine, à le faire publier et à démontrer ce qui mérite d’être répliqué. » | C’est plus précis et plus défendable qu’une promesse de “décodage d’algorithme”. |
| **Mouvement commercial** | Cohorte de design partners payante à prix préférentiel, suivie d’un early access piloté. | Réduit l’incertitude produit tout en testant la valeur économique et le processus d’achat. |
| **Moment de valeur** | Un diagnostic est converti en premier test avec un propriétaire, un KPI et une date de publication, idéalement pendant la première session. | Il maximise l’activation mesurée par le TTFT et le taux de publication. |
| **Preuve de vente** | Étude de cas courte : situation initiale, hypothèse, contenu, KPI choisi, résultat et apprentissage. | Les acheteurs B2B recherchent une preuve concrète de différenciation avant une démo.[1] |

### 6.2 ICP et sélection des premiers clients

Le pilote ne doit pas agréger des utilisateurs curieux. Il doit sélectionner **5 à 10 design partners** représentatifs, urgents et capables d’exécuter. Cette taille permet des itérations rapides sans créer un programme de support impossible à gérer.[2]

| Rang | Segment | Signal d’éligibilité | Acheteur / champion | Douleur active | Exclusion initiale |
|---|---|---|---|---|---|
| **1** | Agence sociale de 3–15 personnes, 5–30 comptes gérés. | Reporting mensuel, calendrier éditorial et besoin de différencier le conseil client. | Directeur d’agence ou head of social ; social media manager champion. | Démontrer la valeur stratégique à plusieurs clients sans multiplier les fichiers et recommandations ad hoc. | Agence sans production sociale récurrente ou qui exige immédiatement du white-label complet. |
| **2** | PME B2C / marque e-commerce avec équipe marketing de 2–8 personnes. | Publication organique régulière sur un ou deux canaux et pression sur la croissance sans augmenter le budget média. | Responsable marketing/growth ; content manager champion. | Prioriser les tests plutôt que publier « plus » sans apprentissage. | Équipe sans propriétaire de canal ni cadence de publication. |
| **3** | Consultant social / micro-agence experte. | Plusieurs clients récurrents et volonté de formaliser les méthodes. | Fondateur. | Gagner du temps dans la préparation/restitution et légitimer la recommandation. | Solopreneur à faible fréquence de publication : utile pour acquisition, moins pour valider la collaboration B2B. |

Les trois critères d’admission au pilote sont : **représentativité**, **urgence** et **capacité**. Un partenaire doit ressembler au marché visé, avoir déjà tenté une solution ou bricolé un processus, et disposer d’un champion ayant le temps d’exécuter et de donner un retour régulier.[2]

### 6.3 Offre pilote et conditions de réussite

| Élément | Proposition | But |
|---|---|---|
| **Nom de l’offre** | *Founding Experiment Partner* | Signaler une relation de co-construction et une capacité limitée. |
| **Cohorte** | 5–10 organisations pendant 6 semaines, maximum 2 à 3 personnes opérationnelles par organisation. | Obtenir des retours denses et comparables. |
| **Engagement client** | 1 marque pilote, 1 canal prioritaire, au moins 1 test par semaine et 30 minutes de revue hebdomadaire. | Éviter les comptes passifs qui ne produisent aucun apprentissage. |
| **Engagement Algogen** | Onboarding de 45 minutes, mise en place du premier test, office hours hebdomadaire, support prioritaire et roadmap partagée. | Accélérer le TTFT et rendre l’expérimentation observable. |
| **Prix à tester** | **149 €/mois** pour une équipe ; **249 €/mois** pour une agence, gelés pendant trois mois pour les partenaires fondateurs. | Tester la disposition à payer tout en restant cohérent avec la valeur multi-marques et le packaging futur. |
| **Critère de passage à l’early access** | Au moins 60 % d’activation à J7, 55 % de publication à J14 et 40 % d’apprentissage à J28 sur la cohorte. | Ne pas augmenter l’acquisition avant d’avoir vérifié la boucle de valeur. |

Le prix pilote n’est pas un prix catalogue définitif. Il sert à vérifier la perception de valeur et à distinguer l’intérêt réel du simple désir d’essayer gratuitement. Le contrat doit préciser ce qui est standard, ce qui relève de la collecte de feedback, et ce qui n’est pas promis, afin d’éviter de construire une solution sur-mesure pour un seul client.

### 6.4 Plan de lancement sur 90 jours

| Période | Objectif | Actions fondatrices | Livrables et critères de sortie |
|---|---|---|---|
| **J0–J14 : préparer** | Clarifier la promesse et constituer la liste de prospects. | Créer une landing dédiée « diagnostic → test → apprentissage », un exemple de rapport, une démo de 3 minutes et une fiche pilote. Constituer une liste de 40 comptes : 20 agences, 15 PME, 5 consultants. | 20 conversations de découverte proposées ; 10 démonstrations planifiées ; critères de qualification documentés. |
| **J15–J30 : recruter** | Signer 5–10 design partners engagés. | Prospection fondateur via réseau, LinkedIn, communautés de social media managers et partenaires agences ; entretien de qualification de 30 minutes ; proposer un audit piloté d’une marque. | 5–10 accords pilote ; chaque compte dispose d’un champion, d’un canal et d’un KPI. |
| **J31–J60 : activer** | Atteindre la première boucle de valeur. | Onboarding collectif + individuel, création du premier workspace, conversion du diagnostic en test, revue hebdomadaire de l’exécution. Relancer les comptes qui n’ont pas publié. | 60 % des workspaces créent un test à J7 ; première étude de cas anonymisée ou nominative avec accord. |
| **J61–J75 : prouver** | Démontrer la répétabilité et préparer l’early access. | Consolider les apprentissages, mesurer les cohortes, réaliser des entretiens de mi-pilote, comparer les retours agence/PME et clarifier packaging/prix. | 3 preuves d’usage, 2 cas d’étude, décision documentée sur le segment prioritaire. |
| **J76–J90 : élargir avec contrôle** | Ouvrir une early access de 15–20 comptes supplémentaires. | Publication des cas d’usage, programme de parrainage, webinar de démonstration, campagne de contenu SEO/LinkedIn et suivi product-led des PQL. | Au moins 15 nouveaux comptes qualifiés ; maintien des métriques d’activation et de publication. |

### 6.5 Canaux et messages

L’effort initial doit privilégier la confiance et la démonstration du produit. Dans l’étude Wynter auprès de décideurs marketing B2B, 58 % s’appuient sur leur réseau pour établir une shortlist, 73 % placent le bouche-à-oreille au premier rang, tandis que 97 % visitent le site et 82 % utilisent une démo interactive ou un essai ; les canaux froids sont moins influents.[1] Le budget et l’énergie doivent donc être concentrés sur la preuve, les pairs et le produit visible, avant l’achat de volume.

| Canal | Motion | Offre ou contenu | Indicateur pilote |
|---|---|---|---|
| **Réseau fondateur et clients existants** | Références chaudes, conversations individuelles. | Invitation limitée au programme fondateur, audit d’une marque et checklist de sélection. | Taux de réponse, entretien → pilote signé. |
| **Partenariats d’agences** | Co-vente légère : une agence teste le module sur 1–3 clients. | Session « comment transformer un reporting social en backlog de tests ». | Nombre de marques activées et taux de recommandation. |
| **LinkedIn du fondateur / équipe** | Construire la crédibilité avec des enseignements opérationnels. | Décryptage anonymisé de tests, avant/après de processus, cadres de décision par plateforme. | Conversations entrantes, clic vers démo, inscriptions qualifiées. |
| **SEO et pages de comparaison** | Intercepter une douleur explicite. | Pages « comment prioriser des tests Reels », « alternatives au reporting social manuel », preuves et démo interactive. | Visites à intention, diagnostic démarré, CTA expérimentation. |
| **Webinar / démo collective** | Montrer le workflow de bout en bout. | 30 minutes : diagnostic réel → test → revue d’apprentissage. | Inscription → présence → pilote/essai activé. |
| **Parrainage clients** | Transformer les premiers succès en recommandation. | Crédit d’abonnement ou mois additionnel en contrepartie d’un client qui complète l’onboarding. | Parrainages qualifiés et activation par cohorte. |

### 6.6 Entonnoir et passage PLG → sales assisté

| Étape | Signal produit | Intervention | Objectif de conversion |
|---|---|---|---|
| **Visiteur qualifié** | Visite d’une page problème ou comparaison. | Landing claire et démo montrant une boucle complète, pas un écran IA isolé. | Visite → diagnostic. |
| **Diagnostic activé** | Analyse terminée et résultat consulté. | CTA « créer un test » avec préremplissage ; capture d’e-mail seulement après valeur initiale. | Diagnostic → clic expérimentation ≥ 20 %. |
| **PQL individuel** | Workspace créé + premier test créé, ou deux diagnostics en 7 jours. | Message in-app/e-mail avec proposition de revue de 20 minutes. | PQL → rendez-vous ou essai Team. |
| **PQL équipe/agence** | 2+ marques, 2+ membres ou 3+ tests créés en 14 jours. | Démo personnalisée, import du process actuel et proposition de pilote payé. | Démo → pilote ≥ 30 %. |
| **Compte apprenant** | Premier test completed ou revue hebdomadaire effectuée. | Proposition Team/Agency, rapport exportable et besoin de collaboration. | Compte apprenant → payant ≥ 15 %. |

### 6.7 Rôles et cadences

| Rôle | Responsabilité pendant le pilote | Cadence |
|---|---|---|
| **Fondateur** | Recrutement, discovery, démonstrations, pricing et décisions de segment. | 5 entretiens prospects/semaine ; revue pipeline hebdomadaire. |
| **Produit** | Analyse de friction, instrumentation, correction du onboarding et des statuts de test. | Revue des activations chaque semaine ; sprint toutes les deux semaines. |
| **Customer success** | Onboarding, revue de test, prévention de l’abandon et collecte structurée de feedback. | Check-in hebdomadaire par partenaire. |
| **Marketing** | Cas d’usage, landing, contenu de preuve et webinar. | 2 contenus de preuve/semaine ; une démo collective/mois. |

### 6.8 Décisions de go/no-go

Le programme doit être élargi uniquement si le comportement de la cohorte, pas le nombre d’inscriptions, démontre la valeur. Si le taux de création est élevé mais le taux de publication est faible, le problème est d’exécution ou de workflow. Si la publication est élevée mais l’apprentissage est faible, la mesure est trop coûteuse ou l’interface de revue insuffisante. Si les trois indicateurs sont bons mais que le paiement reste faible, il faut revoir packaging, prix, acheteur ou preuve de ROI.

| Décision | Déclencheur | Action |
|---|---|---|
| **Accélérer l’early access** | Les 3 KPIs P0 dépassent les seuils sur deux cohortes de 28 jours, et au moins 3 comptes demandent l’extension. | Ouvrir 15–20 comptes supplémentaires, recruter par parrainage et publier les cas d’étude. |
| **Itérer le produit avant acquisition** | Activation < 40 % ou TTFT > 1 jour. | Réduire le setup, guider le premier test et concentrer le produit sur un segment/canal. |
| **Repositionner le segment** | Un segment atteint systématiquement l’exécution/apprentissage mieux que les autres. | Recentrer message, cas d’usage, intégrations et prix sur le segment le plus urgent. |
| **Revoir la monétisation** | Comptes apprenants actifs mais conversion payante < 8 %. | Tester des packs Team/Agency, un pilote avec résultats, et une valeur liée aux marques/rapports plutôt qu’aux générations. |

## Références

[1]: https://wynter.com/post/how-b2b-saas-marketing-leaders-buy-2024 "Wynter — The B2B Buyer Journey Research: How B2B SaaS Marketing Leaders Buy Software in 2024"
[2]: https://a16z.com/a-framework-for-finding-a-design-partner/ "Andreessen Horowitz — A Framework for Finding a Design Partner"
