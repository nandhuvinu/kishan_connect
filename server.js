/**
 * Kisan Connect Server
 * Agricultural marketplace platform connecting farmers and buyers
 * 
 * Features:
 * - Farmer and Buyer registration and login
 * - Direct marketplace matching
 * - Contact management
 * - Advanced search and filtering
 * - Session-based authentication
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const utils = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const rateLimit = new Map();
const MAX_REQUESTS = 100;
const WINDOW_MS = 60000; // 1 minute

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting middleware
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, startTime: now });
  } else {
    const record = rateLimit.get(ip);
    if (record.startTime < windowStart) {
      rateLimit.set(ip, { count: 1, startTime: now });
    } else {
      record.count++;
      if (record.count > MAX_REQUESTS) {
        utils.log('WARN', 'Rate limit exceeded', { ip });
        return res.status(429).json(utils.createResponse(429, null, 'Too many requests. Please try again later.'));
      }
    }
  }
  next();
});

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, '.')));

// Initialize SQLite Database with WAL mode for better concurrency
const db = new Database(path.join(__dirname, 'kisan_connect.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Create tables with indexes
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
`);

// Run migrations to add missing columns to existing tables
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
    console.log(`✅ Migration: Added column '${migration.column}' to '${migration.table}'`);
  } catch (err) {
    // Column already exists - this is expected on subsequent runs
    if (!err.message.includes('duplicate column name')) {
      console.error(`Migration error for ${migration.table}.${migration.column}:`, err.message);
    }
  }
}

console.log('✅ Database initialized with indexes for optimized queries');

// Helper functions
/**
 * Generate unique session token
 * @returns {string} Random token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify and retrieve session token
 * @param {string} token - Session token
 * @returns {object|null} Session object or null if invalid
 */
function verifyToken(token) {
  try {
    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return null;
    }
    return session;
  } catch (error) {
    utils.log('ERROR', 'Token verification failed', error.message);
    return null;
  }
}

/**
 * Pagination helper
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Items per page (default 20)
 * @returns {object} Pagination parameters
 */
function paginate(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return { limit: Math.min(limit, 100), offset };
}

// ============ API Routes ============

/**
 * GET /api/farmers - Retrieve all registered farmers
 * @returns {array} Array of farmer objects
 */
app.get('/api/farmers', (req, res) => {
  try {
    const farmers = db.prepare('SELECT * FROM farmers').all();
    utils.log('INFO', 'Fetched farmers', { count: farmers.length });
    res.json(utils.createResponse(200, farmers, 'Farmers fetched successfully'));
  } catch (error) {
    utils.log('ERROR', 'Failed to fetch farmers', error.message);
    res.status(500).json(utils.createResponse(500, null, 'Failed to fetch farmers'));
  }
});

/**
 * GET /api/buyers - Retrieve all registered buyers
 * @returns {array} Array of buyer objects
 */
app.get('/api/buyers', (req, res) => {
  try {
    const buyers = db.prepare('SELECT * FROM buyers').all();
    utils.log('INFO', 'Fetched buyers', { count: buyers.length });
    res.json(utils.createResponse(200, buyers, 'Buyers fetched successfully'));
  } catch (error) {
    utils.log('ERROR', 'Failed to fetch buyers', error.message);
    res.status(500).json(utils.createResponse(500, null, 'Failed to fetch buyers'));
  }
});

/**
 * POST /api/farmers/register - Register new farmer with location details
 * @param {string} farmerName - Farmer's name
 * @param {string} password - Account password
 * @param {object} crops - Array of crops and details
 * @returns {object} Registered farmer data with redirect URL
 */
