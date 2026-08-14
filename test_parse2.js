const name = "Product XYZ (100 pcs) [Color: Black | Size: Large]";
const match = name.match(/^(.*?)(?: \[(.*?)\])?$/);
console.log(match[1]);
console.log(match[2]);
