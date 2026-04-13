/* ═══════════════════════════════════════════════════════
   Virtual Labs – TCP Congestion Control
   script.js
═══════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   1. NAV – Section switching
───────────────────────────────────────────── */
(function initNav() {
  const items   = document.querySelectorAll('.nav-item');
  const pages   = document.querySelectorAll('.page');

  items.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;

      items.forEach(i => i.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const page = document.getElementById(target);
      if (page) page.classList.add('active');

      // Lazy-render theory diagram when theory tab opened
      if (target === 'theory') renderTheoryDiagram();
      // Init simulation canvas sizing when sim tab opened
      if (target === 'simulation') {
        setTimeout(initSimCanvas, 50);
      }
    });
  });
})();

/* ─────────────────────────────────────────────
   2. HEADER BUTTONS – Rate Me / Bug
───────────────────────────────────────────── */
(function initHeaderBtns() {
  const overlay   = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody  = document.getElementById('modalBody');
  const closeBtn   = document.getElementById('modalClose');

  function openModal(title, html) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    overlay.classList.add('show');
  }

  document.getElementById('rateBtn').addEventListener('click', () => {
    openModal('Rate This Experiment', `
      <p>We value your rating! Please navigate to the <strong>Feedback</strong> section 
      using the sidebar to provide your rating and comments.</p>
      <p style="margin-top:.6rem;color:#888;font-size:13px">Your feedback helps us 
      improve the quality of Virtual Labs experiments.</p>`);
  });

  document.getElementById('bugBtn').addEventListener('click', () => {
    openModal('Report a Bug', `
      <p>Found an issue? Please describe the bug below and we will address it 
      in the next release.</p>
      <textarea id="bugText" rows="4" style="width:100%;padding:.5rem;
        border:1px solid #ccc;border-radius:4px;margin-top:.6rem;
        font-family:inherit;font-size:13px;resize:vertical"
        placeholder="Describe the bug..."></textarea>
      <p style="margin-top:.6rem;font-size:12px;color:#888">
        (This form is for demonstration – no data is transmitted.)</p>`);
  });

  closeBtn.addEventListener('click', () => overlay.classList.remove('show'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('show'); });
})();

/* ─────────────────────────────────────────────
   3. THEORY DIAGRAM (Canvas)
───────────────────────────────────────────── */
function renderTheoryDiagram() {
  const canvas = document.getElementById('theoryDiagram');
  if (!canvas || canvas.dataset.drawn) return;
  canvas.dataset.drawn = '1';

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Background
  ctx.fillStyle = '#f9fbff';
  ctx.fillRect(0, 0, W, H);

  // State boxes
  const states = [
    { x: 30,  y: 80,  w: 120, h: 52, label: 'Slow Start',         color: '#1565c0' },
    { x: 280, y: 80,  w: 152, h: 52, label: 'Congestion\nAvoidance', color: '#2e7d32' },
    { x: 530, y: 80,  w: 130, h: 52, label: 'Fast Recovery',      color: '#c62828' },
  ];

  function box(s) {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.roundRect(s.x, s.y, s.w, s.h, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 13px Source Sans 3, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = s.label.split('\n');
    if (lines.length === 1) {
      ctx.fillText(lines[0], s.x + s.w / 2, s.y + s.h / 2);
    } else {
      ctx.fillText(lines[0], s.x + s.w / 2, s.y + s.h / 2 - 9);
      ctx.fillText(lines[1], s.x + s.w / 2, s.y + s.h / 2 + 9);
    }
  }

  function arrow(x1, y1, x2, y2, label, color) {
    ctx.strokeStyle = color || '#555';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    // arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color || '#555';
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(angle - 0.38), y2 - 10 * Math.sin(angle - 0.38));
    ctx.lineTo(x2 - 10 * Math.cos(angle + 0.38), y2 - 10 * Math.sin(angle + 0.38));
    ctx.closePath();
    ctx.fill();
    if (label) {
      ctx.fillStyle = '#333';
      ctx.font = '11px Source Sans 3, sans-serif';
      ctx.textAlign = 'center';
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 8;
      ctx.fillText(label, mx, my);
    }
  }

  states.forEach(box);

  // Arrows
  arrow(150, 106, 280, 106, 'cwnd ≥ ssthresh', '#1565c0');
  arrow(432, 106, 530, 106, '3 Dup ACKs', '#c62828');

  // Curved arrow: Fast Recovery → Congestion Avoidance
  ctx.strokeStyle = '#7b1fa2';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(595, 80);
  ctx.quadraticCurveTo(595, 20, 356, 20);
  ctx.quadraticCurveTo(280, 20, 280, 80);
  ctx.stroke();
  ctx.fillStyle = '#7b1fa2';
  const aY = 80;
  ctx.beginPath();
  ctx.moveTo(280, aY);
  ctx.lineTo(288, aY - 7);
  ctx.lineTo(288, aY + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7b1fa2';
  ctx.font = '11px Source Sans 3, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('New ACK (cwnd = ssthresh)', 440, 14);

  // Timeout arrow: Congestion Avoidance → Slow Start (bottom curve)
  ctx.strokeStyle = '#e65100';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(356, 132);
  ctx.quadraticCurveTo(356, 190, 90, 190);
  ctx.quadraticCurveTo(30, 190, 30, 132);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#e65100';
  ctx.beginPath();
  ctx.moveTo(30, 132);
  ctx.lineTo(38, 125); ctx.lineTo(22, 125);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e65100';
  ctx.font = '11px Source Sans 3, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Timeout (cwnd=1)', 193, 205);

  // Legend label
  ctx.fillStyle = '#888';
  ctx.font = 'italic 11px Source Sans 3, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TCP Reno State Machine', 8, H - 8);
}

