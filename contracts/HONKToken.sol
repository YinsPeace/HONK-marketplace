// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title HONKToken
/// @notice This contract implements the HONK token, an ERC20 token with minting capabilities
contract HONKToken is ERC20, Ownable {
    uint256 public constant VERSION = 2;

    /// @notice Emitted when tokens are minted
    /// @param to The address receiving the minted tokens
    /// @param amount The number of tokens minted
    event TokensMinted(address indexed to, uint256 amount);

    /// @notice Constructs the HONKToken contract
    /// @param initialSupply The initial supply of HONK tokens to mint
    constructor(uint256 initialSupply) ERC20("HONK", "HONK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
        emit TokensMinted(msg.sender, initialSupply);
    }

    /// @notice Allows the owner to mint new tokens
    /// @param amount The number of tokens to mint
    function mint(uint256 amount) public onlyOwner {
        _mint(msg.sender, amount);
        emit TokensMinted(msg.sender, amount);
    }

    /// @notice Mints tokens for testing purposes
    /// @dev Remove or restrict this function before deploying to production
    /// @param amount The number of tokens to mint
    function mintForTesting(uint256 amount) public onlyOwner {
        _mint(msg.sender, amount);
        emit TokensMinted(msg.sender, amount);
    }

    /// @notice Moves `amount` tokens from `sender` to `recipient` using the allowance mechanism
    /// @dev Overrides the OpenZeppelin implementation to add custom logic if needed
    /// @param sender The address to transfer tokens from
    /// @param recipient The address to transfer tokens to
    /// @param amount The amount of tokens to transfer
    /// @return bool Returns true if the operation was successful
    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(sender, spender, amount);
        _transfer(sender, recipient, amount);
        return true;
    }

    /// @notice A new function to demonstrate the upgrade
    /// @param account The address to check the balance for
    /// @return uint256 The balance of the account
    function getBalanceWithBonus(address account) public view returns (uint256) {
        return balanceOf(account) + 100; // Add a bonus of 100 tokens for demonstration
    }
}