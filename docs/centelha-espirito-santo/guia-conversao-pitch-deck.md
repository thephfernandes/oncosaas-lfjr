# Guia de Conversão do Pitch Deck para PDF/Slides

## Opções de Conversão

### 1. Markdown para PDF

**Opção A: Pandoc (Recomendado)**

```bash
# Instalar Pandoc
# Windows: choco install pandoc
# Mac: brew install pandoc
# Linux: sudo apt-get install pandoc

# Converter para PDF
pandoc docs/centelha-espirito-santo/pitch-deck-centelha.md -o pitch-deck-centelha.pdf --pdf-engine=xelatex -V geometry:margin=1in
```

**Opção B: Ferramentas Online**

- [Markdown to PDF](https://www.markdowntopdf.com/)
- [Dillinger](https://dillinger.io/) - Exportar como PDF
- [StackEdit](https://stackedit.io/) - Exportar como PDF

**Opção C: VS Code Extensions**

- "Markdown PDF" extension
- "Markdown Preview Enhanced" extension

### 2. Markdown para Slides

**Opção A: Marp (Recomendado)**

```bash
# Instalar Marp CLI
npm install -g @marp-team/marp-cli

# Converter para PDF
marp docs/centelha-espirito-santo/pitch-deck-centelha.md --pdf

# Converter para HTML (slides)
marp docs/centelha-espirito-santo/pitch-deck-centelha.md --html
```

**Opção B: Reveal.js**

- Usar [Reveal.js](https://revealjs.com/) para criar slides interativos
- Converter markdown para HTML com Reveal.js

**Opção C: Slidev**

```bash
# Instalar Slidev
npm install -g @slidev/cli

# Criar apresentação
slidev docs/centelha-espirito-santo/pitch-deck-centelha.md
```

### 3. Ferramentas de Design (Recomendado para Apresentação Visual)

**Opção A: PowerPoint / Google Slides**

1. Abrir PowerPoint ou Google Slides
2. Criar slide mestre com logo e cores da marca
3. Copiar conteúdo de cada slide do markdown
4. Adicionar elementos visuais (gráficos, ícones, imagens)
5. Exportar como PDF

**Opção B: Canva**

1. Criar apresentação no Canva
2. Usar template profissional
3. Adicionar conteúdo de cada slide
4. Exportar como PDF

**Opção C: Figma**

1. Criar design no Figma
2. Usar componentes reutilizáveis
3. Exportar como PDF

## Estrutura Recomendada para Slides Visuais

### Slide 1: Capa

- Logo da empresa (centro)
- Título: "OncoSaas"
- Subtítulo: "Plataforma de Otimização Oncológica com IA"
- Tagline: "Transformando o cuidado oncológico através de IA e WhatsApp"
- Programa: "Centelha Espírito Santo"
- Data: 2025

### Slide 2: O Problema

- Título: "Crise na Oncologia Brasileira"
- Estatísticas em destaque (números grandes)
- Ícones visuais para cada problema
- Gráfico ou infográfico mostrando o problema

### Slide 3: A Solução

- Título: "Plataforma SaaS Multi-Tenant com IA"
- Três pilares em colunas ou cards
- Ícones para cada pilar
- Diagrama de arquitetura (opcional)

### Slide 4: Tecnologia e Inovação

- Título: "Stack Tecnológico Validado"
- Stack em formato de camadas (Frontend, Backend, IA/ML)
- Logos das tecnologias (se possível)
- Destaque para inovações

### Slide 5: Diferenciais Tecnológicos

- Título: "Inovação Única no Mercado"
- Três diferenciais em cards
- Comparação visual com concorrentes (tabela ou gráfico)

### Slide 6: Impacto Socioambiental

- Título: "Contribuição para Saúde e Bem-Estar"
- Métricas em destaque (números grandes)
- Gráficos de impacto (antes/depois)
- Ícones para cada benefício

### Slide 7: Mercado e Oportunidade

- Título: "Mercado em Crescimento"
- Gráfico de TAM/SAM/SOM
- Números de mercado em destaque
- Tendências em timeline

### Slide 8: Validação e Tração

- Título: "Validação do Produto"
- Timeline de validação
- Métricas esperadas em cards
- Parcerias em logos (se disponível)

### Slide 9: Modelo de Negócio

- Título: "SaaS B2B Escalável"
- Tabela de pricing
- Gráfico de unit economics
- ROI destacado

### Slide 10: Equipe

- Título: "Por Que Somos as Pessoas Certas?"
- Foto do fundador (se disponível)
- Cards com competências
- Projeto anterior destacado

### Slide 11: Roadmap

- Título: "Próximos 18 Meses"
- Timeline visual
- Milestones destacados
- Fases em cores diferentes

### Slide 12: Concorrência

- Título: "Diferenciais Competitivos"
- Matriz de comparação
- Diferenciais em destaque
- Barreiras de entrada

### Slide 13: Riscos e Mitigações

- Título: "Principais Riscos e Estratégias"
- Tabela de riscos vs mitigações
- Ícones de status (mitigado, em andamento)

### Slide 14: Visão

- Título: "Onde Queremos Estar em 5 Anos"
- Números da visão em destaque
- Timeline de expansão
- Impacto esperado

### Slide 15: Call to Action

- Título: "Junte-se a Nós"
- Informações de contato
- Próximos passos
- QR code para mais informações (opcional)

## Elementos Visuais Recomendados

### Cores

- **Primária:** Azul (confiança, saúde)
- **Secundária:** Verde (crescimento, saúde)
- **Acento:** Laranja (inovação, energia)

### Tipografia

- **Títulos:** Sans-serif (Arial, Helvetica, Roboto)
- **Corpo:** Sans-serif legível
- **Números:** Fonte destacada (Impact, Arial Black)

### Ícones

- Usar ícones consistentes (Font Awesome, Material Icons)
- Ícones para cada seção (problema, solução, tecnologia, etc.)

### Gráficos

- Gráficos de barras para comparações
- Gráficos de linha para tendências
- Infográficos para processos
- Números grandes e destacados

### Imagens

- Imagens de stock (se necessário)
- Screenshots do produto (se disponível)
- Logos de parceiros (se disponível)

## Checklist Antes de Exportar

- [ ] Todos os slides revisados
- [ ] Números e estatísticas verificados
- [ ] Ortografia e gramática corrigidas
- [ ] Logo da empresa adicionado
- [ ] Cores da marca aplicadas
- [ ] Elementos visuais consistentes
- [ ] Informações de contato atualizadas
- [ ] Formato PDF testado
- [ ] Tamanho do arquivo otimizado (< 10MB)

## Dicas Finais

1. **Mantenha Simples:** Slides limpos e focados
2. **Use Dados:** Números e estatísticas em destaque
3. **Seja Visual:** Gráficos e ícones ajudam na compreensão
4. **Conte uma História:** Fluxo lógico do problema à solução
5. **Destaque Diferenciais:** O que torna a solução única
6. **Mostre Impacto:** Benefícios mensuráveis
7. **Seja Profissional:** Design limpo e consistente

---

**Próximo Passo:** Escolher método de conversão e criar versão visual do pitch deck
