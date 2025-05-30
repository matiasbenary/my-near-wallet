import React from 'react';
import { Translate } from 'react-localize-redux';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { Mixpanel } from '../../../mixpanel/index';
import { redirectTo } from '../../../redux/actions/account';
import { selectFarmValidatorAPY } from '../../../redux/slices/staking/farmValidators';
import { FARMING_VALIDATOR_VERSION, ValidatorVersion } from '../../../utils/constants';
import Balance from '../../common/balance/Balance';
import FormButton from '../../common/FormButton';
import TokenAmount from '../../common/token/TokenAmount';
import Tooltip from '../../common/Tooltip';
import ChevronIcon from '../../svg/ChevronIcon';
import UserIcon from '../../svg/UserIcon';
import { selectStakingSlice } from '../../../redux/slices/staking';
import { useQuery } from '@tanstack/react-query';
import { wallet } from '../../../utils/wallet';
import { Contract } from 'near-api-js';

const Container = styled.div`
    display: flex;
    align-items: center;
    background-color: #fafafa;
    border-radius: 8px;
    padding: 14px;
    position: relative;
    cursor: ${(props) => (props.clickable === 'true' ? 'pointer' : '')};

    svg {
        height: 100%;

        &.user-icon {
            margin: -2px 10px 0 0;
            min-width: 36px;

            .background {
                fill: #f0f0f1;
            }
        }

        &.chevron-icon {
            margin: auto 5px auto 15px;
            min-width: 8px;
        }
    }

    .left,
    .right {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .left {
        div {
            text-align: left;
            color: #a7a29e;
            display: flex;
            flex-direction: row;
            &.name-container {
                color: #24272a;
                max-width: 165px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;

                @media (max-width: 350px) {
                    max-width: 130px;
                }

                @media (min-width: 500px) {
                    max-width: 230px;
                }
            }
        }
    }

    .right {
        margin-left: auto;
        text-align: right;

        > div {
            :first-of-type {
                color: #00c08b;
            }
        }

        .amount {
            color: #24272a;
            white-space: nowrap;
        }
    }

    .chevron-icon {
        display: none;
    }

    button {
        &.gray-blue {
            width: auto !important;
            margin: 0 !important;
            margin-left: auto !important;
            padding: 0px 10px !important;
            height: 34px !important;
        }
    }

    .with {
        position: absolute;
        top: -14px;
        padding: 5px 10px 2px 10px;
        background-color: white;
        border-radius: 40px;
        text-align: center;
        border: 2px solid #f2f2f2;
        left: 50%;
        transform: translateX(-50%);
    }

    .active {
        color: #00c08b;
    }

    .inactive {
        color: #ff585d;
    }

    .text-left {
        text-align: left;
    }
`;

export default function ValidatorBox({
    validator,
    amount,
    staking = true,
    farming = false,
    clickable = true,
    style,
    label = false,
    stakeAction,
    showBalanceInUSD,
    token = null,
}) {
    const dispatch = useDispatch();
    const farmAPY = useSelector((state) =>
        selectFarmValidatorAPY(state, { validatorId: validator?.accountId })
    );
    const { accountId: validatorId, active } = validator;
    const isFarmingValidator =
        validator?.version === ValidatorVersion[FARMING_VALIDATOR_VERSION];

    const cta = amount ? (
        <ChevronIcon />
    ) : (
        <FormButton
            className='gray-blue'
            linkTo={`/staking/${validatorId}`}
            data-test-id='stakingPageSelectValidator'
        >
            <Translate id='staking.validatorBox.cta' />
        </FormButton>
    );

    const { currentAccount } = useSelector(selectStakingSlice);
    const validatorFeeQuery = useQuery({
        queryKey: ['validator_fee', validatorId, currentAccount.id],
        queryFn: async () => {
            const account = await wallet.getAccountBasic(currentAccount.id);

            const contract = await new Contract(account, validatorId, {
                changeMethods: [],
                viewMethods: ['get_reward_fee_fraction'],
            });
            const fee = await contract.get_reward_fee_fraction();
            return (fee.percentage = +((fee.numerator / fee.denominator) * 100).toFixed(
                2
            ));
        },
        staleTime: Infinity,
        enabled: currentAccount.id && !!validatorId && active,
    });

    const handleClick = () => {
        Mixpanel.track('STAKE Go to staked account page');
        if (clickable && amount) {
            dispatch(
                redirectTo(
                    `/staking/${validatorId}${stakeAction ? `/${stakeAction}` : ''}`
                )
            );
        }
    };

    return (
        <Container
            className='validator-box'
            data-test-id='stakingPageValidatorItem'
            clickable={clickable && amount ? 'true' : ''}
            style={style}
            onClick={handleClick}
        >
            {label && (
                <div className='with'>
                    <Translate id='staking.validatorBox.with' />
                </div>
            )}
            <UserIcon background={true} />
            <div className='left'>
                <div>
                    <div
                        className='name-container'
                        data-test-id='stakingPageValidatorItemName'
                    >
                        {validatorId}
                    </div>
                    {isFarmingValidator && (
                        <Tooltip translate='staking.balanceBox.farm.info' />
                    )}
                </div>
                {!validatorFeeQuery.isLoading && (
                    <div className='text-left'>
                        {isFarmingValidator && (
                            <>
                                {farmAPY === null && validator.active ? (
                                    <span
                                        className='animated-dots'
                                        style={{ width: 16 }}
                                    />
                                ) : (
                                    <span>{farmAPY || 0}%&nbsp;</span>
                                )}
                                <span>
                                    <Translate id='staking.validator.farmApy' />
                                    &nbsp;
                                </span>
                                <span>-&nbsp;</span>
                            </>
                        )}
                        <span>
                            {validatorFeeQuery.data}%{' '}
                            <Translate id='staking.validatorBox.fee' /> -&nbsp;
                        </span>
                        <span>
                            {active ? (
                                <span className='active'>
                                    {' '}
                                    <Translate id='staking.validatorBox.state.active' />
                                </span>
                            ) : (
                                <span className='inactive'>
                                    {' '}
                                    <Translate id='staking.validatorBox.state.inactive' />
                                </span>
                            )}
                        </span>
                    </div>
                )}
            </div>
            {amount && (
                <div className='right'>
                    {staking && (
                        <div>
                            <Translate id='staking.validatorBox.staking' />
                        </div>
                    )}
                    {farming && (
                        <div>
                            <Translate id='staking.validatorBox.farming' />
                        </div>
                    )}
                    <div className='amount'>
                        {!token ? (
                            <Balance
                                amount={amount}
                                showBalanceInUSD={showBalanceInUSD}
                            />
                        ) : (
                            <TokenAmount
                                token={token}
                                className='balance'
                                withSymbol={true}
                            />
                        )}
                    </div>
                </div>
            )}
            {clickable ? cta : null}
        </Container>
    );
}
