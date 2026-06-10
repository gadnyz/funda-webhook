const assert = require("node:assert/strict");
const test = require("node:test");
const { buildLearningProfile } = require("../src/services/conversation");

test("buildLearningProfile assigns levels and badges", () => {
  assert.deepEqual(buildLearningProfile({ points: 0, days_participated: 0, quizzes_completed: 0 }), {
    level: "debutant",
    badges: []
  });

  const profile = buildLearningProfile({
    points: 105,
    days_participated: 5,
    quizzes_completed: 3,
    correct_answers: 60
  });

  assert.equal(profile.level, "avance");
  assert.ok(profile.badges.includes("Discipline"));
  assert.ok(profile.badges.includes("Expert IoT"));
});
