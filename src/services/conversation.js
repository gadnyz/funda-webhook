const {
  formatDateInTimeZone,
  normalizeText,
  publicUserName,
  weekStartForDate
} = require("../utils");

const MENU_IDS = {
  DAILY_QUIZ: "MENU_DAILY_QUIZ",
  WEEKLY_CHALLENGE: "MENU_WEEKLY_CHALLENGE",
  LEARN_IOT: "MENU_LEARN_IOT",
  RESOURCES: "MENU_RESOURCES",
  SCORE: "MENU_SCORE",
  LEADERBOARD: "MENU_LEADERBOARD",
  HELP: "MENU_HELP",
  MAIN: "MENU_MAIN"
};

const QUIZ_ANSWER_IDS = {
  A: "QUIZ_ANSWER_A",
  B: "QUIZ_ANSWER_B",
  C: "QUIZ_ANSWER_C",
  D: "QUIZ_ANSWER_D"
};

function createConversationService({ config, db, whatsapp, logger }) {
  function contextFor(user, metadata) {
    return {
      userId: user.id,
      phoneNumberId: metadata?.phone_number_id || config.whatsapp.phoneNumberId
    };
  }

  async function handleIncoming({ user, message, metadata }) {
    const text = normalizeText(message.text || message.selectedTitle || "");
    const commandId = message.commandId || "";
    const context = contextFor(user, metadata);

    if (isStartCommand(text)) {
      db.updateUserOptOut(user.id, false);
      await whatsapp.sendText(
        user.wa_id,
        "Votre participation Funda est reactivee. Vous pouvez reprendre l'apprentissage IoT.",
        context
      );
      await sendMainMenu(user, context);
      return;
    }

    if (isStopCommand(text)) {
      db.updateUserOptOut(user.id, true);
      await whatsapp.sendText(
        user.wa_id,
        "Vous etes desabonne des messages Funda. Envoyez START pour reactiver votre participation.",
        context
      );
      return;
    }

    if (user.opted_out) {
      await whatsapp.sendText(
        user.wa_id,
        "Votre compte est desabonne. Envoyez START pour reprendre Funda.",
        context
      );
      return;
    }

    if (!user.onboarding_completed || isGreeting(text)) {
      await sendWelcome(user, context);
      return;
    }

    if (commandId === MENU_IDS.MAIN || text === "menu") {
      await sendMainMenu(user, context);
      return;
    }

    const quizAnswer = extractQuizAnswer(text, commandId);
    if (quizAnswer) {
      await handleQuizAnswer(user, quizAnswer, context);
      return;
    }

    if (commandId.startsWith("RESOURCE_")) {
      await sendResourceDetail(user, commandId.replace("RESOURCE_", ""), context);
      return;
    }

    if (commandId === MENU_IDS.DAILY_QUIZ || text.includes("quiz") || text === "1") {
      await startOrResumeDailyQuiz(user, context);
      return;
    }

    if (commandId === MENU_IDS.WEEKLY_CHALLENGE || text.includes("challenge") || text === "2") {
      await sendWeeklyChallenge(user, context);
      return;
    }

    if (commandId === MENU_IDS.LEARN_IOT || text.includes("apprendre") || text.includes("iot") || text === "3") {
      await sendLearningIntro(user, context);
      return;
    }

    if (commandId === MENU_IDS.RESOURCES || text.includes("ressource") || text === "4") {
      await sendResources(user, context);
      return;
    }

    if (commandId === MENU_IDS.SCORE || text.includes("score") || text === "5") {
      await sendScore(user, context);
      return;
    }

    if (
      commandId === MENU_IDS.LEADERBOARD ||
      text.includes("classement") ||
      text.includes("top") ||
      text === "6"
    ) {
      await sendLeaderboard(user, context);
      return;
    }

    if (commandId === MENU_IDS.HELP || text.includes("aide")) {
      await sendHelp(user, context);
      return;
    }

    await whatsapp.sendText(
      user.wa_id,
      "Je n'ai pas encore compris cette demande. Voici le menu Funda pour continuer.",
      context
    );
    await sendMainMenu(user, context);
  }

  async function sendWelcome(user, context) {
    if (config.fundaIotImageUrl) {
      await whatsapp.sendImage(
        user.wa_id,
        {
          link: config.fundaIotImageUrl,
          caption: "Funda - Apprendre simplement et facilement"
        },
        context
      );
    }

    await whatsapp.sendText(
      user.wa_id,
      [
        `Bonjour ${publicUserName(user)}, je suis Funda, votre assistant d'apprentissage en ligne.`,
        "",
        "Funda vous aide a apprendre simplement et facilement grace a des ressources, des quiz et des challenges.",
        "",
        "Ce mois-ci, nous apprenons l'IoT: objets connectes, capteurs, MQTT, securite et projets pratiques."
      ].join("\n"),
      context
    );

    db.setOnboardingCompleted(user.id);
    await sendMainMenu(user, context);
  }

  async function sendMainMenu(user, context) {
    return whatsapp.sendList(
      user.wa_id,
      {
        header: "Funda",
        body: "Que voulez-vous faire maintenant ?",
        footer: "Theme mensuel: IoT",
        buttonText: "Menu",
        sections: [
          {
            title: "Apprendre",
            rows: [
              {
                id: MENU_IDS.DAILY_QUIZ,
                title: "Quiz du jour",
                description: "20 questions IoT aujourd'hui"
              },
              {
                id: MENU_IDS.WEEKLY_CHALLENGE,
                title: "Challenge semaine",
                description: "Objectif, bonus et progression"
              },
              {
                id: MENU_IDS.LEARN_IOT,
                title: "Apprendre l'IoT",
                description: "Introduction guidee"
              },
              {
                id: MENU_IDS.RESOURCES,
                title: "Ressources IoT",
                description: "Cours, outils, videos et projets"
              }
            ]
          },
          {
            title: "Progression",
            rows: [
              {
                id: MENU_IDS.SCORE,
                title: "Mon score",
                description: "Votre progression hebdomadaire"
              },
              {
                id: MENU_IDS.LEADERBOARD,
                title: "Classement top 5",
                description: "Les meilleurs de la semaine"
              },
              {
                id: MENU_IDS.HELP,
                title: "Aide",
                description: "Commandes disponibles"
              }
            ]
          }
        ]
      },
      context
    );
  }

  async function sendLearningIntro(user, context) {
    await whatsapp.sendText(
      user.wa_id,
      [
        "L'IoT, ou Internet des objets, relie des objets physiques a des logiciels et plateformes.",
        "",
        "Parcours recommande:",
        "1. Comprendre capteurs et actionneurs",
        "2. Tester Arduino ou ESP32",
        "3. Publier des donnees avec MQTT",
        "4. Visualiser les mesures",
        "5. Securiser l'objet et ses donnees"
      ].join("\n"),
      context
    );

    return whatsapp.sendButtons(
      user.wa_id,
      "Choisissez la prochaine etape.",
      [
        { id: MENU_IDS.RESOURCES, title: "Ressources" },
        { id: MENU_IDS.DAILY_QUIZ, title: "Quiz" },
        { id: MENU_IDS.MAIN, title: "Menu" }
      ],
      context
    );
  }

  async function sendResources(user, context) {
    const rows = db.listResources("iot", 10).map((resource) => ({
      id: `RESOURCE_${resource.slug}`,
      title: resource.title,
      description: `${resource.level} - ${resource.type}`
    }));

    return whatsapp.sendList(
      user.wa_id,
      {
        header: "Ressources IoT",
        body: "Selectionnez une ressource pour recevoir le lien et le contexte.",
        footer: "Funda - IoT",
        buttonText: "Ressources",
        sections: [{ title: "Catalogue", rows }]
      },
      context
    );
  }

  async function sendResourceDetail(user, slug, context) {
    const resource = db.getResourceBySlug(slug);
    if (!resource) {
      await whatsapp.sendText(user.wa_id, "Ressource introuvable. Voici le catalogue actuel.", context);
      await sendResources(user, context);
      return;
    }

    await whatsapp.sendText(
      user.wa_id,
      [
        `${resource.title}`,
        "",
        `Niveau: ${resource.level}`,
        `Type: ${resource.type}`,
        "",
        resource.description,
        "",
        `Lien: ${resource.url}`
      ].join("\n"),
      context
    );

    await whatsapp.sendButtons(
      user.wa_id,
      "Continuer avec Funda.",
      [
        { id: MENU_IDS.DAILY_QUIZ, title: "Quiz du jour" },
        { id: MENU_IDS.RESOURCES, title: "Ressources" },
        { id: MENU_IDS.MAIN, title: "Menu" }
      ],
      context
    );
  }

  async function startOrResumeDailyQuiz(user, context) {
    const today = formatDateInTimeZone(new Date(), config.timeZone);
    const weekStart = weekStartForDate(today);
    const quiz = db.ensureDailyQuiz(today, weekStart);
    const attempt = db.getOrCreateAttempt(user.id, quiz.id, quiz.total_questions);

    if (attempt.status === "completed") {
      await whatsapp.sendText(
        user.wa_id,
        [
          "Vous avez deja termine le quiz du jour.",
          "",
          `Score: ${attempt.score}/${attempt.total_questions}`,
          "Revenez demain pour un nouveau quiz IoT."
        ].join("\n"),
        context
      );
      await sendLeaderboard(user, context);
      return;
    }

    const stats = db.summarizeAttempt(attempt.id);
    await whatsapp.sendText(
      user.wa_id,
      [
        "Quiz du jour Funda - IoT",
        "",
        "20 questions. Chaque bonne reponse vaut 1 point.",
        "Bonus hebdomadaire: +5 points si vous terminez le quiz du jour.",
        "",
        `Progression actuelle: ${stats.answered}/${attempt.total_questions}`
      ].join("\n"),
      context
    );

    await sendCurrentQuestion(user, attempt, context);
  }

  async function sendCurrentQuestion(user, attempt, context) {
    const refreshed = db.syncAttemptProgress(attempt.id);
    if (refreshed.status === "completed") {
      await finishQuiz(user, refreshed, context);
      return;
    }

    const question = db.getQuestionByPosition(refreshed.quiz_id, refreshed.current_position);
    if (!question) {
      logger.warn("Question introuvable", {
        quizId: refreshed.quiz_id,
        position: refreshed.current_position
      });
      await whatsapp.sendText(
        user.wa_id,
        "Je ne trouve pas la prochaine question. Reessayez dans quelques instants.",
        context
      );
      return;
    }

    await whatsapp.sendList(
      user.wa_id,
      {
        header: `Question ${question.position}/20`,
        body: question.question,
        buttonText: "Repondre",
        sections: [
          {
            title: "Choix",
            rows: [
              { id: QUIZ_ANSWER_IDS.A, title: "A", description: question.option_a },
              { id: QUIZ_ANSWER_IDS.B, title: "B", description: question.option_b },
              { id: QUIZ_ANSWER_IDS.C, title: "C", description: question.option_c },
              { id: QUIZ_ANSWER_IDS.D, title: "D", description: question.option_d }
            ]
          }
        ]
      },
      context
    );
  }

  async function handleQuizAnswer(user, selectedOption, context) {
    const today = formatDateInTimeZone(new Date(), config.timeZone);
    const weekStart = weekStartForDate(today);
    const quiz = db.ensureDailyQuiz(today, weekStart);
    const attempt = db.getOrCreateAttempt(user.id, quiz.id, quiz.total_questions);

    if (attempt.status === "completed") {
      await whatsapp.sendText(user.wa_id, "Le quiz du jour est deja termine.", context);
      await sendScore(user, context);
      return;
    }

    const refreshed = db.syncAttemptProgress(attempt.id);
    const question = db.getQuestionByPosition(refreshed.quiz_id, refreshed.current_position);
    if (!question) {
      await whatsapp.sendText(user.wa_id, "Question introuvable. Tapez MENU pour revenir.", context);
      return;
    }

    const isCorrect = selectedOption === question.correct_option;
    const answerResult = db.recordQuizAnswer({
      attemptId: refreshed.id,
      questionId: question.id,
      selectedOption,
      isCorrect
    });

    const updatedAttempt = db.syncAttemptProgress(refreshed.id);
    db.recalculateWeeklyScore(user.id, updatedAttempt.week_start, "iot");

    if (!answerResult.inserted) {
      await whatsapp.sendText(
        user.wa_id,
        "Cette question avait deja une reponse enregistree. Je vous renvoie la prochaine question.",
        context
      );
      await sendCurrentQuestion(user, updatedAttempt, context);
      return;
    }

    await whatsapp.sendText(
      user.wa_id,
      [
        isCorrect ? "Bonne reponse." : "Pas encore.",
        `Reponse correcte: ${question.correct_option}`,
        question.explanation,
        "",
        `Score actuel: ${updatedAttempt.score}/${updatedAttempt.total_questions}`
      ].join("\n"),
      context
    );

    if (updatedAttempt.status === "completed") {
      await finishQuiz(user, updatedAttempt, context);
      return;
    }

    await sendCurrentQuestion(user, updatedAttempt, context);
  }

  async function finishQuiz(user, attempt, context) {
    const weeklyScore = db.recalculateWeeklyScore(user.id, attempt.week_start, "iot");
    await whatsapp.sendText(
      user.wa_id,
      [
        "Quiz du jour termine.",
        "",
        `Score du jour: ${attempt.score}/${attempt.total_questions}`,
        `Points hebdomadaires: ${weeklyScore?.points || 0}`,
        `Quiz termines cette semaine: ${weeklyScore?.quizzes_completed || 0}`,
        "",
        "Vous pouvez maintenant consulter le classement hebdomadaire."
      ].join("\n"),
      context
    );

    await whatsapp.sendButtons(
      user.wa_id,
      "Prochaine action.",
      [
        { id: MENU_IDS.LEADERBOARD, title: "Classement" },
        { id: MENU_IDS.SCORE, title: "Mon score" },
        { id: MENU_IDS.MAIN, title: "Menu" }
      ],
      context
    );
  }

  async function sendScore(user, context) {
    const today = formatDateInTimeZone(new Date(), config.timeZone);
    const weekStart = weekStartForDate(today);
    const score = db.recalculateWeeklyScore(user.id, weekStart, "iot");
    const profile = buildLearningProfile(score);
    db.updateUserLearningProfile(user.id, profile.level, profile.badges);

    await whatsapp.sendText(
      user.wa_id,
      [
        "Votre progression Funda - Semaine IoT",
        "",
        `Points: ${score?.points || 0}`,
        `Niveau: ${profile.level}`,
        `Badges: ${profile.badges.length > 0 ? profile.badges.join(", ") : "en cours"}`,
        `Bonnes reponses: ${score?.correct_answers || 0}/${score?.total_answers || 0}`,
        `Quiz termines: ${score?.quizzes_completed || 0}`,
        `Jours de participation: ${score?.days_participated || 0}/7`,
        "",
        "Bonus: +5 par quiz termine, +10 si vous participez au moins 5 jours."
      ].join("\n"),
      context
    );
  }

  async function sendWeeklyChallenge(user, context) {
    const today = formatDateInTimeZone(new Date(), config.timeZone);
    const weekStart = weekStartForDate(today);
    const score = db.recalculateWeeklyScore(user.id, weekStart, "iot");

    await whatsapp.sendText(
      user.wa_id,
      [
        "Challenge hebdomadaire Funda - IoT",
        "",
        "Objectif: progresser chaque jour avec 20 questions IoT.",
        "Le classement public affiche uniquement les 5 meilleurs.",
        "",
        `Votre semaine: ${score?.points || 0} points`,
        `Participation: ${score?.days_participated || 0}/7 jour(s)`,
        "",
        "Pour avancer: lancez le quiz du jour."
      ].join("\n"),
      context
    );

    await whatsapp.sendButtons(
      user.wa_id,
      "Continuer le challenge.",
      [
        { id: MENU_IDS.DAILY_QUIZ, title: "Quiz du jour" },
        { id: MENU_IDS.LEADERBOARD, title: "Classement" },
        { id: MENU_IDS.MAIN, title: "Menu" }
      ],
      context
    );
  }

  async function sendLeaderboard(user, context) {
    const today = formatDateInTimeZone(new Date(), config.timeZone);
    const weekStart = weekStartForDate(today);
    const top = db.getWeeklyTop(weekStart, "iot", 5);
    const ownScore = db.recalculateWeeklyScore(user.id, weekStart, "iot");

    const lines = ["Classement Funda - Semaine IoT", ""];
    if (top.length === 0) {
      lines.push("Aucun score pour le moment. Soyez le premier a faire le quiz du jour.");
    } else {
      top.forEach((row, index) => {
        lines.push(`${index + 1}. ${publicUserName(row)} - ${row.points} pts`);
      });
    }

    lines.push("");
    lines.push(`Votre score: ${ownScore?.points || 0} pts`);
    lines.push(`Semaine du ${weekStart}`);

    await whatsapp.sendText(user.wa_id, lines.join("\n"), context);
  }

  async function sendHelp(user, context) {
    await whatsapp.sendText(
      user.wa_id,
      [
        "Aide Funda",
        "",
        "Commandes utiles:",
        "- MENU: afficher le menu",
        "- QUIZ: lancer le quiz du jour",
        "- SCORE: voir votre progression",
        "- CLASSEMENT: voir le top 5 hebdomadaire",
        "- RESSOURCES: explorer les contenus IoT",
        "- STOP: vous desabonner",
        "- START: reprendre Funda",
        "",
        "Pendant un quiz, repondez avec A, B, C ou D."
      ].join("\n"),
      context
    );
  }

  return {
    handleIncoming,
    sendLeaderboard,
    sendMainMenu,
    startOrResumeDailyQuiz
  };
}

