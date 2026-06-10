# Funda WhatsApp MVP

Funda est un assistant WhatsApp Business d'apprentissage en ligne. Ce MVP se concentre sur la thematique IoT avec:

- webhook WhatsApp Cloud API complet;
- accueil Funda en francais;
- menu interactif WhatsApp;
- ressources IoT;
- quiz quotidien de 20 questions;
- score hebdomadaire;
- classement public limite au top 5;
- commandes `STOP` et `START`;
- dashboard admin;
- templates WhatsApp a preparer dans Meta;
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

Ce projet n'utilise pas de dependances npm externes. SQLite est gere via `node:sqlite`.

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
WHATSAPP_API_VERSION=v23.0

DATABASE_PATH=./data/funda.sqlite
BACKUP_DIR=./data/backups
ADMIN_TOKEN=un-token-admin-long
ADMIN_PUBLIC=false
```

Lancer le serveur:

```powershell
npm run start
```

Verifier:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

En `development`, si le fichier SQLite configure est indisponible, le serveur bascule vers une base temporaire et affiche un avertissement. En `production`, cette erreur reste bloquante pour eviter une perte de donnees silencieuse.

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

Si ngrok ne s'installe pas ou si Chocolatey echoue au telechargement, utiliser le tunnel de secours:

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
6. Envoyer un message de test au numero WhatsApp Business.

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
- reponses a boutons/listes;
- statuts des messages;
- erreurs et metadonnees WhatsApp.

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

- utilisateurs recents;
- messages entrants/sortants;
- top 5 hebdomadaire;
- quiz recents;
- templates WhatsApp;
- erreurs webhook et statuts echoues;
- creation de backups SQLite.

Il permet aussi d'ajouter ou modifier les ressources IoT et les templates internes de suivi.

## Comportement WhatsApp

Premier contact:

```text
Bonjour, je suis Funda, votre assistant d'apprentissage en ligne.
Funda vous aide a apprendre simplement et facilement grace a des ressources, des quiz et des challenges.
Ce mois-ci, nous apprenons l'IoT.
```

Menu principal:

- Quiz du jour
- Challenge semaine
- Apprendre l'IoT
- Ressources IoT
- Mon score
- Classement top 5
- Aide

Le quiz du jour contient 20 questions. WhatsApp ne permet que 3 boutons rapides par message, donc les reponses A/B/C/D sont envoyees sous forme de liste interactive.

Commandes utiles:

- `MENU`: afficher le menu;
- `QUIZ`: lancer ou reprendre le quiz du jour;
- `SCORE`: voir son score et son niveau;
- `CLASSEMENT`: voir le top 5;
- `STOP`: se desabonner;
- `START`: reprendre Funda.

## Scoring

Score hebdomadaire:

- `+1` point par bonne reponse;
- `+5` points par quiz quotidien termine;
- `+10` points bonus si l'utilisateur participe au moins 5 jours dans la semaine.

Le classement public affiche uniquement les 5 meilleurs utilisateurs de la semaine. L'utilisateur voit toujours son propre score.

Funda attribue aussi un niveau simple:

- `debutant`;
- `intermediaire`;
- `avance`.

Des badges sont calcules selon la regularite, les quiz termines et les bonnes reponses.

## Templates WhatsApp

Le code contient les templates internes suivants comme base de travail:

- `funda_quiz_du_jour`;
- `funda_score_hebdo`;
- `funda_challenge_iot`.

Ils doivent etre crees et approuves dans Meta avant tout envoi hors fenetre WhatsApp de 24h. Le dashboard sert a suivre leur nom, statut et texte, mais l'approbation reste faite dans Meta.

## Sauvegarde

Backup manuel:

```powershell
npm run backup
```

Ou depuis le dashboard:

```text
POST /admin/api/backup
```

Les backups sont crees dans `BACKUP_DIR`.

## Test Local Sans WhatsApp

Si `WHATSAPP_ACCESS_TOKEN` ou `WHATSAPP_PHONE_NUMBER_ID` manquent, le projet passe automatiquement en dry-run: les messages sortants sont enregistres en base au lieu d'etre envoyes a Meta.

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
2. Creer un Web Service Docker.
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
- Pour les relances automatiques hors fenetre WhatsApp de 24h, creer des message templates approuves par Meta.
- Si un token Meta a ete copie dans un fichier partage, le revoquer et en generer un nouveau.
