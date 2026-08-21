import { useState } from "react";
import "./App.css";

/* =========================================================
   FAKE QUESTIONS
   FRONTEND TESTING ONLY
========================================================= */

// const fakeQuestions = [
//   {
//     id: 1,
//     question: "What is normalization in DBMS?",
//     options: [
//       "Organizing data to reduce redundancy",
//       "Encrypting database data",
//       "Sorting data alphabetically",
//       "Creating a backup of the database",
//     ],
//     correctAnswer: "Organizing data to reduce redundancy",
//     explanation:
//       "Normalization organizes database tables to reduce redundancy and improve data integrity.",
//     topic: "DBMS",
//     difficulty: "Medium",
//   },
//   {
//     id: 2,
//     question: "Which of the following is an ACID property?",
//     options: [
//       "Atomicity",
//       "Inheritance",
//       "Polymorphism",
//       "Encapsulation",
//     ],
//     correctAnswer: "Atomicity",
//     explanation:
//       "Atomicity ensures that a transaction is completed completely or not at all.",
//     topic: "DBMS",
//     difficulty: "Easy",
//   },
//   {
//     id: 3,
//     question: "Which data structure follows the LIFO principle?",
//     options: [
//       "Queue",
//       "Stack",
//       "Linked List",
//       "Array",
//     ],
//     correctAnswer: "Stack",
//     explanation:
//       "A stack follows the Last In, First Out principle.",
//     topic: "Data Structures",
//     difficulty: "Easy",
//   },
//   {
//     id: 4,
//     question: "Which keyword is used to inherit a class in Java?",
//     options: [
//       "implements",
//       "extends",
//       "inherits",
//       "super",
//     ],
//     correctAnswer: "extends",
//     explanation:
//       "The extends keyword is used when one Java class inherits another class.",
//     topic: "Java",
//     difficulty: "Easy",
//   },
//   {
//     id: 5,
//     question: "What does JVM stand for?",
//     options: [
//       "Java Variable Machine",
//       "Java Virtual Machine",
//       "Java Verified Machine",
//       "Java Visual Machine",
//     ],
//     correctAnswer: "Java Virtual Machine",
//     explanation:
//       "JVM stands for Java Virtual Machine and executes Java bytecode.",
//     topic: "Java",
//     difficulty: "Medium",
//   },
//   {
//     id: 6,
//     question: "Which SQL command is used to retrieve data from a table?",
//     options: [
//       "SELECT",
//       "UPDATE",
//       "DELETE",
//       "INSERT",
//     ],
//     correctAnswer: "SELECT",
//     explanation:
//       "The SELECT statement is used to retrieve data from one or more database tables.",
//     topic: "DBMS",
//     difficulty: "Easy",
//   },
//   {
//     id: 7,
//     question: "Which Java feature allows the same method name with different parameters?",
//     options: [
//       "Method Overloading",
//       "Method Overriding",
//       "Encapsulation",
//       "Inheritance",
//     ],
//     correctAnswer: "Method Overloading",
//     explanation:
//       "Method overloading allows multiple methods to have the same name with different parameter lists.",
//     topic: "Java",
//     difficulty: "Medium",
//   },
//   {
//     id: 8,
//     question: "Which data structure follows the FIFO principle?",
//     options: [
//       "Stack",
//       "Queue",
//       "Tree",
//       "Heap",
//     ],
//     correctAnswer: "Queue",
//     explanation:
//       "A queue follows the First In, First Out principle.",
//     topic: "Data Structures",
//     difficulty: "Easy",
//   },
//   {
//     id: 9,
//     question: "Which key uniquely identifies each record in a table?",
//     options: [
//       "Foreign Key",
//       "Candidate Key",
//       "Primary Key",
//       "Composite Key",
//     ],
//     correctAnswer: "Primary Key",
//     explanation:
//       "A primary key uniquely identifies each record in a database table.",
//     topic: "DBMS",
//     difficulty: "Medium",
//   },
//   {
//     id: 10,
//     question: "Which OOP concept hides internal implementation details?",
//     options: [
//       "Inheritance",
//       "Polymorphism",
//       "Encapsulation",
//       "Abstraction",
//     ],
//     correctAnswer: "Encapsulation",
//     explanation:
//       "Encapsulation bundles data and methods together and controls access to internal data.",
//     topic: "Java",
//     difficulty: "Hard",
//   },
// ];


/* =========================================================
   LOAD HISTORY
========================================================= */

const loadHistory = () => {
  try {
    const saved =
      localStorage.getItem("quizHistory");

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((quiz) => ({
      ...quiz,

      quizGroupId:
        quiz.quizGroupId ||
        String(quiz.id),

      title:
        quiz.title ||
        quiz.fileName?.replace(
          /\.pdf$/i,
          ""
        ) ||
        "My Quiz",

      answers:
        Array.isArray(quiz.answers)
          ? quiz.answers
          : [],

      questions:
        Array.isArray(quiz.questions)
          ? quiz.questions
          : [],
    }));
  } catch {
    return [];
  }
};


