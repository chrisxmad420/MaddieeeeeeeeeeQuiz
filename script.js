let questions = [];
let currentPool = [];
let currentIndex = 0;
let score = 0;
let totalAnswered = 0;

async function loadQuestions() {
    try {
        const response = await fetch('questions.txt');
        if (!response.ok) throw new Error('Failed to load');
        const text = await response.text();
        questions = parseQuestions(text);
        document.getElementById('file-status').textContent = `Loaded ${questions.length} questions successfully!`;
    } catch (error) {
        document.getElementById('file-status').innerHTML = `<strong style="color:red">Error: questions.txt not found</strong>`;
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
        else if (line.toUpperCase().startsWith('EXPLANATION:') || line.toUpperCase().includes('Answer is')) {
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
    
    currentPool = [...questions];
    if (num !== 'all') {
        const n = parseInt(num);
        if (n < currentPool.length) {
            currentPool.sort(() => Math.random() - 0.5);
            currentPool = currentPool.slice(0, n);
        }
    }

    score = 0;
    totalAnswered = 0;
    currentIndex = 0;

    document.getElementById('setup').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');

    showQuestion();
}

function showQuestion() {
    document.getElementById('exit-btn').classList.remove('hidden');
    if (currentPool.length === 0) return showResults();

    const q = currentPool[currentIndex];
    document.getElementById('current-q').textContent = totalAnswered + 1;
    document.getElementById('total-q').textContent = currentPool.length + totalAnswered;

    document.getElementById('progress-fill').style.width = `${Math.round((totalAnswered / (totalAnswered + currentPool.length)) * 100)}%`;
    document.getElementById('question-text').textContent = q.question;

    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');

    q.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const el = document.createElement('div');
        el.className = 'option';
        el.innerHTML = `<strong>${letter}.</strong> ${opt}`;
        el.dataset.index = idx;
        el.onclick = () => handleAnswer(idx, q);
        optionsDiv.appendChild(el);
    });
}

function handleAnswer(selectedIdx, q) {
    const options = document.querySelectorAll('.option');
    const correctIdx = q.options.findIndex((_, idx) => String.fromCharCode(65 + idx) === q.answer);
    const isCorrect = selectedIdx === correctIdx;

    options.forEach(opt => opt.style.pointerEvents = 'none');

    options.forEach((opt, i) => {
        if (i === correctIdx) opt.style.borderColor = '#7bc96f';
        if (i === selectedIdx && !isCorrect) opt.style.borderColor = '#e74c3c';
    });

    const feedback = document.getElementById('feedback');
    feedback.classList.remove('hidden');
    feedback.style.color = isCorrect ? '#7bc96f' : '#e74c3c';
    feedback.innerHTML = isCorrect ? 
        `<strong>✅ Correct!</strong>` : 
        `<strong>❌ Incorrect.</strong> The correct answer is <strong>${q.answer}</strong>.`;

    if (isCorrect) {
        score++;
        currentPool.splice(currentIndex, 1); // Remove correct question
        if (currentPool.length > 0) currentIndex = currentIndex % currentPool.length;
    } else {
        // Move wrong question to the end for retry
        const wrongQ = currentPool.splice(currentIndex, 1)[0];
        currentPool.push(wrongQ);
    }

    totalAnswered++;
    document.getElementById('next-btn').classList.remove('hidden');
}

document.getElementById('next-btn').addEventListener('click', showQuestion);

document.getElementById('exit-btn').addEventListener('click', () => {
    if (confirm("Exit to main menu? Progress will be lost.")) {
        document.getElementById('quiz-container').classList.add('hidden');
        document.getElementById('setup').classList.remove('hidden');
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    const num = document.getElementById('num-questions').value;
    startQuiz(num);
});

document.getElementById('restart-btn').addEventListener('click', () => location.reload());

function showResults() {
    const percentage = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    
    document.getElementById('score').innerHTML = `
        ${score} / ${totalAnswered} correct<br>
        <span style="font-size:1.5rem">(${percentage}%)</span>
    `;

    document.getElementById('review').innerHTML = `<p>Well done! You have completed the adaptive quiz.</p>`;

    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');
}

window.onload = loadQuestions;
