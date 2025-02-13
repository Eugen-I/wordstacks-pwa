const dbPromise = idb.openDB('wordStackDB', 1, {
  upgrade(db) {
    db.createObjectStore('cards', { keyPath: 'id', autoIncrement: true });
  }
});

async function addCard() {
  const germanWord = document.getElementById('germanWord').value.trim();
  const russianWord = document.getElementById('russianWord').value.trim();

  if (!germanWord || !russianWord) {
    alert('Enter both German and Russian words.');
    return;
  }

  const newCard = { german: germanWord, russian: russianWord };
  await saveCard(newCard);

  document.getElementById('germanWord').value = '';
  document.getElementById('russianWord').value = '';

  renderWordList();
}

async function saveCard(card) {
  const db = await dbPromise;
  await db.put('cards', card);
}

async function getCards() {
  const db = await dbPromise;
  return await db.getAll('cards');
}

async function renderWordList() {
  const wordListElement = document.getElementById('wordList');
  const cards = await getCards();
  wordListElement.innerHTML = '';

  if (cards.length === 0) {
    wordListElement.innerHTML = '<p>No cards available.</p>';
    return;
  }

  cards.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerHTML = `
      <div class="front">${card.german}</div>
      <div class="back">${card.russian}</div>
    `;

    cardDiv.addEventListener('click', () => {
      cardDiv.classList.toggle('flip');
    });

    wordListElement.appendChild(cardDiv);
  });
}

async function scanTextFromFile() {
  const fileInput = document.getElementById('photoInput');
  const file = fileInput.files[0];

  if (!file) {
    alert('No file selected.');
    return;
  }

  const reader = new FileReader();
  reader.onload = async event => {
    const img = document.createElement('img');
    img.src = event.target.result;

    const { data: { text } } = await Tesseract.recognize(
      img,
      'deu+rus',
      { logger: m => console.log(m) }
    );

    const lines = text.split('\n').filter(line => line.trim() !== '');
    for (let i = 0; i < lines.length - 1; i += 2) {
      await saveCard({ german: lines[i].trim(), russian: lines[i + 1].trim() });
    }

    renderWordList();
  };

  reader.readAsDataURL(file);
}

async function importFromFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert('No file selected.');
    return;
  }

  const contents = await file.text();
  try {
    const words = JSON.parse(contents);
    if (!Array.isArray(words)) throw new Error('Invalid JSON format.');

    for (const word of words) {
      if (!word.german || !word.russian) continue;
      await saveCard(word);
    }

    renderWordList();
  } catch (err) {
    alert('Error parsing JSON file.');
  }
}

document.addEventListener('DOMContentLoaded', renderWordList);