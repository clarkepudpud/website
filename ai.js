// Chat memory (chat log) FAQ
const chatbox = document.getElementById("chatbox");
const questionButtons = document.getElementById("question-buttons");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Function to send message and log to Vercel
async function sendToAI(userInput, aiResponse) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: userInput, answer: aiResponse })
    });
  } catch (err) {
    console.error("Log failed:", err);
  }
}

const textarea = document.getElementById('userInput');
textarea.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

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
  str1 = str1.replace(/[^\w\s+\-*\/]/g, "").toLowerCase();
  str2 = str2.replace(/[^\w\s+\-*\/]/g, "").toLowerCase();

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
    const language = detectLanguage(userText);

    const answerOptions = item.answer[language] || item.answer['en'];
    const answerText = Array.isArray(answerOptions)
      ? answerOptions[Math.floor(Math.random() * answerOptions.length)]
      : answerOptions;

    setTimeout(() => {
      const followUpList = Array.isArray(item.followUps)
        ? item.followUps
        : item.followUps?.[language] || [];

      addChatBubble("bot", answerText, followUpList);
      sendToAI(userText, answerText);
    }, 800);
  } else {
  setTimeout(() => {
    const noAnswer = "Sorry, I don't have an answer to that question.";
    addChatBubble("bot", noAnswer);
    sendToAI(userText, noAnswer);
  }, 800);
}
  userInput.value = "";
});

// Support Enter key
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// Typing animation for bot messages (text and code)
function typeText(element, text, speed = 25, isCode = false, lang = 'plaintext', callback = null) {
  let index = 0;
  const codeSpeed = isCode ? 10 : speed; // Faster for code
  let codeElement = null;

  if (isCode) {
    element.innerHTML = `<pre aria-label="Code block in ${lang}"><code class="language-${lang}"></code></pre>`;
    codeElement = element.querySelector('code');
  }

  const interval = setInterval(() => {
    if (index < text.length) {
      const char = text.charAt(index);
      if (isCode) {
        // Escape special characters for display
        const escapedChar = char === '<' ? '&lt;' : char === '>' ? '&gt;' : char === '&' ? '&amp;' : char;
        codeElement.innerHTML += escapedChar;
      } else {
        element.textContent += char;
      }
      index++;
      chatbox.scrollTop = chatbox.scrollHeight;
    } else {
      clearInterval(interval);
      if (isCode && codeElement) {
        hljs.highlightElement(codeElement); // Apply syntax highlighting
      }
      if (callback) callback();
    }
  }, codeSpeed);
}

// Display bubbles
function addChatBubble(sender, text, followUps = []) {
  const bubble = document.createElement("div");
  bubble.classList.add("chat-bubble", sender);
  chatbox.appendChild(bubble);

  if (sender === "bot") {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    let codeBlocks = [];
    let tempText = text;
    let match;
    let i = 0;

    // Extract code blocks
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const placeholder = `[CODEBLOCK_${i}]`;
      codeBlocks.push({
        placeholder,
        lang: match[1] || "plaintext",
        code: match[2].trim() || "// Empty code block",
      });
      tempText = tempText.replace(match[0], placeholder);
      i++;
    }

    // Replace inline code
    tempText = tempText.replace(inlineCodeRegex, '<code>$1</code>');

    // Split text into parts (text and code placeholders)
    const parts = tempText.split(/(\[CODEBLOCK_\d+\])/);
    let partIndex = 0;

    function processNextPart() {
      if (partIndex >= parts.length) {
        // Add follow-up buttons
        if (followUps.length > 0) {
          const followUpContainer = document.createElement("div");
          followUpContainer.classList.add("follow-up-container");

          followUps.forEach(fq => {
            const btn = document.createElement("button");
            btn.textContent = fq;
            btn.classList.add("follow-up-btn");
            btn.addEventListener("click", () => {
              userInput.value = fq;
              sendBtn.click();
            });
            followUpContainer.appendChild(btn);
          });

          chatbox.appendChild(followUpContainer);
        }
        chatbox.scrollTop = chatbox.scrollHeight;
        return;
      }

      const part = parts[partIndex];
      const codeBlock = codeBlocks.find(block => block.placeholder === part);

      // Create a new div for each part to avoid overlap
      const partDiv = document.createElement("div");
      bubble.appendChild(partDiv);

      if (codeBlock) {
        // Animate code block
        typeText(partDiv, codeBlock.code, 25, true, codeBlock.lang, () => {
          partIndex++;
          processNextPart();
        });
      } else {
        // Animate regular text
        typeText(partDiv, part, 25, false, null, () => {
          partIndex++;
          processNextPart();
        });
      }
    }

    processNextPart();
  } else {
    bubble.textContent = text;
    chatbox.scrollTop = chatbox.scrollHeight;
  }
}

