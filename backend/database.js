const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'agritrace.db'));
    this.init();
  }

  init() {
    // Users table (farmers, distributors, retailers)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        gps_coordinates TEXT,
        role INTEGER NOT NULL, -- 0: Farmer, 1: Distributor, 2: Retailer, 3: Consumer
        wallet_address TEXT UNIQUE NOT NULL,
        encrypted_private_key TEXT NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Batches table (replacing products for better supply chain tracking)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blockchain_id INTEGER,
        batch_number TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        produce TEXT NOT NULL,
        variety TEXT NOT NULL,
        quantity REAL NOT NULL,
        current_price REAL NOT NULL,
        quality_grade TEXT NOT NULL,
        is_organic BOOLEAN DEFAULT FALSE,
        farm_location TEXT NOT NULL,
        gps_coordinates TEXT,
        harvest_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        current_holder_id INTEGER,
        qr_code TEXT,
        photo_url TEXT,
        quality_report_url TEXT,
        ipfs_hash TEXT,
        ipfs_photo_hash TEXT,
        ipfs_metadata_url TEXT,
        status INTEGER DEFAULT 0, -- 0: Harvested, 1: InTransit, 2: AtDistributor, 3: AtRetailer, 4: Sold
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (current_holder_id) REFERENCES users (id)
      )
    `);

    // Handoff events table (replacing transactions for detailed supply chain tracking)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS handoff_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        from_user_id INTEGER,
        to_user_id INTEGER NOT NULL,
        event_type TEXT NOT NULL, -- 'Pickup', 'Transit', 'Delivery', 'Sale'
        price REAL NOT NULL,
        location TEXT NOT NULL,
        gps_coordinates TEXT,
        temperature TEXT,
        notes TEXT,
        scan_location TEXT,
        photo_url TEXT,
        document_url TEXT,
        ipfs_hash TEXT,
        ipfs_photo_hash TEXT,
        ipfs_event_url TEXT,
        tx_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches (id),
        FOREIGN KEY (from_user_id) REFERENCES users (id),
        FOREIGN KEY (to_user_id) REFERENCES users (id)
      )
    `);

    // Keep products table for backward compatibility (will be migrated)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blockchain_id INTEGER,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        variety TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        quality_grade TEXT NOT NULL,
        is_organic BOOLEAN DEFAULT FALSE,
        price REAL NOT NULL,
        farm_location TEXT NOT NULL,
        harvest_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        qr_code TEXT,
        photo_url TEXT,
        status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Keep transactions table for backward compatibility
    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        from_user_id INTEGER,
        to_user_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        location TEXT NOT NULL,
        photo_url TEXT,
        notes TEXT,
        scan_location TEXT,
        tx_hash TEXT,
        tx_type INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (from_user_id) REFERENCES users (id),
        FOREIGN KEY (to_user_id) REFERENCES users (id)
      )
    `);

    // Add missing columns to existing products table for backward compatibility
    this.db.run(`ALTER TABLE products ADD COLUMN photo_url TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding photo_url column:', err);
      }
    });

    this.db.run(`ALTER TABLE products ADD COLUMN ipfs_hash TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding ipfs_hash column:', err);
      }
    });

    console.log('Database initialized with batch-based supply chain tracking');
  }

  // User operations
  createUser(userData) {
    return new Promise((resolve, reject) => {
      const { phone, name, location, role, walletAddress, encryptedPrivateKey } = userData;
      
      this.db.run(
        `INSERT INTO users (phone, name, location, role, wallet_address, encrypted_private_key) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [phone, name, location, role, walletAddress, encryptedPrivateKey],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...userData });
        }
      );
    });
  }

  getUserByPhone(phone) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE phone = ?',
        [phone],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  verifyUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET is_verified = TRUE WHERE id = ?',
        [userId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  // Product operations
  createProduct(productData) {
    return new Promise((resolve, reject) => {
      const { userId, name, variety, quantity, qualityGrade, isOrganic, price, farmLocation, qrCode, photoUrl, ipfsHash } = productData;
      
      this.db.run(
        `INSERT INTO products (user_id, name, variety, quantity, quality_grade, is_organic, price, farm_location, qr_code, photo_url, ipfs_hash) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, variety, quantity, qualityGrade, isOrganic, price, farmLocation, qrCode, photoUrl, ipfsHash],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...productData });
        }
      );
    });
  }

  updateProductBlockchainId(productId, blockchainId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE products SET blockchain_id = ? WHERE id = ?',
        [blockchainId, productId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  getProductsByUserId(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getAllProducts() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT p.*, u.name as farmer_name, u.location as farmer_location 
         FROM products p 
         JOIN users u ON p.user_id = u.id 
         ORDER BY p.created_at DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getProductById(productId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT p.*, u.name as farmer_name, u.location as farmer_location, u.phone as farmer_phone
         FROM products p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.id = ?`,
        [productId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // Transaction operations
  createTransaction(transactionData) {
    return new Promise((resolve, reject) => {
      const { productId, fromUserId, toUserId, quantity, price, location, photoUrl, notes, scanLocation, txHash, txType } = transactionData;
      
      this.db.run(
        `INSERT INTO transactions (product_id, from_user_id, to_user_id, quantity, price, location, photo_url, notes, scan_location, tx_hash, tx_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, fromUserId, toUserId, quantity, price, location, photoUrl, notes, scanLocation, txHash, txType],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...transactionData });
        }
      );
    });
  }

  getProductTransactions(productId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT t.*, 
                uf.name as from_user_name, uf.phone as from_user_phone,
                ut.name as to_user_name, ut.phone as to_user_phone
         FROM transactions t
         LEFT JOIN users uf ON t.from_user_id = uf.id
         JOIN users ut ON t.to_user_id = ut.id
         WHERE t.product_id = ?
         ORDER BY t.created_at ASC`,
        [productId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Helper method for raw SQL queries
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Batch operations (new batch-based system)
  createBatch(batchData) {
    return new Promise((resolve, reject) => {
      const { 
        batchNumber, userId, produce, variety, quantity, currentPrice, 
        qualityGrade, isOrganic, farmLocation, gpsCoordinates, 
        qrCode, photoUrl, qualityReportUrl, ipfsHash, ipfsPhotoHash, ipfsMetadataUrl
      } = batchData;
      
      this.db.run(
        `INSERT INTO batches (
          batch_number, user_id, produce, variety, quantity, current_price, 
          quality_grade, is_organic, farm_location, gps_coordinates, 
          current_holder_id, qr_code, photo_url, quality_report_url,
          ipfs_hash, ipfs_photo_hash, ipfs_metadata_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batchNumber, userId, produce, variety, quantity, currentPrice,
          qualityGrade, isOrganic, farmLocation, gpsCoordinates,
          userId, qrCode, photoUrl, qualityReportUrl,
          ipfsHash, ipfsPhotoHash, ipfsMetadataUrl
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...batchData });
        }
      );
    });
  }

  updateBatchBlockchainId(batchId, blockchainId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE batches SET blockchain_id = ? WHERE id = ?',
        [blockchainId, batchId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  getBatchById(batchId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT b.*, u.name as farmer_name, u.location as farmer_location, u.phone as farmer_phone,
                ch.name as current_holder_name, ch.location as current_holder_location
         FROM batches b 
         JOIN users u ON b.user_id = u.id 
         LEFT JOIN users ch ON b.current_holder_id = ch.id
         WHERE b.id = ?`,
        [batchId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getBatchByNumber(batchNumber) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT b.*, u.name as farmer_name, u.location as farmer_location, u.phone as farmer_phone,
                ch.name as current_holder_name, ch.location as current_holder_location
         FROM batches b 
         JOIN users u ON b.user_id = u.id 
         LEFT JOIN users ch ON b.current_holder_id = ch.id
         WHERE b.batch_number = ?`,
        [batchNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getBatchesByUserId(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM batches WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getAllBatches() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT b.*, u.name as farmer_name, u.location as farmer_location 
         FROM batches b 
         JOIN users u ON b.user_id = u.id 
         ORDER BY b.created_at DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  updateBatchHolder(batchId, newHolderId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE batches SET current_holder_id = ?, status = ? WHERE id = ?',
        [newHolderId, status, batchId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  // Handoff event operations
  createHandoffEvent(handoffData) {
    return new Promise((resolve, reject) => {
      const { 
        batchId, fromUserId, toUserId, eventType, price, location, 
        gpsCoordinates, temperature, notes, scanLocation, photoUrl, 
        documentUrl, txHash 
      } = handoffData;
      
      this.db.run(
        `INSERT INTO handoff_events (
          batch_id, from_user_id, to_user_id, event_type, price, location, 
          gps_coordinates, temperature, notes, scan_location, photo_url, 
          document_url, tx_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batchId, fromUserId, toUserId, eventType, price, location,
          gpsCoordinates, temperature, notes, scanLocation, photoUrl,
          documentUrl, txHash
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...handoffData });
        }
      );
    });
  }

  getBatchHandoffs(batchId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT h.*, 
                uf.name as from_user_name, uf.phone as from_user_phone, uf.location as from_user_location,
                ut.name as to_user_name, ut.phone as to_user_phone, ut.location as to_user_location
         FROM handoff_events h
         LEFT JOIN users uf ON h.from_user_id = uf.id
         JOIN users ut ON h.to_user_id = ut.id
         WHERE h.batch_id = ?
         ORDER BY h.created_at ASC`,
        [batchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Helper method for raw SQL queries
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Helper method for raw SQL run
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }
}

module.exports = Database;