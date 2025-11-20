const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const Brevo = require('@getbrevo/brevo');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '../public');
const PRIVATE_DIR = path.join(__dirname, '../private');

// Derrière un proxy (Render, Heroku, etc.), faire confiance au proxy
app.set('trust proxy', 1);

// Configuration CORS pour permettre les sessions
const isDevelopment = process.env.NODE_ENV !== 'production';
const corsOptions = {
  origin: function (origin, callback) {
    // En développement local, être plus permissif
    if (isDevelopment) {
      // Autoriser localhost sur tous les ports et les requêtes sans origin (Postman, etc.)
      if (!origin || 
          origin.includes('localhost') || 
          origin.includes('127.0.0.1') ||
          origin.includes('192.168.') ||
          origin.includes('10.0.') ||
          origin.includes('172.')) {
        callback(null, true);
        return;
      }
    }
    
    // En production, spécifiez vos domaines autorisés
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    // Autoriser les requêtes sans origin ou depuis les domaines autorisés
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Requested-With']
};

// Rate limiting pour la connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'changez-moi-en-production-avec-une-cle-secrete-longue-et-aleatoire',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS en production
    httpOnly: true, // Protection XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    sameSite: 'strict' // Protection CSRF
  },
  name: 'crm-session' // Nom personnalisé pour la sécurité
}));

// Middleware
app.use(cors(corsOptions));

// En-têtes de sécurité HTTP
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Content Security Policy (ajustez selon vos besoins)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https:;");
  next();
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(PUBLIC_DIR));

// Initialisation de la base de données
const dbPath = path.join(__dirname, 'crm.db');
console.log('📁 Chemin de la base de données:', dbPath);

// Ouvrir la base de données en mode persistant (pas en mémoire)
// Mode: OPEN_READWRITE | OPEN_CREATE pour s'assurer que le fichier est créé et accessible en écriture
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    console.error('   Chemin:', dbPath);
  } else {
    console.log('✅ Base de données connectée avec succès:', dbPath);
    // Activer le mode WAL pour de meilleures performances et la persistance
    db.run('PRAGMA journal_mode = WAL;', (err) => {
      if (err) {
        console.warn('⚠️  Impossible d\'activer le mode WAL:', err.message);
      } else {
        console.log('✅ Mode WAL activé pour la persistance');
      }
    });
    // Activer les clés étrangères
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) {
        console.warn('⚠️  Impossible d\'activer les clés étrangères:', err.message);
      }
    });
    initDatabase();
  }
});

