# Appendix: Thinking Note on `delegatecall`

When I built the NFTMarketplace smart contract, I explored the wrong path for about one day and learned a lot. Here is what I learned.

- When a seller lists an NFT to the marketplace, he gives market contract approval `approve(marketaddress)` to transfer NFT from seller to buyer by calling `transferFrom()`. I would like to choose not to use `setApprovalForAll(operator, approved)` which will give market contract approval of all my NFTs in one collection.

- Seller may want to delete(de-list) an NFT from the market, so we add a function `deleteMarketItem(itemId) `. 

- The wrong path starts here. I am trying to remove approval for the seller in the market contract.

  - Call `nft.approve(address(0),tokenId)` will revert. The market contract is not the owner of this NFT or approved for all as an operator.

  - Maybe we can using `delegatecall` which will be called using the original `msg.sender`(the seller). The seller is the owner.

  - I always get "Error: VM Exception while processing transaction: reverted with reason string 'ERC721: owner query for nonexistent token'". What's going wrong?

  - When I try to delegate call other functions such as `name()`, the result is not correct.
  
  - Dig, dig, and dig. **Finally, I found that I misunderstood `delegatecall`. Delegatecall uses the storage of the caller(market contract), and it doesn't use the storage of the callee(nft contract).** Solidity Docs writes: "Storage, current address and balance still refer to the calling contract, only the code is taken from the called address. "

  - So we can't delegate call `nft.approve()` to remove approval in market contract. We can't access the original data in the NFT contract by delegatecall.

![delegatecall](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lzcfujj9vne99usj7042.png)
 

The delegatecall code snippet (which is wrong): 
```
    bytes memory returndata = Address.functionDelegateCall(
      item.nftContract, 
      abi.encodeWithSignature("approve(address,uint256)",address(0),1)
    );
    Address.verifyCallResult(true, returndata, "approve revert");
```

  - But this is not the end. I finally found that I **should not try to remove approval in the market contract**. The logic is wrong.

    - Seller calls market contract `deleteMarketItem` to remove market item.

    - Seller doesn't ask market contract to call nft contract "approve()" to remove the approval. (There is a `ERC20Permit`, but there is no permit in ERC721 yet.)
    
    - The design of blockchain don't allow contract to do this.

  - If the seller wants to do this, he should do it by himself by calling `approve()` directly. This is what we do in the unit test `await nft.approve(ethers.constants.AddressZero,1)`

Opensea suggests to use `isApprovedForAll` in its tutorial ([sample code](https://github.com/ProjectOpenSea/opensea-creatures/blob/master/contracts/ERC721Tradable.sol)):

``` js
    /**
     * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
     */
    function isApprovedForAll(address owner, address operator)
        override
        public
        view
        returns (bool)
    {
        // Whitelist OpenSea proxy contract for easy trading.
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (address(proxyRegistry.proxies(owner)) == operator) {
            return true;
        }

        return super.isApprovedForAll(owner, operator);
    }

```

The "approve for all" mechanism is quite complicated and you can refer to [the opensea proxy contract](https://docs.opensea.io/docs/polygon-basic-integration#overriding-isapprovedforall-to-reduce-trading-friction) for more information.
