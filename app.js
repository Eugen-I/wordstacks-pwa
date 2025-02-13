"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Кэширование часто используемых DOM-элементов
  const germanInput = document.getElementById("germanWord");
  const russianInput = document.getElementById("russianWord");
  const addCardBtn = document.getElementById("addCardBtn");
  const wordListContainer = document.getElementById("wordList");

  // Инициализация IndexedDB
  let db;
  const request = indexedDB.open("wordStackDB", 1);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains("cards")) {
      db.createObjectStore("cards", { keyPath: "id", autoIncrement: true });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    renderWordList();
  };

  request.onerror = (event) => {
    console.error("IndexedDB error:", event.target.errorCode);
  };

  addCardBtn.addEventListener("click", addCard);

  // Функция для добавления карточки
  function addCard() {
    const germanWord = germanInput.value.trim();
    const russianWord = russianInput.value.trim();

    if (!germanWord || !russianWord) {
      alert("Please enter both words.");
      return;
    }

    const newCard = { german: germanWord, russian: russianWord };

    const transaction = db.transaction(["cards"], "readwrite");
    const store = transaction.objectStore("cards");
    const addRequest = store.add(newCard);

    addRequest.onsuccess = () => {
      // Очистка полей ввода после успешного добавления
      germanInput.value = "";
      russianInput.value = "";
      renderWordList();
    };

    addRequest.onerror = (event) => {
      console.error("Error adding card:", event.target.error);
    };
  }

  // Функция для рендеринга списка карточек с использованием DocumentFragment
  function renderWordList() {
    const transaction = db.transaction(["cards"], "readonly");
    const store = transaction.objectStore("cards");
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = (event) => {
      const cards = event.target.result;
      wordListContainer.innerHTML = ""; // Очистка контейнера
      const fragment = document.createDocumentFragment();

      cards.forEach((card) => {
        const cardDiv = document.createElement("div");
        cardDiv.className = "card-item";

        const germanEl = document.createElement("div");
        germanEl.className = "word";
        germanEl.textContent = card.german;

        const russianEl = document.createElement("div");
        russianEl.className = "translation";
        russianEl.textContent = card.russian;

        cardDiv.appendChild(germanEl);
        cardDiv.appendChild(russianEl);
        fragment.appendChild(cardDiv);
      });

      wordListContainer.appendChild(fragment);
    };

    getAllRequest.onerror = (event) => {
      console.error("Error retrieving cards:", event.target.error);
    };
  }
});