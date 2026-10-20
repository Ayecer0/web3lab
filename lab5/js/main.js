'use strict';

const API_BASE_URL = 'http://95.163.242.125';
const GALLERY_API_URL = `${API_BASE_URL}/images`;
const TEMPERATURE_API_URL = `${API_BASE_URL}/temp`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;
const THEME_STORAGE_KEY = 'app_theme';

// DOM-элементы темы
const themeToggleButton = document.getElementById('theme-toggle-btn');

// DOM-элементы галереи
const refreshGalleryButton = document.getElementById('refresh-gallery-btn');
const galleryLoader = document.getElementById('gallery-loader');
const galleryStatus = document.getElementById('gallery-status');
const galleryGrid = document.getElementById('gallery-grid');

// DOM-элементы формы температуры
const temperatureForm = document.getElementById('temperature-form');
const classInput = document.getElementById('class-input');
const tempInput = document.getElementById('temp-input');
const submitTempButton = document.getElementById('submit-temp-btn');

// DOM-элементы тоста
const toastElement = document.getElementById('toast');
const toastMessageElement = document.getElementById('toast-message');
const toastCloseButton = document.getElementById('toast-close-btn');

let toastTimeoutId = null;

/* ==========================================================================
   1. КОМПОНЕНТ ТОСТА (УВЕДОМЛЕНИЙ)
   ========================================================================== */

/**
 * Показывает всплывающее уведомление внизу справа.
 * @param {string} message Текст уведомления.
 * @param {'success' | 'error'} type Тип уведомления.
 */
function showToast(message, type) {
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastMessageElement.textContent = message;
  toastElement.classList.remove('toast-success', 'toast-error');

  if (type === 'error') {
    toastElement.classList.add('toast-error');
  } else {
    toastElement.classList.add('toast-success');
  }

  toastElement.classList.add('is-visible');

  toastTimeoutId = setTimeout(hideToast, 5000);
}

/**
 * Плавно скрывает тост.
 */
function hideToast() {
  toastElement.classList.remove('is-visible');
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
    toastTimeoutId = null;
  }
}

/* ==========================================================================
   2. ПЕРЕКЛЮЧЕНИЕ ТЕМЫ И LOCALSTORAGE
   ========================================================================== */

/**
 * Обновляет надпись на кнопке переключения темы.
 */
function updateThemeButtonLabel() {
  const isDark = document.documentElement.classList.contains('theme-dark');
  themeToggleButton.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
}

/**
 * Применяет класс темы к элементу html.
 * @param {'light' | 'dark'} theme
 */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.remove('theme-light');
    document.documentElement.classList.add('theme-dark');
  } else {
    document.documentElement.classList.remove('theme-dark');
    document.documentElement.classList.add('theme-light');
  }
  updateThemeButtonLabel();
}

/**
 * Обработчик клика по кнопке смены темы.
 */
function handleThemeToggleClick() {
  const isCurrentlyDark = document.documentElement.classList.contains('theme-dark');
  const nextTheme = isCurrentlyDark ? 'light' : 'dark';

  applyTheme(nextTheme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (err) {
    showToast('Не удалось сохранить тему в localStorage.', 'error');
  }
}

/**
 * Синхронизирует тему между открытыми вкладками.
 * @param {StorageEvent} event
 */
function handleStorageChange(event) {
  if (event.key === THEME_STORAGE_KEY && event.newValue) {
    applyTheme(event.newValue === 'dark' ? 'dark' : 'light');
  }
}

/* ==========================================================================
   3. ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ (GET /images С RETRY ДО 3 ПОВТОРОВ)
   ========================================================================== */

/**
 * Создает паузу между повторными запросами.
 * @param {number} ms Интервал в миллисекундах.
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(function executeDelay(resolve) {
    setTimeout(resolve, ms);
  });
}

/**
 * Запрашивает данные с сервера с повторными попытками.
 * @param {string} url
 * @param {number} maxRetries
 * @returns {Promise<Array>}
 */
async function fetchImagesWithRetry(url, maxRetries) {
  let retriesCount = 0;

  while (retriesCount <= maxRetries) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        let errorMessage = `Ошибка сервера (${response.status})`;
        try {
          const errorBody = await response.json();
          if (errorBody && errorBody.message) {
            errorMessage = errorBody.message;
          }
        } catch (parseErr) {
          // Игнорируем ошибку парсинга
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (retriesCount === maxRetries) {
        throw error;
      }
      retriesCount += 1;
      await delay(RETRY_DELAY_MS);
    }
  }

  return [];
}

/**
 * Отрисовывает полученные изображения в сетке галереи.
 * @param {Array<{url: string, alt: string, description: string}>} images
 */
