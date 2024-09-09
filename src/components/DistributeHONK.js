import React, { useState } from 'react';
import { HONKTokenContract, web3 } from '../Web3Config';

const DistributeHONK = ({ userAddress }) => {
  const [amount, setAmount] = useState('');

  const mintHONK = async () => {
    try {
      const amountWei = web3.utils.toWei(amount, 'ether');
      await HONKTokenContract.methods.mintForTesting(amountWei).send({ from: userAddress });
      alert(`${amount} HONK tokens have been minted to your account.`);
    } catch (error) {
      console.error('Error minting HONK:', error);
      alert('Error minting HONK tokens. Check console for details.');
    }
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount of HONK to mint"
      />
      <button onClick={mintHONK}>Mint HONK</button>
    </div>
  );
};

export default DistributeHONK;