/* ─────────────────────────────────────────────
   4. QUIZ ENGINE (Pretest + Posttest)
───────────────────────────────────────────── */
const PRETEST_QUESTIONS = [
  {
    q: '1. What does "cwnd" stand for in TCP?',
    opts: ['Connection Window', 'Congestion Window', 'Control Width', 'Cyclic Wait Node'],
    ans: 1
  },
  {
    q: '2. During Slow Start, how does the congestion window grow per RTT?',
    opts: ['Linearly (+1 MSS)', 'Exponentially (×2)', 'Logarithmically', 'Remains constant'],
    ans: 1
  },
  {
    q: '3. What event triggers Fast Retransmit in TCP?',
    opts: ['A retransmission timeout', 'Two duplicate ACKs', 'Three duplicate ACKs', 'Four duplicate ACKs'],
    ans: 2
  },
  {
    q: '4. In TCP Reno, what is the value of ssthresh after 3 duplicate ACKs?',
    opts: ['cwnd / 4', 'cwnd / 2', 'cwnd - 1', 'cwnd remains unchanged'],
    ans: 1
  },
  {
    q: '5. Which algorithm does TCP use during Congestion Avoidance?',
    opts: ['AIMD', 'RIMD', 'Exponential Backoff', 'Token Bucket'],
    ans: 0
  },
  {
    q: '6. What is the initial value of cwnd when a TCP connection starts?',
    opts: ['0', '1 MSS', 'ssthresh', 'rwnd'],
    ans: 1
  },
  {
    q: '7. Which RFC defines TCP Congestion Control?',
    opts: ['RFC 793', 'RFC 2581', 'RFC 5681', 'RFC 1122'],
    ans: 2
  }
];

