/* -------------------------
   Utilities / DOM helpers
   ------------------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function escapeHtml(s){ return String(s)
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

/* -------------------------
   Templates → DOM preview
   ------------------------- */
function basicTemplatesForType(node) {
  const type = node.type;
  const props = node.props || {};
  const el = document.createElement('div');

  switch(type) {
    case 'form':
      el.className = 'card';
      el.innerHTML = `<div class="card-title">${escapeHtml(props.title||'Form')}</div>
        <div style="margin-top:8px">
          ${(props.fields||['Email','Password']).map(f=>
            `<div class="form-field"><label>${escapeHtml(f)}</label><input class="input" placeholder="${escapeHtml(f)}"/></div>`
          ).join('')}
          <div style="margin-top:10px"><button class="button">${escapeHtml(props.submit||'Submit')}</button></div>
        </div>`;
      break;

    case 'list':
      el.className = 'card';
      el.innerHTML = `<ul>${(props.items||[]).map(i=>`<li contenteditable="true">${escapeHtml(i)}</li>`).join('')}</ul>`;
      break;

    case 'card':
      el.className = 'card';
      el.innerHTML = `<div class="card-title" contenteditable="true">${escapeHtml(props.title || 'Card title')}</div>
                      <div contenteditable="true">${escapeHtml(props.body || 'Card body')}</div>`;
      break;

    case 'button':
      el.innerHTML = `<button class="button" contenteditable="true">${escapeHtml(props.text || 'Click me')}</button>`;
      break;

    case 'navbar':
      el.className = 'navbar';
      el.innerHTML = `<div class="navbar-left" contenteditable="true">${escapeHtml(props.brand || 'Brand')}</div>
                      <div class="navbar-right">
                        ${(props.links||['Home','About','Contact']).map(l=>`<a href="#" contenteditable="true">${escapeHtml(l)}</a>`).join(' ')}
                      </div>`;
      break;

    case 'hero':
      el.className = 'hero';
      el.innerHTML = `<h2 contenteditable="true">${escapeHtml(props.title || 'Big Headline')}</h2>
                      <p contenteditable="true">${escapeHtml(props.subtitle || 'Subtitle text goes here')}</p>
                      <button class="button">${escapeHtml(props.cta || 'Get Started')}</button>`;
      break;

    case 'footer':
      el.className = 'footer';
      el.innerHTML = `<p contenteditable="true">${escapeHtml(props.text || '© 2025 My Website')}</p>`;
      break;

    case 'grid':
      el.className = 'grid';
      const items = props.items || 3;
      for (let i=0; i<items; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="card-title" contenteditable="true">Card ${i+1}</div>
                          <div contenteditable="true">Description for card ${i+1}</div>`;
        el.appendChild(card);
      }
      break;

    default:
      el.className = 'card';
      el.innerHTML = `<div contenteditable="true">${escapeHtml(props.text || 'Block')}</div>`;
      break;
  }

  return el;
}


/* Render preview */
function renderStructure(ast, container) {
  container.innerHTML = '';
  ast.components.forEach(node => {
    const nodeEl = basicTemplatesForType(node);
    container.appendChild(nodeEl);
  });
}

/* -------------------------
   AST → HTML
   ------------------------- */
function astToHTML(ast) {
  function renderNode(node) {
    const props = node.props || {};
    switch (node.type) {
      case 'form':
        return `<form class="card">
  <h3>${escapeHtml(props.title || 'Form')}</h3>
  ${(props.fields || ['Email','Password']).map(f =>
    `<label>${escapeHtml(f)}<input placeholder="${escapeHtml(f)}"/></label>`
  ).join('\n  ')}
  <button>${escapeHtml(props.submit || 'Submit')}</button>
</form>`;
      case 'list':
        return `<div class="card">
  <ul>
    ${(props.items || []).map(i => `<li>${escapeHtml(i)}</li>`).join('\n    ')}
  </ul>
</div>`;
      case 'card':
        return `<div class="card">${escapeHtml(props.text || 'Block')}</div>`;
      default:
        return `<div class="card">${escapeHtml(props.text || 'Block')}</div>`;
    }
  }
  return ast.components.map(renderNode).join('\n\n');
}

/* -------------------------
   AST → JSX
   ------------------------- */
function astToJSX(ast) {
  function renderNode(node, indent = 2) {
    const pad = ' '.repeat(indent);
    const props = node.props || {};
    switch (node.type) {
      case 'form':
        return `${pad}<form className="card">
${pad}  <h3>${escapeHtml(props.title || 'Form')}</h3>
${(props.fields || ['Email','Password']).map(f =>
  `${pad}  <label>${escapeHtml(f)}<input placeholder="${escapeHtml(f)}" /></label>`
).join('\n')}
${pad}  <button>${escapeHtml(props.submit || 'Submit')}</button>
${pad}</form>`;
      case 'list':
        return `${pad}<div className="card">
${pad}  <ul>
${(props.items || []).map(i => `${pad}    <li>${escapeHtml(i)}</li>`).join('\n')}
${pad}  </ul>
${pad}</div>`;
      case 'card':
        return `${pad}<div className="card">${escapeHtml(props.text || 'Block')}</div>`;
      default:
        return `${pad}<div className="card">${escapeHtml(props.text || 'Block')}</div>`;
    }
  }

  let out = `function GeneratedUI() {\n  return (\n    <div>\n`;
  ast.components.forEach(n => {
    out += renderNode(n, 6) + '\n';
  });
  out += `    </div>\n  );\n}\n\nexport default GeneratedUI;\n`;
  return out;
}

/* -------------------------
   UI Wiring
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const description = $('#description');
  const generateBtn = $('#generateBtn');
  const clearBtn = $('#clearBtn');
  const preview = $('#preview');
  const codeOutput = $('#codeOutput');
  const modeSelect = $('#modeSelect');
  const exportBtn = $('#exportBtn');

  let currentAST = { components: [] };

  function showPreviewMode() {
    codeOutput.style.display = 'none';
    preview.style.display = 'block';
  }
  function showCodeMode() {
    preview.style.display = 'none';
    codeOutput.style.display = 'block';
  }

  modeSelect.addEventListener('change', renderCurrent);

  // 🔥 Call FastAPI backend here
  generateBtn.addEventListener('click', async () => {
    const prompt = description.value.trim();
    if (!prompt) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-ui/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt })
      });
      const data = await res.json();
      console.log("Backend response:", data);

      currentAST = data;
      renderCurrent();
    } catch (err) {
      console.error("Error:", err);
      alert("⚠️ Backend not reachable. Is FastAPI running?");
    }
  });

  clearBtn.addEventListener('click', () => {
    description.value = '';
    currentAST = { components: [] };
    preview.innerHTML = '';
    codeOutput.innerText = '';
  });

  exportBtn.addEventListener('click', () => {
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Exported UI</title>
<style>
  body{font-family:Inter,system-ui,sans-serif;margin:20px;background:#f8fafc;color:#0f172a}
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

  function renderCurrent() {
    // render preview always
    renderStructure(currentAST, preview);

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

  // preload example
  description.value = 'Login form';
  generateBtn.click();
});
