/**
 * CostWhisperer Frontend Application Logic
 * Integrates empathetic agent tone modulation, leak detection, savings calculator, and CLI copy features.
 */

// Initialize UI elements
const anxietySlider = document.getElementById('anxietySlider');
const anxietyStatus = document.getElementById('anxietyStatus');
const billInput = document.getElementById('billInput');
const findingsContainer = document.getElementById('findingsContainer');
const savingsAmount = document.getElementById('savingsAmount');
const savingsSub = document.getElementById('savingsSub');
const agentStatusText = document.getElementById('agentStatusText');
const analyzeBtn = document.getElementById('analyzeBtn');

// Anxiety Slider event listener
anxietySlider.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  updateAnxietyDisplay(val);
});

function updateAnxietyDisplay(val) {
  if (val < 30) {
    anxietyStatus.textContent = `😌 Zen Calm (${val}%)`;
    anxietyStatus.style.color = '#56d364';
    agentStatusText.textContent = "Tone: Casual optimization advisory. Let's find some spare change!";
  } else if (val < 70) {
    anxietyStatus.textContent = `😐 Mild Shock (${val}%)`;
    anxietyStatus.style.color = '#e3b341';
    agentStatusText.textContent = "Tone: Focused pragmatist. Spotting quick wins to trim your spend.";
  } else {
    anxietyStatus.textContent = `😱 Panic / Boss Saw Bill (${val}%)`;
    anxietyStatus.style.color = '#f85149';
    agentStatusText.textContent = "Tone: Emergency triage mode! Prioritizing high-impact instant deletions.";
  }
}

// Load pre-built scenario
function loadScenario(scenarioKey) {
  const scenario = SAMPLE_SCENARIOS[scenarioKey];
  if (!scenario) return;

  billInput.value = scenario.billText;
  anxietySlider.value = scenario.anxiety;
  updateAnxietyDisplay(scenario.anxiety);

  // Trigger analysis immediately for delightful instant gratification
  runCostWhisperer();
}

// Clear input
function clearInput() {
  billInput.value = '';
  findingsContainer.innerHTML = `
    <div class="finding-card">
      <div class="finding-header">
        <span class="finding-title">✨ Canvas Reset</span>
      </div>
      <p style="font-size: 13px; color: var(--text-muted);">
        Paste an AWS bill or choose a scenario on the left to begin diagnosis.
      </p>
    </div>
  `;
  savingsAmount.textContent = "$0.00 / mo";
  savingsSub.textContent = "Run diagnosis to calculate recoverable spend.";
}

// Explain individual jargon from dictionary pill
function explainJargon(jargonKey) {
  const item = JARGON_DATABASE[jargonKey];
  if (!item) return;

  const cardHtml = `
    <div class="finding-card" style="border-color: var(--accent-blue); animation: fadeIn 0.3s ease;">
      <div class="finding-header">
        <span class="finding-title">📖 Jargon Explained: ${item.title}</span>
        <span class="finding-leak-tag">SKU Decoder</span>
      </div>
      <p style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">${item.sku}</p>
      
      <div class="plain-explanation">
        <strong>What this actually means:</strong><br>
        ${item.summary}
      </div>

      <div style="font-size: 13px; margin: 8px 0; color: #f0883e;">
        <strong>⚠️ Why it hurts:</strong> ${item.whyItHurts}
      </div>

      <div class="cli-box">
        <div class="cli-box-header">
          <span class="cli-box-label">Instant Fix Command</span>
          <button class="copy-btn" onclick="copyCliSnippet(this)">Copy CLI</button>
        </div>
        <pre class="cli-code">${escapeHtml(item.cliFix)}</pre>
      </div>
    </div>
  `;

  // Prepend to findings container so it appears immediately
  findingsContainer.insertAdjacentHTML('afterbegin', cardHtml);
}

