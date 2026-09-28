const products = [
  ['Everyday Cotton Tee', 'A soft cotton staple with a relaxed, easy fit.', 'Tops', 42, 56, 1],
  ['Oxford Button-Up', 'A crisp cotton shirt for weekday and weekend wear.', 'Shirts', 68, 86, 0],
  ['Stripe Knit Top', 'Lightweight knit with a clean striped finish.', 'Knitwear', 74, 92, 0],
  ['Classic Pique Polo', 'Breathable pique cotton and a timeless collar.', 'Tops', 58, 72, 0],
  ['Relaxed Poplin Shirt', 'An airy poplin layer with a softly structured shape.', 'Shirts', 64, 82, 1],
  ['Denim Overshirt', 'A durable midweight layer made for everyday use.', 'Outerwear', 98, 128, 0],
  ['Ribbed Weekend Sweater', 'A comfortable ribbed knit for cooler days.', 'Knitwear', 84, 108, 0],
  ['Henley Shirt', 'A versatile cotton Henley with a button placket.', 'Shirts', 116, 200, 1],
  ['Colorful Pattern Shirt', 'A statement print in a lightweight, relaxed weave.', 'Shirts', 238.85, 245.95, 1],
  ['Linen Camp Shirt', 'A breathable linen blend cut for warm-weather days.', 'Shirts', 72, 90, 0],
  ['Soft Everyday Cardigan', 'An easy open layer with a soft hand feel.', 'Knitwear', 88, 112, 0],
  ['Weekend Graphic Tee', 'A dependable jersey tee with a little extra character.', 'Tops', 46, 60, 0],
  ['Utility Shirt Jacket', 'A light utility layer with practical patch pockets.', 'Outerwear', 108, 138, 0],
].map(([name, description, category, price, compareAtPrice, featured], index) => ({
  name,
  description,
  category,
  price,
  compareAtPrice,
  image: `/assets/img/product-${index + 1}-1.jpg`,
  hoverImage: `/assets/img/product-${index + 1}-2.jpg`,
  stock: 12 + index * 3,
  featured: Boolean(featured),
}));

export default products;