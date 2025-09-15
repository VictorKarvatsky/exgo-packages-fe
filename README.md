# Инструкция: Подключение Telegram Auth библиотеки в новые проекты

## 1. Добавление Git Submodule
1.1 В новом проекте добавляем submodule

```bash
##Переходим в корень нового проекта
cd path/to/your-new-project
```

### Добавляем submodule с библиотеками
```bash
git submodule add -f -b main https://github.com/VictorKarvatsky/exgo-packages-fe.git libs/shared
```

### Инициализируем submodule
git submodule update --init --recursive

### Коммитим изменения
git add .gitmodules libs/shared

git commit -m "Add shared libraries as submodule"

git push

1.2 Проверяем что файлы скопировались
```bash
##Должны увидеть структуру библиотеки
ls -la libs/shared/packages/telegram-auth/src/
```

### Ожидаемые папки: api, components, hooks, storage, telegram, types

## 2. Настройка Vite конфигурации

2.1 Обновляем vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ Добавляем алиас для библиотеки авторизации
      '@exgo/telegram-auth': path.resolve(__dirname, './libs/shared/packages/telegram-auth/src'),
    },
  },
});
```
## 3. Настройка TypeScript

3.1 Обновляем tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      // ✅ Добавляем пути для TypeScript
      "@exgo/telegram-auth": ["./libs/shared/packages/telegram-auth/src/index.ts"],
      "@exgo/telegram-auth/*": ["./libs/shared/packages/telegram-auth/src/*"]
    }
  }
}
```

## 4. Установка зависимостей

4.1 Добавляем peer dependencies в package.json

```json
{
  "dependencies": {
    "@telegram-auth/react": "^1.0.0",
    "@chakra-ui/react": "^3.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```
```
bash
## Устанавливаем зависимости
npm install
```

## 5. Настройка авторизации в приложении

5.1 Оборачиваем приложение в AuthProvider

```typescript
// src/main.tsx или src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from '@exgo/telegram-auth';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

5.2 Создаем страницу логина

```typescript
// src/pages/Login.tsx
import React from 'react';
import { LoginScreen } from '@exgo/telegram-auth';

export const Login = () => {
  return <LoginScreen />;
};
```
5.3 Защищаем приватные страницы

```typescript
// src/pages/Dashboard.tsx
import React from 'react';
import { withAuthGuard } from '@exgo/telegram-auth';

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard - только для авторизованных</h1>
    </div>
  );
};

export default withAuthGuard(Dashboard);
```

5.4 Добавляем кнопку логаута в Header

```typescript
// src/components/Header.tsx
import React from 'react';
import { LogoutButton } from '@exgo/telegram-auth';

export const Header = () => {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
      <h1>My App</h1>
      <LogoutButton />
    </header>
  );
};
```
5.5 Используем хук авторизации

```typescript
// src/components/UserProfile.tsx
import React from 'react';
import { useAuth } from '@exgo/telegram-auth';

export const UserProfile = () => {
  const { state, hasRole, hasPermission } = useAuth();

  if (!state.isAuthenticated) {
    return <div>Не авторизован</div>;
  }

  return (
    <div>
      <h2>Профиль: {state.user?.firstName}</h2>
      <p>Username: @{state.user?.username}</p>
      
      {hasRole('admin') && (
        <p>Роль: Администратор</p>
      )}
      
      {hasPermission('users.edit') && (
        <button>Редактировать пользователей</button>
      )}
    </div>
  );
};
```
## 6. Настройка бэкенда
6.1 Конфигурация API endpoints
Библиотека ожидает следующие endpoints на бэкенде:
```
POST /api/v1/auth/telegram/login     ##Telegram Widget авторизация
POST /api/v1/auth/telegram/twa       ##Telegram Web App авторизация  
POST /api/v1/auth/telegram/deeplink  ##Deep Link авторизация
POST /api/v1/auth/refresh            ##Обновление токенов
POST /api/v1/auth/logout             ##Логаут
```
6.2 Настройка переменных окружения
```
## .env
VITE_API_BASE_URL=https://your-backend.com/api/v1
VITE_TELEGRAM_BOT_USERNAME=your_bot_name
```
## 7. Команды для разработчиков

7.1 Клонирование проекта новыми разработчиками

```bash
##Клонируем со всеми submodules
git clone --recursive https://github.com/your-org/your-new-project.git

## Или если уже склонирован без --recursive
git submodule init
git submodule update
```

7.2 Обновление библиотеки авторизации
```bash
## Обновляем библиотеку до последней версии
cd libs/shared
git pull origin main
cd ../..

## Фиксируем обновление в основном проекте
git add libs/shared
git commit -m "Update telegram-auth library"
git push
```
7.3 Разработка фич в библиотеке

```bash
## Переходим в submodule
cd libs/shared

## Создаем feature ветку
git checkout -b feature/new-auth-feature

## Разрабатываем и коммитим
git add .
git commit -m "Add new auth feature"
git push origin feature/new-auth-feature
```

## Создаем PR в основном репозитории библиотеки
## 8. Полезные импорты
```typescript
// Все доступные импорты из библиотеки
import { 
  // Компоненты
  AuthProvider,
  LoginScreen, 
  LogoutButton,
  withAuthGuard,
  
  // Хуки
  useAuth,
  
  // API
  authApi,
  
  // Утилиты
  tokenStorage,
  twaClient,
  
  // UI
  toaster
} from '@exgo/telegram-auth';

// Типы
import type { 
  User, 
  AuthState, 
  TelegramLoginWidgetData 
} from '@exgo/telegram-auth';
```
## 9. Типичные проблемы и решения

9.1 Ошибка "Failed to resolve import"

Проблема: Vite не может найти @exgo/telegram-auth

Решение: Проверьте vite.config.ts - должен быть добавлен alias

9.2 Submodule пустой

Проблема: Папка libs/shared пустая

Решение:

```bash
git submodule update --init --recursive
```
9.3 TypeScript ошибки

Проблема: TS не видит типы библиотеки

Решение: Проверьте tsconfig.json - должны быть добавлены paths
