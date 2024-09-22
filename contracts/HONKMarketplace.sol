// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/// @title IHeroCoreDiamond
/// @notice Interface for the DFK Hero Core Diamond contract
interface IHeroCoreDiamond is IERC721 {
    function transferHeroAndEquipmentFrom(address _from, address _newOwner, uint256 _heroId) external;
}

/// @title HONKMarketplace
/// @notice A marketplace contract for trading DFK Heroes using HONK tokens
contract HONKMarketplace is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public honkToken;
    IHeroCoreDiamond public dfkHeroContract;

    address public feeRecipient;
    uint256 public FEE_PERCENTAGE;

    // Time-lock related variables
    uint256 public constant TIMELOCK_PERIOD = 2 days;
    uint256 public proposedFeePercentage;
    uint256 public proposedFeePercentageTimestamp;

    /// @notice Structure to represent a hero in the marketplace
    struct Hero {
        uint256 id;
        address owner;
        uint256 price;
        bool isForSale;
    }

    mapping(uint256 => Hero) public heroes;
    uint256 public heroCount;
    mapping(uint256 => uint256) public heroIdToIndex;
    mapping(uint256 => bool) public isHeroListed;
    uint256 public listedHeroCount;

    /// @notice Emitted when a hero is listed for sale
    event HeroListed(uint256 indexed heroId, address indexed seller, uint256 price);
    /// @notice Emitted when a hero is purchased
    event HeroPurchased(uint256 indexed heroId, address indexed buyer, address indexed seller, uint256 price);
    /// @notice Emitted when a hero listing is cancelled
    event HeroUnlisted(uint256 indexed heroId, address indexed seller);
    /// @notice Emitted when a hero's price is updated
    event HeroPriceUpdated(uint256 indexed heroId, address indexed seller, uint256 newPrice);
    /// @notice Emitted when the marketplace is paused
    event MarketplacePaused(address indexed by);
    /// @notice Emitted when the marketplace is unpaused
    event MarketplaceUnpaused(address indexed by);
    /// @notice Emitted when the fee percentage is updated
    event FeePercentageUpdated(uint256 oldPercentage, uint256 newPercentage);
    /// @notice Emitted when the fee recipient is updated
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    /// @notice Emitted when a new fee percentage is proposed
    event FeePercentageProposed(uint256 proposedPercentage, uint256 timestamp);
    /// @notice Emitted when a proposed fee percentage is executed
    event FeePercentageExecuted(uint256 oldPercentage, uint256 newPercentage);
    /// @notice Emitted when funds are withdrawn by the owner
    event FundsWithdrawn(address recipient, uint256 amount);
    /// @notice Emitted when an ERC721 token is withdrawn by the owner
    event ERC721Withdrawn(address token, uint256 tokenId, address recipient);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the marketplace
    /// @param _honkToken The address of the HONK token contract
    /// @param _dfkHeroContract The address of the DFK hero contract
    /// @param _feeRecipient The address that will receive marketplace fees
    function initialize(address _honkToken, address _dfkHeroContract, address _feeRecipient) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __Pausable_init();
        
        honkToken = IERC20(_honkToken);
        dfkHeroContract = IHeroCoreDiamond(_dfkHeroContract);
        feeRecipient = _feeRecipient;
        FEE_PERCENTAGE = 100; // 1% fee (100 / 10000)
    }

    /// @notice Sets a new fee recipient address
    /// @param _newFeeRecipient The new address to receive marketplace fees
    function setFeeRecipient(address _newFeeRecipient) external onlyOwner whenNotPaused {
        address oldRecipient = feeRecipient;
        feeRecipient = _newFeeRecipient;
        emit FeeRecipientUpdated(oldRecipient, _newFeeRecipient);
    }

    /// @notice Pauses the marketplace
    function pause() external onlyOwner {
        _pause();
        emit MarketplacePaused(msg.sender);
    }

    /// @notice Unpauses the marketplace
    function unpause() external onlyOwner whenPaused {
        _unpause();
        emit MarketplaceUnpaused(msg.sender);
    }

    /// @notice Proposes a new fee percentage
    /// @param _newFeePercentage The proposed new fee percentage (in basis points, e.g., 100 = 1%)
    function proposeFeePercentage(uint256 _newFeePercentage) external onlyOwner whenNotPaused {
        require(_newFeePercentage <= 1000, "Fee percentage cannot exceed 10%");
        proposedFeePercentage = _newFeePercentage;
        proposedFeePercentageTimestamp = block.timestamp;
        emit FeePercentageProposed(_newFeePercentage, block.timestamp);
    }

    /// @notice Executes the proposed fee percentage change after the time-lock period
    function executeFeePercentageUpdate() external onlyOwner whenNotPaused {
        require(proposedFeePercentageTimestamp != 0, "No fee update proposed");
        require(block.timestamp >= proposedFeePercentageTimestamp + TIMELOCK_PERIOD, "Time-lock period not elapsed");
        
        uint256 oldFeePercentage = FEE_PERCENTAGE;
        FEE_PERCENTAGE = proposedFeePercentage;
        
        // Reset the proposal
        proposedFeePercentage = 0;
        proposedFeePercentageTimestamp = 0;
        
        emit FeePercentageExecuted(oldFeePercentage, FEE_PERCENTAGE);
    }

    /// @notice Allows the owner to withdraw accumulated fees
    /// @param _amount The amount of HONK tokens to withdraw
    function withdrawFees(uint256 _amount) external onlyOwner whenNotPaused {
        require(_amount > 0, "Amount must be greater than zero");
        require(_amount <= honkToken.balanceOf(address(this)), "Insufficient balance");
        
        honkToken.safeTransfer(owner(), _amount);
        emit FundsWithdrawn(owner(), _amount);
    }

    /// @notice Allows the owner to withdraw any ERC721 tokens accidentally sent to the contract
    /// @param _token The address of the ERC721 token contract
    /// @param _tokenId The ID of the token to withdraw
    /// @param _recipient The address to send the token to
    function withdrawERC721(address _token, uint256 _tokenId, address _recipient) external onlyOwner {
        IERC721(_token).safeTransferFrom(address(this), _recipient, _tokenId);
        emit ERC721Withdrawn(_token, _tokenId, _recipient);
    }

    /// @notice Checks if a hero is currently listed for sale
    /// @param _heroId The ID of the hero to check
    /// @return bool True if the hero is listed, false otherwise
    function checkIfHeroIsListed(uint256 _heroId) public view returns (bool) {
        return isHeroListed[_heroId];
    }

    /// @notice Lists a hero for sale in the marketplace
    /// @param _heroId The ID of the hero to be listed
    /// @param _price The price in HONK tokens for which the hero is being listed
    /// @dev This function can only be called by the owner of the hero
    function listHero(uint256 _heroId, uint256 _price) external whenNotPaused nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        require(dfkHeroContract.ownerOf(_heroId) == msg.sender, "You don't own this hero");

        uint256 index = heroIdToIndex[_heroId];
        if (index == 0) {
            heroCount++;
            index = heroCount;
            heroIdToIndex[_heroId] = index;
        }

        heroes[index] = Hero(_heroId, msg.sender, _price, true);
        isHeroListed[_heroId] = true;
        listedHeroCount++;

        emit HeroListed(_heroId, msg.sender, _price);
    }

    /// @notice Cancels the listing of a hero
    /// @param _heroId The ID of the hero to unlist
    /// @dev This function can only be called by the owner of the hero
    function cancelListing(uint256 _heroId) external whenNotPaused nonReentrant {
        uint256 index = heroIdToIndex[_heroId];
        require(index != 0, "Hero does not exist");
        Hero storage hero = heroes[index];
        require(hero.owner == msg.sender, "You don't own this hero");
        require(hero.isForSale, "Hero is not listed for sale");

        _removeHeroFromMarketplace(index, _heroId);

        emit HeroUnlisted(_heroId, msg.sender);
    }

    /// @notice Bulk cancels the listings of multiple heroes
    /// @param _heroIds An array of hero IDs to unlist
    /// @dev This function can only be called by the owner of the heroes
    function bulkCancelListings(uint256[] calldata _heroIds) external whenNotPaused nonReentrant {
        for (uint256 i = 0; i < _heroIds.length; i++) {
            uint256 heroId = _heroIds[i];
            uint256 index = heroIdToIndex[heroId];
            require(index != 0, "Hero does not exist");
            Hero storage hero = heroes[index];
            require(hero.owner == msg.sender, "You don't own this hero");
            require(hero.isForSale, "Hero is not listed for sale");

            _removeHeroFromMarketplace(index, heroId);

            emit HeroUnlisted(heroId, msg.sender);
        }
    }

    /// @notice Updates the price of a listed hero
    /// @param _heroId The ID of the hero
    /// @param _newPrice The new price in HONK tokens
    /// @dev Only the owner of the hero can update its price
    function updatePrice(uint256 _heroId, uint256 _newPrice) external whenNotPaused {
        uint256 index = heroIdToIndex[_heroId];
        require(index != 0, "Hero does not exist");
        Hero storage hero = heroes[index];
        require(hero.owner == msg.sender, "You don't own this hero");
        require(hero.isForSale, "Hero is not listed for sale");
        require(_newPrice > 0, "Price must be greater than zero");

        hero.price = _newPrice;

        emit HeroPriceUpdated(_heroId, msg.sender, _newPrice);
    }

    /// @notice Allows a user to purchase a listed hero
    /// @param heroId The ID of the hero to be purchased
    /// @dev This function handles the transfer of HONK tokens and the hero NFT
    function buyHero(uint256 heroId) external whenNotPaused nonReentrant {
        uint256 index = heroIdToIndex[heroId];
        require(index != 0, "BH1: Hero does not exist");
        Hero storage hero = heroes[index];
        require(hero.isForSale, "BH2: Hero is not for sale");
        require(msg.sender != hero.owner, "BH3: Cannot buy your own hero");

        uint256 price = hero.price;
        address seller = hero.owner;

        uint256 fee = (price * FEE_PERCENTAGE) / 10000;
        uint256 sellerAmount = price - fee;

        uint256 buyerBalance = honkToken.balanceOf(msg.sender);
        require(buyerBalance >= price, "BH4: Insufficient HONK balance");

        // Transfer HONK tokens
        bool transferToSellerSuccess = honkToken.transferFrom(msg.sender, seller, sellerAmount);
        require(transferToSellerSuccess, "BH6: Failed to transfer HONK to seller");

        bool transferFeeSuccess = honkToken.transferFrom(msg.sender, feeRecipient, fee);
        require(transferFeeSuccess, "BH7: Failed to transfer fee");

        // Transfer the hero
        address currentOwner = dfkHeroContract.ownerOf(heroId);
        require(currentOwner == seller, "BH8: Seller no longer owns the hero");
        
        try dfkHeroContract.transferHeroAndEquipmentFrom(seller, msg.sender, heroId) {
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("BH9: Hero transfer failed: ", reason)));
        } catch {
            revert("BH10: Hero transfer failed");
        }

        _removeHeroFromMarketplace(index, heroId);

        emit HeroPurchased(heroId, msg.sender, seller, price);
    }

    /// @notice Removes a hero from the marketplace
    /// @dev This function should be called when a hero is sold or its listing is cancelled
    /// @param index The index of the hero in the heroes mapping
    /// @param heroId The ID of the hero to be removed
    function _removeHeroFromMarketplace(uint256 index, uint256 heroId) private {
        delete heroes[index];
        delete heroIdToIndex[heroId];
        isHeroListed[heroId] = false;
        listedHeroCount--;
        // If this was the last hero, reduce heroCount
        if (index == heroCount) {
            heroCount--;
        }
    }

    /// @notice Retrieves the details of a specific hero
    /// @param _heroId The ID of the hero
    /// @return Hero The hero details
    function getHero(uint256 _heroId) external view returns (Hero memory) {
        uint256 index = heroIdToIndex[_heroId];
        if (index == 0) {
            return Hero(_heroId, address(0), 0, false);
        }
        return heroes[index];
    }

    /// @notice Gets the index of a hero in the heroes mapping
    /// @param _heroId The ID of the hero
    /// @return uint256 The index of the hero
    function getHeroIndex(uint256 _heroId) external view returns (uint256) {
        return heroIdToIndex[_heroId];
    }

    /// @notice Retrieves all listed heroes
    /// @return Hero[] An array of all listed heroes
    /// @return uint256 The total number of heroes in the marketplace
    function getListedHeroes() external view returns (Hero[] memory, uint256) {
        Hero[] memory listedHeroes = new Hero[](listedHeroCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= heroCount && index < listedHeroCount; i++) {
            if (isHeroListed[heroes[i].id]) {
                listedHeroes[index] = heroes[i];
                index++;
            }
        }

        return (listedHeroes, heroCount);
    }

    /// @notice Retrieves a paginated list of listed heroes
    /// @param _offset The starting index for pagination
    /// @param _limit The maximum number of heroes to retrieve
    /// @return Hero[] An array of listed heroes
    function getListedHeroesPaginated(uint256 _offset, uint256 _limit) external view returns (Hero[] memory) {
        require(_offset < heroCount, "Offset out of bounds");

        uint256 resultCount = 0;
        for (uint256 i = _offset + 1; i <= heroCount && resultCount < _limit; i++) {
            if (heroes[i].isForSale) {
                resultCount++;
            }
        }

        Hero[] memory result = new Hero[](resultCount);
        uint256 index = 0;
        for (uint256 i = _offset + 1; i <= heroCount && index < resultCount; i++) {
            if (heroes[i].isForSale) {
                result[index] = heroes[i];
                index++;
            }
        }

        return result;
    }

    /// @notice Retrieves multiple heroes by their IDs
    /// @param _heroIds An array of hero IDs
    /// @return Hero[] An array of heroes corresponding to the provided IDs
    function getMultipleHeroes(uint256[] calldata _heroIds) external view returns (Hero[] memory) {
        Hero[] memory result = new Hero[](_heroIds.length);
        for (uint256 i = 0; i < _heroIds.length; i++) {
            uint256 index = heroIdToIndex[_heroIds[i]];
            if (index != 0) {
                result[i] = heroes[index];
            } else {
                result[i] = Hero(_heroIds[i], address(0), 0, false);
            }
        }
        return result;
    }

    /// @notice Retrieves the address of the HONK token contract
    /// @return address The address of the HONK token contract
    function getHONKTokenAddress() public view returns (address) {
        return address(honkToken);
    }

    /// @notice Retrieves the address of the DFK hero contract
    /// @return address The address of the DFK hero contract
    function getDFKHeroContractAddress() public view returns (address) {
        return address(dfkHeroContract);
    }

    /// @notice Returns true if the contract is paused, and false otherwise
    /// @return bool The current pause state of the contract
    function paused() public view virtual override returns (bool) {
        return super.paused();
    }


    /// @notice Gets the current fee percentage
    /// @return The fee percentage in basis points (e.g., 100 = 1%)
    function getFeePercentage() public view returns (uint256) {
        return FEE_PERCENTAGE;
    }
}