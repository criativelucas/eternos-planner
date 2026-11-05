# Casamento Planejado

Build a complete wedding planning web application called "Eternos" — a premium, AI-powered platform for couples organizing their wedding. The entire app must be in Brazilian Portuguese.

---

## 🎨 DESIGN IDENTITY

**Aesthetic**: Romantic luxury editorial — think high-end wedding magazine meets modern SaaS dashboard.

**Color Palette**:

- Background: #0D0A0B (near black with warm undertone)

- Primary surface: #1A1318

- Card surface: #221A1F

- Rose gold accent: #C9956A

- Blush highlight: #E8C4B8

- Muted text: #8A7A80

- White text: #F5EDE8

**Typography**:

- Headings: "Cormorant Garamond" (Google Fonts) — elegant, serif, romantic

- Body: "DM Sans" — clean, readable

- Accent numbers/stats: "Playfair Display" — luxe numerals

**Vibe**: Dark romantic, editorial, luxury. Think Vogue meets Notion.

---

## 🏗️ APP STRUCTURE

### Pages / Sections:

1. **Dashboard** — overview, progress ring, upcoming deadlines, spending summary

2. **Itens do Casamento** — full item list with filters

3. **Finanças** — spending breakdown, installments tracker, budget vs real

4. **Linha do Tempo** — timeline with deadlines

5. **Conquistas** — gamified achievement badges

6. **IA Assistant** — natural language input to add/update items

---

## 🤖 CORE FEATURE: AI INPUT ASSISTANT

**This is the killer feature.** At the top of every page, show a floating command bar (like a CMD+K palette) with the label:

> "Conte o que está planejando... ex: 'Paguei R$800 do buffet, faltam 3x de R$600'"

When the user types a natural language message and submits, the app calls the **Anthropic Claude API** (`claude-sonnet-4-20250514`) to interpret the input and return a structured JSON object. The system prompt for the API should be:

---

SYSTEM PROMPT FOR INTERNAL API CALL:

"Você é um assistente de planejamento de casamento. O usuário vai te dizer algo sobre os preparativos do casamento em linguagem natural. Extraia as informações e retorne APENAS um JSON válido, sem texto extra, no seguinte formato:

{

  "action": "add" | "update" | "delete",

  "item": {

    "nome": string,

    "categoria": "Venue" | "Buffet" | "Decoração" | "Foto/Vídeo" | "Vestuário" | "Música" | "Convites" | "Lua de Mel" | "Beleza" | "Alianças" | "Bolo" | "Flores" | "Transporte" | "Outros",

    "valorTotal": number (em reais),

    "valorPago": number (em reais),

    "parcelas": [{ "numero": number, "valor": number, "dataVencimento": string (YYYY-MM-DD), "pago": boolean }],

    "prazo": string (YYYY-MM-DD) | null,

    "status": "pendente" | "em_andamento" | "concluido" | "cancelado",

    "fornecedor": string | null,

    "notas": string | null,

    "prioridade": "alta" | "media" | "baixa"

  }

}

Se algum campo não for mencionado, use null ou valores padrão razoáveis. Para parcelas, calcule as datas estimadas se não forem mencionadas. Sempre responda APENAS com JSON válido."

---

After receiving the JSON, the app should:

1. Show a **preview card** with the interpreted data

2. Ask "Está correto? Adicionar ao planejamento?" with [Confirmar] [Editar] buttons

3. On confirm, add the item to the local state/database

---

## 📊 DATA MODEL

Each wedding item has:

- id, nome, categoria, fornecedor

- valorTotal, valorPago

- parcelas: array of { numero, valor, dataVencimento, pago }

- prazo (deadline date)

- status: pendente | em_andamento | concluido | cancelado

- prioridade: alta | media | baixa

- notas

- criadoEm

The app should use **Supabase** for persistence with a `wedding_items` table matching this model. Also create a `wedding_config` table for:

- nomeNoiva, nomeNoivo

- dataCasamento

- orcamentoTotal

---

## 🖥️ PAGE DETAILS

### 1. DASHBOARD

- Top: Greeting "Olá, [Nome] & [Nome] 💍" with days countdown to wedding

