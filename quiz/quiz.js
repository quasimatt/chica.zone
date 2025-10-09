/* quiz.js — one-question-at-a-time quiz that maps to a character,
   breaks ties randomly, and shows that character's comic page. */

/** Characters we score against (must match titles in comics.data.js) */
const CHARACTERS = ['Cass', 'David', 'Kathy', 'Lee', 'Maisy', 'Matt'];

/** Questions (edit these freely). Each option gives points to one (or more) characters. */
const QUESTIONS = [
  {
    text: 'Pick a hangout.',
    options: [
      { label: 'Underground gallery opening', scores: { Cass: 1 } },
      { label: 'Late-night coding cave',       scores: { David: 1 } },
      { label: 'Rooftop with city lights',     scores: { Kathy: 1 } },
      { label: 'Neon arcade tourney',          scores: { Lee: 1 } },
      { label: 'Picnic in the park',           scores: { Maisy: 1 } },
      { label: 'Zine-making studio',           scores: { Matt: 1 } },
    ]
  },
  {
    text: 'Your power accessory?',
    options: [
      { label: 'Sketchbook full of secrets',   scores: { Cass: 1, Matt: 1 } },
      { label: 'Noise-cancelling headphones',  scores: { David: 1 } },
      { label: 'Statement sunglasses',         scores: { Kathy: 1 } },
      { label: 'Fingerless gloves',            scores: { Lee: 1 } },
      { label: 'Charm bracelet',               scores: { Maisy: 1 } },
    ]
  },
  {
    text: 'Choose a vibe.',
    options: [
      { label: 'Dreamy & pastel',              scores: { Maisy: 1 } },
      { label: 'High-contrast & bold',         scores: { Kathy: 1 } },
      { label: 'Glitchy-cyber',                scores: { David: 1, Lee: 1 } },
      { label: 'Indie printshop',              scores: { Cass: 1, Matt: 1 } },
    ]
  },
  {
    text: 'Weekend plan?',
    options: [
      { label: 'Flea market treasure hunt',    scores: { Cass: 1 } },
      { label: 'Game jam with friends',        scores: { David: 1, Lee: 1 } },
      { label: 'Dance party on a roof',        scores: { Kathy: 1 } },
      { label: 'Park hang & playlists',        scores: { Maisy: 1 } },
      { label: 'Zine fair table',              scores: { Matt: 1 } },
    ]
  },
  {
    text: 'Pick a snack.',
    options: [
      { label: 'Chili lime chips',             scores: { Lee: 1 } },
      { label: 'Matcha cookie',                scores: { Maisy: 1 } },
      { label: 'Espresso shot',                scores: { Kathy: 1 } },
      { label: 'Mystery candy grab bag',       scores: { Cass: 1 } },
      { label: 'Instant noodles',              scores: { David: 1, Matt: 1 } },
    ]
  },
];

/** State */
let index = 0;
const answers = []; // store selected option indices (per question)
const scores = Object.fromEntries(CHARACTERS.map(c => [c, 0]));

/** DOM */
const bodyEl = document.getElementById('quiz-body');
const progressEl = document.getElementById('quiz-progress');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');

prevBtn.addEventListener('click', prevQuestion);
nextBtn.addEventListener('click', nextOrFinish);

renderQuestion();

/** Renders the current question */
function renderQuestion() {
  const q = QUESTIONS[index];
  progressEl.textContent = `Question ${index + 1} of ${QUESTIONS.length}`;

  // Build the form for this question
  const formId = `q${index}`;
  const selected = answers[index]; // number | undefined

  bodyEl.innerHTML = `
    <div class="quiz-q">${escapeHTML(q.text)}</div>
    <form id="${formId}" class="quiz-options" role="radiogroup" aria-label="${escapeHTML(q.text)}">
      ${q.options.map((opt, i) => `
        <label>
          <input type="radio" name="opt" value="${i}" ${selected === i ? 'checked' : ''}>
          <span>${escapeHTML(opt.label)}</span>
        </label>
      `).join('')}
    </form>
  `;

  // Enable/disable nav
  prevBtn.disabled = index === 0;
  nextBtn.textContent = (index === QUESTIONS.length - 1) ? 'See Result →' : 'Next →';
  // Require a choice
  nextBtn.disabled = (selected === undefined);

  // Listen for selection
  bodyEl.querySelectorAll('input[name="opt"]').forEach((inp) => {
    inp.addEventListener('change', () => {
      answers[index] = parseInt(inp.value, 10);
      nextBtn.disabled = false;
    });
  });
}

