let allQuestions = {};
let currentPool = [];
let currentIndex = 0;
let score = 0;
let totalAnswered = 0;

async function loadChapters() {
    const status = document.getElementById('status');
    status.textContent = "Loading chapters...";

    try {
        const jsonRes = await fetch('chapters.json');
        if (!jsonRes.ok) throw new Error("chapters.json not found");
        
        const data = await jsonRes.json();
        const chapters = data.chapters || [];

        const chapterList = document.getElementById('chapter-list');
        chapterList.innerHTML = '';

        for (let entry of chapters) {
            // entry is now the exact filename
            const displayName = entry.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const filename = entry + '.txt';

            try {
                const res = await fetch(`questions/${filename}`);
                if (res.ok) {
                    const text = await res.text();
                    allQuestions[displayName] = parseQuestions(text);

                    const div = document.createElement('div');
                    div.className = 'chapter-item';
                    div.innerHTML = `
                        <label>
                            <input type="checkbox" value="${displayName}" class="chapter-check">
                            ${displayName} 
                            <small>(${allQuestions[displayName].length} questions)</small>
                        </label>
                    `;
                    chapterList.appendChild(div);
                    console.log(`✅ Loaded: ${filename}`);
                } else {
                    console.log(`❌ Not found: ${filename}`);
                }
            } catch(e) {
                console.log(`Error loading ${filename}`);
            }
        }

        status.textContent = `${Object.keys(allQuestions).length} chapters loaded`;
    } catch (e) {
        status.innerHTML = `<strong style="color:red">Error loading chapters.json</strong>`;
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
            let qText = line.match(/^\d+\./) ? line.replace(/^\d+\.\s*/, '') : line.substring(line.indexOf(':') + 1).trim();
            currentQ = { question: qText, options: [], answer: '', explanation: '' };
        } else if (line.match(/^[A-D]\)/i) || line.match(/^[A-D]:/i)) {
            if (currentQ) currentQ.options.push(line.substring(2).trim());
        } else if (line.toUpperCase().startsWith('ANS:') || line.toUpperCase().startsWith('ANSWER:')) {
            if (currentQ) currentQ.answer = line.substring(line.indexOf(':') + 1).trim().toUpperCase();
        } else if (line.toUpperCase().startsWith('EXPLANATION:') || line.toUpperCase().includes('Answer is')) {
            if (currentQ) currentQ.explanation = line.replace(/^(Explanation:|Answer is [A-D]:?)/i, '').trim();
        }
    }
    if (currentQ) parsed.push(currentQ);
    return parsed.filter(q => q.options.length >= 2 && q.answer);
}

function startQuiz() {
    const checked = document.querySelectorAll('.chapter-check:checked');
    if (checked.length === 0) return alert("Please select at least one chapter");

    let pool = [];
    checked.forEach(cb => {
        const chName = cb.value;
        if (allQuestions[chName]) {
            allQuestions[chName].forEach(q => {
                pool.push({ ...q, chapter: chName });
            });
        }
    });

    const limitEnabled = document.getElementById('limit-questions').checked;
    if (limitEnabled) {
        const num = parseInt(document.getElementById('num-questions').value) || 10;
        pool.sort(() => Math.random() - 0.5);
        pool = pool.slice(0, num);
    }

    currentPool = pool;
    score = 0;
    totalAnswered = 0;
    currentIndex = 0;

    document.getElementById('setup').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');

    showQuestion();
}

function showQuestion() {
    if (currentPool.length === 0) return showResults();

    const q = currentPool[currentIndex];

    document.getElementById('current-q').textContent = totalAnswered + 1;
    document.getElementById('progress-fill').style.width = `${Math.round((totalAnswered / (totalAnswered + currentPool.length)) * 100)}%`;
    
    document.getElementById('question-text').innerHTML = `
        <small style="color:#555; font-size:1rem">📖 <strong>${q.chapter}</strong></small><br><br>
        ${q.question}
    `;

    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');

    q.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const el = document.createElement('div');
        el.className = 'option';
        el.innerHTML = `<strong>${letter}.</strong> ${opt}`;
        el.onclick = () => handleAnswer(idx, q);
        optionsDiv.appendChild(el);
    });
}

function handleAnswer(selectedIdx, q) {
    const options = document.querySelectorAll('.option');
    const correctIdx = q.options.findIndex((_, i) => String.fromCharCode(65 + i) === q.answer);
    const isCorrect = selectedIdx === correctIdx;

    options.forEach(opt => opt.style.pointerEvents = 'none');

    options.forEach((opt, i) => {
        if (i === correctIdx) opt.style.borderColor = '#7bc96f';
        if (i === selectedIdx && !isCorrect) opt.style.borderColor = '#e74c3c';
    });

    const feedback = document.getElementById('feedback');
    feedback.classList.remove('hidden');
    feedback.innerHTML = isCorrect ? 
        `<strong>✅ Correct!</strong>` : 
        `<strong>❌ Incorrect.</strong> Correct answer: <strong>${q.answer}</strong><br>${q.explanation || ''}`;

    if (isCorrect) {
        score++;
        currentPool.splice(currentIndex, 1);
        totalAnswered++;
    } else {
        const wrong = currentPool.splice(currentIndex, 1)[0];
        currentPool.push(wrong);
    }

    //totalAnswered++;
    document.getElementById('next-btn').classList.remove('hidden');
}

document.getElementById('next-btn').onclick = showQuestion;

document.getElementById('exit-btn').onclick = () => {
    if (confirm("Exit to chapter selection?")) {
        document.getElementById('quiz-container').classList.add('hidden');
        document.getElementById('setup').classList.remove('hidden');
    }
};

document.getElementById('start-btn').onclick = startQuiz;
document.getElementById('restart-btn').onclick = () => location.reload();

document.getElementById('limit-questions').onchange = function() {
    document.getElementById('limit-options').style.display = this.checked ? 'block' : 'none';
};

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

window.onload = loadChapters;
