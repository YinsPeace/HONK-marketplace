// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HONKToken is ERC20, Ownable {

    /// @notice Emitted when tokens are minted
    /// @param to The address receiving the minted tokens
    /// @param amount The number of tokens minted
    event TokensMinted(address indexed to, uint256 amount);

    constructor(uint256 initialSupply) ERC20("HONK", "HONK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
        emit TokensMinted(msg.sender, initialSupply); // Emit event for initial supply mint
    }

    /// @notice Function to allow only the owner to mint tokens
    /// @param amount The number of tokens to mint
    function mint(uint256 amount) public onlyOwner {
        _mint(msg.sender, amount);
        emit TokensMinted(msg.sender, amount); // Emit event for additional minting
    }

    /// @dev Remove or restrict this function before deploying to production.
    function mintForTesting(uint256 amount) public onlyOwner {
        _mint(msg.sender, amount);
        emit TokensMinted(msg.sender, amount); // Emit event for testing minting
    }
}
