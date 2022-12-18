# Task 1: What we build and project setup

![Task 1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hbv1t4ryp10inardglqh.png)
 

[[toc]]


## Task 1: What we build and project setup <a name="task1"></a>

### Task 1.1: What we build - three parts


- **An NFT collection smart contract** and a simple web page to display an NFT item. We will use on-chain SVG as the image of an NFT item. We need this sample NFT collection to work with in the marketplace contract as well as in the storefront.

- **An NFT marketplace smart contract** in which user can list an NFT item and buy an NFT item. Seller can also delist his own NFT from the market. This marketplace contract also provides query functions for webapp to query market data. We will try to cover this smart contract with unit test as much as possible.

- **An NFT marketplace storefront** using React/Web3-React/SWR. (To make it simple, we only build the necessary components of the storefront in a one-page webapp. For example, we will not provide UI components for sellers to list NFTs in the market in the webapp. ) 

The key part of this project is the marketplace smart contract (`NFTMarketplace`) with data storage, core functions and query functions.

Core functions:

``` js
function createMarketItem(address nftContract,uint256 tokenId,uint256 price) payable 
function deleteMarketItem(uint256 itemId) public
function createMarketSale(address nftContract,uint256 id) public payable
```

Query functions:
``` js
function fetchActiveItems() public view returns (MarketItem[] memory) 
function fetchMyPurchasedItems() public view returns (MarketItem[] memory)
function fetchMyCreatedItems() public view returns (MarketItem[] memory) 
```

A seller can use the smart contract to:

- approve an NFT to market contract
- create a market item with listing fee
- ...(waiting for a buyer to buy the NFT)...
- receive the price value the buyer paid

When a buyer buys in the market, the market contract facilitates the purchase process:

- a buyer buys an NFT by paying the price value
- market contract completes the purchase process:
  - transfer the price value to the seller
  - transfer the NFT from seller to buyer
  - transfer the listing fee to the market owner
  - change market item state from `Created` to `Release`

GitHub repos of this tutorial:

- smart contracts (hardhat project): https://github.com/fjun99/nftmarketplace
- web app using React: https://github.com/fjun99/web3app-tutrial-using-web3react (nftmarket branch)

Although I learned a lot from Dabit's NFT marketplace tutorial, there are 3 major differences between what we will build and his: 

- Dabit's NFT is a traditional one which stores images on IPFS while our NFT stores SVG images on-chain (just data, not image). We use this option to make our tutorial simple as we don't need to setup a server to provide NFT tokenURI (restful json api) and deal with image storage on server or IPFS. 
 
- In the first version of Dabit's tutorial, he separated the NFT ERC721 token smart contract and the marketplace smart contract. In the second version, he chooses to build an NFT ERC721 with marketplace functionality in one smart contract. We choose to separate them here as we would like to build a general purpose NFT marketplace.

- In Dabit's tutorial, when a seller lists an NFT item to marketplace, he transfers the NFT item to market contract and waits for it to be sold. As a blockchain and web3.0 user, I don't like this pattern. I would like to approve only the NFT item to the marketplace contract. And before it is sold, the item is still in my wallet. (I also would like not to use `setApprovalForAll()` to approve all the NFT items in this collection in my address to the market contract. We choose to approve NFT in a one-by-one style.)

### Task 1.2: Directory and project setup

STEP 1: Make directories

We will separate our project into two sub-directories, `chain` for hardhat project, and `webapp` for React/Next.js project.

```
--nftmarket
  --chain
  --webapp
```

STEP 2: Hardhat project 

In `chain` sub-directory, instal `hardhat` development environment and `@openzeppelin/contracts` Solidity library. Then we init an empty hardhat project.
```
yarn init -y
yarn add hardhat
yarn add @openzeppelin/contracts
yarn hardhat
```

Alternatively, you can download the hardhat chain starter project from [github repo](https://github.com/fjun99/chain-tutorial-hardhat-starter). In your `nftmarket` directory, run:

```
git clone git@github.com:fjun99/chain-tutorial-hardhat-starter.git chain
```

STEP 3: React/Next.js webapp project

You can download an empty webapp scaffold:

```
git clone https://github.com/fjun99/webapp-tutorial-scaffold.git webapp
```

You can also download the webapp codebase of this tutorial:
```
git clone git@github.com:fjun99/web3app-tutrial-using-web3react.git webapp
cd webapp
git checkout nftmarket
```

