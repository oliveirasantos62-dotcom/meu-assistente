# Meu Assistente — Android / Google Play

Este projeto foi preparado para virar um aplicativo Android usando Capacitor 8, mantendo o mesmo frontend React/Vite.

## 1. Instalação

Requisitos:

- Node.js 22+
- Android Studio 2025.2.1+
- Android SDK 36
- JDK fornecido pelo Android Studio

Na raiz do projeto:

```bash
npm install
npx cap add android
npm run mobile:sync
npx cap open android
```

## 2. Identificador do aplicativo

O identificador provisório é:

```text
com.meuassistente.app
```

Antes da primeira publicação, escolha um package ID definitivo e exclusivo. Depois de publicar o app, não troque o package ID.

## 3. API do backend

O aplicativo mobile precisa apontar para o backend online. Antes de executar o build de produção, crie `.env.production` com:

```env
VITE_API_URL=https://SEU-BACKEND.onrender.com
```

Não coloque senha do TiDB, JWT_SECRET ou outras credenciais privadas no frontend.

## 4. Build para Google Play

Depois de gerar a pasta `android/`:

```bash
npm run mobile:sync
npx cap open android
```

No Android Studio, gere uma versão **Signed Android App Bundle (.aab)** para produção.

O projeto usa Capacitor 8, alinhado ao Android 16 / API 36.

## 5. Idiomas

Em **Meu Perfil → Idioma do aplicativo**, o usuário pode escolher:

- 🇧🇷 Português (Brasil)
- 🇺🇸 English (United States)
- 🇪🇸 Español

A preferência é salva no dispositivo e a navegação principal + Perfil já acompanham o idioma selecionado. A estrutura de tradução fica centralizada em `src/context/LanguageContext.jsx` para ampliar a tradução das demais telas sem duplicar lógica.

## 6. Ícone

Os recursos iniciais estão em:

```text
resources/icon.png
resources/splash.png
public/favicon-tech.svg
```

Use o ícone definitivo da marca antes da publicação caso queira substituir o provisório.
