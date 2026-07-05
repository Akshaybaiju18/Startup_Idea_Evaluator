// Application State
const state = {
    ideas: [],
    criteria: [],
    scores: {} // Format: { ideaName: { criterionName: scoreValue } }
};

// DOM Elements
const addIdeaForm = document.getElementById('add-idea-form');
const ideaNameInput = document.getElementById('idea-name-input');
const ideasList = document.getElementById('ideas-list');
const ideasCount = document.getElementById('ideas-count');

const addCriterionForm = document.getElementById('add-criterion-form');
const criterionNameInput = document.getElementById('criterion-name-input');
const criterionWeightInput = document.getElementById('criterion-weight-input');
const weightValDisplay = document.getElementById('weight-val');
const criterionTypeInput = document.getElementById('criterion-type-input');
const criteriaList = document.getElementById('criteria-list');
const criteriaCount = document.getElementById('criteria-count');

const scoringSection = document.getElementById('scoring-section');
const scoringMatrixContainer = document.getElementById('scoring-matrix-container');

const resultsSection = document.getElementById('results-section');
const leaderboardCards = document.getElementById('leaderboard-cards');
const rankingsTableContainer = document.getElementById('rankings-table-container');
const comparativeAnalysisContainer = document.getElementById('comparative-analysis-container');
const breakdownTable = document.getElementById('breakdown-table');

const toastContainer = document.getElementById('toast-container');

// Initialize events
document.addEventListener('DOMContentLoaded', () => {
    // Sync slider number label
    criterionWeightInput.addEventListener('input', (e) => {
        weightValDisplay.textContent = e.target.value;
    });

    // Form Submissions
    addIdeaForm.addEventListener('submit', handleAddIdea);
    addCriterionForm.addEventListener('submit', handleAddCriterion);

    // Initial state check
    updateUIVisibility();
});

// Toast system
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = document.createElement('i');
    icon.className = type === 'success' 
        ? 'fa-solid fa-circle-check' 
        : 'fa-solid fa-circle-exclamation';
        
    const text = document.createElement('span');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    toastContainer.appendChild(toast);
    
    // Automatically remove after 3s (matches CSS animation)
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Logic: Normalize Weights
function normalizeWeights() {
    const totalWeight = state.criteria.reduce((sum, c) => sum + c.weight, 0);
    state.criteria.forEach(c => {
        c.normalized_weight = totalWeight === 0 ? 0 : c.weight / totalWeight;
    });
}

// Logic: Calculate weighted scores
function calculateWeightedScore(ideaName) {
    let totalScore = 0;
    const ideaScores = state.scores[ideaName] || {};
    
    state.criteria.forEach(c => {
        const rawScore = ideaScores[c.name] !== undefined ? ideaScores[c.name] : 5;
        const adjustedScore = c.type === 'min' ? (10 - rawScore) : rawScore;
        totalScore += adjustedScore * (c.normalized_weight || 0);
    });
    
    return totalScore;
}

// Logic: Compare ideas & build advantages
function buildComparisonData(winnerName, rankedList) {
    const winnerScore = calculateWeightedScore(winnerName);
    const comparisons = [];
    
    for (let i = 1; i < rankedList.length; i++) {
        const otherName = rankedList[i].name;
        const otherScore = rankedList[i].score;
        const margin = winnerScore - otherScore;
        
        const comparison = {
            otherName,
            otherScore: otherScore.toFixed(3),
            margin: margin.toFixed(3),
            advantages: []
        };
        
        state.criteria.forEach(c => {
            const rawWinner = state.scores[winnerName][c.name] !== undefined ? state.scores[winnerName][c.name] : 5;
            const rawOther = state.scores[otherName][c.name] !== undefined ? state.scores[otherName][c.name] : 5;
            
            const adjWinner = c.type === 'min' ? (10 - rawWinner) : rawWinner;
            const adjOther = c.type === 'min' ? (10 - rawOther) : rawOther;
            
            if (adjWinner > adjOther) {
                const scoreDiff = adjWinner - adjOther;
                const weightedDiff = scoreDiff * (c.normalized_weight || 0);
                
                comparison.advantages.push({
                    criterion: c.name,
                    weight: c.weight,
                    winnerScore: adjWinner,
                    otherScore: adjOther,
                    weightedAdvantage: weightedDiff
                });
            }
        });
        
        // Sort advantages by weighted value descending
        comparison.advantages.sort((a, b) => b.weightedAdvantage - a.weightedAdvantage);
        comparisons.push(comparison);
    }
    
    return {
        winner: winnerName,
        winnerScore: winnerScore.toFixed(3),
        comparisons
    };
}

