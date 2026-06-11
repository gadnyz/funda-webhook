const DAILY_QUIZ_QUESTION_COUNT = 10;

const resources = [
  {
    slug: "intro-iot",
    topic: "iot",
    title: "Comprendre l'IoT",
    level: "débutant",
    type: "cours",
    description: "Les bases des objets connectés, des capteurs, des données et des usages.",
    url: "https://www.ibm.com/topics/internet-of-things",
    sortOrder: 10
  },
  {
    slug: "arduino",
    topic: "iot",
    title: "Arduino",
    level: "débutant",
    type: "outil",
    description: "Une plateforme simple pour créer des prototypes avec capteurs et actionneurs.",
    url: "https://docs.arduino.cc/",
    sortOrder: 20
  },
  {
    slug: "raspberry-pi",
    topic: "iot",
    title: "Raspberry Pi",
    level: "débutant",
    type: "outil",
    description: "Un mini-ordinateur utile pour les passerelles, dashboards et projets IoT.",
    url: "https://www.raspberrypi.com/documentation/",
    sortOrder: 30
  },
  {
    slug: "mqtt",
    topic: "iot",
    title: "MQTT",
    level: "intermédiaire",
    type: "cours",
    description: "Le protocole léger le plus courant pour publier et recevoir des données IoT.",
    url: "https://mqtt.org/getting-started/",
    sortOrder: 40
  },
  {
    slug: "node-red",
    topic: "iot",
    title: "Node-RED",
    level: "intermédiaire",
    type: "outil",
    description: "Un outil visuel pour connecter API, capteurs, MQTT et tableaux de bord.",
    url: "https://nodered.org/docs/",
    sortOrder: 50
  },
  {
    slug: "edge-computing",
    topic: "iot",
    title: "Edge Computing",
    level: "intermédiaire",
    type: "cours",
    description: "Traiter une partie des données près des objets pour réduire la latence et les coûts.",
    url: "https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/",
    sortOrder: 60
  },
  {
    slug: "securite-iot",
    topic: "iot",
    title: "Sécurité IoT",
    level: "avancé",
    type: "cours",
    description: "Identité, chiffrement, mises à jour, segmentation réseau et réduction des risques.",
    url: "https://www.cisa.gov/resources-tools/resources/secure-by-design",
    sortOrder: 70
  },
  {
    slug: "thingspeak",
    topic: "iot",
    title: "ThingSpeak",
    level: "débutant",
    type: "plateforme",
    description: "Plateforme pratique pour collecter et visualiser des données de capteurs.",
    url: "https://thingspeak.com/pages/learn_more",
    sortOrder: 80
  },
  {
    slug: "aws-iot",
    topic: "iot",
    title: "AWS IoT",
    level: "avancé",
    type: "plateforme",
    description: "Services cloud pour connecter, sécuriser et analyser des flottes d'objets.",
    url: "https://docs.aws.amazon.com/iot/",
    sortOrder: 90
  },
  {
    slug: "projet-station-meteo",
    topic: "iot",
    title: "Projet météo",
    level: "débutant",
    type: "projet",
    description: "Mini-projet: mesurer température et humidité, puis publier les données.",
    url: "https://randomnerdtutorials.com/esp32-dht11-dht22-temperature-humidity-web-server-arduino-ide/",
    sortOrder: 100
  }
];

