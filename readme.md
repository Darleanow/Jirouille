# Projet Real-Time Task Manager

Application collaborative de gestion de tâches avec synchronisation temps réel.

---

## Architecture logique

Architecture client-serveur avec WebSockets pour le temps réel.

**Backend :** Express + WebSocket + SQLite

* Auth JWT, CRUD tasks, monitoring admin
* Broadcast automatique des changements
* CRDT G-Counter pour les événements auth

**Frontend :** Next.js + React + Zustand

* Pages : landing, auth, dashboard, admin
* WebSocket client avec reconnexion auto
* State global persisté

**Flux :** Le client s'authentifie via REST, récupère un JWT, se connecte au WebSocket. Toute modification de tâche est broadcastée instantanément à tous les clients connectés.

---

## Choix technologiques

**Node.js + TypeScript :** Parfait pour les connexions persistantes, types partagés front/back

**Express + ws :** API REST simple et WebSocket pur sans abstraction inutile

**SQLite + WAL :** Base embarquée suffisante, lectures concurrentes sans blocage

**JWT + bcrypt :** Auth stateless avec tokens expirables, hash sécurisé des mots de passe

**Zod :** Validation avec inférence TypeScript auto

**Next.js + Zustand :** App React moderne avec state global persisté

**Tables DB :** users, tasks, ws_sessions, logs. IDs en UUID, dates ISO 8601.

**CRDT G-Counter :** Compteur monotone pour les auth, fusionnable par max entre nœuds.

---

## Plan de sécurité

* **Auth :** Bcrypt pour les passwords, JWT signés expirables 7j
* **Validation :** Zod sur toutes les entrées, sanitization des strings
* **Rate limiting :** 30 req/10s par IP en mémoire, retourne 429 au-delà
* **WebSocket :** Token optionnel vérifié, messages invalides ignorés
* **Admin :** Basic Auth sur `/monitoring/*`
* **CORS :** Limité à localhost:3000 en dev

---

## Gestion des erreurs

* **Serveur :** Try/catch sur tous les endpoints. 400 pour validation, 401 pour auth, 404 pour not found.
* **WebSocket :** Messages invalides ignorés, déconnexions loggées sans crash.
* **DB :** Contraintes UNIQUE → 409, pas de détails techniques exposés.
* **Logs :** Tout est tracé en DB avec scope/level/meta pour debug.

---

## Limites et améliorations possibles

**Limites :**

* Scalabilité horizontale limitée (rate limit et WS en mémoire)
* SQLite pas adapté au-delà de quelques milliers d'users
* Pas de replay des événements WS en cas de déconnexion
* CRDT basique, pas de résolution de conflits intelligente
* Monitoring simple sans alerting ni dashboards
* Pas de tests

**Améliorations :**

* Redis pour rate limit, WS sessions et pub/sub entre instances
* Message queue (Bull) pour tâches lourdes
* Exponential backoff côté client (déjà implémenté dans ws.ts)
* CRDT complet (Yjs/Automerge) pour édition collaborative
* PostgreSQL avec réplication
* Prometheus + Grafana + Loki pour monitoring avancé
* OAuth (Google/GitHub)
* Rate limiting par user avec token bucket
* Compression WebSocket
* Health checks avancés

---

## Installation et démarrage

### Prérequis

Node.js installé (version récente recommandée).

### Configuration

Copier `_env.example` vers `.env` et ajuster les variables :

```env
PORT=3001
DB_PATH=./data/app.db
JWT_SECRET=votre-secret-tres-long
ADMIN_USERNAME=admin
ADMIN_PASSWORD=votre-password-admin
NODE_ID=server-1
```

### Installation des dépendances

```bash
npm install
```

### Démarrage

```bash
npm start # dans ./server
npm run dev # dans ./client
# Il est aussi possible de lancer le compose
```

Le serveur démarre sur `http://localhost:3001`.

### Endpoints principaux

* `POST /auth/register` : Créer un compte
* `POST /auth/login` : Se connecter
* `GET /auth/me` : Infos du user connecté
* `GET /tasks` : Liste des tâches
* `POST /tasks` : Créer une tâche
* `PUT /tasks/:id` : Modifier une tâche
* `DELETE /tasks/:id` : Supprimer une tâche
* `GET /monitoring/*` : Stats admin (Basic Auth requis)
* `ws://localhost:3001?token=JWT` : WebSocket

---
