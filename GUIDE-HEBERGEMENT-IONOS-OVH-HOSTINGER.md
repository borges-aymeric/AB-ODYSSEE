# 🏗️ Guide de Compatibilité - Hébergement IONOS, OVH, Hostinger

## ⚠️ Compatibilité Générale

**Réponse courte :** Votre application nécessite un **VPS (Virtual Private Server)** ou un **serveur dédié**. Les hébergements mutualisés classiques ne sont **PAS compatibles**.

---

## 📋 Exigences Techniques

Votre application nécessite :

1. ✅ **Node.js** (version 14+ recommandée)
2. ✅ **npm** (Node Package Manager)
3. ✅ **PostgreSQL** ou **SQLite** (base de données)
4. ✅ **Accès SSH** (pour installer et configurer)
5. ✅ **Port personnalisé** (le serveur écoute sur un port, ex: 3000)
6. ✅ **Processus en arrière-plan** (PM2 ou équivalent)
7. ✅ **Variables d'environnement** (configuration)

---

## 🔍 Compatibilité par Hébergeur

### 1. **IONOS** (1&1 IONOS)

#### ✅ Compatible avec :
- **VPS IONOS** (Virtual Private Server)
  - Support Node.js ✅
  - Accès SSH ✅
  - Installation PostgreSQL possible ✅
  - Prix : À partir de ~5€/mois

#### ❌ NON compatible avec :
- **Hébergement mutualisé classique** (Web Hosting)
  - Pas de Node.js ❌
  - Pas d'accès SSH complet ❌
  - Seulement PHP/MySQL ❌

#### 📝 Configuration nécessaire :
1. Choisir un VPS IONOS
2. Installer Node.js via SSH
3. Installer PostgreSQL
4. Configurer PM2 pour faire tourner l'application
5. Configurer un reverse proxy (nginx) pour le port 80/443

---

### 2. **OVH**

#### ✅ Compatible avec :
- **VPS OVH** (Virtual Private Server)
  - Support Node.js ✅
  - Accès SSH complet ✅
  - PostgreSQL disponible ✅
  - Prix : À partir de ~3€/mois

- **Serveur Dédié OVH**
  - Support complet ✅
  - Performance maximale ✅
  - Prix : À partir de ~30€/mois

- **Cloud Web OVH** (avec Node.js)
  - Support Node.js ✅
  - Gestion simplifiée ✅
  - Prix : Variable selon configuration

#### ❌ NON compatible avec :
- **Hébergement mutualisé classique** (Perso/Pro)
  - Pas de Node.js ❌
  - Seulement PHP/MySQL ❌

#### 📝 Configuration nécessaire :
1. Choisir un VPS ou Cloud Web OVH
2. Installer Node.js (via OVH ou manuellement)
3. Configurer PostgreSQL (OVH propose des bases de données gérées)
4. Utiliser PM2 pour la gestion des processus
5. Configurer nginx comme reverse proxy

---

### 3. **Hostinger**

#### ✅ Compatible avec :
- **VPS Hostinger**
  - Support Node.js ✅
  - Accès SSH ✅
  - Installation PostgreSQL possible ✅
  - Prix : À partir de ~4€/mois

#### ❌ NON compatible avec :
- **Hébergement mutualisé Hostinger** (Single/Premium/Business)
  - Pas de Node.js ❌
  - Seulement PHP/MySQL ❌
  - Pas d'accès SSH complet ❌

#### 📝 Configuration nécessaire :
1. Choisir un VPS Hostinger
2. Installer Node.js manuellement via SSH
3. Installer PostgreSQL
4. Configurer PM2
5. Configurer nginx

---

## 🚀 Étapes de Déploiement (VPS)

### Étape 1 : Préparer le VPS

```bash
# Se connecter en SSH
ssh root@votre-serveur.com

# Mettre à jour le système
apt update && apt upgrade -y

# Installer Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

### Étape 2 : Installer PostgreSQL

```bash
# Installer PostgreSQL
apt install -y postgresql postgresql-contrib

# Créer un utilisateur et une base de données
sudo -u postgres psql
CREATE DATABASE crm;
CREATE USER abodyssee WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE crm TO abodyssee;
\q
```

### Étape 3 : Installer PM2 (Gestionnaire de processus)

```bash
# Installer PM2 globalement
npm install -g pm2

# PM2 permet de faire tourner Node.js en arrière-plan
# et de redémarrer automatiquement en cas de crash
```

### Étape 4 : Déployer l'Application

```bash
# Cloner ou uploader votre code
cd /var/www
git clone votre-repo.git ab-odyssee
cd ab-odyssee

# Installer les dépendances
npm install

