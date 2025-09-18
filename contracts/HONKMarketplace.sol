// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

// Custom errors for gas efficiency and better error handling
error InvalidBulkListing(string reason);
error TransferFailed(address token, address from, address to, uint256 amount, string reason);
error InvalidBulkPurchase(string reason);

/// @title IHeroCoreDiamond
/// @notice Interface for the DFK Hero Core Diamond contract
interface IHeroCoreDiamond is IERC721 {
    function transferHeroAndEquipmentFrom(address _from, address _newOwner, uint256 _heroId) external;
    function getEquipment(uint256 _heroId) external view returns (address[] memory);
}

/// @notice Hero equipment structure for DFK Heroes
struct HeroEquipmentV2 {
    uint256 equippedSlots;
    uint256 petId;
    uint128 weapon1Id;
    uint128 weapon1VisageId;
    uint128 weapon2Id;
    uint128 weapon2VisageId;
    uint128 offhand1Id;
    uint128 offhand1VisageId;
    uint128 offhand2Id;
    uint128 offhand2VisageId;
    uint128 armorId;
    uint128 armorVisageId;
    uint128 accessoryId;
    uint128 accessoryVisageId;
}


/// @title HONKMarketplace
/// @notice A marketplace contract for trading DFK Heroes using HONK tokens
contract HONKMarketplace is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public honkToken;
    IHeroCoreDiamond public dfkHeroContract;
    address public feeRecipient;
    uint256 public FEE_PERCENTAGE;

    // Fee recipient timelock variables
    address public proposedFeeRecipient;
    uint256 public proposedFeeRecipientTimestamp;


    // Time-lock related variablestext-4xl font-bold my-8 text-white
    uint256 public constant TIMELOCK_PERIOD = 2 days;
    uint256 public constant MAX_PRICE = 1_000_000 * 10**18; // 1 million HONK
    uint256 public constant MAX_EQUIPMENT_COUNT = 5;
    uint256 public proposedFeePercentage;
    uint256 public proposedFeePercentageTimestamp;
    uint256 public constant PRICE_UPDATE_COOLDOWN = 15 minutes;

    /// @notice Structure to represent a hero in the marketplace
    struct Hero {
        uint256 id;
        address owner;
        uint256 price;
        bool isForSale;
        uint256 bulkListingId; // 0 for individual listings, >0 for bulk listings
    }

    mapping(uint256 => Hero) public heroes;
    uint256 public heroCount;
    mapping(uint256 => uint256) public heroIdToIndex;
    mapping(uint256 => bool) public isHeroListed;
    
    uint256 public listedHeroCount;
    mapping(uint256 => uint256) public lastPriceUpdateTime;

    // Bulk listing tracking
    uint256 public nextBulkListingId;
    mapping(uint256 => uint256[]) public bulkListingHeroes; // bulkListingId => hero IDs
    mapping(uint256 => uint256) public bulkListingTotalPrice; // bulkListingId => total price
    
    // Storage optimization and batched cleanup
    uint256 public constant MAX_HERO_COUNT = 1_000_000; // Prevent unbounded growth
    uint256 public recycledIndicesCount;
    uint256[] public recycledIndices; // Reusable indices from removed heroes
    uint256 public constant CLEANUP_BATCH_SIZE = 100;
    uint256 public lastCleanupIndex;
    mapping(uint256 => bool) public allowPartialBulkPurchase; // bulkListingId => bool

    // ---------------- Private sale support ----------------
    // 0x0 address means public listing
    mapping(uint256 => address) public heroAllowedBuyer; // heroId => allowed buyer
    mapping(uint256 => address) public bulkAllowedBuyer; // bulkListingId => allowed buyer

    // ===== Token-ID keyed storage (appended for upgrade safety) =====
    mapping(uint256 => Hero) public heroesByToken; // key = NFT tokenId
    mapping(uint256 => bool) public heroListedByToken; // duplicate flag
    
    // New events
    event PartialBulkPurchaseAllowed(uint256 indexed bulkListingId, address indexed seller);
    event BatchCleanupProgress(uint256 fromIndex, uint256 toIndex, uint256 itemsCleaned);
    event IndexRecycled(uint256 index);
    
    // ---- Private-listing events ----
    event PrivateHeroListed(uint256 indexed heroId, address indexed seller, uint256 price, address indexed allowedBuyer);
    event PrivateBulkListed(uint256 indexed bulkListingId, address indexed seller, uint256 totalPrice, address indexed allowedBuyer);

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

    /// @notice Emitted when a new fee percentage is proposed
    event FeePercentageProposed(uint256 proposedPercentage, uint256 timestamp);
    /// @notice Emitted when a proposed fee percentage is executed
    event FeePercentageExecuted(uint256 oldPercentage, uint256 newPercentage);
    /// @notice Emitted when funds are withdrawn by the owner
    event FundsWithdrawn(address recipient, uint256 amount);
    /// @notice Emitted when an ERC721 token is withdrawn by the owner
    event ERC721Withdrawn(address token, uint256 tokenId, address recipient);
    /// @notice Emitted when a new fee recipient is proposed
    event FeeRecipientProposed(address indexed newFeeRecipient, uint256 timestamp);
    /// @notice Emitted when fee recipient is updated
    event FeeRecipientUpdated(address indexed oldFeeRecipient, address indexed newFeeRecipient);
    /// @notice Emitted when a hero transfer fails
    event HeroTransferFailed(uint256 indexed heroId, address indexed seller, address indexed buyer, string reason);
    // (unused) event PriceUpdateCooldownTriggered(uint256 indexed heroId, uint256 nextUpdateTime);
    /// @notice Emitted when heroes are bulk listed
    event HeroesBulkListed(uint256 indexed bulkListingId, address indexed seller, uint256[] heroIds, uint256 totalPrice);
    /// @notice Emitted when a bulk listing is purchased
    event BulkListingPurchased(
        uint256 indexed bulkListingId, 
        address indexed buyer, 
        address indexed seller, 
        uint256[] heroIds, 
        uint256 totalPrice,
        uint256 timestamp
    );
    /// @notice Emitted when bulk listing data is cleaned
    event BulkListingCleaned(uint256 indexed bulkListingId, uint256 originalLength, uint256 remainingLength);
    
    /// @notice Emitted when a new bulk listing is created with all details
    event BulkListingCreated(
        uint256 indexed bulkListingId,
        address indexed seller,
        uint256[] heroIds,
        uint256[] prices,
        uint256 totalPrice,
        uint256 timestamp
    );
    
    /// @notice Emitted when a bulk listing is cancelled with all details
    event BulkListingCancelled(
        uint256 indexed bulkListingId,
        address indexed seller,
        uint256[] heroIds,
        uint256 timestamp
    );
    
    /// @notice Emitted when a hero is added to the marketplace
    event HeroAdded(uint256 indexed heroId, address indexed owner, uint256 price, uint256 bulkListingId);
    
    /// @notice Emitted when a hero is removed from the marketplace
    event HeroRemoved(uint256 indexed heroId, address indexed owner, string reason);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the marketplace
    /// @param _honkToken The address of the HONK token contract
    /// @param _dfkHeroContract The address of the DFK hero contract
    /// @param _feeRecipient The address that will receive marketplace fees
    function initialize(
        address _honkToken,
        address _dfkHeroContract,
        address _feeRecipient
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __Pausable_init();

        require(_honkToken != address(0), "Invalid HONK token address");
        require(_dfkHeroContract != address(0), "Invalid DFK Hero contract address");
        require(_feeRecipient != address(0), "Invalid fee recipient address");

        honkToken = IERC20(_honkToken);
        dfkHeroContract = IHeroCoreDiamond(_dfkHeroContract);
        feeRecipient = _feeRecipient;
        FEE_PERCENTAGE = 100; // 1% fee (100 / 10000)
    }

    /// @notice Sets a new fee recipient address
    /// @param _newFeeRecipient The new address to receive marketplace fees
    function setFeeRecipient(address _newFeeRecipient) external onlyOwner whenNotPaused {
        require(_newFeeRecipient != address(0), "Invalid fee recipient address");
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
        
        // Add minimum delay check
        uint256 minDelay = TIMELOCK_PERIOD;
        uint256 currentTime = block.timestamp;
        uint256 proposedTime = proposedFeePercentageTimestamp;
        
        require(currentTime >= proposedTime, "Invalid timestamp");
        require(currentTime - proposedTime >= minDelay, "Time-lock period not elapsed");
        require(currentTime - proposedTime <= minDelay + 1 days, "Update window expired");

        uint256 oldFeePercentage = FEE_PERCENTAGE;
        FEE_PERCENTAGE = proposedFeePercentage;
        
        // Reset the proposal after execution
        proposedFeePercentage = 0;
        proposedFeePercentageTimestamp = 0;
        
        emit FeePercentageUpdated(oldFeePercentage, FEE_PERCENTAGE);
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
    function withdrawERC721(address _token, uint256 _tokenId, address _recipient) external onlyOwner whenNotPaused {
        require(_recipient != address(0), "Invalid recipient address");
        // Emit event before external call
        emit ERC721Withdrawn(_token, _tokenId, _recipient);
        IERC721(_token).safeTransferFrom(address(this), _recipient, _tokenId);
    }

    /// @notice Proposes a new fee recipient with timelock
    /// @param _newFeeRecipient The address of the new fee recipient
    function proposeFeeRecipient(address _newFeeRecipient) external onlyOwner whenNotPaused {
        require(_newFeeRecipient != address(0), "Invalid fee recipient address");
        proposedFeeRecipient = _newFeeRecipient;
        proposedFeeRecipientTimestamp = block.timestamp;
        emit FeeRecipientProposed(_newFeeRecipient, block.timestamp);
    }

    /// @notice Executes the fee recipient update after timelock period
    function executeFeeRecipientUpdate() external onlyOwner whenNotPaused {
        require(proposedFeeRecipientTimestamp != 0, "No fee recipient update proposed");
        require(block.timestamp >= proposedFeeRecipientTimestamp + TIMELOCK_PERIOD, "Timelock not elapsed");
        
        address oldRecipient = feeRecipient;
        feeRecipient = proposedFeeRecipient;
        proposedFeeRecipient = address(0);
        proposedFeeRecipientTimestamp = 0;
        
        emit FeeRecipientUpdated(oldRecipient, feeRecipient);
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
    function listHero(uint256 _heroId, uint256 _price) public whenNotPaused nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        require(_price <= MAX_PRICE, "Price exceeds maximum allowed");
        require(dfkHeroContract.ownerOf(_heroId) == msg.sender, "You don't own this hero");
        require(!isHeroListed[_heroId], "Hero is already listed");
        
        uint256 newIndex;
        
        // Reuse recycled indices when available
        if (recycledIndicesCount > 0) {
            recycledIndicesCount--;
            newIndex = recycledIndices[recycledIndicesCount];
            recycledIndices.pop();
            emit IndexRecycled(newIndex);
        } else {
            // Only increment if no recycled indices available
            require(heroCount < MAX_HERO_COUNT, "Maximum hero count reached");
            heroCount++;
            newIndex = heroCount;
        }

        // Update mappings
        heroIdToIndex[_heroId] = newIndex;
        heroes[newIndex] = Hero(_heroId, msg.sender, _price, true, 0);
        isHeroListed[_heroId] = true;
        // --- new mappings ---
        heroesByToken[_heroId] = heroes[newIndex];
        heroListedByToken[_heroId] = true;
        heroAllowedBuyer[_heroId] = address(0);
        listedHeroCount++;
        
        // Set initial price update timestamp
        lastPriceUpdateTime[_heroId] = block.timestamp;

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

        emit HeroUnlisted(_heroId, hero.owner);
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

            emit HeroUnlisted(heroId, hero.owner);
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
        require(_newPrice <= MAX_PRICE, "Price exceeds maximum allowed");

        // Check cooldown period
        uint256 nextAllowedUpdate = lastPriceUpdateTime[_heroId] + PRICE_UPDATE_COOLDOWN;
        require(block.timestamp >= nextAllowedUpdate, "Price update too soon");
        
        hero.price = _newPrice;
        lastPriceUpdateTime[_heroId] = block.timestamp;

        emit HeroPriceUpdated(_heroId, msg.sender, _newPrice);
    }



    event BuyHeroDebug(string step, uint256 heroId, uint256 value);

    /// @notice Allows a user to purchase a listed hero
    /// @param heroId The ID of the hero to be purchased
    /// @dev This function handles the transfer of HONK tokens and the hero NFT
    /// @dev Includes checks for DFK Tavern listings and automatically removes invalid listings
    function buyHero(uint256 heroId) external whenNotPaused nonReentrant {
        uint256 index = heroIdToIndex[heroId];
        require(index != 0, "BH1: Hero does not exist");
        Hero storage hero = heroes[index];
        require(hero.isForSale, "BH2: Hero is not for sale");
        // Enforce private listing recipient check
        address allowedBuyerAddr = heroAllowedBuyer[heroId];
        require(allowedBuyerAddr == address(0) || allowedBuyerAddr == msg.sender, "BH2A: Private listing");
        
        // Check ownership early and handle DFK Tavern case
        address currentOwner = dfkHeroContract.ownerOf(heroId);
        if (currentOwner != hero.owner) {
            // Clean up the listing and provide clear error message
            _removeHeroFromMarketplace(index, heroId);
            revert("Hero is no longer available (possibly listed on DFK Tavern)");
        }

        require(msg.sender != hero.owner, "BH3: Cannot buy your own hero");

        uint256 price = hero.price;
        address seller = hero.owner;

        // Add explicit allowance and balance checks early to save gas
        uint256 currentAllowance = honkToken.allowance(msg.sender, address(this));
        require(currentAllowance >= price, "BH12: Insufficient HONK allowance");
        
        uint256 buyerBalance = honkToken.balanceOf(msg.sender);
        require(buyerBalance >= price, "BH4: Insufficient HONK balance");


        uint256 fee = (price * FEE_PERCENTAGE) / 10000;
        uint256 sellerAmount = price - fee;

        // State changes first - remove from marketplace
        _removeHeroFromMarketplace(index, heroId);
        
        // Emit event before external transfers
        emit HeroPurchased(heroId, msg.sender, seller, price);

        // External calls last
        bool transferToSellerSuccess = honkToken.transferFrom(msg.sender, seller, sellerAmount);
        require(transferToSellerSuccess, "BH6: Failed to transfer HONK to seller");

        bool transferFeeSuccess = honkToken.transferFrom(msg.sender, feeRecipient, fee);
        require(transferFeeSuccess, "BH7: Failed to transfer fee");

        try dfkHeroContract.transferHeroAndEquipmentFrom(seller, msg.sender, heroId) {
            // Success case - no additional action needed
        } catch Error(string memory reason) {
            emit HeroTransferFailed(heroId, seller, msg.sender, reason);
            revert(string(abi.encodePacked("BH9: Hero transfer failed: ", reason)));
        } catch {
            emit HeroTransferFailed(heroId, seller, msg.sender, "Unknown error");
            revert("BH10: Hero transfer failed");
        }
    }

    /// @notice Removes a hero from the marketplace
    /// @dev This function should be called when a hero is sold or its listing is cancelled
    /// @dev Indices only grow to prevent collisions and ensure consistent index referencing
    /// @param index The index of the hero in the heroes mapping
    /// @param heroId The ID of the hero to be removed
    function _removeHeroFromMarketplace(uint256 index, uint256 heroId) internal {
        // Cache the hero to check if it was listed
        Hero memory hero = heroes[index];
        bool wasListed = hero.isForSale;
        uint256 bulkListingId = hero.bulkListingId;
        
        // Delete hero data
        delete heroes[index];
        delete heroIdToIndex[heroId];
        delete isHeroListed[heroId];
        delete heroesByToken[heroId];
        delete heroListedByToken[heroId];
        delete heroAllowedBuyer[heroId];
        
        // Add index to recycled list for reuse
        recycledIndices.push(index);
        recycledIndicesCount++;
        
        emit HeroUnlisted(heroId, hero.owner);
        
        // Update only listedHeroCount if necessary
        if (wasListed && listedHeroCount > 0) {
            listedHeroCount--;
        }
        
        // Clean up bulk listing data if this hero was part of one
        if (bulkListingId > 0) {
            uint256[] storage bulkHeroes = bulkListingHeroes[bulkListingId];
            for (uint256 i = 0; i < bulkHeroes.length; i++) {
                if (bulkHeroes[i] == heroId) {
                    // Remove hero from array by replacing with last element and reducing length
                    bulkHeroes[i] = bulkHeroes[bulkHeroes.length - 1];
                    bulkHeroes.pop();
                    
                    // Update total price by subtracting this hero's price
                    if (bulkListingTotalPrice[bulkListingId] >= hero.price) {
                        bulkListingTotalPrice[bulkListingId] -= hero.price;
                    }
                    
                    // If no heroes left in bulk listing, clean it up completely
                    if (bulkHeroes.length == 0) {
                        delete bulkListingHeroes[bulkListingId];
                        delete bulkListingTotalPrice[bulkListingId];
                        delete allowPartialBulkPurchase[bulkListingId];
                        delete bulkAllowedBuyer[bulkListingId];
                    }
                    
                    break;
                }
            }
        }
        // Note: We don't decrease heroCount - indices only grow to prevent collisions
    }

    /// @notice Emergency cleanup function that resets all marketplace listings
    /// @dev CAUTION: This removes all current listings from the marketplace
    /// @dev Users will need to re-list their heroes after this is called
    /// @dev Should only be called in emergency situations or during upgrades
    function adminEmergencyCleanup() external onlyOwner whenPaused {
        // Reset the marketplace-related counters
        heroCount = 0;
        listedHeroCount = 0;

        // Clear a large fixed range of storage slots to ensure we catch everything
        // Using 1000 as a safe maximum that would cover any reasonable number of listings
        for (uint256 i = 1; i <= 1000; i++) {
            // Get and clear any hero at this index
            Hero memory hero = heroes[i];
            if (hero.id != 0) {
                delete isHeroListed[hero.id];
                delete heroIdToIndex[hero.id];
            }
            delete heroes[i];
        }
    }

    /// @notice Removes listings where the hero is no longer owned by the listed owner
    /// @dev This can happen when heroes are listed on other marketplaces or transferred
    /// @param heroIds Array of hero IDs to check and potentially clean up
    function cleanupStaleListings(uint256[] calldata heroIds) external onlyOwner {
        for (uint256 i = 0; i < heroIds.length; i++) {
            uint256 heroId = heroIds[i];
            uint256 index = heroIdToIndex[heroId];
            if (index != 0) {
                Hero memory hero = heroes[index];
                if (hero.isForSale) {
                    try dfkHeroContract.ownerOf(heroId) returns (address currentOwner) {
                        if (currentOwner != hero.owner) {
                            _removeHeroFromMarketplace(index, heroId);
                            emit HeroUnlisted(heroId, hero.owner);
                        }
                    } catch {
                        // If ownerOf reverts, the hero might not exist anymore
                        _removeHeroFromMarketplace(index, heroId);
                        emit HeroUnlisted(heroId, hero.owner);
                    }
                }
            }
        }
    }

    /// @notice Retrieves the details of a specific hero
    /// @param _heroId The ID of the hero
    /// @return Hero The hero details
    // ===== New helper that returns hero struct directly keyed by tokenId =====
    function getHeroByToken(uint256 _heroId) external view returns (Hero memory) {
        return heroesByToken[_heroId];
    }

    /// @notice Retained for backward compatibility. Prefer getHeroByToken.
    function getHero(uint256 _heroId) external view returns (Hero memory) {
        uint256 index = heroIdToIndex[_heroId];
        if (index == 0) {
            return Hero(_heroId, address(0), 0, false, 0);
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
                result[i] = Hero(_heroIds[i], address(0), 0, false, 0);
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

    /// @notice Bulk lists multiple heroes for sale in the marketplace
    /// @param _heroIds An array of hero IDs to be listed
    /// @param _prices An array of prices corresponding to each hero (in HONK tokens)
    /// @dev This function can only be called by the owner of the heroes
    /// @dev Arrays must be of equal length and not exceed 50 heroes per transaction
    function bulkListHeroes(uint256[] calldata _heroIds, uint256[] calldata _prices) public whenNotPaused nonReentrant returns (uint256) {
        // Input validation with custom errors for gas efficiency
        if (_heroIds.length != _prices.length) {
            revert InvalidBulkListing("Arrays length mismatch");
        }
        if (_heroIds.length == 0) {
            revert InvalidBulkListing("No heroes to list");
        }
        if (_heroIds.length > 50) {
            revert InvalidBulkListing("Cannot list more than 50 heroes at once");
        }

        // Create a new bulk listing ID
        nextBulkListingId++;
        uint256 bulkListingId = nextBulkListingId;
        uint256 totalPrice = 0;

        // Arrays to store the actual listed hero IDs and prices (in case some are filtered out)
        uint256[] memory listedHeroIds = new uint256[](_heroIds.length);
        uint256[] memory listedPrices = new uint256[](_prices.length);
        uint256 listedCount = 0;

        for (uint256 i = 0; i < _heroIds.length; i++) {
            uint256 heroId = _heroIds[i];
            uint256 price = _prices[i];
            
            // Validate each hero and price with custom errors
            if (price == 0) {
                emit HeroRemoved(heroId, msg.sender, "Price must be greater than zero");
                continue;
            }
            if (price > MAX_PRICE) {
                emit HeroRemoved(heroId, msg.sender, "Price exceeds maximum allowed");
                continue;
            }
            if (dfkHeroContract.ownerOf(heroId) != msg.sender) {
                emit HeroRemoved(heroId, msg.sender, "You don't own this hero");
                continue;
            }
            if (isHeroListed[heroId]) {
                emit HeroRemoved(heroId, msg.sender, "Hero is already listed");
                continue;
            }

            totalPrice += price;

            // Always increment and use new index
            heroCount++;
            uint256 newIndex = heroCount;
            
            // Update mappings with bulk listing ID
            heroIdToIndex[heroId] = newIndex;
            heroes[newIndex] = Hero(heroId, msg.sender, price, true, bulkListingId);
            // ----- new mappings for tokenId directly -----
            heroesByToken[heroId] = heroes[newIndex];
            heroListedByToken[heroId] = true;
            isHeroListed[heroId] = true;
            listedHeroCount++;
            
            // Set initial price update timestamp
            lastPriceUpdateTime[heroId] = block.timestamp;

            // Add to our listed arrays
            listedHeroIds[listedCount] = heroId;
            listedPrices[listedCount] = price;
            listedCount++;

            emit HeroListed(heroId, msg.sender, price);
            emit HeroAdded(heroId, msg.sender, price, bulkListingId);
        }

        // If no valid heroes were listed, revert
        if (listedCount == 0) {
            revert InvalidBulkListing("No valid heroes to list");
        }

        // Trim the arrays if we had any invalid listings
        if (listedCount < listedHeroIds.length) {
            uint256[] memory trimmedHeroIds = new uint256[](listedCount);
            uint256[] memory trimmedPrices = new uint256[](listedCount);
            
            for (uint256 i = 0; i < listedCount; i++) {
                trimmedHeroIds[i] = listedHeroIds[i];
                trimmedPrices[i] = listedPrices[i];
            }
            
            listedHeroIds = trimmedHeroIds;
            listedPrices = trimmedPrices;
        }

        // Store bulk listing information
        bulkListingHeroes[bulkListingId] = listedHeroIds;
        bulkListingTotalPrice[bulkListingId] = totalPrice;
        // Mark as public listing for bulk
        bulkAllowedBuyer[bulkListingId] = address(0);

        emit HeroesBulkListed(bulkListingId, msg.sender, listedHeroIds, totalPrice);
        emit BulkListingCreated(
            bulkListingId,
            msg.sender,
            listedHeroIds,
            listedPrices,
            totalPrice,
            block.timestamp
        );
        
        return bulkListingId;
    }

    /// -------------------------------------------------
    /// PRIVATE LISTING FUNCTIONS
    /// -------------------------------------------------
    /// @notice Lists a hero for a specific buyer only
    function listHeroPrivate(uint256 _heroId, uint256 _price, address _allowedBuyer) external whenNotPaused {
        require(_allowedBuyer != address(0), "Invalid buyer");
        listHero(_heroId, _price); // reuse logic
        heroAllowedBuyer[_heroId] = _allowedBuyer;
        emit PrivateHeroListed(_heroId, msg.sender, _price, _allowedBuyer);
    }

    /// @notice Bulk list heroes for a specific buyer only
    function bulkListHeroesPrivate(uint256[] calldata _heroIds, uint256[] calldata _prices, address _allowedBuyer) external whenNotPaused returns (uint256) {
        require(_allowedBuyer != address(0), "Invalid buyer");
        uint256 bulkId = bulkListHeroes(_heroIds, _prices);
        bulkAllowedBuyer[bulkId] = _allowedBuyer;
        // Set per-hero allowed buyer so front-ends can query quickly
        for (uint256 i = 0; i < _heroIds.length; i++) {
            heroAllowedBuyer[_heroIds[i]] = _allowedBuyer;
        }
        emit PrivateBulkListed(bulkId, msg.sender, bulkListingTotalPrice[bulkId], _allowedBuyer);
        return bulkId;
    }

    /// @notice Purchases an entire bulk listing
    /// @param _bulkListingId The ID of the bulk listing to purchase
    function purchaseBulkListing(uint256 _bulkListingId) external whenNotPaused nonReentrant {
        // Input validation with custom errors
        if (_bulkListingId == 0 || _bulkListingId > nextBulkListingId) {
            revert InvalidBulkPurchase("Invalid bulk listing ID");
        }
        
        // Enforce private bulk listing recipient check
        address allowedBuyerAddr = bulkAllowedBuyer[_bulkListingId];
        require(allowedBuyerAddr == address(0) || allowedBuyerAddr == msg.sender, "BP2A: Private bulk listing");
        // Get the bulk listing data
        uint256[] memory heroIds = bulkListingHeroes[_bulkListingId];
        if (heroIds.length == 0) {
            revert InvalidBulkPurchase("Bulk listing not found or already sold");
        }
        
        bool allowPartial = allowPartialBulkPurchase[_bulkListingId];
        
        // First pass: validate heroes and calculate actual price
        uint256 validHeroCount = 0;
        uint256 actualTotalPrice = 0;
        address seller;
        bool[] memory validHeroes = new bool[](heroIds.length);
        
        for (uint256 i = 0; i < heroIds.length; i++) {
            uint256 heroId = heroIds[i];
            uint256 index = heroIdToIndex[heroId];
            
            if (index == 0 || !heroes[index].isForSale || heroes[index].bulkListingId != _bulkListingId) {
                if (!allowPartial) {
                    revert InvalidBulkPurchase("Some heroes are no longer available");
                }
                continue;
            }
            
            Hero memory hero = heroes[index];
            
            // Verify ownership
            try dfkHeroContract.ownerOf(heroId) returns (address owner) {
                if (owner != hero.owner) {
                    if (!allowPartial) {
                        revert InvalidBulkPurchase("Seller no longer owns all heroes");
                    }
                    continue;
                }
            } catch {
                if (!allowPartial) {
                    revert InvalidBulkPurchase("Hero ownership check failed");
                }
                continue;
            }
            
            // Set seller from first valid hero
            if (validHeroCount == 0) {
                seller = hero.owner;
            } else if (hero.owner != seller) {
                if (!allowPartial) {
                    revert InvalidBulkPurchase("Heroes have different owners");
                }
                continue;
            }
            
            validHeroes[i] = true;
            validHeroCount++;
            actualTotalPrice += hero.price;
        }
        
        // Validate results
        if (validHeroCount == 0) {
            revert InvalidBulkPurchase("No valid heroes found");
        }
        if (seller == msg.sender) {
            revert InvalidBulkPurchase("Cannot buy your own heroes");
        }

        // Calculate fees
        uint256 fee = (actualTotalPrice * FEE_PERCENTAGE) / 10000;
        uint256 sellerAmount = actualTotalPrice - fee;

        // SECURITY FIX: Remove heroes from marketplace BEFORE external calls to prevent reentrancy
        uint256[] memory transferredHeroIds = new uint256[](validHeroCount);
        uint256 transferIndex = 0;
        
        for (uint256 i = 0; i < heroIds.length; i++) {
            if (!validHeroes[i]) continue;
            
            uint256 heroId = heroIds[i];
            uint256 index = heroIdToIndex[heroId];
            
            // Remove hero from marketplace FIRST (state change before external call)
            _removeHeroFromMarketplace(index, heroId);
            transferredHeroIds[transferIndex] = heroId;
            transferIndex++;
        }

        // Now safe to make external calls after state changes
        // Transfer HONK tokens
        honkToken.safeTransferFrom(msg.sender, seller, sellerAmount);
        if (fee > 0) {
            honkToken.safeTransferFrom(msg.sender, feeRecipient, fee);
        }
        
        // Process hero transfers
        for (uint256 i = 0; i < transferIndex; i++) {
            uint256 heroId = transferredHeroIds[i];
            
            try dfkHeroContract.transferHeroAndEquipmentFrom(seller, msg.sender, heroId) {
                emit HeroPurchased(heroId, msg.sender, seller, actualTotalPrice / validHeroCount); // Use average price for event
            } catch Error(string memory reason) {
                if (!allowPartial) {
                    revert InvalidBulkPurchase(string(abi.encodePacked("Hero transfer failed: ", reason)));
                }
                emit HeroTransferFailed(heroId, seller, msg.sender, reason);
            }
        }
        
        // Clean up if all heroes were purchased
        if (bulkListingHeroes[_bulkListingId].length == 0) {
            delete allowPartialBulkPurchase[_bulkListingId];
        }
        
        emit BulkListingPurchased(
            _bulkListingId, 
            msg.sender, 
            seller, 
            transferredHeroIds, 
            actualTotalPrice,
            block.timestamp
        );
    }
    
    /// @notice Batched emergency cleanup function
    /// @param batchSize Number of indices to clean in this batch (max CLEANUP_BATCH_SIZE)
    function adminEmergencyCleanupBatch(uint256 batchSize) external onlyOwner whenPaused {
        require(batchSize > 0 && batchSize <= CLEANUP_BATCH_SIZE, "Invalid batch size");
        
        uint256 startIndex = lastCleanupIndex + 1;
        uint256 endIndex = startIndex + batchSize - 1;
        uint256 itemsCleaned = 0;
        
        // Clean the batch
        for (uint256 i = startIndex; i <= endIndex && i <= heroCount; i++) {
            Hero memory hero = heroes[i];
            if (hero.id != 0) {
                delete isHeroListed[hero.id];
                delete heroIdToIndex[hero.id];
                delete heroes[i];
                itemsCleaned++;
                
                // Add to recycled indices
                recycledIndices.push(i);
                recycledIndicesCount++;
            }
        }
        
        lastCleanupIndex = endIndex;
        
        // Reset counters if we've cleaned everything
        if (lastCleanupIndex >= heroCount) {
            heroCount = 0;
            listedHeroCount = 0;
            lastCleanupIndex = 0;
            // Note: recycled indices are preserved for future use
        }
        
        emit BatchCleanupProgress(startIndex, endIndex, itemsCleaned);
    }

    /// @notice Reset cleanup progress without deleting data
    function resetCleanupProgress() external onlyOwner whenPaused {
        lastCleanupIndex = 0;
    }
    
    /// @notice Enable partial purchases for a bulk listing
    /// @param _bulkListingId The bulk listing to enable partial purchases for
    function enablePartialBulkPurchase(uint256 _bulkListingId) external whenNotPaused {
        require(_bulkListingId > 0 && _bulkListingId <= nextBulkListingId, "Invalid bulk listing ID");
        
        // Verify sender owns at least one hero in the bulk listing
        uint256[] memory heroIds = bulkListingHeroes[_bulkListingId];
        require(heroIds.length > 0, "Bulk listing not found");
        
        bool ownsHero = false;
        for (uint256 i = 0; i < heroIds.length; i++) {
            uint256 index = heroIdToIndex[heroIds[i]];
            if (index != 0 && heroes[index].owner == msg.sender) {
                ownsHero = true;
                break;
            }
        }
        require(ownsHero, "You don't own any heroes in this bulk listing");
        
        allowPartialBulkPurchase[_bulkListingId] = true;
        emit PartialBulkPurchaseAllowed(_bulkListingId, msg.sender);
    }
    
    /// @notice Get information about recyclable indices
    function getRecycledIndicesInfo() external view returns (uint256 count, uint256[] memory indices) {
        return (recycledIndicesCount, recycledIndices);
    }

    /// @notice Check if partial purchase is allowed for a bulk listing
    function isPartialPurchaseAllowed(uint256 _bulkListingId) external view returns (bool) {
        return allowPartialBulkPurchase[_bulkListingId];
    }
    
    /// @notice Cancels an entire bulk listing
    /// @param _bulkListingId The ID of the bulk listing to cancel
    function cancelBulkListing(uint256 _bulkListingId) external whenNotPaused nonReentrant {
        // Input validation with custom errors
        if (_bulkListingId == 0 || _bulkListingId > nextBulkListingId) {
            revert InvalidBulkListing("Invalid bulk listing ID");
        }
        
        uint256[] memory heroIds = bulkListingHeroes[_bulkListingId];
        if (heroIds.length == 0) {
            revert InvalidBulkListing("Bulk listing not found or already cancelled");
        }

        // Arrays to store valid hero IDs and their indices
        uint256[] memory validHeroIds = new uint256[](heroIds.length);
        uint256 validCount = 0;
        address seller = address(0);

        // First pass: validate all heroes
        for (uint256 i = 0; i < heroIds.length; i++) {
            uint256 heroId = heroIds[i];
            uint256 index = heroIdToIndex[heroId];
            
            // Skip if hero is no longer valid
            if (index == 0) {
                emit HeroRemoved(heroId, address(0), "Hero not found in marketplace");
                continue;
            }
            
            Hero memory hero = heroes[index];
            
            // Verify ownership
            if (hero.owner != msg.sender) {
                emit HeroRemoved(heroId, hero.owner, "You don't own this hero");
                continue;
            }
            
            // Verify bulk listing ID
            if (hero.bulkListingId != _bulkListingId) {
                emit HeroRemoved(heroId, hero.owner, "Hero not part of this bulk listing");
                continue;
            }
            
            // Set seller from first valid hero (should all be the same)
            if (validCount == 0) {
                seller = hero.owner;
            } else if (hero.owner != seller) {
                emit HeroRemoved(heroId, hero.owner, "Heroes have different owners");
                continue;
            }
            
            // Add to valid heroes
            validHeroIds[validCount] = heroId;
            validCount++;
        }
        
        // If no valid heroes found, revert
        if (validCount == 0) {
            revert InvalidBulkListing("No valid heroes found in bulk listing");
        }
        
        // Second pass: process valid heroes
        for (uint256 i = 0; i < validCount; i++) {
            uint256 heroId = validHeroIds[i];
            uint256 index = heroIdToIndex[heroId];
            
            // Remove from marketplace
            _removeHeroFromMarketplace(index, heroId);
            emit HeroUnlisted(heroId, msg.sender);
            emit HeroRemoved(heroId, msg.sender, "Bulk listing cancelled");
        }

        // Clean up bulk listing data
        delete bulkListingHeroes[_bulkListingId];
        delete bulkListingTotalPrice[_bulkListingId];

        // Emit the detailed cancellation event with timestamp
        emit BulkListingCancelled(
            _bulkListingId,
            msg.sender,
            validCount < validHeroIds.length ? _trimArray(validHeroIds, validCount) : validHeroIds,
            block.timestamp
        );
    }
    
    /// @dev Helper function to trim an array to a specified length
    function _trimArray(uint256[] memory arr, uint256 length) internal pure returns (uint256[] memory) {
        uint256[] memory result = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = arr[i];
        }
        return result;
    }

    /// @notice Gets bulk listing information
    /// @param _bulkListingId The ID of the bulk listing
    /// @return heroIds Array of hero IDs in the bulk listing
    /// @return totalPrice Total price of the bulk listing
    function getBulkListing(uint256 _bulkListingId) external view returns (uint256[] memory heroIds, uint256 totalPrice) {
        return (bulkListingHeroes[_bulkListingId], bulkListingTotalPrice[_bulkListingId]);
    }

    /// @notice Cleans up stale bulk listing data where heroes are no longer listed
    /// @dev Only callable by owner to fix data integrity issues
    /// @param _bulkListingId The ID of the bulk listing to clean
    function cleanupStaleBulkListing(uint256 _bulkListingId) external onlyOwner {
        require(_bulkListingId > 0 && _bulkListingId <= nextBulkListingId, "Invalid bulk listing ID");
        
        uint256[] storage bulkHeroes = bulkListingHeroes[_bulkListingId];
        uint256 originalLength = bulkHeroes.length;
        uint256 totalPrice = 0;
        
        // Check each hero in the bulk listing
        for (uint256 i = 0; i < bulkHeroes.length; ) {
            uint256 heroId = bulkHeroes[i];
            uint256 index = heroIdToIndex[heroId];
            
            // Remove hero if not listed or not part of this bulk listing
            if (index == 0 || !heroes[index].isForSale || heroes[index].bulkListingId != _bulkListingId) {
                // Remove by replacing with last element
                bulkHeroes[i] = bulkHeroes[bulkHeroes.length - 1];
                bulkHeroes.pop();
                // Don't increment i since we replaced current element
            } else {
                // Hero is valid, add to total price
                totalPrice += heroes[index].price;
                i++;
            }
        }
        
        // Update or delete bulk listing based on remaining heroes
        if (bulkHeroes.length == 0) {
            delete bulkListingHeroes[_bulkListingId];
            delete bulkListingTotalPrice[_bulkListingId];
        } else {
            bulkListingTotalPrice[_bulkListingId] = totalPrice;
        }
        
        emit BulkListingCleaned(_bulkListingId, originalLength, bulkHeroes.length);
    }

    /// @notice Cleans all bulk listings to fix data integrity
    /// @dev Only callable by owner, use with caution as it's gas intensive
    function cleanupAllBulkListings() external onlyOwner {
        for (uint256 i = 1; i <= nextBulkListingId; i++) {
            if (bulkListingHeroes[i].length > 0) {
                this.cleanupStaleBulkListing(i);
            }
        }
    }

    /// @notice Helper function to convert uint to string
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}