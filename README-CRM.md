# CRM - AB Odyssée

Système de gestion de la relation client (CRM) pour AB Odyssée.

## Installation

1. Installer les dépendances :
```bash
npm install
```

## Démarrage du serveur

Pour démarrer le serveur backend :
```bash
npm start
```

Le serveur sera accessible sur `http://localhost:3000`

## Fonctionnalités

### 1. Formulaire d'inscription client
- Page : `inscription-client.html`
- Permet de créer un compte client avec les informations suivantes :
  - Nom (obligatoire)
  - Prénom (obligatoire)
  - Numéro de téléphone
  - Email (obligatoire, unique)
  - SIRET
  - Numéro de TVA intracommunautaire
  - Service demandé (obligatoire)

### 2. Interface d'administration CRM
- Page : `admin-crm.html`
- Fonctionnalités :
  - Visualisation de tous les clients
  - Recherche et filtrage par service
  - Statistiques (total clients, échanges, clients du mois)
  - Voir les détails d'un client avec tous ses échanges
  - Modifier les informations d'un client
  - Supprimer un client

### 3. Gestion des échanges
- Créer un nouvel échange pour un client
- Types d'échanges disponibles :
  - Appel téléphonique
  - Email
  - Réunion
  - Note interne
  - Devis
  - Facture
  - Autre
- Modifier un échange existant
- Supprimer un échange

## Base de données

La base de données SQLite (`crm.db`) sera créée automatiquement au premier démarrage du serveur.

### Structure des tables

#### Table `clients`
- `id` (INTEGER, PRIMARY KEY)
- `nom` (TEXT, NOT NULL)
- `prenom` (TEXT, NOT NULL)
- `telephone` (TEXT)
- `email` (TEXT, NOT NULL, UNIQUE)
- `siret` (TEXT)
- `tva_intracommunautaire` (TEXT)
- `service_demande` (TEXT, NOT NULL)
- `date_creation` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `date_modification` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

#### Table `echanges`
- `id` (INTEGER, PRIMARY KEY)
- `client_id` (INTEGER, NOT NULL, FOREIGN KEY)
- `type` (TEXT, NOT NULL)
- `sujet` (TEXT)
- `contenu` (TEXT, NOT NULL)
- `date_creation` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

## API Endpoints

### Clients
- `GET /api/clients` - Obtenir tous les clients
- `GET /api/clients/:id` - Obtenir un client par ID
- `GET /api/clients/:id/complet` - Obtenir un client avec tous ses échanges
- `POST /api/clients` - Créer un nouveau client
- `PUT /api/clients/:id` - Mettre à jour un client
- `DELETE /api/clients/:id` - Supprimer un client

### Échanges
- `GET /api/echanges` - Obtenir tous les échanges
- `GET /api/clients/:id/echanges` - Obtenir tous les échanges d'un client
- `POST /api/echanges` - Créer un nouvel échange
- `PUT /api/echanges/:id` - Mettre à jour un échange
- `DELETE /api/echanges/:id` - Supprimer un échange

## Utilisation

1. Démarrer le serveur : `npm start`
2. Ouvrir `inscription-client.html` dans le navigateur pour créer un nouveau client
3. Ouvrir `admin-crm.html` pour gérer les clients et leurs échanges

## Notes

- Le fichier de base de données `crm.db` sera créé automatiquement dans le dossier `server/`
- Le serveur doit être démarré pour que les fonctionnalités CRM fonctionnent
- Les fichiers HTML peuvent être ouverts directement dans le navigateur, mais nécessitent le serveur pour les appels API

