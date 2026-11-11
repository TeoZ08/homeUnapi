(() => {
  "use strict";
  const app = document.getElementById("pix-app");
  if (!app || !window.BancoUnapi || !window.PixQrWorkshop || !window.createBancoUnapiDaily) return;
  const root = new URL("../", document.currentScript.src);
  const href = path => new URL(path, root).href;
  const { contacts, bills, parseMoney, createAccount } = window.BancoUnapi;
  const { scenarios, escapeHtml: esc, createQrSvg, buildScenarioUrl, buildReceiveUrl, hostNotice, setupShell, setupEdgeSwipe } = window.PixQrWorkshop;
  const money = cents => window.PixQrWorkshop.formatMoney(cents / 100);
  const inputMoney = cents => cents ? (cents / 100).toFixed(2).replace(".", ",") : "";
  const date = value => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
  const fullDate = value => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  const contactIds = ["email", "phone", "document", "random"];
  let account, state, toastTimer, announceTimer;
  function icon(name) {
    const paths = {
      arrow: '<path d="M19 12H5m7 7-7-7 7-7"/>',
      chevron: '<path d="m9 5 7 7-7 7"/>',
      home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>',
      pix: '<path d="m12 2 5 5-5 5-5-5 5-5Zm0 10 5 5-5 5-5-5 5-5ZM2 12l4-4 4 4-4 4-4-4Zm12 0 4-4 4 4-4 4-4-4Z"/>',
      pay: '<path d="M4 4v16M7 4v16M11 4v16M15 4v16M17 4v16M21 4v16"/>',
      receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM8 8h8M8 12h8M8 16h4"/>',
      card: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20M6 15h4"/>',
      eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      eyeOff: '<path d="m3 3 18 18M10 5h2c6 0 10 7 10 7a21 21 0 0 1-3 4M6 6a24 24 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1"/>',
      key: '<circle cx="7" cy="16" r="4"/><path d="m10 13 10-10m-6 6 3 3m0-6 3 3"/>',
      qr: '<path d="M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h2v2h-2zm4 0h2v6h-2m-4-2h2v2h-2"/>',
      copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
      down: '<path d="M12 3v18m-7-7 7 7 7-7"/>',
      up: '<path d="M12 21V3m-7 7 7-7 7 7"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      lock: '<rect x="4" y="10" width="16" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 15v3"/>',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
      reserve: '<path d="M4 9h16v12H4zm-1 0 9-6 9 6M8 12v6m4-6v6m4-6v6"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
      calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.chevron}</svg>`;
  }
  function announce(text) {
    clearTimeout(announceTimer);
    const region = document.getElementById("pix-announcement");
    region.textContent = "";
    announceTimer = setTimeout(() => { region.textContent = text; }, 40);
  }
  function toast(text) {
    clearTimeout(toastTimer); app.querySelector(".bank-toast")?.remove();
    const element = document.createElement("p");element.className = "bank-toast";element.setAttribute("role", "status");element.textContent = text;app.append(element);
    toastTimer = setTimeout(() => element.remove(), 3000);
  }
  function button(text, action, style = "primary", extra = "") {
    return `<button type="button" class="bank-button is-${style}" data-action="${action}" ${extra}>${text}</button>`;
  }
  function row(title, description, action, symbol = "chevron", extra = "") {
    return `<button type="button" class="bank-row" data-action="${action}" ${extra}><span class="bank-row-icon">${icon(symbol)}</span><span class="bank-row-copy"><strong>${esc(title)}</strong>${description ? `<small>${esc(description)}</small>` : ""}</span>${icon("chevron")}</button>`;
  }
  function nav(active) {
    return `<nav class="bank-nav" aria-label="Navegação do banco">${[["home","Início","home"],["pix-menu","Pix","pix"],["statement","Extrato","receipt"],["cards","Cartões","card"]].map(([screen,label,symbol])=>`<button type="button" data-action="navigate" data-screen="${screen}" ${screen===active ? 'aria-current="page"' : ""}>${icon(symbol)}<span>${label}</span></button>`).join("")}</nav>`;
  }
  function shell(title, content, actions = "", active = "") {
    return `<section class="pix-screen bank-flow"><header class="bank-appbar"><button type="button" class="bank-icon-button" data-action="back" aria-label="Voltar">${icon("arrow")}</button><strong>${esc(title)}</strong><span class="bank-mini-mark" aria-hidden="true">U</span></header><div class="bank-content">${content}</div>${actions ? `<footer class="bank-actions">${actions}</footer>` : active ? nav(active) : ""}</section>`;
  }
  const heading = text => `<h1 data-pix-heading>${text}</h1>`;
  const displayMoney = cents => account.snapshot().hiddenBalance ? '<span aria-label="Valor oculto">••••</span>' : money(cents);
  const avatar = person => `<span class="bank-avatar" aria-hidden="true">${esc(person.initials)}</span>`;
  function detail(label, value) { return `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`; }
  function amountForm(action, value = "", label = "Valor", help = "", command = "Continuar") {
    return `<form data-form="${action}" class="bank-form" novalidate><label for="bank-amount">${label}</label><div class="bank-amount-input"><span>R$</span><input id="bank-amount" name="amount" type="text" inputmode="decimal" maxlength="14" autocomplete="off" placeholder="0,00" value="${esc(value)}" aria-describedby="bank-amount-help bank-form-error" required /></div><p class="bank-muted" id="bank-amount-help">${help}</p><div class="bank-quick-values">${[10,20,50].map(n=>button(`R$ ${n}`,"quick-amount","chip",`data-cents="${n*100}"`)).join("")}</div><p id="bank-form-error" class="bank-field-error" role="alert" hidden></p><button type="submit" class="bank-button is-primary">${command}</button></form>`;
  }
  function renderWelcome() {
    return `<section class="pix-screen bank-welcome"><img class="bank-welcome-logo" src="${href("img/pix/banco-unapi-logo.svg")}" alt="Banco UnAPI" /><div class="bank-welcome-main"><span class="bank-overline">SEU BANCO, PERTO DE VOCÊ</span>${heading("Olá, Maria.")}<p>Que bom ter você por aqui.</p><div class="bank-login-person">${avatar(contacts.own)}<span><strong>Maria Oliveira</strong><small>Minha conta</small></span>${icon("lock")}</div>${button("Entrar na minha conta","enter-bank")}</div><span class="bank-welcome-signature">UnAPI <span>UFMS</span></span></section>`;
  }
  function transactionRows(items, compact = false) {
    if (!items.length) return '<p class="bank-empty">Nenhuma movimentação neste filtro.</p>';
    return `<div class="bank-transactions">${items.map(item=>`<button type="button" class="bank-transaction" data-action="transaction" data-id="${item.id}"><span class="bank-transaction-icon ${item.direction==="in" ? "is-in" : ""}">${icon(item.direction==="in" ? "down" : "up")}</span><span class="bank-transaction-copy"><strong>${esc(item.name)}</strong><small>${esc(item.description)}${compact ? "" : ` · ${date(item.date)}`}</small></span><span class="bank-transaction-value ${item.direction==="in" ? "is-in" : ""}">${account.snapshot().hiddenBalance ? '<span aria-label="Valor oculto">••••</span>' : `${item.direction==="in" ? "+" : "−"} ${money(item.amountCents)}`}</span></button>`).join("")}</div>`;
  }
  function renderHome() {
    const bank=account.snapshot();
    const unread=bank.notifications.filter(item=>!item.read).length;
    const pending=bank.scheduledPayments.filter(item=>item.status==="pending").sort((a,b)=>a.date.localeCompare(b.date))[0];
    const reminder=pending ? row("Próximo pagamento",`${daily.calendarDate(pending.date)} · ${bank.bills.find(b=>b.id===pending.billId).name}`,"schedule","calendar",`data-id="${pending.id}"`) : "";
    return `<section class="pix-screen bank-home">
      <header class="bank-home-header"><img src="${href("img/pix/banco-unapi-logo.svg")}" alt="Banco UnAPI" /><div class="bank-home-tools"><button type="button" class="bank-icon-button bank-notice-button" data-action="notifications" aria-label="Notificações${unread ? `, ${unread} não lidas` : ""}" title="Notificações">${icon("bell")}${unread ? '<span class="bank-unread-dot" aria-hidden="true"></span>' : ""}</button><button type="button" class="bank-profile-button" data-action="profile" aria-label="Minha conta, Maria Oliveira">${avatar(contacts.own)}</button></div></header>
      <div class="bank-home-scroll">
        <div class="bank-greeting"><span>Bom ter você aqui,</span>${heading("Maria")}</div>
        <section class="bank-balance" aria-label="Saldo em conta"><div class="bank-balance-label"><span>Saldo disponível</span><button type="button" class="bank-icon-button" data-action="toggle-balance" aria-label="${bank.hiddenBalance ? "Mostrar" : "Ocultar"} valores" aria-pressed="${bank.hiddenBalance}">${icon(bank.hiddenBalance ? "eyeOff":"eye")}</button></div><strong>${displayMoney(bank.balanceCents)}</strong><button type="button" data-action="navigate" data-screen="statement">Ver extrato ${icon("chevron")}</button></section>
        <div class="bank-shortcuts">${[["pix","Pix","pix-menu"],["pay","Pagar","pay"],["down","Receber","receive"],["reserve","Guardar","reserve"]].map(([symbol,label,screen])=>`<button type="button" data-action="navigate" data-screen="${screen}"><span>${icon(symbol)}</span><strong>${label}</strong></button>`).join("")}</div>
        ${row("Comprovantes","Consultar pagamentos e transferências","navigate","receipt",'data-screen="receipts"')}
        ${reminder}
        <button type="button" class="bank-invoice-preview" data-action="navigate" data-screen="invoice"><span class="bank-row-icon">${icon("card")}</span><span><small>Fatura do cartão</small><strong>${bank.card.invoiceCents ? displayMoney(bank.card.invoiceCents) : "Fatura paga"}</strong></span>${icon("chevron")}</button>
        <section class="bank-section"><div class="bank-section-title"><h2>Últimas movimentações</h2><button type="button" data-action="navigate" data-screen="statement">Ver todas</button></div>${transactionRows(bank.transactions.slice(0,2),true)}</section>
      </div>${nav("home")}</section>`;
  }
  function renderPixMenu() {
    return shell("Pix",`${heading("Seu Pix, do seu jeito.")}<div class="bank-pix-grid">${[["key","Transferir","choose-key"],["qr","Ler QR Code","scan"],["copy","Copia e Cola","copy"],["down","Receber Pix","receive"]].map(([symbol,title,action])=>`<button type="button" data-action="${action}" class="bank-pix-tile">${icon(symbol)}<strong>${title}</strong></button>`).join("")}</div><div class="bank-section-title"><h2>Seus contatos</h2></div><div class="bank-contacts">${contactIds.map(id=>`<button type="button" data-action="contact" data-id="${id}">${avatar(contacts[id])}<span>${esc(contacts[id].shortName)}</span></button>`).join("")}</div>${row("Minhas chaves","Gerenciar chaves Pix","keys","key")}`,"","pix-menu");
  }
  function renderKeyType() {
    return shell("Transferir Pix",`${heading("Qual é o tipo de chave?")}<div class="bank-list">${[["document","CPF/CNPJ","Número de documento"],["phone","Celular","Número com DDD"],["email","E-mail","Endereço de e-mail"],["random","Chave aleatória","Código da chave"]].map(([id,title,description])=>row(title,description,"select-key-type","key",`data-id="${id}"`)).join("")}</div>`);
  }
  function renderKeyInput() {
    const contact=contacts[state.keyType];
    return shell("Chave Pix",`${heading("Para quem você quer enviar?")}<form class="bank-form" data-form="key" novalidate><label for="bank-key">${esc(contact.label)}</label><input class="bank-field" id="bank-key" name="key" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="100" inputmode="${["phone","document"].includes(contact.type) ? "tel":"text"}" value="${esc(state.keyValue)}" placeholder="Digite a chave" aria-describedby="bank-form-error" required /><p id="bank-form-error" class="bank-field-error" role="alert" hidden></p><span class="bank-overline">CONTATO SALVO</span><button type="button" class="bank-saved-contact" data-action="use-training-key">${avatar(contact)}<span><strong>${esc(contact.shortName)}</strong><small>${esc(contact.key)}</small></span>${icon("chevron")}</button><button type="submit" class="bank-button is-primary">Continuar</button></form>`);
  }
  function renderAmount() {
    return shell("Transferir Pix",`${heading("Quanto você quer enviar?")}<div class="bank-person-line">${avatar(state.draft.recipient)}<span>Para <strong>${esc(state.draft.recipient.shortName)}</strong></span></div>${amountForm("pix-amount",inputMoney(state.draft.amountCents),"Valor do Pix",`Saldo disponível: ${money(account.snapshot().balanceCents)}`)}`);
  }
  function renderReview() {
    const draft=state.draft;
    return shell(draft.kind==="pix" ? "Conferir Pix":"Conferir pagamento",`${heading("Confira os dados")}<div class="bank-review-total"><small>Você vai pagar</small><strong>${money(draft.amountCents)}</strong></div><div class="bank-recipient">${avatar(draft.recipient)}<div><small>Destinatário</small><strong>${esc(draft.recipient.name)}</strong></div></div><dl class="bank-details">${detail(draft.recipient.documentLabel,draft.recipient.document)}${draft.kind==="pix" && draft.source==="Chave Pix" ? detail("Chave Pix",draft.recipient.key):""}${detail("Forma de pagamento",draft.source)}${detail("Quando","Agora")}</dl>`,`${button("Cancelar","cancel-payment","secondary")}${button("Continuar","continue-review")}`);
  }
  function renderConfirm() {
    const draft=state.draft,scheduled=Boolean(draft.scheduledDate);
    const bill=draft.kind==="bill"&&account.snapshot().bills.find(item=>item.id===draft.billId);
    return shell(scheduled ? "Confirmar agendamento":"Confirmar pagamento",`${heading(scheduled ? "Tudo certo para agendar?":"Tudo certo para pagar?")}${bill ? "":`<div class="bank-confirm-lock">${icon("lock")}</div>`}<p class="bank-confirm-value">${money(draft.amountCents)}</p><p class="bank-confirm-name">para <strong>${esc(draft.recipient.name)}</strong></p><dl class="bank-details">${detail("Quando",scheduled ? daily.calendarDate(draft.scheduledDate):"Agora")}${bill ? detail("Conta",bill.name)+detail("Vencimento",daily.calendarDate(bill.dueDate))+detail("CNPJ",bill.document):""}${detail("Debitar de","Saldo em conta")}${detail("Disponível",money(account.snapshot().balanceCents))}</dl>${scheduled ? '<p class="bank-muted">O saldo será usado na data agendada. Nenhum valor sai da conta agora.</p>':""}<p id="bank-payment-error" class="bank-field-error" role="alert" tabindex="-1" hidden></p>`,`${button("Voltar","back","secondary")}${button(scheduled ? "Confirmar agendamento":"Confirmar pagamento","confirm-payment")}`);
  }
  function renderResult() {
    const transaction=account.snapshot().transactions.find(item=>item.id===state.transactionId);
    const title=transaction.kind==="reserve" ? (transaction.direction==="in" ? "Dinheiro resgatado":"Dinheiro guardado") : transaction.kind==="pix" ? "Pix enviado" : transaction.direction==="in" ? "Pix recebido":"Pagamento realizado";
    return shell("Banco UnAPI",`<div class="bank-result"><span class="bank-result-check">${icon("check")}</span>${heading(title)}<strong class="bank-result-amount">${money(transaction.amountCents)}</strong><p>${esc(transaction.name)}</p><small>${fullDate(transaction.date)}</small></div>`,`${button("Ver comprovante","view-receipt")}${button("Voltar ao início","go-home","secondary")}`);
  }
  function renderReceipt() {
    const transaction=account.snapshot().transactions.find(item=>item.id===state.transactionId);
    return shell("Comprovante",`<article class="bank-receipt"><img src="${href("img/pix/banco-unapi-logo.svg")}" alt="Banco UnAPI" />${heading(transaction.description)}<strong class="bank-receipt-amount">${money(transaction.amountCents)}</strong><span class="bank-status">Concluído</span><dl class="bank-details">${detail(transaction.direction==="in" ? "Origem":"Destinatário",transaction.name)}${detail(transaction.documentLabel,transaction.document)}${transaction.billName ? detail("Conta",transaction.billName)+detail("Vencimento",daily.calendarDate(transaction.dueDate))+detail("Código",transaction.code):""}${detail("Data e hora",fullDate(transaction.date))}${detail("Forma de pagamento",transaction.source)}${detail("Identificador",transaction.id)}</dl><small class="bank-receipt-footnote">Treinamento UnAPI · Sem valor financeiro</small></article>`,`${button("Copiar comprovante","copy-receipt","secondary")}${button("Voltar ao início","go-home")}`);
  }
  function renderBillCode() {
    return shell("Código da conta",`${heading("Qual conta você quer pagar?")}<form class="bank-form" data-form="bill-code" novalidate><label for="bank-code">Código de pagamento</label><input id="bank-code" class="bank-field" name="code" autocomplete="off" maxlength="100" placeholder="Digite ou cole o código" aria-describedby="bank-form-error" /><p id="bank-form-error" class="bank-field-error" role="alert" hidden></p>${row("Água e saneamento",bills[0].code,"use-bill-code","receipt")}<button type="submit" class="bank-button is-primary">Continuar</button></form>`);
  }
  function renderCopy() {
    return shell("Pix Copia e Cola",`${heading("Cole o código do Pix")}<form class="bank-form" data-form="copy" novalidate><label for="bank-copy">Código Pix</label><textarea id="bank-copy" name="code" class="bank-field" rows="4" maxlength="500" autocomplete="off" spellcheck="false" aria-describedby="bank-form-error" placeholder="Cole aqui o código recebido">${esc(state.copyCode)}</textarea><p id="bank-form-error" class="bank-field-error" role="alert" hidden></p>${button("Colar código","paste","secondary")}<span class="bank-overline">COBRANÇA DISPONÍVEL</span>${row("Cantina UnAPI","R$ 12,00","use-copy-code","pix")}<button type="submit" class="bank-button is-primary">Continuar</button></form>`);
  }
  function renderScan() {
    const preview = state.workshopMode
      ? `<div class="bank-section-title"><h2>Prévia local</h2></div><div class="bank-list">${Object.values(scenarios).map(s=>row(s.shortLabel,"Abrir cobrança neste aparelho","scenario","qr",`data-id="${s.id}"`)).join("")}</div>`
      : `<div class="bank-qr-intro">${icon("qr")}<p>Leia o QR Code projetado com a câmera do celular.</p></div>`;
    return shell("Ler QR Code",`${heading("Leia um QR Code")}${preview}`);
  }
  function renderCharge() {
    const scenario = scenarios[state.pendingScenario];
    const recipient = scenarioRecipient(state.pendingScenario, scenario);
    return shell("Cobrança Pix",`${heading("Cobrança Pix")}<div class="bank-qr-intro">${icon("qr")}<p>Cobrança recebida por QR Code.</p></div><div class="bank-review-total"><small>Valor da cobrança</small><strong>${money(scenario.shownAmount * 100)}</strong></div><div class="bank-recipient">${avatar(recipient)}<div><small>Recebedor</small><strong>${esc(recipient.name)}</strong></div></div><dl class="bank-details">${detail(scenario.documentLabel,scenario.document)}${detail("Origem","QR Code")}</dl>`,`${button("Continuar no Banco UnAPI","continue-charge")}${button("Cancelar cobrança","cancel-charge","secondary")}`);
  }
  function renderReceive() {
    return shell("Receber Pix",`${heading("Quanto você vai receber?")}<p class="bank-muted">O valor acompanha seu QR Code.</p>${amountForm("receive",inputMoney(state.receiveCents),"Valor a receber")}`);
  }
  function qrSvg(url) {
    if(typeof window.qrcode!=="function")return "";
    const qr=window.qrcode(0,"M");qr.addData(url);qr.make();
    return qr.createSvgTag({cellSize:8,margin:32,scalable:true,title:"QR Code do Banco UnAPI"});
  }
  function renderReceiveCode() {
    const url=buildReceiveUrl(state.receiveCents);
    return shell("Receber Pix",`${heading("Seu QR Code está pronto")}<div class="bank-receive-qr">${qrSvg(url)}<strong>${money(state.receiveCents)}</strong><span>${contacts.own.name}</span></div><dl class="bank-details">${detail("Chave Pix",contacts.own.key)}</dl><p class="bank-field-label">Pix Copia e Cola</p><p class="bank-code-text">UNAPI:RECEBER:${state.receiveCents}</p>`,`${button("Copiar código","copy-receive")}${button("Alterar valor","back","secondary")}`);
  }
  function renderKeys() {
    return shell("Minhas chaves",`${heading("Suas chaves Pix")}<p class="bank-muted">Receba diretamente na sua conta.</p><div class="bank-key-card"><span>E-mail</span><strong>${contacts.own.key}</strong>${button("Copiar chave","copy-key","secondary")}</div><div class="bank-key-card"><span>Chave aleatória</span><strong>UNAPI-CONTA-MARIA-2026</strong>${button("Copiar chave","copy-random-key","secondary")}</div>`);
  }
  function cardVisual(virtual=false) {
    const card=account.snapshot().card,locked=virtual ? card.virtualLocked:card.locked;
    return `<div class="bank-plastic ${virtual ? "is-virtual":""}"><div><strong>UnAPI</strong><span>${virtual ? "Virtual":"Essencial"}</span></div><span class="bank-card-chip" aria-hidden="true"></span><p>•••• <strong>${virtual ? "4082":"2026"}</strong></p><footer><span>MARIA OLIVEIRA</span><span>${locked ? "Bloqueado":"Ativo"}</span></footer></div>`;
  }
  function switchRow(label,field,checked,description="") {
    return `<button type="button" class="bank-switch-row" role="switch" aria-checked="${checked}" data-action="toggle-card" data-field="${field}"><span><strong>${label}</strong>${description ? `<small>${description}</small>`:""}</span><span class="bank-switch" aria-hidden="true"></span></button>`;
  }
  function renderCards() {
    const card=account.snapshot().card;
    return shell("Meus cartões",`${heading("Cartão UnAPI")}${cardVisual()}<div class="bank-card-status">${icon(card.locked ? "lock":"check")}<span>${card.locked ? "Cartão bloqueado temporariamente":"Pronto para usar"}</span></div>${switchRow("Bloquear cartão","locked",card.locked,"Você pode desbloquear a qualquer momento.")}<div class="bank-list">${row("Não encontro meu cartão","Bloqueio temporário","card-help","lock")}${row("Fatura atual",card.invoiceCents ? money(card.invoiceCents):"Paga","invoice","receipt")}${row("Limite disponível",money(card.limitCents-card.invoiceCents),"limit","card")}${row("Cartão virtual",card.virtual ? "Ver cartão virtual":"Criar cartão virtual","virtual","card")}${row("Configurações","Compras on-line e aproximação","card-settings","lock")}</div>`,"","cards");
  }
  function renderInvoice() {
    const bank=account.snapshot(),card=bank.card,total=bank.cardPurchases.reduce((sum,item)=>sum+item.amountCents,0);
    return shell("Fatura",`${heading(card.invoiceCents ? "Fatura atual":"Fatura paga")}<p class="bank-invoice-total">${money(card.invoiceCents)}</p><span class="bank-status">${card.invoiceCents ? `Vencimento · ${daily.calendarDate(bank.invoiceDueDate)}`:"Tudo em dia"}</span><div class="bank-section-title"><h2>Compras desta fatura</h2></div><div class="bank-purchase-list">${bank.cardPurchases.map(item=>row(item.name,`${money(item.amountCents)} · ${date(item.date)}${item.recognized ? " · Reconhecida":""}`,"purchase","card",`data-id="${item.id}"`)).join("")}</div><dl class="bank-details">${detail("Total de compras",money(total))}${detail("Pagamentos",money(total-card.invoiceCents))}</dl>`,card.invoiceCents ? button("Pagar fatura","pay-invoice"):button("Ver comprovante","invoice-receipt"));
  }
  function renderLimit() {
    const card=account.snapshot().card;
    return shell("Limite do cartão",`${heading("Seu limite")}<div class="bank-limit-total"><strong>${money(card.limitCents)}</strong><span>Disponível: ${money(card.limitCents-card.invoiceCents)}</span></div><form data-form="limit" class="bank-form"><fieldset><legend>Escolha seu limite</legend><div class="bank-limit-options">${[50000,100000,200000,300000].map(cents=>`<label><input type="radio" name="limit" value="${cents}" ${cents===card.limitCents ? "checked":""} />${money(cents)}</label>`).join("")}</div></fieldset><button type="submit" class="bank-button is-primary">Salvar limite</button></form>`);
  }
  function renderVirtual() {
    const card=account.snapshot().card;
    return shell("Cartão virtual",card.virtual ? `${heading("Seu cartão virtual")}${cardVisual(true)}${switchRow("Bloquear cartão virtual","virtualLocked",card.virtualLocked)}`:`${heading("Um cartão para suas compras on-line.")}<div class="bank-virtual-preview">${icon("card")}</div><p class="bank-muted">Gerencie seu cartão virtual separadamente do cartão físico.</p>`,card.virtual ? "":button("Criar cartão virtual","create-virtual"));
  }
  function renderCardSettings() {
    const card=account.snapshot().card;
    return shell("Configurações do cartão",`${heading("Do seu jeito.")}${switchRow("Compras on-line","online",card.online)}${switchRow("Pagamento por aproximação","contactless",card.contactless)}`);
  }
  function renderReserve() {
    const bank=account.snapshot();
    return shell("Minha reserva",`${heading("Dinheiro para os seus planos.")}<div class="bank-reserve-total">${icon("reserve")}<small>Total guardado</small><strong>${money(bank.reserveCents)}</strong></div><p class="bank-muted">Seu dinheiro separado do saldo do dia a dia.</p>`,`${button("Guardar dinheiro","reserve-save")}${button("Resgatar","reserve-withdraw","secondary",bank.reserveCents ? "":"disabled")}`);
  }
  function renderReserveAmount() {
    const bank=account.snapshot(),withdraw=state.reserveDirection==="withdraw";
    return shell(withdraw ? "Resgatar":"Guardar dinheiro",`${heading(withdraw ? "Quanto quer resgatar?":"Quanto quer guardar?")}${amountForm("reserve","","Valor",`Disponível: ${money(withdraw ? bank.reserveCents:bank.balanceCents)}`,withdraw ? "Confirmar resgate":"Confirmar valor guardado")}`);
  }
  function renderProfile() {
    return shell("Minha conta",`<div class="bank-profile">${avatar(contacts.own)}${heading(contacts.own.name)}<span>Conta pessoal</span></div><dl class="bank-details">${detail("Agência","0001")}${detail("Conta","•••• 2026-0")}${detail("CPF",contacts.own.document)}${detail("E-mail",contacts.own.key)}</dl>${row("Minhas chaves Pix","Recebimentos na sua conta","keys","key")}${row("Ajuda","Perguntas frequentes","help","help")}`,button("Sair da conta","logout","secondary"));
  }
  function renderHelp() {
    return shell("Ajuda",`${heading("Como podemos ajudar?")}<div class="bank-help-list">${[["Onde encontro um comprovante?","Em Comprovantes ou Extrato, busque o nome da empresa e abra a movimentação."],["Agendar é o mesmo que pagar?","Não. O valor só sai da conta na data agendada, se houver saldo suficiente. Consulte a situação em Pagar, Agendamentos."],["Como cancelo um agendamento?","Abra Pagar, Agendamentos e escolha o pagamento. Enquanto estiver agendado, você pode cancelar. Um pagamento concluído não pode ser cancelado por essa opção."],["Como bloqueio meu cartão?","Em Cartões, ative Bloquear cartão. Você pode desfazer essa ação no mesmo lugar. O bloqueio não cancela compras já feitas."],["Como recebo um Pix?","Abra Receber, informe o valor e gere seu código. Na oficina, o monitor pode registrar a entrada pelo painel de treinamento."],["Posso cancelar um pagamento?","Antes de confirmar, use Voltar ou Cancelar. Depois de concluído, o pagamento permanece no extrato."]].map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>`);
  }
  function renderCancelled() { return shell("Pagamento cancelado",`<div class="bank-result"><span class="bank-result-check is-neutral">${icon("close")}</span>${heading("Pagamento cancelado")}<p>Seu saldo permanece o mesmo.</p></div>`,`${button("Voltar ao início","go-home")}${state.draft?.kind==="bill"||state.draft?.kind==="invoice" ? button("Ver pagamentos","pay","secondary"):button("Fazer outro Pix","another-pix","secondary")}`); }
  function renderWarning() { return shell("Revisar pagamento",`${heading("Os dados não conferem")}<div class="bank-warning">${icon("lock")}<p>Não foi possível continuar com este pagamento.</p></div><dl class="bank-details">${detail("Destinatário",state.draft.recipient.name)}${detail("Valor",money(state.draft.amountCents))}</dl>`,`${button("Cancelar Pix","cancel-payment")}${button("Voltar e conferir","back","secondary")}`); }
  function renderInvalid() { return shell("Banco UnAPI",`${heading("Cobrança não encontrada")}<p class="bank-muted">Confira o código e tente novamente.</p>`,button("Ir para minha conta","go-home")); }
  function renderWorkshop() {
    const notice=hostNotice();
    if(state.workshopScenario){const s=scenarios[state.workshopScenario];return shell("QR Codes da dinâmica",`<div class="bank-projector"><div><span class="bank-overline">${s.shortLabel}</span>${heading("Confira antes de pagar")}<p class="bank-projector-task">${esc(s.projectionInstruction)}</p><p class="bank-muted">Use a câmera normal do celular para abrir a cobrança.</p>${button("Outros cenários","workshop-list","secondary")}</div><div class="bank-projected-qr">${createQrSvg(s.id)}<p>${esc(buildScenarioUrl(s.id))}</p></div></div>`);}
    return shell("Modo oficina",`${heading("QR Codes da dinâmica")}<p class="bank-muted">${esc(notice.message)}</p><div class="bank-scenarios">${Object.values(scenarios).map(s=>`<article><span class="bank-overline">${s.shortLabel}</span><h2>${esc(s.title)}</h2><p>${esc(s.projectionInstruction)}</p>${button("Projetar QR Code","project-qr","primary",`data-id="${s.id}" ${notice.blocked ? "disabled":""}`)}</article>`).join("")}</div>`);
  }
  const daily=window.createBancoUnapiDaily({getAccount:()=>account,getState:()=>state,shell,heading,button,row,detail,icon,money,date,fullDate,esc,transactionRows,displayMoney});
  const views={welcome:renderWelcome,home:renderHome,"pix-menu":renderPixMenu,"key-type":renderKeyType,"key-input":renderKeyInput,amount:renderAmount,review:renderReview,confirm:renderConfirm,success:renderResult,receipt:renderReceipt,"bill-code":renderBillCode,copy:renderCopy,scan:renderScan,charge:renderCharge,receive:renderReceive,"receive-code":renderReceiveCode,keys:renderKeys,cards:renderCards,invoice:renderInvoice,limit:renderLimit,virtual:renderVirtual,"card-settings":renderCardSettings,reserve:renderReserve,"reserve-amount":renderReserveAmount,profile:renderProfile,help:renderHelp,cancelled:renderCancelled,warning:renderWarning,invalid:renderInvalid,workshop:renderWorkshop,...daily.views};
  function updateContext() {
    const task=document.getElementById("pix-context-task"),feedback=document.getElementById("pix-context-feedback");
    const scenario=!["workshop","charge"].includes(state.screen) && state.draft?.scenario && scenarios[state.draft.scenario];
    task.hidden=!scenario;task.textContent=scenario ? scenario.projectionInstruction:"";
    feedback.hidden=!state.feedback||state.screen==="workshop";feedback.textContent=state.feedback;
    document.getElementById("pix-credit-receipt").hidden=!state.receiveReady||state.receiveCredited||state.screen==="workshop";
    document.getElementById("pix-workshop-mode").hidden=state.participantRoute;
    const next=account.snapshot().scheduledPayments.filter(item=>item.status==="pending").sort((a,b)=>a.date.localeCompare(b.date))[0];
    const advance=document.getElementById("pix-advance-date");
    advance.hidden=state.participantRoute||!next;
    advance.textContent=next ? `Simular dia ${daily.calendarDate(next.date)}`:"Simular data agendada";
    document.getElementById("pix-simulation-date").textContent=`Data da simulação: ${daily.calendarDate(account.snapshot().today)}`;
  }
  function render() {
    clearTimeout(toastTimer);document.body.dataset.pixScreen=state.screen;
    document.title=state.screen==="charge" ? "Cobrança Pix · Banco UnAPI" : state.screen==="workshop" ? "QR Codes da dinâmica · Banco UnAPI" : "Banco UnAPI · Dia a dia";
    app.innerHTML=(views[state.screen]||renderInvalid)();updateContext();
  }
  function go(screen,replace=false) {
    if(!Object.hasOwn(views,screen))return;
    if(!replace&&state.screen!==screen)state.history.push(state.screen);
    state.screen=screen;render();
    const target=app.querySelector("[data-pix-heading]")||app.querySelector(".bank-appbar strong");
    if(target){target.setAttribute("tabindex","-1");target.focus({preventScroll:true});announce(target.textContent);}
  }
  function back() {
    if(state.screen==="workshop"&&state.workshopScenario){state.workshopScenario=null;render();return;}
    if(["home","welcome"].includes(state.screen)&&!state.history.length)return;
    go(state.history.pop()||"home",true);
  }
  function startPix(id,cents=null,source="Chave Pix",scenario=null) {
    state.feedback="";state.pendingScenario=null;state.draft={kind:"pix",recipient:contacts[id],amountCents:cents,source,scenario};go(cents ? "review":"amount");
  }
  function scenarioRecipient(id, scenario) {
    return id==="destinatario-errado"
      ? {id:"wrong",name:scenario.shownName,shortName:scenario.shownName,initials:"CP",documentLabel:scenario.documentLabel,document:scenario.document}
      : contacts.document;
  }
  function openCharge(id) {
    if(!Object.hasOwn(scenarios,id)){go("invalid");return;}
    state.pendingScenario=id;state.draft=null;state.feedback="";go("charge");
  }
  function openScenario(id) {
    if(!Object.hasOwn(scenarios,id)){go("invalid");return;}
    const s=scenarios[id];state.feedback="";
    state.pendingScenario=id;state.draft={kind:"pix",recipient:scenarioRecipient(id,s),amountCents:s.shownAmount*100,source:"QR Code",scenario:id};go("review");
  }
  function openBill(id) {
    const bill=account.snapshot().bills.find(item=>item.id===id);
    if(!bill){toast("Conta não encontrada.");return;}
    state.billId=id;state.pendingScenario=null;state.draft=null;state.feedback="";go("bill-detail");
  }
  function commitPayment() {
    if(state.screen!=="confirm"||state.busy||!state.draft)return;state.busy=true;
    try {
      const draft=state.draft;
      if(draft.scenario&&scenarios[draft.scenario].correctAction==="cancel")throw new Error("Revise os dados do pagamento.");
      if(draft.kind==="bill"&&draft.scheduledDate){const scheduled=account.scheduleBill(draft.billId,draft.scheduledDate);state.scheduleId=scheduled.id;state.history=["home","pay","schedules"];go("schedule",true);return;}
      const transaction=draft.kind==="bill" ? account.payBill(draft.billId):draft.kind==="invoice" ? account.payInvoice():account.payPix(draft.recipient.id,draft.amountCents,draft.source);
      state.transactionId=transaction.id;state.feedback=draft.scenario ? scenarios[draft.scenario].successFeedback:"";state.history=["home"];go("success",true);
    }catch(error){const message=app.querySelector("#bank-payment-error");if(message){message.hidden=false;message.textContent=error.message;message.focus();}else toast(error.message);}finally{state.busy=false;}
  }
  function formError(form,message) {
    const error=form.querySelector("#bank-form-error");if(error){error.hidden=false;error.textContent=message;}
    const field=form.querySelector('input[type="date"]:not(:disabled),input:not([type="radio"]),textarea')||form.querySelector("input");field?.setAttribute("aria-invalid","true");field?.focus();announce(message);
  }
  async function copyText(text, fallback = "Pronto para colar no Banco UnAPI.") {
    state.clipboard=text;
    try {if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(text);toast("Copiado.");}
    catch {toast(fallback);}
  }
  app.addEventListener("submit",event=>{
    const form=event.target;if(!form.dataset.form)return;event.preventDefault();
    const data=new FormData(form),type=form.dataset.form;
    try {
      if(type==="key"){
        const person=contacts[state.keyType];state.keyValue=String(data.get("key")||"").trim();
        const normalize=value=>["phone","document"].includes(person.type) ? value.replace(/\D/g,""):value.toLowerCase();
        if(!state.keyValue||normalize(state.keyValue)!==normalize(person.key))throw Error("Chave não encontrada. Confira os dados ou escolha o contato salvo.");
        startPix(person.id);
      }
      if(["pix-amount","receive","reserve"].includes(type)){
        const cents=parseMoney(data.get("amount"));if(cents===null)throw Error("Informe um valor entre R$ 0,01 e R$ 10.000,00.");
        if(type==="pix-amount"){if(cents>account.snapshot().balanceCents)throw Error("Saldo insuficiente para este valor.");state.draft.amountCents=cents;go("review");}
        if(type==="receive"){state.receiveCents=cents;state.receiveReady=true;state.receiveCredited=false;go("receive-code");}
        if(type==="reserve"){const transaction=account.moveReserve(cents,state.reserveDirection);state.transactionId=transaction.id;state.history=["home","reserve"];go("success",true);}
      }
      if(type==="bill-code"){
        const bill=bills.find(item=>item.code===String(data.get("code")).trim().toUpperCase());if(!bill)throw Error("Código não encontrado. Confira o código da conta.");openBill(bill.id);
      }
      if(type==="bill-when"){
        const bill=account.snapshot().bills.find(item=>item.id===state.billId);
        state.paymentWhen=String(data.get("when"));state.paymentDate=String(data.get("date")||"");
        const later=state.paymentWhen==="later";
        if(later&&(!state.paymentDate||state.paymentDate<=account.snapshot().today||state.paymentDate>bill.dueDate))throw Error("Escolha uma data futura até o vencimento da conta.");
        state.draft={kind:"bill",billId:bill.id,amountCents:bill.amountCents,source:"Saldo em conta",scheduledDate:later ? state.paymentDate:null,recipient:{name:bill.company,initials:bill.initials,documentLabel:"CNPJ",document:bill.document}};
        go("confirm");
      }
      if(type==="history-search"){state.query=String(data.get("query")||"");app.querySelector("#bank-history-results").innerHTML=daily.historyResults();}
      if(type==="copy"){
        const code=String(data.get("code")||"").trim();state.copyCode=code;
        if(code==="UNAPI:CANTINA:1200")startPix("document",1200,"Pix Copia e Cola");
        else {const match=/^UNAPI:RECEBER:(\d{1,7})$/.exec(code),cents=match ? Number(match[1]):0;if(!cents||cents>1000000)throw Error("Código não encontrado. Confira o código recebido.");startPix("own",cents,"Pix Copia e Cola");}
      }
      if(type==="limit"){account.setLimit(Number(data.get("limit")));back();toast("Limite atualizado.");}
    }catch(error){formError(form,error.message);}
  });
  app.addEventListener("input",event=>{
    const form=event.target.closest("form");event.target.removeAttribute("aria-invalid");const error=form?.querySelector("#bank-form-error");if(error)error.hidden=true;
    if(event.target.id==="bank-history-search"){state.query=event.target.value;app.querySelector("#bank-history-results").innerHTML=daily.historyResults();}
  });
  app.addEventListener("change",event=>{
    if(event.target.name==="when"){
      state.paymentWhen=event.target.value;
      const scheduled=state.paymentWhen==="later";
      app.querySelector("#bank-schedule-fields").hidden=!scheduled;
      app.querySelector("#bank-payment-date").disabled=!scheduled;
      if(scheduled)app.querySelector("#bank-payment-date").focus();
    }
    if(event.target.id==="bank-history-period"){state.historyPeriod=event.target.value;app.querySelector("#bank-history-results").innerHTML=daily.historyResults();}
    if(event.target.id==="bank-scan-bill"){state.scanBillId=event.target.value;render();app.querySelector("#bank-scan-bill").focus();}
  });
  app.addEventListener("click",async event=>{
    const control=event.target.closest("[data-action]");if(!control||!app.contains(control)||control.disabled)return;
    const {action,id,screen,field,cents,filter}=control.dataset;
    if(action==="enter-bank"||action==="go-home"){state.history=[];state.pendingScenario=null;state.draft=null;state.feedback="";go("home",true);}
    if(action==="navigate"){state.history=screen==="home" ? []:["home"];state.pendingScenario=null;state.draft=null;state.feedback="";if(["statement","receipts"].includes(screen)){state.query="";state.filter="all";state.historyPeriod="all";}go(screen,true);}
    if(action==="back")back();
    if(action==="continue-charge"&&state.pendingScenario)openScenario(state.pendingScenario);
    if(action==="cancel-charge"){
      const scenario=state.pendingScenario&&scenarios[state.pendingScenario];
      state.history=["home"];state.draft=null;state.feedback=scenario?.correctAction==="cancel" ? scenario.cancelFeedback:"";state.pendingScenario=null;go("cancelled",true);
    }
    if(action==="choose-key"){state.keyValue="";go("key-type");}
    if(action==="select-key-type"&&contactIds.includes(id)){state.keyType=id;state.keyValue="";go("key-input");}
    if(action==="use-training-key"){const input=app.querySelector("#bank-key");input.value=contacts[state.keyType].key;input.removeAttribute("aria-invalid");app.querySelector("#bank-form-error").hidden=true;input.focus();announce("Chave preenchida.");}
    if(action==="contact"&&contactIds.includes(id))startPix(id);
    if(action==="quick-amount"){const input=app.querySelector("#bank-amount");input.value=inputMoney(Number(cents));input.dispatchEvent(new Event("input",{bubbles:true}));announce(`Valor de ${money(Number(cents))}.`);}
    if(action==="continue-review"){
      const scenario=state.draft.scenario&&scenarios[state.draft.scenario];
      if(scenario?.correctAction==="cancel"){state.feedback=scenario.warningFeedback;go("warning");}else go("confirm");
    }
    if(action==="confirm-payment")commitPayment();
    if(action==="cancel-payment"){const scenario=state.draft?.scenario&&scenarios[state.draft.scenario];state.feedback=scenario?.cancelFeedback||"";state.history=["home"];go("cancelled",true);}
    if(action==="another-pix"){state.pendingScenario=null;state.draft=null;state.feedback="";state.history=["home"];go("pix-menu",true);}
    if(action==="view-receipt")go("receipt");
    if(action==="transaction"){state.transactionId=id;go("receipt");}
    if(action==="copy-receipt"){
      const transaction=account.snapshot().transactions.find(item=>item.id===state.transactionId);
      const receipt=["BANCO UNAPI - COMPROVANTE DE TREINAMENTO","SEM VALOR FINANCEIRO",transaction.description,money(transaction.amountCents),transaction.name,`${transaction.documentLabel}: ${transaction.document}`,`Data: ${fullDate(transaction.date)}`,transaction.billName ? `Conta: ${transaction.billName}\nVencimento: ${daily.calendarDate(transaction.dueDate)}\nCódigo: ${transaction.code}`:"",`Forma: ${transaction.source}`,`Identificador: ${transaction.id}`].filter(Boolean).join("\n");
      copyText(receipt,"Não foi possível copiar. O comprovante continua disponível nesta tela.");
    }
    if(action==="filter"){state.filter=filter;render();app.querySelector(`[data-filter="${filter}"]`)?.focus();announce("Extrato filtrado.");}
    if(action==="toggle-balance"){account.toggleBalance();render();app.querySelector('[data-action="toggle-balance"]')?.focus();announce(account.snapshot().hiddenBalance ? "Valores ocultos.":"Valores visíveis.");}
    if(["copy","scan","receive","keys","invoice","limit","virtual","card-settings","profile","help","cards","bill-code","pay","bill-scan","schedules","notifications","card-help","reserve"].includes(action))go(action);
    if(action==="bill")openBill(id);
    if(action==="bill-start"){state.paymentWhen="now";state.paymentDate="";go("bill-when");}
    if(action==="scan-bill")openBill(state.scanBillId);
    if(action==="schedule"){state.scheduleId=id;go("schedule");}
    if(action==="cancel-schedule")go("cancel-schedule");
    if(action==="confirm-cancel-schedule"){
      try{account.cancelSchedule(state.scheduleId);state.history=["home","pay","schedules"];go("schedule",true);}
      catch(error){toast(error.message);}
    }
    if(action==="purchase"){state.purchaseId=id;go("purchase");}
    if(action==="recognize-purchase"){account.recognizePurchase(state.purchaseId);go("purchase",true);announce("Compra reconhecida.");}
    if(action==="protect-card"){account.toggleCard("locked");go("card-help",true);announce(account.snapshot().card.locked ? "Cartão bloqueado temporariamente.":"Cartão desbloqueado.");}
    if(action==="invoice-receipt"){state.transactionId=account.snapshot().transactions.find(item=>item.kind==="invoice").id;go("receipt");}
    if(action==="notification"){
      const item=account.snapshot().notifications.find(item=>item.id===id);
      account.markNotificationRead(id);
      if(item.kind==="bill")openBill(item.targetId);
      if(item.kind==="purchase"){state.purchaseId=item.targetId;go("purchase");}
      if(item.kind==="schedule"){state.scheduleId=item.targetId;go("schedule");}
      if(item.kind==="transaction"){state.transactionId=item.targetId;go("receipt");}
    }
    if(action==="use-bill-code"){app.querySelector("#bank-code").value=bills[0].code;app.querySelector("#bank-code").focus();}
    if(action==="use-copy-code"){app.querySelector("#bank-copy").value="UNAPI:CANTINA:1200";app.querySelector("#bank-copy").focus();}
    if(action==="paste"){
      let text=state.clipboard;
      if(!text){try{text=await navigator.clipboard.readText();}catch{toast("Cole o código no campo acima.");return;}}
      const input=app.querySelector("#bank-copy");if(input){input.value=text.slice(0,500);input.focus();}
    }
    if(action==="copy-receive")copyText(`UNAPI:RECEBER:${state.receiveCents}`);
    if(action==="copy-key")copyText(contacts.own.key);
    if(action==="copy-random-key")copyText("UNAPI-CONTA-MARIA-2026");
    if(action==="scenario")openCharge(id);
    if(action==="pay-invoice"){const value=account.snapshot().card.invoiceCents;if(value){state.pendingScenario=null;state.draft={kind:"invoice",source:"Saldo em conta",amountCents:value,recipient:{name:"Cartão UnAPI · final 2026",initials:"U",documentLabel:"Instituição",document:"Banco UnAPI"}};state.feedback="";go("review");}}
    if(action==="toggle-card"){account.toggleCard(field);render();app.querySelector(`[data-field="${field}"]`)?.focus();announce("Configuração atualizada.");}
    if(action==="create-virtual"){account.createVirtualCard();go("virtual",true);announce("Cartão virtual criado.");}
    if(action==="reserve-save"||action==="reserve-withdraw"){state.reserveDirection=action==="reserve-save" ? "save":"withdraw";go("reserve-amount");}
    if(action==="logout"){state.history=[];go("welcome",true);}
    if(action==="project-qr"&&Object.hasOwn(scenarios,id)){state.workshopScenario=id;go("workshop",true);}
    if(action==="workshop-list"){state.workshopScenario=null;go("workshop",true);}
  });
  function reset() {
    account=createAccount();state={screen:"welcome",history:[],draft:null,pendingScenario:null,workshopMode:false,participantRoute:false,keyType:"email",keyValue:"",filter:"all",query:"",historyPeriod:"all",billId:null,scanBillId:"energy",scheduleId:null,purchaseId:null,paymentWhen:"now",paymentDate:"",logoUrl:href("img/pix/banco-unapi-logo.svg"),transactionId:null,copyCode:"",clipboard:"",receiveCents:2000,receiveReady:false,receiveCredited:false,reserveDirection:"save",workshopScenario:null,feedback:"",busy:false};
    const params=new URLSearchParams(location.search);
    state.workshopMode=params.get("modo")==="oficina";
    state.participantRoute=location.pathname.includes("/pix/qr")&&!state.workshopMode;
    if(state.workshopMode)state.screen="workshop";
    else if(params.has("cenario"))openCharge(params.get("cenario"));
    else if(params.has("receber")){
      const raw=params.get("receber"),cents=/^\d{1,7}$/.test(raw) ? Number(raw):0;
      if(cents>0&&cents<=1000000)startPix("own",cents,"QR Code");else state.screen="invalid";
    }else if(location.pathname.includes("/pix/qr"))state.screen="invalid";
    render();
  }
  document.getElementById("pix-workshop-mode").addEventListener("click",()=>{state.workshopScenario=null;go("workshop");});
  document.getElementById("pix-credit-receipt").addEventListener("click",()=>{
    if(!state.receiveReady||state.receiveCredited)return;
    const transaction=account.receive(state.receiveCents);state.receiveCredited=true;state.transactionId=transaction.id;state.history=["home"];go("success",true);
  });
  document.getElementById("pix-advance-date").addEventListener("click",()=>{
    try{
      const results=account.advanceToNextSchedule();
      state.history=["home","pay"];state.draft=null;state.feedback=`Data simulada: ${daily.calendarDate(account.snapshot().today)}. ${results.filter(item=>item.status==="completed").length} pagamento(s) realizado(s); ${results.filter(item=>item.status==="failed").length} não realizado(s).`;
      go("schedules",true);announce(state.feedback);
    }catch(error){announce(error.message);}
  });
  document.addEventListener("keydown",event=>{if(event.key==="Escape")back();});
  setupShell({device:document.getElementById("pix-device"),resetButton:document.getElementById("pix-reset"),fullscreenButton:document.getElementById("pix-fullscreen"),onReset:()=>{reset();go(state.screen,true);announce("Conta reiniciada.");}});
  setupEdgeSwipe(app,back);
  reset();
})();
