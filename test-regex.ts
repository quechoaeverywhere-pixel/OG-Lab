const text1 = "50^\\circ C";
const text2 = "50^\\\\circ C";
const text3 = "50^{\\circ} C";
const text4 = "50^{\\\\circ} C";

const clean = (t) => {
  return t
    .replace(/\^\{\\\\circ\}/g, '°')
    .replace(/\^\{\\circ\}/g, '°')
    .replace(/\^\\\\circ/g, '°')
    .replace(/\^\\circ/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\^circ/g, '°');
}

console.log("1:", clean(text1));
console.log("2:", clean(text2));
console.log("3:", clean(text3));
console.log("4:", clean(text4));
