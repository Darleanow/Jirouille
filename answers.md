# PARTIE A – Théorie

## Question 1 – Services cloud temps réel

1.a
Firestore
Pusher

1.b
Firestore :
Modèle de données en NoSQL, organisé en collections puis documents (un peu comme du JSON).
Les données sont persistées, donc on peut les relire plus tard.
Il propose un système d’écoute en temps réel où les changements sont envoyés automatiquement au client.
Très bonne montée en charge, Google répartit les données et les accès.

Pusher :
Pas vraiment un modèle de données, c’est juste du pub/sub via des “channels”.
Pas de persistance, les messages sont éphémères.
Les clients s’abonnent à un channel et reçoivent directement les événements.
Bonne scalabilité aussi, mais centrée uniquement sur du live.

1.c
Firestore est utile quand on veut du temps réel mais aussi garder les infos, par exemple un éditeur collaboratif où le document doit rester accessible.
Pusher est plus adapté pour des signaux instantanés et temporaires, comme un système de “user typing” ou des réactions dans un chat.

---

## Question 2 – Sécurité temps réel

2.a
Trois risques :

* Un DDoS via un trop grand nombre de connexions persistantes. On s’en protège en limitant par IP, en faisant du rate limit et avec des protections réseau type Cloudflare.
* Usurpation d’identité (quelqu’un émet des messages à la place d’un autre). On limite ça avec des tokens courts, des vérifications serveur et de la signature.
* Spam ou payloads trop gros. On filtre côté serveur, on valide les données, et on impose des limites de taille.

2.b
La gestion des identités est importante parce que les messages partent immédiatement vers les autres. Si l’identité n’est pas fiable, quelqu’un peut accéder à une room interdite ou envoyer des données à la place d’un autre. Avec une bonne auth, on sait qui parle, on peut donner des droits différents et on peut isoler un utilisateur si nécessaire.

---

## Question 3 – WebSockets vs Webhooks

3.a
WebSocket : connexion persistante et bidirectionnelle entre le client et le serveur.
Webhook : simple appel HTTP effectué par un serveur vers une URL lorsqu’un événement se produit.

3.b
WebSocket – avantages : vraie interaction temps réel, communication dans les deux sens.
WebSocket – limites : plus lourd à gérer (connexions longues), demande plus de ressources s’il y a beaucoup de clients.

Webhook – avantages : très simple, fonctionne en HTTP normal, peu de charge.
Webhook – limites : pas du temps réel strict, sens unique (on reçoit, mais on ne garde pas la connexion).

3.c
Le webhook est préférable lorsqu’on n’a pas besoin d’une connexion ouverte en continu, par exemple pour notifier un paiement ou une création de compte. C’est plus simple et ça évite de gérer des milliers de WebSockets.

---

## Question 4 – CRDT & Collaboration

4.a
Un CRDT est une structure de données faite pour que plusieurs utilisateurs modifient la même donnée en parallèle, sans coordination centrale, tout en garantissant que tout finira dans le même état quand ça se synchronise.

4.b
Exemple typique : un document collaboratif où plusieurs personnes écrivent en même temps dans le même paragraphe.

4.c
Un CRDT évite les conflits grâce aux informations qu’il stocke dans chaque opération (horloges logiques, identifiants, ordre causal…). Les nœuds peuvent reconstruire un état cohérent sans avoir besoin d’un “dernier écrivain” fixe. Les fusions sont déterministes, donc pas de conflit.

---

## Question 5 – Monitoring temps réel

5.a
Métriques clés : la latence des messages, le nombre de connexions actives, le taux d’erreurs ou de messages perdus.

5.b
Prometheus récupère automatiquement les métriques. Grafana les affiche sous forme de graphiques et d’alertes, ce qui permet de repérer les problèmes (pics de charge, lenteurs…) rapidement.

5.c
Logs : événements textuels enregistrés (erreurs, actions…).
Traces : parcours complet d’une requête à travers plusieurs services.
Métriques : valeurs numériques échantillonnées régulièrement pour suivre un état (CPU, latence…).

---

## Question 6 – Déploiement & connexions persistantes

6.a
Pour le load balancing, une WebSocket doit rester sur le même serveur tant qu’elle est ouverte, sinon la session casse. Les load balancers doivent donc garder une affinité (sticky session).
Pour la scalabilité, chaque connexion consomme des ressources. On doit augmenter le nombre de nœuds et prévoir un autoscaling basé non seulement sur le CPU mais aussi sur le nombre de connexions.

6.b
Kubernetes est souvent utilisé parce qu’il gère bien la répartition des pods, l’autoscaling, les mises à jour progressives sans tout casser, et les ingress compatibles WebSockets. Il permet d’absorber un très grand nombre de connexions de manière propre.

---

## Question 7 – Stratégies de résilience client

7.a
Mécanismes :

* Reconnexion automatique quand la connexion tombe.
* Utilisation d’un délai croissant entre les tentatives (exponential backoff).
* Récupération de l’état après reconnexion (redemander ce qui a été raté).

7.b
Exponential backoff : après chaque échec de connexion, le délai avant la prochaine tentative augmente (1s, 2s, 4s, 8s…). Ça évite de surcharger le serveur si beaucoup de clients tombent en même temps.
