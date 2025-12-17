# Тестирование фонового режима Copyright Notice

## Как проверить фоновую работу расширения

### 1. Установка расширения
```bash
code --install-extension copyright-notice-1.1.1.vsix
```

### 2. Настройка для тестирования
В VS Code settings.json добавьте:
```json
{
  "copyright-notice.silentMode": false,
  "copyright-notice.backgroundUpdateDelay": 1000
}
```
Это включит логи и уменьшит задержку до 1 секунды для удобства тестирования.

### 3. Тестирование

#### Тест 1: Открытие файла
1. Откройте файл `test_background.js`
2. Проверьте консоль разработчика (Help → Toggle Developer Tools → Console)
3. Должны появиться логи:
```
[Copyright] handleDocumentOpen called for test_background.js
[Copyright] Found editor for document: yes
[Copyright] Processing document open for test_background.js
[Copyright] addCopyrightIfNeeded called for test_background.js
```

#### Тест 2: Изменение файла
1. Начните печатать в файле `test_background.js`
2. Подождите 1 секунду после остановки печати
3. Проверьте логи в консоли - должны быть логи о debounce и обработке

#### Тест 3: Смена вкладок
1. Откройте несколько файлов
2. Переключайтесь между ними
3. Проверьте логи `handleEditorChange`

### 4. Ожидаемые логи

При успешной работе вы увидите в консоли:
- `[Copyright] handleDocumentOpen called for <filename>`
- `[Copyright] handleEditorChange called for <filename>`
- `[Copyright] handleTextChange called for <filename>`
- `[Copyright] addCopyrightIfNeeded called for <filename>`
- `[Copyright] Document analysis: {shouldProcess: true, ...}`
- `[Copyright] Executing action: {type: "insert_new", ...}`

### 5. Возврат к тихому режиму

После тестирования верните настройки:
```json
{
  "copyright-notice.silentMode": true,
  "copyright-notice.backgroundUpdateDelay": 1500
}
```

Теперь расширение будет работать незаметно в фоне!
