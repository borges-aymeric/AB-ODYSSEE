# 🚀 Configuration Email - Guide Rapide

## ✅ Étape 1 : Obtenir un mot de passe d'application Gmail

### Étape 1a : Activer la validation en deux étapes (OBLIGATOIRE)

1. **Allez sur** : https://myaccount.google.com/
2. **Cliquez sur** "Sécurité" (dans le menu de gauche)
3. **Cherchez** la section "Connexion à Google" ou "Se connecter à Google"
4. **Cliquez sur** "Validation en deux étapes" ou "Authentification à deux facteurs"
5. **Suivez les instructions** pour l'activer (vous devrez confirmer avec votre téléphone)

⚠️ **Important** : Les "Mots de passe des applications" n'apparaissent QUE si la validation en deux étapes est activée !

### Étape 1b : Créer un mot de passe d'application

1. **Toujours sur la page Sécurité**, descendez jusqu'à la section **"Connexion à Google"**
2. **Cherchez** "Mots de passe des applications" (ou "App passwords" en anglais)
   - Si vous ne le voyez pas, c'est que la validation en deux étapes n'est pas activée
   - Il se trouve généralement juste en dessous de "Validation en deux étapes"
3. **Cliquez sur** "Mots de passe des applications"
4. **Sélectionnez** :
   - Application : **Mail**
   - Appareil : **Autre (nom personnalisé)** → Tapez "AB Odyssée Server"
5. **Cliquez sur** "Générer"
6. **Copiez le mot de passe** (16 caractères, format : xxxx xxxx xxxx xxxx)
   - ⚠️ **Copiez-le immédiatement**, vous ne pourrez plus le voir après !

## ✅ Étape 2 : Ajouter le mot de passe dans .env

Ouvrez le fichier `.env` à la racine du projet et ajoutez le mot de passe après `SMTP_PASS=` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=aymeric.borges18.06@gmail.com
SMTP_PASS=votre-mot-de-passe-16-caracteres-ici
```

**Important** : 
- ⚠️ Ne mettez **PAS d'espaces** dans le mot de passe
- ⚠️ Le mot de passe fait exactement **16 caractères** (sans les espaces)

## ✅ Étape 3 : Redémarrer le serveur

1. Arrêtez le serveur (Ctrl+C dans le terminal)
2. Redémarrez avec : `npm start`

## ✅ Étape 4 : Tester

1. Ouvrez http://localhost:3000/contact.html
2. Remplissez le formulaire
3. Envoyez le message
4. Vérifiez votre boîte mail (aymeric.borges18.06@gmail.com)

Vous devriez recevoir un **email magnifique** avec le template HTML personnalisé ! 🎉

---

## 🔍 Vérification

Si vous voyez dans la console du serveur :
- ✅ `Serveur démarré sur http://localhost:3000` → Tout est OK
- ⚠️ `Configuration email non disponible` → Vérifiez que SMTP_PASS est rempli dans .env

## ❌ Problèmes courants

### Je ne trouve pas "Mots de passe des applications"
- ✅ **La validation en deux étapes doit être activée** pour voir cette option
- ✅ Allez dans "Sécurité" → "Validation en deux étapes" et activez-la d'abord
- ✅ Une fois activée, l'option apparaîtra dans "Connexion à Google"

### "Invalid login" ou "Authentication failed"
- ✅ Vérifiez que vous utilisez un **mot de passe d'application** (pas votre mot de passe Gmail normal)
- ✅ Vérifiez que la validation en deux étapes est activée
- ✅ Vérifiez qu'il n'y a pas d'espaces dans SMTP_PASS
- ✅ Vérifiez que vous avez copié les 16 caractères sans espaces

### "Connection timeout"
- ✅ Vérifiez votre connexion internet
- ✅ Essayez avec `SMTP_PORT=465` et `SMTP_SECURE=true`

---

**Une fois configuré, tous vos emails auront un design professionnel avec les couleurs de la marque AB Odyssée !** ✨

