document.documentElement.classList.add("js");

const tabs = Array.from(document.querySelectorAll(".feature-tab"));
const stageImage = document.querySelector(".stage-image");
const stageLink = document.querySelector(".stage a");
const featureName = document.querySelector(".feature-name");
let featureVersion = 0;

// Keep a photograph inside its native pixel budget on dense displays, including
// crops where the painted image extends beyond the edges of its visible frame.
const covers = [...document.querySelectorAll(".stage-image, .cover img, .about-figure img")];
const galleryPhotos = [...document.querySelectorAll(".photo-link")];
function fitCover(image) {
  const ratio = window.devicePixelRatio || 1;
  const maxWidth = Number(image.dataset.nativeWidth) / ratio;
  const maxHeight = Number(image.dataset.nativeHeight) / ratio;
  if (!maxWidth || !maxHeight) return;
  const width = image.clientWidth;
  const height = image.clientHeight;
  const needsMat = width > maxWidth + 1 || height > maxHeight + 1;
  image.classList.toggle("native-frame", needsMat);
  image.style.paddingInline = needsMat ? Math.max(0,(width-maxWidth)/2) + "px" : "";
  image.style.paddingBlock = needsMat ? Math.max(0,(height-maxHeight)/2) + "px" : "";
}
function fitViewer(image) {
  const density = window.devicePixelRatio || 1;
  image.style.maxWidth = Number(image.dataset.nativeWidth) / density + "px";
  image.style.maxHeight = Number(image.dataset.nativeHeight) / density + "px";
}
function fitPhotographs() {
  covers.forEach(fitCover);
  for (const link of galleryPhotos) {
    link.style.maxWidth = Number(link.dataset.fullWidth) / (window.devicePixelRatio || 1) + "px";
  }
  const openPhoto = document.querySelector(".viewer[open] .viewer-photo img");
  if (openPhoto) fitViewer(openPhoto);
}
fitPhotographs();
window.addEventListener("resize", fitPhotographs);
function watchDensity() {
  const density = window.matchMedia("(resolution: " + window.devicePixelRatio + "dppx)");
  density.addEventListener("change", () => {
    fitPhotographs();
    watchDensity();
  }, { once:true });
}
watchDensity();
if (window.ResizeObserver) {
  const coverObserver = new ResizeObserver(entries=>entries.forEach(entry=>fitCover(entry.target)));
  covers.forEach(img=>coverObserver.observe(img, {box:"border-box"}));
}