const POSTTEST_QUESTIONS = [
  {
    q: '1. In TCP Reno, after Fast Recovery ends, TCP enters which phase?',
    opts: ['Slow Start', 'Congestion Avoidance', 'Fast Retransmit', 'Timeout Recovery'],
    ans: 1
  },
  {
    q: '2. What is the "sawtooth" pattern in a cwnd-vs-time graph indicative of?',
    opts: [
      'Constant network capacity',
      'Periodic congestion and recovery via AIMD',
      'A broken connection',
      'Receiver window limitations'
    ],
    ans: 1
  },
  {
    q: '3. How does TCP Tahoe differ from TCP Reno when 3 duplicate ACKs are received?',
    opts: [
      'Tahoe halves cwnd; Reno resets to 1',
      'Tahoe resets cwnd to 1; Reno uses Fast Recovery',
      'Both behave identically',
      'Tahoe ignores duplicate ACKs'
    ],
    ans: 1
  },
  {
    q: '4. If ssthresh = 16 and cwnd = 24, which phase is TCP in?',
    opts: ['Slow Start', 'Congestion Avoidance', 'Fast Recovery', 'Timeout Recovery'],
    ans: 1
  },
  {
    q: '5. During Fast Recovery, for each additional duplicate ACK, cwnd is:',
    opts: ['Halved', 'Increased by 1 MSS', 'Reset to 1', 'Unchanged'],
    ans: 1
  },
  {
    q: '6. Which of the following best describes the purpose of ssthresh?',
    opts: [
      'Maximum receiver buffer size',
      'Threshold separating Slow Start from Congestion Avoidance',
      'Initial cwnd value',
      'Number of unacknowledged segments allowed'
    ],
    ans: 1
  },
  {
    q: '7. A timeout causes TCP to set cwnd to:',
    opts: ['ssthresh / 2', 'cwnd / 2', '1 MSS', 'ssthresh'],
    ans: 2
  }
];

function buildQuiz(questions, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  questions.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'quiz-question';
    div.dataset.idx = i;

    let optsHtml = item.opts.map((opt, j) => `
      <label class="quiz-option">
        <input type="radio" name="q${i}_${containerId}" value="${j}" />
        ${opt}
      </label>`).join('');

    div.innerHTML = `<p>${item.q}</p>${optsHtml}`;
    container.appendChild(div);
  });
}

function gradeQuiz(questions, containerId, resultId) {
  const questions_divs = document.querySelectorAll(`#${containerId} .quiz-question`);
  let score = 0;

  questions_divs.forEach((div, i) => {
    const selected = div.querySelector(`input[name="q${i}_${containerId}"]:checked`);
    div.classList.remove('q-correct', 'q-wrong');
    if (selected) {
      const val = parseInt(selected.value);
      if (val === questions[i].ans) {
        score++;
        div.classList.add('q-correct');
      } else {
        div.classList.add('q-wrong');
        // Highlight correct answer
        const correctLabel = div.querySelectorAll('.quiz-option')[questions[i].ans];
        if (correctLabel) correctLabel.style.fontWeight = '700';
      }
    } else {
      div.classList.add('q-wrong');
    }
  });

  const resultEl = document.getElementById(resultId);
  const pct = Math.round((score / questions.length) * 100);
  resultEl.textContent = `Score: ${score} / ${questions.length}  (${pct}%)  ${pct >= 60 ? '✓ Pass' : '✗ Needs Review'}`;
  resultEl.className = `quiz-result show ${pct >= 60 ? 'pass' : 'fail'}`;
}

// Build quizzes on page load
buildQuiz(PRETEST_QUESTIONS,  'pretestQuiz');
buildQuiz(POSTTEST_QUESTIONS, 'posttestQuiz');

document.getElementById('submitPretest').addEventListener('click',
  () => gradeQuiz(PRETEST_QUESTIONS, 'pretestQuiz', 'pretestResult'));

document.getElementById('submitPosttest').addEventListener('click',
  () => gradeQuiz(POSTTEST_QUESTIONS, 'posttestQuiz', 'posttestResult'));

