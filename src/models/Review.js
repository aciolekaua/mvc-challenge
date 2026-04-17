const { pool } = require("../config/database");

class Review {
  static async upsert({ book_id, user_id, rating, comment }) {
    const { rows } = await pool.query(
      `INSERT INTO reviews (book_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (book_id, user_id)
       DO UPDATE SET
         rating = EXCLUDED.rating,
         comment = EXCLUDED.comment,
         updated_at = NOW()
       RETURNING *`,
      [book_id, user_id, rating, comment || null]
    );
    return rows[0];
  }

  static async findByUserAndBook(user_id, book_id) {
    const { rows } = await pool.query(
      `SELECT * FROM reviews WHERE user_id = $1 AND book_id = $2`,
      [user_id, book_id]
    );
    return rows[0] || null;
  }

  static async listByBook(book_id) {
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.book_id = $1
       ORDER BY r.created_at DESC`,
      [book_id]
    );
    return rows;
  }

  static async aggregateForBook(book_id) {
    const { rows } = await pool.query(
      `SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS avg_rating,
        COUNT(*)::int AS review_count
       FROM reviews WHERE book_id = $1`,
      [book_id]
    );
    return rows[0];
  }
}

module.exports = { Review };
