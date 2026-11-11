// Execute na raiz do portal: node --test pix/tests/account.test.cjs
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { runInNewContext } = require("node:vm");
const context = { window: {} };
runInNewContext(readFileSync(resolve(__dirname, "../../js/pix-account.js"), "utf8"), context);
const { createAccount, parseMoney } = context.window.BancoUnapi;

test("valores em centavos: formatos brasileiros, limites e entradas inválidas", () => {
  for (const [input, cents] of [["0,01", 1], ["12.34", 1234], ["R$ 1.250,00", 125000], ["10.000,00", 1000000]]) {
    assert.equal(parseMoney(input), cents);
  }
  for (const input of ["", "0", "-10", "NaN", "Infinity", "1e3", "10,001", "1.2.3,45", "12.34,56", "10000,01", "<script>"]) {
    assert.equal(parseMoney(input), null, input);
  }
});

test("Pix só aceita destinatário do catálogo e nunca cria saldo negativo", () => {
  const account = createAccount();
  account.payPix("email", 1234);
  assert.equal(account.snapshot().balanceCents, 123766);
  const before = JSON.stringify(account.snapshot());
  for (const [id, value] of [["email", 123767], ["email", -1], ["email", 0.5], ["__proto__", 100], ["real@example.com", 100]]) {
    assert.throws(() => account.payPix(id, value));
    assert.equal(JSON.stringify(account.snapshot()), before);
  }
});

test("contas e fatura são debitadas uma única vez", () => {
  const account = createAccount();
  account.payBill("water");
  account.payInvoice();
  assert.equal(account.snapshot().balanceCents, 97870);
  assert.equal(account.snapshot().card.invoiceCents, 0);
  const before = JSON.stringify(account.snapshot());
  assert.throws(() => account.payBill("water"));
  assert.throws(() => account.payInvoice());
  assert.equal(JSON.stringify(account.snapshot()), before);
});

test("falha por saldo insuficiente não marca conta ou fatura como paga", () => {
  const account = createAccount();
  account.payPix("email", 125000);
  assert.throws(() => account.payBill("energy"));
  assert.throws(() => account.payInvoice());
  assert.equal(account.snapshot().paidBills.length, 0);
  assert.equal(account.snapshot().card.invoiceCents, 18490);
});

test("guardar e resgatar conservam a soma entre conta e reserva", () => {
  const account = createAccount();
  for (const [value, direction] of [[10000, "save"], [1234, "withdraw"], [500, "save"], [9266, "withdraw"]]) {
    account.moveReserve(value, direction);
    const snapshot = account.snapshot();
    assert.equal(snapshot.balanceCents + snapshot.reserveCents, 125000);
  }
  assert.equal(account.snapshot().reserveCents, 0);
  const before = JSON.stringify(account.snapshot());
  for (const [value, direction] of [[1, "withdraw"], [125001, "save"], [1, "invalid"]]) {
    assert.throws(() => account.moveReserve(value, direction));
    assert.equal(JSON.stringify(account.snapshot()), before);
  }
});

test("extrato reconcilia o saldo e gera identificadores únicos", () => {
  const account = createAccount();
  account.payPix("phone", 1234);
  account.payBill("internet");
  account.receive(2345);
  account.moveReserve(700, "save");
  const { transactions, balanceCents } = account.snapshot();
  assert.equal(transactions.reduce((sum, item) => sum + (item.direction === "in" ? 1 : -1) * item.amountCents, 0), balanceCents);
  assert.equal(new Set(transactions.map(item => item.id)).size, transactions.length);
});

test("cartões, preferências e limite ficam independentes do saldo", () => {
  const account = createAccount();
  account.toggleCard("locked");
  account.createVirtualCard();
  account.toggleCard("virtualLocked");
  account.toggleCard("online");
  account.setLimit(100000);
  const { card, balanceCents } = account.snapshot();
  assert.equal(card.locked, true);
  assert.equal(card.virtual, true);
  assert.equal(card.virtualLocked, true);
  assert.equal(card.online, false);
  assert.equal(card.limitCents, 100000);
  assert.equal(balanceCents, 125000);
  assert.throws(() => account.setLimit(1));
});

