let questions = [];
let currentQuestions = [];
let currentIndex = 0;
let answers = [];
let score = 0;

async function loadQuestions() {
    try {
        const response = await fetch('questions.txt');
        if (!response.ok) throw new Error('Failed to load');
        const text = await response.text();
        questions = parseQuestions(text);
        document.getElementById('file-status').textContent = `Loaded ${questions.length} questions!`;
    } catch (e) {
        document.getElementById('file-status').innerHTML = `<strong style="color:red">Error: Make sure questions.txt exists</strong>`;
    }
}

function parseQuestions(text) {
    const lines = text.trim().split('\n');
    const parsed = [];
    let currentQ = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.toUpperCase().startsWith('Q:') || line.toUpperCase().startsWith('QUESTION:')) {
            if (currentQ) parsed.push(currentQ);
            currentQ = { question: line.substring(line.indexOf(':')+1).trim(), options: [], answer: '' };
        } else if (line.match(/^[A-D]\)/i) || line.match(/^[A-D]:/i)) {
            if (currentQ) currentQ.options.push(line.substring(2).trim());
        } else if (line.toUpperCase().startsWith('ANS:') || line.toUpperCase().startsWith('ANSWER:')) {
            if (currentQ) currentQ.answer = line.substring(line.indexOf(':')+1).trim().toUpperCase();
        }
    }
    if (currentQ) parsed.push(currentQ);
    return parsed.filter(q => q.options.length >= 2 && q.answer);
}

function startQuiz(num) {
    if (questions.length === 0) return alert("No questions loaded");
    
    currentQuestions = [...questions];
    if (num !== 'all') {
        const n = parseInt(num);
        currentQuestions.sort(() => Math.random() - 0.5);
        currentQuestions = currentQuestions.slice(0, n);
    }

    answers = new Array(currentQuestions.length).fill(null);
    currentIndex = 0;

    document.getElementById('setup').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    showQuestion();
}

function showQuestion() {
    const q = currentQuestions[currentIndex];
    document.getElementById('current-q').textContent = currentIndex + 1;
    document.getElementById('total-q').textContent = currentQuestions.length;
    document.getElementById('progress-fill').style.width = `${(currentIndex / currentQuestions.length) * 100}%`;
    document.getElementById('question-text').textContent = q.question;

    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const el = document.createElement('div');
        el.className = 'option';
        el.innerHTML = `<strong>${letter}.</strong> ${opt}`;
        el.dataset.index = idx;
        el.onclick = () => selectAnswer(idx);
        optionsDiv.appendChild(el);
    });

    updateNavButtons();
}

function selectAnswer(idx) {
    answers[currentIndex] = idx;
    document.querySelectorAll('.option').forEach((el, i) => {
        el.classList.toggle('selected', i === idx);
    });
}

function updateNavButtons() {
    document.getElementById('prev-btn').disabled = currentIndex === 0;
    document.getElementById('next-btn').classList.toggle('hidden', currentIndex === currentQuestions.length - 1);
    document.getElementById('submit-btn').classList.toggle('hidden', currentIndex !== currentQuestions.length - 1);
}

// Event Listeners
document.getElementById('prev-btn').onclick = () => { if (currentIndex > 0) { currentIndex--; showQuestion(); } };
document.getElementById('next-btn').onclick = () => { if (currentIndex < currentQuestions.length - 1) { currentIndex++; showQuestion(); } };
document.getElementById('submit-btn').onclick = showResults;
document.getElementById('start-btn').onclick = () => startQuiz(document.getElementById('num-questions').value);
document.getElementById('restart-btn').onclick = () => location.reload();

function showResults() {
    let score = 0;
    let html = '';
    currentQuestions.forEach((q, i) => {
        const user = answers[i];
        const correctIdx = q.options.findIndex((_, idx) => String.fromCharCode(65 + idx) === q.answer);
        if (user === correctIdx) score++;
        html += `<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px">
            <strong>Q${i+1}:</strong> ${q.question}<br>
            Your answer: <strong>${user !== null ? String.fromCharCode(65 + user) : '—'}</strong><br>
            Correct: <strong>${q.answer}</strong>
        </div>`;
    });

    document.getElementById('score').innerHTML = `${score} / ${currentQuestions.length} correct`;
    document.getElementById('review').innerHTML = html;
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');
}

window.onload = loadQuestions;