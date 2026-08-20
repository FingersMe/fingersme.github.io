// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FingersLoserNFT — "Fingers Me: Losers"
 * @notice The LOSS collection: the middle-finger meme NFT minted (90% chance) by the FingersMe
 *         game when a commit-reveal misses. Purely cosmetic — carries no presale rights. It
 *         lives forever in the loser's wallet as a badge of shame (holders may voluntarily burn
 *         their own).
 *
 *         Minting is restricted to the FingersMe game contract, bound exactly once (`setGame`).
 */
contract FingersLoserNFT is ERC721, Ownable {
    /// @notice The FingersMe game contract, the only minter. Set once.
    address public game;

    /// @notice Next token id (also equals total ever minted).
    uint256 public nextId;

    /// @notice Total loser NFTs currently in existence (minted - self-burned).
    uint256 public totalSupply;

    string private _baseTokenURI;
    string public contractURI;

    event GameSet(address indexed game);
    event BaseURIUpdated(string baseURI);
    event ContractURIUpdated(string uri);

    modifier onlyGame() {
        require(msg.sender == game, "FMLOSE: not game");
        _;
    }

    constructor(string memory baseURI_, string memory contractURI_)
        ERC721("Fingers Me: Losers", "FMLOSE")
        Ownable(msg.sender)
    {
        _baseTokenURI = baseURI_;
        contractURI = contractURI_;
    }

    /// @notice Bind the game contract exactly once. Irreversible.
    function setGame(address game_) external onlyOwner {
        require(game == address(0), "FMLOSE: game already set");
        require(game_ != address(0), "FMLOSE: zero game");
        game = game_;
        emit GameSet(game_);
    }

    /// @notice Mint a loser NFT. Game-only. Returns the new token id.
    function mint(address to) external onlyGame returns (uint256 id) {
        id = nextId++;
        totalSupply++;
        _safeMint(to, id);
    }

    /// @notice A holder may voluntarily burn their own shame badge.
    function burn(uint256 tokenId) external {
        require(_ownerOf(tokenId) == msg.sender, "FMLOSE: not owner");
        totalSupply--;
        _burn(tokenId);
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
