(() => {
  "use strict";

  // Telas de rotina usam o mesmo estado e os mesmos controles dos fluxos Pix.
  window.createBancoUnapiDaily = ({ getAccount, getState, shell, heading, button, row, detail, icon, money, date, fullDate, esc, transactionRows, displayMoney }) => {
    const bank = () => getAccount().snapshot();
    const state = () => getState();
    const calendarDate = value => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(`${value}T12:00:00`));
    const billStatus = { open: "Em aberto", overdue: "Vencida", scheduled: "Agendada", paid: "Paga" };
    const scheduleStatus = { pending: "Agendado", cancelled: "Cancelado", completed: "Pago", failed: "Não realizado" };
    const status = (label, kind = "") => `<span class="bank-status ${kind === "overdue" || kind === "failed" ? "is-danger" : kind === "paid" || kind === "completed" ? "" : "is-neutral"}">${esc(label)}</span>`;
    const findBill = id => bank().bills.find(item => item.id === id);
    const billDetails = bill => `<dl class="bank-details">${detail("Beneficiário", bill.company)}${detail("CNPJ", bill.document)}${detail("Vencimento", calendarDate(bill.dueDate))}${detail("Código de pagamento", bill.code)}</dl>`;

    function renderPay() {
      const snapshot = bank();
      const pending = snapshot.scheduledPayments.filter(item => item.status === "pending").length;
      return shell("Pagamentos", `${heading("Pagar contas")}
        <div class="bank-pix-grid bank-pay-options"><button type="button" class="bank-pix-tile" data-action="bill-scan">${icon("pay")}<span><strong>Ler código</strong><small>Leitura simulada</small></span></button><button type="button" class="bank-pix-tile" data-action="bill-code">${icon("receipt")}<span><strong>Digitar código</strong><small>Código da conta</small></span></button></div>
        ${row("Agendamentos", pending ? `${pending} pendente${pending > 1 ? "s" : ""}` : "Consultar pagamentos programados", "schedules", "calendar")}
        <div class="bank-section-title"><h2>Minhas contas</h2></div><div class="bank-bills">${snapshot.bills.map(bill => `<button type="button" class="bank-bill" data-action="bill" data-id="${bill.id}"><span class="bank-row-icon">${icon("receipt")}</span><span><strong>${esc(bill.name)}</strong><small>Vence ${calendarDate(bill.dueDate)}</small>${status(billStatus[bill.status], bill.status)}</span><strong>${displayMoney(bill.amountCents)}</strong></button>`).join("")}</div>`);
    }
    function renderBillDetail() {
      const bill = findBill(state().billId);
      const actions = bill.status === "paid" ? button("Ver comprovante", "transaction", "primary", `data-id="${bill.transactionId}"`) : bill.status === "scheduled" ? button("Ver agendamento", "schedule", "primary", `data-id="${bill.scheduledPaymentId}"`) : button("Pagar ou agendar", "bill-start");
      return shell("Conferir conta", `${heading(bill.name)}<div class="bank-review-total"><strong>${money(bill.amountCents)}</strong></div>${status(billStatus[bill.status], bill.status)}${billDetails(bill)}${bill.status === "overdue" ? '<p class="bank-muted">Conta vencida. Valor mantido nesta conta fictícia.</p>' : ""}`, actions);
    }
    function renderBillWhen() {
      const bill = findBill(state().billId), snapshot = bank();
      const future = bill.dueDate > snapshot.today;
      const scheduled = state().paymentWhen === "later" && future;
      const tomorrow = new Date(`${snapshot.today}T12:00:00`); tomorrow.setDate(tomorrow.getDate() + 1);
      const min = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
      return shell("Data do pagamento", `${heading("Quando quer pagar?")}<p>${esc(bill.name)} · <strong>${money(bill.amountCents)}</strong></p><form class="bank-form" data-form="bill-when" novalidate><fieldset><legend>Data do pagamento</legend><div class="bank-limit-options"><label><input type="radio" name="when" value="now" ${scheduled ? "" : "checked"} />Pagar agora</label><label><input type="radio" name="when" value="later" ${scheduled ? "checked" : ""} ${future ? "" : "disabled"} />Agendar para outro dia</label></div></fieldset><div id="bank-schedule-fields" ${scheduled ? "" : "hidden"}><label class="bank-field-label" for="bank-payment-date">Data agendada</label><input class="bank-field" type="date" id="bank-payment-date" name="date" min="${min}" max="${bill.dueDate}" value="${esc(state().paymentDate || bill.dueDate)}" aria-describedby="bank-date-help bank-form-error" ${scheduled ? "" : "disabled"} /><p id="bank-date-help" class="bank-muted">Até o vencimento: ${calendarDate(bill.dueDate)}. O saldo será usado somente na data escolhida.</p></div><p class="bank-muted">Saldo disponível: ${displayMoney(snapshot.balanceCents)}</p><p id="bank-form-error" class="bank-field-error" role="alert" hidden></p><button type="submit" class="bank-button is-primary">Continuar</button></form>`);
    }
    function renderBillScan() {
      const bill = findBill(state().scanBillId);
      return shell("Leitura simulada", `${heading("Código de barras")}<label for="bank-scan-bill" class="bank-field-label">Conta da oficina</label><select class="bank-field" id="bank-scan-bill">${bank().bills.map(item => `<option value="${item.id}" ${item.id === bill.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select><div class="bank-scan-document"><img src="${state().logoUrl}" alt="Banco UnAPI" /><strong>${esc(bill.company)}</strong><span>${esc(bill.name)}</span><dl class="bank-details">${detail("Valor", money(bill.amountCents))}${detail("Vencimento", calendarDate(bill.dueDate))}</dl><div class="bank-barcode" aria-hidden="true"></div><span class="bank-code-text">${esc(bill.code)}</span></div><p class="bank-muted">Leitura simulada. A câmera está desligada.</p>`, button("Simular leitura", "scan-bill"));
    }
    function renderSchedules() {
      const items = bank().scheduledPayments;
      return shell("Agendamentos", `${heading("Pagamentos agendados")}${items.length ? `<div class="bank-list">${items.map(item => row(findBill(item.billId).name, `${calendarDate(item.date)} · ${scheduleStatus[item.status]} · ${money(item.amountCents)}`, "schedule", "calendar", `data-id="${item.id}"`)).join("")}</div>` : '<p class="bank-empty">Nenhum pagamento agendado.</p>'}`, button("Ver contas", "pay", "secondary"));
    }
    function renderSchedule() {
      const item = bank().scheduledPayments.find(item => item.id === state().scheduleId), bill = findBill(item.billId);
      const currentBill = bill.status === "paid" ? "A conta foi paga em outra operação." : bill.status === "scheduled" ? "A conta tem um novo agendamento." : "A conta continua em aberto.";
      const descriptions = { pending: "O valor ainda não saiu da conta. Mantenha saldo disponível na data do pagamento.", cancelled: "Nenhum valor foi debitado por este agendamento.", completed: "O valor foi debitado da conta. O comprovante está disponível.", failed: `Saldo insuficiente na data agendada. Este agendamento não debitou nenhum valor. ${currentBill}` };
      let actions = button("Ver conta", "bill", "secondary", `data-id="${bill.id}"`);
      if (item.status === "pending") actions = button("Cancelar agendamento", "cancel-schedule", "secondary");
      if (item.status === "completed") actions = button("Ver comprovante", "transaction", "primary", `data-id="${item.transactionId}"`);
      return shell("Agendamento", `${heading(item.status === "pending" ? "Pagamento agendado" : `Agendamento ${item.status === "cancelled" ? "cancelado" : item.status === "failed" ? "não realizado" : "concluído"}`)}${status(scheduleStatus[item.status], item.status)}<div class="bank-review-total"><strong>${money(item.amountCents)}</strong></div><p>${descriptions[item.status]}</p><dl class="bank-details">${detail("Conta", bill.name)}${detail("Beneficiário", bill.company)}${detail("Data agendada", calendarDate(item.date))}${detail("Vencimento", calendarDate(bill.dueDate))}${detail("Identificador do agendamento", item.id)}</dl>`, actions);
    }
    function renderCancelSchedule() {
      const item = bank().scheduledPayments.find(item => item.id === state().scheduleId), bill = findBill(item.billId);
      return shell("Cancelar agendamento", `${heading("Cancelar este agendamento?")}<dl class="bank-details">${detail("Conta", bill.name)}${detail("Valor", money(item.amountCents))}${detail("Data agendada", calendarDate(item.date))}</dl><p class="bank-muted">A conta continuará em aberto. Nenhum valor será debitado.</p>`, `${button("Manter", "back", "secondary")}${button("Confirmar cancelamento", "confirm-cancel-schedule")}`);
    }
    const normalize = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    function historyItems() {
      const { query, filter, historyPeriod } = state();
      const snapshot = bank();
      return snapshot.transactions.filter(item => (filter === "all" || item.direction === filter) && (historyPeriod === "all" || new Date(item.date).toDateString() === new Date(`${snapshot.today}T12:00:00`).toDateString()) && normalize(`${item.name} ${item.description} ${item.id}`).includes(normalize(query.trim())));
    }
    function historyResults() {
      const items = historyItems();
      return `<p class="bank-muted" role="status">${items.length} movimentaç${items.length === 1 ? "ão encontrada" : "ões encontradas"}</p>${transactionRows(items)}`;
    }
    function renderHistory(receipts = false) {
      const snapshot = bank();
      const balance = receipts ? "" : `<div class="bank-statement-balance"><span>Saldo em conta</span><strong>${displayMoney(snapshot.balanceCents)}</strong><button class="bank-icon-button" type="button" data-action="toggle-balance" aria-label="${snapshot.hiddenBalance ? "Mostrar" : "Ocultar"} valores" aria-pressed="${snapshot.hiddenBalance}">${icon(snapshot.hiddenBalance ? "eyeOff" : "eye")}</button></div>`;
      return shell(receipts ? "Comprovantes" : "Extrato", `${balance}${heading(receipts ? "Seus comprovantes" : "Movimentações")}<form class="bank-form bank-search" data-form="history-search"><label for="bank-history-search">Buscar nome ou pagamento</label><input id="bank-history-search" class="bank-field" type="search" name="query" maxlength="80" autocomplete="off" value="${esc(state().query)}" /><label for="bank-history-period">Período</label><select id="bank-history-period" class="bank-field"><option value="all">Todo o período</option><option value="today" ${state().historyPeriod === "today" ? "selected" : ""}>Hoje</option></select></form><div class="bank-filters" aria-label="Filtrar movimentações">${[["all", "Todas"], ["in", "Entradas"], ["out", "Saídas"]].map(([filter, label]) => button(label, "filter", "chip", `data-filter="${filter}" aria-pressed="${filter === state().filter}"`)).join("")}</div><div id="bank-history-results">${historyResults()}</div>`, "", receipts ? "" : "statement");
    }
    function notificationContent(item) {
      const snapshot = bank();
      if (item.kind === "bill") {
        const bill = findBill(item.targetId);
        return { title: bill.name, description: `${billStatus[bill.status]} · vence ${calendarDate(bill.dueDate)} · ${snapshot.hiddenBalance ? "Valor oculto" : money(bill.amountCents)}`, symbol: "receipt" };
      }
      if (item.kind === "schedule") {
        const scheduled = snapshot.scheduledPayments.find(schedule => schedule.id === item.targetId);
        return { title: `Pagamento ${scheduleStatus[scheduled.status].toLowerCase()}`, description: `${findBill(scheduled.billId).name} · ${calendarDate(scheduled.date)}`, symbol: "calendar" };
      }
      if (item.kind === "purchase") {
        const purchase = snapshot.cardPurchases.find(purchase => purchase.id === item.targetId);
        return { title: "Compra no cartão", description: `${purchase.name} · ${snapshot.hiddenBalance ? "Valor oculto" : money(purchase.amountCents)}${purchase.recognized ? " · Reconhecida" : ""}`, symbol: "card" };
      }
      const transaction = snapshot.transactions.find(transaction => transaction.id === item.targetId);
      return { title: transaction.description, description: `${transaction.name} · ${snapshot.hiddenBalance ? "Valor oculto" : money(transaction.amountCents)}`, symbol: "receipt" };
    }
    function renderNotifications() {
      return shell("Notificações", `${heading("Notificações")}<div class="bank-notifications">${bank().notifications.map(item => { const copy = notificationContent(item); return row(copy.title, `${item.read ? "Lida" : "Não lida"} · ${copy.description}`, "notification", copy.symbol, `data-id="${item.id}"`); }).join("")}</div>`);
    }
    function renderPurchase() {
      const purchase = bank().cardPurchases.find(item => item.id === state().purchaseId);
      return shell("Compra no cartão", `${heading(purchase.name)}<div class="bank-review-total"><strong>${money(purchase.amountCents)}</strong></div>${status(purchase.recognized ? "Compra reconhecida" : "Compra aprovada")}<dl class="bank-details">${detail("Data e hora", fullDate(purchase.date))}${detail("Local", purchase.location)}${detail("Cartão utilizado", `Final ${purchase.cardLast4}`)}${detail("Forma da compra", purchase.method)}</dl>`, purchase.recognized ? button("Voltar à fatura", "invoice", "secondary") : `${button("Não reconheço", "card-help", "secondary")}${button("Reconheço a compra", "recognize-purchase")}`);
    }
    function renderCardHelp() {
      const locked = bank().card.locked;
      return shell("Segurança do cartão", `${heading(locked ? "Cartão bloqueado" : "Proteja seu cartão")}<div class="bank-card-status">${icon("lock")}<strong>Cartão físico · final 2026</strong></div><p>${locked ? "O bloqueio temporário está ativo. Ele não cancela compras já realizadas." : "Não encontrou o cartão ou não reconhece uma compra? Você pode bloquear o cartão temporariamente."}</p><p class="bank-muted">Para uma compra desconhecida, procure o atendimento oficial do seu banco. Bloquear o cartão não contesta a compra.</p>`, `${button(locked ? "Desbloquear cartão" : "Bloquear temporariamente", "protect-card")}${button("Ver cartões", "cards", "secondary")}`);
    }
    return { calendarDate, billDetails, historyResults, notificationContent, views: { pay: renderPay, "bill-detail": renderBillDetail, "bill-when": renderBillWhen, "bill-scan": renderBillScan, schedules: renderSchedules, schedule: renderSchedule, "cancel-schedule": renderCancelSchedule, receipts: () => renderHistory(true), statement: () => renderHistory(), notifications: renderNotifications, purchase: renderPurchase, "card-help": renderCardHelp } };
  };
})();
