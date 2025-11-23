# Guide de Persistance des Données sur Render

## Problème

Lors d'un redéploiement sur Render, la base de données SQLite est recréée vide car :
- Le fichier `crm.db` n'est pas versionné dans GitHub (il est dans `.gitignore`)
- Render clone le projet depuis GitHub à chaque déploiement
- Les fichiers dans le répertoire du projet sont éphémères et sont supprimés lors d'un redéploiement

## Solution : Disque Persistant sur Render

Pour que vos données (clients, échanges) persistent entre les redéploiements, vous devez configurer un **disque persistant** sur Render.

### Étapes de Configuration

1. **Connectez-vous à votre dashboard Render**
   - Allez sur https://dashboard.render.com

2. **Sélectionnez votre service Web Service**
   - Cliquez sur le service qui héberge votre application

3. **Configurez un disque persistant**
   - Dans le menu de gauche, allez dans **"Settings"** (Paramètres)
   - Faites défiler jusqu'à la section **"Persistent Disk"** (Disque Persistant)
   - Cliquez sur **"Add Persistent Disk"** (Ajouter un disque persistant)

4. **Configurez le montage**
   - **Mount Path** (Chemin de montage) : `/opt/render/project/persistent`
   - **Size** (Taille) : Choisissez une taille appropriée (1 GB est généralement suffisant pour commencer)
   - Cliquez sur **"Save"** (Enregistrer)

5. **Redéployez votre service**
   - Après avoir ajouté le disque persistant, Render va automatiquement redéployer votre service
   - La base de données sera maintenant stockée dans le disque persistant et survivra aux redéploiements

### Vérification

Après le redéploiement, vérifiez les logs de votre service. Vous devriez voir :
```
✅ Utilisation du disque persistant Render: /opt/render/project/persistent/crm.db
```

Si vous voyez un avertissement comme :
```
⚠️  Disque persistant non trouvé. Les données peuvent être perdues lors d'un redéploiement.
```

Cela signifie que le disque persistant n'est pas correctement configuré. Vérifiez :
- Que le disque persistant est bien monté sur `/opt/render/project/persistent`
- Que le service a été redéployé après l'ajout du disque

### Important

⚠️ **Sans disque persistant configuré, toutes vos données seront perdues à chaque redéploiement !**

Le code a été modifié pour détecter automatiquement le disque persistant et l'utiliser s'il est disponible. Si le disque n'est pas monté, il utilisera le répertoire local (mais les données seront perdues lors d'un redéploiement).

### Alternative : Migration vers PostgreSQL

Si vous préférez utiliser une base de données gérée, vous pouvez migrer vers PostgreSQL qui est offert par Render. Cela nécessiterait de modifier le code pour utiliser PostgreSQL au lieu de SQLite, mais offrirait une meilleure scalabilité et fiabilité.

Pour plus d'informations sur les disques persistants sur Render :
https://render.com/docs/disks