// Initialisation des tables
function initDatabase() {
  console.log('🔧 Initialisation de la base de données...');
  
  // Vérifier d'abord combien de clients existent déjà
  db.get('SELECT COUNT(*) as count FROM clients', [], (err, row) => {
    if (err) {
      console.log('ℹ️  Table clients n\'existe pas encore ou erreur:', err.message);
    } else {
      console.log(`📊 Nombre de clients existants dans la base: ${row.count}`);
    }
  });
  
  db.serialize(() => {
    // Table des clients
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      telephone TEXT,
      email TEXT NOT NULL UNIQUE,
      siret TEXT,
      tva_intracommunautaire TEXT,
      service_demande TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'prospect',
      created_by TEXT DEFAULT 'admin',
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table clients:', err.message);
      } else {
        console.log('✅ Table clients initialisée');
        // Migration : ajouter la colonne type si elle n'existe pas (pour les anciennes bases)
        db.all("PRAGMA table_info(clients)", (pragmaErr, columns) => {
          if (pragmaErr) {
            console.error('Erreur lors de la vérification des colonnes:', pragmaErr.message);
            return;
          }
          const hasTypeColumn = columns.some(col => col.name === 'type');
          const hasCreatedByColumn = columns.some(col => col.name === 'created_by');
          
          if (!hasTypeColumn) {
            // SQLite ne supporte pas NOT NULL dans ALTER TABLE ADD COLUMN, on utilise d'abord sans
            db.run(`ALTER TABLE clients ADD COLUMN type TEXT DEFAULT 'prospect'`, (alterErr) => {
              if (alterErr) {
                console.error('Erreur lors de l\'ajout de la colonne type:', alterErr.message);
              } else {
                // Mettre à jour tous les clients existants sans type
                db.run(`UPDATE clients SET type = 'prospect' WHERE type IS NULL OR type = ''`, (updateErr) => {
                  if (updateErr) {
                    console.error('Erreur lors de la mise à jour des types:', updateErr.message);
                  }
                });
              }
            });
          } else {
            // La colonne existe déjà, vérifier et mettre à jour les valeurs NULL
            db.run(`UPDATE clients SET type = 'prospect' WHERE type IS NULL OR type = ''`, (updateErr) => {
              if (updateErr) {
                console.error('Erreur lors de la mise à jour des types existants:', updateErr.message);
              }
            });
          }

          if (!hasCreatedByColumn) {
            db.run(`ALTER TABLE clients ADD COLUMN created_by TEXT DEFAULT 'admin'`, (alterErr) => {
              if (alterErr) {
                console.error('Erreur lors de l\'ajout de la colonne created_by:', alterErr.message);
              } else {
                db.run(`UPDATE clients SET created_by = 'admin' WHERE created_by IS NULL OR created_by = ''`, (updateErr) => {
                  if (updateErr) {
                    console.error('Erreur lors de la mise à jour des created_by:', updateErr.message);
                  }
                });
              }
            });
          } else {
            db.run(`UPDATE clients SET created_by = 'admin' WHERE created_by IS NULL OR created_by = ''`, (updateErr) => {
              if (updateErr) {
                console.error('Erreur lors de la mise à jour des created_by existants:', updateErr.message);
              }
            });
          }
        });
      }
    });

    // Table des échanges
    db.run(`CREATE TABLE IF NOT EXISTS echanges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      sujet TEXT,
      contenu TEXT NOT NULL,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table echanges:', err.message);
      } else {
        console.log('✅ Table echanges initialisée');
      }
    });

    // Table des administrateurs
    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email TEXT,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
      derniere_connexion DATETIME
    )`, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table admins:', err.message);
      } else {
        console.log('✅ Table admins initialisée');
        // Créer les comptes par défaut si nécessaire
        ensureDefaultAccounts();
      }
    });
    
    // Vérifier le nombre total de clients après l'initialisation
    db.get('SELECT COUNT(*) as count FROM clients', [], (err, row) => {
      if (!err && row) {
        console.log(`✅ Initialisation terminée - ${row.count} client(s) dans la base de données`);
      }
    });
  });
}

// Créer les comptes par défaut
function ensureDefaultAccounts() {
  const defaultAccounts = [
    { username: 'admin', password: 'Admin123!', email: 'admin@abodyssee.fr' },
    { username: 'commercial', password: 'Commercial123!', email: 'commercial@abodyssee.fr' }
  ];

  defaultAccounts.forEach((account) => {
    db.get('SELECT id FROM admins WHERE username = ?', [account.username], async (err, row) => {
      if (err) {
        console.error(`Erreur lors de la vérification du compte ${account.username}:`, err.message);
        return;
      }

      if (!row) {
        const hashedPassword = await bcrypt.hash(account.password, 10);
        db.run(
          'INSERT INTO admins (username, password_hash, email) VALUES (?, ?, ?)',
          [account.username, hashedPassword, account.email],
          function(insertErr) {
            if (insertErr) {
              console.error(`Erreur lors de la création du compte ${account.username}:`, insertErr.message);
            } else {
              console.log(`⚠️  COMPTE "${account.username}" CRÉÉ - Username: ${account.username} / Password: ${account.password} ⚠️`);
            }
          }
        );
      }
    });
  });
}

// Middleware d'authentification
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Accès non autorisé. Connexion requise.' });
}

function requireAuthPage(req, res, next) {
  if (req.session && req.session.authenticated && req.session.user) {
    return next();
  }
  return res.redirect('/admin-secret-login-8934');
}

function sendPrivateFile(filePath, res, next) {
  if (!filePath || filePath.trim().length === 0) {
    return res.status(404).send('Fichier introuvable.');
  }

  const normalizedPath = path
    .normalize(filePath)
    .replace(/^(\.\.[/\\])+/, '');
  const absolutePath = path.join(PRIVATE_DIR, normalizedPath);

  if (!absolutePath.startsWith(PRIVATE_DIR)) {
    return res.status(400).send('Chemin invalide.');
  }

  return res.sendFile(absolutePath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).send('Fichier introuvable.');
      }
      if (typeof next === 'function') {
        return next(err);
      }
      throw err;
    }
  });
}

