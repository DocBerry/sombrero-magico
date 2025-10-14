let names = []; // Array de objetos {name, weight}
let items = []; // Array de strings para items asociados

// Inicializar analíticas
function initAnalytics() {
    const today = new Date().toISOString().split('T')[0];
    let drawsToday = sessionStorage.getItem('drawsToday') || 0;
    let currentDate = sessionStorage.getItem('currentDate') || today;
    let history = JSON.parse(sessionStorage.getItem('history')) || [];

    if (currentDate !== today) {
        drawsToday = 0;
        sessionStorage.setItem('currentDate', today);
    }

    updateAnalyticsDisplay(drawsToday, history);
}

function updateAnalytics(drawsToday, winners) {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString();
    const entry = { date: today, time, winners: winners.map(w => w.name).join(', ') };
    let history = JSON.parse(sessionStorage.getItem('history')) || [];
    history.push(entry);
    if (history.length > 5) history.shift();

    sessionStorage.setItem('drawsToday', drawsToday + 1);
    sessionStorage.setItem('history', JSON.stringify(history));

    updateAnalyticsDisplay(drawsToday + 1, history);
}

function updateAnalyticsDisplay(drawsToday, history) {
    document.getElementById('drawsToday').textContent = `Sorteos hoy: ${drawsToday}`;
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    history.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.date} ${entry.time}: ${entry.winners}`;
        historyList.appendChild(li);
    });
}

initAnalytics();

// Nombres
document.getElementById('addButton').addEventListener('click', addName);
document.getElementById('nameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addName();
});

function addName() {
    const nameInput = document.getElementById('nameInput');
    const weightType = document.getElementById('weightType').value;
    const weightInput = document.getElementById('weightInput');
    const name = nameInput.value.trim();
    let weight = parseInt(weightInput.value) || 1;

    if (weight < 0) weight = 0; // Para probabilidad, permitimos 0
    if (name) {
        if (weightType === 'probability') {
            // Convertir probabilidad (%) a peso relativo (normalizado después)
            weight = weight; // Mantendremos como entrada directa y normalizaremos en render
        } else {
            if (weight < 1) weight = 1; // Peso mínimo 1 si no es probabilidad
        }
        names.push({ name, weight, type: weightType });
        renderNames();
        nameInput.value = '';
        weightInput.value = 1;
        nameInput.focus();
        updateNumWinners();
    }
}

function renderNames() {
    const list = document.getElementById('namesList');
    list.innerHTML = '';
    const totalWeight = names.reduce((sum, item) => sum + (item.type === 'probability' ? (item.weight / 100) : item.weight), 0);
    names.forEach((item, index) => {
        const tag = document.createElement('div');
        tag.classList.add('name-tag');
        let displayValue = item.weight;
        let probability = totalWeight > 0 ? ((item.type === 'probability' ? (item.weight / 100) : item.weight) / totalWeight * 100).toFixed(2) : 0;
        if (item.type === 'probability') {
            const normalizedWeight = totalWeight > 0 ? (item.weight / totalWeight) * 100 : item.weight;
            displayValue = `${normalizedWeight.toFixed(2)}%`;
        }
        tag.innerHTML = `
            <span>${item.name} (Probabilidad: ${probability}%)</span>
            <select class="weight-type-edit" data-index="${index}">
                <option value="weight" ${item.type === 'weight' ? 'selected' : ''}>Peso</option>
                <option value="probability" ${item.type === 'probability' ? 'selected' : ''}>Probabilidad (%)</option>
            </select>
            <input type="number" class="weight-edit" min="${item.type === 'probability' ? 0 : 1}" value="${item.weight}" data-index="${index}">
            <span class="remove" data-index="${index}">✕</span>
        `;
        list.appendChild(tag);
    });
    document.querySelectorAll('.weight-edit').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = e.target.dataset.index;
            let newValue = parseInt(e.target.value) || (names[index].type === 'probability' ? 0 : 1);
            if (names[index].type === 'weight' && newValue < 1) newValue = 1;
            names[index].weight = newValue;
            renderNames(); // Re-render para actualizar display y probabilidad
        });
    });
    document.querySelectorAll('.weight-type-edit').forEach(select => {
        select.addEventListener('change', (e) => {
            const index = e.target.dataset.index;
            names[index].type = e.target.value;
            renderNames(); // Re-render para ajustar el min y display
        });
    });
    document.querySelectorAll('.remove').forEach(btn => {
        btn.addEventListener('click', (e) => removeItem(e, names, renderNames));
    });
}

document.getElementById('clearButton').addEventListener('click', () => {
    names = [];
    renderNames();
    updateNumWinners();
});

// Items asociados
document.getElementById('addItemButton').addEventListener('click', addItem);
document.getElementById('itemInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addItem();
});

function addItem() {
    const itemInput = document.getElementById('itemInput');
    const item = itemInput.value.trim();
    if (item) {
        items.push(item);
        renderItems();
        itemInput.value = '';
        itemInput.focus();
        updateNumWinners();
    }
}

function renderItems() {
    const list = document.getElementById('itemsList');
    list.innerHTML = '';
    items.forEach((item, index) => {
        const tag = document.createElement('div');
        tag.classList.add('name-tag');
        tag.innerHTML = `
            <span>${item}</span>
            <span class="remove" data-index="${index}">✕</span>
        `;
        list.appendChild(tag);
    });
    document.querySelectorAll('.remove').forEach(btn => {
        btn.addEventListener('click', (e) => removeItem(e, items, renderItems));
    });
}

function removeItem(e, array, renderFunc) {
    const index = e.target.dataset.index;
    array.splice(index, 1);
    renderFunc();
    updateNumWinners();
}

document.getElementById('clearItemsButton').addEventListener('click', () => {
    items = [];
    renderItems();
    updateNumWinners();
});

// Función para actualizar numWinners basado en items
function updateNumWinners() {
    const numWinnersInput = document.getElementById('numWinners');
    if (items.length > 0) {
        numWinnersInput.value = names.length;
        numWinnersInput.disabled = true;
    } else {
        numWinnersInput.disabled = false;
    }
}

// Llamar al inicio
updateNumWinners();

// Sorteo
document.getElementById('startButton').addEventListener('click', startMagic);

function startMagic() {
    if (names.length === 0) {
        alert('¡Añade al menos un nombre para la magia!');
        return;
    }

    let numWinners = names.length; // Por default, todos los nombres si hay items
    if (items.length === 0) {
        const numWinnersInput = document.getElementById('numWinners');
        numWinners = parseInt(numWinnersInput.value) || 1;
        if (numWinners > names.length) {
            alert('El número de ganadores no puede ser mayor que el de nombres disponibles.');
            return;
        }
        if (numWinners < 1) numWinners = 1;
    } else if (numWinners === 0) {
        alert('Añade nombres para asignar items.');
        return;
    }

    const hat = document.getElementById('hat');
    hat.classList.add('shake');

    setTimeout(() => {
        let winners = [];
        let remainingNames = [...names]; // Crear una copia para no modificar el original
        console.log("Intentando seleccionar", numWinners, "ganadores de", remainingNames.length, "nombres");

        for (let i = 0; i < numWinners; i++) {
            if (remainingNames.length === 0) {
                console.log("No quedan más nombres para seleccionar.");
                break; // Salir si no hay más nombres
            }
            const winner = weightedRandom(remainingNames);
            winners.push(winner);
            const index = remainingNames.findIndex(item => item.name === winner.name);
            if (index !== -1) {
                remainingNames.splice(index, 1); // Eliminar el ganador seleccionado
            }
            console.log(`Ganador ${i + 1}:`, winner.name, "Quedan", remainingNames.length);
        }

        hat.classList.remove('shake');

        // Asignar items si hay
        let assigned = new Array(numWinners).fill().map(() => []);
        if (items.length > 0 && numWinners > 0) {
            let shuffledItems = [...items].sort(() => Math.random() - 0.5);
            const base = Math.floor(shuffledItems.length / numWinners);
            const extra = shuffledItems.length % numWinners;
            let itemIndex = 0;
            for (let i = 0; i < numWinners; i++) {
                const numForThis = base + (i < extra ? 1 : 0);
                assigned[i] = shuffledItems.slice(itemIndex, itemIndex + numForThis);
                itemIndex += numForThis;
            }
        }

        // Mostrar resultados con probabilidades individuales si hay >1 ganador
        const winnersList = document.getElementById('winnersList');
        winnersList.innerHTML = '';
        const totalWeight = names.reduce((sum, item) => sum + (item.type === 'probability' ? (item.weight / 100) : item.weight), 0);
        const hasVariableWeights = names.some(n => n.weight > 1 || (n.type === 'probability' && n.weight > 0));
        if (numWinners > 1) {
            winners.forEach((winner, idx) => {
                let probText = '';
                if (hasVariableWeights) {
                    const prob = ((winner.type === 'probability' ? (winner.weight / 100) : winner.weight) / totalWeight * 100).toFixed(2);
                    probText = ` (Probabilidad: ${prob}%)`;
                }
                const li = document.createElement('li');
                const assignedStr = assigned[idx] && assigned[idx].length > 0 ? ` - ${assigned[idx].join(', ')}` : '';
                li.textContent = `${idx + 1}. ${winner.name}${probText}${assignedStr}`;
                winnersList.appendChild(li);
            });
            document.getElementById('probability').textContent = '';
        } else {
            const li = document.createElement('li');
            const assignedStr = assigned[0] && assigned[0].length > 0 ? ` - ${assigned[0].join(', ')}` : '';
            li.textContent = `1. ${winners[0].name}${assignedStr}`;
            winnersList.appendChild(li);
            document.getElementById('probability').textContent = `Probabilidad: ${((winners[0].type === 'probability' ? (winners[0].weight / 100) : winners[0].weight) / totalWeight * 100).toFixed(2)}% (basado en pesos)`;
        }

        document.getElementById('result').style.display = 'block';

        createParticles(30);

        const drawsToday = parseInt(sessionStorage.getItem('drawsToday')) || 0;
        updateAnalytics(drawsToday, winners);
    }, 2000);
}

function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.type === 'probability' ? (item.weight / 100) : item.weight), 0);
    let random = Math.random() * totalWeight;
    for (let item of items) {
        const itemWeight = item.type === 'probability' ? (item.weight / 100) : item.weight;
        if (random < itemWeight) return item;
        random -= itemWeight;
    }
    return items[Math.floor(Math.random() * items.length)]; // Fallback si no encuentra
}

function createParticles(count) {
    const particlesDiv = document.getElementById('particles');
    particlesDiv.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${Math.random() * 400}px`;
        particle.style.top = `${Math.random() * 400}px`;
        particle.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        particlesDiv.appendChild(particle);
    }

    setTimeout(() => particlesDiv.innerHTML = '', 2000);
}

document.getElementById('resetButton').addEventListener('click', () => {
    document.getElementById('result').style.display = 'none';
    document.getElementById('nameInput').focus();
});

// Dark Mode
const toggleButton = document.getElementById('darkModeToggle');
const body = document.body;

if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark');
    toggleButton.textContent = '☀️ Modo Claro';
}

toggleButton.addEventListener('click', () => {
    body.classList.toggle('dark');
    if (body.classList.contains('dark')) {
        localStorage.setItem('darkMode', 'enabled');
        toggleButton.textContent = '☀️ Modo Claro';
    } else {
        localStorage.removeItem('darkMode');
        toggleButton.textContent = '🌙 Modo Oscuro';
    }
});