function nextOrFinish() {
  if (answers[index] === undefined) return; // safety
  if (index < QUESTIONS.length - 1) {
    index += 1;
    renderQuestion();
  } else {
    computeResult();
  }
}

function prevQuestion() {
  if (index > 0) {
    index -= 1;
    renderQuestion();
  }
}

/** Tally scores and show result; break ties randomly */
function computeResult() {
  // reset scores
  for (const k of Object.keys(scores)) scores[k] = 0;

  // add up
  answers.forEach((optIndex, qIdx) => {
    const opt = QUESTIONS[qIdx].options[optIndex];
    for (const [char, pts] of Object.entries(opt.scores)) {
      if (scores[char] !== undefined) scores[char] += pts;
    }
  });

  const top = Math.max(...Object.values(scores));
  const leaders = Object.keys(scores).filter(c => scores[c] === top);

  // tie-breaker: random pick among leaders
  const chosen = leaders[Math.floor(Math.random() * leaders.length)];

  showResult(chosen);
}

/** Find the page number for a character by matching the title in comics.data.js */
function findPageForCharacter(name) {
  const data = (window && window.CHICA_COMICS) ? window.CHICA_COMICS : {};
  let found = null;

  for (const [numStr, info] of Object.entries(data)) {
    const n = parseInt(numStr, 10);
    if (!Number.isFinite(n)) continue;
    if (!info || !info.title) continue;
    if (String(info.title).toLowerCase() === String(name).toLowerCase()) {
      // choose the newest page if multiple match
      if (found === null || n > found) found = n;
    }
  }
  return found; // number | null
}

function showResult(character) {
  const pageNum = findPageForCharacter(character);
  const data = (window && window.CHICA_COMICS) ? window.CHICA_COMICS : {};
  const page = pageNum ? data[pageNum] : null;

  const link = pageNum ? `/#${pageNum}` : '/';
  const imgSrc = page?.image || makeTinyPlaceholder(`Meet ${character}`);

  progressEl.textContent = 'Result';

  bodyEl.innerHTML = `
    <div class="result">
      <h3>You’re <span>${escapeHTML(character)}</span>!</h3>
      <p>${pageNum ? `We found your page: <a href="${link}">Page ${pageNum}</a>` : `We couldn't find a page titled “${escapeHTML(character)}”, but you can still explore the archive!`}</p>
      <a href="${link}" aria-label="Open ${escapeHTML(character)}'s page">
        <img src="${imgSrc}" alt="${escapeHTML(character)}">
      </a>
      <div style="margin-top:1rem;">
        <button class="again-btn" type="button" onclick="restartQuiz()">Take it again</button>
      </div>
    </div>
  `;

  // match button styling to your site
  const btn = bodyEl.querySelector('.again-btn');
  if (btn) {
    btn.style.cssText = 'appearance:none;border:1px solid #ddd;background:#fafafa;color:#111;padding:.6rem 1rem;font-size:.95rem;font-family:\'Love Ya Like A Sister\', cursive;border-radius:6px;cursor:pointer;';
  }

  // disable nav bar buttons after finishing
  nextBtn.disabled = true;
  prevBtn.disabled = true;
  nextBtn.textContent = 'Next →';
}

function restartQuiz() {
  index = 0;
  answers.length = 0;
  renderQuestion();
  nextBtn.disabled = true;
  prevBtn.disabled = true;
}

/** Small inline placeholder for when we don’t load script.js here */
function makeTinyPlaceholder(title) {
  const safe = St
