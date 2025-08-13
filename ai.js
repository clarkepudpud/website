// Chat memory (chat log) FAQ
const chatbox = document.getElementById("chatbox");
const questionButtons = document.getElementById("question-buttons");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// FAQ

// Fuzzy matching with basic similarity
function findClosestMatch(input) {
  input = input.toLowerCase();
  let highestScore = 0;
  let bestMatch = null;

  faqData.forEach(item => {
    const scoreMain = getSimilarity(input, item.question.toLowerCase());
    if (scoreMain > highestScore) {
      highestScore = scoreMain;
      bestMatch = item;
    }

    if (item.altQuestions) {
      item.altQuestions.forEach(alt => {
        const scoreAlt = getSimilarity(input, alt.toLowerCase());
        if (scoreAlt > highestScore) {
          highestScore = scoreAlt;
          bestMatch = item;
        }
      });
    }
  });

  return highestScore >= 0.4 ? bestMatch : null;
}

// Very basic similarity score (word overlap) with special character handling
function getSimilarity(str1, str2) {
  // Remove special characters and lowercase
  str1 = str1.replace(/[^\w\s]|_/g, "").toLowerCase();
  str2 = str2.replace(/[^\w\s]|_/g, "").toLowerCase();

  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  let matchCount = 0;

  words1.forEach(w1 => {
    words2.forEach(w2 => {
      if (w1 === w2) matchCount++;
    });
  });

  const maxLength = Math.max(words1.length, words2.length);
  return matchCount / maxLength;
}

// Handle Send
sendBtn.addEventListener("click", () => {
  const userText = userInput.value.trim();
  if (userText === "") return;

  addChatBubble("user", userText);

  const item = findClosestMatch(userText);

  if (item) {
  const language = detectLanguage(userText); // detect the language

  const answerOptions = item.answer[language] || item.answer['en'];
  const answerText = Array.isArray(answerOptions)
    ? answerOptions[Math.floor(Math.random() * answerOptions.length)]
    : answerOptions;

  setTimeout(() => {
    const followUpList = Array.isArray(item.followUps)
  ? item.followUps // array = old format
  : item.followUps?.[language] || []; // object = new format

addChatBubble("bot", answerText, followUpList);

  }, 800);

  } else {
    setTimeout(() => {
      addChatBubble("bot", "Sorry, I don't have an answer to that question.");
    }, 800);
  }

  userInput.value = "";
});

// Support Enter key
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// Display bubbles
function addChatBubble(sender, text, followUps = []) {
  const bubble = document.createElement("div");
  bubble.classList.add("chat-bubble", sender);
  bubble.innerText = text;
  chatbox.appendChild(bubble);

  if (sender === "bot" && followUps.length > 0) {
    const followUpContainer = document.createElement("div");
    followUpContainer.classList.add("follow-up-container");

    followUps.forEach(fq => {
      const btn = document.createElement("button");
      btn.textContent = fq;
      btn.classList.add("follow-up-btn");
      btn.addEventListener("click", () => {
        userInput.value = fq;
      });
      followUpContainer.appendChild(btn);
    });

    chatbox.appendChild(followUpContainer);
  }

  chatbox.scrollTop = chatbox.scrollHeight;
}

// Detect language (improved & expanded)
function detectLanguage(text) {
  if (!text || typeof text !== "string") return null;

  let lowerText = text.trim().toLowerCase();

  // Remove common ending punctuation
  lowerText = lowerText.replace(/[?.!,]+$/, "");

  // English keywords
  const enWords = [
    "how", "what", "can", "is", "are", "do", "does", "when", "where", "why", "who",
    "which", "could", "would", "should", "will", "shall", "may", "might", "must",
    "please", "thanks", "thank you", "help"
  ];

  // Tagalog keywords
  const tlWords = [
    "paano", "pwede", "may", "kailan", "saan", "ano", "sino", "hindi", "oo", "po",
    "ba", "ng", "mga", "nasa", "wala", "meron", "dapat", "salamat", "naman", "kasi"
  ];

  // Cebuano keywords
  const cebWords = [
    "unsa", "naa", "lapas", "pila", "wala", "pwede", "kinsa", "asa", "dili", "oo",
    "wala", "kaayo", "daghan", "gusto", "salamat", "adto", "uban", "kana"
  ];

  // Helper function to check match
  const matchAny = (words) => words.some(word => lowerText.includes(word));

  if (matchAny(enWords)) return "en";
  if (matchAny(tlWords)) return "tl";
  if (matchAny(cebWords)) return "ceb";

  return null;
}

const faqData = [
  {
    question: "Hi", // English
    altQuestions: [
      "Hi po", // Filipino
      "", // Cebiano
    ],
    answer: {
      en: "Hello, how can i help you?",

      tl: "Hello, paano kita matutulungan?",

      ceb: "",
    },

    hideFromList: true
  },
  {
    question: "Hello", // English
    altQuestions: [
      "Hello po", // Filipino 
    ],
    answer: {
      en: 
      "Hello! What can I do for you today?",

      tl:
      "Hello! Anong maitutulong ko?"
    },

    hideFromList: true

  },
  {
  question: "Who are you?", //Engish
  altQuestions: [
    "Sino ka?", //Filipino
    "kinsa ka?", //Bisaya
  ],
  answer: {
    en:
      "My name is AC, I will answer your question.",
    tl:
      "Ang pangalan ko ay AC, sasagutin ko ang iyong tanong.",
    
    ceb:
      "Ako si AC, tubagon nako imong pangutana.",

  },

    hideFromList: false

  },
  {
    question: "What is AC?", //Englsih
    altQuestions: [
      "Ano ang AC?", //Filipino
      "Unsa ang AC?", // Bisaya
    ],
    answer: {
      en: 
      "AC stands for \"Artificial Clone\".",
      
      tl: 
      "Ang ibig sabihin ng AC ay \"Artificial Clone\".",
      
      ceb: 
      "Ang AC nagpasabot og \"Artificial Clone\".",
      
    },

    hideFromList: false
    
  },
  
];

// Load questions on sidebar
faqData.forEach((item) => {
    // I-skip ang display (if you don't wan't to display in suggested question )
  if (item.hideFromList) return;

  const li = document.createElement("li");
  li.textContent = item.question;
  li.addEventListener("click", () => {
    userInput.value = item.question;
  });
  questionButtons.appendChild(li);
});