// Route secrète pour la page de login (URL non devinable pour la sécurité)
app.get('/admin-secret-login-8934', (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/admin-crm.html');
  }
  return sendPrivateFile('login.html', res, next);
});

// Routes pour les pages protégées (nécessitent une authentification)
['admin-crm.html', 'inscription-client.html', 'email-template.html'].forEach((file) => {
  app.get(`/${file}`, requireAuthPage, (req, res, next) => {
    return sendPrivateFile(file, res, next);
  });
});

// Route pour servir les fichiers JS depuis private/js (accessibles sans authentification car nécessaires pour le chargement des pages)
app.get('/js/:file(*)', (req, res, next) => {
  const requestedFile = req.params.file || '';
  return sendPrivateFile(`js/${requestedFile}`, res, next);
});

app.get('/private/:file(*)', requireAuth, (req, res, next) => {
  const requestedFile = req.params.file || '';
  return sendPrivateFile(requestedFile, res, next);
});

// Routes d'authentification

// Vérifier le statut d'authentification
app.get('/api/auth/status', (req, res) => {
  res.json({ 
    authenticated: !!(req.session && req.session.authenticated),
    user: req.session.user || null
  });
});

// Connexion
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  // Validation stricte des entrées
  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis.' });
  }

  // Validation de la longueur
  if (typeof username !== 'string' || username.length > 100 || username.trim().length === 0) {
    return res.status(400).json({ error: 'Nom d\'utilisateur invalide.' });
  }

  if (typeof password !== 'string' || password.length > 200 || password.length === 0) {
    return res.status(400).json({ error: 'Mot de passe invalide.' });
  }

  // Validation des caractères autorisés pour le nom d'utilisateur
  if (!/^[a-zA-Z0-9_@.-]+$/.test(username.trim())) {
    return res.status(400).json({ error: 'Nom d\'utilisateur invalide.' });
  }

  const cleanUsername = username.trim();

  db.get('SELECT * FROM admins WHERE username = ?', [cleanUsername], async (err, admin) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur.' });
    }

    if (!admin) {
      // Délai artificiel pour éviter l'énumération des utilisateurs
      await new Promise(resolve => setTimeout(resolve, 500));
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    try {
      const isValid = await bcrypt.compare(password, admin.password_hash);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Identifiants incorrects.' });
      }

      // Mettre à jour la dernière connexion
      db.run('UPDATE admins SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);

      // Créer la session
      req.session.authenticated = true;
      req.session.user = {
        id: admin.id,
        username: admin.username,
        email: admin.email
      };

      res.json({ 
        message: 'Connexion réussie.',
        user: req.session.user
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      // Ne pas révéler d'informations sur l'erreur
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  });
});

// Déconnexion
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la déconnexion.' });
    }
    res.clearCookie('crm-session');
    res.json({ message: 'Déconnexion réussie.' });
  });
});

// Routes API pour les clients - PROTÉGÉES

