# Configuration PostgreSQL sur Render

Ce guide vous explique comment configurer PostgreSQL sur Render pour que vos données soient persistantes même après un rebuild.

## 🎯 Pourquoi PostgreSQL ?

SQLite stocke les données dans un fichier local qui est perdu à chaque déploiement sur Render. PostgreSQL est une base de données cloud qui persiste vos données de manière permanente.

## 📋 Étapes de configuration

### 1. Créer une base de données PostgreSQL sur Render

1. Connectez-vous à votre dashboard Render : https://dashboard.render.com
2. Cliquez sur **"New +"** → **"PostgreSQL"**
3. Configurez votre base de données :
   - **Name** : `ab-odyssee-db` (ou le nom de votre choix)
   - **Database** : `crm` (ou le nom de votre choix)
   - **User** : Laisser par défaut
   - **Region** : Choisissez la même région que votre service web
   - **PostgreSQL Version** : Laisser la dernière version
   - **Plan** : Choisissez selon vos besoins (Free tier disponible)

4. Cliquez sur **"Create Database"**

### 2. Récupérer la DATABASE_URL

Une fois la base de données créée :

1. Dans le dashboard de votre base de données PostgreSQL, vous verrez une section **"Connections"**
2. Copiez la **"Internal Database URL"** (pour les services sur Render) ou **"External Database URL"** (pour développement local)
3. Elle ressemble à : `postgresql://user:password@hostname:5432/database`

### 3. Configurer la variable d'environnement sur Render

1. Allez dans votre service web sur Render
2. Cliquez sur **"Environment"** dans le menu de gauche
3. Ajoutez une nouvelle variable d'environnement :
   - **Key** : `DATABASE_URL`
   - **Value** : Collez l'URL de connexion que vous avez copiée
4. Cliquez sur **"Save Changes"**

### 4. Redéployer votre application

1. Render redéploiera automatiquement votre application
2. Ou vous pouvez déclencher un déploiement manuel depuis le dashboard

## ✅ Vérification

Une fois déployé, vérifiez les logs de votre application. Vous devriez voir :
```
✅ Base de données PostgreSQL connectée avec succès
🔧 Initialisation de la base de données...
✅ Table clients initialisée
✅ Table echanges initialisée
✅ Table admins initialisée
```

## 🔄 Migration depuis SQLite

Si vous aviez des données dans SQLite en local :

1. **Option 1** : Les données seront recréées automatiquement lors du premier déploiement
2. **Option 2** : Si vous avez des données importantes, vous pouvez les exporter depuis SQLite et les importer dans PostgreSQL (nécessite des outils de migration)

## 🛠️ Développement local

Pour le développement local, l'application utilisera automatiquement SQLite (fichier `crm.db`) si `DATABASE_URL` n'est pas définie.

Pour utiliser PostgreSQL en local :
1. Créez un fichier `.env` dans le dossier `server/`
2. Ajoutez : `DATABASE_URL=postgresql://user:password@localhost:5432/crm`
3. Assurez-vous d'avoir PostgreSQL installé localement

## 📝 Notes importantes

- **Les données sont maintenant persistantes** : Vos clients ne disparaîtront plus après un rebuild
- **Backup automatique** : Render fait des backups automatiques de votre base PostgreSQL
- **Gratuit** : Le plan gratuit de Render inclut une base PostgreSQL (avec limitations)
- **Sécurité** : La `DATABASE_URL` contient les identifiants, ne la partagez jamais publiquement

## 🆘 Dépannage

### Erreur de connexion
- Vérifiez que `DATABASE_URL` est bien définie dans les variables d'environnement
- Vérifiez que votre service web et votre base de données sont dans la même région
- Utilisez l'URL "Internal" si les deux services sont sur Render

### Tables non créées
- Vérifiez les logs de l'application au démarrage
- Les tables sont créées automatiquement au premier démarrage
- Si nécessaire, redéployez l'application

### Données perdues
- Vérifiez que vous utilisez bien PostgreSQL (pas SQLite)
- Vérifiez les backups dans le dashboard Render
- Contactez le support Render si nécessaire

## 🎉 C'est tout !

Vos données sont maintenant persistantes. Vous pouvez rebuild votre application autant de fois que vous voulez, vos clients resteront dans la base de données.

