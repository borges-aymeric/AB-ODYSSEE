#!/usr/bin/env node
/**
 * Script sécurisé pour créer un compte administrateur
 * Usage: node server/create-admin.js username password email
 * 
 * Ce script permet de créer un compte admin directement dans la base de données
 * sans avoir à mettre les identifiants dans le code ou les variables d'environnement
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcrypt');
const dbModule = require('./db');
const { initDatabase, adaptSQL } = dbModule;

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('❌ Usage: node server/create-admin.js <username> <password> <email>');
    console.error('   Exemple: node server/create-admin.js admin MonMotDePasseSecurise123! admin@abodyssee.fr');
    process.exit(1);
  }
  
  const [username, password, email] = args;
  
  // Validation
  if (!username || !password || !email) {
    console.error('❌ Tous les paramètres sont requis: username, password, email');
    process.exit(1);
  }
  
  if (password.length < 8) {
    console.error('❌ Le mot de passe doit contenir au moins 8 caractères');
    process.exit(1);
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('❌ Format d\'email invalide');
    process.exit(1);
  }
  
  try {
    console.log('🔐 Connexion à la base de données...');
    const db = await initDatabase();
    
    // Vérifier si le compte existe déjà
    const existing = await db.get(adaptSQL('SELECT id FROM admins WHERE username = ?'), [username]);
    
    if (existing) {
      console.error(`❌ Le compte "${username}" existe déjà`);
      process.exit(1);
    }
    
    // Hasher le mot de passe
    console.log('🔒 Hashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insérer le compte
    let insertSQL = adaptSQL('INSERT INTO admins (username, password_hash, email) VALUES (?, ?, ?)');
    if (dbModule.dbType === 'postgresql' || process.env.DATABASE_URL) {
      insertSQL = insertSQL.replace(/;$/, ' RETURNING id');
    }
    
    const result = await db.run(insertSQL, [username, hashedPassword, email]);
    
    console.log('✅ Compte administrateur créé avec succès !');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   ID: ${result.lastID || 'N/A'}`);
    
    // Fermer la connexion
    if (dbModule.dbType === 'sqlite' && db.close) {
      db.close();
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

createAdmin();

