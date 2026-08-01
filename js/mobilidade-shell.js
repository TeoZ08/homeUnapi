(() => {
  const tools = document.querySelector(".simulator-tools");
  if (!tools) return;

  const toggle = tools.querySelector(".simulator-tools-toggle");

  function closeTools({ restoreFocus = false } = {}) {
    if (!tools.classList.contains("is-open")) return;
    tools.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    if (restoreFocus) toggle?.focus();
  }

  toggle?.addEventListener("click", () => {
    const isOpen = tools.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!tools.classList.contains("is-open")) return;
    if (!tools.contains(event.target) || event.target.closest(".simulator-control")) closeTools();
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || !tools.classList.contains("is-open")) return;
      event.preventDefault();
      event.stopPropagation();
      closeTools({ restoreFocus: true });
    },
    true,
  );
})();