function isGreeting(text) {
  return ["bonjour", "salut", "hello", "start", "demarrer", "commencer"].includes(text);
}

function isStopCommand(text) {
  return ["stop", "desactiver", "desabonner", "desabonnement", "arreter", "quitter"].includes(text);
}

function isStartCommand(text) {
  return ["start", "reprendre", "reactiver", "activer"].includes(text);
}

function extractQuizAnswer(text, commandId) {
  for (const [option, id] of Object.entries(QUIZ_ANSWER_IDS)) {
    if (commandId === id) return option;
  }
  if (["a", "b", "c", "d"].includes(text)) return text.toUpperCase();
  if (/^[abcd][\). -]/.test(text)) return text[0].toUpperCase();
  return null;
}

function buildLearningProfile(score) {
  const points = Number(score?.points || 0);
  const days = Number(score?.days_participated || 0);
  const completed = Number(score?.quizzes_completed || 0);
  const correct = Number(score?.correct_answers || 0);

  let level = "debutant";
  if (points >= 90) level = "avance";
  else if (points >= 40) level = "intermediaire";

  const badges = [];
  if (completed >= 1) badges.push("Quiz termine");
  if (days >= 3) badges.push("Regulier");
  if (days >= 5) badges.push("Discipline");
  if (correct >= 50) badges.push("Explorateur IoT");
  if (points >= 100) badges.push("Expert IoT");

  return { level, badges };
}

module.exports = {
  MENU_IDS,
  QUIZ_ANSWER_IDS,
  buildLearningProfile,
  createConversationService
};
