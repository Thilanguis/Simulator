/* =================================================================== */
/* BÔNUS ESPECIAL (Langerie)                    */
/* =================================================================== */

function getBonusEspecialMultiplier() {
  return bonusEspecialAtivo ? BONUS_ESPECIAL_MULTIPLIER : 1;
}

// Badge ao lado do "Como ganhou"
function renderBonusEspecialInlineBadge() {
  try {
    const mult = BONUS_ESPECIAL_MULTIPLIER;
    let badge = document.getElementById('bonusEspecialInline');
    const active = bonusEspecialAtivo;

    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'bonusEspecialInline';
      badge.style.cssText = [
        'margin-left:8px',
        'font-size:12px',
        'padding:3px 8px',
        'border-radius:999px',
        'background:#0f172a',
        'color:#fff',
        'display:inline-flex',
        'gap:6px',
        'align-items:center',
        'vertical-align:middle',
        'box-shadow:0 1px 3px rgba(0,0,0,.15)',
      ].join(';');

      const bolt = document.createElement('span');
      bolt.textContent = '⚡';
      bolt.style.fontSize = '14px';

      const text = document.createElement('span');
      text.id = 'bonusEspecialInlineText';

      badge.append(bolt, text);

      const label = document.querySelector('label[for="selectGanho"]');
      if (label && label.parentElement) {
        label.parentElement.insertBefore(badge, label.nextSibling);
      } else {
        const select = document.getElementById('selectGanho');
        if (select && select.parentElement) {
          select.parentElement.insertBefore(badge, select.nextSibling);
        } else {
          document.body.appendChild(badge);
        }
      }
    }

    const text = document.getElementById('bonusEspecialInlineText');
    if (text) {
      if (active) {
        text.textContent = `Bônus x${mult.toLocaleString('pt-BR')} ativo (langerie especial)`;
      } else {
        text.textContent = `Bônus x${mult.toLocaleString('pt-BR')} desligado`;
      }
    }
    badge.style.opacity = active ? '1' : '.5';
  } catch (e) {}
}

// Decorar as opções do select "Como ganhou" com (Bônus x2)
function decorateSelectGanhoForBonus() {
  try {
    const sel = document.getElementById('selectGanho');
    if (!sel) return;
    for (const opt of Array.from(sel.options)) {
      if (!opt.dataset.originalText) opt.dataset.originalText = opt.textContent;
      if (bonusEspecialAtivo) {
        opt.textContent = opt.dataset.originalText + ` (⚡)`;
      } else {
        opt.textContent = opt.dataset.originalText;
      }
    }
  } catch (e) {}
}

// Faixinha embaixo explicando o bônus
function renderBonusEspecialBanner() {
  try {
    let banner = document.getElementById('bonusEspecialBanner');

    if (!bonusEspecialAtivo) {
      if (banner) banner.remove();
      return;
    }

    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'bonusEspecialBanner';
      banner.style.cssText = ['margin-top:6px', 'font-size:11px', 'color:#bbf7d0', 'background:#052e16', 'border-radius:999px', 'padding:4px 10px', 'display:inline-flex', 'align-items:center', 'gap:6px'].join(';');

      const icon = document.createElement('span');
      icon.textContent = '👙';

      const text = document.createElement('span');
      text.id = 'bonusEspecialBannerText';

      banner.append(icon, text);

      const ganhoFields = document.getElementById('ganhoFields');
      if (ganhoFields) {
        ganhoFields.appendChild(banner);
      } else {
        const select = document.getElementById('selectGanho');
        if (select && select.parentElement) {
          select.parentElement.appendChild(banner);
        } else {
          document.body.appendChild(banner);
        }
      }
    }

    const text = document.getElementById('bonusEspecialBannerText');
    if (text) {
      text.textContent = `Bônus x${BONUS_ESPECIAL_MULTIPLIER.toLocaleString('pt-BR')} aplicado em todos os créditos enquanto a langerie especial estiver ativa.`;
    }
  } catch (e) {}
}

function updateBonusEspecialUI() {
  renderBonusEspecialInlineBadge();
  decorateSelectGanhoForBonus();
  renderBonusEspecialBanner();
}