// UI: Update Visibility of entire panels
function updateUIVisibility() {
    const hasIdeas = state.ideas.length > 0;
    const hasCriteria = state.criteria.length > 0;
    
    if (hasIdeas && hasCriteria) {
        scoringSection.classList.remove('hidden');
        resultsSection.classList.remove('hidden');
    } else {
        scoringSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
    }
}

// Handler: Add Idea
function handleAddIdea(e) {
    e.preventDefault();
    const name = ideaNameInput.value.trim();
    
    if (!name) return;
    
    if (state.ideas.includes(name)) {
        showToast('Idea already exists!', 'error');
        return;
    }
    
    state.ideas.push(name);
    state.scores[name] = {};
    
    // Initialize scores for existing criteria
    state.criteria.forEach(c => {
        state.scores[name][c.name] = 5; // Default score of 5
    });
    
    ideaNameInput.value = '';
    
    renderIdeas();
    renderScoringMatrix();
    evaluateAndRenderResults();
    updateUIVisibility();
    showToast(`Added idea: "${name}"`);
}

// Handler: Add Criterion
function handleAddCriterion(e) {
    e.preventDefault();
    const name = criterionNameInput.value.trim();
    const weight = parseInt(criterionWeightInput.value, 10);
    // If checkbox is checked, type is max (benefit). If unchecked, min (cost).
    const type = criterionTypeInput.checked ? 'max' : 'min';
    
    if (!name) return;
    
    if (state.criteria.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showToast('Criterion already exists!', 'error');
        return;
    }
    
    state.criteria.push({ name, weight, type });
    normalizeWeights();
    
    // Set scores for all ideas on this new criterion
    state.ideas.forEach(idea => {
        state.scores[idea][name] = 5; // Default score of 5
    });
    
    // Reset inputs
    criterionNameInput.value = '';
    criterionWeightInput.value = '5';
    weightValDisplay.textContent = '5';
    criterionTypeInput.checked = true;
    
    renderCriteria();
    renderScoringMatrix();
    evaluateAndRenderResults();
    updateUIVisibility();
    showToast(`Added criterion: "${name}"`);
}

// Handler: Delete Idea
function deleteIdea(name) {
    state.ideas = state.ideas.filter(idea => idea !== name);
    delete state.scores[name];
    
    renderIdeas();
    renderScoringMatrix();
    evaluateAndRenderResults();
    updateUIVisibility();
    showToast(`Removed idea: "${name}"`);
}

// Handler: Delete Criterion
function deleteCriterion(name) {
    state.criteria = state.criteria.filter(c => c.name !== name);
    normalizeWeights();
    
    // Remove scores from all ideas
    state.ideas.forEach(idea => {
        delete state.scores[idea][name];
    });
    
    renderCriteria();
    renderScoringMatrix();
    evaluateAndRenderResults();
    updateUIVisibility();
    showToast(`Removed criterion: "${name}"`);
}

