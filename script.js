/**
 * Emissor de Recibos Corporativos
 * Gregório Borracharia e Auto Serviço LTDA.
 * Lógica de Negócios, Máscara Dinâmica, Ordenação e Exportação A4
 */

// ==========================================================================
// 1. CONSTANTES & DADOS FIXOS DO PRESTADOR
// ==========================================================================
const PRESTADOR_FIXO = {
  razao_social: 'Gregório Borracharia e Auto Serviço LTDA.',
  cnpj: '22.338.423/0001-59',
  ie: '196.981.557',
  im: '644143-2',
  endereco: 'Avenida Poti Velho, 5380 - Santa Maria da Codipi - Teresina / PI',
  telefone: '(86) 98178-5439',
  email: 'borrachariagregorio@gmail.com',
  representante_nome: 'Franklin Pereira da Silva',
  representante_cpf: '553.714.003-97',
  representante_cargo: 'Representante Legal'
};

const STORAGE_SESSION_KEY = 'GREGORIO_RECEIPT_STATE_V3';

// ==========================================================================
// 2. ESTADO DA APLICAÇÃO (CONTROLADO EM SESSIONSTORAGE)
// ==========================================================================
let appState = {
  tomador: {
    nome: '',
    documento: '',
    cidade: 'Teresina / PI'
  },
  itens: [
    {
      id: 'item-1',
      descricao: 'Serviço de vulcanização a quente de pneu agrícola/carga',
      quantidade: 1,
      valor_unitario: 140.00
    },
    {
      id: 'item-2',
      descricao: 'Alinhamento, balanceamento e rodízio completo de rodas',
      quantidade: 1,
      valor_unitario: 160.00
    }
  ],
  emissao: {
    numero: '001/' + new Date().getFullYear(),
    forma_pagamento: 'Pix',
    pix_chave: '22.338.423/0001-59',
    pix_titular: 'Gregório Borracharia e Auto Serviço',
    cidade: 'Teresina - PI',
    data: new Date().toISOString().split('T')[0],
    assinatura_base64: ''
  },
  ordenacao: {
    criterio: null, // 'descricao' | 'valor'
    direcao: 'asc'  // 'asc' | 'desc'
  }
};

// ==========================================================================
// 3. CONVERSOR DE MOEDA E VALOR POR EXTENSO EM PORTUGUÊS
// ==========================================================================
function converterParaExtenso(valor) {
  if (valor === 0 || isNaN(valor)) return 'zero real';

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function processarCentena(n) {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const pedacos = [];

    if (c > 0) pedacos.push(centenas[c]);
    if (d === 1) {
      pedacos.push(especiais[u]);
    } else {
      if (d > 1) pedacos.push(dezenas[d]);
      if (u > 0) pedacos.push(unidades[u]);
    }
    return pedacos.join(' e ');
  }

  const [inteiroStr, centavosStr] = valor.toFixed(2).split('.');
  const inteiros = parseInt(inteiroStr, 10);
  const centavos = parseInt(centavosStr, 10);

  const milhoes = Math.floor(inteiros / 1000000);
  const milhares = Math.floor((inteiros % 1000000) / 1000);
  const resto = inteiros % 1000;

  let grupos = [];

  if (milhoes > 0) {
    grupos.push(processarCentena(milhoes) + (milhoes === 1 ? ' milhão' : ' milhões'));
  }

  if (milhares > 0) {
    if (milhares === 1 && milhoes === 0) {
      grupos.push('mil');
    } else {
      grupos.push(processarCentena(milhares) + ' mil');
    }
  }

  if (resto > 0) {
    grupos.push(processarCentena(resto));
  }

  let textoReais = '';
  if (inteiros > 0) {
    textoReais = grupos.join(' e ') + (inteiros === 1 ? ' real' : ' reais');
  }

  let textoCentavos = '';
  if (centavos > 0) {
    textoCentavos = processarCentena(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  }

  if (textoReais && textoCentavos) return `${textoReais} e ${textoCentavos}`;
  if (textoReais) return textoReais;
  if (textoCentavos) return textoCentavos;
  return 'zero real';
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2
});

