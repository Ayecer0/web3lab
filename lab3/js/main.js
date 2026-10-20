'use strict';

const dialogElement = document.getElementById('register-dialog');
const openDialogButton = document.getElementById('open-register-btn');
const closeDialogButton = document.getElementById('close-dialog-btn');
const cancelDialogButton = document.getElementById('cancel-dialog-btn');
const togglePasswordButton = document.getElementById('toggle-password-btn');
const registrationForm = document.getElementById('registration-form');

const nameInput = document.getElementById('field-name');
const emailInput = document.getElementById('field-email');
const phoneInput = document.getElementById('field-phone');
const ageInput = document.getElementById('field-age');
const githubUrlInput = document.getElementById('field-github-url');
const githubDateInput = document.getElementById('field-github-date');
const passwordInput = document.getElementById('field-password');

const resultContainer = document.getElementById('result-container');
const userCardElement = document.getElementById('user-card');

/**
 * Валидирует имя: обязательно, длина > 1, без цифр.
 * @returns {string} Сообщение об ошибке либо пустая строка.
 */
function validateNameField() {
  const value = nameInput.value.trim();
  if (!value) {
    return 'Поле «Имя» обязательно для заполнения.';
  }
  if (value.length < 2) {
    return 'Имя должно содержать более одного символа.';
  }
  if (/\d/.test(value)) {
    return 'Имя не должно содержать цифр.';
  }
  return '';
}

/**
 * Валидирует электронную почту: обязательна и соответствует формату.
 * @returns {string} Сообщение об ошибке либо пустая строка.
 */
function validateEmailField() {
  const value = emailInput.value.trim();
  if (!value) {
    return 'Поле «Электронная почта» обязательно для заполнения.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Введите корректный адрес электронной почты (например, user@example.com).';
  }
  return '';
}

/**
 * Валидирует телефон: если указан, должен содержать правильное количество цифр (10-11).
 * @returns {string} Сообщение об ошибке либо пустая строка.
 */
function validatePhoneField() {
  const value = phoneInput.value.trim();
  if (!value) {
    return '';
  }
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    return 'Номер телефона должен содержать 10 или 11 цифр.';
  }
  return '';
}

/**
 * Валидирует возраст: целое число от 1 до 99.
 * @returns {string} Сообщение об ошибке либо пустая строка.
 */
function validateAgeField() {
  const value = ageInput.value.trim();
  if (!value) {
    return '';
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) {
    return 'Возраст должен быть целым числом в диапазоне от 1 до 99 лет.';
  }
  return '';
}

/**
 * Валидирует URL профиля GitHub.
 * @returns {string} Сообщение об ошибке либо пустая строка.
 */
function validateGithubUrlField() {
  const urlValue = githubUrlInput.value.trim();
  const dateValue = githubDateInput.value.trim();

  if (dateValue && !urlValue) {
    return 'Ссылка на профиль GitHub не может быть пустой, если указана дата регистрации.';
  }
  if (!urlValue) {
    return '';
  }

  try {
    const parsedUrl = new URL(urlValue);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return 'Ссылка должна начинаться с http:// или https://';
    }
  } catch (e) {
    return 'Введите корректный веб-адрес профиля (URL).';
  }

  return '';
}

/**
 * Валидирует дату регистрации на GitHub: не в будущем и парная к URL.
 * @returns {string} Сообщение об ошибке либо пустая строка.
 */
function validateGithubDateField() {
  const dateValue = githubDateInput.value.trim();
  const urlValue = githubUrlInput.value.trim();

  if (urlValue && !dateValue) {
    return 'Укажите дату регистрации на GitHub, так как введена ссылка на профиль.';
  }
  if (!dateValue) {
    return '';
  }

  const selectedDate = new Date(dateValue);
  const now = new Date();
  if (selectedDate > now) {
    return 'Дата регистрации не может быть в будущем.';
  }
  return '';
}

/**
 * Валидирует пароль: не короче 6 символов.
 * @returns {string} Сообщение об ошибке либо пустая строка.
 */
function validatePasswordField() {
  const value = passwordInput.value;
  if (!value) {
    return 'Поле «Пароль» обязательно для заполнения.';
  }
  if (value.length < 6) {
    return 'Пароль не может быть короче 6 символов.';
  }
  return '';
}

/**
 * Отображает или скрывает ошибку для конкретного input.
 * @param {HTMLInputElement} input
 * @param {string} errorMessage
 */
function setFieldValidationState(input, errorMessage) {
  const errorElement = document.getElementById(`${input.id}-error`);
  const formGroup = input.closest('.form-group');

  if (errorMessage) {
    input.setAttribute('aria-invalid', 'true');
    input.setCustomValidity(errorMessage);
    if (errorElement) {
      errorElement.textContent = errorMessage;
      errorElement.removeAttribute('hidden');
    }
    if (formGroup) {
      formGroup.classList.add('has-error');
    }
  } else {
    input.removeAttribute('aria-invalid');
    input.setCustomValidity('');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.setAttribute('hidden', '');
    }
    if (formGroup) {
      formGroup.classList.remove('has-error');
    }
  }
}

/**
 * Маршрутизатор проверок для отдельного поля.
 * @param {HTMLInputElement} input
 * @returns {string} Сообщение об ошибке.
 */