const dailyLessons = [
  {
    slug: "fondamentaux-iot",
    title: "Comprendre l'IoT et ses usages",
    competency: "Expliquer ce qu'est un objet connecté et reconnaître les composants d'une chaîne IoT.",
    content: [
      "L'IoT relie des objets physiques à des logiciels, des réseaux et des plateformes de données.",
      "Un système IoT observe le monde réel avec des capteurs, agit avec des actionneurs et transmet des données utiles.",
      "La valeur vient de la mesure, de l'automatisation, de la supervision et de l'aide à la décision."
    ],
    skills: ["Objet connecté", "Capteur", "Actionneur", "Donnée", "Plateforme IoT"],
    resourceSlugs: ["intro-iot", "thingspeak"]
  },
  {
    slug: "capteurs-actionneurs",
    title: "Capteurs, actionneurs et mesures",
    competency: "Choisir un capteur ou un actionneur selon une grandeur physique et un besoin métier.",
    content: [
      "Un capteur transforme une grandeur physique en donnée exploitable: température, humidité, mouvement ou luminosité.",
      "Un actionneur produit une action physique: allumer, ouvrir, fermer, déplacer ou signaler.",
      "Une bonne mesure dépend du calibrage, de la fréquence d'échantillonnage et du contexte d'installation."
    ],
    skills: ["Grandeur physique", "Mesure", "Calibrage", "Action physique", "Qualité de donnée"],
    resourceSlugs: ["arduino", "projet-station-meteo"]
  },
  {
    slug: "prototypage-iot",
    title: "Prototyper avec Arduino, ESP32 et Raspberry Pi",
    competency: "Construire l'architecture minimale d'un prototype IoT fiable et testable.",
    content: [
      "Le prototypage sert à valider rapidement une idée avant de la produire à grande échelle.",
      "Arduino et ESP32 sont adaptés aux capteurs, aux actionneurs et à la connectivité légère.",
      "Raspberry Pi convient mieux aux passerelles, dashboards locaux et traitements plus lourds."
    ],
    skills: ["Microcontrôleur", "Passerelle", "Prototype", "Firmware", "Test terrain"],
    resourceSlugs: ["arduino", "raspberry-pi", "projet-station-meteo"]
  },
  {
    slug: "connectivite-reseaux",
    title: "Connectivité, réseaux et passerelles",
    competency: "Sélectionner une connectivité IoT selon la portée, l'énergie, le débit et le coût.",
    content: [
      "Chaque réseau IoT répond à un compromis: portée, autonomie, débit, latence et coût.",
      "Wi-Fi, Bluetooth, cellulaire, LoRaWAN et Ethernet ne répondent pas aux mêmes contraintes.",
      "Une passerelle relie souvent des objets locaux à Internet ou à une plateforme cloud."
    ],
    skills: ["Wi-Fi", "Bluetooth", "LoRaWAN", "Passerelle", "Latence"],
    resourceSlugs: ["raspberry-pi", "edge-computing"]
  },
  {
    slug: "mqtt-pubsub",
    title: "MQTT et communication publish/subscribe",
    competency: "Décrire le rôle du broker, des topics et du modèle publish/subscribe.",
    content: [
      "MQTT est léger, simple et très utilisé pour transporter des messages IoT.",
      "Les objets publient des messages sur des topics; les applications s'abonnent aux topics utiles.",
      "Le broker découple les producteurs et les consommateurs, ce qui rend le système plus flexible."
    ],
    skills: ["MQTT", "Broker", "Topic", "Publication", "Abonnement"],
    resourceSlugs: ["mqtt", "node-red"]
  },
  {
    slug: "donnees-visualisation",
    title: "Données, API et tableaux de bord",
    competency: "Transformer des mesures IoT en informations lisibles, stockées et actionnables.",
    content: [
      "Une donnée IoT n'a de valeur que si elle est horodatée, contextualisée et exploitable.",
      "Les API, bases de données et tableaux de bord permettent de suivre les mesures et les alertes.",
      "La visualisation aide à détecter les tendances, les anomalies et les décisions à prendre."
    ],
    skills: ["JSON", "API", "Historique", "Tableau de bord", "Alerte"],
    resourceSlugs: ["thingspeak", "node-red", "aws-iot"]
  },
  {
    slug: "securite-production",
    title: "Sécurité, maintenance et production",
    competency: "Identifier les protections indispensables avant de déployer une flotte IoT.",
    content: [
      "Un objet connecté mal protégé devient une porte d'entrée vers les données et le réseau.",
      "Chaque appareil doit avoir une identité forte, des secrets uniques et des mises à jour maîtrisées.",
      "La production exige surveillance, journalisation, mises à jour OTA et plan de réponse aux incidents."
    ],
    skills: ["Identité", "Chiffrement", "OTA", "Journalisation", "Gestion de flotte"],
    resourceSlugs: ["securite-iot", "aws-iot"]
  }
];