function showFeature(button) {
  const version = ++featureVersion;
  const { photo, sources, title, href, alt, focus } = button.dataset;
  const next = new Image();
  next.onload = () => {
    if (version !== featureVersion) return;
    stageImage.srcset = next.srcset;
    stageImage.src = photo;
    stageImage.alt = alt;
    stageImage.style.objectPosition = focus;
    stageImage.dataset.nativeWidth = button.dataset.nativeWidth;
    stageImage.dataset.nativeHeight = button.dataset.nativeHeight;
    fitCover(stageImage);
    stageLink.href = href;
    stageLink.setAttribute("aria-label", "View " + title);
    featureName.textContent = title;
    featureName.href = href;
    for (const tab of tabs) tab.setAttribute("aria-pressed", String(tab === button));
  };
  next.sizes = stageImage.sizes;
  next.srcset = sources;
  next.src = photo;
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

const filters = Array.from(document.querySelectorAll(".filter[data-filter]"));
const cards = Array.from(document.querySelectorAll(".photo-tile[data-category], .card[data-category]"));
const filterStatus = document.querySelector(".filter-status");
const homeGrid = document.querySelector(".home-grid");
if (homeGrid) {
  const desktop = window.matchMedia("(min-width: 761px)");
  const tiles = cards.map(card => {
    const image = card.querySelector("img");
    const width = Number(image.getAttribute("width"));
    const height = Number(image.getAttribute("height"));
    image.style.aspectRatio = width + " / " + height;
    return { card, ratio: height / width };
  });

  function arrangeGallery() {
    if (!desktop.matches) {
      homeGrid.classList.remove("is-sequenced");
      homeGrid.style.height = "";
      return;
    }
    homeGrid.classList.add("is-sequenced");
    const columnWidth = homeGrid.getBoundingClientRect().width / 2;
    const heights = [0, 0];
    for (const { card, ratio } of tiles) {
      if (card.hidden) continue;
      const column = heights[0] <= heights[1] ? 0 : 1;
      card.style.setProperty("--tile-top", heights[column] + "px");
      card.style.setProperty("--tile-left", column === 0 ? "0" : "50%");
      heights[column] += columnWidth * ratio;
    }
    homeGrid.style.height = Math.max(...heights) + "px";
  }

  arrangeGallery();
  window.addEventListener("resize", arrangeGallery);
  homeGrid.addEventListener("galleryfilter", arrangeGallery);
}
filters.forEach(button => {
  button.addEventListener("click", () => {
    const category = button.dataset.filter;
    let visible = 0;
    for (const card of cards) {
      const categories = card.dataset.category.split(/\s+/);
      card.hidden = category !== "all" && !categories.includes(category);
      if (!card.hidden) visible++;
    }
    for (const filter of filters) {
      filter.setAttribute("aria-pressed", String(filter === button));
    }
    if (filterStatus) {
      filterStatus.textContent = visible + (visible === 1 ? " photograph shown." : " photographs shown.");
    }
    homeGrid?.dispatchEvent(new Event("galleryfilter"));
    fitPhotographs();
  });
});

const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async event => {
    event.preventDefault();
    const status = contactForm.querySelector(".form-status");
    const submit = contactForm.querySelector('button[type="submit"]');
    const fields = new FormData(contactForm);
    submit.disabled = true;
    status.textContent = "Sending your message…";
    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new URLSearchParams(fields)
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        status.textContent = typeof result.error === "string" ? result.error : "Your message could not be sent. Please try again.";
        return;
      }
      contactForm.reset();
      status.textContent = "Thank you. Your message has been sent.";
    } catch {
      status.textContent = "Your message could not be sent. Please try again.";
    } finally {
      submit.disabled = false;
    }
  });
}

const dialog = document.querySelector(".viewer");
if (dialog && typeof dialog.showModal === "function") {
  const links = Array.from(document.querySelectorAll(".photo-link"));
  const image = dialog.querySelector(".viewer-photo img");
  const counter = dialog.querySelector(".viewer-index");
  const fullResolution = dialog.querySelector(".full-resolution");
  const projectLink = dialog.querySelector(".viewer-project");
  const closeButton = dialog.querySelector("[data-close]");
  let index = 0;
  let opener;
  let start;
  function visibleLinks() {
    return links.filter(link => !link.closest(".photo-tile")?.hidden);
  }

  function show(position) {
    const visible = visibleLinks();
    if (!visible.length) return;
    index = (position + visible.length) % visible.length;
    const selected = visible[index];
    image.src = selected.href;
    image.alt = selected.querySelector("img").alt;
    fullResolution.href = selected.href;
    const { fullWidth, fullHeight, projectHref, projectTitle } = selected.dataset;
    image.dataset.nativeWidth = fullWidth;
    image.dataset.nativeHeight = fullHeight;
    fitViewer(image);
    fullResolution.title = fullWidth + " × " + fullHeight + " pixels (opens in a new tab)";
    fullResolution.setAttribute("aria-label", "Open full resolution, " + fullResolution.title);
    counter.textContent = (index + 1) + " / " + visible.length;
    if (projectLink) {
      projectLink.hidden = !projectHref;
      if (projectHref) {
        projectLink.href = projectHref;
        projectLink.textContent = projectTitle;
      }
    }
  }
  links.forEach(link => {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      show(visibleLinks().indexOf(link));
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
