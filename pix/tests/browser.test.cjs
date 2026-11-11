// Opcional: Node 22+ e uma sessão isolada do agent-browser, sem dependências do projeto.
// UNAPI_CDP_URL=<agent-browser get cdp-url> node --test pix/tests/browser.test.cjs
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { writeFileSync } = require("node:fs");
const { join } = require("node:path");

const endpoint = process.env.UNAPI_CDP_URL;
const base = process.env.UNAPI_TEST_URL || "http://127.0.0.1:8000";
const screenshots = process.env.UNAPI_SCREENSHOTS;
let socket, sessionId, serial = 0, navigation = 0;
const pending = new Map(), errors = [];

function command(method, params = {}, root = false) {
  return new Promise((resolve, reject) => {
    const id = ++serial;
    const timeout = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 10000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId && !root ? { sessionId } : {}) }));
  });
}
async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
const settle = () => evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
async function until(expression) {
  for (let i = 0; i < 100; i++) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  throw Error(`Condição não atendida: ${expression}`);
}
async function open(path = "/pix/") {
  const url = new URL(path, base); url.searchParams.set("browser-test", String(++navigation));
  await command("Page.navigate", { url: url.href });
  await until(`location.href === ${JSON.stringify(url.href)} && document.readyState === 'complete' && Boolean(document.querySelector('[data-pix-heading]'))`);
  await evaluate("document.fonts.ready.then(() => true)");
  await settle();
}
async function click(selector) {
  await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e || e.disabled) throw Error('Controle indisponível: ' + ${JSON.stringify(selector)}); e.scrollIntoView({block:'center',inline:'nearest'}); })()`);
  await settle();
  const point = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}), r = e.getBoundingClientRect(), x = r.x+r.width/2, y = r.y+r.height/2, hit = document.elementFromPoint(x,y); if (!e.contains(hit)) throw Error('Controle encoberto: ' + ${JSON.stringify(selector)}); return {x,y}; })()`);
  await command("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  await settle();
}
async function fill(selector, value) {
  await click(selector);
  await evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)}); e.value=${JSON.stringify(value)}; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await settle();
}
async function key(key, code = key) {
  await command("Input.dispatchKeyEvent", { type: "keyDown", key, code });
  await command("Input.dispatchKeyEvent", { type: "keyUp", key, code });
  await settle();
}
async function touchDrag(selector, distance = 320) {
  const point = await evaluate(`(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:r.x+r.width/2,y:r.bottom-80}; })()`);
  await command("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  for (let step = 1; step <= 8; step++) {
    await command("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x, y: point.y - distance * step / 8 }] });
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  await command("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await settle();
}
const screen = () => evaluate("document.body.dataset.pixScreen");
const content = () => evaluate("document.querySelector('#pix-app').innerText");
async function home() {
  for (let i = 0; i < 16 && await screen() !== "home"; i++) {
    if (await screen() === "welcome") await click('[data-action="enter-bank"]');
    else await key("Escape");
  }
  assert.equal(await screen(), "home");
}
async function balance(expected) {
  await home();
  const value = await evaluate("document.querySelector('.bank-balance > strong').textContent.replace(/[^0-9]/g,'')");
  assert.equal(Number(value), expected);
}
async function layout(name, width) {
  await settle();
  await evaluate("Promise.all(document.getAnimations().filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished)).then(()=>true)");
  const issues = await evaluate(`(() => {
    const issues=[], app=document.querySelector('#pix-app'), flow=app.querySelector('.bank-content,.bank-home-scroll'), footer=app.querySelector('.bank-actions,.bank-nav');
    if(document.documentElement.scrollWidth>innerWidth+1) issues.push('overflow da página');
    if(app.scrollWidth>app.clientWidth+1) issues.push('overflow do aplicativo');
    if(flow && flow.scrollWidth>flow.clientWidth+1) issues.push('overflow do conteúdo');
    if(flow && footer && flow.getBoundingClientRect().bottom>footer.getBoundingClientRect().top+1) issues.push('rodapé sobre conteúdo');
    for(const e of app.querySelectorAll('button,input,select,textarea')) {
      const target=e.matches('[type=radio]') ? e.closest('label'):e;
      if(!target || !target.getClientRects().length)continue;
      const r=target.getBoundingClientRect();
      if(r.width<43 || r.height<43)issues.push('alvo pequeno: '+(target.textContent||e.id));
      if(e.scrollWidth>e.clientWidth+2 && !e.matches('input,select,textarea'))issues.push('texto excede controle: '+e.textContent);
    }
    for(const e of app.querySelectorAll('h1,.bank-shortcuts strong,.bank-bill strong,.bank-row-copy strong')){
      const range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect(),r=e.getBoundingClientRect();
      if(text.left<r.left-1 || text.right>r.right+1)issues.push('texto excede coluna: '+e.textContent);
    }
    if([...document.images].some(img=>!img.complete||img.naturalWidth===0))issues.push('imagem ausente');
    return issues;
  })()`);
  assert.deepEqual(issues, [], `${width}px ${name}: ${issues.join('; ')}`);
  if (screenshots) {
    const capture = await command("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(screenshots, `unapi-${width}-${name}.png`), Buffer.from(capture.data, "base64"));
  }
}
async function chooseBill(id, later = false) {
  await home(); await click('[data-screen="pay"]');
  await click(`[data-action="bill"][data-id="${id}"]`);
  await click('[data-action="bill-start"]');
  if (later) await click('[name="when"][value="later"]');
  await click('button[type="submit"]');
}
async function panelAction(selector) {
  const mobile = await evaluate("getComputedStyle(document.querySelector('.pix-tools-toggle')).display !== 'none'");
  if (mobile) await click('.pix-tools-toggle');
  await click(selector);
}

before(async () => {
  if (!endpoint) return;
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id); pending.delete(message.id); clearTimeout(item.timeout);
      if (message.error) item.reject(Error(message.error.message)); else item.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") errors.push(message.params.args.map(arg => arg.value).join(" "));
    if (message.method === "Network.responseReceived" && message.params.response.status >= 400) errors.push(`${message.params.response.status} ${message.params.response.url}`);
  });
  const { targetInfos } = await command("Target.getTargets", {}, true);
  const target = targetInfos.find(item => item.type === "page" && item.url.startsWith(base));
  assert.ok(target, "Abra o banco no agent-browser antes dos testes.");
  sessionId = (await command("Target.attachToTarget", { targetId: target.targetId, flatten: true }, true)).sessionId;
  await command("Runtime.enable"); await command("Page.enable"); await command("Network.enable");
  await command("Network.setCacheDisabled", { cacheDisabled: true });
  await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
});
after(async () => {
  if (!socket) return;
  await command("Target.detachFromTarget", { sessionId }, true);
  socket.close();
});

for (const [width, height] of [[360, 800], [390, 844], [430, 932], [1440, 1000]]) {
  test(`jornadas cotidianas completas em ${width}px`, { skip: !endpoint }, async () => {
    await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 500 });
    await open(); await home(); await balance(125000); await layout("home", width);
    await click('[data-action="notifications"]'); await layout("notifications", width);
    await click('[data-action="notification"][data-id="notice-2"]');
    assert.equal(await screen(), "bill-detail");
    await key("Escape"); assert.match(await content(), /Lida/);
    await home(); await click('[data-screen="pay"]'); await layout("pay", width);
    await click('[data-action="bill-scan"]'); await layout("scan", width);
    assert.match(await content(), /câmera está desligada/);
    await click('[data-action="scan-bill"]'); await layout("bill", width);
    await click('[data-action="bill-start"]'); await layout("when-now", width);
    await click('button[type="submit"]'); await layout("confirm", width);
    await click('[data-action="confirm-payment"]'); assert.equal(await screen(), "success");
    await click('[data-action="view-receipt"]'); await layout("receipt", width);
    const receipt = await content(); assert.match(receipt, /UNAPI-LUZ-12490/); assert.match(receipt, /Concluído/);
    await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedReceipt=text;}}})");
    await click('[data-action="copy-receipt"]');
    assert.match(await evaluate('window.__copiedReceipt'), /COMPROVANTE DE TREINAMENTO\nSEM VALOR FINANCEIRO/);
    assert.match(await evaluate('window.__copiedReceipt'), /UNAPI-LUZ-12490/);
    await evaluate("navigator.clipboard.writeText=async()=>{throw Error('Permissão negada');}");
    await click('[data-action="copy-receipt"]'); assert.match(await content(),/Não foi possível copiar/);
    await click('[data-action="go-home"]'); await balance(112510);
    await click('[data-screen="receipts"]'); await fill('#bank-history-search', 'energia');
    await layout("receipts-search", width);
    assert.equal(await evaluate("document.querySelectorAll('.bank-transaction').length"), 1);
    await click('.bank-transaction'); assert.equal(await content(), receipt);
    await key("Escape"); assert.equal(await evaluate("document.querySelector('#bank-history-search').value"), "energia");
    await fill('#bank-history-search', 'inexistente'); assert.match(await content(), /Nenhuma movimentação/);
    await fill('#bank-history-search', ''); await click('[data-filter="in"]');
    assert.equal(await evaluate("document.querySelectorAll('.bank-transaction').length"), 1);
    await home(); await chooseBill("water", true); await layout("confirm-schedule", width);
    await click('[data-action="confirm-payment"]'); await layout("schedule", width);
    assert.match(await content(), /ainda não saiu da conta/);
    await click('[data-action="cancel-schedule"]'); await layout("cancel-schedule", width);
    await click('[data-action="back"]'); assert.match(await content(), /Pagamento agendado/);
    await click('[data-action="cancel-schedule"]'); await click('[data-action="confirm-cancel-schedule"]');
    assert.match(await content(), /Agendamento cancelado/); await balance(112510);
    await chooseBill("water", true); await click('[data-action="confirm-payment"]');
    await balance(112510); await panelAction('#pix-advance-date');
    assert.equal(await screen(), "schedules"); await layout("schedules", width);
    await click('[data-action="schedule"][data-id="schedule-2"]');
    assert.match(await content(), /Agendamento concluído/);
    await click('[data-action="transaction"]'); assert.match(await content(), /Pagamento agendado/);
    await balance(103870);
    await click('[data-screen="cards"]'); await layout("cards", width);
    await click('[data-action="invoice"]'); await layout("invoice", width);
    await click('[data-action="purchase"][data-id="purchase-pharmacy"]'); await layout("purchase", width);
    assert.match(await content(), /65,00/); assert.match(await content(), /2026/);
    await click('[data-action="card-help"]'); await click('[data-action="protect-card"]');
    assert.match(await content(), /Cartão bloqueado/); await layout("blocked", width);
    await click('[data-action="protect-card"]'); assert.match(await content(), /Proteja seu cartão/);
    await key("Escape"); await click('[data-action="recognize-purchase"]');
    assert.match(await content(), /Compra reconhecida/);
    await click('[data-action="invoice"]'); await click('[data-action="pay-invoice"]');
    await click('[data-action="continue-review"]'); await click('[data-action="confirm-payment"]');
    await balance(85380);
    await click('[data-screen="statement"]'); await layout("statement", width);
    await fill('#bank-history-period', 'today'); assert.match(await content(), /Pagamento da fatura/);
    await click('[data-filter="in"]'); assert.match(await content(), /Nenhuma movimentação/);
    assert.deepEqual(errors, []);
  });
}

