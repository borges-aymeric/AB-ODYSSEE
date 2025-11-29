# 🐛 Guide de Débogage - Problème de Connexion

## 🔍 Vérifications à faire

### 1. Vérifier les logs Render

Allez dans les **logs** de votre service Render et cherchez :

```
🔍 Parsing ADMIN_ACCOUNTS...
📋 X compte(s) trouvé(s) dans ADMIN_ACCOUNTS
✅ Compte parsé: admin (admin@abodyssee.fr)
✅ Compte administrateur "admin" créé avec succès
```

**OU**

```
✅ Mot de passe mis à jour pour le compte "admin"
```

### 2. Vérifier le format de ADMIN_ACCOUNTS

Le format doit être exactement :
```
username:password:email,username2:password2:email2
```

**Exemple correct :**
```
admin:VotreMotDePasseSecurise123!:admin@abodyssee.fr,commercial:AutreMotDePasse456!:commercial@abodyssee.fr
```

**⚠️ Points importants :**
- Pas d'espaces avant/après les deux-points
- Pas d'espaces avant/après les virgules
- L'email doit être complet (avec @)

### 3. Problèmes courants

#### Erreur : "Format invalide pour un compte"

**Cause :** Le format de `ADMIN_ACCOUNTS` est incorrect

**Solution :** Vérifiez que vous avez exactement `username:password:email` avec des deux-points comme séparateurs

#### Erreur : "Aucun compte valide trouvé"

**Cause :** Le parsing a échoué

**Solution :** 
1. Vérifiez les logs pour voir quel compte pose problème
2. Vérifiez qu'il n'y a pas d'espaces en trop
3. Vérifiez que l'email est valide

#### Erreur : "Identifiants incorrects" à la connexion

**Causes possibles :**

1. **Les comptes existent déjà avec d'anciens mots de passe**
   - Le code met maintenant à jour automatiquement les mots de passe
   - Redéployez l'application pour que la mise à jour se fasse

2. **Le mot de passe dans ADMIN_ACCOUNTS ne correspond pas**
   - Vérifiez que vous utilisez exactement le même mot de passe que dans ADMIN_ACCOUNTS
   - Attention aux espaces, majuscules/minuscules

3. **Le compte n'a pas été créé**
   - Vérifiez les logs pour voir si le compte a été créé
   - Si non, vérifiez le format de ADMIN_ACCOUNTS

### 4. Solution rapide : Supprimer et recréer les comptes

Si les comptes existent déjà avec d'anciens mots de passe, vous pouvez :

#### Option A : Laisser le code mettre à jour (recommandé)

Le code met maintenant automatiquement à jour les mots de passe. Redéployez simplement l'application.

#### Option B : Supprimer manuellement via la base de données

Si vous avez accès à PostgreSQL sur Render :

```sql
-- Se connecter à PostgreSQL
-- Puis supprimer les anciens comptes
DELETE FROM admins WHERE username IN ('admin', 'commercial');
```

Puis redéployez pour que les nouveaux comptes soient créés.

---

## ✅ Checklist de vérification

- [ ] `ADMIN_ACCOUNTS` est bien configuré dans Render
- [ ] Le format est correct : `username:password:email`
- [ ] Pas d'espaces en trop dans la variable
- [ ] Les logs montrent que les comptes sont parsés correctement
- [ ] Les logs montrent que les comptes sont créés/mis à jour
- [ ] Vous utilisez exactement le même username et password que dans ADMIN_ACCOUNTS

---

## 🔧 Test rapide

Pour tester si le parsing fonctionne, ajoutez temporairement dans les logs :

Dans `server/server.js`, après le parsing, ajoutez :
```javascript
console.log('DEBUG - Comptes parsés:', defaultAccounts.map(a => ({ username: a.username, email: a.email })));
```

Cela vous permettra de voir si les comptes sont bien parsés (sans afficher les mots de passe).

---

*Guide de débogage pour les problèmes de connexion*