// Render: Ideas List
function renderIdeas() {
    ideasList.innerHTML = '';
    ideasCount.textContent = state.ideas.length;
    
    if (state.ideas.length === 0) {
        ideasList.innerHTML = '<li class="empty-state">No ideas added yet. Enter an idea above to start.</li>';
        return;
    }
    
    state.ideas.forEach(idea => {
        const li = document.createElement('li');
        li.className = 'list-item';
        
        li.innerHTML = `
            <div class="item-content">
                <i class="fa-solid fa-lightbulb" style="color: #fbbf24;"></i>
                <span>${escapeHtml(idea)}</span>
            </div>
            <button class="btn-delete" onclick="deleteIdea('${escapeHtml(idea)}')">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        ideasList.appendChild(li);
    });
}

// Render: Criteria List
function renderCriteria() {
    criteriaList.innerHTML = '';
    criteriaCount.textContent = state.criteria.length;
    
    if (state.criteria.length === 0) {
        criteriaList.innerHTML = '<li class="empty-state">No criteria added yet. Enter a criterion above.</li>';
        return;
    }
    
    state.criteria.forEach(c => {
        const li = document.createElement('li');
        li.className = 'list-item';
        
        const typeBadgeClass = c.type === 'max' ? 'badge-max' : 'badge-min';
        const typeBadgeText = c.type === 'max' ? 'Max (Benefit)' : 'Min (Cost)';
        
        li.innerHTML = `
            <div class="item-content">
                <i class="fa-solid fa-sliders" style="color: #6366f1;"></i>
                <span>${escapeHtml(c.name)}</span>
            </div>
            <div class="item-meta">
                <span class="badge-tag ${typeBadgeClass}">${typeBadgeText}</span>
                <span class="badge-tag badge-weight">W: ${c.weight}</span>
                <button class="btn-delete" onclick="deleteCriterion('${escapeHtml(c.name)}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        criteriaList.appendChild(li);
    });
}