test("snapshots não alteram a conta e uma nova instância reinicia tudo", () => {
  const account = createAccount();
  const snapshot = account.snapshot();
  snapshot.balanceCents = 1;
  snapshot.card.locked = true;
  snapshot.transactions[0].amountCents = 1;
  assert.equal(account.snapshot().balanceCents, 125000);
  assert.equal(account.snapshot().card.locked, false);
  assert.equal(account.snapshot().transactions[0].amountCents, 9000);
  account.payPix("email", 2000);
  account.toggleBalance();
  assert.equal(createAccount().snapshot().balanceCents, 125000);
  assert.equal(createAccount().snapshot().hiddenBalance, false);
});

const workshopAccount = () => createAccount({ now: new Date("2026-09-22T10:00:00-04:00") });
const financialState = account => JSON.stringify({ balance: account.snapshot().balanceCents, transactions: account.snapshot().transactions });

test("conta paga liga beneficiário, vencimento, código, extrato e notificação", () => {
  const account = workshopAccount();
  const bill = account.snapshot().bills.find(item => item.id === "energy");
  const transaction = account.payBill(bill.id);
  const snapshot = account.snapshot();
  const paid = snapshot.bills.find(item => item.id === bill.id);
  assert.equal(paid.status, "paid");
  assert.equal(paid.transactionId, transaction.id);
  assert.equal(transaction.code, bill.code);
  assert.equal(transaction.dueDate, bill.dueDate);
  assert.equal(transaction.name, bill.company);
  assert.equal(transaction.billName, bill.name);
  assert.equal(snapshot.balanceCents, 125000 - bill.amountCents);
  assert.equal(snapshot.notifications.find(item => item.kind === "bill").resolved, true);
  assert.equal(snapshot.notifications.find(item => item.kind === "transaction").targetId, transaction.id);
});

test("agendar não debita nem emite transação; pagamento simultâneo é bloqueado", () => {
  const account = workshopAccount();
  const before = financialState(account);
  const scheduled = account.scheduleBill("energy", "2026-09-23");
  assert.equal(scheduled.status, "pending");
  assert.equal(scheduled.transactionId, null);
  assert.equal(financialState(account), before);
  assert.equal(account.snapshot().bills.find(item => item.id === "energy").status, "scheduled");
  const snapshot = JSON.stringify(account.snapshot());
  assert.throws(() => account.scheduleBill("energy", "2026-09-23"));
  assert.throws(() => account.payBill("energy"));
  assert.equal(JSON.stringify(account.snapshot()), snapshot);
});

test("datas inválidas, passadas ou após vencimento não criam agendamento", () => {
  const account = workshopAccount();
  const before = JSON.stringify(account.snapshot());
  for (const date of ["", "2026-09-21", "2026-09-22", "2026-09-24", "2026-02-30", "2026-09-00", "2026-9-23", "invalid"]) {
    assert.throws(() => account.scheduleBill("energy", date), date);
    assert.equal(JSON.stringify(account.snapshot()), before);
  }
  assert.throws(() => account.scheduleBill("unknown", "2026-09-23"));
  account.payBill("energy");
  assert.throws(() => account.scheduleBill("energy", "2026-09-23"));
});

