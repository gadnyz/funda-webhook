# Funda WhatsApp MVP

Funda est un assistant WhatsApp Business d'apprentissage en ligne. Ce MVP se concentre sur la thématique IoT avec:

- webhook WhatsApp Cloud API complet;
- accueil Funda en français;
- menu interactif WhatsApp;
- leçon du jour avec compétence à acquérir;
- ressources IoT;
- quiz quotidien de 10 questions liées à la leçon;
- score hebdomadaire;
- classement public limité au top 5;
- commandes `STOP` et `START`;
- dashboard admin;
- templates WhatsApp à préparer dans Meta;
- sauvegarde SQLite;
- monitoring des erreurs;
- stockage SQLite;
- mode dry-run pour tester sans envoyer de vrais messages.

## Prerequis

- Node.js `>= 24.0.0`
- Un WhatsApp Business Account configure dans Meta
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- Une URL publique pour le webhook, par exemple via ngrok en local

Ce projet n'utilise pas de dépendances npm externes. SQLite est géré via `node:sqlite`.

## Installation

```powershell
Copy-Item .env.example .env
```

Remplir ensuite `.env`:

```env
PORT=3000
HOST=0.0.0.0
APP_ENV=development
APP_TIME_ZONE=Africa/Cairo

WHATSAPP_VERIFY_TOKEN=un-token-secret-a-copier-dans-meta
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_APP_SECRET=...
WHATSAPP_API_VERSION=v25.0

META_GRAPH_API_VERSION=v25.0
META_APP_ID=123456789
META_BUSINESS_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
WHATSAPP_TEST_RECIPIENT_WA_ID=225XXXXXXXXXX

DATABASE_PATH=./data/funda.sqlite
BACKUP_DIR=./data/backups
ADMIN_TOKEN=un-token-admin-long
ADMIN_PUBLIC=false
```

Lancer le serveur:

```powershell
npm run start
```

Vérifier:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

En `development`, si le fichier SQLite configuré est indisponible, le serveur bascule vers une base temporaire et affiche un avertissement. En `production`, cette erreur reste bloquante pour éviter une perte de données silencieuse.

## Configuration Meta WhatsApp

Dans Meta for Developers:

1. Aller dans l'application Meta liee a WhatsApp Business.
2. Ouvrir WhatsApp > Configuration API ou Webhooks.
3. Ajouter l'URL de callback:

```text
https://votre-domaine.com/webhook
```

En local avec ngrok:

```powershell
ngrok http 3000
```

Puis utiliser:

```text
https://xxxx.ngrok-free.app/webhook
```

Si ngrok ne s'installe pas ou si Chocolatey échoue au téléchargement, utiliser le tunnel de secours:

```powershell
npm run tunnel
```

La commande affiche une URL HTTPS du type:

```text
https://xxxxx.loca.lt
```

Dans Meta, utiliser:

```text
https://xxxxx.loca.lt/webhook
```

4. Copier dans Meta le meme `WHATSAPP_VERIFY_TOKEN` que dans `.env`.
5. S'abonner au champ WhatsApp `messages`.
6. Envoyer un message de test au numéro WhatsApp Business.

## Routes

```text
GET  /health
GET  /webhook
POST /webhook
GET  /admin
GET  /admin/api/overview
GET  /admin/api/users
GET  /admin/api/messages
GET  /admin/api/errors
GET  /admin/api/resources
POST /admin/api/resources
GET  /admin/api/templates
POST /admin/api/templates
GET  /admin/api/meta-tests
POST /admin/api/meta-tests/:testId
POST /admin/api/backup
GET  /admin/leaderboard
GET  /admin/stats
```

`GET /webhook` sert a la verification Meta avec:

- `hub.mode`
- `hub.verify_token`
- `hub.challenge`

`POST /webhook` recoit:

- messages entrants;
- réponses à boutons/listes;
- statuts des messages;
- erreurs et métadonnées WhatsApp.

Les routes `/admin/*` sont publiques seulement si `ADMIN_PUBLIC=true` en development. En production, elles exigent `ADMIN_TOKEN`, soit avec:

```text
?token=VOTRE_ADMIN_TOKEN
```

ou l'en-tete:

```text
x-admin-token: VOTRE_ADMIN_TOKEN
```

## Dashboard Admin

Ouvrir:

```text
http://localhost:3000/admin
```

En production:

```text
https://votre-domaine.com/admin?token=VOTRE_ADMIN_TOKEN
```

Le dashboard permet de voir:

- utilisateurs récents;
- messages entrants/sortants;
- top 5 hebdomadaire;
- quiz récents;
- templates WhatsApp;
- erreurs webhook et statuts échoués;
- création de backups SQLite.

Il permet aussi d'ajouter ou modifier les ressources IoT et les templates internes de suivi.

## Tests Meta Review Avant Publication

Le dashboard contient une section `Tests Meta Review` pour déclencher les appels API que Meta affiche dans la page de publication:

- `whatsapp_business_manage_events`: lecture des apps abonnées au WABA;
- `manage_app_solution`: lecture de l'application Meta avec le token système;
- `email`: lecture du champ email avec un token utilisateur Facebook;
- `public_profile`: lecture du profil public avec un token utilisateur Facebook;
- `business_management`: lecture des Business Managers accessibles;
- `whatsapp_business_management`: lecture des numéros du WABA;
- `whatsapp_business_messaging`: envoi optionnel d'un vrai message de test.

Variables utiles dans `.env`:

