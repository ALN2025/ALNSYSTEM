# A.L.N SYSTEM — Meu Controle

Sistema pessoal de controle financeiro **desktop e mobile**, 100% offline. Substitui planilhas que desativam ou perdem dados.

## Funcionalidades

- **Dashboard** — visão geral do mês, pendências, atrasos e timeline
- **Credores** — CPF/CNPJ, PIX, banco, categoria, contato
- **Despesas** — vencimentos, parcelas, notificações
- **Fiador** — acordos com amigos, juros por atraso, comprovantes
- **Banner A.L.N SYSTEM** — tela de arranque estilo terminal
- **Desktop** — janela própria no Windows (Electron), menu lateral
- **Offline total** — dados no celular ou PC, sem internet

---

## Atalhos com icone (use estes)

No Windows, `.bat` **nao tem icone personalizado** (fica o quadrado do CMD).  
Use os atalhos **`.lnk`** com icone A.L.N SYSTEM:

| Atalho | Funcao |
|--------|--------|
| **`ALN-SYSTEM-PC.lnk`** | Abrir sistema no PC (sem CMD) |
| **`ALN-SYSTEM-APK.lnk`** | Compilar APK para celular |

**Criar/atualizar atalhos:** duplo clique em **`CRIAR-ATALHOS-ICONES.bat`** (copia tambem para a Area de Trabalho).

Logs em `logs/` (desktop.log, apk-build.log).

### APK no celular

1. Duplo clique em **`ALN-SYSTEM-APK.lnk`**
2. Com **Android Studio/SDK** instalado: APK em `release/ALN-SYSTEM.apk`
3. Sem SDK: build na nuvem (Expo EAS) — link no log; na 1a vez: `npx eas login`

Copie o `.apk` para o celular e instale (permitir fontes desconhecidas).

---

## Desktop (Windows) — recomendado

Substitui sua planilha por um sistema que **não desativa**:

```bash
# 1. Instalar dependências
npm install

# 2. Rodar como app desktop (janela A.L.N SYSTEM)
npm run desktop
```

Isso abre o Expo Web + Electron em janela dedicada com menu lateral.

### Gerar instalador .exe

```bash
npm run desktop:build
```

O instalador fica em `release/`.

### Só no navegador (sem Electron)

```bash
npm run web
```

Acesse `http://localhost:8081` — dados ficam no `localStorage` do navegador.

---

## Mobile (celular)

```bash
npm start
```

Escaneie o QR Code com **Expo Go** (Android/iOS).

---

## Banner de arranque

Ao abrir, aparece o banner **A.L.N SYSTEM** (estilo SisteMec/terminal).

Referência Java para migração futura: `reference/Team.java`

```bash
# Compilar e rodar banner Java (opcional)
javac reference/Team.java && java -cp reference Team
```

---

## Estrutura

```
app/                  # Telas (Expo Router)
  (tabs)/             # Abas — sidebar no desktop (_layout.web.tsx)
  creditor/           # Credores
  expense/            # Despesas
  guarantor/          # Fiador
desktop/              # Electron (Windows)
reference/            # Team.java — banner Java
src/
  components/         # StartupBanner, UI
  constants/branding.ts
  services/           # Storage offline + export
```

---

## Por que não planilha?

| Planilha | A.L.N SYSTEM |
|----------|--------------|
| Pode desativar/expirar | Seu PC/celular, sem assinatura |
| Sem notificações | Alertas de vencimento |
| Sem fiador/juros | Módulo fiador com % automático |
| Difícil no celular | App mobile + desktop |

---

## Tecnologias

- React Native + Expo SDK 57
- Electron (desktop Windows)
- AsyncStorage / localStorage (offline)
- TypeScript