const questionBank = [
  ...buildQuestions("fondamentaux-iot", [
    [
      "Que signifie IoT ?",
      ["Internet of Things", "Input of Tools", "Interface of Telecom", "Internal Object Transfer"],
      "A",
      "IoT signifie Internet of Things, c'est-à-dire Internet des objets."
    ],
    [
      "Quelle phrase décrit le mieux un objet connecté ?",
      ["Un objet qui capte, traite ou transmet des données", "Un simple fichier texte", "Un écran sans réseau", "Un câble d'alimentation"],
      "A",
      "Un objet connecté observe ou agit dans le monde réel puis échange des données."
    ],
    [
      "Quel élément mesure une grandeur physique dans un système IoT ?",
      ["Un capteur", "Un compilateur", "Un pare-feu", "Un logo"],
      "A",
      "Un capteur mesure une grandeur comme la température, la lumière ou l'humidité."
    ],
    [
      "Quel composant peut allumer une lampe ou ouvrir une vanne ?",
      ["Un actionneur", "Un index SQL", "Un cache web", "Une police CSS"],
      "A",
      "Un actionneur agit sur le monde physique: moteur, relais, vanne ou LED."
    ],
    [
      "Quel est le rôle principal d'une plateforme IoT ?",
      ["Connecter, gérer et exploiter les données des objets", "Remplacer tous les capteurs", "Dessiner des icônes", "Supprimer les réseaux"],
      "A",
      "Une plateforme IoT centralise souvent l'ingestion, la gestion, les règles et la visualisation."
    ],
    [
      "Pourquoi collecte-t-on des données IoT ?",
      ["Pour surveiller, automatiser et décider", "Pour ralentir le réseau", "Pour éviter toute mesure", "Pour remplacer les utilisateurs"],
      "A",
      "Les données servent à comprendre une situation, déclencher une action ou optimiser un processus."
    ],
    [
      "Quel exemple correspond à un cas d'usage IoT ?",
      ["Suivre la température d'une chambre froide", "Changer la couleur d'un document", "Compresser une archive locale", "Imprimer un manuel"],
      "A",
      "La surveillance de température avec alerte est un cas d'usage IoT classique."
    ],
    [
      "Quelle donnée est importante pour interpréter une mesure IoT ?",
      ["Le moment et le lieu de la mesure", "La police du navigateur", "La couleur du bureau", "Le nom du câble HDMI"],
      "A",
      "Une mesure devient plus utile quand elle est horodatée et contextualisée."
    ],
    [
      "Quelle est une limite fréquente des objets connectés ?",
      ["Autonomie, réseau et sécurité", "Trop de papier", "Trop de touches clavier", "Absence de fichiers PDF"],
      "A",
      "Les contraintes d'énergie, de connectivité et de sécurité guident les choix IoT."
    ],
    [
      "Quel principe résume une chaîne IoT simple ?",
      ["Mesurer, transmettre, traiter, agir", "Dessiner, imprimer, découper, coller", "Compiler, vendre, effacer, oublier", "Archiver, ignorer, bloquer, supprimer"],
      "A",
      "Une chaîne IoT part d'une mesure et aboutit souvent à une décision ou une action."
    ]
  ]),
  ...buildQuestions("capteurs-actionneurs", [
    [
      "Quelle donnée un capteur DHT22 peut-il mesurer ?",
      ["Température et humidité", "Coordonnées bancaires", "Mot de passe Wi-Fi", "Version d'un navigateur"],
      "A",
      "Le DHT22 est souvent utilisé pour mesurer la température et l'humidité."
    ],
    [
      "Quel type de capteur détecte souvent une présence ou un mouvement ?",
      ["PIR", "CSV", "PDF", "PNG"],
      "A",
      "Un capteur PIR détecte les variations infrarouges liées aux mouvements."
    ],
    [
      "À quoi sert le calibrage d'un capteur ?",
      ["À améliorer la justesse des mesures", "À supprimer l'alimentation", "À changer le logo", "À désactiver le réseau"],
      "A",
      "Le calibrage compare ou ajuste un capteur pour réduire les erreurs de mesure."
    ],
    [
      "Quel exemple est un actionneur ?",
      ["Un relais qui commande une pompe", "Une valeur JSON", "Un tableau de bord", "Une adresse email"],
      "A",
      "Un relais agit sur un circuit électrique et peut commander une pompe ou une lampe."
    ],
    [
      "Pourquoi choisir la bonne fréquence d'échantillonnage ?",
      ["Pour capter assez d'informations sans gaspiller l'énergie", "Pour supprimer les données", "Pour bloquer les alertes", "Pour ignorer le contexte"],
      "A",
      "Mesurer trop souvent peut consommer inutilement; mesurer trop rarement peut masquer un événement."
    ],
    [
      "Quelle unité convient à une mesure de température ?",
      ["Degré Celsius", "Kilomètre par heure seulement", "Pixel", "Décibel réseau"],
      "A",
      "La température est souvent exprimée en degrés Celsius dans les projets IoT."
    ],
    [
      "Quel risque existe avec un capteur mal placé ?",
      ["Des mesures faussées", "Un compte Meta bloqué", "Une image plus nette", "Un fichier plus léger"],
      "A",
      "Le lieu d'installation influence fortement la qualité de la mesure."
    ],
    [
      "Quel composant peut mesurer la luminosité ?",
      ["Une photorésistance", "Un câble SATA", "Un lecteur PDF", "Un routeur DNS"],
      "A",
      "Une photorésistance varie selon la lumière reçue."
    ],
    [
      "Pourquoi filtrer certaines mesures ?",
      ["Pour réduire le bruit et les valeurs aberrantes", "Pour effacer le firmware", "Pour changer la police", "Pour couper l'alimentation"],
      "A",
      "Un filtrage simple rend les mesures plus stables et plus exploitables."
    ],
    [
      "Quelle information doit accompagner une mesure fiable ?",
      ["Son unité et son horodatage", "La couleur du câble", "Le nom du designer", "La taille du logo"],
      "A",
      "L'unité et l'horodatage évitent les interprétations ambiguës."
    ]
  ]),
  ...buildQuestions("prototypage-iot", [
    [
      "Quel microcontrôleur est populaire pour les projets IoT Wi-Fi ?",
      ["ESP32", "VHS", "PCIe", "OLED"],
      "A",
      "L'ESP32 intègre Wi-Fi/Bluetooth et reste accessible pour prototyper."
    ],
    [
      "Quand choisir plutôt un Raspberry Pi ?",
      ["Pour une passerelle ou un traitement local plus lourd", "Pour remplacer une résistance", "Pour mesurer sans capteur", "Pour supprimer Linux"],
      "A",
      "Raspberry Pi convient aux tâches plus proches d'un mini-ordinateur."
    ],
    [
      "Quel est l'objectif d'un prototype IoT ?",
      ["Valider rapidement une idée et ses contraintes", "Garantir une production parfaite sans test", "Éviter toute mesure", "Remplacer la documentation"],
      "A",
      "Un prototype permet d'apprendre vite avant d'investir dans une solution définitive."
    ],
    [
      "Que faut-il tester sur un prototype terrain ?",
      ["Alimentation, réseau, capteurs et boîtier", "Uniquement la couleur de l'icône", "Uniquement le nom du projet", "Uniquement le clavier"],
      "A",
      "Un prototype IoT échoue souvent sur des contraintes physiques ou réseau."
    ],
    [
      "Quel rôle joue le firmware ?",
      ["Contrôler le comportement de l'appareil", "Remplacer le réseau mobile", "Créer un compte bancaire", "Effacer les données cloud"],
      "A",
      "Le firmware contient le code embarqué qui pilote capteurs, actionneurs et communication."
    ],
    [
      "Pourquoi journaliser les erreurs pendant un prototype ?",
      ["Pour diagnostiquer les pannes rapidement", "Pour masquer les problèmes", "Pour empêcher les tests", "Pour réduire la mémoire à zéro"],
      "A",
      "Les logs aident à comprendre ce qui se passe sur un appareil."
    ],
    [
      "Quelle pratique facilite le prototypage ?",
      ["Tester par petites étapes", "Tout connecter sans vérifier", "Supprimer les schémas", "Changer de capteur au hasard"],
      "A",
      "Des tests progressifs isolent les erreurs et accélèrent l'apprentissage."
    ],
    [
      "Quel outil est souvent utilisé avec Arduino ?",
      ["L'IDE Arduino", "Un lecteur vidéo uniquement", "Un éditeur d'images seulement", "Un graveur CD"],
      "A",
      "L'IDE Arduino permet d'écrire et téléverser le code vers les cartes compatibles."
    ],
    [
      "Pourquoi prévoir une alimentation stable ?",
      ["Pour éviter des redémarrages et mesures incohérentes", "Pour augmenter les erreurs", "Pour bloquer les capteurs", "Pour supprimer le code"],
      "A",
      "Une alimentation instable produit des comportements difficiles à diagnostiquer."
    ],
    [
      "Quel livrable utile accompagne un prototype ?",
      ["Un schéma de câblage et une procédure de test", "Une image décorative seulement", "Une liste sans version", "Un secret publié"],
      "A",
      "La documentation rend le prototype reproductible et vérifiable."
    ]
  ]),
  ...buildQuestions("connectivite-reseaux", [
    [
      "Quel réseau est adapté aux objets très basse consommation et longue portée ?",
      ["LoRaWAN", "HDMI", "SATA", "VGA"],
      "A",
      "LoRaWAN vise les communications longue portée avec faible consommation."
    ],
    [
      "Quelle mesure correspond à la latence ?",
      ["Le temps de réaction entre une action et une réponse", "La couleur d'un capteur", "Le prix d'un câble", "Le nombre de vis"],
      "A",
      "La latence mesure le délai de réaction d'un système."
    ],
    [
      "Quel rôle joue une passerelle IoT ?",
      ["Relier des objets au réseau ou au cloud", "Dessiner des logos", "Compresser des photos seulement", "Remplacer tous les capteurs"],
      "A",
      "Une passerelle connecte des objets locaux à d'autres réseaux ou plateformes."
    ],
    [
      "Quand le Wi-Fi est-il souvent pertinent ?",
      ["Quand l'objet a assez d'énergie et besoin d'un bon débit", "Quand aucune alimentation n'existe", "Quand la portée doit être de plusieurs kilomètres sans antenne", "Quand il faut éviter Internet"],
      "A",
      "Le Wi-Fi offre un débit utile mais consomme plus que certains réseaux IoT basse consommation."
    ],
    [
      "Quel critère est essentiel pour un objet sur batterie ?",
      ["La consommation énergétique", "La taille du logo", "Le nombre d'onglets ouverts", "La couleur du tableau"],
      "A",
      "L'autonomie dépend directement de la consommation de l'appareil et de sa connectivité."
    ],
    [
      "Pourquoi l'edge computing est utile en IoT ?",
      ["Pour rapprocher le traitement des données des objets", "Pour supprimer tous les capteurs", "Pour remplacer l'électricité", "Pour empêcher toute connexion réseau"],
      "A",
      "Traiter près de la source réduit la latence et limite les données envoyées au cloud."
    ],
    [
      "Quel choix convient à une communication très courte distance ?",
      ["Bluetooth Low Energy", "VGA", "SCSI", "SMTP"],
      "A",
      "Bluetooth Low Energy est courant pour des objets proches avec faible consommation."
    ],
    [
      "Pourquoi gérer les coupures réseau ?",
      ["Parce qu'un objet terrain peut perdre temporairement sa connexion", "Parce que les capteurs disparaissent", "Parce que les données n'ont plus d'unité", "Parce que le cloud n'existe pas"],
      "A",
      "Les objets doivent souvent tamponner ou réessayer l'envoi des mesures."
    ],
    [
      "Quelle est une bonne stratégie si le réseau tombe temporairement ?",
      ["Mettre les données en file d'attente localement", "Perdre toutes les mesures", "Désactiver le capteur pour toujours", "Changer la question du quiz"],
      "A",
      "Un tampon local permet de renvoyer les mesures quand la connexion revient."
    ],
    [
      "Quel compromis doit guider le choix réseau ?",
      ["Portée, débit, énergie, coût et disponibilité", "Police, couleur et animation", "Nom du fichier uniquement", "Nombre de boutons du menu"],
      "A",
      "La connectivité IoT se choisit selon plusieurs contraintes du terrain."
    ]
  ]),
  ...buildQuestions("mqtt-pubsub", [
    [
      "Quel protocole est souvent utilisé pour envoyer des messages IoT légers ?",
      ["SMTP", "MQTT", "FTP", "POP3"],
      "B",
      "MQTT est conçu pour des messages légers entre objets et serveurs."
    ],
    [
      "Dans MQTT, comment appelle-t-on le serveur qui distribue les messages ?",
      ["Broker", "Compiler", "Crawler", "Renderer"],
      "A",
      "Le broker reçoit les publications et les distribue aux clients abonnés."
    ],
    [
      "Quel identifiant sépare souvent les flux de données MQTT ?",
      ["Topic", "Cookie", "Pixel", "Font"],
      "A",
      "Les clients publient et s'abonnent à des topics MQTT."
    ],
    [
      "Quel avantage offre la communication publish/subscribe ?",
      ["Découpler producteurs et consommateurs de messages", "Forcer un seul utilisateur", "Interdire les capteurs", "Remplacer la mémoire"],
      "A",
      "Le pub/sub évite que chaque émetteur connaisse directement chaque récepteur."
    ],
    [
      "Qui publie généralement une mesure MQTT ?",
      ["Un appareil ou une passerelle", "Un fichier image", "Un câble HDMI", "Une police CSS"],
      "A",
      "L'appareil ou la passerelle publie les mesures vers le broker."
    ],
    [
      "Qui reçoit les messages d'un topic MQTT ?",
      ["Les clients abonnés à ce topic", "Tous les fichiers du disque", "Uniquement le clavier", "Les écrans éteints"],
      "A",
      "Un client reçoit les messages des topics auxquels il est abonné."
    ],
    [
      "Pourquoi structurer les topics MQTT ?",
      ["Pour organiser les flux par site, appareil ou mesure", "Pour cacher toutes les données", "Pour empêcher les abonnements", "Pour supprimer le broker"],
      "A",
      "Une structure claire rend les messages plus faciles à router et exploiter."
    ],
    [
      "Quel exemple de topic est lisible ?",
      ["site1/salle2/temperature", "////", "motdepasse", "image.png"],
      "A",
      "Un topic hiérarchique décrit le site, l'équipement ou la mesure."
    ],
    [
      "Pourquoi MQTT est apprécié en IoT ?",
      ["Il est léger et adapté aux réseaux contraints", "Il oblige à envoyer des vidéos lourdes", "Il supprime la sécurité", "Il remplace tous les capteurs"],
      "A",
      "MQTT limite l'overhead et fonctionne bien pour de petits messages fréquents."
    ],
    [
      "Quel point doit être sécurisé avec MQTT ?",
      ["L'authentification et le chiffrement de la connexion", "La couleur du dashboard", "Le nom de la police", "Le nombre d'images"],
      "A",
      "MQTT doit être protégé par identité, droits d'accès et chiffrement quand nécessaire."
    ]
  ]),
  ...buildQuestions("donnees-visualisation", [
    [
      "Quel format de données est souvent utilisé dans les API IoT ?",
      ["JSON", "PSD", "MP3", "AVI"],
      "A",
      "JSON est lisible, compact et courant dans les API web."
    ],
    [
      "Quel protocole web est souvent utilisé pour une API REST IoT ?",
      ["HTTP", "MIDI", "HDMI", "SCSI"],
      "A",
      "HTTP est courant pour exposer ou consommer des API REST."
    ],
    [
      "Quel est l'objectif principal d'un tableau de bord IoT ?",
      ["Visualiser les données et alertes", "Compiler le noyau du téléphone", "Supprimer les bases de données", "Remplacer les capteurs"],
      "A",
      "Un dashboard aide à suivre l'état, les mesures et les alertes."
    ],
    [
      "Pourquoi stocker l'historique des mesures IoT ?",
      ["Pour analyser les tendances et anomalies", "Pour rendre les capteurs inutiles", "Pour bloquer les alertes", "Pour effacer les tableaux de bord"],
      "A",
      "L'historique aide à comprendre l'évolution et à détecter des comportements anormaux."
    ],
    [
      "Quel concept envoie une alerte quand une valeur dépasse un seuil ?",
      ["Règle d'alerte", "Police de caractère", "Capture d'écran", "Compression vidéo"],
      "A",
      "Une règle d'alerte compare les mesures à des seuils et déclenche une action."
    ],
    [
      "Quel service peut recevoir des données d'un appareil et les stocker dans le cloud ?",
      ["Une plateforme IoT", "Un câble HDMI", "Un clavier mécanique", "Un fichier image"],
      "A",
      "Une plateforme IoT gère ingestion, stockage, règles et visualisation."
    ],
    [
      "Quel outil permet de construire des flux IoT visuellement ?",
      ["Node-RED", "Notepad uniquement", "VLC", "Paint"],
      "A",
      "Node-RED facilite l'orchestration de flux IoT avec une interface visuelle."
    ],
    [
      "Pourquoi nettoyer les données avant analyse ?",
      ["Pour réduire erreurs, doublons et valeurs incohérentes", "Pour supprimer les capteurs", "Pour bloquer les graphiques", "Pour éviter les horodatages"],
      "A",
      "Des données propres rendent les alertes et décisions plus fiables."
    ],
    [
      "Quelle information rend une mesure exploitable dans le temps ?",
      ["Un horodatage", "Une icône décorative", "Un fichier audio", "Une couleur aléatoire"],
      "A",
      "L'horodatage permet de classer les mesures et d'observer leur évolution."
    ],
    [
      "Quelle visualisation convient à une température sur plusieurs heures ?",
      ["Une courbe temporelle", "Une image fixe sans axe", "Une archive ZIP", "Une police d'écriture"],
      "A",
      "Une courbe montre facilement les variations et tendances d'une mesure."
    ]
  ]),
  ...buildQuestions("securite-production", [
    [
      "Quelle bonne pratique sécurise un appareil IoT dès le départ ?",
      ["Changer les mots de passe par défaut", "Désactiver toutes les mises à jour", "Partager le token dans le code public", "Utiliser le même secret partout"],
      "A",
      "Les identifiants par défaut sont une cause fréquente de compromission."
    ],
    [
      "Quel risque est typique pour une flotte d'objets mal gérée ?",
      ["Des appareils non mis à jour et vulnérables", "Des écrans trop lumineux uniquement", "Des images trop nettes", "Des polices trop petites"],
      "A",
      "Les mises à jour et le suivi de flotte sont essentiels en sécurité IoT."
    ],
    [
      "Que faut-il faire avant de publier un objet connecté en production ?",
      ["Tester sécurité, fiabilité et mises à jour", "Supprimer tous les logs", "Partager le secret API publiquement", "Ignorer les erreurs réseau"],
      "A",
      "La production exige tests, surveillance, sécurité et plan de mise à jour."
    ],
    [
      "Quel élément est indispensable pour vérifier l'identité d'un appareil ?",
      ["Un certificat ou secret unique", "Un fond d'écran", "Une couleur de boîtier", "Une taille d'écran"],
      "A",
      "Chaque objet doit avoir une identité forte: certificat, clé ou secret unique."
    ],
    [
      "Que signifie OTA dans le contexte IoT ?",
      ["Over-The-Air update", "Only Text Application", "Open Table Audio", "Offline Token Access"],
      "A",
      "OTA désigne les mises à jour à distance, sans intervention physique."
    ],
    [
      "Pourquoi éviter de partager un token dans le code public ?",
      ["Parce qu'il peut donner accès au système", "Parce qu'il améliore la sécurité", "Parce qu'il remplace les tests", "Parce qu'il bloque les capteurs"],
      "A",
      "Un token exposé peut être réutilisé par une personne non autorisée."
    ],
    [
      "Quel mécanisme protège les échanges réseau ?",
      ["Le chiffrement", "La couleur du câble", "La taille de l'écran", "Le nom du fichier"],
      "A",
      "Le chiffrement réduit le risque d'écoute ou de modification des données en transit."
    ],
    [
      "Pourquoi segmenter le réseau des objets connectés ?",
      ["Pour limiter l'impact d'une compromission", "Pour supprimer les mises à jour", "Pour rendre les capteurs invisibles", "Pour bloquer tous les logs"],
      "A",
      "La segmentation empêche un incident IoT de se propager facilement au reste du système."
    ],
    [
      "Quel est le premier réflexe pour diagnostiquer un objet qui ne publie plus ?",
      ["Vérifier alimentation, réseau et logs", "Changer la marque du stylo", "Effacer le classement", "Imprimer le code"],
      "A",
      "Les pannes IoT viennent souvent de l'alimentation, du réseau ou d'erreurs visibles dans les logs."
    ],
    [
      "Pourquoi superviser une flotte IoT en production ?",
      ["Pour détecter pannes, dérives et incidents", "Pour ignorer les alertes", "Pour cacher les appareils", "Pour éviter toute maintenance"],
      "A",
      "La supervision permet de réagir avant qu'une panne ou une faille ne devienne critique."
    ]
  ])
];

