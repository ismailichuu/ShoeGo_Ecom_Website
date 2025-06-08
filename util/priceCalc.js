export function calculateCart(cartItems, taxPercent = 5, deliveryCharge = 0) {
    let totalWithoutTax = 0;
    let totalTax = 0;
    let grandTotal = 0;
    let totalDiscount = 0;

    const updatedCartItems = cartItems.map(item => {
        const product = item.productId;
        const quantity = item.quantity;
        const basePrice = product.basePrice || 0;
        const productDiscountPrice = product.discountPrice || basePrice;

        // Extract category discount percentage (e.g., '15%' => 15)
        let categoryDiscountPercent = 0;
        if (product.categoryId?.[0]?.discount) {
            categoryDiscountPercent = parseFloat(product.categoryId[0].discount.replace('%', '')) || 0;
        }

        // Calculate discounted prices
        const categoryDiscountPrice = Math.round(basePrice - (basePrice * categoryDiscountPercent / 100));

        // Determine best price
        let finalPrice = basePrice;
        let discount = 0;
        if (productDiscountPrice < categoryDiscountPrice) {
            finalPrice = productDiscountPrice;
            discount = basePrice - productDiscountPrice;
        } else if (categoryDiscountPercent > 0) {
            finalPrice = categoryDiscountPrice;
            discount = basePrice - categoryDiscountPrice;
        }

        // Totals
        const itemTotal = +(finalPrice * quantity).toFixed(2);
        const tax = +((finalPrice * taxPercent / 100) * quantity).toFixed(2);
        const subtotal = +(itemTotal + tax).toFixed(2);

        totalWithoutTax += itemTotal;
        totalTax += tax;
        grandTotal += subtotal;
        totalDiscount += discount * quantity;

        return {
            ...item,
            basePrice,
            finalPrice,
            discount: +(discount * quantity).toFixed(2),
            unitPrice: finalPrice,
            itemTotal,
            tax,
            subtotal
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
        totalDiscount: +totalDiscount.toFixed(2)
    };
}