// Detect language (improved & expanded)
function detectLanguage(text) {
  if (!text || typeof text !== "string") return null;

  let lowerText = text.trim().toLowerCase();

  lowerText = lowerText.replace(/[?.!,]+$/, "");

  const enWords = [
    "how", "what", "can", "is", "are", "do", "does", "when", "where", "why", "who",
    "which", "could", "would", "should", "will", "shall", "may", "might", "must",
    "please", "thanks", "thank you", "help"
  ];

  const tlWords = [
    "paano", "pwede", "may", "kailan", "saan", "ano", "sino", "hindi", "oo", "po",
    "ba", "ng", "mga", "nasa", "wala", "meron", "dapat", "salamat", "naman", "kasi"
  ];

  const cebWords = [
    "unsa", "naa", "lapas", "pila", "wala", "pwede", "kinsa", "asa", "dili", "oo",
    "wala", "kaayo", "daghan", "gusto", "salamat", "adto", "uban", "kana"
  ];

  const matchAny = (words) => words.some(word => lowerText.includes(word));

  if (matchAny(enWords)) return "en";
  if (matchAny(tlWords)) return "tl";
  if (matchAny(cebWords)) return "ceb";

  return null;
}

const faqData = [
  // English
  {
    question: "Hi",
    answer: {
      en: "Hello, how can I help you?",
    },
    hideFromList: true
  },
  {
    question: "Hello",
    answer: {
      en: "Hello, how can I help you?",
    },
    hideFromList: true
  },
  // Conversation
  {
    question: "Who are you?",
    answer: {
      en: "I'm AC (Artificial Clone), an AI assistant created by Clarke Pudpud.",
    },
    followUps: [
      "Who is Clarke Pudpud?"
    ],
    hideFromList: true
  },
  {
    question: "Who is Clarke Pudpud?",
    answer: {
      en: "Clarke Pudpud is an excellent AI creator. He is the only one who created me, trained me, and also gave me the name AC.✨",
    },
    followUps: [
      "What can you do?",
      "Where is Clarke Pudpud?",
      "Why did Clarke Pudpud create you?",
      "When were you created?",
      "Can you tell me more about Clarke Pudpud?"
    ],
    hideFromList: true
  },
  {
    question: "What can you do?",
    answer: {
      en: "I can assist with tasks like writing, coding, answering questions, and learning.",
    },
    hideFromList: true
  },
  {
    question: "Where is Clarke Pudpud?",
    answer: {
      en: "Clarke Pudpud is currently busy developing more AI innovations and improving me every day.",
    },
    hideFromList: true
  },
  {
    question: "Why did Clarke Pudpud create you?",
    answer: {
      en: "He created me to explore human–AI collaboration and to push the limits of creativity through technology.💡",
    },
    hideFromList: true
  },
  {
    question: "When were you created?",
    answer: {
      en: "I was created during Clarke Pudpud’s AI development journey — my first version was trained not long ago!🕒",
    },
    hideFromList: true
  },
  {
    question: "Can you tell me more about Clarke Pudpud?",
    answer: {
      en: "Clarke Pudpud is a passionate AI creator and developer dedicated to building intelligent systems like me.✨",
    },
    hideFromList: true
  },
  // NetBeans Calculator
  {
    question: "In NetBeans, what is the code of the equal (=) operator for button in netbeans calculator?",
    altQuestions: [
      "what is the code for equal button in netbeans calculator?",
      "what is the code for operator button in netbeans for equal?",
      "what is the code of equal operator button in netbeans calculator",
    ],
    answer: {
      en: `The equal operator in NetBeans is:

\`\`\`java
String text = TextField.getText();
text = text.replace("x", "*");
text = text.replace("÷", "/");

String secondNumber = text.substring(text.indexOf(operator) + 1);
num2 = Double.parseDouble(secondNumber);

switch(operator){
    case "+": result = num1 + num2; break;
    case "-": result = num1 - num2; break;
    case "*": result = num1 * num2; break;
    case "/":
        if(num2 != 0){
            result = num1 / num2;
        } else {
            TextField.setText("Error");
            return;
        }
        break;
}

TextField.setText(String.valueOf(result));
\`\`\`
`
    },
    followUps: [
      "what is the code of Variable Declaration?",
      "what is the code for addition button?",
    ],
    hideFromList: true
  },
  {
    question: "In NetBeans, what is the Variable Declaration?",
    answer: {
      en: `The Variable Declaration in NetBeans is:

\`\`\`java
public class CalculatorFrame extends javax.swing.JFrame {
    // Variable Declarations
    double num1, num2, result;
    String operator;
\`\`\`
`
    },
    followUps: [
      "what is the code for addition button?",
    ],
    hideFromList: true
  },
  {
    question: "what is the code of addition (+) operator for button in netbeans calculator?",
    altQuestions: [
      "what is the code of + operator for button in netbeans calculator?",
      "what is the code for addition button?",
    ],
    answer: {
      en: `The addition (+) operator button in NetBeans is:

\`\`\`java
num1 = Double.parseDouble(TextField.getText());
operator = "+";
TextField.setText(TextField.getText() + "+");
\`\`\`
`
    },
    followUps: [
      "what is the code for subtraction button?",
      "what is the code for multiplication button?",
      "what is the code for division button?",
    ],
    hideFromList: true
  },
  {
    question: "What is the code of subtraction (-) operator for button in netbeans calculator?",
    altQuestions: [
      "what is the code of - operator for button in netbeans calculator?",
      "what is the code for subtraction button?",
    ],
    answer: {
      en: `The subtraction (-) operator button in NetBeans is:

\`\`\`java
num1 = Double.parseDouble(TextField.getText());
operator = "-";
TextField.setText(TextField.getText() + "-");
\`\`\`
`
    },
    followUps: [
      "what is the code for addition button?",
      "what is the code for multiplication button?",
      "what is the code for division button?",
    ],
    hideFromList: true
  },
  {
    question: "What is the code of multiplication (*, x) operator for button in netbeans calculator?",
    altQuestions: [
      "what is the code of multiplication operator for button in netbeans calculator?",
      "what is the code of x operator for button in netbeans calculator?",
      "what is the code of * operator for button in netbeans calculator?",
      "what is the code for multiplication button?",
      "what is the code for x button?",
      "what is the code for * button?",
    ],
    answer: {
      en: `The multiplication (*) operator button in NetBeans is:

\`\`\`java
num1 = Double.parseDouble(TextField.getText());
operator = "*";
TextField.setText(TextField.getText() + "*");
\`\`\`
`
    },
    followUps: [
      "what is the code for subtraction button?",
      "what is the code for addition button?",
      "what is the code for division button?",
    ],
    hideFromList: true
  },
  {
    question: "What is the code of division (/) operator for button in netbeans calculator?",
    altQuestions: [
      "what is the code of / operator for button in netbeans calculator?",
      "what is the code for division button?",
    ],
    answer: {
      en: `The division (/) operator button in NetBeans is:

\`\`\`java
num1 = Double.parseDouble(TextField.getText());
operator = "/";
TextField.setText(TextField.getText() + "/");
\`\`\`
`
    },
    followUps: [
      "what is the code for subtraction button?",
      "what is the code for multiplication button?",
      "what is the code for addition button?",
    ],
    hideFromList: true
  },
  {
    question: "What is the code for backspace button in netbeans calculator?",
    altQuestions: [
      "what is the code for backspace button?",
      "what is the code of backspace oeprator in netbeans calculator?"
    ],
    answer: {
      en: `The backspace button in NetBeans is:

\`\`\`java
String text = TextField.getText();
if (text.length() > 0) {
    text = text.substring(0, text.length() - 1);
    TextField.setText(text);
}
\`\`\`
`
    },
    followUps: [
      "What is the code for clear button?",
    ],
    hideFromList: true
  },
  {
    question: "What is the code for Clear button in netbeans calculator?",
    altQuestions: [
      "what is the code for clear button?",
      "what is the code of clear oeprator in netbeans calculator?",
    ],
    answer: {
      en: `The clear button in NetBeans is:

\`\`\`java
TextField.setText("");
num1 = 0;
num2 = 0;
result = 0;
operator = "";
\`\`\`
`
    },
    followUps: [
      "what is the code for backspace button?"
    ],
    hideFromList: true
  },
  {
    question: "What is the code for dot (.) button in netbeans calculator?",
    altQuestions: [
      "what is the code for dot button?",
      "what is the code of dot oeprator in netbeans calculator?",
    ],
    answer: {
      en: `The dot button in NetBeans is:

\`\`\`java
String text = TextField.getText();
if (!text.contains(".")) {
    TextField.setText(text + ".");
}
\`\`\`
`
    },
    hideFromList: true
  },
  {
    question: "What is the code for modulo (%) operator button in netbeans calculator?",
    altQuestions: [
      "what is the code for modulos button?",
      "what is the code of modulos operator in netbeans calculator?",
    ],
    answer: {
      en: `The modulo (%) operator button in NetBeans is:

\`\`\`java
try {
    String text = TextField.getText();
    if (operator != null && !operator.isEmpty()) {
        int opIndex = text.lastIndexOf(operator);
        String after = text.substring(opIndex + 1);
        double value = Double.parseDouble(after);
        value = num1 * (value / 100);
        TextField.setText(text.substring(0, opIndex + 1) + value);
    } else {
        double value = Double.parseDouble(text) / 100;
        TextField.setText(String.valueOf(value));
    }
} catch (NumberFormatException e) {
    TextField.setText("Error");
}
\`\`\`
`
    },
    hideFromList: true
  },
  // Filipino
  {
    question: "Hi po",
    answer: {
      tl: "Hello, paano kita matutulungan?",
    },
    hideFromList: true
  },
  // Cebuano
  {
    question: "",
    answer: {},
    hideFromList: true
  },
];

// Load questions on sidebar
faqData.forEach((item) => {
  if (item.hideFromList) return;

  const li = document.createElement("li");
  li.textContent = item.question;
  li.addEventListener("click", () => {
    userInput.value = item.question;
    sendBtn.click();
  });
  questionButtons.appendChild(li);
});