test("Pix, QR, receber, reserva, cartões e teclado mantêm os fluxos existentes", { skip: !endpoint }, async () => {
  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await open(); await home();
  for (const type of ["email", "phone", "document", "random"]) {
    await click('[data-screen="pix-menu"]'); await click('[data-action="choose-key"]');
    await click(`[data-action="select-key-type"][data-id="${type}"]`);
    await fill('#bank-key', 'chave inválida'); await click('button[type="submit"]');
    assert.equal(await evaluate("document.querySelector('#bank-key').getAttribute('aria-invalid')"), "true");
    await click('[data-action="use-training-key"]'); await click('button[type="submit"]');
    await fill('#bank-amount', '1'); await click('button[type="submit"]');
    await click('[data-action="continue-review"]'); await click('[data-action="confirm-payment"]');
    await home();
  }
  await balance(124600);
  await click('[data-screen="pix-menu"]'); await click('[data-action="contact"][data-id="phone"]');
  await fill('#bank-amount', '10'); await click('button[type="submit"]');
  await click('[data-action="cancel-payment"]'); await balance(124600);
  await click('[data-screen="pix-menu"]'); await click('[data-action="copy"]'); await click('[data-action="use-copy-code"]');
  await click('button[type="submit"]'); await click('[data-action="continue-review"]'); await click('[data-action="confirm-payment"]');
  await balance(123400);
  await click('[data-screen="receive"]'); await fill('#bank-amount', '80'); await click('button[type="submit"]');
  assert.equal(await evaluate("Boolean(document.querySelector('.bank-receive-qr svg'))"), true);
  await layout("receive-qr", 390); await panelAction('#pix-credit-receipt'); await balance(131400);
  assert.equal(await evaluate("document.querySelector('#pix-credit-receipt').hidden"), true);
  await click('[data-screen="reserve"]'); await click('[data-action="reserve-save"]');
  await fill('#bank-amount', '10'); await click('button[type="submit"]'); await balance(130400);
  await click('[data-screen="reserve"]'); await click('[data-action="reserve-withdraw"]');
  await fill('#bank-amount', '4'); await click('button[type="submit"]'); await balance(130800);
  await click('[data-action="toggle-balance"]');
  assert.equal(await evaluate("document.querySelector('.bank-balance > strong').textContent.includes('1308')"), false);
  await click('[data-screen="statement"]'); assert.equal(await evaluate("document.querySelectorAll('.bank-transaction-value [aria-label=\"Valor oculto\"]').length > 0"), true);
  await home(); await click('[data-action="toggle-balance"]');
  await click('[data-screen="cards"]'); await click('[data-field="locked"]');
  assert.equal(await evaluate("document.querySelector('[data-field=locked]').getAttribute('aria-checked')"), "true");
  await click('[data-field="locked"]'); await click('[data-action="virtual"]'); await click('[data-action="create-virtual"]');
  await click('[data-field="virtualLocked"]'); assert.match(await content(), /Bloqueado/);
  await key('Escape'); await click('[data-action="card-settings"]'); await click('[data-field="online"]'); await click('[data-field="contactless"]');
  assert.equal(await evaluate("document.querySelectorAll('[role=switch][aria-checked=false]').length"), 2);
  await key('Escape'); await click('[data-action="limit"]'); await click('[name="limit"][value="100000"]'); await click('button[type="submit"]');
  await balance(130800);
  await click('[data-screen="pay"]'); await click('[data-action="bill-code"]'); await fill('#bank-code','wrong'); await click('button[type="submit"]');
  assert.match(await content(), /Código não encontrado/); await click('[data-action="use-bill-code"]'); await click('button[type="submit"]');
  assert.match(await content(), /Água e saneamento/);
  await key('Escape'); assert.equal(await screen(), 'bill-code');
  await key('Tab'); assert.equal(await evaluate('document.activeElement.id'), 'bank-code');
  for (const scenario of ['cantina','destinatario-errado','valor-errado']) {
    await open(`/pix/qr/?cenario=${scenario}`); await click('[data-action="continue-charge"]');
    await key('Escape'); assert.equal(await screen(),'charge'); await click('[data-action="continue-charge"]');
    await click('[data-action="continue-review"]');
    if(scenario==='cantina'){await click('[data-action="confirm-payment"]');assert.equal(await screen(),'success');}
    else {assert.equal(await screen(),'warning');await click('[data-action="cancel-payment"]');assert.equal(await screen(),'cancelled');}
  }
  await open('/pix/qr/?cenario=missing'); assert.equal(await screen(),'invalid');
  await open('/pix/qr/?receber=8000'); assert.match(await content(), /80,00/);
  await open('/pix/?modo=oficina'); await click('[data-action="project-qr"][data-id="cantina"]');
  assert.equal(await evaluate("Boolean(document.querySelector('.bank-projected-qr svg'))"), true); await layout('projector',390);
  assert.deepEqual(errors, []);
});

