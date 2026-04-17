const bcrypt = require("bcrypt");
const { pool } = require("../config/database");

const SALT_ROUNDS = 10;

class User {
  static async create({ name, email, password }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email.toLowerCase(), password_hash]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, name, email, created_at FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async verifyPassword(plain, password_hash) {
    return bcrypt.compare(plain, password_hash);
  }
}

module.exports = { User };
