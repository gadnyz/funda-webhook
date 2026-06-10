const resources = [
  {
    slug: "intro-iot",
    topic: "iot",
    title: "Comprendre l'IoT",
    level: "debutant",
    type: "cours",
    description: "Les bases des objets connectes, des capteurs, des donnees et des usages.",
    url: "https://www.ibm.com/topics/internet-of-things",
    sortOrder: 10
  },
  {
    slug: "arduino",
    topic: "iot",
    title: "Arduino",
    level: "debutant",
    type: "outil",
    description: "Une plateforme simple pour creer des prototypes avec capteurs et actionneurs.",
    url: "https://docs.arduino.cc/",
    sortOrder: 20
  },
  {
    slug: "raspberry-pi",
    topic: "iot",
    title: "Raspberry Pi",
    level: "debutant",
    type: "outil",
    description: "Un mini-ordinateur utile pour les passerelles, dashboards et projets IoT.",
    url: "https://www.raspberrypi.com/documentation/",
    sortOrder: 30
  },
  {
    slug: "mqtt",
    topic: "iot",
    title: "MQTT",
    level: "intermediaire",
    type: "cours",
    description: "Le protocole leger le plus courant pour publier et recevoir des donnees IoT.",
    url: "https://mqtt.org/getting-started/",
    sortOrder: 40
  },
  {
    slug: "node-red",
    topic: "iot",
    title: "Node-RED",
    level: "intermediaire",
    type: "outil",
    description: "Un outil visuel pour connecter API, capteurs, MQTT et tableaux de bord.",
    url: "https://nodered.org/docs/",
    sortOrder: 50
  },
  {
    slug: "edge-computing",
    topic: "iot",
    title: "Edge Computing",
    level: "intermediaire",
    type: "cours",
    description: "Traiter une partie des donnees proche des objets pour reduire latence et couts.",
    url: "https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/",
    sortOrder: 60
  },
  {
    slug: "securite-iot",
    topic: "iot",
    title: "Securite IoT",
    level: "avance",
    type: "cours",
    description: "Identite, chiffrement, mises a jour, segmentation reseau et reduction des risques.",
    url: "https://www.cisa.gov/resources-tools/resources/secure-by-design",
    sortOrder: 70
  },
  {
    slug: "thingspeak",
    topic: "iot",
    title: "ThingSpeak",
    level: "debutant",
    type: "plateforme",
    description: "Plateforme pratique pour collecter et visualiser des donnees de capteurs.",
    url: "https://thingspeak.com/pages/learn_more",
    sortOrder: 80
  },
  {
    slug: "aws-iot",
    topic: "iot",
    title: "AWS IoT",
    level: "avance",
    type: "plateforme",
    description: "Services cloud pour connecter, securiser et analyser des flottes d'objets.",
    url: "https://docs.aws.amazon.com/iot/",
    sortOrder: 90
  },
  {
    slug: "projet-station-meteo",
    topic: "iot",
    title: "Projet meteo",
    level: "debutant",
    type: "projet",
    description: "Mini-projet: mesurer temperature et humidite, puis publier les donnees.",
    url: "https://randomnerdtutorials.com/esp32-dht11-dht22-temperature-humidity-web-server-arduino-ide/",
    sortOrder: 100
  }
];