// Créer un nouveau client
app.post('/api/clients', requireAuth, (req, res) => {
  const { nom, prenom, telephone, email, siret, tva_intracommunautaire, service_demande, type } = req.body;

  if (!nom || !prenom || !email || !service_demande) {
    return res.status(400).json({ error: 'Les champs nom, prénom, email et service demandé sont obligatoires.' });
  }

  // Valider le type
  const validType = type === 'client' || type === 'prospect' ? type : 'prospect';

  // Parser le service_demande si c'est un JSON string, sinon le traiter comme un string simple
  let servicesText;
  try {
    const services = JSON.parse(service_demande);
    if (Array.isArray(services)) {
      servicesText = services.join(', ');
    } else {
      servicesText = service_demande;
    }
  } catch (e) {
    // Si ce n'est pas du JSON, utiliser directement la valeur
    servicesText = service_demande;
  }

  const createdBy = req.session.user?.username || 'admin';

  console.log('📝 Création d\'un nouveau client:', { nom, prenom, email, type: validType });

  db.run(
    `INSERT INTO clients (nom, prenom, telephone, email, siret, tva_intracommunautaire, service_demande, type, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nom, prenom, telephone || null, email, siret || null, tva_intracommunautaire || null, servicesText, validType, createdBy],
    function(err) {
      if (err) {
        console.error('❌ Erreur lors de la création du client:', err.message);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Un client avec cet email existe déjà.' });
        }
        return res.status(500).json({ error: err.message });
      }
      console.log('✅ Client créé avec succès - ID:', this.lastID);
      res.status(201).json({ 
        id: this.lastID, 
        message: 'Client créé avec succès.',
        client: { id: this.lastID, nom, prenom, telephone, email, siret, tva_intracommunautaire, service_demande }
      });
    }
  );
});

// Obtenir tous les clients
app.get('/api/clients', requireAuth, (req, res) => {
  db.all('SELECT id, nom, prenom, telephone, email, siret, tva_intracommunautaire, service_demande, type, created_by, date_creation, date_modification FROM clients ORDER BY date_creation DESC', [], (err, rows) => {
    if (err) {
      console.error('❌ Erreur lors de la récupération des clients:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`📊 Récupération de ${rows.length} client(s) depuis la base de données`);
    // S'assurer que tous les clients ont un type
    rows.forEach(row => {
      if (!row.type) {
        row.type = 'prospect';
      }
    });
    res.json(rows);
  });
});

// Obtenir un client par ID
app.get('/api/clients/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM clients WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Client non trouvé.' });
    }
    res.json(row);
  });
});

// Mettre à jour un client
app.put('/api/clients/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const { nom, prenom, telephone, email, siret, tva_intracommunautaire, service_demande, type } = req.body;

  if (!nom || !prenom || !email || !service_demande) {
    return res.status(400).json({ error: 'Les champs nom, prénom, email et service demandé sont obligatoires.' });
  }

  // Valider le type
  const validType = type === 'client' || type === 'prospect' ? type : 'prospect';

  // Parser le service_demande si c'est un JSON string, sinon le traiter comme un string simple
  let servicesText;
  try {
    const services = JSON.parse(service_demande);
    if (Array.isArray(services)) {
      servicesText = services.join(', ');
    } else {
      servicesText = service_demande;
    }
  } catch (e) {
    // Si ce n'est pas du JSON, utiliser directement la valeur
    servicesText = service_demande;
  }

  const updateParams = [nom, prenom, telephone || null, email, siret || null, tva_intracommunautaire || null, servicesText, validType, id];
  
  db.run(
    `UPDATE clients 
     SET nom = ?, prenom = ?, telephone = ?, email = ?, siret = ?, tva_intracommunautaire = ?, service_demande = ?, type = ?, date_modification = CURRENT_TIMESTAMP
     WHERE id = ?`,
    updateParams,
    function(err) {
      if (err) {
        console.error('Erreur UPDATE:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Client non trouvé.' });
      }
      
      // Vérifier immédiatement après l'UPDATE
      db.get('SELECT id, nom, prenom, telephone, email, siret, tva_intracommunautaire, service_demande, type, created_by, date_creation, date_modification FROM clients WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Erreur SELECT après UPDATE:', err);
          return res.status(500).json({ error: err.message });
        }
        if (!row) {
          console.error('Client non trouvé après UPDATE');
          return res.status(404).json({ error: 'Client non trouvé après la mise à jour.' });
        }
        
        // S'assurer que le type est bien présent
        if (!row.type) {
          row.type = validType;
          // Forcer la mise à jour avec le type
          db.run('UPDATE clients SET type = ? WHERE id = ?', [validType, id], (updateErr) => {
            if (updateErr) {
              console.error('Erreur lors de la mise à jour forcée du type:', updateErr.message);
            }
          });
        }
        
        res.json({ 
          message: 'Client mis à jour avec succès.',
          client: row
        });
      });
    }
  );
});

// Supprimer un client
app.delete('/api/clients/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Client non trouvé.' });
    }
    res.json({ message: 'Client supprimé avec succès.' });
  });
});

// Routes API pour les échanges - PROTÉGÉES

// Créer un nouvel échange
app.post('/api/echanges', requireAuth, (req, res) => {
  const { client_id, type, sujet, contenu } = req.body;

  if (!client_id || !type || !contenu) {
    return res.status(400).json({ error: 'Les champs client_id, type et contenu sont obligatoires.' });
  }

  db.run(
    `INSERT INTO echanges (client_id, type, sujet, contenu)
     VALUES (?, ?, ?, ?)`,
    [client_id, type, sujet || null, contenu],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        id: this.lastID, 
        message: 'Échange créé avec succès.',
        echange: { id: this.lastID, client_id, type, sujet, contenu }
      });
    }
  );
});

// Obtenir tous les échanges d'un client
app.get('/api/clients/:id/echanges', requireAuth, (req, res) => {
  const clientId = req.params.id;
  db.all('SELECT * FROM echanges WHERE client_id = ? ORDER BY date_creation DESC', [clientId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtenir tous les échanges
app.get('/api/echanges', requireAuth, (req, res) => {
  db.all(`
    SELECT e.*, c.nom as client_nom, c.prenom as client_prenom, c.email as client_email
    FROM echanges e
    JOIN clients c ON e.client_id = c.id
    ORDER BY e.date_creation DESC
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Mettre à jour un échange
app.put('/api/echanges/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const { type, sujet, contenu } = req.body;

  db.run(
    `UPDATE echanges 
     SET type = ?, sujet = ?, contenu = ?
     WHERE id = ?`,
    [type, sujet || null, contenu, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Échange non trouvé.' });
      }
      res.json({ message: 'Échange mis à jour avec succès.' });
    }
  );
});

// Supprimer un échange
app.delete('/api/echanges/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM echanges WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Échange non trouvé.' });
    }
    res.json({ message: 'Échange supprimé avec succès.' });
  });
});

