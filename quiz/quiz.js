// quiz.js — cleaned labels, random tie-break, links newest matching comic page.
// Robust boot: runs whether DOM is already ready or not, shows friendly error on failure.

(function () {
  function start() {
    console.log('[quiz] start()');

    const CHARACTERS = ['Maisy', 'Matt', 'David', 'Cass', 'Kathy', 'Lee'];

    const QUESTIONS = [
      {
        text: `some objects are sitting in front of you. which one do you grab?`,
        options: [
          { label: `a calculator`,                     scores: { Matt: 5 } },
          { label: `a crystal ball`,                   scores: { Kathy: 5 } },
          { label: `a model airplane`,                 scores: { David: 5 } },
          { label: `a toy horse`,                      scores: { Maisy: 5 } },
          { label: `a chess piece`,                    scores: { Cass: 5 } },
          { label: `a textbook`,                       scores: { Lee: 5 } },
        ]
      },
      {
        text: `your in line at starbies. what do you do?`,
        options: [
          { label: `calculate the most delicious beverage`,                               scores: { Matt: 5 } },
          { label: `order a drink fit for a "queen"`,                                     scores: { Cass: 5 } },
          { label: `order tea, because your throat's a bit "hoarse" from singing`,        scores: { Maisy: 5 } },
          { label: `order a really caffeinated beverage to wake you "up"`,                scores: { David: 5 } },
          { label: `intuit what everyone else is ordering and order the same thing in solidarity`, scores: { Kathy: 5 } },
          { label: `ask the employees if the establishment is legal`,                     scores: { Lee: 5 } },
        ]
      },
      {
        text: `you're late for a date. do you...?`,
        options: [
          { label: `gallop`,                                                                scores: { Maisy: 5 } },
          { label: `call your date and explain logically why you should meet an hour later`, scores: { Matt: 5 } },
          { label: `move really fast in a diagonal`,                                        scores: { Cass: 5 } },
          { label: `kick and punch everyone in line for the bus to get there faster`,       scores: { Lee: 5 } },
          { label: `fly over . you have wings ;)`,                                          scores: { David: 5 } },
          { label: `have a feeling your date is going to be late too and take your time getting there`, scores: { Kathy: 5 } },
        ]
      },
      {
        text: `you're feeling stressed and gothic. what do you do to relax?`,
        options: [
          { label: `solve a rubiks cube`,                         scores: { Matt: 5 } },
          { label: `fly around to take the edge off`,             scores: { David: 5 } },
          { label: `run around the track`,                        scores: { Maisy: 5 } },
          { label: `think about the future. thing always turn out alright anyhow:)`, scores: { Kathy: 5 } },
          { label: `play chess`,                                  scores: { Cass: 5 } },
          { label: `take it all out on a punching bag. hi-ya!!`,  scores: { Lee: 5 } },
        ]
      },
      {
        text: `your nemesis arrives... what do they look like`,
        options: [
          { label: `someone who can't even do their times tables`, scores: { Matt: 5 } },
          { label: `a guy who never knows what's coming next`,     scores: { Kathy: 5 } },
          { label: `a pipsqueak who breaks the law`,               scores: { Lee: 5 } },
          { label: `someone with a fear of heights`,               scores: { David: 5 } },
          { label: `a horse abuser`,                               scores: { Maisy: 5 } },
          { label: `someone that's bad at chess`,                  scores: { Cass: 5 } },
        ]
      },
      {
        text: `finally... what's your favorite body part?`,
        options: [
          { label: `my back. i almost feel like it's sprouting wings...`, scores: { David: 1 } },
          { label: `my brain. i just can't help but think`,               scores: { Matt: 1 } },
          { label: `my feet. i sometimes feel like they could be hooves`, scores: { Maisy: 1 } },
          { label: `my fists. especially when i take a swing at criminals`, scores: { Lee: 1 } },
          { label: `my third eye. the future is never too far away`,       scores: { Kathy: 1 } },
          { label: `my head. it's the perfect shape for a crown`,          scores: { Cass: 1 } },
        ]
      },
    ];

    // DOM refs
    const bodyEl = document.getElementById('quiz-body');
    const progressEl = document.getElementById('quiz-progress');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');

    if (!bodyEl || !progressEl || !nextBtn || !prevBtn) {
      throw new Error('Missing required elements (#quiz-body, #quiz-progress, #next-btn, #prev-btn).');
    }

    // State
    let index = 0;
    const answers = [];
    const scores = Object.fromEntries(CHARACTERS.map(c => [c, 0]));

    // Events
    prevBtn.addEventListener('click', prevQuestion);
    nextBtn.addEventListener('click', nextOrFinish);

    // Initial render
    renderQuestion();

    function renderQuestion() {
      const q = QUESTIONS[index];
      progressEl.textContent = `Question ${index + 1} of ${QUESTIONS.length}`;

      const selected = answers[index];

      bodyEl.innerHTML = `
        <div class="quiz-q">${escapeHTML(q.text)}</div>
        <form class="quiz-options" role="radiogroup" aria-label="${escapeHTML(q.text)}">
          ${q.options.map((opt, i) => `
            <label>
              <input type="radio" name="opt" value="${i}" ${selected === i ? 'checked' : ''}>
              <span>${escapeHTML(opt.label)}</span>
            </label>
          `).join('')}
        </form>
      `;

      prevBtn.disabled = index === 0;
      nextBtn.textContent = (index === QUESTIONS.length - 1) ? 'See Result →' : 'Next →';
      nextBtn.disabled = (selected === undefined);

      bodyEl.querySelectorAll('input[name="opt"]').forEach((inp) => {
        inp.addEventListener('change', () => {
          answers[index] = parseInt(inp.value, 10);
          nextBtn.disabled = false;
        });
      });
    }

    function nextOrFinish() {
      if (answers[index] === undefined) return;
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

    // tally + tie-break randomly
    function computeResult() {
      for (const k of Object.keys(scores)) scores[k] = 0;
      answers.forEach((optIndex, qIdx) => {
        const opt = QUESTIONS[qIdx].options[optIndex];
        for (const [char, pts] of Object.entries(opt.scores)) {
          if (scores[char] !== undefined) scores[char] += pts;
        }
      });

      const top = Math.max(...Object.values(scores));
      const leaders = Object.keys(scores).filter(c => scores[c] === top);
      const chosen = leaders[Math.floor(Math.random() * leaders.length)];
      showResult(chosen);
    }

    // Map character name -> newest matching page title from comics.data.js
    function findPageForCharacter(name) {
      const data = (window && window.CHICA_COMICS) ? window.CHICA_COMICS : {};
      let found = null;
      for (const [numStr, info] of Object.entries(data)) {
        const n = parseInt(numStr, 10);
        if (!Number.isFinite(n) || !info || !info.title) continue;
        if (String(info.title).toLowerCase() === String(name).toLowerCase()) {
          if (found === null || n > found) found = n; // newest if multiple
        }
      }
      return found;
    }

    function showResult(character) {
      const pageNum = findPageForCharacter(character);
      const data = (window && window.CHICA_COMICS) ? window.CHICA_COMICS : {};
      const page = pageNum ? data[pageNum] : null;

      const link = pageNum ? `/#${pageNum}` : '/archive/';
      const imgSrc = page?.image || makeTinyPlaceholder(`Meet ${character}`);

      progressEl.textContent = 'Result';

      bodyEl.innerHTML = `
        <div class="result">
          <h3>You’re <span>${escapeHTML(character)}</span>!</h3>
          <p>${pageNum
              ? `We found your page: <a href="${link}">Page ${pageNum}</a>`
              : `We couldn't find a page titled “${escapeHTML(character)}” — explore the archive!`}</p>
          <a href="${link}" aria-label="Open ${escapeHTML(character)}'s page">
            <img src="${imgSrc}" alt="${escapeHTML(character)}">
          </a>
          <div style="margin-top:1rem;">
            <button id="again-btn" class="again-btn" type="button">Take it again</button>
          </div>
        </div>
      `;

      const btn = document.getElementById('again-btn');
      if (btn) {
        btn.style.cssText = 'appearance:none;border:1px solid #ddd;background:#fafafa;color:#111;padding:.6rem 1rem;font-size:.95rem;font-family:\'Love Ya Like A Sister\', cursive;border-radius:6px;cursor:pointer;';
        btn.addEventListener('click', restartQuiz);
      }

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

    function makeTinyPlaceholder(title) {
      const safe = String(title).replace(/&/g,'&amp;').replace(/</g,'&lt;');
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000">
          <rect width="100%" height="100%" fill="#ffffff"/>
          <rect x="20" y="20" width="760" height="960" fill="none" stroke="#eeeeee" stroke-width="2"/>
          <text x="50%" y="48%" text-anchor="middle" font-family="Love Ya Like A Sister, cursive" font-size="20" fill="#444">loading page…</text>
          <text x="50%" y="56%" text-anchor="middle" font-family="Love Ya Like A Sister, cursive" font-size="18" fill="#777">${safe}</text>
        </svg>`;
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }

    function escapeHTML(s=''){ return s.replace(/[&<>"']/g, c =>
      c==='&'?'&amp;':c==='<'?'&lt;':c==='>'?'&gt;':c==='"'?'&quot;':'&#39;'
    ); }
  }

  // Boot safely no matter what
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  } catch (err) {
    console.error('[quiz] fatal', err);
    const box = document.getElementById('quiz-body');
    if (box) {
      box.innerHTML = `<div class="error">Quiz failed to load. Open DevTools → Console for details.</div>`;
    }
  }
})();