function buildQuestions(lessonSlug, entries) {
  return entries.map(([question, options, correct, explanation]) => ({
    lessonSlug,
    question,
    options: {
      A: options[0],
      B: options[1],
      C: options[2],
      D: options[3]
    },
    correct,
    explanation
  }));
}

function getLessonForDate(dateString) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  const start = new Date("2026-06-01T00:00:00.000Z");
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  const index = positiveModulo(diffDays, dailyLessons.length);
  return dailyLessons[index];
}

function selectQuestionsForDate(dateString, count = DAILY_QUIZ_QUESTION_COUNT) {
  const lesson = getLessonForDate(dateString);
  const lessonQuestions = questionBank.filter((item) => item.lessonSlug === lesson.slug);
  const fallbackQuestions = questionBank.filter((item) => item.lessonSlug !== lesson.slug);
  const pool = lessonQuestions.length >= count ? lessonQuestions : [...lessonQuestions, ...fallbackQuestions];
  const daySeed = dateString
    .replace(/\D/g, "")
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);

  const selected = [];
  for (let index = 0; index < count; index += 1) {
    selected.push(pool[(daySeed + index) % pool.length]);
  }
  return selected;
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

module.exports = {
  DAILY_QUIZ_QUESTION_COUNT,
  dailyLessons,
  getLessonForDate,
  questionBank,
  resources,
  selectQuestionsForDate
};