app.post('/api/farmers/register', (req, res) => {
  const { farmerName, password, pinCode, state, district, taluk, village, crops } = req.body;

  // Validate required fields
  const validation = utils.validateRequiredFields({ farmerName }, ['farmerName']);
  if (!validation.valid) {
    return res.status(400).json(utils.createResponse(400, null, validation.errors[0]));
  }

  const id = utils.generateId();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO farmers (id, farmerName, password, pinCode, state, district, taluk, village, crops, registeredAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, farmerName, password, pinCode, state, district, taluk, village, JSON.stringify(crops || []), utils.getTimestamp());

    utils.log('INFO', 'New farmer registered', { id, farmerName });
    res.status(201).json(utils.createResponse(201, {
      id,
      farmerName,
      registeredAt: utils.getTimestamp(),
      redirectUrl: `/farmer-dashboard.html?id=${id}`
    }, 'Farmer registered successfully'));
  } catch (error) {
    utils.log('ERROR', 'Farmer registration failed', error.message);
    res.status(500).json(utils.createResponse(500, null, 'Failed to register farmer'));
  }
});

// Farmer registration (old format for backward compatibility)
app.post('/api/farmers', (req, res) => {
  const { farmerName, villageDistrict, phoneNumber, cropType, quantity, price } = req.body;

  if (!farmerName || !villageDistrict || !phoneNumber || !cropType || !quantity || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const id = Date.now().toString();

  try {
    const stmt = db.prepare(`
      INSERT INTO farmers (id, farmerName, villageDistrict, phoneNumber, cropType, quantity, price, registeredAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, farmerName, villageDistrict, phoneNumber, cropType, parseInt(quantity), parseFloat(price), getTimestamp());

    res.status(201).json({
      message: 'Farmer registered successfully',
      redirectUrl: `/farmer-dashboard.html?id=${id}`,
      farmer: { id, farmerName, villageDistrict, phoneNumber, cropType, quantity: parseInt(quantity), price: parseFloat(price), registeredAt: getTimestamp() }
    });
  } catch (error) {
    console.error('Error registering farmer:', error);
    res.status(500).json({ error: 'Failed to register farmer' });
  }
});

// Buyer registration
app.post('/api/buyers', (req, res) => {
  const { buyerName, password, businessName, buyerPhone, requiredCrop, quantityNeeded } = req.body;

  if (!buyerName || !password) {
    return res.status(400).json({ error: 'Buyer name and password are required' });
  }

  const id = Date.now().toString();

  try {
    const stmt = db.prepare(`
      INSERT INTO buyers (id, buyerName, password, businessName, buyerPhone, requiredCrop, quantityNeeded, registeredAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, buyerName, password, businessName, buyerPhone, requiredCrop, parseInt(quantityNeeded || 0), getTimestamp());

    res.status(201).json({
      message: 'Buyer registered successfully',
      redirectUrl: `/buyer-market.html?id=${id}`,
      buyer: { id, buyerName, password, businessName, buyerPhone, requiredCrop, quantityNeeded: parseInt(quantityNeeded || 0), registeredAt: getTimestamp() }
    });
  } catch (error) {
    console.error('Error registering buyer:', error);
    res.status(500).json({ error: 'Failed to register buyer' });
  }
});

// Contact form submission
app.post('/api/contact', (req, res) => {
  const { contactName, contactEmail, contactSubject, contactMessage } = req.body;

  if (!contactName || !contactEmail || !contactSubject || !contactMessage) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const id = Date.now().toString();

  try {
    const stmt = db.prepare(`
      INSERT INTO contacts (id, contactName, contactEmail, contactSubject, contactMessage, submittedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, contactName, contactEmail, contactSubject, contactMessage, getTimestamp());

    res.status(201).json({
      message: 'Message sent successfully',
      contact: { id, contactName, contactEmail, contactSubject, contactMessage, submittedAt: getTimestamp() }
    });
  } catch (error) {
    console.error('Error submitting contact:', error);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

// Get contact messages (for admin)
app.get('/api/contacts', (req, res) => {
  try {
    const contacts = db.prepare('SELECT * FROM contacts').all();
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// User registration (for login system)
app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const id = Date.now().toString();
  const userRole = role || 'farmer';

  try {
    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const stmt = db.prepare(`
      INSERT INTO users (id, username, password, role, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, username, password, userRole, getTimestamp());

    res.status(201).json({
      message: 'User registered successfully',
      user: { id, username, role: userRole, createdAt: getTimestamp() }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    
    if (user) {
      res.status(200).json({
        message: 'Login successful',
        user: { id: user.id, username: user.username, role: user.role }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Farmer login (new - name and password only)
app.post('/api/farmer-login', (req, res) => {
  const { farmerName, password } = req.body;

  if (!farmerName || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  try {
    const farmer = db.prepare('SELECT * FROM farmers WHERE farmerName = ? AND password = ?').get(farmerName, password);

    if (farmer) {
      res.status(200).json({
        message: 'Login successful',
        redirectUrl: `/farmer-dashboard.html?id=${farmer.id}`,
        farmer: farmer
      });
    } else {
      res.status(401).json({ error: 'Invalid name or password' });
    }
  } catch (error) {
    console.error('Error during farmer login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Buyer login (new - name and password only)
app.post('/api/buyer-login', (req, res) => {
  const { buyerName, password } = req.body;

  if (!buyerName || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  try {
    const buyer = db.prepare('SELECT * FROM buyers WHERE buyerName = ? AND password = ?').get(buyerName, password);

    if (buyer) {
      res.status(200).json({
        message: 'Login successful',
        redirectUrl: `/buyer-market.html?id=${buyer.id}`,
        buyer: buyer
      });
    } else {
      res.status(401).json({ error: 'Invalid name or password' });
    }
  } catch (error) {
    console.error('Error during buyer login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===============================
// MATCHING LOGIC (NEW ROUTES)
// ===============================

// Get matching farmers for a buyer
app.get('/api/buyer/:id/matching-farmers', (req, res) => {
  const buyerId = req.params.id;

  try {
    const buyer = db.prepare(
      'SELECT requiredCrop FROM buyers WHERE id = ?'
    ).get(buyerId);

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    const farmers = db.prepare(`
      SELECT farmerName, cropType, quantity, price,
             villageDistrict, state, district, taluk, phoneNumber
      FROM farmers
      WHERE cropType = ?
    `).all(buyer.requiredCrop);

    res.json(farmers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matching farmers' });
  }
});


// Get matching buyers for a farmer
app.get('/api/farmer/:id/matching-buyers', (req, res) => {
  const farmerId = req.params.id;

  try {
    const farmer = db.prepare(
      'SELECT cropType FROM farmers WHERE id = ?'
    ).get(farmerId);

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    const buyers = db.prepare(`
      SELECT buyerName, requiredCrop, quantityNeeded,
             businessName, buyerPhone
      FROM buyers
      WHERE requiredCrop = ?
    `).all(farmer.cropType);

    res.json(buyers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matching buyers' });
  }
});

// Get all farmers (for buyer market - seller list)
app.get('/api/sellers', (req, res) => {
  try {
    const farmers = db.prepare(`
      SELECT id, farmerName, cropType, quantity, price, village, villageDistrict, phoneNumber
      FROM farmers
      ORDER BY registeredAt DESC
    `).all();
    res.json(farmers);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// Get all buyers (for farmer dashboard - buyer demand list)
app.get('/api/buyers/demands', (req, res) => {
  try {
    const buyers = db.prepare(`
      SELECT id, buyerName, requiredCrop, quantityNeeded, businessName, buyerPhone
      FROM buyers
      ORDER BY registeredAt DESC
    `).all();
    res.json(buyers);
  } catch (error) {
    console.error('Error fetching buyer demands:', error);
    res.status(500).json({ error: 'Failed to fetch buyer demands' });
  }
});

// ============ UPDATE Endpoints ============

// Update farmer by ID
app.put('/api/farmers/:id', (req, res) => {
  const { id } = req.params;
  const { farmerName, pinCode, state, district, taluk, village, villageDistrict, phoneNumber, cropType, quantity, price } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM farmers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    const stmt = db.prepare(`
      UPDATE farmers SET 
        farmerName = COALESCE(?, farmerName),
        pinCode = COALESCE(?, pinCode),
        state = COALESCE(?, state),
        district = COALESCE(?, district),
        taluk = COALESCE(?, taluk),
        village = COALESCE(?, village),
        villageDistrict = COALESCE(?, villageDistrict),
        phoneNumber = COALESCE(?, phoneNumber),
        cropType = COALESCE(?, cropType),
        quantity = COALESCE(?, quantity),
        price = COALESCE(?, price),
        updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(farmerName, pinCode, state, district, taluk, village, villageDistrict, phoneNumber, cropType, quantity, price, getTimestamp(), id);

    const updated = db.prepare('SELECT * FROM farmers WHERE id = ?').get(id);
    res.json({ message: 'Farmer updated successfully', farmer: updated });
  } catch (error) {
    console.error('Error updating farmer:', error);
    res.status(500).json({ error: 'Failed to update farmer' });
  }
});

// Update buyer by ID
app.put('/api/buyers/:id', (req, res) => {
  const { id } = req.params;
  const { buyerName, businessName, buyerPhone, requiredCrop, quantityNeeded } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM buyers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    const stmt = db.prepare(`
      UPDATE buyers SET 
        buyerName = COALESCE(?, buyerName),
        businessName = COALESCE(?, businessName),
        buyerPhone = COALESCE(?, buyerPhone),
        requiredCrop = COALESCE(?, requiredCrop),
        quantityNeeded = COALESCE(?, quantityNeeded),
        updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(buyerName, businessName, buyerPhone, requiredCrop, quantityNeeded, getTimestamp(), id);

    const updated = db.prepare('SELECT * FROM buyers WHERE id = ?').get(id);
    res.json({ message: 'Buyer updated successfully', buyer: updated });
  } catch (error) {
    console.error('Error updating buyer:', error);
    res.status(500).json({ error: 'Failed to update buyer' });
  }
});

// ============ DELETE Endpoints ============

// Delete farmer by ID
app.delete('/api/farmers/:id', (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM farmers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    db.prepare('DELETE FROM farmers WHERE id = ?').run(id);
    res.json({ message: 'Farmer deleted successfully', id });
  } catch (error) {
    console.error('Error deleting farmer:', error);
    res.status(500).json({ error: 'Failed to delete farmer' });
  }
});

// Delete buyer by ID
app.delete('/api/buyers/:id', (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM buyers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    db.prepare('DELETE FROM buyers WHERE id = ?').run(id);
    res.json({ message: 'Buyer deleted successfully', id });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    res.status(500).json({ error: 'Failed to delete buyer' });
  }
});

// Delete contact by ID
app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
    res.json({ message: 'Contact deleted successfully', id });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// ============ QUERY/SEARCH Endpoints ============

// Advanced query endpoint with filters
app.get('/api/query/farmers', (req, res) => {
  const { page = 1, limit = 20, cropType, state, district, minQuantity, maxPrice } = req.query;
  const { limit: lim, offset } = paginate(parseInt(page), parseInt(limit));

  try {
    let query = 'SELECT * FROM farmers WHERE 1=1';
    const params = [];

    if (cropType) {
      query += ' AND cropType = ?';
      params.push(cropType);
    }
    if (state) {
      query += ' AND state = ?';
      params.push(state);
    }
    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }
    if (minQuantity) {
      query += ' AND quantity >= ?';
      params.push(parseInt(minQuantity));
    }
    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalResult = db.prepare(countQuery).get(...params);
    const total = totalResult.total;

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(lim, offset);

    const farmers = db.prepare(query).all(...params);

    res.json({
      data: farmers,
      pagination: {
        page: parseInt(page),
        limit: lim,
        total,
        totalPages: Math.ceil(total / lim)
      }
    });
  } catch (error) {
    console.error('Error querying farmers:', error);
    res.status(500).json({ error: 'Failed to query farmers' });
  }
});

// Search farmers by name
app.get('/api/search/farmers', (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  try {
    const farmers = db.prepare('SELECT * FROM farmers WHERE farmerName LIKE ?').all(`%${q}%`);
    res.json(farmers);
  } catch (error) {
    console.error('Error searching farmers:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============ BULK Operations ============

// Bulk insert farmers
app.post('/api/farmers/bulk', (req, res) => {
  const { farmers } = req.body;

  if (!Array.isArray(farmers) || farmers.length === 0) {
    return res.status(400).json({ error: 'Array of farmers required' });
  }

  const inserted = [];
  const errors = [];

  try {
    const insertStmt = db.prepare(`
      INSERT INTO farmers (id, farmerName, villageDistrict, phoneNumber, cropType, quantity, price, registeredAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const farmer of items) {
        try {
          const id = farmer.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
          insertStmt.run(
            id,
            farmer.farmerName,
            farmer.villageDistrict,
            farmer.phoneNumber,
            farmer.cropType,
            parseInt(farmer.quantity) || 0,
            parseFloat(farmer.price) || 0,
            getTimestamp()
          );
          inserted.push({ id, farmerName: farmer.farmerName });
        } catch (err) {
          errors.push({ farmer: farmer.farmerName, error: err.message });
        }
      }
    });

    insertMany(farmers);

    res.status(201).json({
      message: `Inserted ${inserted.length} farmers`,
      inserted,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk inserting farmers:', error);
    res.status(500).json({ error: 'Bulk insert failed' });
  }
});

// Bulk delete farmers
app.delete('/api/farmers/bulk', (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Array of IDs required' });
  }

  try {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM farmers WHERE id IN (${placeholders})`);
    const result = stmt.run(...ids);

    res.json({
      message: `Deleted ${result.changes} farmers`,
      deletedCount: result.changes
    });
  } catch (error) {
    console.error('Error bulk deleting farmers:', error);
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// ============ Advanced Security ============

// Login with session token generation
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    
    if (user) {
      // Generate session token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      
      db.prepare(`
        INSERT INTO sessions (id, userId, token, expiresAt, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(Date.now().toString(), user.id, token, expiresAt, getTimestamp());

      // Update last login
      db.prepare('UPDATE users SET lastLogin = ? WHERE id = ?').run(getTimestamp(), user.id);

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, role: user.role },
        expiresAt
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during auth login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify session token
app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const session = verifyToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(session.userId);
  res.json({ valid: true, user });
});

// Logout (invalidate token)
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get database stats
app.get('/api/stats', (req, res) => {
  try {
    const farmerCount = db.prepare('SELECT COUNT(*) as count FROM farmers').get().count;
    const buyerCount = db.prepare('SELECT COUNT(*) as count FROM buyers').get().count;
    const contactCount = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeSessions = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expiresAt > ?').get(getTimestamp()).count;

    res.json({
      farmers: farmerCount,
      buyers: buyerCount,
      contacts: contactCount,
      users: userCount,
      activeSessions
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Root route serves the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Kisan Connect server running on:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://0.0.0.0:${PORT}`);
  console.log(`📊 Database: ${path.join(__dirname, 'kisan_connect.db')}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const newPort = parseInt(PORT) + 1;
    console.warn(`⚠️  Port ${PORT} is already in use. Trying port ${newPort}...`);
    server.close();
    app.listen(newPort, '0.0.0.0', () => {
      console.log(`🚀 Kisan Connect server running on:`);
      console.log(`   Local: http://localhost:${newPort}`);
      console.log(`   Network: http://0.0.0.0:${newPort}`);
      console.log(`📊 Database: ${path.join(__dirname, 'kisan_connect.db')}`);
    });
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
