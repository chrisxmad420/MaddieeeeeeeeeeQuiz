let questions = [];
let currentQuestions = [];
let answers = [];
let currentIndex = 0;
let score = 0;

async function loadQuestions() {
    try {
        const response = await fetch('questions.txt');
        if (!response.ok) {
            throw new Error('Failed to load questions.txt');
        }
        const text = await response.text();
        questions = parseQuestions(text);
        document.getElementById('file-status').textContent = `Loaded ${questions.length} questions successfully!`;
    } catch (error) {
        console.error(error);
        document.getElementById('file-status').innerHTML = `
            <strong style="color: #e74c3c;">Error loading questions.txt</strong><br>
            Make sure questions.txt exists in the root of your repository.
        `;
    }
}

function parseQuestions(text) {
    const lines = text.trim().split('\n');
    const parsed = [];
    let currentQ = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Support numbered questions like "1. Question text" or "Q: Question"
        if (line.match(/^\d+\./) || line.toUpperCase().startsWith('Q:') || line.toUpperCase().startsWith('QUESTION:')) {
            if (currentQ) parsed.push(currentQ);
            
            let questionText = line;
            if (line.match(/^\d+\./)) {
                questionText = line.replace(/^\d+\.\s*/, '');  // Remove "1. "
            } else {
                questionText = line.substring(line.indexOf(':') + 1).trim();
            }

            currentQ = {
                question: questionText,
                options: [],
                answer: ''
            };
        } 
        else if (line.match(/^[A-D]\)/i) || line.match(/^[A-D]:/i)) {
            if (currentQ) {
                currentQ.options.push(line.substring(2).trim());
            }
        } 
        else if (line.toUpperCase().startsWith('ANS:') || line.toUpperCase().startsWith('ANSWER:')) {
            if (currentQ) {
                currentQ.answer = line.substring(line.indexOf(':') + 1).trim().toUpperCase();
            }
        }
    }

    if (currentQ) parsed.push(currentQ);
    return parsed.filter(q => q.options.length >= 2 && q.answer);
}

function startQuiz(num) {
    if (questions.length === 0) {
        alert("No questions loaded. Please check questions.txt");
        return;
    }

    currentQuestions = [...questions];
    if (num !== 'all') {
        const n = parseInt(num);
        if (n < currentQuestions.length) {
            currentQuestions.sort(() => Math.random() - 0.5);
            currentQuestions = currentQuestions.slice(0, n);
        }
    }

    answers = new Array(currentQuestions.length).fill(null);
    currentIndex = 0;
    score = 0;

    document.getElementById('setup').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');

    showQuestion();
}

function showQuestion() {
    const q = currentQuestions[currentIndex];
    document.getElementById('current-q').textContent = currentIndex + 1;
    document.getElementById('total-q').textContent = currentQuestions.length;
    
    const progress = ((currentIndex) / currentQuestions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;

    document.getElementById('question-text').textContent = q.question;

    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        optionEl.innerHTML = `<strong>${letter}.</strong> ${opt}`;
        optionEl.dataset.index = idx;
        optionEl.addEventListener('click', () => selectAnswer(idx));
        optionsDiv.appendChild(optionEl);
    });

    if (answers[currentIndex] !== null) {
        const selected = optionsDiv.querySelector(`.option[data-index="${answers[currentIndex]}"]`);
        if (selected) selected.classList.add('selected');
    }

    updateNavButtons();
}

function selectAnswer(idx) {
    answers[currentIndex] = idx;
    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    options[idx].classList.add('selected');
}

function updateNavButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    prevBtn.disabled = currentIndex === 0;
    nextBtn.classList.toggle('hidden', currentIndex === currentQuestions.length - 1);
    submitBtn.classList.toggle('hidden', currentIndex !== currentQuestions.length - 1);
}

// Navigation
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        showQuestion();
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentIndex < currentQuestions.length - 1) {
        currentIndex++;
        showQuestion();
    }
});

document.getElementById('submit-btn').addEventListener('click', showResults);

document.getElementById('start-btn').addEventListener('click', () => {
    const numSelect = document.getElementById('num-questions');
    const num = numSelect.value;
    startQuiz(num);
});

document.getElementById('restart-btn').addEventListener('click', () => {
    location.reload();
});

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
            <div class="review-item" style="padding:15px; margin:10px 0; background:#f8fafd; border-radius:8px; border-left:5px solid ${isCorrect ? '#7bc96f' : '#e74c3c'}">
                <strong>Q${i+1}:</strong> ${q.question}<br>
                <span>Your answer: <strong>${userLetter}</strong></span><br>
                <span>Correct answer: <strong>${q.answer}</strong></span>
            </div>
        `;
    });

    const percentage = Math.round((score / currentQuestions.length) * 100);
    
    document.getElementById('score').innerHTML = `
        ${score} / ${currentQuestions.length} 
        <span style="font-size:1.2rem; color:#666">(${percentage}%)</span>
    `;
    
    document.getElementById('review').innerHTML = reviewHTML;
    
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');
}

// Initialize
window.onload = () => {
    loadQuestions();
};