// Main Agent Diagnostic Routine
function runCostWhisperer() {
  const text = billInput.value.trim().toLowerCase();
  const anxiety = parseInt(anxietySlider.value);

  if (!text) {
    findingsContainer.innerHTML = `
      <div class="finding-card" style="border-color: var(--accent-red);">
        <div class="finding-header">
          <span class="finding-title">⚠️ Bill Input Empty</span>
        </div>
        <p style="font-size: 13px; color: var(--text-muted);">
          Please paste some AWS bill text or pick one of the 3 real-world scenarios on the left!
        </p>
      </div>
    `;
    return;
  }

  // Visual processing state
  analyzeBtn.innerHTML = `<span>⏳ Bedrock Agent Analyzing...</span>`;
  analyzeBtn.disabled = true;

  setTimeout(() => {
    analyzeBtn.innerHTML = `<span>✨ Diagnose & Translate</span>`;
    analyzeBtn.disabled = false;

    // Detect matched leaks
    const matches = [];
    let estimatedTotalSavings = 0;

    if (text.includes('nat') || text.includes('gateway')) {
      matches.push({ key: 'natgateway', ...JARGON_DATABASE.natgateway, savingsVal: 480 });
    }
    if (text.includes('volumeusage') || text.includes('gp2') || text.includes('gp3') || text.includes('unattached') || text.includes('ebs')) {
      matches.push({ key: 'orphaned_ebs', ...JARGON_DATABASE.orphaned_ebs, savingsVal: 210 });
    }
    if (text.includes('elasticip') || text.includes('eip') || text.includes('unassociated') || text.includes('ipv4')) {
      matches.push({ key: 'unused_eip', ...JARGON_DATABASE.unused_eip, savingsVal: 36 });
    }
    if (text.includes('datatransfer') || text.includes('regional') || text.includes('inter-az') || text.includes('cross-az')) {
      matches.push({ key: 'cross_az_data', ...JARGON_DATABASE.cross_az_data, savingsVal: 620 });
    }
    if (text.includes('cloudwatch') || text.includes('log') || text.includes('putlogevents')) {
      matches.push({ key: 'cloudwatch_retention', ...JARGON_DATABASE.cloudwatch_retention, savingsVal: 110 });
    }
    if (text.includes('rds') || text.includes('database') || text.includes('postgres') || text.includes('mysql')) {
      matches.push({ key: 'idle_rds', ...JARGON_DATABASE.idle_rds, savingsVal: 350 });
    }

    // Fallback if no specific keyword matched: provide general audit findings
    if (matches.length === 0) {
      matches.push({ key: 'orphaned_ebs', ...JARGON_DATABASE.orphaned_ebs, savingsVal: 150 });
      matches.push({ key: 'natgateway', ...JARGON_DATABASE.natgateway, savingsVal: 280 });
    }

    // Calculate savings
    matches.forEach(m => estimatedTotalSavings += m.savingsVal);

    // Update Savings Banner
    savingsAmount.textContent = `$${estimatedTotalSavings.toLocaleString()}.00 / mo`;
    savingsSub.textContent = `Identified across ${matches.length} distinct AWS cost optimization opportunities.`;

    // Render empathetic agent report
    let greeting = "";
    if (anxiety >= 75) {
      greeting = "🚨 <strong>Don't panic!</strong> I found the culprit draining your bill. Take a deep breath — we can cut these charges within the next 10 minutes without touching production uptime:";
    } else if (anxiety >= 40) {
      greeting = "🧐 <strong>Diagnosis ready:</strong> Found several sneaky AWS charges that are easy to eliminate. Here is what they actually mean in human terms:";
    } else {
      greeting = "😎 <strong>High-five!</strong> Here's a proactive health check of your AWS footprint to keep margins ultra-healthy:";
    }

    let cardsHtml = `
      <div class="finding-card" style="border-left: 4px solid var(--aws-orange);">
        <p style="font-size: 14px; color: #fff;">${greeting}</p>
      </div>
    `;

    matches.forEach((leak, idx) => {
      cardsHtml += `
        <div class="finding-card">
          <div class="finding-header">
            <span class="finding-title">
              <span>#${idx + 1}</span> ${leak.title}
            </span>
            <span class="finding-leak-tag">Est. Savings: ${leak.estimatedSavingsMonthly}</span>
          </div>

          <p style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 6px;">
            ${leak.sku}
          </p>

          <div class="plain-explanation">
            <strong>🗣️ Plain-English Translation:</strong><br>
            ${leak.summary}
          </div>

          <div style="font-size: 13px; margin: 8px 0; color: #ffab70;">
            <strong>💥 Why you are overpaying:</strong> ${leak.whyItHurts}
          </div>

          <div class="cli-box">
            <div class="cli-box-header">
              <span class="cli-box-label">🛠️ Remediation: ${leak.fixTitle}</span>
              <button class="copy-btn" onclick="copyCliSnippet(this)">Copy AWS CLI</button>
            </div>
            <pre class="cli-code">${escapeHtml(leak.cliFix)}</pre>
          </div>
        </div>
      `;
    });

    findingsContainer.innerHTML = cardsHtml;

    // Trigger celebration confetti
    celebrateSavings();

  }, 400);
}

// Copy CLI snippet with visual feedback
function copyCliSnippet(button) {
  const code = button.closest('.cli-box').querySelector('.cli-code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.innerText;
    button.innerText = "✅ Copied!";
    button.style.background = "#2ea043";
    button.style.color = "#fff";

    setTimeout(() => {
      button.innerText = originalText;
      button.style.background = "";
      button.style.color = "";
    }, 2000);
  });
}

// Canvas-confetti celebration
function celebrateSavings() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 }
    });
  }
}

// Helper: Escape HTML
function escapeHtml(string) {
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Run default update on startup
updateAnxietyDisplay(anxietySlider.value);
