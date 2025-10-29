# Reservatorios-HAG

Painel simples para monitoramento de reservatórios, pronto para deploy no Render.com.

## Como funciona

- Recebe `POST` em qualquer rota com payload JSON:
  ```json
  { "data": [ { "ref": "...", "value": 123, "dev_id": "..." }, ... ] }
  ```
- Armazena leituras em `data/readings.json` (últimas 24h).
- Painel: `public/dashboard.html` (acessa após login em `/`).
- Login: usuário `hag`, senha `38195156`.

## Deploy no Render

1. Crie um repositório com estes arquivos no GitHub.
2. No Render: `New Web Service` → conecte ao repositório → Start Command: `npm start`.
3. O Render fornece HTTPS; envie os POSTs do gateway para o domínio do serviço.

