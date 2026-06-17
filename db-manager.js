/**
 * Database Manager for Kisan Connect
 * Handles database operations, transactions, and error handling
 */

const Database = require('better-sqlite3');
const path = require('path');
const utils = require('./utils');

/**
 * Initialize and configure SQLite database
 * @returns {Database} Configured database instance
 */
function initializeDatabase() {
  const dbPath = path.join(__dirname, 'kisan_connect.db');
  const db = new Database(dbPath);
  
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  return db;
}

/**
 * Create database tables and indexes
 * @param {Database} db - Database instance
 */
function createTables(db) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS farmers (
        id TEXT PRIMARY KEY,
        farmerName TEXT NOT NULL,
        password TEXT,
        pinCode TEXT,
        state TEXT,
        district TEXT,
        taluk TEXT,
        village TEXT,
        villageDistrict TEXT,
        phoneNumber TEXT,
        crops TEXT,
        cropType TEXT,
        quantity INTEGER,
        price REAL,
        registeredAt TEXT,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS buyers (
        id TEXT PRIMARY KEY,
        buyerName TEXT NOT NULL,
        password TEXT,
        businessName TEXT,
        buyerPhone TEXT,
        requiredCrop TEXT,
        quantityNeeded INTEGER,
        registeredAt TEXT,
        updatedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        contactName TEXT,
        contactEmail TEXT,
        contactSubject TEXT,
        contactMessage TEXT,
        submittedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'farmer',
        createdAt TEXT,
        lastLogin TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_farmers_name ON farmers(farmerName);
      CREATE INDEX IF NOT EXISTS idx_farmers_crop ON farmers(cropType);
      CREATE INDEX IF NOT EXISTS idx_farmers_location ON farmers(state, district, taluk);
      CREATE INDEX IF NOT EXISTS idx_buyers_crop ON buyers(requiredCrop);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(contactEmail);
    `);
    
    utils.log('INFO', '✅ Database tables and indexes created successfully');
  } catch (error) {
    utils.log('ERROR', 'Failed to create database tables', error.message);
    throw error;
  }
}

/**
 * Run database migrations
 * @param {Database} db - Database instance
 */
function runMigrations(db) {
  const migrations = [
    { table: 'farmers', column: 'password', definition: 'TEXT' },
    { table: 'farmers', column: 'updatedAt', definition: 'TEXT' },
    { table: 'buyers', column: 'password', definition: 'TEXT' },
    { table: 'buyers', column: 'updatedAt', definition: 'TEXT' },
    { table: 'users', column: 'lastLogin', definition: 'TEXT' },
  ];

  for (const migration of migrations) {
    try {
      db.exec(`ALTER TABLE ${migration.table} ADD COLUMN ${migration.column} ${migration.definition}`);
      utils.log('INFO', `✅ Migration: Added column '${migration.column}' to '${migration.table}'`);
    } catch (err) {
      // Column already exists - this is expected on subsequent runs
      if (!err.message.includes('duplicate column name')) {
        utils.log('ERROR', `Migration error for ${migration.table}.${migration.column}`, err.message);
      }
    }
  }
}

/**
 * Execute operation with error handling
 * @param {function} operation - Database operation to execute
 * @param {string} operationName - Name of operation for logging
 * @returns {object} {success: boolean, data: any, error: string}
 */
async function executeWithErrorHandling(operation, operationName) {
  try {
    const result = await operation();
    utils.log('INFO', `✅ ${operationName} completed successfully`);
    return { success: true, data: result };
  } catch (error) {
    utils.log('ERROR', `❌ ${operationName} failed`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Execute database transaction
 * @param {Database} db - Database instance
 * @param {function} transaction - Transaction function
 * @param {string} transactionName - Name of transaction for logging
 * @returns {object} {success: boolean, data: any, error: string}
 */
function executeTransaction(db, transaction, transactionName) {
  try {
    const transactionFn = db.transaction(transaction);
    const result = transactionFn();
    utils.log('INFO', `✅ Transaction '${transactionName}' completed successfully`);
    return { success: true, data: result };
  } catch (error) {
    utils.log('ERROR', `❌ Transaction '${transactionName}' failed`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Validate data before database insertion
 * @param {string} type - Type of data (farmer, buyer, user, contact)
 * @param {object} data - Data to validate
 * @returns {object} {valid: boolean, errors: array}
 */
function validateDataBeforeInsert(type, data) {
  const errors = [];
  
  switch (type) {
    case 'farmer':
      if (!data.farmerName || !data.farmerName.trim()) errors.push('Farmer name is required');
      if (data.phoneNumber && !utils.isValidPhoneNumber(data.phoneNumber)) {
        errors.push('Invalid phone number format');
      }
      break;
      
    case 'buyer':
      if (!data.buyerName || !data.buyerName.trim()) errors.push('Buyer name is required');
      if (data.buyerPhone && !utils.isValidPhoneNumber(data.buyerPhone)) {
        errors.push('Invalid phone number format');
      }
      break;
      
    case 'user':
      if (!data.username || !data.username.trim()) errors.push('Username is required');
      if (!data.password) errors.push('Password is required');
      const pwValidation = utils.validatePasswordStrength(data.password);
      if (!pwValidation.valid) errors.push(...pwValidation.errors);
      break;
      
    case 'contact':
      if (!data.contactName || !data.contactName.trim()) errors.push('Contact name is required');
      if (!utils.isValidEmail(data.contactEmail)) errors.push('Invalid email address');
      if (!data.contactMessage || !data.contactMessage.trim()) errors.push('Message is required');
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get database statistics
 * @param {Database} db - Database instance
 * @returns {object} Database statistics
 */
function getDbStats(db) {
  try {
    return {
      farmers: db.prepare('SELECT COUNT(*) as count FROM farmers').get().count,
      buyers: db.prepare('SELECT COUNT(*) as count FROM buyers').get().count,
      contacts: db.prepare('SELECT COUNT(*) as count FROM contacts').get().count,
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      activeSessions: db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expiresAt > ?').get(utils.getTimestamp()).count,
      timestamp: utils.getTimestamp()
    };
  } catch (error) {
    utils.log('ERROR', 'Failed to get database stats', error.message);
    return null;
  }
}

/**
 * Perform database backup (checkpoint)
 * @param {Database} db - Database instance
 * @returns {boolean} True if successful
 */
function backupDatabase(db) {
  try {
    db.exec('PRAGMA wal_checkpoint(RESTART)');
    utils.log('INFO', '✅ Database backup/checkpoint completed');
    return true;
  } catch (error) {
    utils.log('ERROR', 'Database backup failed', error.message);
    return false;
  }
}

module.exports = {
  initializeDatabase,
  createTables,
  runMigrations,
  executeWithErrorHandling,
  executeTransaction,
  validateDataBeforeInsert,
  getDbStats,
  backupDatabase
};
