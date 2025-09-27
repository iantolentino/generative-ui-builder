/* script.js — Generative UI Builder
   - Adds dark/light theme toggle (emoji)
   - Fixes Generate button behavior (hero + controls call same function)
   - Adds offline fallback generator when backend unreachable
   - Provides Preview / HTML / JSX views + Export
*/

/* -------------------------
   Utilities / helpers
------------------------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
function escapeHtml(s){ return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

/* -------------------------
   Templates (DOM preview)
------------------------- */
function basicTemplatesForType(node) {
  const type = node.type;
  const props = node.props || {};
  const el = document.createElement('div');
  el.className = 'card';

  switch(type) {
    case 'hero':
      el.innerHTML = `<div class="card-title" contenteditable="true">${escapeHtml(props.title || 'Hero Title')}</div>
        <div contenteditable="true">${escapeHtml(props.subtitle || 'Supporting subtitle')}</div>
        <div style="margin-top:8px"><button class="button">${escapeHtml(props.cta || 'Get started')}</button></div>`;
      break;

    case 'navbar':
      // simple inline navbar preview
      el.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center">
          <strong contenteditable="true">${escapeHtml(props.brand || 'Brand')}</strong>
          <div>${(props.links || ['Home','About','Contact']).map(l => `<span style="margin-left:8px" contenteditable="true">${escapeHtml(l)}</span>`).join('')}</div>
        </div>`;
      break;

    case 'form':
      el.innerHTML = `<div class="card-title">${escapeHtml(props.title || 'Form')}</div>
        <div style="margin-top:8px">
          ${(props.fields || ['Email','Password']).map(f =>
            `<div class="form-field"><label>${escapeHtml(f)}</label><input placeholder="${escapeHtml(f)}"/></div>`
          ).join('')}
          <div style="margin-top:10px"><button class="button">${escapeHtml(props.submit || 'Submit')}</button></div>
        </div>`;
      break;

    case 'grid':
      const items = props.items || 3;
      const gridEl = document.createElement('div');
      gridEl.style.display = 'grid';
      gridEl.style.gridTemplateColumns = 'repeat(auto-fill,minmax(150px,1fr))';
      gridEl.style.gap = '8px';
      for(let i=0;i<items;i++){
        const c = document.createElement('div');
        c.className = 'card';
        c.innerHTML = `<div class="card-title" contenteditable="true">Card ${i+1}</div><div contenteditable="true">Description</div>`;
        gridEl.appendChild(c);
      }
      el.innerHTML = '';
      el.appendChild(gridEl);
      break;

    case 'list':
      el.innerHTML = `<ul>${(props.items || []).map(it=>`<li contenteditable="true">${escapeHtml(it)}</li>`).join('')}</ul>`;
      break;

    case 'card':
      el.innerHTML = `<div class="card-title" contenteditable="true">${escapeHtml(props.title || 'Card')}</div>
        <div contenteditable="true">${escapeHtml(props.body || 'Body text')}</div>
        ${props.cta ? `<div style="margin-top:8px"><button class="button">${escapeHtml(props.cta)}</button></div>` : ''}`;
      break;

    case 'button':
      el.innerHTML = `<div><button class="button" contenteditable="true">${escapeHtml(props.text || 'Click')}</button></div>`;
      break;

    case 'footer':
      el.innerHTML = `<div contenteditable="true">${escapeHtml(props.text || '© 2026 Your Company')}</div>`;
      break;

    default:
      el.innerHTML = `<div contenteditable="true">${escapeHtml(props.text || 'Block')}</div>`;
      break;
  }

  return el;
}

/* Render preview DOM from AST */
function renderStructure(ast, container) {
  container.innerHTML = '';
  if (!ast || !Array.isArray(ast.components)) return;
  ast.components.forEach(node => container.appendChild(basicTemplatesForType(node)));
}

/* -------------------------
   AST → HTML string
------------------------- */
function astToHTML(ast) {
  if (!ast || !Array.isArray(ast.components)) return '';
  function renderNode(node) {
    const p = node.props || {};
    switch(node.type) {
      case 'hero':
        return `<section class="hero"><h2>${escapeHtml(p.title||'Hero')}</h2><p>${escapeHtml(p.subtitle||'Subtitle')}</p><button>${escapeHtml(p.cta||'Get started')}</button></section>`;
      case 'navbar':
        return `<nav><strong>${escapeHtml(p.brand||'Brand')}</strong><div>${(p.links||[]).map(l=>`<a href="#">${escapeHtml(l)}</a>`).join(' ')}</div></nav>`;
      case 'form':
        return `<form><h3>${escapeHtml(p.title||'Form')}</h3>${(p.fields||[]).map(f=>`<label>${escapeHtml(f)}<input placeholder="${escapeHtml(f)}"/></label>`).join('') }<button>${escapeHtml(p.submit||'Submit')}</button></form>`;
      case 'list':
        return `<ul>${(p.items||[]).map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
      case 'grid':
        return `<div class="grid">${Array.from({length: p.items||3}).map((_,i)=>`<div class="card"><h4>Card ${i+1}</h4><p>Text</p></div>`).join('')}</div>`;
      case 'card':
        return `<div class="card"><h4>${escapeHtml(p.title||'Card')}</h4><p>${escapeHtml(p.body||'Body')}</p>${p.cta?`<button>${escapeHtml(p.cta)}</button>`:''}</div>`;
      case 'button':
        return `<button>${escapeHtml(p.text||'Click')}</button>`;
      case 'footer':
        return `<footer>${escapeHtml(p.text||'© 2026')}</footer>`;
      default:
        return `<div>${escapeHtml(p.text||'Block')}</div>`;
    }
  }
  return ast.components.map(renderNode).join('\n\n');
}

