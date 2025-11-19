# Guide de Sécurité - AB Odyssée CRM

## 🔒 Sécurité en Développement Local

Le système est actuellement configuré pour le développement local. Les mesures de sécurité suivantes sont en place :

### ✅ Mesures de Sécurité Actuelles

1. **Authentification par session**
   - Cookies HTTP-only (protection XSS)
   - SameSite strict (protection CSRF)
   - Sessions avec expiration (24h)

2. **Protection contre les attaques**
   - Rate limiting (5 tentatives / 15 min pour la connexion)
   - Mots de passe hashés avec bcrypt (10 rounds)
   - Validation stricte des entrées (côté client et serveur)
   - Protection XSS (échappement HTML)

3. **En-têtes de sécurité HTTP**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection
   - Content-Security-Policy
   - Referrer-Policy

4. **Protection des routes**
   - Toutes les routes API CRM sont protégées
   - Vérification d'authentification avant chaque requête
   - Protection des pages HTML avec redirection

## 🚀 Avant la Mise en Production

### Actions Obligatoires :

1. **Changer les identifiants par défaut**
   ```bash
   # Connectez-vous et changez le mot de passe admin
   # L'admin par défaut est : admin / Admin123!
   ```

2. **Configurer les variables d'environnement**
   ```bash
   # Créer un fichier .env avec :
   NODE_ENV=production
   PORT=3000
   SESSION_SECRET=une-cle-secrete-tres-longue-et-aleatoire-changez-moi
   ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
   ```

3. **Activer HTTPS**
   - Obtenir un certificat SSL/TLS (Let's Encrypt gratuit)
   - Configurer votre serveur web (nginx, Apache) pour HTTPS
   - Rediriger tout le trafic HTTP vers HTTPS

4. **Sécuriser la base de données**
   - Changer le chemin de la base de données si nécessaire
   - Configurer des sauvegardes régulières
   - Limiter l'accès au fichier `crm.db`

5. **Configurer CORS pour production**
   - Mettre à jour `ALLOWED_ORIGINS` avec vos domaines réels
   - Ne pas utiliser `origin: true` en production

6. **Renforcer la Content Security Policy**
   - Ajuster la CSP selon vos besoins réels
   - Retirer `'unsafe-inline'` si possible

7. **Configurer les logs**
   - Activer les logs d'audit pour les connexions
   - Surveiller les tentatives de connexion échouées
   - Configurer des alertes pour les activités suspectes

8. **Sauvegardes**
   - Configurer des sauvegardes automatiques de la base de données
   - Tester la restauration des sauvegardes

### Bonnes Pratiques Supplémentaires :

- ✅ Utiliser un gestionnaire de processus (PM2) en production
- ✅ Configurer un firewall
- ✅ Limiter les ports exposés
- ✅ Mettre à jour régulièrement les dépendances (`npm audit`)
- ✅ Utiliser une authentification à deux facteurs (2FA) si possible
- ✅ Configurer des limites de taille pour les requêtes
- ✅ Surveiller les performances et les erreurs

## 🔐 Identifiants par Défaut

⚠️ **IMPORTANT : Ces identifiants doivent être changés avant la mise en production !**

- **Username:** `admin`
- **Password:** `Admin123!`

## 📝 Notes de Développement

En développement local, certaines restrictions sont assouplies :
- CORS autorise localhost sur tous les ports
- Les erreurs détaillées sont affichées dans la console
- HTTPS n'est pas obligatoire

## 🛡️ Protection Actuelle

Même en développement local, le système protège contre :
- ✅ Injection SQL (requêtes paramétrées)
- ✅ XSS (Cross-Site Scripting)
- ✅ CSRF (Cross-Site Request Forgery)
- ✅ Force brute (rate limiting)
- ✅ Énumération d'utilisateurs (délais artificiels)
- ✅ Exposition de mots de passe (hashage bcrypt)

## 📞 Support

En cas de questions sur la sécurité, consultez la documentation ou contactez l'administrateur système.