/* ─────────────────────────────────────────────
   5. FEEDBACK
───────────────────────────────────────────── */
(function initFeedback() {
  let selectedRating = 0;
  const stars = document.querySelectorAll('.star');
  const ratingLabel = document.getElementById('ratingLabel');
  const labels = ['','Poor','Fair','Good','Very Good','Excellent'];

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const v = parseInt(star.dataset.val);
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= v));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
    });
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.val);
      ratingLabel.textContent = labels[selectedRating];
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
    });
  });

  document.getElementById('submitFeedback').addEventListener('click', () => {
    const name     = document.getElementById('fbName').value.trim() || 'Anonymous';
    const exp      = document.getElementById('fbExperience').value;
    const comments = document.getElementById('fbComments').value.trim();

    if (!selectedRating) { alert('Please provide a star rating before submitting.'); return; }

    const res = document.getElementById('feedbackResult');
    res.className = 'quiz-result show pass';
    res.textContent = `Thank you, ${name}! Your feedback (${labels[selectedRating]}) has been recorded.`;

    // Reset form
    document.getElementById('fbName').value = '';
    document.getElementById('fbExperience').value = '';
    document.getElementById('fbComments').value = '';
    selectedRating = 0;
    stars.forEach(s => s.classList.remove('active'));
    ratingLabel.textContent = 'Click to rate';
  });
})();