function renderGallery(images) {
  galleryGrid.innerHTML = '';

  for (let i = 0; i < images.length; i += 1) {
    const item = images[i];

    const card = document.createElement('figure');
    card.className = 'gallery-item';

    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'gallery-image-wrapper';

    const img = document.createElement('img');
    img.className = 'gallery-image';
    img.src = item.url || '';
    img.alt = item.alt || item.description || 'Изображение галереи';
    img.loading = 'lazy';

    const caption = document.createElement('figcaption');
    caption.className = 'gallery-caption';
    caption.textContent = item.description || item.alt || 'Без описания';

    imgWrapper.appendChild(img);
    card.appendChild(imgWrapper);
    card.appendChild(caption);
    galleryGrid.appendChild(card);
  }
}

/**
 * Загружает галерею, управляет индикатором загрузки и выводом ошибок.
 */
async function loadGallery() {
  galleryLoader.removeAttribute('hidden');
  galleryStatus.setAttribute('hidden', '');
  galleryGrid.innerHTML = '';
  refreshGalleryButton.disabled = true;

  try {
    const images = await fetchImagesWithRetry(GALLERY_API_URL, MAX_RETRIES);

    if (!Array.isArray(images) || images.length === 0) {
      galleryStatus.textContent = 'Изображения не найдены';
      galleryStatus.removeAttribute('hidden');
    } else {
      renderGallery(images);
    }
  } catch (error) {
    const errorMsg = error instanceof Error && error.message
      ? `Не удалось загрузить изображения: ${error.message}`
      : 'Не удалось загрузить изображения после 3 повторных попыток.';
    galleryStatus.textContent = errorMsg;
    galleryStatus.removeAttribute('hidden');
    showToast(errorMsg, 'error');
  } finally {
    galleryLoader.setAttribute('hidden', '');
    refreshGalleryButton.disabled = false;
  }
}

/**
 * Обработчик нажатия на кнопку «Обновить галерею».
 */
function handleRefreshGalleryClick() {
  loadGallery();
}

/* ==========================================================================
   4. ОТПРАВКА ТЕМПЕРАТУРЫ (POST /temp)
   ========================================================================== */

/**
 * Блокирует или разблокирует элементы формы.
 * @param {boolean} isDisabled
 */
function setTemperatureFormDisabled(isDisabled) {
  classInput.disabled = isDisabled;
  tempInput.disabled = isDisabled;
  submitTempButton.disabled = isDisabled;
}

/**
 * Обработчик отправки формы температуры.
 * @param {SubmitEvent} event
 */
async function handleTemperatureFormSubmit(event) {
  event.preventDefault();

  const classRoomValue = String(classInput.value.trim());
  const temperatureValue = Number(tempInput.value);

  if (!classRoomValue || tempInput.value.trim() === '' || Number.isNaN(temperatureValue)) {
    showToast('Пожалуйста, введите номер аудитории и числовое значение температуры.', 'error');
    return;
  }

  const requestPayload = {
    class: classRoomValue,
    temp: temperatureValue
  };

  setTemperatureFormDisabled(true);

  try {
    const response = await fetch(TEMPERATURE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    let responseData = null;
    try {
      responseData = await response.json();
    } catch (parseErr) {
      responseData = null;
    }

    if (!response.ok || (responseData && responseData.status === 'error')) {
      const serverErrorMessage = (responseData && responseData.message)
        || `Ошибка при отправке данных (${response.status})`;
      throw new Error(serverErrorMessage);
    }

    const serverSuccessMessage = 'Отлично!';
    showToast(serverSuccessMessage, 'success');
    temperatureForm.reset();
  } catch (error) {
    const errorText = error instanceof Error
      ? error.message
      : 'Ошибка соединения с сервером.';
    showToast(errorText, 'error');
  } finally {
    setTemperatureFormDisabled(false);
  }
}

/* ==========================================================================
   5. ПОДПИСКА НА СОБЫТИЯ (БЕЗ АНОНИМНЫХ ФУНКЦИЙ)
   ========================================================================== */

/**
 * Запускает начальную инициализацию при готовности DOM.
 */
function handleDocumentReady() {
  updateThemeButtonLabel();
  loadGallery();
}

themeToggleButton.addEventListener('click', handleThemeToggleClick);
window.addEventListener('storage', handleStorageChange);
refreshGalleryButton.addEventListener('click', handleRefreshGalleryClick);
temperatureForm.addEventListener('submit', handleTemperatureFormSubmit);
toastCloseButton.addEventListener('click', hideToast);
document.addEventListener('DOMContentLoaded', handleDocumentReady);