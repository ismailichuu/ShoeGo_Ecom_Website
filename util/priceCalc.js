import getFinalPriceWithLabel from './bestPriceProduct.js';

export function calculateCart(cartItems, taxPercent = 5, deliveryCharge = 0) {
  let totalWithoutTax = 0;
  let totalTax = 0;
  let grandTotal = 0;
  let totalDiscount = 0;

  const updatedCartItems = cartItems.map((item) => {
    const product = item.productId;
    const quantity = item.quantity;
    const basePrice = product.basePrice || 0;
    const { finalPrice, discountPrice } = getFinalPriceWithLabel(product);
    // Totals
    const itemTotal = +(finalPrice * quantity).toFixed(2);
    const tax = +(((finalPrice * taxPercent) / 100) * quantity).toFixed(2);
    const subtotal = +(itemTotal + tax).toFixed(2);

    totalWithoutTax += itemTotal;
    totalTax += tax;
    grandTotal += subtotal;
    totalDiscount += discountPrice * quantity;

    return {
      ...item,
      basePrice,
      finalPrice,
      discount: +(discountPrice * quantity).toFixed(2),
      unitPrice: finalPrice,
      itemTotal,
      tax,
      subtotal,
    };
  });

  const totalWithDelivery = Math.trunc(grandTotal + deliveryCharge);

  return {
    cartItems: updatedCartItems,
    totalWithoutTax: +totalWithoutTax.toFixed(2),
    totalTax: +totalTax.toFixed(2),
    grandTotal: +grandTotal.toFixed(2),
    deliveryCharge: +deliveryCharge.toFixed(2),
    total: totalWithDelivery,
    totalDiscount: +totalDiscount.toFixed(2),
  };
}
