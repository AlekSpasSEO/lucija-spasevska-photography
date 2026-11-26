document.documentElement.classList.add("js");

const tabs = Array.from(document.querySelectorAll(".feature-tab"));
const stageImage = document.querySelector(".stage-image");
const stageLink = document.querySelector(".stage a");
const featureName = document.querySelector(".feature-name");
let featureVersion = 0;

function showFeature(button) {
  const version = ++featureVersion;
  const { photo, small, title, href, alt, focus } = button.dataset;
  const next = new Image();
  next.sizes = "(max-width: 550px) 95vw, 91vw";
  next.srcset = small + " " + button.dataset.thumbWidth + "w, " + photo + " " + button.dataset.width + "w";
  next.src = photo;
  next.onload = () => {
    if (version !== featureVersion) return;
    stageImage.srcset = next.srcset;
    stageImage.src = photo;
    stageImage.alt = alt;
    stageImage.style.objectPosition = focus;
    stageLink.href = href;
    stageLink.setAttribute("aria-label", "View " + title);
    featureName.textContent = title;
    featureName.href = href;
    for (const tab of tabs) tab.setAttribute("aria-pressed", String(tab === button));
  };
}

tabs.forEach((button, index) => {
  button.addEventListener("click", () => showFeature(button));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let target = index + (event.key === "ArrowRight" ? 1 : -1);
    if (event.key === "Home") target = 0;
    if (event.key === "End") target = tabs.length - 1;
    const next = tabs[(target + tabs.length) % tabs.length];
    next.focus();
    showFeature(next);
  });
});

const dialog = document.querySelector(".viewer");
if (dialog && typeof dialog.showModal === "function") {
  const links = Array.from(document.querySelectorAll(".photo-link"));
  const image = dialog.querySelector(".viewer-photo img");
  const counter = dialog.querySelector(".viewer-index");
  const closeButton = dialog.querySelector("[data-close]");
  let index = 0;
  let opener;
  let start;

  function show(position) {
    index = (position + links.length) % links.length;
    image.src = links[index].href;
    image.alt = links[index].querySelector("img").alt;
    counter.textContent = (index + 1) + " / " + links.length;
  }
  links.forEach((link, position) => {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      show(position);
      dialog.showModal();
      closeButton.focus();
    });
  });
  closeButton.addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-prev]").addEventListener("click", () => show(index - 1));
  dialog.querySelector("[data-next]").addEventListener("click", () => show(index + 1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      show(index + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  image.addEventListener("touchstart", (event) => {
    start = event.touches.length === 1 ? event.touches[0] : null;
  }, { passive: true });
  image.addEventListener("touchend", (event) => {
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.clientX;
    const dy = event.changedTouches[0].clientY - start.clientY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
    start = null;
  }, { passive: true });
  dialog.addEventListener("close", () => opener?.focus({ preventScroll: true }));
}