test("cancelar libera a conta sem débito e permite pagar agora uma única vez", () => {
  const account = workshopAccount();
  const before = financialState(account);
  const scheduled = account.scheduleBill("energy", "2026-09-23");
  account.cancelSchedule(scheduled.id);
  const snapshot = account.snapshot();
  assert.equal(financialState(account), before);
  assert.equal(snapshot.scheduledPayments[0].status, "cancelled");
  assert.equal(snapshot.bills.find(item => item.id === "energy").status, "open");
  assert.equal(snapshot.notifications.filter(item => item.kind === "schedule").length, 1);
  assert.equal(snapshot.notifications.find(item => item.kind === "bill").resolved, false);
  assert.throws(() => account.cancelSchedule(scheduled.id));
  assert.throws(() => account.cancelSchedule("missing"));
  assert.throws(() => account.advanceToNextSchedule());
  account.payBill("energy");
  assert.equal(account.snapshot().balanceCents, 112510);
  assert.throws(() => account.payBill("energy"));
});

test("a data simulada executa só os pagamentos daquele dia e não os repete", () => {
  const account = workshopAccount();
  const first = account.scheduleBill("energy", "2026-09-23");
  const second = account.scheduleBill("water", "2026-09-27");
  const results = account.advanceToNextSchedule();
  let snapshot = account.snapshot();
  assert.equal(results.length, 1);
  assert.equal(snapshot.today, "2026-09-23");
  assert.equal(snapshot.balanceCents, 112510);
  assert.equal(snapshot.scheduledPayments.find(item => item.id === second.id).status, "pending");
  const completed = snapshot.scheduledPayments.find(item => item.id === first.id);
  const transaction = snapshot.transactions.find(item => item.id === completed.transactionId);
  assert.equal(transaction.scheduledPaymentId, first.id);
  assert.equal(transaction.billId, "energy");
  assert.equal(new Date(transaction.date).getDate(), 23);
  assert.throws(() => account.cancelSchedule(first.id));
  assert.throws(() => account.payBill("energy"));
  account.advanceToNextSchedule();
  snapshot = account.snapshot();
  assert.equal(snapshot.today, "2026-09-27");
  assert.equal(snapshot.balanceCents, 103870);
  const before = JSON.stringify(snapshot);
  assert.throws(() => account.advanceToNextSchedule());
  assert.equal(JSON.stringify(account.snapshot()), before);
});

test("saldo na data de execução decide o pagamento; falha não vira comprovante", () => {
  const account = workshopAccount();
  const scheduled = account.scheduleBill("energy", "2026-09-23");
  account.payPix("phone", 125000);
  const before = financialState(account);
  account.advanceToNextSchedule();
  const snapshot = account.snapshot();
  assert.equal(financialState(account), before);
  assert.equal(snapshot.scheduledPayments[0].status, "failed");
  assert.equal(snapshot.scheduledPayments[0].transactionId, null);
  assert.equal(snapshot.scheduledPayments[0].reason, "Saldo insuficiente");
  assert.equal(snapshot.bills.find(item => item.id === "energy").status, "open");
  assert.throws(() => account.cancelSchedule(scheduled.id));
  account.receive(20000);
  account.payBill("energy");
  assert.equal(account.snapshot().balanceCents, 7510);
  assert.equal(account.snapshot().transactions.filter(item => item.billId === "energy").length, 1);
});

test("agendamentos no mesmo dia usam ordem estável e o saldo restante", () => {
  const account = workshopAccount();
  const energy = account.scheduleBill("energy", "2026-09-23");
  const water = account.scheduleBill("water", "2026-09-23");
  account.payPix("email", 110000);
  account.advanceToNextSchedule();
  const snapshot = account.snapshot();
  assert.equal(snapshot.scheduledPayments.find(item => item.id === energy.id).status, "completed");
  assert.equal(snapshot.scheduledPayments.find(item => item.id === water.id).status, "failed");
  assert.equal(snapshot.balanceCents, 2510);
  assert.equal(snapshot.transactions.reduce((sum, item) => sum + (item.direction === "in" ? 1 : -1) * item.amountCents, 0), snapshot.balanceCents);
});

