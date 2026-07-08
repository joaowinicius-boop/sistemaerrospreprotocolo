# Pré-Protocolo — Nicolas Gomes Advogado

Sistema interno de gestão de **erros de pré-protocolo** e **prioridades da equipe**.

## Funcionalidades

- Registro, triagem e resolução de erros de protocolo (tabela + detalhe + relatório)
- Prioridades da equipe com KPIs e dashboard de desempenho
- Notificações em tempo real
- Painel do administrador (usuários, equipe, auditoria)

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui (design system compartilhado com o LEX CALCULATOR)
- Supabase (auth + Postgres) — projeto RA TECHNOLOGY

## Desenvolvimento

```sh
npm install
npm run dev     # http://localhost:8080
npm run build   # build de produção
```

## Deploy

Vercel — push na branch `main` publica automaticamente em `sistemapreprotocolo.vercel.app`.