```env
META_GRAPH_API_VERSION=v25.0
META_APP_ID=...
META_BUSINESS_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_TEST_RECIPIENT_WA_ID=...
```

`business_management`, `whatsapp_business_management`, `whatsapp_business_manage_events`, `manage_app_solution` et `whatsapp_business_messaging` utilisent `WHATSAPP_ACCESS_TOKEN`, donc le token permanent de l'utilisateur système.

`email` et `public_profile` utilisent un token utilisateur Facebook, pas le token système WhatsApp. Pour éviter de le stocker, colle-le directement dans le champ `Token utilisateur Facebook` du dashboard, lance les deux tests, puis ferme la page. Si tu veux le préconfigurer temporairement, utilise:

```env
FACEBOOK_TEST_USER_ACCESS_TOKEN=...
```

Après modification de `.env`, redémarrer le backend:

```powershell
npm run start
```

## Comportement WhatsApp

Premier contact:

```text
Bonjour, je suis Funda, votre assistant d'apprentissage en ligne.
Funda vous aide à apprendre simplement et facilement grâce à des leçons courtes, des ressources et des quiz.
Ce mois-ci, nous apprenons l'IoT: objets connectés, capteurs, MQTT, sécurité et projets pratiques.
```

Menu principal:

- Leçon du jour
- Quiz du jour
- Ressources IoT
- Mon score
- Classement top 5
- Aide

Parcours quotidien:

1. Leçon du jour: titre, compétence à acquérir, contenu court et ressources.
2. Ressources: liens par défaut, ressources personnalisées ajoutées dans l'admin et autres ressources utiles.
3. Quiz du jour: 10 questions liées à la leçon apprise.

WhatsApp ne permet que 3 boutons rapides par message, donc les réponses A/B/C/D sont envoyées sous forme de liste interactive.

Commandes utiles:

- `MENU`: afficher le menu;
- `LEÇON`: recevoir la leçon du jour;
- `QUIZ`: lancer ou reprendre le quiz du jour;
- `SCORE`: voir son score et son niveau;
- `CLASSEMENT`: voir le top 5;
- `STOP`: se désabonner;
- `START`: reprendre Funda.

## Scoring

Score hebdomadaire:

- `+1` point par bonne réponse;
- `+5` points par quiz quotidien terminé;
- `+10` points bonus si l'utilisateur participe au moins 5 jours dans la semaine.

Le classement public affiche uniquement les 5 meilleurs utilisateurs de la semaine. L'utilisateur voit toujours son propre score.

Funda attribue aussi un niveau simple:

- `débutant`;
- `intermédiaire`;
- `avancé`.

Des badges sont calculés selon la régularité, les quiz terminés et les bonnes réponses.

## Templates WhatsApp

Le code contient les templates internes suivants comme base de travail:

- `funda_lecon_du_jour`;
- `funda_quiz_du_jour`;
- `funda_score_hebdo`.

Ils doivent être créés et approuvés dans Meta avant tout envoi hors fenêtre WhatsApp de 24h. Le dashboard sert à suivre leur nom, statut et texte, mais l'approbation reste faite dans Meta.

## Sauvegarde

Backup manuel:

```powershell
npm run backup
```

Ou depuis le dashboard:

```text
POST /admin/api/backup
```

Les backups sont créés dans `BACKUP_DIR`.

## Test Local Sans WhatsApp

Si `WHATSAPP_ACCESS_TOKEN` ou `WHATSAPP_PHONE_NUMBER_ID` manquent, le projet passe automatiquement en dry-run: les messages sortants sont enregistrés en base au lieu d'être envoyés à Meta.

Simulation:

```powershell
npm run simulate
```

Tests:

```powershell
npm test
```

La simulation force le dry-run, meme si `.env` contient de vrais tokens.

## Deploiement

Fichiers inclus:

```text
Dockerfile
render.yaml
Procfile
.dockerignore
```

Render avec disque persistant:

1. Pousser le repo.
2. Créer un Web Service Docker.
3. Monter un disque persistant sur `/app/data`.
4. Configurer les variables:
   - `APP_ENV=production`
   - `DATABASE_PATH=/app/data/funda.sqlite`
   - `BACKUP_DIR=/app/data/backups`
   - `ADMIN_PUBLIC=false`
   - `ADMIN_TOKEN`
   - `WHATSAPP_VERIFY_TOKEN`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_APP_SECRET`

Railway/VPS: utiliser les memes variables et garder un volume persistant pour SQLite.

## Fichiers Principaux

```text
src/server.js                Point d'entree
src/httpServer.js            Routes HTTP
src/admin.js                 Dashboard admin et API admin
src/webhook.js               Parsing des evenements WhatsApp
src/whatsapp.js              Client WhatsApp Cloud API
src/db.js                    SQLite, migrations, scores
src/services/conversation.js Moteur conversationnel Funda
src/content/iot.js           Ressources et banque de questions IoT
```

## Notes De Production

- Utiliser `APP_ENV=production`.
- Renseigner obligatoirement les tokens WhatsApp.
- Garder `WHATSAPP_APP_SECRET` actif pour verifier `X-Hub-Signature-256`.
- Definir `ADMIN_TOKEN` et laisser `ADMIN_PUBLIC=false`.
- Deployer sur une plateforme avec disque persistant si SQLite est conserve.
- Render, Railway ou un VPS conviennent mieux que Vercel pour SQLite persistant.
- Pour les relances automatiques hors fenêtre WhatsApp de 24h, créer des message templates approuvés par Meta.
- Si un token Meta a ete copie dans un fichier partage, le revoquer et en generer un nouveau.