/* =========================================================
   DASHBOARD QUESTION TRACKING
========================================================= */

/*
  A question is identified by sourceId when available.
  This means the same question is counted only once even if:
  - it appears more than once in a generated quiz
  - it appears again in another quiz
  - it is answered again during a retake
*/
const getQuestionKey = (answer) => {
  if (answer?.sourceId !== undefined && answer?.sourceId !== null) {
    return String(answer.sourceId);
  }

  if (answer?.questionId !== undefined && answer?.questionId !== null) {
    return String(answer.questionId);
  }

  return String(
    answer?.question ||
      `${answer?.topic || "General"}-${answer?.correctAnswer || ""}`
  ).trim().toLowerCase();
};

const getAllAnswers = (history) => {
  const allAnswers = [];

  history.forEach((quiz) => {
    (quiz.answers || []).forEach((answer) => {
      allAnswers.push({
        ...answer,
        quizId: quiz.id,
        timestamp: quiz.timestamp || quiz.id || 0,
      });
    });
  });

  return allAnswers.sort(
    (a, b) => a.timestamp - b.timestamp
  );
};

const getCurrentQuestionStats = (history) => {
  const latestByQuestion = {};

  getAllAnswers(history).forEach((answer) => {
    latestByQuestion[getQuestionKey(answer)] = answer;
  });

  const latestAnswers = Object.values(latestByQuestion);

  const total = latestAnswers.length;
  const correct = latestAnswers.filter(
    (answer) => answer.isCorrect
  ).length;

  const topicStats = {};

  latestAnswers.forEach((answer) => {
    const topicName = answer.topic || "General";

    if (!topicStats[topicName]) {
      topicStats[topicName] = {
        correct: 0,
        total: 0,
      };
    }

    topicStats[topicName].total += 1;

    if (answer.isCorrect) {
      topicStats[topicName].correct += 1;
    }
  });

  return {
    latestAnswers,
    total,
    correct,
    accuracy:
      total > 0
        ? Math.round((correct / total) * 100)
        : 0,
    topicStats,
  };
};

const getBestQuestionStats = (history) => {
  const bestByQuestion = {};

  getAllAnswers(history).forEach((answer) => {
    const key = getQuestionKey(answer);
    const existing = bestByQuestion[key];

    if (!existing) {
      bestByQuestion[key] = answer;
      return;
    }

    /*
      Once a question has been answered correctly,
      the best result for that question remains correct.
    */
    if (!existing.isCorrect && answer.isCorrect) {
      bestByQuestion[key] = answer;
    }
  });

  const bestAnswers = Object.values(bestByQuestion);

  const total = bestAnswers.length;
  const correct = bestAnswers.filter(
    (answer) => answer.isCorrect
  ).length;

  return {
    bestAnswers,
    total,
    correct,
    accuracy:
      total > 0
        ? Math.round((correct / total) * 100)
        : 0,
  };
};


/* =========================================================
   APP
========================================================= */

