function elBuilder(name, attributesObj, txt, ...children) {
  const el = document.createElement(name);
  for (let attr in attributesObj) {
    el.setAttribute(attr, attributesObj[attr]);
  }
  el.textContent = txt || null;
  children.forEach(child => {
    el.appendChild(child);
  })
  return el;
}

export default elBuilder