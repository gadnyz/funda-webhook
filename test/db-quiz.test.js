const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { DAILY_QUIZ_QUESTION_COUNT, getLessonForDate, selectQuestionsForDate } = require("../src/content/iot");
const { loadConfig } = require("../src/config");
const { openDatabase } = require("../src/db");
const { weekStartForDate } = require("../src/utils");

test("daily quiz creates 10 lesson-based questions and updates weekly leaderboard", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "funda-test-"));
  const config = loadConfig();
  config.databasePath = path.join(tempDir, "funda.sqlite");

  const db = openDatabase(config);
  const quizDate = "2026-06-09";
  const weekStart = weekStartForDate(quizDate);
  const quiz = db.ensureDailyQuiz(quizDate, weekStart);
  const lesson = getLessonForDate(quizDate);
  const user = db.upsertUser("2250102030405", "Amina");
  const attempt = db.getOrCreateAttempt(user.id, quiz.id, quiz.total_questions);
  const firstQuestion = db.getQuestionByPosition(quiz.id, 1);
  const questions = db.getQuizQuestions(quiz.id);
  const selectedQuestions = selectQuestionsForDate(quizDate);

  db.recordQuizAnswer({
    attemptId: attempt.id,
    questionId: firstQuestion.id,
    selectedOption: firstQuestion.correct_option,
    isCorrect: true
  });
  db.syncAttemptProgress(attempt.id);
  const score = db.recalculateWeeklyScore(user.id, weekStart, "iot");
  const top = db.getWeeklyTop(weekStart, "iot", 5);

  assert.equal(quiz.total_questions, DAILY_QUIZ_QUESTION_COUNT);
  assert.equal(questions.length, DAILY_QUIZ_QUESTION_COUNT);
  assert.equal(selectedQuestions.length, DAILY_QUIZ_QUESTION_COUNT);
  assert.ok(selectedQuestions.every((question) => question.lessonSlug === lesson.slug));
  assert.ok(quiz.title.includes(lesson.title));
  assert.equal(score.points, 1);
  assert.equal(score.correct_answers, 1);
  assert.equal(top.length, 1);
  assert.equal(top[0].display_name, "Amina");

  db.close();
});

test("users can opt out and templates are seeded", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "funda-test-"));
  const config = loadConfig();
  config.databasePath = path.join(tempDir, "funda.sqlite");

  const db = openDatabase(config);
  const user = db.upsertUser("2250999888777", "Junior");
  db.updateUserOptOut(user.id, true);
  const optedOut = db.getUserByWaId("2250999888777");
  const templates = db.listTemplates();

  assert.equal(optedOut.opted_out, 1);
  assert.ok(templates.some((template) => template.name === "funda_quiz_du_jour"));
  assert.ok(templates.some((template) => template.name === "funda_lecon_du_jour"));
  assert.equal(templates.some((template) => template.name === "funda_challenge_iot"), false);

  db.close();
});