function checkField(input) {
  let error = '';
  switch (input.id) {
    case 'field-name':
      error = validateNameField();
      break;
    case 'field-email':
      error = validateEmailField();
      break;
    case 'field-phone':
      error = validatePhoneField();
      break;
    case 'field-age':
      error = validateAgeField();
      break;
    case 'field-github-url':
      error = validateGithubUrlField();
      break;
    case 'field-github-date':
      error = validateGithubDateField();
      break;
    case 'field-password':
      error = validatePasswordField();
      break;
    default:
      break;
  }
  setFieldValidationState(input, error);
  return error;
}

/**
 * Обработчик потери фокуса (blur).
 * @param {FocusEvent} event
 */
function handleInputBlur(event) {
  const target = event.target;
  if (target && target.matches('input')) {
    checkField(target);

    // Взаимозависимая перепроверка профиля GitHub и даты
    if (target.id === 'field-github-url') {
      checkField(githubDateInput);
    } else if (target.id === 'field-github-date') {
      checkField(githubUrlInput);
    }
  }
}

/**
 * Очищает ошибку по мере ввода пользователем, если поле стало валидным.
 * @param {Event} event
 */
function handleInputLive(event) {
  const target = event.target;
  if (target && target.getAttribute('aria-invalid') === 'true') {
    checkField(target);
  }
}

/**
 * Открывает модальное окно.
 */
function handleOpenModalClick() {
  dialogElement.showModal();
  nameInput.focus();
}

/**
 * Закрывает модальное окно.
 */
function handleCloseModalClick() {
  dialogElement.close();
}

/**
 * Закрывает модальное окно при клике на backdrop (вне диалога).
 * @param {MouseEvent} event
 */
function handleDialogBackdropClick(event) {
  if (event.target === dialogElement) {
    dialogElement.close();
  }
}

/**
 * Показывает пароль (тип text).
 */
function handleShowPassword() {
  passwordInput.type = 'text';
}

/**
 * Скрывает пароль (тип password).
 */
function handleHidePassword() {
  passwordInput.type = 'password';
}

/**
 * Форматирует телефон в вид +7 (111) 111-1111.
 * @param {string} rawPhone
 * @returns {string}
 */
function formatPhoneNumber(rawPhone) {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) {
    return 'Не указан';
  }
  // Берем последние 10 цифр как основу
  const normalized = digits.length === 11 ? digits.slice(1) : digits;
  if (normalized.length === 10) {
    const p1 = normalized.slice(0, 3);
    const p2 = normalized.slice(3, 6);
    const p3 = normalized.slice(6, 10);
    return `+7 (${p1}) ${p2}-${p3}`;
  }
  return rawPhone;
}

/**
 * Обрабатывает отправку формы.
 * @param {SubmitEvent} event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const fields = [
    nameInput,
    emailInput,
    phoneInput,
    ageInput,
    githubUrlInput,
    githubDateInput,
    passwordInput
  ];

  let firstInvalidField = null;

  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    const errorMessage = checkField(field);
    if (errorMessage && !firstInvalidField) {
      firstInvalidField = field;
    }
  }

  if (firstInvalidField) {
    firstInvalidField.focus();
    return;
  }

  const formData = new FormData(registrationForm);
  const name = formData.get('name') || '';
  const email = formData.get('email') || '';
  const rawPhone = String(formData.get('phone') || '');
  const age = formData.get('age') || 'Не указан';
  const githubUrl = formData.get('githubUrl') || 'Не указан';
  const githubDate = formData.get('githubDate') || 'Не указана';

  const formattedPhone = formatPhoneNumber(rawPhone);

  userCardElement.innerHTML = `
    <dl>
      <dt>Имя:</dt>
      <dd>${escapeHtml(String(name))}</dd>

      <dt>Почта:</dt>
      <dd>${escapeHtml(String(email))}</dd>

      <dt>Телефон:</dt>
      <dd>${escapeHtml(formattedPhone)}</dd>

      <dt>Возраст:</dt>
      <dd>${escapeHtml(String(age))}</dd>

      <dt>GitHub URL:</dt>
      <dd>${githubUrl !== 'Не указан' ? `<a href="${escapeHtml(String(githubUrl))}" target="_blank" rel="noopener noreferrer">${escapeHtml(String(githubUrl))}</a>` : 'Не указан'}</dd>

      <dt>Дата в GitHub:</dt>
      <dd>${escapeHtml(String(githubDate))}</dd>
    </dl>
  `;

  resultContainer.removeAttribute('hidden');
  registrationForm.reset();
  dialogElement.close();
}

/**
 * Экранирует HTML-сущности для безопасного вывода.
 * @param {string} string
 * @returns {string}
 */
function escapeHtml(string) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(string).replace(/[&<>"']/g, (match) => entityMap[match]);
}

// Привязка обработчиков событий (строго без анонимных функций)
openDialogButton.addEventListener('click', handleOpenModalClick);
closeDialogButton.addEventListener('click', handleCloseModalClick);
cancelDialogButton.addEventListener('click', handleCloseModalClick);
dialogElement.addEventListener('click', handleDialogBackdropClick);

togglePasswordButton.addEventListener('pointerdown', handleShowPassword);
togglePasswordButton.addEventListener('pointerup', handleHidePassword);
togglePasswordButton.addEventListener('pointerleave', handleHidePassword);
togglePasswordButton.addEventListener('pointercancel', handleHidePassword);

registrationForm.addEventListener('blur', handleInputBlur, true);
registrationForm.addEventListener('input', handleInputLive, true);
registrationForm.addEventListener('submit', handleFormSubmit);