# Compiler le SCSS
npm run sass:prod
```

### Étape 5 : Configurer les Variables d'Environnement

```bash
# Créer le fichier .env
nano server/.env
```

Contenu du `.env` :
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://abodyssee:votre_mot_de_passe@localhost:5432/crm
SESSION_SECRET=votre_secret_tres_long_et_aleatoire
BREVO_API_KEY=votre_cle_brevo
ALLOWED_ORIGINS=https://votre-domaine.com
```

### Étape 6 : Démarrer avec PM2

```bash
# Démarrer l'application
pm2 start server/server.js --name "ab-odyssee"

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
```

### Étape 7 : Configurer Nginx (Reverse Proxy)

```bash
# Installer nginx
apt install -y nginx

# Créer la configuration
nano /etc/nginx/sites-available/ab-odyssee
```

Configuration nginx :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activer le site
ln -s /etc/nginx/sites-available/ab-odyssee /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Étape 8 : Configurer SSL (Let's Encrypt)

```bash
# Installer Certbot
apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
certbot --nginx -d votre-domaine.com
```

---

## ⚙️ Modifications du Code Nécessaires

### 1. Adapter le Port

Le code utilise déjà `process.env.PORT`, donc pas de modification nécessaire si vous configurez la variable d'environnement.

### 2. Configuration PostgreSQL

Le code détecte automatiquement PostgreSQL via `DATABASE_URL`. Assurez-vous que la variable est bien définie.

### 3. Sessions en Production

Le code active déjà `secure: true` si `NODE_ENV=production`, donc compatible avec HTTPS.

---

## 💰 Comparaison des Coûts

| Hébergeur | Type | Prix/mois | Node.js | PostgreSQL | Difficulté |
|-----------|------|-----------|---------|------------|------------|
| **IONOS** | VPS | ~5€ | ✅ | ✅ (à installer) | Moyenne |
| **OVH** | VPS | ~3€ | ✅ | ✅ (géré ou à installer) | Moyenne |
| **OVH** | Cloud Web | Variable | ✅ | ✅ (géré) | Facile |
| **Hostinger** | VPS | ~4€ | ✅ | ✅ (à installer) | Moyenne |
| **Render** | PaaS | Gratuit/7€ | ✅ | ✅ (géré) | **Très facile** |

---

## 🎯 Recommandation

### Pour la Simplicité : **Restez sur Render**
- ✅ Configuration automatique
- ✅ PostgreSQL géré
- ✅ SSL automatique
- ✅ Déploiement via Git
- ✅ Pas de configuration serveur

### Pour le Contrôle : **VPS OVH ou IONOS**
- ✅ Contrôle total
- ✅ Coût fixe
- ✅ Performance dédiée
- ⚠️ Nécessite des compétences serveur

---

## 🔧 Alternatives Simples

Si vous voulez éviter la configuration serveur :

1. **Render** (actuel) - ✅ Recommandé
2. **Heroku** - PaaS similaire
3. **Railway** - PaaS moderne
4. **Fly.io** - PaaS performant
5. **DigitalOcean App Platform** - PaaS avec VPS

---

## ❓ FAQ

### Puis-je utiliser l'hébergement mutualisé IONOS/OVH/Hostinger ?

**Non**, car :
- Pas de support Node.js
- Pas d'accès SSH complet
- Pas de processus en arrière-plan
- Ports personnalisés non autorisés

### Dois-je modifier le code pour un VPS ?

**Non**, le code est déjà compatible. Il faut juste :
- Configurer les variables d'environnement
- Installer Node.js et PostgreSQL
- Utiliser PM2 pour faire tourner l'app

### Quel est le plus simple ?

**Render** reste le plus simple (PaaS). Pour un VPS, **OVH Cloud Web** est plus simple qu'un VPS classique.

### Puis-je utiliser SQLite sur un VPS ?

**Oui**, mais **déconseillé** car :
- Les données peuvent être perdues
- Pas de sauvegarde automatique
- Performance limitée
- **PostgreSQL est recommandé**

---

## ✅ Checklist de Compatibilité

Avant de choisir un hébergeur, vérifiez :

- [ ] Support Node.js
- [ ] Accès SSH
- [ ] Possibilité d'installer PostgreSQL
- [ ] Processus en arrière-plan (PM2)
- [ ] Reverse proxy (nginx)
- [ ] SSL/HTTPS (Let's Encrypt)
- [ ] Variables d'environnement
- [ ] Ports personnalisés

---

## 📞 Support

Si vous avez besoin d'aide pour :
- Configurer un VPS
- Déployer sur OVH/IONOS/Hostinger
- Migrer depuis Render

Le code est compatible, il faut juste la configuration serveur appropriée.

---

*Guide créé le 24 novembre 2024*

