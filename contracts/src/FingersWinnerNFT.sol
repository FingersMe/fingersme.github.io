// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FingersWinnerNFT — "Fingers Me: Winners"
 * @notice The WIN collection. Minted (10% chance) by the FingersMe game on a successful
 *         commit-reveal. Each winner NFT is a presale-entry ticket: in Round 2 it is burned
 *         to claim an equal share of the presale token allocation.
 *
 *         Minting and burning are restricted to the FingersMe game contract, which is bound
 *         exactly once (`setGame`) and can never be changed afterwards. Ownership of this
 *         contract only controls cosmetic metadata (base/contract URI) — it can NOT mint,
 *         burn, or move anyone's NFT.
 */
contract FingersWinnerNFT is ERC721, Ownable {
    /// @notice The FingersMe game contract, the only address allowed to mint/burn. Set once.
    address public game;

    /// @notice Next token id to be minted (also equals total ever minted).
    uint256 public nextId;

    /// @notice Total winner NFTs currently in existence (minted - burned).
    uint256 public totalSupply;

    string private _baseTokenURI;
    string public contractURI; // collection-level metadata for explorers/marketplaces

    event GameSet(address indexed game);
    event BaseURIUpdated(string baseURI);
    event ContractURIUpdated(string uri);

    modifier onlyGame() {
        require(msg.sender == game, "FMWIN: not game");
        _;
    }

    constructor(string memory baseURI_, string memory contractURI_)
        ERC721("Fingers Me: Winners", "FMWIN")
        Ownable(msg.sender)
    {
        _baseTokenURI = baseURI_;
        contractURI = contractURI_;
    }

    /// @notice Bind the game contract exactly once. Irreversible.
    function setGame(address game_) external onlyOwner {
        require(game == address(0), "FMWIN: game already set");
        require(game_ != address(0), "FMWIN: zero game");
        game = game_;
        emit GameSet(game_);
    }

    /// @notice Mint a winner NFT. Game-only. Returns the new token id.
    function mint(address to) external onlyGame returns (uint256 id) {
        id = nextId++;
        totalSupply++;
        _safeMint(to, id);
    }

    /// @notice Burn a winner NFT during a Round 2 claim. Game-only.
    function burn(uint256 tokenId) external onlyGame {
        totalSupply--;
        _burn(tokenId);
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // ── Metadata ─────────────────────────────────────────────
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    function setContractURI(string calldata uri) external onlyOwner {
        contractURI = uri;
        emit ContractURIUpdated(uri);
    }
}