function App() {

  const [screen, setScreen] =
    useState("upload");

  const [showCreator, setShowCreator] =
    useState(false);

  const [file, setFile] =
    useState(null);

  const [difficulty, setDifficulty] =
    useState("Medium");

  const [topic, setTopic] =
    useState("All Topics");

  const [numQuestions, setNumQuestions] =
    useState(5);

  const [questions, setQuestions] =
    useState([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [showAnswer, setShowAnswer] =
    useState(false);

  const [answers, setAnswers] =
    useState([]);

  const [score, setScore] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [history, setHistory] =
    useState(loadHistory);

  const [selectedHistoryQuiz, setSelectedHistoryQuiz] =
    useState(null);

  const [darkMode, setDarkMode] =
    useState(false);

  const [retakeGroupId, setRetakeGroupId] =
    useState(null);

  const [retakeTitle, setRetakeTitle] =
    useState(null);


  /* =========================================================
     SAVE HISTORY
  ========================================================= */

  const saveHistory = (newHistory) => {

    setHistory(newHistory);

    localStorage.setItem(
      "quizHistory",
      JSON.stringify(newHistory)
    );
  };


  /* =========================================================
     FILE UPLOAD
  ========================================================= */

  const handleFileChange = (event) => {

    const selectedFile =
      event.target.files[0];

    if (!selectedFile) return;

    if (
      selectedFile.type !==
      "application/pdf"
    ) {

      setError(
        "Please upload a PDF file only."
      );

      setFile(null);

      return;
    }

    setFile(selectedFile);

    setError("");
  };


  /* =========================================================
     NUMBER OF QUESTIONS
  ========================================================= */

  const handleQuestionNumberChange =
    (event) => {

      const value =
        event.target.value;

      if (value === "") {
        setNumQuestions("");
        return;
      }

      const number =
        Number(value);

      if (
        number >= 1 &&
        number <= 50
      ) {
        setNumQuestions(number);
      }
    };


  /* =========================================================
     GENERATE QUIZ
  ========================================================= */

  // const handleGenerateQuiz = () => {

  //   if (!file) {

  //     setError(
  //       "Please upload a PDF first."
  //     );

  //     return;
  //   }

  //   if (
  //     !numQuestions ||
  //     numQuestions < 1 ||
  //     numQuestions > 50
  //   ) {

  //     setError(
  //       "Please enter a number between 1 and 50."
  //     );

  //     return;
  //   }

  //   setError("");
  //   setLoading(true);

  //   setTimeout(() => {

  //     let availableQuestions =
  //       fakeQuestions;

  //     if (
  //       topic !== "All Topics"
  //     ) {

  //       const filtered =
  //         fakeQuestions.filter(
  //           (question) =>
  //             question.topic ===
  //             topic
  //         );

  //       if (filtered.length > 0) {
  //         availableQuestions =
  //           filtered;
  //       }
  //     }


  //     const generatedQuestions = [];

  //     for (
  //       let i = 0;
  //       i < numQuestions;
  //       i++
  //     ) {

  //       const original =
  //         availableQuestions[
  //           i %
  //             availableQuestions.length
  //         ];

  //       generatedQuestions.push({

  //         ...original,

  //         id:
  //           `${Date.now()}-${i}`,

  //         sourceId:
  //           original.id,
  //       });
  //     }


  //     setQuestions(
  //       generatedQuestions
  //     );

  //     setCurrentQuestion(0);

  //     setSelectedAnswer(null);

  //     setShowAnswer(false);

  //     setAnswers([]);

  //     setScore(0);

  //     setLoading(false);

  //     setScreen("quiz");

  //   }, 800);
  // };
  const handleGenerateQuiz = () => {

  if (!file) {
    setError("Please upload a PDF first.");
    return;
  }

  if (!numQuestions || numQuestions < 1 || numQuestions > 50) {
    setError("Please enter a number between 1 and 50.");
    return;
  }

  setError("");
  setLoading(true);

  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("numQuestions", numQuestions);

  fetch("https://mcqs-0c2b.onrender.com/generate-mcqs", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      const generatedQuestions = data.questions.map((q, index) => ({
        id: `Date.now()-{index}`,
        sourceId: `Date.now()-{index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        topic: q.topic,
        difficulty: difficulty,
      }));

      setQuestions(generatedQuestions);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setAnswers([]);
      setScore(0);
      setLoading(false);
      setScreen("quiz");

    })
    .catch((err) => {
      console.error(err);
      setError("Something went wrong generating your quiz. Please try again.");
      setLoading(false);
    });
};




  /* =========================================================
     SELECT ANSWER
  ========================================================= */

  const handleAnswerSelect =
    (answer) => {

      if (showAnswer) return;

      const question =
        questions[currentQuestion];

      const isCorrect =
        answer ===
        question.correctAnswer;


      setSelectedAnswer(answer);

      setShowAnswer(true);


      if (isCorrect) {

        setScore(
          (previous) =>
            previous + 1
        );
      }


      setAnswers(
        (previous) => [

          ...previous,

          {
            questionId:
              question.id,

            sourceId:
              question.sourceId ||
              question.id,

            question:
              question.question,

            selectedAnswer:
              answer,

            correctAnswer:
              question.correctAnswer,

            topic:
              question.topic,

            isCorrect,
          },

        ]
      );
    };


  /* =========================================================
     COMPLETE QUIZ
  ========================================================= */

  const completeQuiz = () => {

    const currentQuestionData =
      questions[currentQuestion];


    const currentAnswer = {

      questionId:
        currentQuestionData.id,

      sourceId:
        currentQuestionData.sourceId ||
        currentQuestionData.id,

      question:
        currentQuestionData.question,

      selectedAnswer:
        selectedAnswer,

      correctAnswer:
        currentQuestionData.correctAnswer,

      topic:
        currentQuestionData.topic,

      isCorrect:
        selectedAnswer ===
        currentQuestionData.correctAnswer,
    };


    const finalAnswers =
      answers.length ===
      questions.length
        ? answers
        : [
            ...answers,
            currentAnswer,
          ];


    const completedScore =
      finalAnswers.filter(
        (answer) =>
          answer.isCorrect
      ).length;


    const groupId =
      retakeGroupId ||
      String(Date.now());


    const title =
      retakeTitle ||
      (
        file?.name
          ? file.name.replace(
              /\.pdf$/i,
              ""
            )
          : "My Quiz"
      );


    const newQuiz = {

      id: Date.now(),

      quizGroupId:
        groupId,

      title,

      fileName:
        file?.name ||
        "Study Material",

      difficulty,

      topic,

      numQuestions:
        questions.length,

      date:
        new Date().toLocaleDateString(),

      timestamp:
        Date.now(),

      score:
        completedScore,

      total:
        questions.length,

      questions,

      answers:
        finalAnswers,
    };


    const updatedHistory = [
      newQuiz,
      ...history,
    ];


    saveHistory(
      updatedHistory
    );


    setSelectedHistoryQuiz(
      newQuiz
    );

    setRetakeGroupId(null);

    setRetakeTitle(null);

    setScreen("result");
  };


  /* =========================================================
     NEXT QUESTION
  ========================================================= */

  const handleNext = () => {

    if (
      currentQuestion <
      questions.length - 1
    ) {

      setCurrentQuestion(
        (previous) =>
          previous + 1
      );

      setSelectedAnswer(null);

      setShowAnswer(false);

      return;
    }

    completeQuiz();
  };


  /* =========================================================
     NEW QUIZ
  ========================================================= */

  const handleNewQuiz = () => {

    setFile(null);

    setQuestions([]);

    setCurrentQuestion(0);

    setSelectedAnswer(null);

    setShowAnswer(false);

    setAnswers([]);

    setScore(0);

    setError("");

    setRetakeGroupId(null);

    setRetakeTitle(null);

    setShowCreator(true);

    setScreen("upload");
  };


  /* =========================================================
     RETAKE QUIZ
  ========================================================= */

  const handleRetakeQuiz =
    (quiz) => {

      setQuestions(
        quiz.questions
      );

      setDifficulty(
        quiz.difficulty
      );

      setTopic(
        quiz.topic
      );

      setNumQuestions(
        quiz.questions.length
      );

      setCurrentQuestion(0);

      setSelectedAnswer(null);

      setShowAnswer(false);

      setAnswers([]);

      setScore(0);


      setRetakeGroupId(
        quiz.quizGroupId ||
        String(quiz.id)
      );


      setRetakeTitle(
        quiz.title
      );


      setSelectedHistoryQuiz(
        null
      );

      setScreen("quiz");
    };


  /* =========================================================
     OPEN HISTORY QUIZ
  ========================================================= */

  const openHistoryQuiz =
    (quiz) => {

      setSelectedHistoryQuiz(
        quiz
      );

      setScreen(
        "history-detail"
      );
    };


  /* =========================================================
     RENAME QUIZ
  ========================================================= */

  const renameQuiz =
    (quizId) => {

      const quiz =
        history.find(
          (item) =>
            item.id === quizId
        );

      if (!quiz) return;


      const newName =
        window.prompt(
          "Enter a new name for this quiz:",
          quiz.title
        );


      if (
        !newName ||
        !newName.trim()
      ) {
        return;
      }


      const updatedHistory =
        history.map(
          (item) =>
            item.quizGroupId ===
            quiz.quizGroupId
              ? {
                  ...item,
                  title:
                    newName.trim(),
                }
              : item
        );


      saveHistory(
        updatedHistory
      );


      if (
        selectedHistoryQuiz?.quizGroupId ===
        quiz.quizGroupId
      ) {

        setSelectedHistoryQuiz({

          ...selectedHistoryQuiz,

          title:
            newName.trim(),

        });
      }
    };


  /* =========================================================
     NAVBAR
  ========================================================= */

  const Navbar =
    ({ active }) => {

      return (

        <nav className="navbar">

          <div className="brand">

            <div className="brand-logo">
              ✦
            </div>


            <div>

              <div className="brand-name">
                Quiz<span>AI</span>
              </div>

              <div className="brand-subtitle">
                Smart learning assistant
              </div>

            </div>

          </div>


          <div className="nav-right">

            <div className="nav-links">

              <button
                className={
                  active === "upload"
                    ? "nav-active"
                    : ""
                }
                onClick={() => {

                  setScreen(
                    "upload"
                  );

                  setShowCreator(
                    false
                  );

                }}
              >
                ⌂ Home
              </button>


              <button
                className={
                  active === "dashboard"
                    ? "nav-active"
                    : ""
                }
                onClick={() =>
                  setScreen(
                    "dashboard"
                  )
                }
              >
                ▥ Dashboard
              </button>


              <button
                className={
                  active === "history"
                    ? "nav-active"
                    : ""
                }
                onClick={() =>
                  setScreen(
                    "history"
                  )
                }
              >
                ◷ History
              </button>

            </div>


            <button
              className="theme-toggle"
              onClick={() =>
                setDarkMode(
                  (previous) =>
                    !previous
                )
              }
            >
              {darkMode
                ? "☀️"
                : "🌙"}
            </button>

          </div>

        </nav>
      );
    };


  /* =========================================================
     HOME
  ========================================================= */

  if (
    screen === "upload"
  ) {

    return (

      <div
        className={
          darkMode
            ? "app dark-mode"
            : "app"
        }
      >

        <Navbar active="upload" />


        <main className="home-page">

          <section className="hero-section">

            <div className="ai-badge">
              ✨ AI POWERED LEARNING
            </div>


            <h1>
              Turn your notes into
              <span>
                smart quizzes.
              </span>
            </h1>


            <p className="hero-description">
              Upload your study material
              and let AI create personalized
              MCQs to help you learn faster,
              smarter, and better.
            </p>


            <div className="hero-features">

              <button
                className="mini-feature upload-feature"
                onClick={() =>
                  setShowCreator(true)
                }
              >

                <div className="mini-icon purple">
                  📄
                </div>


                <div>

                  <strong>
                    Upload Notes
                  </strong>

                  <p>
                    Use your own study material
                  </p>

                </div>

              </button>

            </div>

          </section>


          {showCreator && (

            <section className="quiz-creator">

              <div className="creator-heading">

                <div className="creator-icon">
                  📄
                </div>


                <div>

                  <h2>
                    Create a Quiz
                  </h2>

                  <p>
                    Start with your study material
                  </p>

                </div>

              </div>


              <label className="drop-zone">

                <div className="cloud-icon">
                  ☁
                </div>


                <h3>
                  {file
                    ? "PDF Selected ✓"
                    : "Upload your PDF"}
                </h3>


                <p>
                  {file
                    ? file.name
                    : "Drag & drop your file here or click to browse"}
                </p>


                <small>
                  📄 PDF files only
                </small>


                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={
                    handleFileChange
                  }
                />

              </label>


              <div className="form-row">

                <div className="form-group">

                  <label>
                    📊 Difficulty Level
                  </label>


                  <div className="difficulty-buttons">

                    {[
                      "Easy",
                      "Medium",
                      "Hard",
                    ].map(
                      (level) => (

                        <button
                          key={level}
                          type="button"
                          className={
                            difficulty ===
                            level
                              ? "difficulty selected"
                              : "difficulty"
                          }
                          onClick={() =>
                            setDifficulty(
                              level
                            )
                          }
                        >

                          {level === "Easy" &&
                            "🟢"}

                          {level === "Medium" &&
                            "🟡"}

                          {level === "Hard" &&
                            "🔴"}

                          {" "}

                          {level}

                        </button>

                      )
                    )}

                  </div>

                </div>


                <div className="form-group">

                  <label>
                    📚 Select Topic
                  </label>


                  <select
                    value={topic}
                    onChange={(event) =>
                      setTopic(
                        event.target.value
                      )
                    }
                  >

                    <option>
                      All Topics
                    </option>

                    <option>
                      DBMS
                    </option>

                    <option>
                      Java
                    </option>

                    <option>
                      Data Structures
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    📝 Number of Questions
                  </label>


                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={numQuestions}
                    onChange={
                      handleQuestionNumberChange
                    }
                    placeholder="Enter number"
                  />


                  <small className="input-hint">
                    Enter between 1 and 50 questions
                  </small>

                </div>

              </div>


              {error && (

                <div className="error-message">
                  ⚠️ {error}
                </div>

              )}


              <button
                className="generate-button"
                onClick={
                  handleGenerateQuiz
                }
                disabled={loading}
              >

                {loading ? (

                  <>
                    <span className="spinner"></span>
                    Creating your quiz...
                  </>

                ) : (

                  <>
                    🚀 Generate Quiz →
                  </>

                )}

              </button>


              <div className="security-note">
                🔒 Your study material is safe and secure
              </div>

            </section>

          )}

        </main>

      </div>
    );
  }


  /* =========================================================
     QUIZ
  ========================================================= */

  if (
    screen === "quiz"
  ) {

    const question =
      questions[currentQuestion];

    if (!question) {
      return null;
    }


    const progress =
      ((currentQuestion + 1) /
        questions.length) *
      100;


    return (

      <div
        className={
          darkMode
            ? "app dark-mode"
            : "app"
        }
      >

        <Navbar active="" />


        <main className="quiz-page">

          <div className="quiz-progress-header">

            <div>

              <span>
                QUESTION{" "}
                {currentQuestion + 1}
                {" "}OF{" "}
                {questions.length}
              </span>


              <div className="progress-bar">

                <div
                  style={{
                    width:
                      `${progress}%`,
                  }}
                />

              </div>

            </div>


            <span className="difficulty-tag">
              {difficulty}
            </span>

          </div>


          <div className="question-card">

            <div className="topic-tag">
              📚 {question.topic}
            </div>


            <h1>
              {question.question}
            </h1>


            <div className="answer-list">

              {question.options.map(
                (
                  option,
                  index
                ) => {

                  let className =
                    "answer-option";


                  if (showAnswer) {

                    if (
                      option ===
                      question.correctAnswer
                    ) {

                      className +=
                        " correct-answer";

                    } else if (
                      option ===
                      selectedAnswer
                    ) {

                      className +=
                        " wrong-answer";
                    }
                  }


                  return (

                    <button
                      key={option}
                      className={
                        className
                      }
                      disabled={
                        showAnswer
                      }
                      onClick={() =>
                        handleAnswerSelect(
                          option
                        )
                      }
                    >

                      <span className="answer-letter">
                        {String.fromCharCode(
                          65 + index
                        )}
                      </span>


                      <span>
                        {option}
                      </span>

                    </button>
                  );
                }
              )}

            </div>


            {showAnswer && (

              <div className="answer-feedback">

                <h3>
                  {selectedAnswer ===
                  question.correctAnswer
                    ? "🎉 Correct!"
                    : "💭 Keep learning!"}
                </h3>


                <p>
                  <strong>
                    Correct answer:
                  </strong>{" "}
                  {question.correctAnswer}
                </p>


                <div className="explanation">

                  <strong>
                    💡 Why?
                  </strong>

                  <p>
                    {question.explanation}
                  </p>

                </div>

              </div>

            )}


            {showAnswer && (

              <button
                className="next-button"
                onClick={
                  handleNext
                }
              >

                {currentQuestion ===
                questions.length - 1
                  ? "See My Results →"
                  : "Next Question →"}

              </button>

            )}

          </div>

        </main>

      </div>
    );
  }


  /* =========================================================
     RESULT
  ========================================================= */

  if (
    screen === "result"
  ) {

    const quiz =
      history[0];

    const percentage =
      quiz?.total > 0
        ? Math.round(
            (quiz.score /
              quiz.total) *
              100
          )
        : 0;


    return (

      <div
        className={
          darkMode
            ? "app dark-mode"
            : "app"
        }
      >

        <Navbar active="" />


        <main className="result-page">

          <div className="result-heading">

            <span className="ai-badge">
              🎉 QUIZ COMPLETE
            </span>


            <h1>
              Great job!
            </h1>


            <p>
              Here's a quick look at your performance.
            </p>

          </div>


          <div className="score-summary">

            <div className="score-circle">

              <strong>
                {percentage}%
              </strong>

              <span>
                Your Score
              </span>

            </div>


            <div className="score-stats">

              <div>

                <strong>
                  {quiz?.score || 0}
                </strong>

                <span>
                  ✓ Correct
                </span>

              </div>


              <div>

                <strong>
                  {(quiz?.total || 0) -
                    (quiz?.score || 0)}
                </strong>

                <span>
                  × Wrong
                </span>

              </div>


              <div>

                <strong>
                  {quiz?.total || 0}
                </strong>

                <span>
                  Questions
                </span>

              </div>

            </div>

          </div>


          <div className="result-actions">

            <button
              className="generate-button"
              onClick={() =>
                handleRetakeQuiz(
                  quiz
                )
              }
            >
              🔄 Retake Quiz
            </button>


            <button
              className="outline-button"
              onClick={() =>
                setScreen(
                  "dashboard"
                )
              }
            >
              📊 View Dashboard
            </button>


            <button
              className="outline-button"
              onClick={
                handleNewQuiz
              }
            >
              📄 Create New Quiz
            </button>

          </div>

        </main>

      </div>
    );
  }


  /* =========================================================
     DASHBOARD
  ========================================================= */

  if (
    screen === "dashboard"
  ) {
    /*
      CURRENT:
      For every question, only its latest answer is used.

      Example:
      Question A was correct in the first attempt,
      then wrong in a retake.

      Current -> wrong
      Best    -> correct

      If the retake changes the answer from wrong to correct,
      Current increases again.

      BEST:
      For every question, once it has been answered correctly,
      that question remains correct in the best statistics.
    */

    const currentStats =
      getCurrentQuestionStats(history);

    const bestStats =
      getBestQuestionStats(history);

    const topicPerformance =
      Object.entries(
        currentStats.topicStats
      )
        .map(
          ([
            topicName,
            data,
          ]) => ({
            topicName,
            percentage:
              data.total > 0
                ? Math.round(
                    (data.correct /
                      data.total) *
                      100
                  )
                : 0,
            correct:
              data.correct,
            total:
              data.total,
          })
        )
        .sort(
          (a, b) =>
            b.percentage -
            a.percentage
        );

    return (
      <div
        className={
          darkMode
            ? "app dark-mode"
            : "app"
        }
      >
        <Navbar active="dashboard" />

        <main className="dashboard-page">

          <div className="dashboard-heading">
            <span className="ai-badge">
              📈 YOUR PROGRESS
            </span>

            <h1>
              Performance Dashboard
            </h1>

            <p>
              Track your current performance and your best results over time.
            </p>
          </div>

          {/* =================================================
              CURRENT PROGRESS
          ================================================= */}

          <section className="dashboard-section">

            <h2 className="dashboard-section-title">
              📊 Current Progress
            </h2>

            <div className="stats-grid">

              {/* CURRENT ACCURACY */}

              <div className="stat-card">

                <div className="stat-icon green">
                  ✓
                </div>

                <p>
                  Current Accuracy
                </p>

                <h2>
                  {currentStats.accuracy}%
                </h2>

                <small>
                  Based on the latest answer for each question
                </small>

              </div>

              {/* CURRENT SCORE */}

              <div className="stat-card">

                <div className="stat-icon purple">
                  🎯
                </div>

                <p>
                  Current Score
                </p>

                <h2>
                  {currentStats.correct}/
                  {currentStats.total}
                </h2>

                <small>
                  Current correct answers across all quizzes
                </small>

              </div>

              {/* QUESTIONS PRACTICED */}

              <div className="stat-card">

                <div className="stat-icon orange">
                  ❓
                </div>

                <p>
                  Questions Practiced
                </p>

                <h2>
                  {currentStats.total}
                </h2>

                <small>
                  Total different questions attempted
                </small>

              </div>

            </div>
          </section>

          {/* =================================================
              OVERALL BEST
          ================================================= */}

          <section className="dashboard-section">

            <h2 className="dashboard-section-title">
              🏆 Overall Best
            </h2>

            <div className="stats-grid">

              {/* BEST ACCURACY */}

              <div className="stat-card">

                <div className="stat-icon purple">
                  🏆
                </div>

                <p>
                  Best Accuracy
                </p>

                <h2>
                  {bestStats.accuracy}%
                </h2>

                <small>
                  Best result retained for each question
                </small>

              </div>

              {/* BEST SCORE */}

              <div className="stat-card">

                <div className="stat-icon green">
                  ⭐
                </div>

                <p>
                  Best Score
                </p>

                <h2>
                  {bestStats.correct}/
                  {bestStats.total}
                </h2>

                <small>
                  Highest correct result across all questions
                </small>

              </div>

              {/* QUESTIONS PRACTICED */}

              <div className="stat-card">

                <div className="stat-icon orange">
                  📚
                </div>

                <p>
                  Questions Practiced
                </p>

                <h2>
                  {bestStats.total}
                </h2>

                <small>
                  Questions included in your progress
                </small>

              </div>

            </div>
          </section>

          {/* =================================================
              TOPICS COVERED
          ================================================= */}

          <div className="dashboard-panel">

            <h2>
              📚 Topics Covered
            </h2>

            {topicPerformance.length === 0 ? (

              <div className="empty-dashboard">

                <div className="empty-icon">
                  📊
                </div>

                <h3>
                  No topic data yet
                </h3>

                <p>
                  Complete a quiz to start tracking topic-wise performance.
                </p>

              </div>

            ) : (

              topicPerformance.map(
                (
                  topicData
                ) => (

                  <div
                    className="dashboard-topic"
                    key={
                      topicData.topicName
                    }
                  >

                    <div className="topic-heading">

                      <strong>
                        {topicData.topicName}
                      </strong>

                      <span>
                        {topicData.percentage}%
                      </span>

                    </div>

                    <div className="performance-track">

                      <div
                        style={{
                          width:
                            `${topicData.percentage}%`,
                        }}
                      />

                    </div>

                    <small>
                      {topicData.percentage}% accuracy
                      {" · "}
                      {topicData.correct}
                      {" correct out of "}
                      {topicData.total}
                    </small>

                  </div>

                )
              )

            )}

          </div>

        </main>

      </div>
    );
  }


  /* =========================================================
     HISTORY
  ========================================================= */

  if (
    screen === "history"
  ) {

    return (

      <div
        className={
          darkMode
            ? "app dark-mode"
            : "app"
        }
      >

        <Navbar active="history" />


        <main className="history-page">

          <div className="dashboard-heading">

            <span className="ai-badge">
              🕘 QUIZ HISTORY
            </span>


            <h1>
              Your Quiz History
            </h1>


            <p>
              Review your quizzes and track your retake performance.
            </p>

          </div>


          {history.length === 0 ? (

            <div className="empty-history">

              <div className="empty-icon">
                📝
              </div>


              <h2>
                No quiz history yet
              </h2>


              <p>
                Complete your first quiz and it will appear here.
              </p>


              <button
                className="generate-button"
                onClick={() => {

                  setScreen(
                    "upload"
                  );

                  setShowCreator(
                    true
                  );

                }}
              >
                🚀 Create Your First Quiz
              </button>

            </div>

          ) : (

            <div className="history-list">

              {history.map(
                (quiz) => {

                  const percentage =
                    quiz.total > 0
                      ? Math.round(
                          (quiz.score /
                            quiz.total) *
                            100
                        )
                      : 0;


                  return (

                    <div
                      className="history-card"
                      key={quiz.id}
                    >

                      <div
                        className="history-click-area"
                        onClick={() =>
                          openHistoryQuiz(
                            quiz
                          )
                        }
                      >

                        <div className="history-icon">
                          📄
                        </div>


                        <div className="history-info">

                          <h3>
                            {quiz.title}
                          </h3>


                          <p>
                            {quiz.topic}
                            {" · "}
                            {quiz.difficulty}
                            {" · "}
                            {quiz.total}
                            {" questions · "}
                            {quiz.date}
                          </p>

                        </div>


                        <div className="history-score">

                          <strong>
                            {percentage}%
                          </strong>


                          <span>
                            {quiz.score}/
                            {quiz.total} correct
                          </span>

                        </div>

                      </div>


                      <button
                        className="history-menu-button"
                        title="Rename quiz"
                        onClick={(event) => {

                          event.stopPropagation();

                          renameQuiz(
                            quiz.id
                          );

                        }}
                      >
                        ⋮
                      </button>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </main>

      </div>
    );
  }


  /* =========================================================
     HISTORY DETAIL
  ========================================================= */

  if (
    screen === "history-detail"
  ) {

    if (
      !selectedHistoryQuiz
    ) {

      return null;
    }


    const quiz =
      selectedHistoryQuiz;


    const percentage =
      quiz.total > 0
        ? Math.round(
            (quiz.score /
              quiz.total) *
              100
          )
        : 0;


    /*
      All attempts of this quiz
    */

    const quizAttempts =
      history
        .filter(
          (item) =>
            item.quizGroupId ===
            quiz.quizGroupId
        )
        .sort(
          (a, b) =>
            (a.timestamp || a.id) -
            (b.timestamp || b.id)
        );


    /*
      Topic performance for
      selected attempt
    */

    const quizTopics = {};


    (quiz.answers || []).forEach(
      (answer) => {

        const topicName =
          answer.topic ||
          "General";


        if (
          !quizTopics[
            topicName
          ]
        ) {

          quizTopics[
            topicName
          ] = {
            correct: 0,
            total: 0,
          };
        }


        quizTopics[
          topicName
        ].total++;


        if (
          answer.isCorrect
        ) {

          quizTopics[
            topicName
          ].correct++;
        }

      }
    );


    return (

      <div
        className={
          darkMode
            ? "app dark-mode"
            : "app"
        }
      >

        <Navbar active="history" />


        <main className="history-detail-page">

          <div className="history-detail-header">

            <div>

              <span className="ai-badge">
                📝 QUIZ DETAILS
              </span>


              <h1>
                {quiz.title}
              </h1>


              <p>
                {quiz.topic}
                {" · "}
                {quiz.difficulty}
                {" · "}
                {quiz.total}
                {" questions · "}
                {quiz.date}
              </p>

            </div>


            <button
              className="generate-button detail-retake"
              onClick={() =>
                handleRetakeQuiz(
                  quiz
                )
              }
            >
              🔄 Retake Quiz
            </button>

          </div>


          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-icon green">
                ✓
              </div>


              <p>
                Quiz Accuracy
              </p>


              <h2>
                {percentage}%
              </h2>

            </div>


            <div className="stat-card">

              <div className="stat-icon purple">
                🎯
              </div>


              <p>
                Correct Answers
              </p>


              <h2>
                {quiz.score}
              </h2>

            </div>


            <div className="stat-card">

              <div className="stat-icon orange">
                ❓
              </div>


              <p>
                Questions Practiced
              </p>


              <h2>
                {quiz.total}
              </h2>

            </div>

          </div>


          {/* PERFORMANCE HISTORY */}

          <div className="dashboard-panel">

            <h2>
              📈 Performance History
            </h2>


            <div className="attempt-history">

              {quizAttempts.map(
                (
                  attempt,
                  index
                ) => {

                  const attemptPercentage =
                    attempt.total > 0
                      ? Math.round(
                          (attempt.score /
                            attempt.total) *
                            100
                        )
                      : 0;


                  return (

                    <div
                      className="attempt-row"
                      key={attempt.id}
                    >

                      <div>

                        <strong>
                          Attempt {index + 1}
                        </strong>


                        <small>
                          {attempt.date}
                        </small>

                      </div>


                      <div className="attempt-bar">

                        <div
                          style={{
                            width:
                              `${attemptPercentage}%`,
                          }}
                        />

                      </div>


                      <strong>
                        {attempt.score}/
                        {attempt.total}
                        {" "}
                        ({attemptPercentage}%)
                      </strong>

                    </div>
                  );
                }
              )}

            </div>

          </div>


          {/* TOPIC PERFORMANCE */}

          <div className="dashboard-panel">

            <h2>
              📚 Topic Performance
            </h2>


            {Object.entries(
              quizTopics
            ).map(
              (
                [
                  topicName,
                  data,
                ]
              ) => {

                const topicPercentage =
                  data.total > 0
                    ? Math.round(
                        (data.correct /
                          data.total) *
                          100
                      )
                    : 0;


                return (

                  <div
                    className="dashboard-topic"
                    key={topicName}
                  >

                    <div className="topic-heading">

                      <strong>
                        {topicName}
                      </strong>


                      <span>
                        {topicPercentage}%
                      </span>

                    </div>


                    <div className="performance-track">

                      <div
                        style={{
                          width:
                            `${topicPercentage}%`,
                        }}
                      />

                    </div>


                    <small>
                      {data.correct}
                      {" correct out of "}
                      {data.total}
                    </small>

                  </div>
                );
              }
            )}

          </div>


          {/* QUESTIONS */}

          <div className="dashboard-panel">

            <h2>
              ❓ Questions in this Quiz
            </h2>


            {(quiz.answers || []).map(
              (
                answer,
                index
              ) => (

                <div
                  className="history-question"
                  key={index}
                >

                  <div>

                    <strong>
                      Q{index + 1}.{" "}
                      {answer.question}
                    </strong>


                    <p>
                      Your answer:{" "}
                      {answer.selectedAnswer}
                    </p>


                    {!answer.isCorrect && (

                      <p>
                        Correct answer:{" "}
                        {answer.correctAnswer}
                      </p>

                    )}

                  </div>


                  <span
                    className={
                      answer.isCorrect
                        ? "question-correct"
                        : "question-wrong"
                    }
                  >
                    {answer.isCorrect
                      ? "✓ Correct"
                      : "✕ Wrong"}
                  </span>

                </div>

              )
            )}

          </div>

        </main>

      </div>
    );
  }


  return null;
}


export default App;
