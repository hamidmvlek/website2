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

// Position links in percentages so they follow the container on any
// screen size without needing to recalculate on resize
function setLinkPositions() {
  const radius = 40; // % of container width

  rotatingLinks.forEach((wrapper, i) => {
    const angle = (i / links.length) * 2 * Math.PI;
    wrapper.style.left = `${50 + radius * Math.cos(angle)}%`;
    wrapper.style.top = `${50 + radius * Math.sin(angle)}%`;
  });
}

// Init
createLinks();
setLinkPositions();
