let questions = [];
let currentQuestions = [];
let answers = [];
let currentIndex = 0;
let score = 0;

async function loadQuestions() {
    try {
        const response = await fetch('questions.txt');
        if (!response.ok) throw new Error('Failed to load');
        const text = await response.text();
        questions = parseQuestions(text);
        document.getElementById('file-status').textContent = `Loaded ${questions.length} questions successfully!`;
    } catch (error) {
        document.getElementById('file-status').innerHTML = `<strong style="color:red">Error loading questions.txt</strong>`;
    }
}

function parseQuestions(text) {
    const lines = text.trim().split('\n');
    const parsed = [];
    let currentQ = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.match(/^\d+\./) || line.toUpperCase().startsWith('Q:') || line.toUpperCase().startsWith('QUESTION:')) {
            if (currentQ) parsed.push(currentQ);
            let questionText = line.match(/^\d+\./) ? line.replace(/^\d+\.\s*/, '') : line.substring(line.indexOf(':') + 1).trim();
            currentQ = { question: questionText, options: [], answer: '', explanation: '' };
        } 
        else if (line.match(/^[A-D]\)/i) || line.match(/^[A-D]:/i)) {
            if (currentQ) currentQ.options.push(line.substring(2).trim());
        } 
        else if (line.toUpperCase().startsWith('ANS:') || line.toUpperCase().startsWith('ANSWER:')) {
            if (currentQ) currentQ.answer = line.substring(line.indexOf(':') + 1).trim().toUpperCase();
        }
        else if (line.toUpperCase().startsWith('EXPLANATION:') || line.toUpperCase().startsWith('Answer is')) {
            if (currentQ) {
                currentQ.explanation = line.replace(/^(Explanation:|Answer is [A-D]:?)/i, '').trim();
            }
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
    document.querySelectorAll('.option').forEach((el, i) => el.classList.toggle('selected', i === idx));
}

function updateNavButtons() {
    document.getElementById('prev-btn').disabled = currentIndex === 0;
    document.getElementById('next-btn').classList.toggle('hidden', currentIndex === currentQuestions.length - 1);
    document.getElementById('submit-btn').classList.toggle('hidden', currentIndex !== currentQuestions.length - 1);
}

// Event Listeners
document.getElementById('prev-btn').onclick = () => { if(currentIndex>0){currentIndex--; showQuestion();}};
document.getElementById('next-btn').onclick = () => { if(currentIndex < currentQuestions.length-1){currentIndex++; showQuestion();}};
document.getElementById('submit-btn').onclick = showResults;
document.getElementById('start-btn').onclick = () => startQuiz(document.getElementById('num-questions').value);
document.getElementById('restart-btn').onclick = () => location.reload();

function showResults() {
    score = 0;
    let reviewHTML = '';

    currentQuestions.forEach((q, i) => {
        const userAnswer = answers[i];
        const correctIdx = q.options.findIndex((_, idx) => String.fromCharCode(65 + idx) === q.answer);
        const isCorrect = userAnswer === correctIdx;
        if (isCorrect) score++;

        const userLetter = userAnswer !== null ? String.fromCharCode(65 + userAnswer) : '—';

        reviewHTML += `
            <div style="padding:18px; margin:12px 0; background:#f8fafd; border-radius:10px; border-left:6px solid ${isCorrect ? '#7bc96f' : '#e74c3c'}">
                <strong>Q${i+1}:</strong> ${q.question}<br><br>
                <strong>Your answer:</strong> ${userLetter}<br>
                <strong>Correct answer:</strong> ${q.answer}<br>
                ${q.explanation ? `<strong>Explanation:</strong> ${q.explanation}` : ''}
            </div>
        `;
    });

    const percentage = Math.round((score / currentQuestions.length) * 100);
    document.getElementById('score').innerHTML = `${score} / ${currentQuestions.length} (${percentage}%)`;
    document.getElementById('review').innerHTML = reviewHTML;

    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');
}

window.onload = loadQuestions;
