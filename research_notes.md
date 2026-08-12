# Notes de recherche — Algogen

## Audit du dépôt (12 août 2026)

- **Produit observé** : AlgoLens, SaaS B2C/prosumer d’aide aux créateurs visant à produire des stratégies de contenu multicanal. L’offre annoncée couvre TikTok, Reels, Feed Instagram, YouTube Shorts et long format, LinkedIn et X ; elle promet une stratégie de 30 jours, une veille algorithmique, l’historique et un modèle freemium (3 analyses/mois) avec Pro à 9 €/mois.
- **Moteur actuel** : injection dans Claude d’un dataset éditorial statique local (`data/social_algorithms.json`, version 1.0.0 ; dernière mise à jour le 25 mars 2025) et génération JSON. La vraie différenciation est donc, à ce stade, la qualité/fraîcheur de la connaissance et l’expérience, non un modèle propriétaire ni des données connectées aux comptes sociaux.
- **Atouts** : UX landing nette, analyse structurée et actionnable, cache L1/L2, auth Supabase, intégration de paiement pensée côté serveur, sources officielles et sectorielles présentes dans le dataset.
- **Risques / écarts contrôlés** : le schéma versionné `profiles` ne contient pas plusieurs champs interrogés par `lib/plans.ts` (`expires_at`, identifiants Stripe, `student_used`) et les RPC de facturation ne sont pas définies dans les migrations visibles. Les analyses anonymes sont sans quota. Les pages analytics et veille basculent vers des données démo codées en dur en absence de données. Le comparateur fait deux appels standard sans transmettre `compareMode`, donc le gate Pro prévu côté API n’est pas exercé par ce flux.
- **Implication** : sécuriser d’abord la cohérence de production, valider des résultats connectés à des données réelles et clarifier un segment prioritaire avant d’élargir la surface fonctionnelle.

## Sources externes consultées

