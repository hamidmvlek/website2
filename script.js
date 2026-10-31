const links = [
  { text: "red pen", url: "red-pen/" },
  { text: "link", url: "#" },
  { text: "link", url: "#" },
  { text: "link", url: "#" },
  { text: "link", url: "#" },
  { text: "link", url: "#" },
  { text: "link", url: "#" },
  { text: "link", url: "#" },
];

const circle = document.getElementById("circle");
const rotatingLinks = [];

// Create links once
function createLinks() {
  links.forEach((link, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "rotating-link";

    const a = document.createElement("a");
    a.href = link.url;
    a.textContent = link.text;

    wrapper.appendChild(a);
    circle.appendChild(wrapper);
    rotatingLinks.push(wrapper);
  });
}

// Position links in percentages so they follow the container on any
// screen size without needing to recalculate on resize
function setLinkPositions() {
  const radius = 50; // % of container width (ring sits on the container's edge)

  rotatingLinks.forEach((wrapper, i) => {
    const angle = (i / links.length) * 2 * Math.PI;
    wrapper.style.left = `${50 + radius * Math.cos(angle)}%`;
    wrapper.style.top = `${50 + radius * Math.sin(angle)}%`;
  });
}

// Size the ring so it always clears the centre text and fits the screen
const container = document.querySelector(".container");
const center = document.querySelector(".center");
const RING = 0.5; // ring radius as a fraction of container width
const MIN_FONT = 11;

function fitRing() {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const margin = 12;

  // Start from the CSS font size and shrink only if the ring can't fit
  container.style.removeProperty("--fs");
  let fs = parseFloat(getComputedStyle(center.querySelector("p")).fontSize);

  for (;;) {
    const linkBox = rotatingLinks.reduce(
      (m, l) => Math.max(m, Math.hypot(l.offsetWidth, l.offsetHeight) / 2),
      0
    );
    const textRadius = Math.hypot(center.offsetWidth, center.offsetHeight) / 2;

    const minRadius = textRadius + linkBox + 6; // never touch the text
    const maxRadius = Math.min(vw, vh) / 2 - linkBox - margin; // stay on screen
    const preferred = Math.min(vw, vh) * 0.28; // original desktop look

    if (minRadius <= maxRadius || fs <= MIN_FONT) {
      const radius = Math.max(minRadius, Math.min(preferred, maxRadius));
      container.style.setProperty("--size", `${radius / RING}px`);
      return;
    }

    fs -= 1;
    container.style.setProperty("--fs", `${fs}px`);
  }
}

// Init
createLinks();
setLinkPositions();
fitRing();
if (document.fonts) document.fonts.ready.then(fitRing);

let resizeFrame;
window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(fitRing);
});
