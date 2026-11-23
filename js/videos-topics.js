(() => {
  const links = Array.from(document.querySelectorAll("[data-video-topic]"));
  const groups = Array.from(document.querySelectorAll(".video-group"));
  const status = document.querySelector(".videos-selection-status");
  if (!links.length || !groups.length) return;

  const valid = new Set(groups.map((section) => section.id));

  function selectTopic(id) {
    if (!valid.has(id)) return;

    groups.forEach((section) => {
      section.hidden = section.id !== id;
    });

    links.forEach((link) => {
      if (link.dataset.videoTopic === id) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    const section = document.getElementById(id);
    const heading = section.querySelector("h2")?.textContent.trim() || "o assunto";
    const count = section.querySelectorAll(".video-card").length;
    if (status) {
      status.textContent = "Exibindo " + count + " vídeos de " + heading + ".";
    }
  }

  const hash = decodeURIComponent(window.location.hash.slice(1));
  selectTopic(valid.has(hash) ? hash : links[0].dataset.videoTopic);
  // A deep link should open the selector at the top, not a half-scrolled section.
  if (valid.has(hash)) {
    requestAnimationFrame(() => window.scrollTo(0, 0));
    window.addEventListener("load", () => window.scrollTo(0, 0), { once: true });
  }

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const id = link.dataset.videoTopic;
      selectTopic(id);
      history.replaceState(null, "", "#" + id);
    });
  });

  window.addEventListener("hashchange", () => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (valid.has(id)) selectTopic(id);
  });
})();