1. [G2 — Project Management Software](https://www.g2.com/categories/project-management), consulté le 12 août 2026. Page de catégorie présentant les capacités attendues et les signaux de satisfaction. Jira est affiché avec 4,3/5 sur 7 934 avis. G2 cite parmi les capacités clés dépendances et suivi d’avancement en temps réel ; parmi les résultats recherchés, respect des délais et coordination transverse.
2. [Grand View Research — AI for Customer Service](https://www.grandviewresearch.com/industry-analysis/ai-customer-service-market-report), consulté le 12 août 2026. Navigation soumise à une vérification Cloudflare : utiliser une autre source publique pour les chiffres précis plutôt que s’appuyer sur le snippet.

## À approfondir

- Comparatif 10 principaux outils de gestion de projet : Jira, Asana, monday.com, ClickUp, Smartsheet, Notion, Wrike, Trello, Microsoft Planner, Linear.
- Produits comparables à Algogen : Sprout Social, Hootsuite, Buffer, Later, Metricool, Dash Social, Emplifi, Brandwatch, SocialPilot, FeedHive / Predis.ai.
- Marché IA service client : triangulation de MarketsandMarkets et études/adoption par Zendesk, Intercom, Gartner/IBM ou McKinsey.
- Personas : créateur indépendant, social media manager d’une PME, agence / consultant contenu, marketing lead d’une marque en croissance.

## Sources et constats — marché et concurrence

### Gestion de projet

| Source | Éléments à retenir |
|---|---|
| [Capterra — Shortlist 2026](https://www.capterra.com/project-management-software/shortlist/) | Méthodologie combinant score de notes et de popularité. Scores globaux : Asana, Jira et Notion 95/100 ; Trello 93 ; ClickUp et monday.com 91 ; Smartsheet 90 ; Wrike 87 ; Basecamp 86 ; Odoo 85. |
| [Ramp Rate — Project Management](https://ramp.com/vendors/categories/project-management) | Proxy d’adoption, et non part de marché globale : dans l’échantillon de dépenses B2B de Ramp (70 000+ entreprises US), Jira 49 %, Notion 32 %, Asana 19 %, monday.com 15 % et Linear 15 % ; Linear est le plus dynamique. |
| [Capterra — catégorie Project Management](https://www.capterra.com/project-management-software/) | 55 % des acheteurs cherchent des capacités IA (échantillon de 2 545). 58 % budgètent 20–40 $/utilisateur/mois ; l’onboarding, les intégrations et la migration restent essentiels. |
| [G2 — catégorie Project Management](https://www.g2.com/categories/project-management) | Jira affiché à 4,3/5 sur 7 934 avis lors de la consultation. G2 met en avant dépendances et suivi d’avancement, avec livraison à l’heure et coordination transverse comme résultats attendus. |

### Projet comparable et adjacent à Algogen

| Produit | Positionnement ou tarif vérifié | Lecture pour Algogen |
|---|---|---|
| [Buffer](https://buffer.com/pricing) | Gratuit pour 3 canaux ; Essentials 5 $/canal/mois et Team 10 $/canal/mois (annuel), avec IA, planification, analytics, inbox et approbations au niveau Team. | Référence basse de prix et parcours PLG ; Algogen doit se distinguer par la décision et non devenir un programmateur de plus. |
| [Hootsuite](https://www.hootsuite.com/plans) | 99/199/399 $ par utilisateur/mois selon les capacités ; IA, publication, inbox, monitoring, tendances et reporting. | Incumbent omnicanal puissant ; espace de niche possible sur l’intelligence de performance individualisée et la simplicité. |
| [Sprout Social](https://sproutsocial.com/fr/pricing/) | 199/299/399 $ par utilisateur/mois ; inbox, suivi, intelligence concurrentielle, sentiment, helpdesk, rapports. | Référence entreprise et social care ; prix nettement supérieur à celui d’Algogen mais forte profondeur de données connectées. |
| [Socialinsider](https://www.socialinsider.io/pricing) | Analytics et benchmark concurrentiel à partir de 83 $/mois ; 4,7/5 sur 130+ avis G2 affichés. | La fonction d’étalonnage concurrentiel est une lacune monétisable d’Algogen. |

### IA pour le service client

| Source | Éléments à retenir |
|---|---|
| [MarketsandMarkets — AI for Customer Service](https://www.marketsandmarkets.com/Market-Reports/ai-for-customer-service-market-244430169.html) | Marché mondial estimé à 12,06 Md$ en 2024 et 47,82 Md$ en 2030, soit 25,8 % de CAGR. La publication mentionne les agents IA, recommandation / knowledge, automatisation et analytics ; l’APAC est la région à la croissance la plus rapide. |
| [Zendesk CX Trends 2025](https://www.zendesk.com/newsroom/articles/2025-cx-trends-report/) | Enquête auprès de près de 10 500 consommateurs et professionnels : 73 % des agents estiment qu’un copilote IA améliorerait leur travail ; 64 % des consommateurs font davantage confiance à un agent au ton amical et empathique ; 63 % changeraient de fournisseur après une mauvaise expérience. |
| [Intercom Transformation Report 2026](https://www.intercom.com/customer-transformation-report) | Enquête Q4 2025 (2 470 professionnels) : 82 % des dirigeants ont investi dans l’IA de service client, mais seuls 10 % atteignent un déploiement mature ; 87 % de ces équipes matures déclarent de meilleurs indicateurs. |
| [Intercom pricing](https://www.intercom.com/pricing) | Fin est vendu 0,99 $ par issue résolue, utilisable sur un helpdesk existant ; ce modèle orienté outcome s’ajoute aux licences par siège. |
| [Zendesk pricing](https://www.zendesk.com/pricing/) | Plans à partir de 19 $/agent/mois ; Suite Team 55 $, Suite Professional 115 $, avec IA, omnicanal, ticketing et prix IA fondé sur les résolutions automatisées. |
| [Salesforce Service pricing](https://www.salesforce.com/service/pricing/) | 175 $/utilisateur/mois pour Enterprise Service avec IA ; 350 $ pour Unlimited ; 550 $ pour Agentforce 1 Service Edition. Écosystème CRM et intégrations comme canal de distribution et verrouillage. |
| [Gorgias pricing](https://www.gorgias.com/pricing) | Offre e-commerce à partir de 40 $/mois avec 50 tickets et 30 interactions automatisées, puis 1,50 $ par interaction IA additionnelle. |

### Hypothèses à expliciter dans la synthèse

- Pour le marché de l’IA de service client, le **TAM** sera aligné sur l’estimation de 12,06 Md$ en 2024 de MarketsandMarkets ; le **SAM** et le **SOM** seront des scénarios de planification, non des données observées, bornés par un périmètre SaaS B2B ciblé et un modèle de capture de revenu transparent.
- Une « part de marché » exacte et comparable à l’échelle mondiale n’est pas disponible publiquement pour tous les outils de gestion de projet. Le rapport doit donc utiliser le proxy d’adoption Ramp, documenter son échantillon et éviter de le présenter comme une part de revenus mondiale.
- Algogen est plus proche du marché martech / creator-economy que du marché du service client IA ou des outils de gestion de projet. Les deux dernières analyses sont utiles comme benchmarks de stratégie, produit et GTM, mais ne doivent pas réorienter artificiellement le cœur de produit sans validation client.

## Personas et parcours client — synthèse de travail

Les personas ci-dessous sont des **hypothèses de segment à valider par entretiens et données d’usage** ; ils sont spécifiquement adaptés à l’évolution B2B d’Algogen vers une plateforme d’intelligence et de pilotage du contenu social. Ils ne décrivent pas des données démographiques observées.

| Persona | Contexte / job à accomplir | Douleurs prioritaires | Déclencheur et critères de décision | Offre / moment de valeur proposé |
|---|---|---|---|---|
| **Léa, social media manager de PME** | Pilote 4–8 canaux, doit livrer un calendrier crédible et rendre compte à son responsable marketing. | Temps perdu à passer de tableaux aux plateformes ; conseils génériques ; difficulté à relier une recommandation à un KPI et au contenu publié. | Baisse de portée, nouvelle campagne, lancement de produit. Elle exige gain de temps, recommandations explicables, export et prix maîtrisé. | Audit connecté par canal + 3 priorités + calendrier de 14 jours ; démontrer le premier plan exploitable en moins de 10 min. |
| **Mathis, directeur d’agence / consultant** | Gère plusieurs comptes clients, assure les reportings et la crédibilité stratégique de l’agence. | Veille manuelle, reporting hétérogène, risque de recommandations invérifiables, collaboration et validation dispersées. | Nouveau client, renouvellement de contrat, besoin de prouver la valeur. Critères : multi-marques, benchmark concurrentiel, export brandé, partage, droits et traçabilité. | Espace agence, marques/client, benchmark et rapport PDF/URL partageable ; essai guidé avec un véritable compte client. |
| **Inès, responsable contenu / growth d’une scale-up** | Coordonne contenu organique et acquisition, travaille avec créatifs, produit et direction. | Impossible d’identifier les formats réplicables et de prioriser des tests ; métriques séparées de la stratégie ; besoin de consensus. | Ralentissement de la croissance organique, pression sur le CAC, réorganisation GTM. Critères : intégrations, segmentation, gouvernance, sécurité et preuves de ROI. | Score d’opportunité basé sur données connectées, boucle « hypothèse → publication → mesure → apprentissage », alertes et collaboration. |
| **Romain, créateur professionnel / solopreneur** | Produit lui-même et veut accélérer la croissance sans équipe dédiée. | Manque de temps, surcharge de conseils contradictoires, absence de plan adapté à son audience. | Palier de croissance, lancement d’offre/sponsor. Critères : simplicité, résultat immédiat, prix faible et exemples directement utilisables. | Segment PLG d’acquisition : diagnostic gratuit limité, 3 actions en 48 h et résultat partageable ; passage Pro lorsque l’historique et la mesure deviennent nécessaires. |

### Parcours recommandé : compte PME / agence

| Étape et objectif client | Points de contact actuels ou à créer | Friction probable | Optimisation de conversion et preuve à fournir | Mesure principale |
|---|---|---|---|---|
| **Découverte** : comprendre pourquoi la portée stagne | SEO sur problèmes concrets par plateforme, études de cas, contenu LinkedIn, partenariats d’agences et créateurs. | « Encore un générateur IA générique. » | Positionnement « intelligence de performance social, pas générateur de posts » ; benchmark anonyme et contenu source-cité. | Visites qualifiées, inscription depuis contenu. |
| **Évaluation** : vérifier la pertinence et la confiance | Landing segmentée, pages comparatives, avis, démo interactive, outil de diagnostic. | Données statiques et promesses « algorithme » jugées peu crédibles. | Montrer sources, date de fraîcheur, niveau de confiance ; fournir résultat réel à partir d’une connexion ou d’un exemple. | Démarrage diagnostic, taux de connexion, activation. |
| **Activation** : atteindre le « aha moment » | Onboarding orienté rôle, connexion d’un compte, import des objectifs et premier plan. | Formulaire long ; pas de donnée d’audience connectée ; résultat non actionnable. | Limiter les entrées au strict nécessaire ; produire une première recommandation, une tâche et une mesure en <10 min ; checklist contextuelle. | Time-to-first-value, taux d’activation, première tâche créée. |
| **Validation / achat** : obtenir consensus et payer | Rapport partageable, espace d’équipe, comparatif de plans, calculateur ROI ; CSM/démo pour agence et scale-up. | Justifier ROI, collaboration et conformité ; prix trop bas associé à faible fiabilité ou incohérence avec valeur B2B. | Mettre en avant « temps économisé + tests évités + signal de performance » ; plan Team/Agency et pack pilote de 30 jours. | Essai → payant, PQL → démo, durée de cycle. |
| **Adoption et rétention** : ancrer la boucle d’apprentissage | Alertes de dérive, rapport hebdo, bibliothèque de tests, rétrospective de campagne, support proactif. | Le plan n’est pas exécuté ; recommandations oubliées ; valeur non mesurée. | Intégrer calendrier/tâches, notifier les décisions plutôt que les données brutes, rendre les gains visibles avant le renouvellement. | WAU/MAU, rétention 30/90 j, taux de tâche publiée, expansion. |

Les données externes appuient le besoin d’un parcours mixte : Gartner rapporte une préférence forte pour le libre-service, mais conclut que l’association de ressources numériques et d’un interlocuteur commercial augmente la probabilité d’un accord de qualité ; Wynter observe que site, démos interactives et avis tiers sont des points de contact déterminants pour les décideurs marketing. Les chiffres de ces sources doivent être lus comme des indications de GTM B2B, pas comme des résultats propres à Algogen.

Références de travail : [Gartner — B2B buying journey](https://www.gartner.com/en/sales/insights/b2b-buying-journey), [Wynter — B2B SaaS marketing leaders](https://wynter.com/post/how-b2b-saas-marketing-leaders-buy-2024), [Mixpanel — Product-led growth](https://mixpanel.com/blog/product-led-growth/).
