# 📱 Minha Agenda — Android com Capacitor

Guia rápido para compilar e executar o app Android usando Capacitor e Android Studio.

## ⚙️ Pré-requisitos

- [Node.js](https://nodejs.org)
- [Android Studio](https://developer.android.com/studio) com **Android SDK Platform-Tools** instalado

## 🚀 Passo a Passo

```bash
# 1. Instalar dependências
npm install

# 2. Adicionar plataforma Android
npx cap add android

# 3. Gerar build web
npm run build

# 4. Sincronizar com Capacitor
npx cap sync

# 5. Executar no dispositivo/emulador
npx cap run android
```

> Se o comando acima falhar, use `npx cap open android` para abrir no Android Studio e clique em ▶ **Run**.

## 🔧 Comandos Úteis

| Comando | Descrição |
|---|---|
| `npx cap open android` | Abre o projeto no Android Studio |
| `npx cap copy` | Atualiza somente os arquivos web |
| `npx cap sync` | Sincroniza plugins e arquivos |
| `npx cap rm android` | Remove a plataforma Android |

## 🛠️ Problemas Comuns

- **SDK não encontrado** — Instale `Android SDK Platform-Tools`, `Build-Tools` e `Command-line Tools` no Android Studio.
- **JAVA_HOME não configurado** — Configure nas variáveis de ambiente do Windows (o Android Studio normalmente instala automaticamente).
- **Dispositivo não aparece** — Ative a **Depuração USB** em `Configurações → Opções do Desenvolvedor`.

## 📁 Estrutura do Projeto

```
meu-app/
├── android/
├── src/
├── dist/
├── capacitor.config.ts
└── package.json
```
