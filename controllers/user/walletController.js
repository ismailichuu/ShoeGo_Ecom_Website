import { decodeUserId } from "../../util/jwt.js";
import Wallet from "../../models/walletSchema.js";

//@route GET /wallet
export const getWallet = async (req, res) => {
    try {
        const userId = decodeUserId(req.cookies?.token);

        // Fetch wallet by user ID
        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.render('user/wallet', {
                totalBalance: 0,
                walletBalance: 0,
                giftCardBalance: 0,
                layout: 'profile-layout'
            });
        }

        const giftCardBalance = wallet.transactions
            .filter(tx => tx.reason === 'gift_card' && tx.type === 'credit')
            .reduce((acc, tx) => acc + tx.amount, 0);

        res.render('user/wallet', {
            totalBalance: wallet.balance,
            walletBalance: wallet.balance - giftCardBalance,
            giftCardBalance,
            layout: 'profile-layout'
        });
    } catch (error) {
        console.error('Error loading wallet:', error);
        res.status(500).send('Internal server error');
    }
};