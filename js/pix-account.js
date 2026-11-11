(() => {
  "use strict";

  // A conta inteira vive nesta instância. Não há transporte nem persistência.
  const contacts = Object.freeze({
    email: Object.freeze({ id: "email", type: "email", name: "Maria Ferreira dos Santos", shortName: "Maria Ferreira", initials: "MF", label: "E-mail", key: "maria.treino@bancounapi.local", documentLabel: "CPF", document: "***.456.789-**" }),
    phone: Object.freeze({ id: "phone", type: "phone", name: "João Batista de Oliveira", shortName: "João Batista", initials: "JB", label: "Celular", key: "+55 67 90000-0000", documentLabel: "CPF", document: "***.321.654-**" }),
    document: Object.freeze({ id: "document", type: "document", name: "Cantina UnAPI", shortName: "Cantina UnAPI", initials: "CU", label: "CPF/CNPJ", key: "12.345.678/0001-90", documentLabel: "CNPJ", document: "12.345.678/0001-90" }),
    random: Object.freeze({ id: "random", type: "random", name: "Centro de Convivência UnAPI", shortName: "Centro UnAPI", initials: "UC", label: "Chave aleatória", key: "UNAPI-TREINO-2026-CHAVE-ALEATORIA", documentLabel: "CNPJ", document: "98.765.432/0001-10" }),
    own: Object.freeze({ id: "own", type: "email", name: "Maria Oliveira", shortName: "Maria Oliveira", initials: "MO", label: "E-mail", key: "maria.oliveira@bancounapi.local", documentLabel: "CPF", document: "***.123.456-**" }),
  });

  const bills = Object.freeze([
    Object.freeze({ id: "water", name: "Água e saneamento", company: "Águas da Oficina", initials: "AO", amountCents: 8640, code: "UNAPI-AGUA-08640", document: "11.222.333/0001-00", dueInDays: 5 }),
    Object.freeze({ id: "energy", name: "Energia elétrica", company: "Energia UnAPI", initials: "EU", amountCents: 12490, code: "UNAPI-LUZ-12490", document: "22.333.444/0001-00", dueInDays: 1 }),
    Object.freeze({ id: "internet", name: "Internet", company: "Conecta Oficina", initials: "CO", amountCents: 9990, code: "UNAPI-INTERNET-09990", document: "33.444.555/0001-00", dueInDays: 8 }),
  ]);

  function parseMoney(value) {
    let text = String(value).trim().replace(/\s|R\$/gi, "");
    if (text.includes(",")) {
      if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(text)) return null;
      text = text.replace(/\./g, "").replace(",", ".");
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const cents = Math.round(Number(text) * 100);
    return Number.isSafeInteger(cents) && cents > 0 && cents <= 1000000 ? cents : null;
  }

  const dayKey = value => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  function validDay(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()) && dayKey(new Date(`${value}T12:00:00`)) === value;
  }

  function createAccount({ now = new Date() } = {}) {
    let serial = 0;
    let scheduleSerial = 0;
    let notificationSerial = 0;
    let clock = new Date(now);
    const dayAfter = days => { const value = new Date(now); value.setDate(value.getDate() + days); return dayKey(value); };
    const dateBefore = days => new Date(now.getTime() - days * 86400000).toISOString();
    const accountBills = bills.map(bill => ({ ...bill, dueDate: dayAfter(bill.dueInDays) }));
    const bank = {
      balanceCents: 125000, reserveCents: 0, hiddenBalance: false, today: dayKey(clock),
      card: { locked: false, online: true, contactless: true, virtual: false, virtualLocked: false, limitCents: 200000, invoiceCents: 18490 },
      invoiceDueDate: dayAfter(6),
      scheduledPayments: [], notifications: [],
      cardPurchases: [
        { id: "purchase-market", name: "Mercado da Praça", amountCents: 8990, date: dateBefore(3), location: "Campo Grande, MS", cardLast4: "2026", method: "Cartão físico · chip", recognized: false },
        { id: "purchase-pharmacy", name: "Farmácia da Oficina", amountCents: 6500, date: dateBefore(1), location: "Campo Grande, MS", cardLast4: "2026", method: "Cartão físico · aproximação", recognized: false },
        { id: "purchase-books", name: "Livraria UnAPI", amountCents: 3000, date: dateBefore(2), location: "Campo Grande, MS", cardLast4: "2026", method: "Cartão físico · chip", recognized: false },
      ],
      transactions: [
        { id: "UNAPI-INICIO-04", date: dateBefore(1), amountCents: 9000, direction: "out", kind: "payment", name: "Águas da Oficina", description: "Água · conta anterior", billId: "water-previous", billName: "Água · conta anterior", dueDate: dayAfter(-1), code: "UNAPI-AGUA-ANTERIOR-09000", documentLabel: "CNPJ", document: "11.222.333/0001-00", source: "Pagamento de conta" },
        { id: "UNAPI-INICIO-03", date: dateBefore(2), amountCents: 3500, direction: "out", kind: "pix", name: "Farmácia da Oficina", description: "Pix enviado", documentLabel: "CNPJ", document: "44.555.666/0001-00", source: "Chave Pix" },
        { id: "UNAPI-INICIO-02", date: dateBefore(3), amountCents: 12500, direction: "out", kind: "pix", name: "Mercado da Praça", description: "Pix enviado", documentLabel: "CNPJ", document: "55.666.777/0001-00", source: "QR Code" },
        { id: "UNAPI-INICIO-01", date: dateBefore(4), amountCents: 150000, direction: "in", kind: "income", name: "Crédito em conta", description: "Valor recebido", documentLabel: "Origem", document: "Banco UnAPI", source: "Crédito" },
      ],
    };
    function validAmount(cents) {
      if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 1000000) throw new Error("Informe um valor válido.");
    }
    function post(data) {
      validAmount(data.amountCents);
      if (data.direction === "out" && data.amountCents > bank.balanceCents) throw new Error("Saldo insuficiente. O pagamento não foi realizado.");
      const transaction = { ...data, id: `UNAPI-${clock.getFullYear()}-${String(++serial).padStart(6, "0")}`, date: clock.toISOString() };
      bank.balanceCents += (data.direction === "in" ? 1 : -1) * data.amountCents;
      bank.transactions.unshift(transaction);
      return { ...transaction };
    }
    function notify(kind, targetId) {
      const index = bank.notifications.findIndex(item => item.kind === kind && item.targetId === targetId);
      const previous = index < 0 ? null : bank.notifications.splice(index, 1)[0];
      bank.notifications.unshift({ id: previous?.id || `notice-${++notificationSerial}`, kind, targetId, date: clock.toISOString(), read: false });
    }
    const paidTransaction = id => bank.transactions.find(item => item.billId === id);
    const pendingSchedule = id => bank.scheduledPayments.find(item => item.billId === id && item.status === "pending");
    function availableBill(id) {
      const bill = accountBills.find(item => item.id === id);
      if (!bill || paidTransaction(id)) throw new Error("Esta conta já foi paga ou não está disponível.");
      return bill;
    }
    function settleBill(bill, schedule = null) {
      const transaction = post({ amountCents: bill.amountCents, direction: "out", kind: "payment", name: bill.company, documentLabel: "CNPJ", document: bill.document, description: bill.name, source: schedule ? "Pagamento agendado" : "Pagamento de conta", billId: bill.id, billName: bill.name, code: bill.code, dueDate: bill.dueDate, scheduledPaymentId: schedule?.id || null });
      if (schedule) { schedule.status = "completed"; schedule.transactionId = transaction.id; }
      notify("transaction", transaction.id);
      return transaction;
    }
    notify("purchase", "purchase-pharmacy");
    notify("bill", "energy");
    return Object.freeze({
      snapshot() {
        return {
          ...bank, card: { ...bank.card },
          bills: accountBills.map(bill => {
            const transaction = paidTransaction(bill.id), scheduled = pendingSchedule(bill.id);
            return { ...bill, status: transaction ? "paid" : scheduled ? "scheduled" : bill.dueDate < bank.today ? "overdue" : "open", transactionId: transaction?.id || null, scheduledPaymentId: scheduled?.id || null };
          }),
          paidBills: accountBills.filter(bill => paidTransaction(bill.id)).map(bill => bill.id),
          transactions: bank.transactions.map(item => ({ ...item })),
          scheduledPayments: bank.scheduledPayments.map(item => ({ ...item })),
          cardPurchases: bank.cardPurchases.map(item => ({ ...item })),
          notifications: bank.notifications.map(item => ({ ...item,
            resolved: item.kind === "bill" ? Boolean(paidTransaction(item.targetId) || pendingSchedule(item.targetId)) : item.kind === "purchase" ? bank.cardPurchases.find(purchase => purchase.id === item.targetId).recognized : item.kind === "schedule" ? bank.scheduledPayments.find(schedule => schedule.id === item.targetId).status !== "pending" : true,
          })),
        };
      },
      toggleBalance() { bank.hiddenBalance = !bank.hiddenBalance; },
      payPix(contactId, amountCents, source = "Chave Pix") {
        if (!Object.hasOwn(contacts, contactId)) throw new Error("Destinatário não encontrado.");
        const person = contacts[contactId];
        return post({ amountCents, direction: "out", kind: "pix", name: person.name, documentLabel: person.documentLabel, document: person.document, key: person.key, description: "Pix enviado", source });
      },
      payBill(id) {
        const bill = availableBill(id);
        if (pendingSchedule(id)) throw new Error("Esta conta está agendada. Cancele o agendamento antes de pagar agora.");
        return settleBill(bill);
      },
      scheduleBill(id, date) {
        const bill = availableBill(id);
        if (pendingSchedule(id)) throw new Error("Esta conta já está agendada.");
        if (!validDay(date) || date <= bank.today || date > bill.dueDate) throw new Error("Escolha uma data futura até o vencimento da conta.");
        const schedule = { id: `schedule-${++scheduleSerial}`, billId: id, date, amountCents: bill.amountCents, status: "pending", createdAt: clock.toISOString(), transactionId: null, reason: null };
        bank.scheduledPayments.unshift(schedule);
        notify("schedule", schedule.id);
        return { ...schedule };
      },
      cancelSchedule(id) {
        const schedule = bank.scheduledPayments.find(item => item.id === id);
        if (!schedule || schedule.status !== "pending") throw new Error("Este agendamento não pode ser cancelado.");
        schedule.status = "cancelled";
        notify("schedule", schedule.id);
      },
      advanceToNextSchedule() {
        const pending = bank.scheduledPayments.filter(item => item.status === "pending").sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || Number(a.id.split("-")[1]) - Number(b.id.split("-")[1]));
        if (!pending.length) throw new Error("Não há pagamentos agendados.");
        bank.today = pending[0].date;
        clock = new Date(`${bank.today}T12:00:00`);
        // A oficina avança um dia de execução por vez, sem temporizadores ou débitos duplicados.
        const results = [];
        for (const schedule of pending.filter(item => item.date === bank.today)) {
          const bill = availableBill(schedule.billId);
          if (schedule.amountCents > bank.balanceCents) {
            schedule.status = "failed"; schedule.reason = "Saldo insuficiente";
            notify("schedule", schedule.id);
          } else { settleBill(bill, schedule); }
          results.push({ ...schedule });
        }
        return results;
      },
      markNotificationRead(id) {
        const notification = bank.notifications.find(item => item.id === id);
        if (notification) notification.read = true;
      },
      recognizePurchase(id) {
        const purchase = bank.cardPurchases.find(item => item.id === id);
        if (!purchase) throw new Error("Compra não encontrada.");
        purchase.recognized = true;
      },
      payInvoice() {
        if (!bank.card.invoiceCents) throw new Error("Sua fatura já está paga.");
        const transaction = post({ amountCents: bank.card.invoiceCents, direction: "out", kind: "invoice", name: "Cartão UnAPI · final 2026", documentLabel: "Instituição", document: "Banco UnAPI", description: "Pagamento da fatura", source: "Saldo em conta" });
        bank.card.invoiceCents = 0;
        return transaction;
      },
      toggleCard(field) {
        if (!["locked", "online", "contactless", "virtualLocked"].includes(field)) return;
        bank.card[field] = !bank.card[field];
      },
      createVirtualCard() { bank.card.virtual = true; },
      setLimit(cents) {
        if (![50000, 100000, 200000, 300000].includes(cents) || cents < bank.card.invoiceCents) throw new Error("O limite deve cobrir a fatura atual.");
        bank.card.limitCents = cents;
      },
      moveReserve(cents, direction) {
        validAmount(cents);
        if (!["save", "withdraw"].includes(direction)) throw new Error("Operação não disponível.");
        if (direction === "withdraw" && cents > bank.reserveCents) throw new Error("O valor é maior que o disponível na reserva.");
        const transaction = post({ amountCents: cents, direction: direction === "withdraw" ? "in" : "out", kind: "reserve", name: "Minha reserva", description: direction === "withdraw" ? "Resgate da reserva" : "Valor guardado", documentLabel: "Titular", document: contacts.own.name, source: "Transferência entre saldos" });
        bank.reserveCents += direction === "withdraw" ? -cents : cents;
        return transaction;
      },
      receive(cents) {
        const transaction = post({ amountCents: cents, direction: "in", kind: "income", name: "João Batista de Oliveira", description: "Pix recebido", documentLabel: "CPF", document: "***.321.654-**", source: "Pix" });
        notify("transaction", transaction.id);
        return transaction;
      },
    });
  }
  window.BancoUnapi = Object.freeze({ contacts, bills, parseMoney, createAccount });
})();
