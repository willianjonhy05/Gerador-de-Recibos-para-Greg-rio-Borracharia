# 🧾 Gerador de Recibos de Serviço - Gregório Borracharia

Aplicação web estática, responsiva e moderna desenvolvida para emissão rápida e geração em PDF de recibos corporativos para a empresa **Gregório Borracharia e Auto Serviço LTDA.**

---

## 📌 Descrição do Projeto

Esta aplicação foi projetada para otimizar a criação e o controle de recibos de prestação de serviços. Com interface focada em usabilidade (Desktop e Mobile), o sistema realiza cálculos automáticos, conta com máscara dinâmica para documentos (CPF/CNPJ), suporta ordenação dos serviços em tempo real e armazena os dados preenchidos temporariamente em memória de sessão (`sessionStorage`).

Ao final do preenchimento, o documento é exportado em formato padrão **A4**, pronto para impressão física ou arquivamento digital, contendo espaço dedicado para assinatura manual ou digital.

---

## 🚀 Funcionalidades

- **Dados Institucionais Fixos:** Cabeçalho e rodapé padronizados com Razão Social, CNPJ, Inscrições e dados do Representante Legal.
- **Texto Declaratório Dinâmico:** Atualização em tempo real do parágrafo formal conforme o nome do cliente, documento e valor total são preenchidos.
- **Máscara Inteligente de Documento:** Identifica e formata automaticamente entradas tanto de CPF (`000.000.000-00`) quanto de CNPJ (`00.000.000/0000-00`).
- **Gerenciamento Dinâmico de Serviços:**
  - Adição e remoção de linhas de serviços sem recarregar a tela.
  - Cálculo instantâneo do subtotal do item e total geral da nota/recibo.
  - Ordenação dinâmica com 1 clique: por ordem alfabética (A-Z) ou por valor unitário.
- **Persistência Temporária em Sessão:** Os dados são mantidos contra recarregamentos acidentais de página (`F5`), mas são completamente apagados ao fechar o navegador/aba, garantindo privacidade e limpeza de cache.
- **Exportação Fiel em PDF (A4):** Configuração com CSS Print e script de renderização para exportar uma folha limpa, sem cortes de margens e com área adequada para rubrica/assinatura.
- **Interface 100% Responsiva:** Adaptada para preenchimento ágil em celulares, tablets e computadores.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estrutura semântica e acessível.
- **CSS3:** Estilização corporativa, flexbox, grid responsivo e regras otimizadas de `@media print`.
- **JavaScript (Vanilla JS):** Cálculos aritméticos reativos, manipulação do DOM e controle do `sessionStorage`.
- **html2pdf.js / jsPDF:** Biblioteca client-side para compilação e download direto do PDF no navegador.

---

## 📂 Estrutura de Arquivos

```text
├── index.html      # Estrutura principal da página e template do recibo
├── styles.css      # Estilos visuais e regras de impressão/PDF
├── script.js       # Regras de negócio, máscaras, ordenação e exportação
└── README.md       # Documentação do projeto
```

---

## 💻 Como Executar Localmente

Como se trata de uma aplicação puramente front-end (HTML, CSS e JS puro), não é necessário instalar dependências com npm ou inicializar servidores backend.

1. Clone o repositório:
   ```bash
   git clone https://github.com/willianjonhy05/Gerador-de-Recibos-para-Greg-rio-Borracharia.git
   ```
2. Acesse a pasta do projeto:
   ```bash
   cd nome-do-repositorio
   ```
3. Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox, Safari).

---

## 🌐 Publicação (Deploy Gratuito)

Este projeto pode ser publicado em segundos através do **GitHub Pages**:
1. No repositório no GitHub, vá em **Settings** > **Pages**.
2. Na seção **Branch**, selecione `main` (ou `master`) e a pasta `/ (root)`.
3. Clique em **Save**. Em instantes o link estará ativo para acesso online direto do smartphone ou computador da oficina.

---

## 📄 Licença

Este projeto é de uso interno e corporativo para **Gregório Borracharia e Auto Serviço LTDA.**