/* -------------------------
   AST → JSX string
------------------------- */
function astToJSX(ast) {
  if (!ast || !Array.isArray(ast.components)) return '';
  function renderNode(node, indent = 4) {
    const pad = ' '.repeat(indent);
    const p = node.props || {};
    switch(node.type) {
      case 'hero':
        return `${pad}<section className="hero">\n${pad}  <h2>${escapeHtml(p.title||'Hero')}</h2>\n${pad}  <p>${escapeHtml(p.subtitle||'Subtitle')}</p>\n${pad}  <button>${escapeHtml(p.cta||'Get started')}</button>\n${pad}</section>\n`;
      case 'form':
        return `${pad}<form>\n${pad}  <h3>${escapeHtml(p.title||'Form')}</h3>\n${(p.fields||[]).map(f=>`${pad}  <label>${escapeHtml(f)}<input placeholder="${escapeHtml(f)}" /></label>`).join('\n')}\n${pad}  <button>${escapeHtml(p.submit||'Submit')}</button>\n${pad}</form>\n`;
      case 'list':
        return `${pad}<ul>\n${(p.items||[]).map(i=>`${pad}  <li>${escapeHtml(i)}</li>`).join('\n')}\n${pad}</ul>\n`;
      case 'grid':
        return `${pad}<div className="grid">\n${Array.from({length:p.items||3}).map((_,i)=>`${pad}  <div className="card"><h4>Card ${i+1}</h4><p>Text</p></div>`).join('\n')}\n${pad}</div>\n`;
      case 'card':
        return `${pad}<div className="card">\n${pad}  <h4>${escapeHtml(p.title||'Card')}</h4>\n${pad}  <p>${escapeHtml(p.body||'Body')}</p>\n${p.cta?pad+`  <button>${escapeHtml(p.cta)}</button>\n` : ''}${pad}</div>\n`;
      default:
        return `${pad}<div>${escapeHtml(p.text||'Block')}</div>\n`;
    }
  }

  let out = `function GeneratedUI() {\n  return (\n    <div>\n`;
  ast.components.forEach(n => out += renderNode(n, 6));
  out += `    </div>\n  );\n}\n\nexport default GeneratedUI;\n`;
  return out;
}

/* -------------------------
   Fallback rule-based generator (offline)
------------------------- */
function generateStructureFromPrompt(prompt) {
  const p = (prompt || '').toLowerCase();
  const components = [];

  // hero / landing detection
  if (/hero|landing|headline|hero section/.test(p)) {
    components.push({ type: 'hero', props: { title: prompt.match(/title\s*:\s*([^,.;]+)/i)?.[1] || 'Welcome', subtitle: 'Short supporting copy', cta: 'Get started' } });
  }

  // navbar
  if (/nav|navbar|menu/.test(p)) {
    components.push({ type: 'navbar', props: { brand: 'Brand', links: ['Home','About','Contact'] }});
  }

  // form / login / signup
  if (/form|login|signup|sign up|email|password/.test(p)) {
    const fields = [];
    if (/name/.test(p)) fields.push('Full name');
    if (/email/.test(p)) fields.push('Email');
    if (/password/.test(p)) fields.push('Password');
    if (/phone/.test(p)) fields.push('Phone');
    if (fields.length === 0) fields.push('Email','Password');
    components.push({ type: 'form', props: { title: 'Sign in', fields, submit: 'Submit' }});
  }

  // todo / list
  if (/todo|todo app|task|tasks|list/.test(p)) {
    components.push({ type: 'form', props: { title: 'Add Task', fields: ['Task'], submit: 'Add' }});
    components.push({ type: 'list', props: { items: ['Sample task 1','Sample task 2'] }});
  }

  // grid / cards (detect count)
  if (/grid|cards|gallery|portfolio/.test(p)) {
    const match = p.match(/(\d+)\s+(cards|items|grid)/);
    const items = match ? Math.max(1, Math.min(12, parseInt(match[1],10))) : 3;
    components.push({ type: 'grid', props: { items }});
  }

  // single card request
  if (/card(?!.*grid)/.test(p) && !/cards/.test(p)) {
    components.push({ type: 'card', props: { title: 'Card title', body: 'Card body', cta: 'Learn more' }});
  }

  // fallback
  if (components.length === 0) {
    components.push({ type: 'card', props: { text: prompt || 'Simple block' }});
  }

  return { components };
}

