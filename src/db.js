const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { resources, selectQuestionsForDate } = require("./content/iot");
const { addDays, nowIso, safeJson } = require("./utils");

function openDatabase(config) {
  try {
    const sqlite = prepareDatabase(config.databasePath);
    return createRepository(sqlite);
  } catch (error) {
    if (config.appEnv === "production") {
      throw error;
    }

    const fallbackPath = path.join(os.tmpdir(), "funda-dev.sqlite");
    console.warn(
      `SQLite indisponible sur ${config.databasePath}. Bascule development vers ${fallbackPath}. Cause: ${error.message}`
    );
    config.databasePath = fallbackPath;
    const sqlite = prepareDatabase(config.databasePath);
    return createRepository(sqlite);
  }
}

function prepareDatabase(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const sqlite = new DatabaseSync(databasePath);
  sqlite.exec("PRAGMA foreign_keys = ON");
  try {
    sqlite.exec("PRAGMA journal_mode = WAL");
  } catch {
    // Some managed filesystems reject WAL sidecar files. SQLite still works with
    // its default journal mode, which is enough for this single-process MVP.
  }
  sqlite.exec("PRAGMA busy_timeout = 5000");

  migrate(sqlite);
  seedResources(sqlite);
  seedTemplates(sqlite);
  return sqlite;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wa_id TEXT NOT NULL UNIQUE,
      display_name TEXT,
      preferred_language TEXT NOT NULL DEFAULT 'fr',
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      signature TEXT,
      received_at TEXT NOT NULL,
      processed_at TEXT,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wamid TEXT UNIQUE,
      direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
      user_id INTEGER,
      wa_id TEXT,
      phone_number_id TEXT,
      type TEXT NOT NULL,
      text TEXT,
      payload_json TEXT,
      received_at TEXT,
      created_at TEXT NOT NULL,
      processed_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS message_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wamid TEXT NOT NULL,
      status TEXT NOT NULL,
      recipient_id TEXT,
      conversation_id TEXT,
      pricing_category TEXT,
      payload_json TEXT,
      occurred_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(wamid, status, occurred_at)
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      topic TEXT NOT NULL,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_date TEXT NOT NULL UNIQUE,
      week_start TEXT NOT NULL,
      topic TEXT NOT NULL,
      title TEXT NOT NULL,
      total_questions INTEGER NOT NULL DEFAULT 20,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
      explanation TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'debutant',
      created_at TEXT NOT NULL,
      UNIQUE(quiz_id, position),
      FOREIGN KEY(quiz_id) REFERENCES daily_quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quiz_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed')),
      started_at TEXT NOT NULL,
      completed_at TEXT,
      score INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL DEFAULT 20,
      current_position INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, quiz_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(quiz_id) REFERENCES daily_quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_option TEXT NOT NULL CHECK(selected_option IN ('A', 'B', 'C', 'D')),
      is_correct INTEGER NOT NULL DEFAULT 0,
      answered_at TEXT NOT NULL,
      response_time_seconds INTEGER,
      created_at TEXT NOT NULL,
      UNIQUE(attempt_id, question_id),
      FOREIGN KEY(attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY(question_id) REFERENCES quiz_questions(id)
    );

    CREATE TABLE IF NOT EXISTS weekly_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      topic TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      quizzes_completed INTEGER NOT NULL DEFAULT 0,
      days_participated INTEGER NOT NULL DEFAULT 0,
      correct_answers INTEGER NOT NULL DEFAULT 0,
      total_answers INTEGER NOT NULL DEFAULT 0,
      last_activity_at TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, week_start, topic),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS whatsapp_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      language TEXT NOT NULL DEFAULT 'fr',
      category TEXT NOT NULL DEFAULT 'UTILITY',
      status TEXT NOT NULL DEFAULT 'draft',
      body TEXT NOT NULL,
      example_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      actor TEXT,
      payload_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_wa_id ON messages(wa_id);
    CREATE INDEX IF NOT EXISTS idx_statuses_wamid ON message_statuses(wamid);
    CREATE INDEX IF NOT EXISTS idx_attempts_user_status ON quiz_attempts(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_weekly_scores_week ON weekly_scores(week_start, topic, points DESC);
    CREATE INDEX IF NOT EXISTS idx_webhook_events_error ON webhook_events(error, received_at DESC);
  `);

  addColumnIfMissing(db, "users", "opted_out", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "users", "opted_out_at", "TEXT");
  addColumnIfMissing(db, "users", "consented_at", "TEXT");
  addColumnIfMissing(db, "users", "learning_level", "TEXT NOT NULL DEFAULT 'debutant'");
  addColumnIfMissing(db, "users", "badges", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "message_statuses", "error_code", "TEXT");
  addColumnIfMissing(db, "message_statuses", "error_title", "TEXT");
}

function addColumnIfMissing(db, tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (columns.some((column) => column.name === columnName)) return;
  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

function quoteSqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function seedResources(db) {
  const now = nowIso();
  const statement = db.prepare(`
    INSERT INTO resources (
      slug, topic, title, level, type, description, url, sort_order, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO NOTHING
  `);

  for (const resource of resources) {
    statement.run(
      resource.slug,
      resource.topic,
      resource.title,
      resource.level,
      resource.type,
      resource.description,
      resource.url,
      resource.sortOrder,
      now,
      now
    );
  }
}

function seedTemplates(db) {
  const now = nowIso();
  const templates = [
    {
      name: "funda_quiz_du_jour",
      category: "UTILITY",
      status: "draft",
      body: "Bonjour {{1}}, le quiz IoT du jour est disponible sur Funda. Repondez QUIZ pour commencer.",
      example: { "1": "Amina" }
    },
    {
      name: "funda_score_hebdo",
      category: "UTILITY",
      status: "draft",
      body: "Votre score Funda de la semaine est de {{1}} points. Repondez CLASSEMENT pour voir le top 5.",
      example: { "1": "72" }
    },
    {
      name: "funda_challenge_iot",
      category: "UTILITY",
      status: "draft",
      body: "Nouveau challenge IoT Funda: 20 questions par jour pour progresser. Repondez MENU pour participer.",
      example: {}
    }
  ];

  const statement = db.prepare(`
    INSERT INTO whatsapp_templates (
      name, language, category, status, body, example_json, created_at, updated_at
    )
    VALUES (?, 'fr', ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO NOTHING
  `);

  for (const template of templates) {
    statement.run(
      template.name,
      template.category,
      template.status,
      template.body,
      safeJson(template.example),
      now,
      now
    );
  }
}

function createRepository(db) {
  return {
    raw: db,

    close() {
      db.close();
    },

    upsertUser(waId, displayName) {
      const now = nowIso();
      db.prepare(`
        INSERT INTO users (
          wa_id, display_name, first_seen_at, last_seen_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(wa_id) DO UPDATE SET
          display_name = CASE
            WHEN excluded.display_name IS NOT NULL AND excluded.display_name != ''
            THEN excluded.display_name
            ELSE users.display_name
          END,
          last_seen_at = excluded.last_seen_at,
          updated_at = excluded.updated_at
      `).run(waId, displayName || null, now, now, now, now);

      return this.getUserByWaId(waId);
    },

    getUserByWaId(waId) {
      return db.prepare("SELECT * FROM users WHERE wa_id = ?").get(waId);
    },

    updateUserOptOut(userId, optedOut) {
      db.prepare(`
        UPDATE users
        SET
          opted_out = ?,
          opted_out_at = CASE WHEN ? = 1 THEN ? ELSE NULL END,
          consented_at = CASE WHEN ? = 0 THEN COALESCE(consented_at, ?) ELSE consented_at END,
          updated_at = ?
        WHERE id = ?
      `).run(
        optedOut ? 1 : 0,
        optedOut ? 1 : 0,
        nowIso(),
        optedOut ? 1 : 0,
        nowIso(),
        nowIso(),
        userId
      );
    },

    updateUserLearningProfile(userId, level, badges) {
      db.prepare(`
        UPDATE users
        SET learning_level = ?, badges = ?, updated_at = ?
        WHERE id = ?
      `).run(level, Array.isArray(badges) ? badges.join(",") : String(badges || ""), nowIso(), userId);
    },

    setOnboardingCompleted(userId) {
      db.prepare(`
        UPDATE users
        SET onboarding_completed = 1,
            consented_at = COALESCE(consented_at, ?),
            updated_at = ?
        WHERE id = ?
      `).run(nowIso(), nowIso(), userId);
    },

    insertWebhookEvent(eventType, payload, signature) {
      const result = db.prepare(`
        INSERT INTO webhook_events (event_type, payload_json, signature, received_at)
        VALUES (?, ?, ?, ?)
      `).run(eventType, safeJson(payload), signature || null, nowIso());
      return Number(result.lastInsertRowid);
    },

    markWebhookEventProcessed(eventId) {
      db.prepare(`
        UPDATE webhook_events
        SET processed_at = ?, error = NULL
        WHERE id = ?
      `).run(nowIso(), eventId);
    },

    markWebhookEventFailed(eventId, error) {
      db.prepare(`
        UPDATE webhook_events
        SET processed_at = ?, error = ?
        WHERE id = ?
      `).run(nowIso(), String(error?.stack || error || "Unknown error"), eventId);
    },

    recordInboundMessage({ wamid, userId, waId, phoneNumberId, type, text, payload, receivedAt }) {
      const result = db.prepare(`
        INSERT OR IGNORE INTO messages (
          wamid, direction, user_id, wa_id, phone_number_id, type, text,
          payload_json, received_at, created_at
        )
        VALUES (?, 'in', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        wamid,
        userId || null,
        waId || null,
        phoneNumberId || null,
        type || "unknown",
        text || null,
        safeJson(payload),
        receivedAt || nowIso(),
        nowIso()
      );

      return { inserted: result.changes > 0 };
    },

    recordOutboundMessage({ wamid, userId, waId, phoneNumberId, type, text, payload }) {
      db.prepare(`
        INSERT OR IGNORE INTO messages (
          wamid, direction, user_id, wa_id, phone_number_id, type, text,
          payload_json, created_at, processed_at
        )
        VALUES (?, 'out', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        wamid || null,
        userId || null,
        waId || null,
        phoneNumberId || null,
        type || "unknown",
        text || null,
        safeJson(payload),
        nowIso(),
        nowIso()
      );
    },

    recordMessageStatus(status) {
      const pricing = status.pricing || {};
      const conversation = status.conversation || {};
      const firstError = Array.isArray(status.errors) ? status.errors[0] : null;
      db.prepare(`
        INSERT OR IGNORE INTO message_statuses (
          wamid, status, recipient_id, conversation_id, pricing_category,
          error_code, error_title, payload_json, occurred_at, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        status.id,
        status.status,
        status.recipient_id || null,
        conversation.id || null,
        pricing.category || null,
        firstError?.code ? String(firstError.code) : null,
        firstError?.title || firstError?.message || null,
        safeJson(status),
        status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : null,
        nowIso()
      );
    },

    listResources(topic = "iot", limit = 10) {
      return db.prepare(`
        SELECT *
        FROM resources
        WHERE topic = ?
        ORDER BY sort_order ASC, title ASC
        LIMIT ?
      `).all(topic, limit);
    },

    getResourceBySlug(slug) {
      return db.prepare("SELECT * FROM resources WHERE slug = ?").get(slug);
    },

    upsertResource(resource) {
      const now = nowIso();
      db.prepare(`
        INSERT INTO resources (
          slug, topic, title, level, type, description, url, sort_order, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          topic = excluded.topic,
          title = excluded.title,
          level = excluded.level,
          type = excluded.type,
          description = excluded.description,
          url = excluded.url,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at
      `).run(
        resource.slug,
        resource.topic || "iot",
        resource.title,
        resource.level || "debutant",
        resource.type || "cours",
        resource.description,
        resource.url,
        Number(resource.sort_order || resource.sortOrder || 0),
        now,
        now
      );

      return this.getResourceBySlug(resource.slug);
    },

    listTemplates() {
      return db.prepare(`
        SELECT *
        FROM whatsapp_templates
        ORDER BY name ASC
      `).all();
    },

    upsertTemplate(template) {
      const now = nowIso();
      db.prepare(`
        INSERT INTO whatsapp_templates (
          name, language, category, status, body, example_json, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
          language = excluded.language,
          category = excluded.category,
          status = excluded.status,
          body = excluded.body,
          example_json = excluded.example_json,
          updated_at = excluded.updated_at
      `).run(
        template.name,
        template.language || "fr",
        template.category || "UTILITY",
        template.status || "draft",
        template.body,
        safeJson(template.example || template.example_json || {}),
        now,
        now
      );

      return db.prepare("SELECT * FROM whatsapp_templates WHERE name = ?").get(template.name);
    },

    recordAdminEvent(eventType, payload, actor = "admin") {
      db.prepare(`
        INSERT INTO admin_events (event_type, actor, payload_json, created_at)
        VALUES (?, ?, ?, ?)
      `).run(eventType, actor, safeJson(payload || {}), nowIso());
    },

    ensureDailyQuiz(quizDate, weekStart) {
      let quiz = db.prepare("SELECT * FROM daily_quizzes WHERE quiz_date = ?").get(quizDate);
      const now = nowIso();

      if (!quiz) {
        const result = db.prepare(`
          INSERT INTO daily_quizzes (
            quiz_date, week_start, topic, title, total_questions, created_at, updated_at
          )
          VALUES (?, ?, 'iot', ?, 20, ?, ?)
        `).run(quizDate, weekStart, `Quiz IoT du ${quizDate}`, now, now);
        quiz = db.prepare("SELECT * FROM daily_quizzes WHERE id = ?").get(Number(result.lastInsertRowid));
      }

      const count = db.prepare("SELECT COUNT(*) AS count FROM quiz_questions WHERE quiz_id = ?").get(quiz.id).count;
      if (count < quiz.total_questions) {
        const insertQuestion = db.prepare(`
          INSERT OR IGNORE INTO quiz_questions (
            quiz_id, position, question, option_a, option_b, option_c, option_d,
            correct_option, explanation, difficulty, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        selectQuestionsForDate(quizDate, quiz.total_questions).forEach((item, index) => {
          insertQuestion.run(
            quiz.id,
            index + 1,
            item.question,
            item.options.A,
            item.options.B,
            item.options.C,
            item.options.D,
            item.correct,
            item.explanation,
            item.difficulty || "debutant",
            nowIso()
          );
        });
      }

      return db.prepare("SELECT * FROM daily_quizzes WHERE id = ?").get(quiz.id);
    },

    getDailyQuiz(quizDate) {
      return db.prepare("SELECT * FROM daily_quizzes WHERE quiz_date = ?").get(quizDate);
    },

    getOrCreateAttempt(userId, quizId, totalQuestions) {
      const now = nowIso();
      db.prepare(`
        INSERT OR IGNORE INTO quiz_attempts (
          user_id, quiz_id, status, started_at, total_questions, current_position, created_at, updated_at
        )
        VALUES (?, ?, 'in_progress', ?, ?, 1, ?, ?)
      `).run(userId, quizId, now, totalQuestions, now, now);

      return this.getAttempt(userId, quizId);
    },

    getAttempt(userId, quizId) {
      return db.prepare(`
        SELECT qa.*, dq.quiz_date, dq.week_start, dq.topic
        FROM quiz_attempts qa
        JOIN daily_quizzes dq ON dq.id = qa.quiz_id
        WHERE qa.user_id = ? AND qa.quiz_id = ?
      `).get(userId, quizId);
    },

    getAttemptById(attemptId) {
      return db.prepare(`
        SELECT qa.*, dq.quiz_date, dq.week_start, dq.topic
        FROM quiz_attempts qa
        JOIN daily_quizzes dq ON dq.id = qa.quiz_id
        WHERE qa.id = ?
      `).get(attemptId);
    },

    getQuestionByPosition(quizId, position) {
      return db.prepare(`
        SELECT *
        FROM quiz_questions
        WHERE quiz_id = ? AND position = ?
      `).get(quizId, position);
    },

    recordQuizAnswer({ attemptId, questionId, selectedOption, isCorrect }) {
      const result = db.prepare(`
        INSERT OR IGNORE INTO quiz_answers (
          attempt_id, question_id, selected_option, is_correct, answered_at, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(attemptId, questionId, selectedOption, isCorrect ? 1 : 0, nowIso(), nowIso());

      return { inserted: result.changes > 0 };
    },

    summarizeAttempt(attemptId) {
      const stats = db.prepare(`
        SELECT
          COUNT(*) AS answered,
          COALESCE(SUM(is_correct), 0) AS correct
        FROM quiz_answers
        WHERE attempt_id = ?
      `).get(attemptId);

      return {
        answered: Number(stats.answered || 0),
        correct: Number(stats.correct || 0)
      };
    },

    syncAttemptProgress(attemptId) {
      const attempt = this.getAttemptById(attemptId);
      const stats = this.summarizeAttempt(attemptId);
      const completed = stats.answered >= attempt.total_questions;
      const currentPosition = completed
        ? attempt.total_questions
        : Math.max(1, Math.min(attempt.total_questions, stats.answered + 1));

      db.prepare(`
        UPDATE quiz_attempts
        SET
          status = ?,
          completed_at = CASE WHEN ? = 1 AND completed_at IS NULL THEN ? ELSE completed_at END,
          score = ?,
          current_position = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        completed ? "completed" : "in_progress",
        completed ? 1 : 0,
        nowIso(),
        stats.correct,
        currentPosition,
        nowIso(),
        attemptId
      );

      return this.getAttemptById(attemptId);
    },

    getAttemptAnswers(attemptId) {
      return db.prepare(`
        SELECT qa.*, qq.position, qq.correct_option, qq.question
        FROM quiz_answers qa
        JOIN quiz_questions qq ON qq.id = qa.question_id
        WHERE qa.attempt_id = ?
        ORDER BY qq.position ASC
      `).all(attemptId);
    },

    recalculateWeeklyScore(userId, weekStart, topic = "iot") {
      const weekEnd = addDays(weekStart, 6);
      const stats = db.prepare(`
        SELECT
          COUNT(qans.id) AS total_answers,
          COALESCE(SUM(qans.is_correct), 0) AS correct_answers,
          COUNT(DISTINCT CASE WHEN qans.id IS NOT NULL THEN dq.quiz_date END) AS days_participated,
          COUNT(DISTINCT CASE WHEN qa.status = 'completed' THEN qa.id END) AS quizzes_completed,
          MAX(COALESCE(qans.answered_at, qa.started_at)) AS last_activity_at
        FROM quiz_attempts qa
        JOIN daily_quizzes dq ON dq.id = qa.quiz_id
        LEFT JOIN quiz_answers qans ON qans.attempt_id = qa.id
        WHERE qa.user_id = ?
          AND dq.topic = ?
          AND dq.quiz_date BETWEEN ? AND ?
      `).get(userId, topic, weekStart, weekEnd);

      const correctAnswers = Number(stats.correct_answers || 0);
      const totalAnswers = Number(stats.total_answers || 0);
      const daysParticipated = Number(stats.days_participated || 0);
      const quizzesCompleted = Number(stats.quizzes_completed || 0);
      const regularityBonus = daysParticipated >= 5 ? 10 : 0;
      const completionBonus = quizzesCompleted * 5;
      const points = correctAnswers + completionBonus + regularityBonus;

      db.prepare(`
        INSERT INTO weekly_scores (
          user_id, week_start, topic, points, quizzes_completed, days_participated,
          correct_answers, total_answers, last_activity_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, week_start, topic) DO UPDATE SET
          points = excluded.points,
          quizzes_completed = excluded.quizzes_completed,
          days_participated = excluded.days_participated,
          correct_answers = excluded.correct_answers,
          total_answers = excluded.total_answers,
          last_activity_at = excluded.last_activity_at,
          updated_at = excluded.updated_at
      `).run(
        userId,
        weekStart,
        topic,
        points,
        quizzesCompleted,
        daysParticipated,
        correctAnswers,
        totalAnswers,
        stats.last_activity_at || null,
        nowIso()
      );

      return this.getUserWeeklyScore(userId, weekStart, topic);
    },

    getUserWeeklyScore(userId, weekStart, topic = "iot") {
      return db.prepare(`
        SELECT ws.*, u.wa_id, u.display_name
        FROM weekly_scores ws
        JOIN users u ON u.id = ws.user_id
        WHERE ws.user_id = ? AND ws.week_start = ? AND ws.topic = ?
      `).get(userId, weekStart, topic);
    },

    getWeeklyTop(weekStart, topic = "iot", limit = 5) {
      return db.prepare(`
        SELECT ws.*, u.wa_id, u.display_name
        FROM weekly_scores ws
        JOIN users u ON u.id = ws.user_id
        WHERE ws.week_start = ? AND ws.topic = ?
        ORDER BY ws.points DESC, ws.correct_answers DESC, ws.quizzes_completed DESC, ws.updated_at ASC
        LIMIT ?
      `).all(weekStart, topic, limit);
    },

    listUsers(limit = 50) {
      return db.prepare(`
        SELECT
          id, wa_id, display_name, preferred_language, onboarding_completed,
          opted_out, opted_out_at, consented_at, learning_level, badges,
          first_seen_at, last_seen_at, created_at, updated_at
        FROM users
        ORDER BY last_seen_at DESC
        LIMIT ?
      `).all(limit);
    },

    deleteUserCascade(userId) {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      if (!user) return null;

      const counts = {
        quizAnswers: 0,
        quizAttempts: 0,
        weeklyScores: 0,
        messages: 0,
        users: 0
      };

      db.exec("BEGIN IMMEDIATE");
      try {
        const attemptIds = db.prepare("SELECT id FROM quiz_attempts WHERE user_id = ?").all(userId);
        for (const attempt of attemptIds) {
          counts.quizAnswers += db.prepare("DELETE FROM quiz_answers WHERE attempt_id = ?").run(attempt.id).changes;
        }
        counts.quizAttempts = db.prepare("DELETE FROM quiz_attempts WHERE user_id = ?").run(userId).changes;
        counts.weeklyScores = db.prepare("DELETE FROM weekly_scores WHERE user_id = ?").run(userId).changes;
        counts.messages = db.prepare("DELETE FROM messages WHERE user_id = ? OR wa_id = ?").run(userId, user.wa_id).changes;
        counts.users = db.prepare("DELETE FROM users WHERE id = ?").run(userId).changes;
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }

      this.recordAdminEvent("user.deleted", {
        userId,
        waId: user.wa_id,
        displayName: user.display_name,
        counts
      });

      return {
        user,
        counts
      };
    },

    listMessages(limit = 80) {
      return db.prepare(`
        SELECT m.*, u.display_name
        FROM messages m
        LEFT JOIN users u ON u.id = m.user_id
        ORDER BY m.created_at DESC
        LIMIT ?
      `).all(limit);
    },

    listWebhookErrors(limit = 50) {
      return db.prepare(`
        SELECT id, event_type, received_at, processed_at, error
        FROM webhook_events
        WHERE error IS NOT NULL
        ORDER BY received_at DESC
        LIMIT ?
      `).all(limit);
    },

    listStatusErrors(limit = 50) {
      return db.prepare(`
        SELECT *
        FROM message_statuses
        WHERE status = 'failed' OR error_code IS NOT NULL
        ORDER BY created_at DESC
        LIMIT ?
      `).all(limit);
    },

    listDailyQuizzes(limit = 30) {
      return db.prepare(`
        SELECT dq.*,
          COUNT(qq.id) AS question_count,
          COUNT(DISTINCT qa.id) AS attempt_count,
          COUNT(DISTINCT CASE WHEN qa.status = 'completed' THEN qa.id END) AS completed_count
        FROM daily_quizzes dq
        LEFT JOIN quiz_questions qq ON qq.quiz_id = dq.id
        LEFT JOIN quiz_attempts qa ON qa.quiz_id = dq.id
        GROUP BY dq.id
        ORDER BY dq.quiz_date DESC
        LIMIT ?
      `).all(limit);
    },

    getQuizQuestions(quizId) {
      return db.prepare(`
        SELECT *
        FROM quiz_questions
        WHERE quiz_id = ?
        ORDER BY position ASC
      `).all(quizId);
    },

    getAdminEvents(limit = 50) {
      return db.prepare(`
        SELECT *
        FROM admin_events
        ORDER BY created_at DESC
        LIMIT ?
      `).all(limit);
    },

    getMetrics() {
      const stats = this.getStats();
      const inbound = db.prepare("SELECT COUNT(*) AS count FROM messages WHERE direction = 'in'").get().count;
      const outbound = db.prepare("SELECT COUNT(*) AS count FROM messages WHERE direction = 'out'").get().count;
      const optedOut = db.prepare("SELECT COUNT(*) AS count FROM users WHERE opted_out = 1").get().count;
      const webhookErrors = db.prepare("SELECT COUNT(*) AS count FROM webhook_events WHERE error IS NOT NULL").get().count;
      const failedStatuses = db.prepare(`
        SELECT COUNT(*) AS count
        FROM message_statuses
        WHERE status = 'failed' OR error_code IS NOT NULL
      `).get().count;
      const activeToday = db.prepare(`
        SELECT COUNT(DISTINCT user_id) AS count
        FROM messages
        WHERE direction = 'in' AND created_at >= datetime('now', '-1 day')
      `).get().count;

      return {
        ...stats,
        inboundMessages: Number(inbound),
        outboundMessages: Number(outbound),
        optedOutUsers: Number(optedOut),
        webhookErrors: Number(webhookErrors),
        failedMessageStatuses: Number(failedStatuses),
        activeUsers24h: Number(activeToday)
      };
    },

    createBackup(targetPath) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      if (fs.existsSync(targetPath)) {
        throw new Error(`Le fichier de backup existe deja: ${targetPath}`);
      }

      db.exec(`VACUUM INTO ${quoteSqlString(targetPath)}`);
      this.recordAdminEvent("backup.created", { targetPath });
      return {
        path: targetPath,
        createdAt: nowIso()
      };
    },

    getStats() {
      const users = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
      const messages = db.prepare("SELECT COUNT(*) AS count FROM messages").get().count;
      const attempts = db.prepare("SELECT COUNT(*) AS count FROM quiz_attempts").get().count;
      const completedAttempts = db.prepare(
        "SELECT COUNT(*) AS count FROM quiz_attempts WHERE status = 'completed'"
      ).get().count;

      return {
        users: Number(users),
        messages: Number(messages),
        attempts: Number(attempts),
        completedAttempts: Number(completedAttempts)
      };
    }
  };
}

module.exports = {
  openDatabase
};
