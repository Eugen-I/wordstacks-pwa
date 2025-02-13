const dbPromise = idb.openDB('wordStackDB', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('cards')) {
      db.createObjectStore('cards', { keyPath: 'id', autoIncrement: true });
    }
  }
});

// Добавление карточки
async function addCard() {
  const germanWord = document.getElementById('germanWord').value.trim();
  const russianWord = document.getElementById('russianWord').value.trim();

  if (!germanWord || !russianWord) {
    alert('Введите оба слова.');
    return;
  }

  const newCard = { german: germanWord, russian: russianWord };
  await saveCard(newCard);

  document.getElementById('germanWord').value = '';
  document.getElementById('russianWord').value = '';

  renderWordList();
}

// Сохранение карточки в IndexedDB
async function saveCard(card) {
  const db = await dbPromise;
  await db.put('cards', card);
  console.log("Сохранено:", card);
}

// Получение всех карточек
async function getCards() {
  const db = await dbPromise;
  return await db.getAll('cards');
}

// Отображение карточек
async function renderWordList() {
  const wordListElement = document.getElementById('wordList');
  const cards = await getCards();
  wordListElement.innerHTML = '';

  if (cards.length === 0) {
    wordListElement.innerHTML = '<p>Список пуст.</p>';
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
  console.log("Карточки отображены:", cards);
}

// Импорт JSON-файла
async function importFromFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert('Файл не выбран.');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(event) {
    try {
      const words = JSON.parse(event.target.result);
      if (!Array.isArray(words)) throw new Error('Неверный формат JSON.');

      let importedCount = 0;
      for (const word of words) {
        if (word.german && word.russian) {
          await saveCard(word);
          importedCount++;
        }
      }

      alert(`Импортировано ${importedCount} слов.`);
      renderWordList();
    } catch (err) {
      alert('Ошибка при разборе JSON.');
      console.error('Ошибка JSON:', err);
    }
  };
  
  reader.readAsText(file);
}

// Распознавание текста с изображения
async function scanTextFromFile() {
  const fileInput = document.getElementById('photoInput');
  const file = fileInput.files[0];

  if (!file) {
    alert('Файл не выбран.');
    return;
  }

  const reader = new FileReader();
  reader.onload = async event => {
    const img = document.createElement('img');
    img.src = event.target.result;

    try {
      const result = await Tesseract.recognize(img, 'deu+rus', { logger: m => console.log(m) });
      console.log("Распознанный текст:", result.data.text);
      
      const lines = result.data.text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        alert('Текст не распознан. Попробуйте снова.');
        return;
      }

      for (let i = 0; i < lines.length - 1; i += 2) {
        await saveCard({ german: lines[i].trim(), russian: lines[i + 1].trim() });
      }

      renderWordList();
    } catch (error) {
      alert('Ошибка при распознавании текста.');
      console.error('Ошибка OCR:', error);
    }
  };

  reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', renderWordList);