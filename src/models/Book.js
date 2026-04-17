const { pool } = require("../config/database");

const PAGE_SIZE = 9;

class Book {
  static async create({
    user_id,
    title,
    classification,
    genre,
    author,
    publisher,
    cover_path = null,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO books (user_id, title, classification, genre, author, publisher, cover_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, title, classification, genre, author, publisher, cover_path]
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await pool.query(`SELECT * FROM books WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  static async update(id, fields) {
    const { rows } = await pool.query(
      `UPDATE books SET
        title = COALESCE($2, title),
        classification = COALESCE($3, classification),
        genre = COALESCE($4, genre),
        author = COALESCE($5, author),
        publisher = COALESCE($6, publisher),
        cover_path = COALESCE($7, cover_path)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        fields.title ?? null,
        fields.classification ?? null,
        fields.genre ?? null,
        fields.author ?? null,
        fields.publisher ?? null,
        fields.cover_path !== undefined ? fields.cover_path : null,
      ]
    );
    return rows[0] || null;
  }

  /**
   * Lista com busca, filtro por classificação e paginação.
   */
  static async list({ q, classification, page = 1, userIdForFavorite = null }) {
    const limit = PAGE_SIZE;
    const offset = (Math.max(1, page) - 1) * limit;
    const params = [];
    let where = "WHERE 1=1";

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where += ` AND (
        LOWER(b.title) LIKE $${params.length}
        OR LOWER(b.author) LIKE $${params.length}
        OR LOWER(b.genre) LIKE $${params.length}
      )`;
    }

    if (classification) {
      params.push(classification);
      where += ` AND b.classification = $${params.length}`;
    }

    const countSql = `SELECT COUNT(*)::int AS c FROM books b ${where}`;
    const { rows: countRows } = await pool.query(countSql, params);
    const total = countRows[0].c;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const favParamIndex = userIdForFavorite ? params.push(userIdForFavorite) : null;

    const listParams = [...params, limit, offset];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const listSql = `
      SELECT b.*,
        (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM reviews r WHERE r.book_id = b.id) AS avg_rating,
        (SELECT COUNT(*)::int FROM reviews r2 WHERE r2.book_id = b.id) AS review_count
        ${
          favParamIndex
            ? `, EXISTS (SELECT 1 FROM favorites f WHERE f.book_id = b.id AND f.user_id = $${favParamIndex}) AS is_favorite`
            : ", FALSE AS is_favorite"
        }
      FROM books b
      ${where}
      ORDER BY b.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const { rows } = await pool.query(listSql, listParams);
    return {
      books: rows,
      page: Math.max(1, page),
      total,
      totalPages,
      pageSize: limit,
    };
  }

  static async getDetailWithStats(id) {
    const book = await this.findById(id);
    if (!book) return null;

    const stats = await pool.query(
      `SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS avg_rating,
        COUNT(*)::int AS review_count
       FROM reviews WHERE book_id = $1`,
      [id]
    );

    return { ...book, ...stats.rows[0] };
  }
}

module.exports = { Book, PAGE_SIZE };