test("cancelar e reagendar mantém histórico sem executar a tentativa cancelada", () => {
  const account = workshopAccount();
  const first = account.scheduleBill("water", "2026-09-23");
  account.cancelSchedule(first.id);
  const second = account.scheduleBill("water", "2026-09-24");
  account.advanceToNextSchedule();
  const snapshot = account.snapshot();
  assert.equal(snapshot.scheduledPayments.find(item => item.id === first.id).status, "cancelled");
  assert.equal(snapshot.scheduledPayments.find(item => item.id === second.id).status, "completed");
  assert.equal(snapshot.transactions.filter(item => item.billId === "water").length, 1);
});

test("notificação lida não significa conta paga, compra reconhecida ou débito", () => {
  const account = workshopAccount();
  const snapshot = account.snapshot();
  const billNotice = snapshot.notifications.find(item => item.kind === "bill");
  const purchaseNotice = snapshot.notifications.find(item => item.kind === "purchase");
  const before = financialState(account);
  account.markNotificationRead(billNotice.id);
  account.markNotificationRead("unknown");
  assert.equal(account.snapshot().notifications.find(item => item.id === billNotice.id).read, true);
  assert.equal(account.snapshot().notifications.find(item => item.id === billNotice.id).resolved, false);
  account.toggleCard("locked");
  assert.equal(account.snapshot().notifications.find(item => item.id === purchaseNotice.id).resolved, false);
  account.recognizePurchase(purchaseNotice.targetId);
  assert.equal(account.snapshot().notifications.find(item => item.id === purchaseNotice.id).resolved, true);
  assert.equal(account.snapshot().card.invoiceCents, 18490);
  assert.equal(financialState(account), before);
  assert.throws(() => account.recognizePurchase("unknown"));
  const receipt = account.receive(8000);
  assert.equal(account.snapshot().notifications[0].targetId, receipt.id);
});

test("bloqueio não apaga compras ou altera fatura e preferências continuam reversíveis", () => {
  const account = workshopAccount();
  const purchases = JSON.stringify(account.snapshot().cardPurchases);
  for (const field of ["locked", "online", "contactless", "virtualLocked"]) {
    const initial = account.snapshot().card[field];
    account.toggleCard(field);
    assert.equal(account.snapshot().card[field], !initial);
    account.toggleCard(field);
    assert.equal(account.snapshot().card[field], initial);
  }
  assert.equal(JSON.stringify(account.snapshot().cardPurchases), purchases);
  assert.equal(account.snapshot().cardPurchases.reduce((sum, item) => sum + item.amountCents, 0), account.snapshot().card.invoiceCents);
  account.payInvoice();
  assert.equal(JSON.stringify(account.snapshot().cardPurchases), purchases);
  assert.equal(account.snapshot().card.invoiceCents, 0);
});

test("novas estruturas não vazam estado e o reset restaura datas e situações", () => {
  const account = workshopAccount();
  account.scheduleBill("water", "2026-09-27");
  const before = JSON.stringify(account.snapshot());
  const copy = account.snapshot();
  copy.bills[0].amountCents = 1;
  copy.scheduledPayments[0].status = "completed";
  copy.notifications[0].read = true;
  copy.cardPurchases[0].recognized = true;
  assert.equal(JSON.stringify(account.snapshot()), before);
  account.advanceToNextSchedule();
  const fresh = workshopAccount().snapshot();
  assert.equal(fresh.today, "2026-09-22");
  assert.equal(fresh.balanceCents, 125000);
  assert.equal(fresh.scheduledPayments.length, 0);
  assert.equal(fresh.notifications.length, 2);
  assert.equal(fresh.bills.every(item => item.status === "open"), true);
});

test("datas próximas à virada do mês mantêm vencimentos e execução válidos", () => {
  const account = createAccount({ now: new Date("2026-12-31T12:00:00") });
  assert.equal(account.snapshot().bills.find(item => item.id === "energy").dueDate, "2027-01-01");
  account.scheduleBill("energy", "2027-01-01");
  account.advanceToNextSchedule();
  assert.equal(account.snapshot().today, "2027-01-01");
  assert.equal(account.snapshot().balanceCents, 112510);
});