- **Progress Ring**: Large circular progress showing % of items concluídos

- **4 stat cards**:

  - Total Gasto (R$ valor)

  - Total Previsto (R$ valor)  

  - Itens Concluídos (X/Y)

  - Próximo Prazo (item name + date)

- **Upcoming deadlines** list (next 5 items by deadline)

- **Recent activity** feed

### 2. ITENS DO CASAMENTO

- Filter bar: by categoria, status, prioridade

- Search bar

- List/Grid toggle view

- Each item card shows:

  - Category icon + name

  - Progress bar: valorPago / valorTotal

  - Status badge (color coded)

  - Deadline chip

  - "Ver parcelas" expandable section

- Floating "+ Adicionar via IA" button (opens the AI command bar)

- Manual add form as alternative

### 3. FINANÇAS

- **Budget Overview**: Donut chart breaking spending by categoria (use Recharts)

- **Gasto Total vs Orçamento**: large progress bar with color coding (green/yellow/red)

- **Parcelas a Vencer**: timeline of upcoming installment payments, grouped by month

- **Resumo**:

  - Total planejado

  - Total pago

  - Restante a pagar

  - Economia (if under budget)

### 4. LINHA DO TEMPO

- Visual timeline (vertical) with months as separators

- Items plotted by prazo

- Color coded by status

- Overdue items highlighted in red with ⚠️ icon

- Clicking an item opens its detail modal

### 5. CONQUISTAS (Gamification)

Show achievement badges that unlock automatically based on data:

- 🌹 "Primeiros Passos" — primeiro item adicionado

- 💰 "Poupador" — pagou alguma parcela em dia

- 📋 "Organizado" — 10+ itens cadastrados

- ✅ "Meio Caminho" — 50% dos itens concluídos

- 🎊 "Quase Lá" — 80% dos itens concluídos

- 💍 "Tudo Pronto" — 100% dos itens concluídos

- 📅 "Pontual" — nenhum prazo vencido

- 🎯 "Dentro do Orçamento" — gastos abaixo do planejado

Each badge: show as a circular medallion, locked badges are grayed out with a lock icon.

### 6. CONFIGURAÇÕES

- Edit couple names

- Set wedding date

- Set total budget

- Export data as CSV

---

## 🎯 UX DETAILS

**AI Command Bar**: 

- Triggered by floating button or keyboard shortcut

- Animated entrance (slide up from bottom)

- Typewriter placeholder cycling through examples:

  - "Contratei o fotógrafo por R$4.500, dei entrada de R$1.500..."

  - "Paguei a 2ª parcela do buffet de R$800"

  - "O vestido ficou para maio, custa R$3.200"

- Shows a loading spinner while AI processes

- Preview card animates in with the interpreted data

**Empty States**: Beautiful illustrated empty states for each section (use inline SVG illustrations, romantic/floral theme)

**Notifications**: Toast notifications for all actions (added, updated, deleted, deadline approaching)

**Responsive**: Must work on mobile. The command bar becomes full-screen on mobile.

---

## 🔧 TECH STACK

- React + TypeScript

- Tailwind CSS

- Supabase (auth + database)

- Recharts (charts)

- Framer Motion (animations)

- Anthropic Claude API (AI interpretation)

- date-fns (date manipulation)

- React Query (data fetching)

---

## 🚀 INITIAL SEED DATA

Pre-populate with 6 sample items so the app looks alive from the start:

1. Buffet — R$15.000, pago R$5.000, 2 parcelas restantes

2. Fotografia — R$4.500, pago R$1.500, prazo: 3 meses

3. Vestido de Noiva — R$3.200, pago R$0, status: em_andamento

4. Decoração Floral — R$2.800, pago R$2.800, status: concluido

5. DJ/Música — R$2.000, pago R$500, prazo: 4 meses

6. Convites — R$800, pago R$800, status: concluido

---

Build this as a complete, working application. Prioritize the AI input feature and the dashboard as the most polished parts. The app should feel premium, romantic, and genuinely useful for a couple planning their wedding.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://eternos-planner.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/afc567f4-f06d-4da6-904c-7338a3b46f4e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
