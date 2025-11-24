const path = require('path');

// Détecter le type de base de données à utiliser
// Si DATABASE_URL est défini (Render, Heroku, etc.), utiliser PostgreSQL
// Sinon, utiliser SQLite pour le développement local
const usePostgreSQL = !!process.env.DATABASE_URL;

let db = null;
let dbType = null;

// Interface unifiée pour les opérations de base de données
const dbInterface = {
  // Exécuter une requête qui ne retourne rien (CREATE, INSERT, UPDATE, DELETE)
  run: function(query, params = []) {
    if (dbType === 'postgresql') {
      // PostgreSQL retourne une promesse
      return db.query(query, params)
        .then(result => {
          // Pour INSERT, récupérer l'ID depuis RETURNING ou la dernière ligne insérée
          return {
            lastID: result.rows?.[0]?.id || null,
            changes: result.rowCount || 0
          };
        });
    } else {
      // SQLite utilise des callbacks
      return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              lastID: this.lastID,
              changes: this.changes 
            });
          }
        });
      });
    }
  },

  // Obtenir une seule ligne
  get: function(query, params = []) {
    if (dbType === 'postgresql') {
      return db.query(query, params)
        .then(result => result.rows?.[0] || null);
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        });
      });
    }
  },

  // Obtenir plusieurs lignes
  all: function(query, params = []) {
    if (dbType === 'postgresql') {
      return db.query(query, params)
        .then(result => result.rows || []);
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        });
      });
    }
  },

  // Exécuter plusieurs requêtes en série (pour SQLite)
  serialize: function(callback) {
    if (dbType === 'postgresql') {
      // PostgreSQL n'a pas besoin de serialize, on exécute directement
      callback();
    } else {
      // SQLite
      db.serialize(callback);
    }
  },

  // Obtenir le type de base de données
  getType: function() {
    return dbType;
  },

  // Fermer la connexion
  close: function(callback) {
    if (dbType === 'postgresql') {
      db.end()
        .then(() => callback && callback(null))
        .catch(err => callback && callback(err));
    } else {
      db.close(callback);
    }
  }
};

// Initialiser la connexion à la base de données
async function initDatabase() {
  // Logs de debug pour vérifier la détection
  console.log('🔍 Vérification de la configuration de la base de données...');
  console.log('   DATABASE_URL définie:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    // Masquer le mot de passe dans les logs
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
    console.log('   URL (masquée):', maskedUrl);
  }
  console.log('   Type de base détecté:', usePostgreSQL ? 'PostgreSQL' : 'SQLite');
  
  if (usePostgreSQL) {
    // Utiliser PostgreSQL
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test de connexion
    try {
      await pool.query('SELECT NOW()');
      console.log('✅ Base de données PostgreSQL connectée avec succès');
      dbType = 'postgresql';
      db = pool;
      return dbInterface;
    } catch (err) {
      console.error('❌ Erreur de connexion à PostgreSQL:', err.message);
      console.error('   Détails:', err);
      throw err;
    }
  } else {
    // Utiliser SQLite pour le développement local
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'crm.db');
    
    return new Promise((resolve, reject) => {
      const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('❌ Erreur de connexion à SQLite:', err.message);
          reject(err);
          return;
        }

        console.log('✅ Base de données SQLite connectée avec succès:', dbPath);
        dbType = 'sqlite';
        db = sqliteDb;

        // Activer le mode WAL pour SQLite
        db.run('PRAGMA journal_mode = WAL;', (err) => {
          if (err) {
            console.warn('⚠️  Impossible d\'activer le mode WAL:', err.message);
          } else {
            console.log('✅ Mode WAL activé pour SQLite');
          }
        });

        // Activer les clés étrangères
        db.run('PRAGMA foreign_keys = ON;', (err) => {
          if (err) {
            console.warn('⚠️  Impossible d\'activer les clés étrangères:', err.message);
          }
        });

        resolve(dbInterface);
      });
    });
  }
}

// Fonction pour adapter les requêtes SQL selon le type de base
function adaptSQL(sql) {
  // Déterminer le type de base de données à utiliser
  const currentDbType = dbType || (usePostgreSQL ? 'postgresql' : 'sqlite');
  
  if (currentDbType === 'postgresql') {
    // Convertir SQLite vers PostgreSQL
    let adapted = sql
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/DATETIME/gi, 'TIMESTAMP')
      .replace(/TEXT/gi, 'VARCHAR(255)')
      .replace(/CURRENT_TIMESTAMP/gi, 'CURRENT_TIMESTAMP');
    
    // Convertir les ? en $1, $2, etc. pour PostgreSQL
    let paramIndex = 1;
    adapted = adapted.replace(/\?/g, () => `$${paramIndex++}`);
    
    return adapted;
  }
  return sql;
}

// Fonction pour vérifier si une colonne existe
async function columnExists(tableName, columnName) {
  if (!dbType) {
    // Si pas encore initialisé, utiliser usePostgreSQL
    if (usePostgreSQL) {
      // On ne peut pas vérifier sans connexion, retourner false
      return false;
    }
  }
  
  if (dbType === 'postgresql') {
    const result = await dbInterface.get(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = $1 AND column_name = $2`,
      [tableName, columnName]
    );
    return !!result;
  } else {
    // SQLite
    const columns = await dbInterface.all("PRAGMA table_info(" + tableName + ")");
    return columns.some(col => col.name === columnName);
  }
}

module.exports = {
  initDatabase,
  dbInterface,
  adaptSQL,
  columnExists,
  get db() { return dbInterface; },
  get dbType() { return dbType; }
};

