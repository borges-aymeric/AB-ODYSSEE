# Configuration de l'envoi d'emails

Pour que le formulaire de contact envoie des emails avec un beau template HTML, vous devez configurer les paramètres SMTP.

## Configuration rapide avec Gmail

### Étape 1 : Créer un mot de passe d'application Gmail

1. Allez sur votre compte Google : https://myaccount.google.com/
2. Activez la **validation en deux étapes** si ce n'est pas déjà fait
3. Allez dans **Sécurité** → **Mots de passe des applications**
4. Créez un nouveau mot de passe d'application pour "Mail"
5. Copiez le mot de passe généré (16 caractères)

### Étape 2 : Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-d-application
```

**⚠️ Important** : Ne commitez jamais le fichier `.env` dans Git ! Il est déjà dans `.gitignore`.

### Étape 3 : Redémarrer le serveur

```bash
npm start
```

## Configuration avec d'autres services SMTP

### Outlook / Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-mot-de-passe
```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=votre-api-key-sendgrid
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@mailgun.org
SMTP_PASS=votre-mot-de-passe
```

## Test de la configuration

Une fois configuré, testez le formulaire de contact sur http://localhost:3000/contact.html

Si la configuration est correcte, vous recevrez un email avec un beau template HTML personnalisé.

## Dépannage

### Erreur : "Service d'email non configuré"

- Vérifiez que le fichier `.env` existe et contient les bonnes variables
- Redémarrez le serveur après avoir créé/modifié le fichier `.env`

### Erreur : "Invalid login"

- Pour Gmail : Vérifiez que vous utilisez un **mot de passe d'application** et non votre mot de passe normal
- Vérifiez que la validation en deux étapes est activée
- Vérifiez que les identifiants sont corrects

### Erreur : "Connection timeout"

- Vérifiez votre connexion internet
- Vérifiez que le port SMTP n'est pas bloqué par un firewall
- Essayez avec `SMTP_SECURE=true` et `SMTP_PORT=465` pour Gmail

## Sécurité

- ⚠️ **Ne partagez jamais** votre fichier `.env`
- ⚠️ **Ne commitez jamais** le fichier `.env` dans Git
- ⚠️ Utilisez des **mots de passe d'application** plutôt que vos mots de passe principaux
- ⚠️ En production, utilisez des variables d'environnement sécurisées (Heroku, Vercel, etc.)

## Template HTML

Le template email est généré automatiquement avec :
- ✅ Design professionnel avec les couleurs de la marque AB Odyssée
- ✅ En-tête avec dégradé bleu foncé
- ✅ Informations structurées et lisibles
- ✅ Badge coloré pour le service demandé
- ✅ Section mise en évidence pour le message
- ✅ Date et heure de réception
- ✅ Slogan de l'entreprise

Le template est compatible avec tous les clients email modernes (Gmail, Outlook, Apple Mail, etc.).

