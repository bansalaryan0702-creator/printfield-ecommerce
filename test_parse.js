const name = "Product XYZ (100 pcs) [Size: Large | Color: Red]";
const match = name.match(/^(.*?)(?: \[(.*?)\])?$/);
console.log(match[1]); // Product XYZ (100 pcs)
console.log(match[2]); // Size: Large | Color: Red