// Route pour obtenir un client avec tous ses échanges
app.get('/api/clients/:id/complet', requireAuth, (req, res) => {
  const id = req.params.id;
  
  db.get('SELECT * FROM clients WHERE id = ?', [id], (err, client) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé.' });
    }

    db.all('SELECT * FROM echanges WHERE client_id = ? ORDER BY date_creation DESC', [id], (err, echanges) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ ...client, echanges });
    });
  });
});

// Configuration de l'API Brevo (anciennement Sendinblue)
const brevoApiKey = process.env.BREVO_API_KEY || '';
const brevoEmailRecipient = process.env.CONTACT_EMAIL_TO || process.env.SMTP_USER || 'contact@abodyssee.fr';
const brevoSenderEmail = process.env.CONTACT_EMAIL_FROM || brevoEmailRecipient;
const brevoSenderName = process.env.CONTACT_EMAIL_FROM_NAME || 'AB Odyssée';

let brevoClient = null;

if (brevoApiKey) {
  brevoClient = new Brevo.TransactionalEmailsApi();
  brevoClient.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);
  console.log('✅ API Brevo prête à envoyer des emails');
} else {
  console.warn('⚠️  BREVO_API_KEY non configurée. Les emails ne seront pas envoyés.');
}

// Fonction pour générer le template HTML de l'email
function generateEmailTemplate(data) {
  const date = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const time = new Date().toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td bgcolor="#091A30" style="background-color: #091A30 !important; padding: 0; mso-line-height-rule: exactly;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td bgcolor="#091A30" style="background-color: #091A30 !important; padding: 40px 30px; text-align: center;">
                    <h1 style="color: #FCF9EF !important; margin: 0; font-size: 28px; font-weight: bold; font-family: Arial, sans-serif; mso-line-height-rule: exactly;">Nouveau message depuis AB Odyssée</h1>
                    <p style="color: #B6B4AC !important; margin: 10px 0 0 0; font-size: 14px; mso-line-height-rule: exactly;">Formulaire de contact</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="border-left: 4px solid #B48A3C; padding-left: 20px; margin-bottom: 30px;">
                <h2 style="color: #091A30; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">Informations du contact</h2>
              </div>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5;">
                    <strong style="color: #091A30; font-size: 14px; display: block; margin-bottom: 5px;">👤 Nom complet</strong>
                    <span style="color: #616972; font-size: 16px;">${escapeHtml(data.name)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5;">
                    <strong style="color: #091A30; font-size: 14px; display: block; margin-bottom: 5px;">📧 Email</strong>
                    <a href="mailto:${escapeHtml(data.email)}" style="color: #B48A3C; font-size: 16px; text-decoration: none;">${escapeHtml(data.email)}</a>
                  </td>
                </tr>
                ${data.service ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5;">
                    <strong style="color: #091A30; font-size: 14px; display: block; margin-bottom: 5px;">🎯 Service demandé</strong>
                    <span style="display: inline-block; background-color: #B48A3C; color: #FFFFFF; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 500; margin-top: 5px;">${escapeHtml(data.service)}</span>
                  </td>
                </tr>
                ` : ''}
              </table>
              
              <div style="background-color: #F8F8F8; padding: 20px; border-radius: 6px; margin-top: 25px; border-left: 4px solid #B48A3C;">
                <strong style="color: #091A30; font-size: 14px; display: block; margin-bottom: 10px;">💬 Message</strong>
                <p style="color: #616972; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 25px; border-top: 2px solid #E5E5E5; text-align: center;">
                <p style="color: #616972; font-size: 12px; margin: 0;">Message reçu le ${date} à ${time}</p>
                <p style="color: #B6B4AC; font-size: 11px; margin: 10px 0 0 0; font-style: italic;">AB Odyssée - La visibilité attire, l'inoubliable fidélise.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Fonction pour échapper le HTML (sécurité XSS)
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Route API pour le formulaire de contact
app.post('/api/contact', async (req, res) => {
  const { name, email, service, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Les champs nom, email et message sont obligatoires.' });
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format d\'email invalide.' });
  }

  // Si l'API Brevo n'est pas configurée, retourner une erreur
  if (!brevoClient) {
    console.log('📧 Email non envoyé (API Brevo non configurée):');
    console.log('   Nom:', name);
    console.log('   Email:', email);
    console.log('   Service:', service || 'Non spécifié');
    console.log('   Message:', message);
    console.log('   ⚠️  Pour activer l\'envoi d\'emails, configurez BREVO_API_KEY dans les variables d\'environnement.');
    console.log('   📖 Consultez SETUP-EMAIL-RAPIDE.md pour les instructions');
    return res.status(503).json({ 
      error: 'Service d\'email non configuré.',
      details: 'Le message a été reçu mais l\'email n\'a pas pu être envoyé. Configurez BREVO_API_KEY (voir SETUP-EMAIL-RAPIDE.md).'
    });
  }

  try {
    const emailHtml = generateEmailTemplate({ name, email, service, message });

    await brevoClient.sendTransacEmail({
      sender: {
        email: brevoSenderEmail,
        name: brevoSenderName
      },
      to: [
        {
          email: brevoEmailRecipient
        }
      ],
      replyTo: {
        email,
        name
      },
      subject: `Nouveau message depuis le site AB Odyssée${service ? ` - ${service}` : ''}`,
      htmlContent: emailHtml,
      textContent: `Nouveau message depuis AB Odyssée\n\nNom: ${name}\nEmail: ${email}\n${service ? `Service: ${service}\n` : ''}Message:\n${message}`
    });
    
    res.json({ 
      message: 'Message envoyé avec succès !',
      success: true
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email via Brevo:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

// Fermeture propre de la base de données
function closeDatabase() {
  return new Promise((resolve, reject) => {
    // Vérifier que toutes les opérations sont terminées
    db.run('PRAGMA wal_checkpoint(FULL);', (err) => {
      if (err) {
        console.warn('⚠️  Erreur lors du checkpoint WAL:', err.message);
      } else {
        console.log('✅ Checkpoint WAL effectué - données sauvegardées');
      }
      
      // Fermer la base de données
      db.close((closeErr) => {
        if (closeErr) {
          console.error('❌ Erreur lors de la fermeture de la base de données:', closeErr.message);
          reject(closeErr);
        } else {
          console.log('✅ Connexion à la base de données fermée proprement.');
          resolve();
        }
      });
    });
  });
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur en cours...');
  try {
    await closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la fermeture:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur en cours...');
  try {
    await closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la fermeture:', err);
    process.exit(1);
  }
});
