import { Account, Connection } from 'near-api-js';

import CONFIG from '../config';
import {
    FARMING_VALIDATOR_VERSION,
    getValidationVersion,
    MAINNET,
    TESTNET,
} from '../utils/constants';
import { ConnectionsStorage } from '../utils/storage';

// Staking Farm Contract
// https://github.com/referencedev/staking-farm/
export default class StakingFarmContracts {
    // View functions are not signed, so do not require a real account!
    static viewFunctionAccount = new Account(
        Connection.fromConfig({
            networkId: CONFIG.NETWORK_ID,
            provider: ConnectionsStorage.from(localStorage).createProvider(),
            signer: {},
        }),
        'dontcare'
    );

    static getFarms({ contractName, from_index, limit }) {
        return this.viewFunctionAccount.viewFunction({
            contractId: contractName,
            methodName: 'get_farms',
            args: {
                from_index,
                limit,
            },
        });
    }

    static getPoolSummary({ contractName }) {
        return this.viewFunctionAccount.viewFunction({
            contractId: contractName,
            methodName: 'get_pool_summary',
        });
    }

    static getUnclaimedRewards({ contractName, account_id, farm_id }) {
        return this.viewFunctionAccount.viewFunction({
            contractId: contractName,
            methodName: 'get_unclaimed_reward',
            args: {
                account_id,
                farm_id,
            },
        });
    }

    static getFarm({ contractName, farm_id }) {
        return this.viewFunctionAccount.viewFunction({
            contractId: contractName,
            methodName: 'get_farm',
            args: {
                farm_id,
            },
        });
    }

    static getFarmListWithUnclaimedRewards = async ({
        contractName,
        account_id,
        from_index,
        limit,
    }) => {
        const farms = await StakingFarmContracts.getFarms({
            contractName,
            from_index,
            limit,
        });
        return Promise.all(
            farms.map(({ token_id, farm_id, active }) =>
                StakingFarmContracts.getUnclaimedRewards({
                    contractName,
                    account_id,
                    farm_id,
                })
                    .catch(() => '0')
                    .then((balance) => ({
                        token_id,
                        balance,
                        farm_id,
                        active,
                    }))
            )
        );
    };

    static isFarmingValidator(accountId) {
        return (
            getValidationVersion(
                CONFIG.NODE_URL.indexOf(MAINNET) > -1 ? MAINNET : TESTNET,
                accountId
            ) === FARMING_VALIDATOR_VERSION
        );
    }

    static hasUnclaimedRewards = ({
        contractName,
        account_id,
        from_index = 0,
        limit = 300,
    }) => {
        return (
            StakingFarmContracts.isFarmingValidator(contractName) &&
            StakingFarmContracts.getFarmListWithUnclaimedRewards({
                contractName,
                account_id,
                from_index,
                limit,
            }).then(
                (farmListWithBalance) =>
                    farmListWithBalance.filter(({ balance }) => +balance > 0).length > 0
            )
        );
    };
}