function formatarDataPorExtenso(dataIso) {
  if (!dataIso) return '';
  const [ano, mes, dia] = dataIso.split('-');
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${dia} de ${meses[parseInt(mes, 10) - 1]} de ${ano}`;
}

// ==========================================================================
// 4. MÁSCARA DINÂMICA UNIFICADA (CPF / CNPJ)
// ==========================================================================
function aplicarMascaraCpfCnpj(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 14);

  if (digitos.length <= 11) {
    // Padrão CPF: 000.000.000-00
    return digitos
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // Padrão CNPJ: 00.000.000/0000-00
    return digitos
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
}

// ==========================================================================
// 5. PERSISTÊNCIA EM SESSIONSTORAGE
// ==========================================================================
function salvarEstadoSessao() {
  try {
    sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(appState));
  } catch (err) {
    console.warn('Erro ao salvar no sessionStorage:', err);
  }
}

function carregarEstadoSessao() {
  try {
    const salvo = sessionStorage.getItem(STORAGE_SESSION_KEY);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      appState.tomador = parsed.tomador || appState.tomador;
      appState.itens = parsed.itens || appState.itens;
      appState.emissao = parsed.emissao || appState.emissao;
      appState.ordenacao = parsed.ordenacao || appState.ordenacao;
    }
  } catch (err) {
    console.warn('Erro ao carregar do sessionStorage:', err);
  }
}

// ==========================================================================
// 6. RENDERIZAÇÃO DA FOLHA A4 (PRÉVIA EM TEMPO REAL)
// ==========================================================================
function renderizarVisualizacaoA4() {
  // 1. Dados do Tomador integrados diretamente no parágrafo declaratório
  const tomadorNome = appState.tomador.nome.trim();
  const tomadorDoc = appState.tomador.documento.trim();
  const tomadorCid = appState.tomador.cidade.trim();

  document.getElementById('view-tomador-nome').textContent = tomadorNome || '[NOME DO TOMADOR / CLIENTE]';
  document.getElementById('view-tomador-doc').textContent = tomadorDoc || '[000.000.000-00]';
  document.getElementById('view-tomador-cidade').textContent = tomadorCid || 'Teresina / PI';

  // 2. Tabela de Serviços e Cálculos
  const tbody = document.getElementById('view-table-body');
  tbody.innerHTML = '';

  let totalAcumulado = 0;

  appState.itens.forEach((item, index) => {
    const qtd = parseFloat(item.quantidade) || 0;
    const vlr = parseFloat(item.valor_unitario) || 0;
    const subtotal = qtd * vlr;
    totalAcumulado += subtotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center; color: #64748b; font-size: 0.75rem;">${index + 1}</td>
      <td><strong>${item.descricao.trim() || 'Serviço prestado'}</strong></td>
      <td style="text-align: center;">${qtd}</td>
      <td style="text-align: right; font-family: var(--font-mono);">${formatadorMoeda.format(vlr)}</td>
      <td style="text-align: right; font-family: var(--font-mono); font-weight: 700;">${formatadorMoeda.format(subtotal)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Atualização dos totais e por extenso
  const totalBRL = formatadorMoeda.format(totalAcumulado);
  document.getElementById('view-total-numerico').textContent = totalBRL;
  document.getElementById('view-table-total-val').textContent = totalBRL;
  document.getElementById('form-total-val').textContent = totalBRL;
  document.getElementById('view-total-extenso').textContent = converterParaExtenso(totalAcumulado);

  // 3. Emissão e Pagamento
  document.getElementById('view-doc-numero').textContent = `Nº: ${appState.emissao.numero || 'S/N'}`;
  document.getElementById('view-pgto-metodo').textContent = appState.emissao.forma_pagamento;

  const boxPixKey = document.getElementById('view-box-pix-chave');
  const boxPixHolder = document.getElementById('view-box-pix-titular');

  if (appState.emissao.forma_pagamento === 'Pix') {
    boxPixKey.style.display = 'block';
    boxPixHolder.style.display = 'block';
    document.getElementById('view-pgto-chave').textContent = appState.emissao.pix_chave || PRESTADOR_FIXO.cnpj;
    document.getElementById('view-pgto-titular').textContent = appState.emissao.pix_titular || PRESTADOR_FIXO.razao_social;
  } else {
    boxPixKey.style.display = 'none';
    boxPixHolder.style.display = 'none';
  }

  // 4. Datação
  const localidade = appState.emissao.cidade || 'Teresina - PI';
  const dataExtenso = formatarDataPorExtenso(appState.emissao.data);
  document.getElementById('view-data-localidade').textContent = `${localidade}, ${dataExtenso}.`;

  // 5. Assinatura Digital / Imagem
  const imgElement = document.getElementById('view-signature-img');
  const btnRemoverAss = document.getElementById('btn-limpar-assinatura');

  if (appState.emissao.assinatura_base64) {
    imgElement.src = appState.emissao.assinatura_base64;
    imgElement.classList.remove('hidden');
    btnRemoverAss.classList.remove('hidden');
  } else {
    imgElement.src = '';
    imgElement.classList.add('hidden');
    btnRemoverAss.classList.add('hidden');
  }

  salvarEstadoSessao();
}

// ==========================================================================
// 7. RENDERIZAÇÃO DA LISTA DE SERVIÇOS NO FORMULÁRIO (COM CORREÇÃO DE INPUT)
// ==========================================================================
function renderizarLinhasDeServicos() {
  const container = document.getElementById('items-wrapper');
  container.innerHTML = '';

  appState.itens.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.id = item.id;

    const subtotal = (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0);

    // Campos com name e styling explícito anti-truncamento
    row.innerHTML = `
      <input type="text" name="item_descricao" class="field-desc" placeholder="Ex: Balanceamento de rodas e troca de bico" value="${escapeHtml(item.descricao)}">
      <input type="number" name="item_qtd" class="field-qtd" min="1" step="1" value="${item.quantidade}">
      <input type="number" name="item_unitario" class="field-unit" min="0" step="0.01" value="${item.valor_unitario}">
      <span class="col-subtotal">${formatadorMoeda.format(subtotal)}</span>
      <button type="button" class="btn-remove-line" title="Remover este serviço" data-index="${index}">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    // Eventos reativos da linha
    const inputDesc = row.querySelector('input[name="item_descricao"]');
    const inputQtd = row.querySelector('input[name="item_qtd"]');
    const inputUnit = row.querySelector('input[name="item_unitario"]');
    const spanSubtotal = row.querySelector('.col-subtotal');
    const btnRemove = row.querySelector('.btn-remove-line');

    inputDesc.addEventListener('input', (e) => {
      item.descricao = e.target.value;
      renderizarVisualizacaoA4();
    });

    inputQtd.addEventListener('input', (e) => {
      item.quantidade = parseFloat(e.target.value) || 0;
      spanSubtotal.textContent = formatadorMoeda.format(item.quantidade * item.valor_unitario);
      renderizarVisualizacaoA4();
    });

    inputUnit.addEventListener('input', (e) => {
      item.valor_unitario = parseFloat(e.target.value) || 0;
      spanSubtotal.textContent = formatadorMoeda.format(item.quantidade * item.valor_unitario);
      renderizarVisualizacaoA4();
    });

    btnRemove.addEventListener('click', () => {
      if (appState.itens.length <= 1) {
        alert('O recibo deve conter no mínimo 1 serviço discriminado.');
        return;
      }
      appState.itens.splice(index, 1);
      renderizarLinhasDeServicos();
      renderizarVisualizacaoA4();
    });

    container.appendChild(row);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function adicionarNovoServico() {
  appState.itens.push({
    id: 'item-' + Date.now(),
    descricao: '',
    quantidade: 1,
    valor_unitario: 0.00
  });
  renderizarLinhasDeServicos();
  renderizarVisualizacaoA4();

  // Foco imediato na descrição da nova linha
  const inputs = document.querySelectorAll('input[name="item_descricao"]');
  if (inputs.length > 0) {
    inputs[inputs.length - 1].focus();
  }
}

// Ordenação Alfabética e por Preço
function ordenarServicosPorNome() {
  const direcao = (appState.ordenacao.criterio === 'descricao' && appState.ordenacao.direcao === 'asc') ? 'desc' : 'asc';
  appState.ordenacao = { criterio: 'descricao', direcao };

  appState.itens.sort((a, b) => {
    const strA = (a.descricao || '').trim().toLowerCase();
    const strB = (b.descricao || '').trim().toLowerCase();
    return direcao === 'asc' 
      ? strA.localeCompare(strB, 'pt-BR') 
      : strB.localeCompare(strA, 'pt-BR');
  });

  atualizarBotoesOrdenacao('btn-sort-az', direcao);
  renderizarLinhasDeServicos();
  renderizarVisualizacaoA4();
}

function ordenarServicosPorValor() {
  const direcao = (appState.ordenacao.criterio === 'valor' && appState.ordenacao.direcao === 'desc') ? 'asc' : 'desc';
  appState.ordenacao = { criterio: 'valor', direcao };

  appState.itens.sort((a, b) => {
    const valA = parseFloat(a.valor_unitario) || 0;
    const valB = parseFloat(b.valor_unitario) || 0;
    return direcao === 'desc' ? valB - valA : valA - valB;
  });

  atualizarBotoesOrdenacao('btn-sort-valor', direcao);
  renderizarLinhasDeServicos();
  renderizarVisualizacaoA4();
}

function atualizarBotoesOrdenacao(idAtivo, direcao) {
  const btnAz = document.getElementById('btn-sort-az');
  const btnVal = document.getElementById('btn-sort-valor');

  btnAz.classList.remove('active');
  btnVal.classList.remove('active');

  const btnAtual = document.getElementById(idAtivo);
  btnAtual.classList.add('active');

  if (idAtivo === 'btn-sort-az') {
    btnAtual.innerHTML = direcao === 'asc' 
      ? '<i class="fa-solid fa-arrow-down-a-z"></i> De A-Z' 
      : '<i class="fa-solid fa-arrow-up-z-a"></i> De Z-A';
  } else {
    btnAtual.innerHTML = direcao === 'desc'
      ? '<i class="fa-solid fa-arrow-down-wide-short"></i> Maior Valor'
      : '<i class="fa-solid fa-arrow-up-wide-short"></i> Menor Valor';
  }
}

// ==========================================================================
// 8. SINCRONIZAÇÃO E EVENTOS DO FORMULÁRIO
// ==========================================================================
function sincronizarInputsComEstado() {
  document.getElementById('tomador-nome').value = appState.tomador.nome;
  document.getElementById('tomador-documento').value = appState.tomador.documento;
  document.getElementById('tomador-cidade').value = appState.tomador.cidade;

  document.getElementById('emissao-numero').value = appState.emissao.numero;
  document.getElementById('emissao-forma').value = appState.emissao.forma_pagamento;
  document.getElementById('emissao-pix-chave').value = appState.emissao.pix_chave;
  document.getElementById('emissao-pix-titular').value = appState.emissao.pix_titular;
  document.getElementById('emissao-cidade').value = appState.emissao.cidade;
  document.getElementById('emissao-data').value = appState.emissao.data;

  renderizarLinhasDeServicos();
}

function registrarEventos() {
  // Tomador
  document.getElementById('tomador-nome').addEventListener('input', (e) => {
    appState.tomador.nome = e.target.value;
    renderizarVisualizacaoA4();
  });

  const inputDoc = document.getElementById('tomador-documento');
  inputDoc.addEventListener('input', (e) => {
    const mascarado = aplicarMascaraCpfCnpj(e.target.value);
    e.target.value = mascarado;
    appState.tomador.documento = mascarado;
    renderizarVisualizacaoA4();
  });

  document.getElementById('tomador-cidade').addEventListener('input', (e) => {
    appState.tomador.cidade = e.target.value;
    renderizarVisualizacaoA4();
  });

  // Emissão & Pagamento
  document.getElementById('emissao-numero').addEventListener('input', (e) => {
    appState.emissao.numero = e.target.value;
    renderizarVisualizacaoA4();
  });

  const selectForma = document.getElementById('emissao-forma');
  selectForma.addEventListener('change', (e) => {
    appState.emissao.forma_pagamento = e.target.value;
    const isPix = e.target.value === 'Pix';
    document.getElementById('group-pix-key').style.display = isPix ? 'flex' : 'none';
    document.getElementById('group-pix-holder').style.display = isPix ? 'flex' : 'none';
    renderizarVisualizacaoA4();
  });

  document.getElementById('emissao-pix-chave').addEventListener('input', (e) => {
    appState.emissao.pix_chave = e.target.value;
    renderizarVisualizacaoA4();
  });

  document.getElementById('emissao-pix-titular').addEventListener('input', (e) => {
    appState.emissao.pix_titular = e.target.value;
    renderizarVisualizacaoA4();
  });

  document.getElementById('emissao-cidade').addEventListener('input', (e) => {
    appState.emissao.cidade = e.target.value;
    renderizarVisualizacaoA4();
  });

  document.getElementById('emissao-data').addEventListener('change', (e) => {
    appState.emissao.data = e.target.value;
    renderizarVisualizacaoA4();
  });

  // Ações de Itens
  document.getElementById('btn-novo-item').addEventListener('click', adicionarNovoServico);
  document.getElementById('btn-sort-az').addEventListener('click', ordenarServicosPorNome);
  document.getElementById('btn-sort-valor').addEventListener('click', ordenarServicosPorValor);

  // Upload e Remoção de Assinatura
  const inputFileAssinatura = document.getElementById('input-assinatura-img');
  inputFileAssinatura.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        appState.emissao.assinatura_base64 = ev.target.result;
        renderizarVisualizacaoA4();
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('btn-limpar-assinatura').addEventListener('click', () => {
    appState.emissao.assinatura_base64 = '';
    inputFileAssinatura.value = '';
    renderizarVisualizacaoA4();
  });

  // Botão Novo Recibo / Limpar
  document.getElementById('btn-novo').addEventListener('click', () => {
    if (confirm('Deseja iniciar um novo recibo? Os dados do cliente e dos serviços serão reiniciados.')) {
      sessionStorage.removeItem(STORAGE_SESSION_KEY);
      appState.tomador = { nome: '', documento: '', cidade: 'Teresina / PI' };
      appState.itens = [{ id: 'item-1', descricao: '', quantidade: 1, valor_unitario: 0.00 }];
      appState.emissao.numero = '001/' + new Date().getFullYear();
      appState.emissao.assinatura_base64 = '';
      appState.ordenacao = { criterio: null, direcao: 'asc' };

      inputFileAssinatura.value = '';
      sincronizarInputsComEstado();
      renderizarVisualizacaoA4();
    }
  });

  // Impressão Nativa
  document.getElementById('btn-imprimir').addEventListener('click', () => {
    window.print();
  });

  // Exportação em PDF
  document.getElementById('btn-exportar-pdf').addEventListener('click', exportarReciboPDF);

  // Controle de Abas no Mobile
  configurarNavegacaoMobile();
}

function configurarNavegacaoMobile() {
  const btnTabForm = document.getElementById('tab-form-btn');
  const btnTabPrev = document.getElementById('tab-preview-btn');
  const formPanel = document.getElementById('form-container');
  const prevPanel = document.getElementById('preview-container');

  btnTabForm.addEventListener('click', () => {
    btnTabForm.classList.add('active');
    btnTabPrev.classList.remove('active');
    formPanel.classList.remove('mobile-hidden');
    prevPanel.classList.add('mobile-hidden');
  });

  btnTabPrev.addEventListener('click', () => {
    btnTabPrev.classList.add('active');
    btnTabForm.classList.remove('active');
    prevPanel.classList.remove('mobile-hidden');
    formPanel.classList.add('mobile-hidden');
  });

  if (window.innerWidth <= 1080) {
    prevPanel.classList.add('mobile-hidden');
  }
}

// ==========================================================================
// 9. EXPORTAÇÃO EXATA PARA PDF A4 (html2pdf.js)
// ==========================================================================
function exportarReciboPDF() {
  const folhaA4 = document.getElementById('receipt-document');
  const btnPdf = document.getElementById('btn-exportar-pdf');

  const htmlOriginal = btnPdf.innerHTML;
  btnPdf.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span class="btn-text">Gerando...</span>';
  btnPdf.disabled = true;

  const numSanitizado = (appState.emissao.numero || 'recibo').replace(/[^a-zA-Z0-9]/g, '_');
  const nomeArquivo = `Recibo_${numSanitizado}_Gregorio_AutoServico.pdf`;

  const opt = {
    margin: 0,
    filename: nomeArquivo,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  html2pdf()
    .set(opt)
    .from(folhaA4)
    .save()
    .then(() => {
      btnPdf.innerHTML = htmlOriginal;
      btnPdf.disabled = false;
    })
    .catch((err) => {
      console.error('Falha ao exportar PDF:', err);
      alert('Houve um problema ao gerar o PDF diretamente. Você pode usar a opção "Imprimir" e salvar como PDF.');
      btnPdf.innerHTML = htmlOriginal;
      btnPdf.disabled = false;
    });
}

// ==========================================================================
// 10. INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  carregarEstadoSessao();
  sincronizarInputsComEstado();
  renderizarVisualizacaoA4();
  registrarEventos();
});