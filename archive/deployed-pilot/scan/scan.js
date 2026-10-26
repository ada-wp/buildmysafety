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

let submissionToken = crypto.randomUUID() + '-' + crypto.randomUUID();
let savedPayload;
const consentLabel = document.createElement('label');
consentLabel.className = 'form-note';
const consentBox = document.createElement('input');
consentBox.type = 'checkbox';
consentLabel.append(consentBox, ' I agree to save my email and scan answers for this pilot. Email delivery is not active yet.');
document.querySelector('.email-step').append(consentLabel);
document.querySelector('.email-step h2').textContent = 'Save your Safety Map';
document.querySelector('.email-step > p:not(.step-kicker)').textContent = 'Your map appears here after your answers are saved. This pilot does not send emails yet.';
const aiSection = document.createElement('section');
aiSection.className = 'first-block';
const aiContainer = document.createElement('div');
const aiTitle = document.createElement('h3'); aiTitle.textContent = 'Your next seven days';
const aiNote = document.createElement('p'); aiNote.textContent = 'Create a practical plan from your answers: one focus, one small action each day. Your answers, without your email, are sent to OpenAI. This is an AI-generated pilot plan; adapt or skip anything that does not fit.';
const aiButton = document.createElement('button'); aiButton.type='button'; aiButton.className='button secondary'; aiButton.textContent='Build my seven-day plan';
const aiOutput = document.createElement('p'); aiOutput.setAttribute('role','status');
const planDetails=document.createElement('details'); planDetails.hidden=true;
const planToggle=document.createElement('summary'); planToggle.textContent='See my seven-day schedule';
const planDays=document.createElement('ol'); planDetails.append(planToggle,planDays);
aiContainer.append(aiTitle,aiNote,aiButton,aiOutput,planDetails); aiSection.append(aiContainer);
document.querySelector('.result-actions').before(aiSection);
async function send(path, payload) {
  const response = await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(55000)});
  const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Please try again.'); return data;
}
aiButton.addEventListener('click',async()=>{
  if (!savedPayload) return;
  aiButton.disabled=true; aiOutput.textContent='Building your seven-day plan…';
  try { const data=await send('/api/generate',savedPayload); const r=data.result; aiOutput.textContent=r.summary+' '+r.recommendation; document.querySelector('#firstBlockText').textContent=r.next_step; planDays.replaceChildren(); for(const day of r.days){const li=document.createElement('li'); const title=document.createElement('h4');title.textContent=`Day ${day.day}: ${day.title} · ${day.minutes} minutes`;const action=document.createElement('p');action.textContent=day.action;const done=document.createElement('p');done.textContent='Done when: '+day.done_when;li.append(title,action,done);planDays.append(li);} planDetails.hidden=false; aiButton.textContent='Seven-day plan saved'; }
  catch(e) { aiOutput.textContent=e.message || 'The test could not finish.'; aiButton.disabled=false; }
});
async function showResult() {
  if (!consentBox.checked) { error.textContent='Please agree to save your scan before continuing.'; return; }
  const answers = getAnswers();
  const map = buildMap(answers);
  const {email,...scanAnswers}=answers;
  const payload={token:submissionToken,email,answers:scanAnswers,consent:true};
  nextButton.disabled=true; backButton.disabled=true; nextButton.textContent='Saving…'; error.textContent='';
  try { await send('/api/scans',payload); savedPayload=payload; }
  catch(e) { error.textContent=e.message || 'We could not save your scan. Please retry.'; return; }
  finally { nextButton.disabled=false; backButton.disabled=false; nextButton.textContent='Show My Safety Map'; }

  document.querySelector("#resultIntro").textContent =
    'Your scan is saved. Your first-version map is below. Email delivery is not active yet.';
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
  submissionToken=crypto.randomUUID()+'-'+crypto.randomUUID(); savedPayload=undefined; consentBox.checked=false; aiOutput.textContent=''; planDays.replaceChildren();planDetails.hidden=true; aiButton.disabled=false; aiButton.textContent='Build my seven-day plan';
  form.reset();
  form.hidden = false;
  document.querySelector(".quiz-progress").hidden = false;
  resultCard.hidden = true;
  showStep(0);
});

showStep(0);
