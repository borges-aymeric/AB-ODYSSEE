# Guide des Formulaires - AB Odyssée

Ce guide explique comment faire fonctionner tous les formulaires du site.

## 📋 Types de Formulaires

Le site contient **3 types de formulaires** :

1. **Formulaire de Contact** (`contact.html`) - Fonctionne sans serveur
2. **Formulaire de Connexion** (`login.html`) - Nécessite le serveur Node.js
3. **Formulaire d'Inscription Client** (`inscription-client.html`) - Nécessite le serveur Node.js

---

## 🚀 Démarrage Rapide

### Pour le Formulaire de Contact (fonctionne immédiatement)

Le formulaire de contact utilise **FormSubmit**, un service externe. Il fonctionne **sans serveur** :

1. Ouvrez simplement `contact.html` dans votre navigateur
2. Remplissez le formulaire
3. Cliquez sur "Démarrer votre odyssée"
4. Le message sera envoyé par email à `aymeric.borges18.06@gmail.com`

✅ **Aucune configuration nécessaire** - Fonctionne dès maintenant !

---

### Pour les Formulaires CRM (nécessitent le serveur)

Les formulaires de connexion et d'inscription client nécessitent que le serveur Node.js soit démarré.

#### Étape 1 : Installer les dépendances (si pas déjà fait)

```bash
npm install
```

#### Étape 2 : Démarrer le serveur

```bash
npm start
```

Vous devriez voir :
```
Serveur démarré sur http://localhost:3000
```

#### Étape 3 : Accéder aux pages

- **Connexion** : http://localhost:3000/login.html
- **Inscription Client** : http://localhost:3000/inscription-client.html
- **CRM Admin** : http://localhost:3000/admin-crm.html

---

## 🔐 Comptes par Défaut

Lors du premier démarrage, deux comptes administrateur sont créés automatiquement :

| Username | Password | Email |
|----------|----------|-------|
| `admin` | `Admin123!` | admin@abodyssee.fr |
| `commercial` | `Commercial123!` | commercial@abodyssee.fr |

⚠️ **Important** : Changez ces mots de passe en production !

---

## 📝 Utilisation des Formulaires

### 1. Formulaire de Contact

**Localisation** : `contact.html`

**Fonctionnalités** :
- Envoi direct par email via FormSubmit
- Feedback visuel lors de l'envoi
- Message de confirmation après envoi
- Aucune authentification requise

**Champs** :
- Nom complet (obligatoire)
- Email (obligatoire)
- Sujet/Service (optionnel)
- Message (obligatoire)

---

### 2. Formulaire de Connexion

**Localisation** : `login.html`

**Fonctionnalités** :
- Authentification sécurisée avec sessions
- Protection contre les attaques par force brute (5 tentatives max / 15 min)
- Redirection automatique vers le CRM après connexion
- Gestion des erreurs avec messages clairs

**Utilisation** :
1. Entrez votre nom d'utilisateur et mot de passe
2. Cliquez sur "Se connecter"
3. Vous serez redirigé vers le CRM

---

### 3. Formulaire d'Inscription Client

**Localisation** : `inscription-client.html`

**Fonctionnalités** :
- Création de comptes clients dans la base de données
- Validation des champs en temps réel
- Gestion des services multiples
- Distinction Prospect/Client

**Champs obligatoires** :
- Nom
- Prénom
- Email (unique)
- Type (Prospect ou Client)
- Services demandés (au moins un)

**Champs optionnels** :
- Numéro de téléphone
- SIRET
- Numéro de TVA intracommunautaire

**Utilisation** :
1. Connectez-vous d'abord avec un compte admin
2. Remplissez le formulaire
3. Sélectionnez au moins un service
4. Cliquez sur "Créer le compte"
5. Le client sera ajouté à la base de données

---

## 🛠️ Dépannage

### Le formulaire de contact ne fonctionne pas

**Vérifications** :
- ✅ Le formulaire utilise FormSubmit (service externe)
- ✅ Vérifiez votre connexion internet
- ✅ Vérifiez que l'email de destination est correct dans le code

**Solution** : Le formulaire devrait fonctionner immédiatement. Si ce n'est pas le cas, vérifiez la console du navigateur pour les erreurs.

---

### Les formulaires CRM ne fonctionnent pas

**Vérifications** :
1. ✅ Le serveur est-il démarré ?
   ```bash
   npm start
   ```

2. ✅ Le serveur écoute-t-il sur le port 3000 ?
   - Vérifiez la console pour voir : `Serveur démarré sur http://localhost:3000`

3. ✅ Les dépendances sont-elles installées ?
   ```bash
   npm install
   ```

4. ✅ Accédez-vous via `http://localhost:3000` et non via `file://` ?

**Erreurs courantes** :

- **"Erreur de connexion au serveur"**
  - Le serveur n'est pas démarré → Lancez `npm start`
  - Le port 3000 est déjà utilisé → Changez le port dans `server.js`

- **"Accès non autorisé"**
  - Vous n'êtes pas connecté → Connectez-vous via `login.html`
  - Votre session a expiré → Reconnectez-vous

- **"Erreur lors de la création du client"**
  - L'email existe déjà → Utilisez un autre email
  - Champs obligatoires manquants → Vérifiez tous les champs requis

---

## 🔧 Configuration Avancée

### Changer le port du serveur

Modifiez la ligne dans `server.js` :
```javascript
const PORT = process.env.PORT || 3000; // Changez 3000 par le port souhaité
```

Ou utilisez une variable d'environnement :
```bash
PORT=8080 npm start
```

### Changer l'email de destination (Contact)

Modifiez dans `contact.html` :
```html
<form action="https://formsubmit.co/VOTRE_EMAIL@example.com" method="POST">
```

### Configurer les sessions

Les sessions sont configurées dans `server.js`. Pour la production :
- Changez `SESSION_SECRET` dans les variables d'environnement
- Activez `secure: true` pour HTTPS

---

## 📊 Base de Données

La base de données SQLite (`crm.db`) est créée automatiquement au premier démarrage.

**Tables** :
- `clients` - Informations des clients
- `echanges` - Historique des échanges avec les clients
- `admins` - Comptes administrateurs

**Localisation** : `server/crm.db`

---

## ✅ Checklist de Vérification

Avant de tester les formulaires, vérifiez :

- [ ] Node.js est installé (`node --version`)
- [ ] Les dépendances sont installées (`npm install`)
- [ ] Le serveur démarre sans erreur (`npm start`)
- [ ] Vous accédez au site via `http://localhost:3000`
- [ ] Vous êtes connecté pour les formulaires CRM
- [ ] Votre navigateur accepte les cookies (pour les sessions)

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs du serveur dans la console
2. Vérifiez la console du navigateur (F12)
3. Consultez ce guide de dépannage
4. Vérifiez que toutes les dépendances sont à jour

---

## 📝 Notes Importantes

- **Formulaire de Contact** : Fonctionne sans serveur, utilise FormSubmit
- **Formulaires CRM** : Nécessitent le serveur Node.js en cours d'exécution
- **Sécurité** : Changez les mots de passe par défaut en production
- **Base de données** : Sauvegardez régulièrement `crm.db`

---

**Dernière mise à jour** : 2024

