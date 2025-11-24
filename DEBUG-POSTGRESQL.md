# Guide de Debug - PostgreSQL sur Render

Si vos données disparaissent encore après un rebuild, suivez ces étapes de diagnostic :

## 🔍 Vérifications à faire

### 1. Vérifier les logs au démarrage

Après le déploiement, regardez les logs de votre service sur Render. Vous devriez voir :

```
🔍 Vérification de la configuration de la base de données...
   DATABASE_URL définie: true
   URL (masquée): postgresql://user:****@hostname:5432/database
   Type de base détecté: PostgreSQL
✅ Base de données PostgreSQL connectée avec succès
🔧 Initialisation de la base de données...
✅ Table clients initialisée
✅ Table echanges initialisée
✅ Table admins initialisée
✅ Base de données prête !
✅ Serveur démarré sur http://localhost:XXXX
📊 Base de données: postgresql
```

**Si vous voyez "Type de base détecté: SQLite"** → La variable `DATABASE_URL` n'est pas détectée !

### 2. Vérifier la variable d'environnement DATABASE_URL

1. Allez dans votre **service web** (pas la base de données)
2. Cliquez sur **"Environment"** dans le menu de gauche
3. Vérifiez que vous avez bien une variable nommée exactement **`DATABASE_URL`** (en majuscules)
4. Vérifiez que la valeur est bien l'**Internal Database URL** de votre base PostgreSQL

### 3. Utiliser la bonne URL

Sur Render, il y a deux types d'URL :

- **Internal Database URL** : Pour les services sur Render (à utiliser !)
  - Format : `postgresql://user:password@dpg-xxxxx-a.region-postgres.render.com/database`
  - Cette URL fonctionne uniquement entre services Render

- **External Database URL** : Pour connexions externes (développement local)
  - Nécessite de whitelist votre IP
  - Ne fonctionne pas pour les services Render

**➡️ Utilisez TOUJOURS l'Internal Database URL pour votre service web !**

### 4. Vérifier que la base de données est bien créée

1. Allez dans votre base PostgreSQL sur Render
2. Vérifiez qu'elle est bien **"Available"** (pas "Paused" ou "Deleted")
3. Vérifiez le plan : Le plan gratuit peut être supprimé après 90 jours d'inactivité

### 5. Tester la connexion

Ajoutez cette route temporaire dans `server.js` pour tester :

```javascript
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.get(adaptSQL('SELECT COUNT(*) as count FROM clients'));
    res.json({ 
      dbType: dbModule.dbType,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      clientCount: result.count,
      message: 'Base de données fonctionnelle'
    });
  } catch (err) {
    res.status(500).json({ 
      error: err.message,
      dbType: dbModule.dbType,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  }
});
```

Puis visitez : `https://votre-app.onrender.com/api/test-db`

### 6. Vérifier les données dans PostgreSQL

1. Dans le dashboard de votre base PostgreSQL sur Render
2. Cliquez sur **"Connect"** ou **"psql"**
3. Connectez-vous et exécutez :
   ```sql
   SELECT COUNT(*) FROM clients;
   SELECT * FROM clients LIMIT 5;
   ```

Si vous voyez vos clients ici mais pas dans l'application, c'est un problème de connexion.

## 🐛 Problèmes courants

### Problème 1 : "DATABASE_URL définie: false"

**Solution :**
- Vérifiez que la variable est bien nommée `DATABASE_URL` (pas `DATABASE_URLS` ou autre)
- Vérifiez qu'elle est dans le **service web**, pas dans la base de données
- Redéployez après avoir ajouté/modifié la variable

### Problème 2 : "Type de base détecté: SQLite"

**Solution :**
- La variable `DATABASE_URL` n'est pas détectée
- Vérifiez l'orthographe exacte : `DATABASE_URL`
- Vérifiez qu'elle n'est pas vide
- Redéployez après modification

### Problème 3 : Erreur de connexion PostgreSQL

**Solution :**
- Vérifiez que vous utilisez l'**Internal Database URL**
- Vérifiez que votre service web et votre base sont dans la **même région**
- Vérifiez que la base de données n'est pas en pause

### Problème 4 : Les données disparaissent encore

**Vérifications :**
1. Les logs montrent-ils "Type de base détecté: PostgreSQL" ?
2. Avez-vous bien redéployé après avoir ajouté `DATABASE_URL` ?
3. La base PostgreSQL est-elle bien "Available" ?
4. Testez avec `/api/test-db` pour voir quel type de base est utilisé

## ✅ Checklist de vérification

- [ ] Variable `DATABASE_URL` existe dans le service web
- [ ] Variable `DATABASE_URL` contient l'Internal Database URL
- [ ] Les logs montrent "Type de base détecté: PostgreSQL"
- [ ] Les logs montrent "✅ Base de données PostgreSQL connectée avec succès"
- [ ] La base PostgreSQL est "Available" sur Render
- [ ] Service web et base sont dans la même région
- [ ] Application redéployée après modification de `DATABASE_URL`

## 📞 Si ça ne marche toujours pas

1. Partagez les logs de démarrage de votre application
2. Partagez le résultat de `/api/test-db` (si vous l'avez ajouté)
3. Vérifiez que vous n'avez pas plusieurs variables d'environnement qui se chevauchent