test("saldo insuficiente, execução futura, erros persistentes e altura reduzida", { skip: !endpoint }, async () => {
  await command("Emulation.setDeviceMetricsOverride", { width: 360, height: 640, deviceScaleFactor: 1, mobile: true });
  await open(); await home(); await click('[data-screen="pix-menu"]'); await click('[data-action="contact"][data-id="email"]');
  await fill('#bank-amount','1250'); await click('button[type="submit"]'); await click('[data-action="continue-review"]'); await click('[data-action="confirm-payment"]');
  await balance(0); await chooseBill('energy',true); await click('[data-action="confirm-payment"]');
  await panelAction('#pix-advance-date'); await click('[data-action="schedule"]');
  assert.match(await content(), /Saldo insuficiente/);
  assert.equal(await evaluate("Boolean(document.querySelector('[data-action=transaction]'))"), false);
  await click('[data-action="bill"]'); await click('[data-action="bill-start"]'); await click('button[type="submit"]'); await click('[data-action="confirm-payment"]');
  assert.equal(await screen(),'confirm'); assert.match(await content(),/Saldo insuficiente/);
  assert.equal(await evaluate('document.activeElement.id'),'bank-payment-error'); await layout('insufficient',360);
  await home(); await click('[data-screen="receive"]'); await fill('#bank-amount','200'); await click('button[type="submit"]');
  await panelAction('#pix-credit-receipt'); await chooseBill('energy'); await click('[data-action="confirm-payment"]');
  await balance(7510); await click('[data-screen="pay"]'); await click('[data-action="schedules"]'); await click('[data-action="schedule"]');
  assert.match(await content(),/A conta foi paga em outra operação/);
  assert.doesNotMatch(await content(),/A conta continua em aberto/);
  await home(); await click('[data-screen="pay"]'); await click('[data-action="bill-code"]');
  await command("Emulation.setDeviceMetricsOverride", { width: 360, height: 420, deviceScaleFactor: 1, mobile: true });
  await fill('#bank-code','UNAPI-INTERNET-09990'); await click('button[type="submit"]');
  await layout('short-height',360);
  await command("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
  await open(); await home(); await balance(125000);
  assert.equal(await evaluate('localStorage.length + sessionStorage.length'),0);
  assert.deepEqual(errors, []);
});

test("toque, movimento reduzido e entrada pelo portal", { skip: !endpoint }, async () => {
  await command("Emulation.setDeviceMetricsOverride", { width: 430, height: 932, deviceScaleFactor: 1, mobile: true });
  await open(); await home();
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.pix-screen')).animationName"),'none');
  await command("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  const point = await evaluate("(() => {const r=document.querySelector('[data-action=notifications]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
  await command("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await command("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await until("document.body.dataset.pixScreen === 'notifications'");
  await layout('touch-notifications',430);
  await command("Emulation.setTouchEmulationEnabled", { enabled: false });
  await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await open(); await home();
  await evaluate("Promise.all(document.getAnimations().map(animation=>animation.finished)).then(()=>true)");
  await layout('normal-motion',430);
  const url = new URL('/ferramentas/',base).href;
  await command('Page.navigate',{url}); await until(`location.href === ${JSON.stringify(url)} && Boolean(document.querySelector('.tool-row'))`);
  await click('.tool-row[href="../pix/"]'); await until("document.body.dataset.pixScreen === 'welcome'");
  await home(); assert.match(await content(),/Comprovantes/);
  await click('[data-screen="pay"]'); await click('[data-action="bill-code"]');
  const contrast = await evaluate(`(() => {
    const style=getComputedStyle(document.querySelector('#bank-code'));
    const luminance=color=>{const c=color.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
    const a=luminance(style.borderTopColor),b=luminance(style.backgroundColor);
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  })()`);
  assert.ok(contrast>=3, 'Borda do campo precisa de contraste de pelo menos 3:1.');
  await layout('field-contrast',430);
  assert.deepEqual(errors, []);
});

test("rolagem sem barra lateral por mouse e toque, inclusive em desktop baixo", { skip: !endpoint }, async () => {
  await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 600, deviceScaleFactor: 1, mobile: false });
  await open(); await home();
  assert.equal(await evaluate('document.documentElement.scrollHeight <= innerHeight'), true);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.bank-home-scroll')).scrollbarWidth"), 'none');
  await layout('short-desktop',1440);
  const wheel = await evaluate("(() => {const r=document.querySelector('.bank-home-scroll').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
  await command('Input.dispatchMouseEvent',{type:'mouseWheel',...wheel,deltaX:0,deltaY:500});
  await until("document.querySelector('.bank-home-scroll').scrollTop > 0");
  await layout('mouse-scroll',1440);
  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await open(); await home();
  await touchDrag('.bank-home-scroll', 350);
  await until("document.querySelector('.bank-home-scroll').scrollTop > 0");
  await layout('touch-scroll',390);
  await command("Emulation.setTouchEmulationEnabled", { enabled: false });
  assert.deepEqual(errors, []);
});
