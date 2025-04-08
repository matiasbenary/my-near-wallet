import CONFIG from '../config';
import { wallet } from '../utils/wallet';

export async function checkAddress({ accountId }) {
    const viewFunctionAccount = wallet.getAccountBasic('dontcare');
    return viewFunctionAccount.viewFunction({
        contractId: CONFIG.HAPI_PROTOCOL_ADDRESS,
        methodName: 'get_address',
        args: {
            address: accountId,
        },
    });
}
