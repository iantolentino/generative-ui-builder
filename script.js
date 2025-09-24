/**
 * Generative UI Builder — Starter
 * - Rule-based plain-English -> UI component generator
 * - Live-editable preview
 * - Toggle to view generated HTML or JSX
 *
 * Author: Ian-style starter (you)
 * Notes:
 *  - This starter keeps logic simple and annotated so you can extend it.
 *  - Add an LLM by replacing `generateStructureFromPrompt` with an API call.
 */
 
/* -------------------------
   Utilities / DOM helpers
   ------------------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function escapeHtml(s){ return String(s)
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

/* -------------------------
   Simple AST structure:
   - components: array of nodes {type, props, children}
   ------------------------- */

function basicTemplatesForType(node) {
  // Convert a single node into DOM element (live preview)
  const type = node.type;
  const props = node.props || {};
  const el = document.createElement('div');

  switch(type) {
    case 'hero':
      el.className = 'hero';
      el.innerHTML = `<h2 contenteditable="true">${escapeHtml(props.title||'Title')}</h2>
                      <div contenteditable="true">${escapeHtml(props.subtitle||'Subtitle text')}</div>
                      <div style="margin-top:12px"><button class="button">${escapeHtml(props.cta||'Get started')}</button></div>`;
      break;

    case 'card':
      el.className = 'card';
      el.innerHTML = `<div class="card-title" contenteditable="true">${escapeHtml(props.title||'Card title')}</div>
                      <div contenteditable="true">${escapeHtml(props.body||'Short description')}</div>
                      ${props.cta ? `<div style="margin-top:12px"><button class="button">${escapeHtml(props.cta)}</button></div>` : ''}`;
      break;

    case 'form':
      el.className = 'card';
      el.innerHTML = `<div class="card-title">${escapeHtml(props.title||'Form')}</div>
        <div style="margin-top:8px">
          ${ (props.fields || ['Email','Password']).map(f=> `<div class="form-field"><label>${escapeHtml(f)}</label><input class="input" placeholder="${escapeHtml(f)}"/></div>`).join('') }
          <div style="margin-top:10px"><button class="button">${escapeHtml(props.submit||'Submit')}</button></div>
        </div>`;
      break;

    case 'grid':
      el.className = 'grid';
      const items = props.items || 3;
      for(let i=0;i<items;i++){
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div contenteditable="true" class="card-title">Card ${i+1}</div>
                          <div contenteditable="true">Description for card ${i+1}</div>`;
        el.appendChild(card);
      }
      break;

    case 'two-column':
      el.style.display = 'grid';
      el.style.gridTemplateColumns = '1fr 1fr';
      el.style.gap = '12px';
      const left = document.createElement('div');
      left.className = 'card';
      left.innerHTML = `<div contenteditable="true">Left content (image or text)</div>`;
      const right = document.createElement('div');
      right.className = 'card';
      right.innerHTML = `<div contenteditable="true">Right content (form or text)</div>`;
      el.appendChild(left);
      el.appendChild(right);
      break;

    default:
      // fallback: generic block
      el.className = 'card';
      el.innerHTML = `<div contenteditable="true">${escapeHtml(props.text || 'Block')}</div>`;
      break;
  }

  return el;
}

/* Convert AST -> preview DOM */
function renderStructure(ast, container) {
  container.innerHTML = '';
  ast.components.forEach(node => {
    const nodeEl = basicTemplatesForType(node);
    container.appendChild(nodeEl);
  });
}

/* Convert AST -> HTML string (pretty) */
function astToHTML(ast) {
  // generate minimal wrapper and inner HTML from preview DOM by creating elements
  const temp = document.createElement('div');
  ast.components.forEach(node => {
    const dom = basicTemplatesForType(node);
    temp.appendChild(dom);
  });
  // return inner HTML (trimmed)
  return temp.innerHTML;
}

/* Convert AST -> React JSX (very simple, not exhaustive) */
function astToJSX(ast) {
  function renderNode(node, indent=2) {
    const pad = ' '.repeat(indent);
    switch(node.type) {
      case 'hero':
        return `${pad}<section className="hero">
${pad}  <h2>${escapeHtml(node.props.title || 'Title')}</h2>
${pad}  <p>${escapeHtml(node.props.subtitle || 'Subtitle text')}</p>
${pad}  <button>${escapeHtml(node.props.cta || 'Get started')}</button>
${pad}</section>\n`;
      case 'card':
        return `${pad}<div className="card">
${pad}  <h3>${escapeHtml(node.props.title || 'Card title')}</h3>
${pad}  <p>${escapeHtml(node.props.body || 'Short description')}</p>
${node.props.cta ? `${pad}  <button>${escapeHtml(node.props.cta)}</button>\n` : ''}${pad}</div>\n`;
      case 'form':
        const fields = node.props.fields || ['Email','Password'];
        return `${pad}<form className="card">
${pad}  <h3>${escapeHtml(node.props.title || 'Form')}</h3>
${fields.map(f => `${pad}  <label>${escapeHtml(f)}<input placeholder="${escapeHtml(f)}"/></label>`).join('\n')}
${pad}  <button>${escapeHtml(node.props.submit || 'Submit')}</button>
${pad}</form>\n`;
      case 'grid':
        return `${pad}<div className="grid">
${Array.from({length: node.props.items||3}).map((_,i)=> `${pad}  <div className="card"><h4>Card ${i+1}</h4><p>Short text</p></div>`).join('\n')}
${pad}</div>\n`;
      default:
        return `${pad}<div className="card">${escapeHtml(node.props.text || 'Block')}</div>\n`;
    }
  }

  let out = `function GeneratedUI(){\n  return (\n    <div>\n`;
  ast.components.forEach(n=> out += renderNode(n, 4));
  out += `    </div>\n  )\n}\n\nexport default GeneratedUI;\n`;
  return out;
}

/* -------------------------
   Rule-based "NLP" parser
   (Simple heuristics to map words -> components)
   Replace this function with an LLM call later.
   ------------------------- */
function generateStructureFromPrompt(prompt) {
  // lowercase quick map
  const p = (prompt || '').toLowerCase();

  // basic detection flags
  const wantsHero = /hero|hero section|big title|headline/.test(p);
  const wantsForm = /form|signup|login|email|password|sign up|sign in|subscribe/.test(p);
  const wantsGrid = /grid|cards|card|portfolio|gallery/.test(p);
  const wantsTwoCol = /two-column|two column|left|right|image.*text|image and text/.test(p);
  const wantsCard = /card(?!.*grid)/.test(p); // card not in grid

  // Extract quick props (very naive)
  const titleMatch = prompt.match(/title\s*:\s*([^\n,.;]+)/i);
  const ctaMatch = prompt.match(/(cta|button|button text)\s*:\s*([^\n,.;]+)/i);

  const components = [];

  if (wantsHero || /landing|landing page/.test(p)) {
    components.push({type: 'hero', props: { title: (titleMatch && titleMatch[1]) || 'Welcome', subtitle: 'Short supporting copy', cta: (ctaMatch && ctaMatch[2]) || 'Get started' }});
  }

  if (wantsTwoCol) {
    components.push({type: 'two-column', props:{ }});
  }

  if (wantsForm) {
    // detect fields
    const fields = [];
    if (/email/.test(p)) fields.push('Email');
    if (/password/.test(p)) fields.push('Password');
    if (/name/.test(p)) fields.unshift('Full name');
    if (fields.length === 0) fields.push('Email','Password');
    components.push({type: 'form', props: { title: 'Sign up', fields, submit: (ctaMatch && ctaMatch[2]) || 'Submit'}});
  }

  if (wantsGrid) {
    // find number of cards if specified (like "3 cards")
    const numMatch = prompt.match(/(\d+).*cards?/i);
    const items = numMatch ? Math.max(1, Math.min(12, parseInt(numMatch[1],10))) : 3;
    components.push({type: 'grid', props: { items }});
  }

  if (wantsCard && !wantsGrid) {
    components.push({type: 'card', props: { title: 'Card title', body: 'Card body', cta: 'Learn more' }});
  }

  // fallback: if nothing detected, generate a simple card so user sees something
  if (components.length === 0) {
    components.push({type: 'card', props: { text: prompt || 'Simple block' }});
  }

  return { components };
}

/* -------------------------
   UI wiring
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const description = $('#description');
  const generateBtn = $('#generateBtn');
  const clearBtn = $('#clearBtn');
  const preview = $('#preview');
  const codeOutput = $('#codeOutput');
  const modeSelect = $('#modeSelect');
  const exportBtn = $('#exportBtn');
  const useLLM = $('#useLLM');

  let currentAST = { components: [] };

  function showPreviewMode() {
    codeOutput.style.display = 'none';
    preview.style.display = 'block';
  }
  function showCodeMode() {
    preview.style.display = 'none';
    codeOutput.style.display = 'block';
  }

  modeSelect.addEventListener('change', () => {
    if (modeSelect.value === 'preview') showPreviewMode();
    else showCodeMode();
    renderCurrent();
  });

  generateBtn.addEventListener('click', () => {
    const prompt = description.value.trim();
    currentAST = generateStructureFromPrompt(prompt);
    renderCurrent();
  });

  clearBtn.addEventListener('click', () => {
    description.value = '';
    currentAST = { components: [] };
    preview.innerHTML = '';
    codeOutput.innerText = '';
  });

  exportBtn.addEventListener('click', () => {
    // Build a simple standalone HTML file
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Exported UI</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>${fetchExportCSS()}</style>
</head>
<body>
  <div id="root">
  ${astToHTML(currentAST)}
  </div>
</body>
</html>`;
    const blob = new Blob([html], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-ui.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  useLLM.addEventListener('click', () => {
    // This is a placeholder. In future you can:
    // 1) send `description.value` to your backend that calls an LLM
    // 2) backend returns an AST JSON matching our {components: [...] } format
    // 3) set currentAST to the returned AST and call renderCurrent()
    alert("LLM hook placeholder: implement an API call to send the prompt and receive an AST JSON.\nSee README for details.");
  });

  function renderCurrent() {
    // Render preview
    renderStructure(currentAST, preview);

    // Post-process: make contenteditable interactive
    // (already set in templates). We could attach listeners here if needed.

    // Render code (HTML or JSX)
    if (modeSelect.value === 'html') {
      codeOutput.innerText = astToHTML(currentAST);
      showCodeMode();
    } else if (modeSelect.value === 'jsx') {
      codeOutput.innerText = astToJSX(currentAST);
      showCodeMode();
    } else {
      showPreviewMode();
    }
  }

  // Load a small example on start
  description.value = 'Hero section with headline and subtitle, a big blue CTA, and a signup form with Email and Password';
  generateBtn.click();
});

/* -------------------------
   helper: tiny CSS string included in exported HTML
   keeps exports visually similar
   ------------------------- */
function fetchExportCSS() {
  return `
  body{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; margin:20px; background:#f8fafc; color:#0f1724}
  .hero{padding:28px;border-radius:12px;background:linear-gradient(90deg,#dbeafe,#f0f9ff);text-align:center}
  .hero h2{margin:0 0 8px}
  .card{border-radius:10px;padding:14px;background:#fff;border:1px solid #e6eef6;margin:10px 0}
  .button{background:#2563eb;color:white;padding:10px 14px;border-radius:8px;border:none}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
  .card-title{font-weight:700;margin-bottom:6px}
  .form-field{margin-bottom:8px}
  input{padding:8px;border-radius:6px;border:1px solid #dbeafe;width:100%}
  `;
}
