function parseDiscount(discountStr) {
  return parseFloat(discountStr?.replace('%', '')) || 0;
}

function calculateDiscountPrice(basePrice, discountStr) {
  const discount = parseDiscount(discountStr);
  const price = Math.round(basePrice - (basePrice * discount) / 100);
  return { price, discount };
}

function getFinalPriceWithLabel(product) {
  const basePrice = product.basePrice;

  const { price: prodPrice, discount: prodDisc } = calculateDiscountPrice(
    basePrice,
    product.discount
  );
  const { price: catPrice, discount: catDisc } = calculateDiscountPrice(
    basePrice,
    product.categoryId?.[0]?.discount || ''
  );

  let finalPrice, discountLabel, discountPrice;

  if (prodPrice < catPrice) {
    finalPrice = prodPrice;
    discountPrice = basePrice - prodPrice;
    discountLabel = prodDisc ? `${prodDisc}%` : '';
  } else if (catDisc > 0) {
    finalPrice = catPrice;
    discountPrice = basePrice - catPrice;
    discountLabel = `${catDisc}%`;
  } else {
    finalPrice = basePrice;
    discountPrice = basePrice;
    discountLabel = '';
  }

  return { finalPrice, discountLabel, discountPrice };
}

export default getFinalPriceWithLabel;
