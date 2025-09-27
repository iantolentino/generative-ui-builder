/* script.js — Generative UI Builder
   - Fixed wiring, robust fallback, props editor, samples, theme toggle
   - Send { text, prompt } to backend; fall back to local generator
*/

/* Helpers */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
function log(...a){ console.log('[GUB]', ...a); }
function escapeHtml(s){ return String(s || '').replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
function parseArrayInput(val){
  if (Array.isArray(val)) return val;
  if (typeof val !== 'string') return [String(val)];
  return val.split(',').map(x => x.trim()).filter(Boolean);
}

/* Sample prompts for quick testing */
const SAMPLE_PROMPTS = [
  "Login form with Email and Password",
  "Hero section with headline and CTA",
  "Todo app with list and add",
  "Pricing plans 3",
  "Contact form",
  "FAQ section",
  "Testimonials",
  "Header with nav",
  "Button"
];

/* Templates - returns DOM element for a node */
function basicTemplatesForType(node) {
  const type = node.type;
  const props = node.props || {};
  const el = document.createElement('div');
  el.className = 'card';
  el.tabIndex = 0;
  el.dataset.type = type;

  switch(type) {
    case 'hero':
      el.innerHTML = `<div class="card-title">${escapeHtml(props.title || 'Hero Title')}</div>
        <div>${escapeHtml(props.subtitle || 'Supporting subtitle')}</div>
        <div style="margin-top:8px"><button class="button">${escapeHtml(props.cta || 'Get started')}</button></div>`;
      break;

    case 'navbar':
      el.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center">
          <strong>${escapeHtml(props.brand || 'Brand')}</strong>
          <div>${(props.links || ['Home','About','Contact']).map(l => `<span style="margin-left:8px">${escapeHtml(l)}</span>`).join('')}</div>
        </div>`;
      break;

    case 'form':
      el.innerHTML = `<div class="card-title">${escapeHtml(props.title || 'Form')}</div>
        ${(props.fields || ['Email','Password']).map(f =>
          `<div class="form-field"><label>${escapeHtml(f)}</label><input placeholder="${escapeHtml(f)}"/></div>`
        ).join('')}
        <div style="margin-top:10px"><button class="button">${escapeHtml(props.submit || 'Submit')}</button></div>`;
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
        c.innerHTML = `<div class="card-title">Card ${i+1}</div><div>Description</div>`;
        gridEl.appendChild(c);
      }
      el.innerHTML = '';
      el.appendChild(gridEl);
      break;

    case 'list':
      el.innerHTML = `<ul>${(props.items || []).map(it=>`<li>${escapeHtml(it)}</li>`).join('')}</ul>`;
      break;

    case 'card':
      el.innerHTML = `<div class="card-title">${escapeHtml(props.title || 'Card')}</div>
        <div>${escapeHtml(props.body || 'Body text')}</div>
        ${props.cta ? `<div style="margin-top:8px"><button class="button">${escapeHtml(props.cta)}</button></div>` : ''}`;
      break;

    case 'button':
      el.innerHTML = `<div><button class="button">${escapeHtml(props.text || 'Click')}</button></div>`;
      break;

    case 'footer':
      el.innerHTML = `<div>${escapeHtml(props.text || '© 2026 Your Company')}</div>`;
      break;

    case 'header':
      el.innerHTML = `
        <header style="display:flex;justify-content:space-between;align-items:center">
          <div class="logo">${escapeHtml(props.logo || 'LOGO')}</div>
          <nav>${(props.links || ['Home','Services','Contact']).map(l => `<span style="margin-left:10px">${escapeHtml(l)}</span>`).join('')}</nav>
        </header>`;
      break;

    case 'hero-image':
      el.innerHTML = `
        <section class="hero">
          <h2>${escapeHtml(props.title || 'Big Headline')}</h2>
          <p>${escapeHtml(props.subtitle || 'Supporting copy')}</p>
          <img src="${props.image || 'https://via.placeholder.com/400x200'}" alt="Hero image" style="margin-top:12px;max-width:100%;border-radius:8px"/>
          <div style="margin-top:8px"><button class="button">${escapeHtml(props.cta || 'Get Started')}</button></div>
        </section>`;
      break;

    case 'pricing':
      el.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
          ${(props.plans || ['Basic','Pro','Enterprise']).map(p => `
            <div class="card"><div class="card-title">${escapeHtml(p)}</div>
            <div>$${Math.floor(Math.random()*50)+10}/mo</div>
            <button class="button">Choose</button></div>`).join('')}
        </div>`;
      break;

    case 'testimonial':
      el.innerHTML = `
        <blockquote style="font-style:italic">
          "${escapeHtml(props.quote || 'This product changed my life!')}"
        </blockquote>
        <div style="margin-top:8px">— <span>${escapeHtml(props.author || 'Happy User')}</span></div>`;
      break;

    case 'features':
      el.innerHTML = `
        <ul>${(props.items || ['Fast','Secure','Reliable']).map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
      break;

    case 'contact-form':
      el.innerHTML = `
        <form class="card" onsubmit="return false;">
          <label>Name<input type="text" placeholder="Your name"></label>
          <label>Email<input type="email" placeholder="Your email"></label>
          <label>Message<textarea placeholder="Your message"></textarea></label>
          <button class="button">Send</button>
        </form>`;
      break;

    case 'faq':
      el.innerHTML = `
        ${(props.items || [{q:'Question?',a:'Answer.'}]).map(item=>`
          <details><summary>${escapeHtml(item.q)}</summary>
          <p>${escapeHtml(item.a)}</p></details>`).join('')}`;
      break;

    default:
      el.innerHTML = `<div>${escapeHtml(props.text || 'Block')}</div>`;
      break;
  }

  return el;
}

/* Render preview DOM from AST */
function renderStructure(ast, container) {
  container.innerHTML = '';
  if (!ast || !Array.isArray(ast.components)) return;
  ast.components.forEach((node, i) => {
    const el = basicTemplatesForType(node);
    el.addEventListener('click', (ev) => { ev.stopPropagation(); openPropsPanel(node, i); });
    container.appendChild(el);
  });
}

/* Props Panel to edit node.props */
function openPropsPanel(node, index) {
  const panel = $('#propsPanel');
  const form = $('#propsForm');
  const title = $('#propsTitle');
  form.innerHTML = '';
  title.textContent = `Edit: ${node.type}`;

  // Show each prop
  const props = node.props || {};
  Object.keys(props).forEach(key => {
    const row = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = key;
    const input = document.createElement('input');
    const val = props[key];
    input.value = Array.isArray(val) ? val.join(', ') : String(val);
    input.addEventListener('input', () => {
      // Store arrays if the original looked like an array or contains commas
      if (input.value.includes(',') || Array.isArray(val)) {
        node.props[key] = parseArrayInput(input.value);
      } else if (typeof val === 'number') {
        const n = Number(input.value);
        node.props[key] = isNaN(n) ? input.value : n;
      } else {
        node.props[key] = input.value;
      }
      renderStructure(currentAST, $('#preview'));
    });
    row.appendChild(label);
    row.appendChild(input);
    form.appendChild(row);
  });

  // add quick save for new prop
  $('#addPropBtn').onclick = () => {
    const k = prompt('Property name (e.g., cta, title, items):');
    if (!k) return;
    node.props = node.props || {};
    node.props[k] = '';
    openPropsPanel(node, index); // reopen to refresh
  };

  // remove component
  $('#removeCompBtn').onclick = () => {
    if (!confirm('Remove this component?')) return;
    currentAST.components.splice(index, 1);
    renderCurrent();
    panel.style.display = 'none';
  };

  panel.style.display = 'block';
}

/* AST -> HTML */
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

/* AST -> JSX */
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

/* Local fallback generator (rule-based) */
function generateStructureFromPrompt(prompt) {
  const p = (prompt || '').toLowerCase();
  const components = [];

  // hero (with image)
  if (/hero|landing|headline/.test(p)) {
    if (/image/.test(p)) {
      components.push({ type: 'hero-image', props: { title: 'Welcome!', subtitle: 'With a hero image', cta: 'Get Started', image: 'https://via.placeholder.com/600x300' } });
    } else {
      components.push({ type: 'hero', props: { title: 'Welcome!', subtitle: 'Your subtitle here', cta: 'Get Started' } });
    }
  }

  // header / navbar
  if (/header/.test(p)) {
    components.push({ type: 'header', props: { logo: 'LOGO', links: ['Home','Services','Contact'] } });
  } else if (/nav|navbar|menu/.test(p)) {
    components.push({ type: 'navbar', props: { brand: 'Brand', links: ['Home','About','Contact'] } });
  }

  // login / form
  if (/login|signin|sign in|signup|sign up|email|password/.test(p)) {
    components.push({ type: 'form', props: { title: 'Sign in', fields: ['Email','Password'], submit: 'Login' } });
  }

  // todo / list
  if (/todo|task|tasks|list/.test(p)) {
    components.push({ type: 'form', props: { title: 'Add Task', fields: ['Task'], submit: 'Add' } });
    components.push({ type: 'list', props: { items: ['Sample task 1', 'Sample task 2'] } });
  }

  // button
  if (/button/.test(p) && !/buttons/.test(p)) {
    components.push({ type: 'button', props: { text: 'Click me' } });
  }

  // pricing/plans
  if (/pricing|plans|subscription/.test(p)) {
    const count = (p.match(/(\d+)\s*(plans|cards|columns|items)/) || [])[1] || 3;
    components.push({ type: 'pricing', props: { plans: Array.from({length: Math.min(6, Math.max(1, Number(count)))}, (_,i)=>['Basic','Pro','Enterprise'][i] || `Plan ${i+1}`) } });
  }

  // testimonials
  if (/testimonial|review|feedback/.test(p)) {
    components.push({ type: 'testimonial', props: { quote: 'This is amazing!', author: 'Happy Customer' } });
  }

  // features
  if (/feature|benefit|why choose/.test(p)) {
    components.push({ type: 'features', props: { items: ['Fast','Secure','Scalable'] } });
  }

  // faq
  if (/faq|questions|help/.test(p)) {
    components.push({ type: 'faq', props: { items: [{q:'What is this?', a:'A demo FAQ answer.'}, {q:'How does it work?', a:'Describe and generate.'}] } });
  }

  // grid/gallery
  if (/grid|gallery|cards/.test(p)) {
    const m = p.match(/(\d+)\s+(cards|items|grid)/);
    const items = m ? Math.max(1, Math.min(12, Number(m[1]))) : 3;
    components.push({ type: 'grid', props: { items } });
  }

  // single card
  if (/card(?!.*cards)/.test(p)) {
    components.push({ type: 'card', props: { title: 'Card title', body: 'Short description', cta: 'Learn more' } });
  }

  // footer
  if (/footer/.test(p)) {
    components.push({ type: 'footer', props: { text: '© 2026 My Company' } });
  }

  // fallback
  if (components.length === 0) {
    components.push({ type: 'card', props: { text: prompt || 'Simple block' } });
  }

  return { components };
}

/* Main wiring */
let currentAST = { components: [] };
let isGenerating = false;

document.addEventListener('DOMContentLoaded', () => {
  const description = $('#description');
  const generateBtn = $('#generateBtn');
  const heroGenerate = $('#heroGenerate');
  const preview = $('#preview');
  const codeOutput = $('#codeOutput');
  const modeSelect = $('#modeSelect');
  const exportBtn = $('#exportBtn');
  const statusEl = $('#status');
  const themeToggle = $('#themeToggle');
  const propsPanel = $('#propsPanel');
  const closeProps = $('#closeProps');

  // populate samples UI
  const samplesWrap = $('#samples');
  SAMPLE_PROMPTS.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'sample-chip';
    btn.type = 'button';
    btn.textContent = s;
    btn.addEventListener('click', () => {
      description.value = s;
      handleGenerate();
    });
    samplesWrap.appendChild(btn);
  });

  // Theme
  function applyTheme(theme) {
    if (theme === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  }
  applyTheme(localStorage.getItem('gub_theme') || 'light');
  themeToggle.addEventListener('click', () => {
    themeToggle.classList.add('rotate');
    setTimeout(()=> themeToggle.classList.remove('rotate'), 420);
    const theme = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(theme);
    localStorage.setItem('gub_theme', theme);
  });

  // Render current AST
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

  // Generate handler: try backend first, fallback to local
  async function handleGenerate() {
    if (isGenerating) return;
    const prompt = description.value.trim();
    if (!prompt) { alert('Please type a description'); return; }

    isGenerating = true;
    statusEl.textContent = 'Generating...';
    generateBtn.disabled = true;
    heroGenerate.disabled = true;

    try {
      const res = await fetch('http://127.0.0.1:8000/generate-ui/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // send both keys to maximize compatibility with your backend
        body: JSON.stringify({ text: prompt })
      });

      if (!res.ok) throw new Error('Backend ' + res.status);
      const data = await res.json();
      log('backend response', data);

      // Accept multiple shapes: { components: [...] } or array or object
      if (data && Array.isArray(data.components)) {
        currentAST = { components: data.components };
      } else if (data && Array.isArray(data)) {
        currentAST = { components: data };
      } else if (data && data.components) {
        currentAST = { components: data.components };
      } else {
        // unknown shape -> try interpret
        currentAST = data && data.components ? data : generateStructureFromPrompt(prompt);
      }
      statusEl.textContent = 'Done (backend)';
    } catch (err) {
      log('backend failed, falling back locally', err);
      currentAST = generateStructureFromPrompt(prompt);
      statusEl.textContent = 'Done (local)';
    } finally {
      isGenerating = false;
      generateBtn.disabled = false;
      heroGenerate.disabled = false;
      renderCurrent();
      log('currentAST', currentAST);
    }
  }

  generateBtn.addEventListener('click', handleGenerate);
  heroGenerate.addEventListener('click', handleGenerate);

  // Ctrl/Cmd+Enter to generate
  description.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleGenerate();
  });

  // Clear
  $('#clearBtn').addEventListener('click', () => {
    description.value = '';
    currentAST = { components: [] };
    renderCurrent();
    statusEl.textContent = 'Cleared';
  });

  // mode select
  modeSelect.addEventListener('change', renderCurrent);

  // export simple HTML file
  exportBtn.addEventListener('click', () => {
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Exported UI</title>
<style>
/* Minimal export styles */
body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:20px;background:#f8fafc;color:#0f172a}
.card{border-radius:10px;padding:14px;background:#fff;border:1px solid #e6eef6;margin:10px 0}
.button{background:#2563eb;color:white;padding:10px 14px;border-radius:8px;border:none}
</style>
</head>
<body>
${astToHTML(currentAST)}
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

  // props panel close
  closeProps.addEventListener('click', () => $('#propsPanel').style.display = 'none');

  // Clicking outside preview closes the panel
  document.addEventListener('click', (e) => {
    const panel = $('#propsPanel');
    if (!panel) return;
    if (panel.style.display === 'none') return;
    const target = e.target;
    if (!panel.contains(target) && !$('#preview').contains(target)) {
      panel.style.display = 'none';
    }
  });

  // initial state
  description.value = 'Login form with Email and Password';
  statusEl.textContent = 'Ready — try a description (or press Generate / Ctrl+Enter)';

  // initial render
  renderCurrent();
});