const questionBank = [
  {
    question: "Que signifie IoT ?",
    options: {
      A: "Internet of Things",
      B: "Input of Tools",
      C: "Interface of Telecom",
      D: "Internal Object Transfer"
    },
    correct: "A",
    explanation: "IoT signifie Internet of Things, c'est-a-dire Internet des objets."
  },
  {
    question: "Quel element mesure une grandeur physique dans un systeme IoT ?",
    options: {
      A: "Un capteur",
      B: "Un routeur DNS",
      C: "Un compilateur",
      D: "Un pare-feu"
    },
    correct: "A",
    explanation: "Un capteur mesure une grandeur comme la temperature, la lumiere ou l'humidite."
  },
  {
    question: "Quel protocole est souvent utilise pour envoyer des messages IoT legers ?",
    options: {
      A: "SMTP",
      B: "MQTT",
      C: "FTP",
      D: "POP3"
    },
    correct: "B",
    explanation: "MQTT est concu pour des messages legers entre objets et serveurs."
  },
  {
    question: "Dans MQTT, comment appelle-t-on le serveur qui distribue les messages ?",
    options: {
      A: "Broker",
      B: "Compiler",
      C: "Crawler",
      D: "Renderer"
    },
    correct: "A",
    explanation: "Le broker recoit les publications et les distribue aux clients abonnes."
  },
  {
    question: "Quel composant peut allumer une lampe ou ouvrir une vanne ?",
    options: {
      A: "Un actionneur",
      B: "Un index SQL",
      C: "Un cache web",
      D: "Une police CSS"
    },
    correct: "A",
    explanation: "Un actionneur agit sur le monde physique: moteur, relais, vanne, LED."
  },
  {
    question: "Pourquoi l'edge computing est utile en IoT ?",
    options: {
      A: "Pour rapprocher le traitement des donnees des objets",
      B: "Pour supprimer tous les capteurs",
      C: "Pour remplacer l'electricite",
      D: "Pour empecher toute connexion reseau"
    },
    correct: "A",
    explanation: "Traiter pres de la source reduit la latence et limite les donnees envoyees au cloud."
  },
  {
    question: "Quel reseau est adapte aux objets tres basse consommation et longue portee ?",
    options: {
      A: "LoRaWAN",
      B: "HDMI",
      C: "SATA",
      D: "VGA"
    },
    correct: "A",
    explanation: "LoRaWAN vise les communications longue portee avec faible consommation."
  },
  {
    question: "Quel identifiant permet souvent de separer les flux de donnees MQTT ?",
    options: {
      A: "Topic",
      B: "Cookie",
      C: "Pixel",
      D: "Font"
    },
    correct: "A",
    explanation: "Les clients publient et s'abonnent a des topics MQTT."
  },
  {
    question: "Quelle bonne pratique securise un appareil IoT des le depart ?",
    options: {
      A: "Changer les mots de passe par defaut",
      B: "Desactiver toutes les mises a jour",
      C: "Partager le token dans le code public",
      D: "Utiliser le meme secret partout"
    },
    correct: "A",
    explanation: "Les identifiants par defaut sont une cause frequente de compromission."
  },
  {
    question: "Quel format de donnees est souvent utilise dans les API IoT ?",
    options: {
      A: "JSON",
      B: "PSD",
      C: "MP3",
      D: "AVI"
    },
    correct: "A",
    explanation: "JSON est lisible, compact et courant dans les API web."
  },
  {
    question: "Quel role joue une passerelle IoT ?",
    options: {
      A: "Relier des objets au reseau ou au cloud",
      B: "Dessiner des logos",
      C: "Compresser des photos seulement",
      D: "Remplacer tous les capteurs"
    },
    correct: "A",
    explanation: "Une passerelle connecte des objets locaux a d'autres reseaux ou plateformes."
  },
  {
    question: "Quel microcontroleur est populaire pour les projets IoT Wi-Fi ?",
    options: {
      A: "ESP32",
      B: "VHS",
      C: "PCIe",
      D: "OLED"
    },
    correct: "A",
    explanation: "L'ESP32 integre Wi-Fi/Bluetooth et reste accessible pour prototyper."
  },
  {
    question: "Quelle mesure correspond a la latence ?",
    options: {
      A: "Le temps de reaction entre une action et une reponse",
      B: "La couleur d'un capteur",
      C: "Le prix d'un cable",
      D: "Le nombre de vis"
    },
    correct: "A",
    explanation: "La latence mesure le delai de reaction d'un systeme."
  },
  {
    question: "Quel risque est typique pour une flotte d'objets mal geree ?",
    options: {
      A: "Des appareils non mis a jour et vulnerables",
      B: "Des ecrans trop lumineux uniquement",
      C: "Des images trop nettes",
      D: "Des polices trop petites"
    },
    correct: "A",
    explanation: "Les mises a jour et le suivi de flotte sont essentiels en securite IoT."
  },
  {
    question: "Quelle donnee un capteur DHT22 peut-il mesurer ?",
    options: {
      A: "Temperature et humidite",
      B: "Coordonnees bancaires",
      C: "Mot de passe Wi-Fi",
      D: "Version d'un navigateur"
    },
    correct: "A",
    explanation: "Le DHT22 est souvent utilise pour mesurer temperature et humidite."
  },
  {
    question: "Quel protocole web est souvent utilise pour une API REST IoT ?",
    options: {
      A: "HTTP",
      B: "MIDI",
      C: "HDMI",
      D: "SCSI"
    },
    correct: "A",
    explanation: "HTTP est courant pour exposer ou consommer des API REST."
  },
  {
    question: "Quel est l'objectif principal d'un tableau de bord IoT ?",
    options: {
      A: "Visualiser les donnees et alertes",
      B: "Compiler le noyau du telephone",
      C: "Supprimer les bases de donnees",
      D: "Remplacer les capteurs"
    },
    correct: "A",
    explanation: "Un dashboard aide a suivre l'etat, les mesures et les alertes."
  },
  {
    question: "Que faut-il faire avant de publier un objet connecte en production ?",
    options: {
      A: "Tester securite, fiabilite et mises a jour",
      B: "Supprimer tous les logs",
      C: "Partager le secret API publiquement",
      D: "Ignorer les erreurs reseau"
    },
    correct: "A",
    explanation: "La production exige tests, surveillance, securite et plan de mise a jour."
  },
  {
    question: "Quel service peut recevoir des donnees d'un appareil et les stocker dans le cloud ?",
    options: {
      A: "Une plateforme IoT",
      B: "Un cable HDMI",
      C: "Un clavier mecanique",
      D: "Un fichier image"
    },
    correct: "A",
    explanation: "Une plateforme IoT gere ingestion, stockage, regles et visualisation."
  },
  {
    question: "Pourquoi limiter la consommation energetique d'un objet IoT ?",
    options: {
      A: "Pour prolonger l'autonomie sur batterie",
      B: "Pour augmenter la taille des messages",
      C: "Pour supprimer la securite",
      D: "Pour ralentir volontairement le reseau"
    },
    correct: "A",
    explanation: "Beaucoup d'objets fonctionnent sur batterie et doivent durer longtemps."
  },
  {
    question: "Quel concept permet d'envoyer une alerte quand une valeur depasse un seuil ?",
    options: {
      A: "Regle d'alerte",
      B: "Police de caractere",
      C: "Capture d'ecran",
      D: "Compression video"
    },
    correct: "A",
    explanation: "Une regle d'alerte compare les mesures a des seuils et declenche une action."
  },
  {
    question: "Quel type de donnees peut envoyer un capteur GPS ?",
    options: {
      A: "Latitude et longitude",
      B: "Mot de passe admin",
      C: "Fichier CSS",
      D: "Adresse MAC du cloud"
    },
    correct: "A",
    explanation: "Un GPS fournit une position, souvent latitude et longitude."
  },
  {
    question: "Quel avantage offre la communication publish/subscribe ?",
    options: {
      A: "Decoupler producteurs et consommateurs de messages",
      B: "Forcer un seul utilisateur",
      C: "Interdire les capteurs",
      D: "Remplacer la memoire"
    },
    correct: "A",
    explanation: "Le pub/sub evite que chaque emetteur connaisse directement chaque recepteur."
  },
  {
    question: "Quel element est indispensable pour verifier l'identite d'un appareil ?",
    options: {
      A: "Un certificat ou secret unique",
      B: "Un fond d'ecran",
      C: "Une couleur de boitier",
      D: "Une taille d'ecran"
    },
    correct: "A",
    explanation: "Chaque objet doit avoir une identite forte: certificat, cle ou secret unique."
  },
  {
    question: "Que signifie OTA dans le contexte IoT ?",
    options: {
      A: "Over-The-Air update",
      B: "Only Text Application",
      C: "Open Table Audio",
      D: "Offline Token Access"
    },
    correct: "A",
    explanation: "OTA designe les mises a jour a distance, sans intervention physique."
  },
  {
    question: "Pourquoi stocker l'historique des mesures IoT ?",
    options: {
      A: "Pour analyser les tendances et anomalies",
      B: "Pour rendre les capteurs inutiles",
      C: "Pour bloquer les alertes",
      D: "Pour effacer les tableaux de bord"
    },
    correct: "A",
    explanation: "L'historique aide a comprendre l'evolution et detecter des comportements anormaux."
  },
  {
    question: "Quel outil permet de construire des flux IoT visuellement ?",
    options: {
      A: "Node-RED",
      B: "Notepad uniquement",
      C: "VLC",
      D: "Paint"
    },
    correct: "A",
    explanation: "Node-RED facilite l'orchestration de flux IoT avec une interface visuelle."
  },
  {
    question: "Quelle est une bonne strategie si le reseau tombe temporairement ?",
    options: {
      A: "Mettre les donnees en file d'attente localement",
      B: "Perdre toutes les mesures",
      C: "Desactiver le capteur pour toujours",
      D: "Changer la question du quiz"
    },
    correct: "A",
    explanation: "Un tampon local permet de renvoyer les mesures quand la connexion revient."
  },
  {
    question: "Quel type de capteur detecte souvent une presence ou un mouvement ?",
    options: {
      A: "PIR",
      B: "CSV",
      C: "PDF",
      D: "PNG"
    },
    correct: "A",
    explanation: "Un capteur PIR detecte les variations infrarouges liees aux mouvements."
  },
  {
    question: "Quel est le premier reflexe pour diagnostiquer un objet qui ne publie plus ?",
    options: {
      A: "Verifier alimentation, reseau et logs",
      B: "Changer la marque du stylo",
      C: "Effacer le classement",
      D: "Imprimer le code"
    },
    correct: "A",
    explanation: "Les pannes IoT viennent souvent de l'alimentation, du reseau ou d'erreurs visibles dans les logs."
  }
];

function selectQuestionsForDate(dateString, count = 20) {
  const daySeed = dateString
    .replace(/\D/g, "")
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
  const selected = [];
  for (let index = 0; index < count; index += 1) {
    selected.push(questionBank[(daySeed + index * 7) % questionBank.length]);
  }
  return selected;
}

module.exports = {
  questionBank,
  resources,
  selectQuestionsForDate
};