/* -------------------------
   Main UI wiring
------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const description = $('#description');
  const generateBtn = $('#generateBtn');
  const heroGenerate = $('#heroGenerate');
  const clearBtn = $('#clearBtn');
  const preview = $('#preview');
  const codeOutput = $('#codeOutput');
  const modeSelect = $('#modeSelect');
  const exportBtn = $('#exportBtn');
  const statusEl = $('#status');
  const themeToggle = $('#themeToggle');

  let currentAST = { components: [] };
  let isGenerating = false;

  // Theme: load saved preference
  function applyTheme(theme) {
    if (theme === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    // Toggle emoji shows the *action* (if in dark, show sun to switch to light)
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  }
  const savedTheme = localStorage.getItem('gub_theme') || 'light';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    // animate briefly
    themeToggle.classList.add('rotate');
    setTimeout(()=> themeToggle.classList.remove('rotate'), 420);

    const theme = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(theme);
    localStorage.setItem('gub_theme', theme);
  });

  // Render current AST according to selected mode
  function renderCurrent() {
    renderStructure(currentAST, preview);
    if (modeSelect.value === 'html') {
      codeOutput.style.display = 'block';
      preview.style.display = 'none';
      codeOutput.textContent = astToHTML(currentAST);
    } else if (modeSelect.value === 'jsx') {
      codeOutput.style.display = 'block';
      preview.style.display = 'none';
      codeOutput.textContent = astToJSX(currentAST);
    } else {
      codeOutput.style.display = 'none';
      preview.style.display = 'grid';
    }
  }

  // Single generate handler used by both hero CTA and main generate btn
  async function handleGenerate() {
    if (isGenerating) return;
    const prompt = description.value.trim();
    if (!prompt) { alert('Please type a description (e.g. "Login form with Email and Password")'); return; }

    isGenerating = true;
    statusEl.textContent = 'Generating...';
    generateBtn.disabled = true;
    heroGenerate.disabled = true;
    generateBtn.textContent = 'Generating...';

    // Try backend first
    try {
      const res = await fetch('http://127.0.0.1:8000/generate-ui/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt })
      });

      if (!res.ok) throw new Error('Backend returned ' + res.status);
      const data = await res.json();
      // Expect data to be { components: [...] }
      if (data && Array.isArray(data.components)) currentAST = data;
      else if (data && data.components) currentAST = data;
      else currentAST = data; // trust backend format

      statusEl.textContent = 'Done (from backend)';
    } catch (err) {
      // Fallback to offline rule-based generator
      console.warn('Backend not reachable or error — falling back to local generator.', err);
      currentAST = generateStructureFromPrompt(prompt);
      statusEl.textContent = 'Done (local fallback)';
    } finally {
      isGenerating = false;
      generateBtn.disabled = false;
      heroGenerate.disabled = false;
      generateBtn.textContent = 'Generate';
      renderCurrent();
    }
  }

  // Hook both Generate buttons to the same handler
  generateBtn.addEventListener('click', handleGenerate);
  heroGenerate.addEventListener('click', handleGenerate);

  // Also allow Ctrl+Enter in textarea to generate
  description.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleGenerate();
  });

  clearBtn.addEventListener('click', () => {
    description.value = '';
    currentAST = { components: [] };
    preview.innerHTML = '';
    codeOutput.textContent = '';
    modeSelect.value = 'preview';
    renderCurrent();
    statusEl.textContent = 'Cleared';
  });

  modeSelect.addEventListener('change', renderCurrent);

  exportBtn.addEventListener('click', () => {
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Exported UI</title>
<style>
  body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:20px;background:#f8fafc;color:#0f172a}
  .card{border-radius:10px;padding:14px;background:#fff;border:1px solid #e6eef6;margin:10px 0}
  .button{background:#2563eb;color:white;padding:10px 14px;border-radius:8px;border:none}
  .form-field{margin-bottom:8px}
  input{padding:8px;border-radius:6px;border:1px solid #dbeafe;width:100%}
</style>
</head>
<body>
  <div id="root">
${astToHTML(currentAST)}
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-ui.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Preload helpful example text
  description.value = 'Login form with Email and Password';
  // Do not automatically call generate — user might prefer to click
  statusEl.textContent = 'Ready — try a description and press Generate (or Ctrl+Enter)';
});
