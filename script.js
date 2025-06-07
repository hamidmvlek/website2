const links = [
  { text: "link", url: "#" },
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

// Update their positions without killing animation
function updateLinkPositions() {
  const container = document.querySelector(".container");
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;

  const radius = containerWidth * 0.4;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  rotatingLinks.forEach((wrapper, i) => {
    const angle = (i / links.length) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    wrapper.style.left = `${x}px`;
    wrapper.style.top = `${y}px`;
  });
}

// Init
createLinks();
updateLinkPositions();

// Reposition only on resize
window.addEventListener("resize", updateLinkPositions);