// Render: Scoring Matrix Slider Board
function renderScoringMatrix() {
    scoringMatrixContainer.innerHTML = '';
    
    if (state.ideas.length === 0 || state.criteria.length === 0) return;
    
    const table = document.createElement('table');
    table.className = 'matrix-table';
    
    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const thIdea = document.createElement('th');
    thIdea.textContent = 'Startup Idea';
    headerRow.appendChild(thIdea);
    
    state.criteria.forEach(c => {
        const th = document.createElement('th');
        const directionIcon = c.type === 'max' ? 'fa-arrow-up-right' : 'fa-arrow-down-long';
        const directionColor = c.type === 'max' ? 'var(--success-color)' : 'var(--warning-color)';
        
        th.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <span>${escapeHtml(c.name)}</span>
                <span style="font-size: 0.75rem; color: var(--color-text-dim); font-weight: normal;">
                    Weight: ${c.weight} | <i class="fa-solid ${directionIcon}" style="color: ${directionColor};"></i> ${c.type.toUpperCase()}
                </span>
            </div>
        `;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Body
    const tbody = document.createElement('tbody');
    state.ideas.forEach(idea => {
        const row = document.createElement('tr');
        
        const tdName = document.createElement('td');
        tdName.className = 'idea-col-header';
        tdName.textContent = idea;
        row.appendChild(tdName);
        
        state.criteria.forEach(c => {
            const tdScore = document.createElement('td');
            tdScore.className = 'score-slider-cell';
            
            const currentScore = state.scores[idea][c.name] !== undefined ? state.scores[idea][c.name] : 5;
            
            tdScore.innerHTML = `
                <div class="slider-container">
                    <input type="range" min="1" max="10" value="${currentScore}" 
                        class="slider score-slider" 
                        data-idea="${escapeHtml(idea)}" 
                        data-criterion="${escapeHtml(c.name)}">
                    <div class="slider-score-display">${currentScore}</div>
                </div>
            `;
            
            // Real-time slider movement handler
            const slider = tdScore.querySelector('input');
            const display = tdScore.querySelector('.slider-score-display');
            
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                display.textContent = val;
                state.scores[idea][c.name] = val;
                
                // Recalculate everything in real-time
                evaluateAndRenderResults();
            });
            
            row.appendChild(tdScore);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    scoringMatrixContainer.appendChild(table);
}

// Logic & UI: Evaluate scores and update results
function evaluateAndRenderResults() {
    if (state.ideas.length === 0 || state.criteria.length === 0) return;
    
    // 1. Calculate weighted scores
    const results = state.ideas.map(name => {
        return {
            name,
            score: calculateWeightedScore(name)
        };
    });
    
    // 2. Rank ideas (descending)
    // Stable sort to maintain insertion order for ties, matching Python CLI logic
    results.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        // If tied, maintain entry order
        return state.ideas.indexOf(a.name) - state.ideas.indexOf(b.name);
    });
    
    // 3. Render Leaderboard Podium
    renderPodium(results);
    
    // 4. Render Details ranking table
    renderRankingsTable(results);
    
    // 5. Render Breakdown Matrix Details
    renderBreakdownMatrix(results);
    
    // 6. Render Comparative Insights (Explanations)
    renderComparativeInsights(results);
}

// Render Podium (1st, 2nd, 3rd)
function renderPodium(rankedList) {
    leaderboardCards.innerHTML = '';
    
    // Gold/1st Place
    const first = rankedList[0];
    const second = rankedList[1] || null;
    const third = rankedList[2] || null;
    
    if (second) {
        leaderboardCards.appendChild(createPodiumCard(second.name, second.score, 2, 'silver'));
    }
    
    if (first) {
        leaderboardCards.appendChild(createPodiumCard(first.name, first.score, 1, 'gold'));
    }
    
    if (third) {
        leaderboardCards.appendChild(createPodiumCard(third.name, third.score, 3, 'bronze'));
    }
}

function createPodiumCard(name, score, rank, medalClass) {
    const card = document.createElement('div');
    card.className = `podium-card ${medalClass}`;
    
    let iconClass = 'fa-trophy';
    if (rank === 2) iconClass = 'fa-medal';
    if (rank === 3) iconClass = 'fa-award';
    
    card.innerHTML = `
        <div class="podium-rank"><i class="fa-solid ${iconClass}"></i></div>
        <div class="podium-title" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
        <div class="podium-score">${score.toFixed(3)}</div>
    `;
    return card;
}

// Render Simple Rankings table
function renderRankingsTable(rankedList) {
    rankingsTableContainer.innerHTML = '';
    
    const table = document.createElement('table');
    table.className = 'rank-list-table';
    
    rankedList.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td class="rank-list-num">#${index + 1}</td>
            <td class="rank-list-name">${escapeHtml(item.name)}</td>
            <td class="rank-list-score">${item.score.toFixed(3)}</td>
        `;
        table.appendChild(tr);
    });
    
    rankingsTableContainer.appendChild(table);
}

// Render Breakdown Breakdown math table
function renderBreakdownMatrix(rankedList) {
    breakdownTable.innerHTML = '';
    
    // Header
    const thead = document.createElement('thead');
    const trHeader = document.createElement('tr');
    
    const thIdea = document.createElement('th');
    thIdea.textContent = 'Startup Idea';
    trHeader.appendChild(thIdea);
    
    state.criteria.forEach(c => {
        const th = document.createElement('th');
        th.textContent = c.name;
        trHeader.appendChild(th);
    });
    
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Final Score';
    trHeader.appendChild(thTotal);
    
    thead.appendChild(trHeader);
    breakdownTable.appendChild(thead);
    
    // Body
    const tbody = document.createElement('tbody');
    rankedList.forEach(item => {
        const idea = item.name;
        const row = document.createElement('tr');
        
        const tdName = document.createElement('td');
        tdName.className = 'row-idea-name';
        tdName.textContent = idea;
        row.appendChild(tdName);
        
        state.criteria.forEach(c => {
            const tdDetail = document.createElement('td');
            const raw = state.scores[idea][c.name] !== undefined ? state.scores[idea][c.name] : 5;
            const adj = c.type === 'min' ? (10 - raw) : raw;
            const weightedContribution = adj * c.normalized_weight;
            
            tdDetail.innerHTML = `
                <div style="font-weight: 600;">${adj}</div>
                <div class="math-col">Raw: ${raw}</div>
                <div class="math-col">W: ${weightedContribution.toFixed(3)}</div>
            `;
            row.appendChild(tdDetail);
        });
        
        const tdTotal = document.createElement('td');
        tdTotal.className = 'total-score-col';
        tdTotal.textContent = item.score.toFixed(3);
        row.appendChild(tdTotal);
        
        tbody.appendChild(row);
    });
    breakdownTable.appendChild(tbody);
}

