const rail = document.querySelector(".scroll-rail span");
const revealItems = document.querySelectorAll(".reveal");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function updateRail() {
  if (!rail) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  rail.style.transform = `scaleY(${Math.min(1, Math.max(0, progress))})`;
}

function revealNow() {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealNow();
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

updateRail();
window.addEventListener("scroll", updateRail, { passive: true });
window.addEventListener("resize", updateRail);
