# 📱 APP MINHA AGENDA (ANDROID)

Guia completo para compilar, gerar e compartilhar o aplicativo Android utilizando Capacitor e Android Studio.

---

# 🚀 Executando o Projeto Android com Capacitor

Este tutorial mostra como:

* Instalar dependências
* Gerar a build web
* Criar o projeto Android
* Gerar APK de instalação
* Compartilhar o aplicativo

---

# ⚠️ Pré-requisitos

Antes de começar, instale:

* Node.js
* Android Studio

## Android Studio

Durante a instalação do Android Studio, certifique-se de instalar:

* Android SDK
* Android SDK Platform-Tools
* Android SDK Build-Tools
* Android Emulator

---

# 📂 Abrindo o Projeto

Abra o terminal na pasta do projeto.

Você pode usar:

* PowerShell
* CMD
* Terminal do VS Code

---

# 📦 1. Instalar Dependências

```powershell
npm install
```

Se ocorrer conflito de dependências:

```powershell
npm install --legacy-peer-deps
```

---

# ⚠️ Avisos do NPM

## ERESOLVE overriding peer dependency

Esse aviso normalmente NÃO impede o funcionamento do projeto.

Exemplo:

```text
npm warn ERESOLVE overriding peer dependency
```

Pode ser ignorado se o projeto compilou normalmente.

---

## Vulnerabilities

Se aparecer:

```text
18 vulnerabilities
```

Você pode tentar:

```powershell
npm audit fix
```

Evite usar:

```powershell
npm audit fix --force
```

pois pode quebrar dependências.

---

# ⚙️ 2. Corrigir o App ID do Capacitor

Abra:

```text
capacitor.config.ts
```

ou:

```text
capacitor.config.json
```

Troque:

```ts
appId: 'app.lovable.16296ea0dc1d4a41bd0d2a4219c9c30f'
```

Por um App ID válido:

```ts
appId: 'com.minhaagenda.app'
```

---

# ✅ Exemplo Completo do capacitor.config.ts

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.minhaagenda.app',
  appName: 'Minha Agenda',
  webDir: 'dist'
};

export default config;
```

---

# 🏗️ 3. Gerar Build Web

```powershell
npm run build
```

Se aparecer:

```text
✓ built in Xs
```

A build foi gerada corretamente.

---

# 🤖 4. Adicionar Android

```powershell
npx cap add android
```

---

# 🔄 5. Sincronizar Projeto

```powershell
npx cap sync android
```

---

# ▶️ 6. Abrir no Android Studio

```powershell
npx cap open android
```

---

# 📱 7. Gerar APK Release (PROFISSIONAL)

No Android Studio:

```text
Build → Generate Signed App Bundle or APK
```

---

## Escolha

```text
APK
```

Clique:

```text
Next
```

---

# 🔐 8. Criar o Arquivo .JKS

O arquivo `.jks` é a assinatura oficial do aplicativo Android.

⚠️ MUITO IMPORTANTE:

Sem esse arquivo você NÃO conseguirá atualizar o aplicativo futuramente.

Guarde ele em local seguro.

---

## Onde o .jks fica?

O `.jks` fica exatamente no caminho escolhido durante a criação.

Exemplo:

```text
C:\Users\Patricia\Desktop\minhaagenda.jks
```

ou:

```text
C:\Users\Patricia\Documents\minhaagenda.jks
```

---

# ✅ Configuração Recomendada do JKS

## Key store path

```text
C:\Users\SEU_USUARIO\Desktop\minhaagenda.jks
```

---

## Password

```text
minhaagenda123
```

---

## Alias

```text
minhaagenda
```

---

## Key Password

```text
minhaagenda123
```

---

## Validity

```text
1000
```

---

## Certificate

### First and Last Name

```text
Patricia Souza
```

### Organization

```text
Minha Agenda
```

### City or Locality

```text
Palhoça
```

### State or Province

```text
SC
```

### Country Code

```text
BR
```

---

# ⚠️ Erro: Failed to create keystore

Se aparecer:

```text
Failed to create keystore
```

Normalmente significa:

* Pasta escolhida não existe
* Senha muito curta
* Campo obrigatório vazio

Use uma pasta existente, por exemplo:

```text
C:\Users\SEU_USUARIO\Desktop\minhaagenda.jks
```

---

# 📦 9. Gerar APK Release

Depois de configurar o JKS:

Escolha:

```text
release
```

Marque:

```text
✔ V1 Signature
✔ V2 Signature
```

Clique:

```text
Create
```

---

# ✅ Onde fica o APK?

O APK final normalmente fica em:

```text
android/app/build/outputs/apk/release/
```

Arquivo:

```text
app-release.apk
```

---

# ❌ NÃO Compartilhe o app-debug.apk

O `app-debug.apk` é apenas para testes.

Problemas do debug:

* Mais lento
* Maior
* Modo desenvolvedor ativado
* Não recomendado para distribuição

---

# ✅ Compartilhe SOMENTE

```text
app-release.apk
```

Você pode renomear:

```text
MinhaAgenda.apk
```

---

# 📤 Como Compartilhar o APK

Você pode enviar por:

* WhatsApp
* Google Drive
* Telegram
* Email

---

# 📲 Como Instalar no Celular

1. Baixe o APK
2. Abra o arquivo
3. Permita:

```text
Instalar apps de fontes desconhecidas
```

1. Conclua a instalação

---

# 🎨 Gerar Ícones Automaticamente

Instale:

```powershell
npm install -D @capacitor/assets
```

Coloque sua imagem em:

```text
resources/icon.png
```

Depois execute:

```powershell
npx capacitor-assets generate --android
```

Isso gera automaticamente todos os tamanhos de ícone do aplicativo.

---

# 🍎 iPhone (iOS)

Para iPhone é necessário:

* Mac
* Xcode
* Conta Apple Developer

O iOS exige publicação via:

* App Store
* TestFlight

---

# 🔧 Comandos Úteis

## Abrir Android Studio

```powershell
npx cap open android
```

---

## Atualizar apenas os arquivos web

```powershell
npx cap copy
```

---

## Atualizar plugins e sincronizar tudo

```powershell
npx cap sync
```

---

## Remover Android

```powershell
npx cap rm android
```

---

## Adicionar Android novamente

```powershell
npx cap add android
```

---

# ✅ Projeto Finalizado

Após esses passos, seu aplicativo Android estará pronto para:

* Instalar em celulares
* Compartilhar APK
* Publicar futuramente na Play Store
