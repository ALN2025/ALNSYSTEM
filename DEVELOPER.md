# Desenvolvimento local — Meu Controle

Documentação técnica para compilar e rodar no PC. A vitrine pública do projeto está no [README.md](README.md).

## Funcionalidades

- **Dashboard** — visão geral do mês, pendências, atrasos e timeline
- **Credores** — CPF/CNPJ, PIX, banco, categoria, contato
- **Despesas** — vencimentos, parcelas, notificações
- **Fiador** — acordos com amigos, juros por atraso, comprovantes
- **Desktop** — janela própria no Windows (Electron), menu lateral
- **Offline total** — dados no celular ou PC, sem internet

## Atalhos com ícone (Windows)

| Atalho | Função |
|--------|--------|
| **`ALN-SYSTEM-PC.lnk`** | Abrir sistema no PC |
| **`ALN-SYSTEM-APK.lnk`** | Compilar APK para celular |

**Criar/atualizar atalhos:** `CRIAR-ATALHOS-ICONES.bat`

APK gerado em `release/` (não vai para o Git).

## Desktop

```bash
npm install
npm run desktop
```

Instalador: `npm run desktop:build`

## Mobile

```bash
npm start
```

## Tecnologias

React Native · Expo SDK 57 · Electron · TypeScript
