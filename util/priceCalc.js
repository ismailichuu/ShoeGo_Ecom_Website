export function calculateCart(cartItems, taxPercent = 5, deliveryCharge = 0) {
    let totalWithoutTax = 0;
    let totalTax = 0;
    let grandTotal = 0;

    const updatedCartItems = cartItems.map(item => {
        const price = item.productId?.discountPrice || 0;
        const quantity = item.quantity;

        const itemTotal = +(price * quantity).toFixed(2); 
        const tax = +((price * taxPercent / 100) * quantity).toFixed(2); 
        const subtotal = +(itemTotal + tax).toFixed(2); 

        totalWithoutTax += itemTotal;
        totalTax += tax;
        grandTotal += subtotal;

        return {
            ...item,
            unitPrice: price,
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
        total: totalWithDelivery 
    };
}
