(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches) {
    document.documentElement.classList.add("motion-reduced");
    return;
  }

  const motionGroups = [
    { group: ".topbar", items: ":scope > *", direction: "down", delay: 45 },
    { group: ".hero-content", items: ":scope > h1, .home-option", direction: "up", delay: 55 },
    { group: ".tools-direct", items: ".tools-heading, .tool-row", direction: "up", delay: 42 },
    { group: ".videos-direct", items: ".videos-heading, .video-card", direction: "up", delay: 48 },
    { group: ".mobility-direct", items: ".mobility-heading, .mobility-experience", direction: "up", delay: 60 },
    { group: ".security-shell", items: ".challenge-app, .institutional-footer", direction: "up", delay: 70 },
  ];

  const observedGroups = [];

  const setDirection = (item, direction, index) => {
    const resolvedDirection = direction === "alternating" ? (index % 2 === 0 ? "left" : "right") : direction;
    const values = {
      down: ["0px", "-12px", "0deg"],
      left: ["-18px", "6px", "0deg"],
      right: ["18px", "6px", "0deg"],
      up: ["0px", "18px", "0deg"],
    };
    const [x, y, rotate] = values[resolvedDirection] || values.up;

    item.style.setProperty("--motion-x", x);
    item.style.setProperty("--motion-y", y);
    item.style.setProperty("--motion-rotate", rotate);
  };

  motionGroups.forEach((configuration) => {
    document.querySelectorAll(configuration.group).forEach((group) => {
      const items = [...group.querySelectorAll(configuration.items)].filter(
        (item) => !item.closest("[aria-hidden='true']"),
      );

      if (!items.length) return;

      items.forEach((item, index) => {
        item.classList.add("motion-item");
        item.style.setProperty("--motion-delay", `${index * configuration.delay}ms`);
        setDirection(item, configuration.direction, index);
      });

      observedGroups.push({ group, items });
    });
  });

  if (!observedGroups.length) return;

  document.documentElement.classList.add("motion-ready");

  const reveal = (items) => {
    items.forEach((item) => item.classList.add("is-motion-visible"));
  };

  if (!("IntersectionObserver" in window)) {
    observedGroups.forEach(({ items }) => reveal(items));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const match = observedGroups.find(({ group }) => group === entry.target);
        if (match) reveal(match.items);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -7% 0px" },
  );

  observedGroups.forEach(({ group }) => observer.observe(group));
})();
