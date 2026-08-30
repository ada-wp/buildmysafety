const questions = ["home", "pet", "coverage", "digital", "priority"];
const labels = {
  home: {
    solid: "You have a way for someone trusted to help with home access.",
    attention: "Emergency home access could use a clearer backup."
  },
  pet: {
    solid: "Your pet backup is already confirmed.",
    attention: "Your pet backup is worth confirming.",
    na: "Pet backup is not relevant right now."
  },
  coverage: {
    solid: "Your renter coverage is clear enough to act on.",
    attention: "Renter coverage is worth reviewing.",
    na: "Renter coverage is not relevant right now."
  },
  digital: {
    solid: "Your account recovery has backup options.",
    attention: "Digital recovery is worth strengthening."
  }
};

const firstBlocks = {
  home: "Choose one trusted person and confirm how they could access your home if you needed help. Write the plan in one place you can find later.",
  pet: "Ask one person if they can be your confirmed pet backup, then write down feeding, keys, vet, and emergency details.",
  coverage: "Find your renter policy and check three basics: personal property, temporary housing, and deductible.",
  digital: "Pick one important account and add a backup recovery method that does not depend on only one device."
};

let currentStep = 0;
const totalSteps = 6;

const form = document.querySelector("#quizForm");
const steps = [...document.querySelectorAll(".quiz-step")];
const progressLabel = document.querySelector("#progressLabel");
const progressBar = document.querySelector("#progressBar");
const error = document.querySelector("#quizError");
const backButton = document.querySelector("#backButton");
const nextButton = document.querySelector("#nextButton");
const resultCard = document.querySelector("#resultCard");
const restartButton = document.querySelector("#restartButton");

function showStep(step) {
  currentStep = step;
  steps.forEach((element, index) => {
    element.classList.toggle("is-active", index === currentStep);
  });

  const isEmailStep = currentStep === 5;
  progressLabel.textContent = isEmailStep ? "Email step" : `Question ${currentStep + 1} of 5`;
  progressBar.style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
  backButton.hidden = currentStep === 0;
  nextButton.textContent = isEmailStep ? "Show My Safety Map" : "Next";
  error.textContent = "";
}

function selectedValue(name) {
  const selected = form.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : "";
}

function validateStep() {
  if (currentStep < 5) {
    const name = questions[currentStep];
    if (!selectedValue(name)) {
      error.textContent = "Choose the option that is closest for now.";
      return false;
    }
  }

  if (currentStep === 5) {
    const email = document.querySelector("#emailInput").value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      error.textContent = "Enter a valid email address to see your map.";
      return false;
    }
  }

  return true;
}

function getAnswers() {
  return {
    home: selectedValue("home"),
    pet: selectedValue("pet"),
    coverage: selectedValue("coverage"),
    digital: selectedValue("digital"),
    priority: selectedValue("priority"),
    email: document.querySelector("#emailInput").value.trim()
  };
}

function buildMap(answers) {
  const solid = [];
  const attention = [];

  ["home", "pet", "coverage", "digital"].forEach((key) => {
    const value = answers[key];
    if (value === "solid") solid.push(labels[key].solid);
    if (value === "attention") attention.push(labels[key].attention);
  });

  if (!solid.length) {
    solid.push("You completed the scan and chose one concrete place to begin.");
  }

  if (!attention.length) {
    attention.push("Nothing urgent surfaced in this first scan. Choose a small block to keep building.");
  }

  const preferred = answers.priority;
  const firstAttention = ["home", "pet", "coverage", "digital"].find((key) => answers[key] === "attention");
  const firstBlockKey = preferred || firstAttention || "home";

  return {
    solid,
    attention,
    firstBlock: firstBlocks[firstBlockKey]
  };
}

function renderList(id, items) {
  const list = document.querySelector(id);
  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  });
}

function showResult() {
  const answers = getAnswers();
  const map = buildMap(answers);
  localStorage.setItem("buildMySafetyScan", JSON.stringify({ answers, map, createdAt: new Date().toISOString() }));

  document.querySelector("#resultIntro").textContent =
    `Thanks. Your map is ready, and ${answers.email} is saved for the next version of delivery.`;
  renderList("#solidList", map.solid);
  renderList("#attentionList", map.attention);
  document.querySelector("#firstBlockText").textContent = map.firstBlock;

  form.hidden = true;
  document.querySelector(".quiz-progress").hidden = true;
  resultCard.hidden = false;
}

nextButton.addEventListener("click", () => {
  if (!validateStep()) return;
  if (currentStep === 5) {
    showResult();
    return;
  }
  showStep(currentStep + 1);
});

backButton.addEventListener("click", () => {
  showStep(Math.max(0, currentStep - 1));
});

restartButton.addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  document.querySelector(".quiz-progress").hidden = false;
  resultCard.hidden = true;
  showStep(0);
});

showStep(0);