/* ─────────────────────────────────────────────
   6. SIMULATION ENGINE
───────────────────────────────────────────── */
(function initSimulation() {

  /* ── State ── */
  let sim = {};           // simulation state
  let animId  = null;     // requestAnimationFrame handle
  let lastTs  = null;     // last timestamp for interval
  let interval = 400;     // ms per RTT step

  const COLORS = {
    slowStart  : '#66bb6a',
    congAvoid  : '#ffa726',
    fastRec    : '#ef5350',
    cwnd       : '#4fc3f7',
    ssthresh   : '#ff7043',
    bg         : '#0f1b2d',
    grid       : 'rgba(255,255,255,.06)',
    axis       : 'rgba(255,255,255,.25)',
    text       : 'rgba(255,255,255,.55)',
  };

  /* ── Canvas ── */
  const canvas = document.getElementById('simCanvas');
  const ctx    = canvas.getContext('2d');
  let DPR      = window.devicePixelRatio || 1;

  function initSimCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const W = rect.width - 48;   // padding
    canvas.style.width  = W + 'px';
    canvas.style.height = '280px';
    canvas.width  = Math.round(W  * DPR);
    canvas.height = Math.round(280 * DPR);
    ctx.scale(DPR, DPR);
    drawGraph();
  }
  window.initSimCanvas = initSimCanvas; // expose for nav

  /* ── Reset simulation state ── */
  function resetSim() {
    const ssthresh = parseInt(document.getElementById('ssthreshInput').value) || 16;
    sim = {
      cwnd      : 1,
      ssthresh  : ssthresh,
      phase     : 'idle',          // idle | slowStart | congAvoid | fastRec
      rtt       : 0,
      dupAck    : 0,
      history   : [],              // [{cwnd, ssthresh, phase}]
      lossEvents: [],              // RTT indices where loss occurred
      running   : false,
      paused    : false,
    };
    updateStatus();
    drawGraph();
    logClear();
  }

  resetSim();

  /* ── Status display ── */
  function updateStatus() {
    const phaseNames = {
      idle      : '—',
      slowStart : 'Slow Start',
      congAvoid : 'Congestion Avoidance',
      fastRec   : 'Fast Recovery',
    };
    document.getElementById('simPhase').textContent   = phaseNames[sim.phase] || '—';
    document.getElementById('simCwnd').textContent    = sim.cwnd.toFixed(1);
    document.getElementById('simSsthresh').textContent = sim.ssthresh.toFixed(0);
    document.getElementById('simRtt').textContent     = sim.rtt;
    document.getElementById('simDupAck').textContent  = sim.dupAck;
  }

  /* ── Event log ── */
  function log(msg, cls) {
    const el  = document.getElementById('simLog');
    const div = document.createElement('div');
    div.className = 'log-entry ' + (cls || '');
    div.textContent = `[RTT ${String(sim.rtt).padStart(3,' ')}] ${msg}`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }
  function logClear() {
    document.getElementById('simLog').innerHTML = '';
  }

  /* ── Simulation step ── */
  function step() {
    if (!sim.running || sim.paused) return;

    sim.rtt++;

    if (sim.phase === 'slowStart') {
      sim.cwnd = Math.min(sim.cwnd * 2, sim.ssthresh * 4); // cap display
      if (sim.cwnd >= sim.ssthresh) {
        sim.cwnd = sim.ssthresh;
        sim.phase = 'congAvoid';
        log('cwnd reached ssthresh → Congestion Avoidance', 'phase');
      }
    } else if (sim.phase === 'congAvoid') {
      sim.cwnd += 1;
    } else if (sim.phase === 'fastRec') {
      // inflate each RTT by 1 for a few steps then exit
      sim.cwnd = Math.max(sim.cwnd, sim.ssthresh) + 1;
      sim.dupAck++;
      if (sim.dupAck >= 3) {
        sim.dupAck = 0;
        sim.cwnd   = sim.ssthresh;
        sim.phase  = 'congAvoid';
        log('Fast Recovery ended → Congestion Avoidance', 'phase');
      }
    }

    recordHistory();
    updateStatus();
    drawGraph();
  }

  function recordHistory() {
    sim.history.push({
      rtt     : sim.rtt,
      cwnd    : sim.cwnd,
      ssthresh: sim.ssthresh,
      phase   : sim.phase,
    });
  }

  /* ── Animation loop ── */
  function animate(ts) {
    if (!sim.running || sim.paused) { lastTs = null; return; }
    if (!lastTs) lastTs = ts;
    const elapsed = ts - lastTs;
    interval = parseInt(document.getElementById('speedInput').value) || 400;
    if (elapsed >= interval) {
      lastTs = ts;
      step();
    }
    animId = requestAnimationFrame(animate);
  }

  /* ── Draw graph ── */
  function drawGraph() {
    const cw = canvas.width  / DPR;
    const ch = canvas.height / DPR;
    const PAD = { t: 18, r: 18, b: 38, l: 46 };
    const plotW = cw - PAD.l - PAD.r;
    const plotH = ch - PAD.t - PAD.b;

    ctx.clearRect(0, 0, cw, ch);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cw, ch);

    const hist    = sim.history;
    const maxRTT  = Math.max(hist.length + 5, 20);
    const maxCwnd = Math.max(...hist.map(h => h.cwnd), sim.ssthresh * 2, 32);

    const toX = rtt  => PAD.l + (rtt / maxRTT) * plotW;
    const toY = cwnd => PAD.t + plotH - (cwnd / maxCwnd) * plotH;

    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 5; i++) {
      const y = PAD.t + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + plotW, y); ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
      const x = PAD.l + (i / 10) * plotW;
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + plotH); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t);
    ctx.lineTo(PAD.l, PAD.t + plotH);
    ctx.lineTo(PAD.l + plotW, PAD.t + plotH);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle   = COLORS.text;
    ctx.font        = `10px monospace`;
    ctx.textAlign   = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxCwnd * i) / 4);
      const y   = PAD.t + plotH - (i / 4) * plotH;
      ctx.fillText(val, PAD.l - 5, y);
    }

    // X-axis labels
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 5; i++) {
      const val = Math.round((maxRTT * i) / 5);
      const x   = PAD.l + (i / 5) * plotW;
      ctx.fillText(val, x, PAD.t + plotH + 5);
    }
    ctx.fillText('RTT', PAD.l + plotW / 2, PAD.t + plotH + 22);
    ctx.save();
    ctx.translate(12, PAD.t + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('cwnd (segments)', 0, 0);
    ctx.restore();

    // ssthresh horizontal line
    if (hist.length > 0) {
      const sy = toY(sim.ssthresh);
      ctx.strokeStyle = COLORS.ssthresh;
      ctx.lineWidth   = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(PAD.l, sy);
      ctx.lineTo(PAD.l + plotW, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle   = COLORS.ssthresh;
      ctx.font        = '10px monospace';
      ctx.textAlign   = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`ssthresh=${sim.ssthresh}`, PAD.l + 4, sy - 2);
    }

    // cwnd line (colored by phase)
    if (hist.length >= 2) {
      for (let i = 1; i < hist.length; i++) {
        const p0 = hist[i - 1], p1 = hist[i];
        const phaseColor = {
          slowStart : COLORS.slowStart,
          congAvoid : COLORS.congAvoid,
          fastRec   : COLORS.fastRec,
        }[p1.phase] || COLORS.cwnd;

        ctx.strokeStyle = phaseColor;
        ctx.lineWidth   = 2.2;
        ctx.beginPath();
        ctx.moveTo(toX(p0.rtt), toY(p0.cwnd));
        ctx.lineTo(toX(p1.rtt), toY(p1.cwnd));
        ctx.stroke();
      }

      // dots
      hist.forEach((h, i) => {
        const phaseColor = {
          slowStart : COLORS.slowStart,
          congAvoid : COLORS.congAvoid,
          fastRec   : COLORS.fastRec,
        }[h.phase] || COLORS.cwnd;
        ctx.fillStyle = phaseColor;
        ctx.beginPath();
        ctx.arc(toX(h.rtt), toY(h.cwnd), 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Loss markers
    sim.lossEvents.forEach(rttIdx => {
      const entry = hist.find(h => h.rtt === rttIdx);
      if (!entry) return;
      const x = toX(rttIdx), y = toY(entry.cwnd);
      ctx.fillStyle = '#ff1744';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('✕', x, y - 2);
    });

    // "No data" label
    if (!hist.length) {
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.font = '14px Source Sans 3, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press ▶ Start to begin simulation', cw / 2, ch / 2);
    }
  }

  /* ── Packet Loss event ── */
  function triggerLoss() {
    if (!sim.running || sim.paused) return;
    const prevCwnd = sim.cwnd;
    sim.ssthresh   = Math.max(Math.floor(sim.cwnd / 2), 2);
    sim.cwnd       = sim.ssthresh + 3;
    sim.dupAck     = 3;
    sim.phase      = 'fastRec';
    sim.lossEvents.push(sim.rtt);

    log(`PACKET LOSS! cwnd ${prevCwnd.toFixed(0)} → ${sim.cwnd.toFixed(0)}, ssthresh → ${sim.ssthresh}`, 'loss');
    log('Entering Fast Recovery', 'phase');

    recordHistory();
    updateStatus();
    drawGraph();
  }

  /* ── Button bindings ── */
  const btnStart = document.getElementById('btnStart');
  const btnPause = document.getElementById('btnPause');
  const btnReset = document.getElementById('btnReset');
  const btnLoss  = document.getElementById('btnLoss');

  btnStart.addEventListener('click', () => {
    if (sim.running) return;
    resetSim();
    sim.running = true;
    sim.paused  = false;
    sim.phase   = 'slowStart';

    log('Simulation started — Slow Start phase', 'phase');
    recordHistory();
    updateStatus();
    drawGraph();

    btnStart.disabled = true;
    btnPause.disabled = false;
    btnLoss.disabled  = false;

    lastTs = null;
    animId = requestAnimationFrame(animate);
  });

  btnPause.addEventListener('click', () => {
    sim.paused = !sim.paused;
    btnPause.textContent = sim.paused ? '▶ Resume' : '⏸ Pause';
    if (!sim.paused) {
      lastTs = null;
      animId = requestAnimationFrame(animate);
    }
  });

  btnReset.addEventListener('click', () => {
    sim.running = false;
    sim.paused  = false;
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    resetSim();
    btnStart.disabled = false;
    btnPause.disabled = true;
    btnPause.textContent = '⏸ Pause';
    btnLoss.disabled  = true;
  });

  btnLoss.addEventListener('click', triggerLoss);

  // Update ssthresh preview in status on input change
  document.getElementById('ssthreshInput').addEventListener('input', e => {
    if (!sim.running) {
      document.getElementById('simSsthresh').textContent = e.target.value;
    }
  });

  // Draw empty graph on first load
  initSimCanvas();
  window.addEventListener('resize', initSimCanvas);

})();
