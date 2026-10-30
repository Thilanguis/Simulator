/* Registro financeiro separado do saldo fictício do jogo.
 * Dados privados ficam apenas no navegador. Nenhum comprovante é enviado ao GitHub.
 */
(function () {
  'use strict';
  const KEY = 'simulatorRegistroV1';
  const CATS = ['Jogo de Buraco', 'Buscar na Casa da Nathalia', 'Comida para Luana e Mel',
    'Comida para Luana e Adriana', 'Perfil', 'Match Masters', 'Salário', 'Lista de Compras'];
  const money = (cents, currency) => (currency === 'USD' ? 'US$ ' : 'R$ ') +
    (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const el = (id) => document.getElementById(id);
  let records;
  try { records = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { records = []; }
  if (!Array.isArray(records)) records = [];
  let receiptHash = '';
  let editingId = null;
  let pendingImport = [];

  function save() {
    localStorage.setItem(KEY, JSON.stringify(records));
    render();
  }
  function parseAmount(input) {
    let s = String(input || '').replace(/[^\d,.-]/g, '').trim();
    if (!s || !/\d/.test(s)) return null;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0 || n > 10000000) return null;
    return Math.round(n * 100);
  }
  function allAmounts(s) {
    return [...String(s).matchAll(/R\$\s*([\d.]+(?:,\d{1,2})?)/gi)]
      .map((m) => parseAmount(m[1])).filter((c) => c !== null);
  }
  function amountFromPart(s) {
    const brasil = allAmounts(s);
    if (brasil.length) return { cents: brasil.reduce((a, b) => a + b, 0), currency: 'BRL' };
    const dollars = String(s).match(/\$\s*([\d.]+(?:,\d{1,2})?)/);
    return dollars ? { cents: parseAmount(dollars[1]), currency: 'USD' } : null;
  }
  function normalise(s) { return String(s).replace(/\s+/g, ' ').trim(); }

  function parseWhatsApp(raw) {
    const result = [];
    const counts = {};
    let category = -1, lastCount = 0, matchCount = 0, matchLines = [];
    const lines = raw.split(/\r?\n/);
    function add(description, amount, status) {
      if (!amount || amount.cents === null) return;
      const count = counts[category] = (counts[category] || 0) + 1;
      result.push({
        id: 'whatsapp-' + category + '-' + count,
        category: CATS[category],
        description: normalise(description).slice(0, 180),
        cents: amount.cents,
        currency: amount.currency,
        status: status || 'pago',
        source: 'WhatsApp',
        addedAt: '',
      });
    }

    for (let line of lines) {
      line = line.trim();
      const h = line.match(/^([1-9])\.\s*(.+?):\s*$/);
      if (h) {
        category = Number(h[1]) - 1;
        if (category >= 8) break;
        lastCount = result.filter((r) => r.category === CATS[category]).length;
        matchCount = 0;
        continue;
      }
      if (category < 0 || category >= 8) continue;
      if (/^Total(?:\s+Geral)?\s*:/i.test(line)) {
        // Só registra um total fixo quando a seção não tem lançamentos discriminados.
        if (result.filter((r) => r.category === CATS[category]).length === lastCount) {
          const a = amountFromPart(line);
          if (a && a.currency === 'BRL') add('Total informado (sem detalhamento)', a, 'pago');
        }
        continue;
      }
      if (!/^[•\-]\s+/.test(line)) continue;
      const body = line.replace(/^[•\-]\s*/, '');
      if (category === 5) {
        // Match Masters: números separados por +; ignora o total declarado depois de '='.
        const before = body.split('=')[0].replace(/^R\$\s*/, '');
        const numbers = before.split('+').map((v) => parseAmount(v.trim())).filter((v) => v !== null);
        for (const cents of numbers) {
          matchCount++;
          add('Match Masters - lançamento ' + matchCount, { cents, currency: 'BRL' }, 'pago');
        }
        continue;
      }
      const colon = body.lastIndexOf(':');
      let description = body, amount = null;
      if (colon !== -1) {
        description = body.slice(0, colon);
        amount = amountFromPart(body.slice(colon + 1));
      } else if (category === 2 || category === 3) {
        description = 'Pagamento de comida';
        const amounts = allAmounts(body);
        if (amounts.length) amount = { cents: amounts[amounts.length - 1], currency: 'BRL' };
      } else {
        amount = amountFromPart(body);
      }
      if (!amount) continue;
      const status = /❌/.test(description) ? 'pendente' : 'pago';
      description = description.replace(/[✅❌]/g, '').trim();
      add(description, amount, status);
    }
    return result;
  }

  function previewImport() {
    pendingImport = parseWhatsApp(el('registroTexto').value);
    const total = pendingImport.filter((r) => r.currency === 'BRL' && r.status === 'pago')
      .reduce((n, r) => n + r.cents, 0);
    const existing = new Map(records.filter((r) => r.id.startsWith('whatsapp-')).map((r) => [r.id, r]));
    const newOnes = pendingImport.filter((r) => !existing.has(r.id));
    const conflict = pendingImport.filter((r) => existing.has(r.id) &&
      (existing.get(r.id).cents !== r.cents || existing.get(r.id).description !== r.description));
    el('registroImportPreview').textContent =
      'Encontrados ' + pendingImport.length + ' lançamentos. Total pago em reais: ' +
      money(total, 'BRL') + '. Novos: ' + newOnes.length + '. Divergências: ' + conflict.length +
      '. Os valores em dólar não entram na soma. Confira antes de importar.';
    el('registroConfirmarImport').disabled = !newOnes.length;
    if (conflict.length) {
      el('registroImportPreview').textContent +=
        ' Itens com divergência não serão alterados automaticamente; revise-os manualmente.';
    }
  }

  function importWhatsApp() {
    const ids = new Set(records.map((r) => r.id));
    const extra = pendingImport.filter((r) => !ids.has(r.id));
    if (!extra.length) return;
    if (!confirm('Adicionar ' + extra.length + ' lançamentos à lista? O saldo do jogo não será alterado.')) return;
    records.push(...extra);
    pendingImport = [];
    el('registroConfirmarImport').disabled = true;
    el('registroImportPreview').textContent = 'Importação concluída: ' + extra.length + ' novos lançamentos.';
    save();
  }

  function render() {
    const groups = el('registroGrupos');
    if (!groups) return;
    groups.replaceChildren();
    let total = 0;
    let paidCount = 0;
    for (const cat of CATS) {
      const items = records.filter((r) => r.category === cat);
      if (!items.length) continue;
      const subtotal = items.filter((r) => r.status === 'pago' && r.currency === 'BRL')
        .reduce((a, r) => a + r.cents, 0);
      paidCount += items.filter((r) => r.status === 'pago' && r.currency === 'BRL').length;
      total += subtotal;
      const details = document.createElement('details');
      details.className = 'registro-grupo';
      const summary = document.createElement('summary');
      summary.textContent = cat + ' — ' + money(subtotal, 'BRL') + ' (' + items.length + ' itens)';
      details.append(summary);
      for (const r of items) {
        const row = document.createElement('div');
        row.className = 'registro-linha';
        const desc = document.createElement('span');
        desc.textContent = (r.status === 'pago' ? '✅ ' : '❌ ') + r.description;
        const valor = document.createElement('strong');
        valor.textContent = money(r.cents, r.currency);
        const toggle = document.createElement('button');
        toggle.type = 'button'; toggle.textContent = r.status === 'pago' ? 'Pendente' : 'Pago';
        toggle.title = 'Trocar o status deste lançamento';
        toggle.addEventListener('click', () => { r.status = r.status === 'pago' ? 'pendente' : 'pago'; save(); });
        const edit = document.createElement('button');
        edit.type = 'button'; edit.textContent = 'Editar';
        edit.addEventListener('click', () => {
          editingId = r.id;
          el('registroCategoria').value = r.category;
          el('registroDescricao').value = r.description;
          el('registroValor').value = (r.cents / 100).toFixed(2).replace('.', ',');
          el('registroMoeda').value = r.currency;
          el('registroStatus').value = r.status;
          el('registroSalvar').textContent = 'Salvar edição';
          el('registroDescricao').focus();
        });
        const del = document.createElement('button');
        del.type = 'button'; del.textContent = 'Excluir';
        del.addEventListener('click', () => {
          if (!confirm('Excluir ' + r.description + '?')) return;
          records = records.filter((item) => item.id !== r.id);
          save();
        });
        row.append(desc, valor, toggle, edit, del);
        details.append(row);
      }
      groups.append(details);
    }
    el('registroTotal').textContent = money(total, 'BRL');
    el('registroQuantidade').textContent = paidCount + ' lançamentos pagos em reais — dólares registrados à parte';
  }

  function newId() {
    return 'manual-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }
  function saveForm(event) {
    event.preventDefault();
    const cents = parseAmount(el('registroValor').value);
    const description = normalise(el('registroDescricao').value);
    if (!description || cents === null || cents <= 0) return alert('Informe descrição e valor válido.');
    const duplicate = records.some((r) => r.proofHash && receiptHash && r.proofHash === receiptHash && r.id !== editingId);
    if (duplicate) return alert('Este mesmo comprovante já está associado a um lançamento.');
    const r = records.find((item) => item.id === editingId);
    const data = {
      category: el('registroCategoria').value, description, cents,
      currency: el('registroMoeda').value, status: el('registroStatus').value,
    };
    if (r) Object.assign(r, data);
    else records.push({ id: newId(), ...data, source: receiptHash ? 'Comprovante' : 'Manual',
      proofHash: receiptHash || '', proofName: receiptHash ? el('registroComprovante').files[0]?.name : '',
      addedAt: new Date().toISOString() });
    editingId = null; receiptHash = '';
    el('registroForm').reset();
    el('registroSalvar').textContent = 'Adicionar lançamento';
    el('registroOCRStatus').textContent = '';
    save();
  }

  function loadScript(src, name) {
    if (window[name]) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src; script.onload = resolve; script.onerror = () => reject(Error('Não foi possível carregar ' + name));
      document.head.append(script);
    });
  }
  async function recognize(image) {
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', 'Tesseract');
    const result = await window.Tesseract.recognize(image, 'por+eng');
    return result.data.text || '';
  }
  async function extractPDF(file) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdfjsLib');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = Math.min(doc.numPages, 2);
    let text = '';
    for (let i = 1; i <= pages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const part = content.items.map((x) => x.str || '').join(' ');
      if (part.trim().length > 35) text += '\n' + part;
      else {
        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        text += '\n' + await recognize(canvas);
      }
    }
    return text;
  }
  function guessReceipt(text) {
    const lines = text.split(/\r?\n/);
    const candidates = [];
    const amountRE = /R\$\s*([\d.]+(?:,\d{1,2})?)/gi;
    lines.forEach((line, index) => {
      for (const m of line.matchAll(amountRE)) {
        const cents = parseAmount(m[1]);
        if (!cents || cents <= 0) continue;
        const context = line.toLowerCase();
        let score = index / Math.max(1, lines.length);
        if (/\b(total|pago|pagamento|valor final|amount paid|order total)\b/i.test(context)) score += 8;
        if (/subtotal|desconto|frete|shipping|taxa|troco/i.test(context)) score -= 6;
        candidates.push({ cents, score });
      }
    });
    // Quando o OCR perde o prefixo R$, tenta um valor próximo de "total".
    if (!candidates.length) {
      for (const line of lines) {
        const m = line.match(/(?:total|valor pago|pagamento)[:\s]*R?\$?\s*([\d.]+,\d{2})/i);
        if (m) { const cents = parseAmount(m[1]); if (cents) candidates.push({ cents, score: 1 }); }
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    const merchant = text.match(/\b(SHEIN|PANDORA|ANEKKE|AMAZON|COACH|SEPHORA|UGG|VIVAIA|DYSON|STANLEY)\b/i);
    return { amount: candidates.length ? candidates[0].cents : null,
      description: merchant ? merchant[0].toUpperCase() : '' };
  }
  async function analyzeReceipt() {
    const file = el('registroComprovante').files[0];
    if (!file) return alert('Selecione uma imagem ou PDF.');
    if (file.size > 12 * 1024 * 1024) return alert('Arquivo maior que 12 MB.');
    el('registroOCRStatus').textContent = 'Lendo comprovante no seu navegador…';
    el('registroAnalisar').disabled = true;
    try {
      const buffer = await file.arrayBuffer();
      if (window.crypto?.subtle) {
        const digest = await crypto.subtle.digest('SHA-256', buffer);
        receiptHash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
      } else receiptHash = file.name + ':' + file.size + ':' + file.lastModified;
      if (records.some((r) => r.proofHash === receiptHash)) throw Error('Este comprovante já foi registrado.');
      const text = file.type === 'application/pdf' || /\.pdf$/i.test(file.name) ?
        await extractPDF(file) : await recognize(file);
      const guess = guessReceipt(text);
      if (guess.amount !== null) el('registroValor').value = (guess.amount / 100).toFixed(2).replace('.', ',');
      if (guess.description) el('registroDescricao').value = guess.description;
      el('registroCategoria').value = 'Lista de Compras';
      el('registroMoeda').value = 'BRL';
      el('registroStatus').value = 'pago';
      el('registroOCRStatus').textContent = guess.amount === null ?
        'Texto processado, mas o valor não foi identificado. Preencha manualmente antes de salvar.' :
        'Sugestão: ' + money(guess.amount, 'BRL') + '. Confira loja e valor antes de salvar.';
    } catch (error) {
      receiptHash = '';
      el('registroOCRStatus').textContent = 'Leitura automática indisponível: ' + error.message +
        '. Você ainda pode registrar manualmente.';
    } finally {
      el('registroAnalisar').disabled = false;
    }
  }

  function shareWhatsApp() {
    const out = ['🎮 Resumo de Jogos e Finanças 💰', '________________________________________'];
    CATS.forEach((cat, i) => {
      const items = records.filter((r) => r.category === cat);
      if (!items.length) return;
      out.push((i + 1) + '. ' + cat + ':');
      for (const r of items) out.push('• ' + r.description + ' ' + (r.status === 'pago' ? '✅' : '❌') +
        ': ' + money(r.cents, r.currency));
      const total = items.filter((r) => r.status === 'pago' && r.currency === 'BRL')
        .reduce((sum, r) => sum + r.cents, 0);
      out.push('Total: ' + money(total, 'BRL'), '________________________________________');
    });
    const total = records.filter((r) => r.status === 'pago' && r.currency === 'BRL')
      .reduce((sum, r) => sum + r.cents, 0);
    out.push('Total Geral Atualizado 🔥 = ' + money(total, 'BRL'));
    window.open('https://wa.me/?text=' + encodeURIComponent(out.join('\n')), '_blank', 'noopener');
  }

  function init() {
    CATS.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat; option.textContent = cat; el('registroCategoria').append(option);
    });
    el('registroForm').addEventListener('submit', saveForm);
    el('registroAnalisar').addEventListener('click', analyzeReceipt);
    el('registroPreverImport').addEventListener('click', previewImport);
    el('registroConfirmarImport').addEventListener('click', importWhatsApp);
    el('registroWhatsApp').addEventListener('click', shareWhatsApp);
    el('registroCancelar').addEventListener('click', () => {
      editingId = null; receiptHash = ''; el('registroForm').reset();
      el('registroSalvar').textContent = 'Adicionar lançamento';
    });
    render();
  }
  document.addEventListener('DOMContentLoaded', init);
  // Exporta parsers puros para testes e diagnósticos sem acessar dados privados.
  window.SimuladorRegistro = { parseWhatsApp, parseAmount };
})();