// Render Comparative Insights explanations (matches python explanation logic)
function renderComparativeInsights(rankedList) {
    comparativeAnalysisContainer.innerHTML = '';
    
    if (rankedList.length === 0) return;
    
    const winner = rankedList[0].name;
    const winnerScore = rankedList[0].score;
    
    // Show Winner Showcase Card
    const winnerShowcase = document.createElement('div');
    winnerShowcase.className = 'insight-winner-card';
    winnerShowcase.innerHTML = `
        <div class="winner-cup-icon"><i class="fa-solid fa-trophy animate__animated animate__bounce"></i></div>
        <div class="winner-text">
            <h4>"${escapeHtml(winner)}" ranks #1</h4>
            <p>Calculated final score is <strong>${winnerScore.toFixed(3)}</strong> out of 10.0. Read below to see how it outperformed its competitors.</p>
        </div>
    `;
    comparativeAnalysisContainer.appendChild(winnerShowcase);
    
    if (rankedList.length === 1) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Add more ideas to view comparative analysis descriptions.';
        comparativeAnalysisContainer.appendChild(emptyState);
        return;
    }
    
    // Scroll container for other comparisons
    const comparisonsScroller = document.createElement('div');
    comparisonsScroller.className = 'comparisons-scroller';
    
    // Build comparison data
    const comparisonData = buildComparisonData(winner, rankedList);
    
    comparisonData.comparisons.forEach(comp => {
        const compCard = document.createElement('div');
        compCard.className = 'comparison-card';
        
        let advantagesHtml = '';
        if (comp.advantages.length > 0) {
            // Show top 2 advantages like CLI
            comp.advantages.slice(0, 2).forEach(adv => {
                advantagesHtml += `
                    <div class="advantage-item">
                        <span class="adv-name">
                            <i class="fa-solid fa-circle-chevron-up adv-arrow"></i>
                            <span>${escapeHtml(adv.criterion)} (Importance: ${adv.weight})</span>
                        </span>
                        <span class="adv-stats">
                            <span class="adv-raw-comp">${adv.winnerScore} vs ${adv.otherScore}</span>
                            <span class="adv-weighted-gain">(+${adv.weightedAdvantage.toFixed(3)} pts)</span>
                        </span>
                    </div>
                `;
            });
        } else {
            advantagesHtml = `<div class="empty-state" style="padding: 0.5rem; border: none; background: transparent;">No clear advantage criteria found. Margin was determined by other criteria margins.</div>`;
        }
        
        compCard.innerHTML = `
            <div class="comp-header">
                <span class="comp-vs-title">vs "${escapeHtml(comp.otherName)}"</span>
                <span class="comp-margin-badge">Margin: +${comp.margin}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                ${advantagesHtml}
            </div>
        `;
        comparisonsScroller.appendChild(compCard);
    });
    
    comparativeAnalysisContainer.appendChild(comparisonsScroller);
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Expose delete functions to global window object since we use inline onclick
window.deleteIdea = deleteIdea;
window.deleteCriterion = deleteCriterion;
