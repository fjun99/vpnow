# Task 4: NFT marketplace smart contract


![task 4](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9yid7iflw78ge604vm8n.png)
 
[[toc]]

## Task 4: NFT marketplace smart contract<a name="task4"></a>

### Task 4.1: Contract data structure 

We adapted the `Market.sol` smart contract from Nader Dabit's tutorial (V1) to write our marketplace. Thanks a lot. But you should note that we make a lot of changes in this contract.

We define a `struct MarketItem`:

``` js
  struct MarketItem {
    uint id;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    address payable buyer;
    uint256 price;
    State state;
  }
```

Each market item can be in one of three states:
``` js
  enum State { Created, Release, Inactive }
```

Please note that we can't rely on `Created` State. If seller transfers the NFT item to others or seller removes approval of the NFT item, the state will still be `Created` indicating others can buy in the market. Actually others can't buy it.

All items are stored in a `mapping`:

``` js
  mapping(uint256 => MarketItem) private marketItems;
```

The market has an owner who is the contract deployer. Listing fee will be going to market owner when a listed NFT item is sold in the market.

In the future, we may add functionalities to transfer the ownership to other address or multi-sig wallet. To make the tutorial simple, we skip these functionalities. 

This market has a static listing fee:

``` js
  uint256 public listingFee = 0.025 ether;
  function getListingFee() public view returns (uint256) 
```

### Task 4.2: market methods

The marketplace has two categories of methods:

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

The full smart contract goes as follows:

``` js
// contracts/NFTMarketplace.sol
// SPDX-License-Identifier: MIT OR Apache-2.0
// 
// adapt and edit from (Nader Dabit): 
//    https://github.com/dabit3/polygon-ethereum-nextjs-marketplace/blob/main/contracts/Market.sol

pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "hardhat/console.sol";

contract NFTMarketplace is ReentrancyGuard {
  using Counters for Counters.Counter;
  Counters.Counter private _itemCounter;//start from 1
  Counters.Counter private _itemSoldCounter;

  address payable public marketowner;
  uint256 public listingFee = 0.025 ether;

  enum State { Created, Release, Inactive }

  struct MarketItem {
    uint id;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    address payable buyer;
    uint256 price;
    State state;
  }

  mapping(uint256 => MarketItem) private marketItems;

  event MarketItemCreated (
    uint indexed id,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller,
    address buyer,
    uint256 price,
    State state
  );

  event MarketItemSold (
    uint indexed id,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller,
    address buyer,
    uint256 price,
    State state
  );

  constructor() {
    marketowner = payable(msg.sender);
  }

  /**
   * @dev Returns the listing fee of the marketplace
   */
  function getListingFee() public view returns (uint256) {
    return listingFee;
  }
  
  /**
   * @dev create a MarketItem for NFT sale on the marketplace.
   * 
   * List an NFT.
   */
  function createMarketItem(
    address nftContract,
    uint256 tokenId,
    uint256 price
  ) public payable nonReentrant {

    require(price > 0, "Price must be at least 1 wei");
    require(msg.value == listingFee, "Fee must be equal to listing fee");

    require(IERC721(nftContract).getApproved(tokenId) == address(this), "NFT must be approved to market");

    // change to approve mechanism from the original direct transfer to market
    // IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

    _itemCounter.increment();
    uint256 id = _itemCounter.current();
  
    marketItems[id] =  MarketItem(
      id,
      nftContract,
      tokenId,
      payable(msg.sender),
      payable(address(0)),
      price,
      State.Created
    );


    emit MarketItemCreated(
      id,
      nftContract,
      tokenId,
      msg.sender,
      address(0),
      price,
      State.Created
    );
  }

  /**
   * @dev delete a MarketItem from the marketplace.
   * 
   * de-List an NFT.
   * 
   * todo ERC721.approve can't work properly!! comment out
   */
  function deleteMarketItem(uint256 itemId) public nonReentrant {
    require(itemId <= _itemCounter.current(), "id must <= item count");
    require(marketItems[itemId].state == State.Created, "item must be on market");
    MarketItem storage item = marketItems[itemId];

    require(IERC721(item.nftContract).ownerOf(item.tokenId) == msg.sender, "must be the owner");
    require(IERC721(item.nftContract).getApproved(item.tokenId) == address(this), "NFT must be approved to market");

    item.state = State.Inactive;

    emit MarketItemSold(
      itemId,
      item.nftContract,
      item.tokenId,
      item.seller,
      address(0),
      0,
      State.Inactive
    );

  }

  /**
   * @dev (buyer) buy a MarketItem from the marketplace.
   * Transfers ownership of the item, as well as funds
   * NFT:         seller    -> buyer
   * value:       buyer     -> seller
   * listingFee:  contract  -> marketowner
   */
  function createMarketSale(
    address nftContract,
    uint256 id
  ) public payable nonReentrant {

    MarketItem storage item = marketItems[id]; //should use storge!!!!
    uint price = item.price;
    uint tokenId = item.tokenId;

    require(msg.value == price, "Please submit the asking price");
    require(IERC721(nftContract).getApproved(tokenId) == address(this), "NFT must be approved to market");

    IERC721(nftContract).transferFrom(item.seller, msg.sender, tokenId);

    payable(marketowner).transfer(listingFee);
    item.seller.transfer(msg.value);

    item.buyer = payable(msg.sender);
    item.state = State.Release;
    _itemSoldCounter.increment();    

    emit MarketItemSold(
      id,
      nftContract,
      tokenId,
      item.seller,
      msg.sender,
      price,
      State.Release
    );    
  }

  /**
   * @dev Returns all unsold market items
   * condition: 
   *  1) state == Created
   *  2) buyer = 0x0
   *  3) still have approve
   */
  function fetchActiveItems() public view returns (MarketItem[] memory) {
    return fetchHepler(FetchOperator.ActiveItems);
  }

  /**
   * @dev Returns only market items a user has purchased
   * todo pagination
   */
  function fetchMyPurchasedItems() public view returns (MarketItem[] memory) {
    return fetchHepler(FetchOperator.MyPurchasedItems);
  }

  /**
   * @dev Returns only market items a user has created
   * todo pagination
  */
  function fetchMyCreatedItems() public view returns (MarketItem[] memory) {
    return fetchHepler(FetchOperator.MyCreatedItems);
  }

  enum FetchOperator { ActiveItems, MyPurchasedItems, MyCreatedItems}

  /**
   * @dev fetch helper
   * todo pagination   
   */
   function fetchHepler(FetchOperator _op) private view returns (MarketItem[] memory) {     
    uint total = _itemCounter.current();

    uint itemCount = 0;
    for (uint i = 1; i <= total; i++) {
      if (isCondition(marketItems[i], _op)) {
        itemCount ++;
      }
    }

    uint index = 0;
    MarketItem[] memory items = new MarketItem[](itemCount);
    for (uint i = 1; i <= total; i++) {
      if (isCondition(marketItems[i], _op)) {
        items[index] = marketItems[i];
        index ++;
      }
    }
    return items;
  } 

  /**
   * @dev helper to build condition
   *
   * todo should reduce duplicate contract call here
   * (IERC721(item.nftContract).getApproved(item.tokenId) called in two loop
   */
  function isCondition(MarketItem memory item, FetchOperator _op) private view returns (bool){
    if(_op == FetchOperator.MyCreatedItems){ 
      return 
        (item.seller == msg.sender
          && item.state != State.Inactive
        )? true
         : false;
    }else if(_op == FetchOperator.MyPurchasedItems){
      return
        (item.buyer ==  msg.sender) ? true: false;
    }else if(_op == FetchOperator.ActiveItems){
      return 
        (item.buyer == address(0) 
          && item.state == State.Created
          && (IERC721(item.nftContract).getApproved(item.tokenId) == address(this))
        )? true
         : false;
    }else{
      return false;
    }
  }

}

```

This NFTMarket contract can work, but it is not good. There are at least two jobs to be done:

- We should add pagination in the query functions. If there are thousands of items in the market, the query function can't work well.

- When we try to verify whether a seller has already transferred the NFT item to others or has removed the approval to the market, we call `nft.getApproved` thousands of times. This is bad practice. We should try to figure out a solution.

We may also find that letting the webapp query data directly from a smart contract is not a good design. A data indexing layer is needed. [The Graph Protocol](https://thegraph.com/) and subgraph can do this job. You can find an explanation on how to use subgraph in [Dabit's NFT market tutorial](https://dev.to/dabit3/building-scalable-full-stack-apps-on-ethereum-with-polygon-2cfb).

---

### Task 4.3: Unit test for NFTMarketplace (core function)

We will add two unit test scripts for NFTMarketplace:

- one for core functions
- one for query/fetch functions

Unit test script for core functions:

``` js
// NFTMarketplace.test.ts
import { expect } from "chai"
import { BigNumber, Signer } from "ethers"
import { ethers } from "hardhat"
import { BadgeToken, NFTMarketplace } from  "../typechain"
import { TransactionResponse, TransactionReceipt } from "@ethersproject/providers"

const _name='BadgeToken'
const _symbol='BADGE'

describe("NFTMarketplace", function () {
  let nft:BadgeToken
  let market:NFTMarketplace
  let account0:Signer,account1:Signer,account2:Signer
  let address0:string, address1:string, address2:string

  let listingFee:BigNumber
  const auctionPrice = ethers.utils.parseUnits('1', 'ether')

  beforeEach(async function () {
    [account0, account1, account2] = await ethers.getSigners()
    address0 = await account0.getAddress()
    address1 = await account1.getAddress()
    address2 = await account2.getAddress()

    const BadgeToken = await ethers.getContractFactory("BadgeToken")
    nft = await BadgeToken.deploy(_name,_symbol)

    const Market = await ethers.getContractFactory("NFTMarketplace")
    market = await Market.deploy()
    listingFee = await market.getListingFee()

  })

  it("Should create market item successfully", async function() {
    await nft.mintTo(address0)  //tokenId=1
    await nft.approve(market.address,1)
    await market.createMarketItem(nft.address, 1, auctionPrice, { value: listingFee })

    const items = await market.fetchMyCreatedItems()
    expect(items.length).to.be.equal(1)
  })

  it("Should create market item with EVENT", async function() {
    await nft.mintTo(address0)  //tokenId=1
    await nft.approve(market.address,1)
    await expect(market.createMarketItem(nft.address, 1, auctionPrice, { value: listingFee }))
      .to.emit(market, 'MarketItemCreated')
      .withArgs(
        1,
        nft.address,
        1,
        address0,
        ethers.constants.AddressZero,
        auctionPrice, 
        0)
  })

  it("Should revert to create market item if nft is not approved", async function() {
    await nft.mintTo(address0)  //tokenId=1
    // await nft.approve(market.address,1)
    await expect(market.createMarketItem(nft.address, 1, auctionPrice, { value: listingFee }))
      .to.be.revertedWith('NFT must be approved to market')
  })

  it("Should create market item and buy (by address#1) successfully", async function() {
    await nft.mintTo(address0)  //tokenId=1
    await nft.approve(market.address,1)
    await market.createMarketItem(nft.address, 1, auctionPrice, { value: listingFee })

    await expect(market.connect(account1).createMarketSale(nft.address, 1, { value: auctionPrice}))
      .to.emit(market, 'MarketItemSold')
      .withArgs(
        1,
        nft.address,
        1,
        address0,
        address1,
        auctionPrice, 
        1)

    expect(await nft.ownerOf(1)).to.be.equal(address1)

  })

  it("Should revert buy if seller remove approve", async function() {
    await nft.mintTo(address0)  //tokenId=1
    await nft.approve(market.address,1)
    await market.createMarketItem(nft.address, 1, auctionPrice, { value: listingFee })

    await nft.approve(ethers.constants.AddressZero,1)

    await expect(market.connect(account1).createMarketSale(nft.address, 1, { value: auctionPrice}))
      .to.be.reverted
  })

  it("Should revert buy if seller transfer the token out", async function() {
    await nft.mintTo(address0)  //tokenId=1
    await nft.approve(market.address,1)
    await market.createMarketItem(nft.address, 1, auctionPrice, { value: listingFee })

    await nft.transferFrom(address0,address2,1)

    await expect(market.connect(account1).createMarketSale(nft.address, 1, { value: auctionPrice}))
      .to.be.reverted
  })

  it("Should revert to delete(de-list) with wrong params", async function() {
    await nft.mintTo(address0)  //tokenId=1
    await nft.approve(market.address,1)
    await market.createMarketItem(nft.address, 1, auctionPrice, { value: listingFee })

    //not a correct id
    await expect(market.deleteMarketItem(2)).to.be.reverted

    //not owner
    await expect(market.connect(account1).deleteMarketItem(1)).to.be.reverted

    await nft.transferFrom(address0,address1,1)
    //not approved to market now
    await expect(market.deleteMarketItem(1)).to.be.reverted
  })

  it("Should create market item and delete(de-list) successfully", async function() {
    await nft.mintTo(address0)  //tokenId=1
    await nft.approve(market.address,1)

    await market.createMarketItem(nft.address, 1, auctionPrice, { value: listingFee })
    await market.deleteMarketItem(1)

    await nft.approve(ethers.constants.AddressZero,1)

    // should revert if trying to delete again
    await expect(market.deleteMarketItem(1))
      .to.be.reverted
  })

  it("Should seller, buyer and market owner correct ETH value after sale", async function() {
    let txresponse:TransactionResponse, txreceipt:TransactionReceipt
    let gas
    const marketownerBalance = await ethers.provider.getBalance(address0)

    await nft.connect(account1).mintTo(address1)  //tokenId=1
    await nft.connect(account1).approve(market.address,1)

    let sellerBalance = await ethers.provider.getBalance(address1)
    txresponse = await market.connect(account1).createMarketItem(nft.address, 1, auctionPrice, { value: listingFee })
    const sellerAfter = await ethers.provider.getBalance(address1)

    txreceipt = await txresponse.wait()
    gas = txreceipt.gasUsed.mul(txreceipt.effectiveGasPrice)

    // sellerAfter = sellerBalance - listingFee - gas
    expect(sellerAfter).to.equal(sellerBalance.sub( listingFee).sub(gas))

    const buyerBalance = await ethers.provider.getBalance(address2)
    txresponse =  await market.connect(account2).createMarketSale(nft.address, 1, { value: auctionPrice})
    const buyerAfter = await ethers.provider.getBalance(address2)

    txreceipt = await txresponse.wait()
    gas = txreceipt.gasUsed.mul(txreceipt.effectiveGasPrice)
    expect(buyerAfter).to.equal(buyerBalance.sub(auctionPrice).sub(gas))

    const marketownerAfter = await ethers.provider.getBalance(address0)
    expect(marketownerAfter).to.equal(marketownerBalance.add(listingFee))
  })
})

```

Run:
```
yarn hardhat test test/NFTMarketplace.test.ts
```

Results:
```
  NFTMarketplace
    ✓ Should create market item successfully (49ms)
    ✓ Should create market item with EVENT
    ✓ Should revert to create market item if nft is not approved
    ✓ Should create market item and buy (by address#1) successfully (48ms)
    ✓ Should revert buy if seller remove approve (49ms)
    ✓ Should revert buy if seller transfer the token out (40ms)
    ✓ Should revert to delete(de-list) with wrong params (49ms)
    ✓ Should create market item and delete(de-list) successfully (44ms)
    ✓ Should seller, buyer and market owner correct ETH value after sale (43ms)
  9 passing (1s)
```

---

### Task 4.4: Unit test for NFTMarketplace (query function)

Unit test script for query functions:

``` js
// NFTMarketplaceFetch.test.ts
import { expect } from "chai"
import { BigNumber, Signer } from "ethers"
import { ethers } from "hardhat"
import { BadgeToken, NFTMarketplace } from  "../typechain"

const _name='BadgeToken'
const _symbol='BADGE'

describe("NFTMarketplace Fetch functions", function () {
  let nft:BadgeToken
  let market:NFTMarketplace
  let account0:Signer,account1:Signer,account2:Signer
  let address0:string, address1:string, address2:string

  let listingFee:BigNumber
  const auctionPrice = ethers.utils.parseUnits('1', 'ether')

  beforeEach(async function () {
    [account0, account1, account2] = await ethers.getSigners()
    address0 = await account0.getAddress()
    address1 = await account1.getAddress()
    address2 = await account2.getAddress()

    const BadgeToken = await ethers.getContractFactory("BadgeToken")
    nft = await BadgeToken.deploy(_name,_symbol)
    // tokenAddress = nft.address

    const Market = await ethers.getContractFactory("NFTMarketplace")
    market = await Market.deploy()
    listingFee = await market.getListingFee()

    // console.log("1. == mint 1-6 to account#0")
    for(let i=1;i<=6;i++){
      await nft.mintTo(address0)
    }
    
    // console.log("3. == mint 7-9 to account#1")
    for(let i=7;i<=9;i++){
      await nft.connect(account1).mintTo(address1)
    }
  
    // console.log("2. == list 1-6 to market")
    for(let i=1;i<=6;i++){
      await nft.approve(market.address,i)
      await market.createMarketItem(nft.address, i, auctionPrice, { value: listingFee })
    }    
  })

  it("Should fetchActiveItems correctly", async function() {
    const items = await market.fetchActiveItems()
    expect(items.length).to.be.equal(6)
  })  

  it("Should fetchMyCreatedItems correctly", async function() {
    const items = await market.fetchMyCreatedItems()
    expect(items.length).to.be.equal(6)

    //should delete correctly
    await market.deleteMarketItem(1)
    const newitems = await market.fetchMyCreatedItems()
    expect(newitems.length).to.be.equal(5)
  })

  it("Should fetchMyPurchasedItems correctly", async function() {
    const items = await market.fetchMyPurchasedItems()
    expect(items.length).to.be.equal(0)
  })

  it("Should fetchActiveItems with correct return values", async function() {
    const items = await market.fetchActiveItems()

    expect(items[0].id).to.be.equal(BigNumber.from(1))
    expect(items[0].nftContract).to.be.equal(nft.address)
    expect(items[0].tokenId).to.be.equal(BigNumber.from(1))
    expect(items[0].seller).to.be.equal(address0)
    expect(items[0].buyer).to.be.equal(ethers.constants.AddressZero)
    expect(items[0].state).to.be.equal(0)//enum State.Created
  }) 

  it("Should fetchMyPurchasedItems with correct return values", async function() {
    await market.connect(account1).createMarketSale(nft.address, 1, { value: auctionPrice})
    const items = await market.connect(account1).fetchMyPurchasedItems()

    expect(items[0].id).to.be.equal(BigNumber.from(1))
    expect(items[0].nftContract).to.be.equal(nft.address)
    expect(items[0].tokenId).to.be.equal(BigNumber.from(1))
    expect(items[0].seller).to.be.equal(address0)
    expect(items[0].buyer).to.be.equal(address1)//address#1
    expect(items[0].state).to.be.equal(1)//enum State.Release

  })    

})

```

Run:
```
yarn hardhat test test/NFTMarketplaceFetch.test.ts
```

Results:
```
  NFTMarketplace Fetch functions
    ✓ Should fetchActiveItems correctly (48ms)
    ✓ Should fetchMyCreatedItems correctly (54ms)
    ✓ Should fetchMyPurchasedItems correctly
    ✓ Should fetchActiveItems with correct return values
    ✓ Should fetchMyPurchasedItems with correct return values
  5 passing (2s)
```

### Task 4.5: `playMarket.ts` helper script for developing smart contract

We write a script `src/playMarket.ts`. During the development and debug process, I run this script again and again. It helps me to see whether the market contract can work as it is designed to. 

``` js
// src/playMarket.ts
import { Signer } from "ethers"
import { ethers } from "hardhat"
import { BadgeToken, NFTMarketplace } from  "../typechain"

const base64 = require( "base-64")

const _name='BadgeToken'
const _symbol='BADGE'

async function main() {

  let account0:Signer,account1:Signer
  [account0, account1] = await ethers.getSigners()
  const address0=await account0.getAddress()
  const address1=await account1.getAddress()

 
  /* deploy the marketplace */
  const Market = await ethers.getContractFactory("NFTMarketplace")
  const market:NFTMarketplace = await Market.deploy()
  await market.deployed()
  const marketAddress = market.address
  
  /* deploy the NFT contract */
  const NFT = await ethers.getContractFactory("BadgeToken")
  const nft:BadgeToken = await NFT.deploy(_name,_symbol)
  await nft.deployed()
  const tokenAddress = nft.address
  
  console.log("marketAddress",marketAddress)
  console.log("nftContractAddress",tokenAddress)

  /* create two tokens */
  await nft.mintTo(address0) //'1'
  await nft.mintTo(address0) //'2' 
  await nft.mintTo(address0) //'3'

  const listingFee = await market.getListingFee()
  const auctionPrice = ethers.utils.parseUnits('1', 'ether')

  await nft.approve(marketAddress,1)
  await nft.approve(marketAddress,2)
  await nft.approve(marketAddress,3)
  console.log("Approve marketAddress",marketAddress)

  // /* put both tokens for sale */
  await market.createMarketItem(tokenAddress, 1, auctionPrice, { value: listingFee })
  await market.createMarketItem(tokenAddress, 2, auctionPrice, { value: listingFee })
  await market.createMarketItem(tokenAddress, 3, auctionPrice, { value: listingFee })

  // test transfer
  await nft.transferFrom(address0,address1,2)

  /* execute sale of token to another user */
  await market.connect(account1).createMarketSale(tokenAddress, 1, { value: auctionPrice})

  /* query for and return the unsold items */
  console.log("==after purchase & Transfer==")

  let items = await market.fetchActiveItems()
  let printitems
  printitems = await parseItems(items,nft)
  printitems.map((item)=>{printHelper(item,true,false)})
  // console.log( await parseItems(items,nft))

  console.log("==after delete==")
  await market.deleteMarketItem(3)

  items = await market.fetchActiveItems()
  printitems = await parseItems(items,nft)
  printitems.map((item)=>{printHelper(item,true,false)})
  // console.log( await parseItems(items,nft))

  console.log("==my list items==")
  items = await market.fetchMyCreatedItems()
  printitems = await parseItems(items,nft)
  printitems.map((item)=>{printHelper(item,true,false)})

  console.log("")
  console.log("==address1 purchased item (only one, tokenId =1)==")
  items = await market.connect(account1).fetchMyPurchasedItems()
  printitems = await parseItems(items,nft)
  printitems.map((item)=>{printHelper(item,true,true)})

}

async function parseItems(items:any,nft:BadgeToken) {
  let parsed=  await Promise.all(items.map(async (item:any) => {
    const tokenUri = await nft.tokenURI(item.tokenId)
    return {
      price: item.price.toString(),
      tokenId: item.tokenId.toString(),
      seller: item.seller,
      buyer: item.buyer,
      tokenUri
    }
  }))

  return parsed
}

function printHelper(item:any,flagUri=false,flagSVG=false){
  if(flagUri){
    const {name,description,svg}= parseNFT(item)
    console.log("id & name:",item.tokenId,name)
    if(flagSVG) console.log(svg)
  }else{
    console.log("id       :",item.tokenId)
  }
}

function parseNFT(item:any){
  const data = base64.decode(item.tokenUri.slice(29))
  const itemInfo = JSON.parse(data)
  const svg = base64.decode(itemInfo.image.slice(26))
  return(
    {"name":itemInfo.name,
     "description":itemInfo.description,
     "svg":svg})  
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

```

What we do in this script:

- deploy BadgeToken NFT and NFTMarketplace
- mint 3 NFT items to address0
- approve 3 NFT items to the market contract
- list 3 NFT items to NFTMarketplace
- transfer Badge #3 to other
- the listed items should be #1,#2
- address1(account1) buy Badge #1
- address1 purchased item should be #1
- print tokenId, name, svg for inspection

Run:
```
yarn hardhat run src/playMarket.ts
```
Result:
```
marketAddress 0x5FbDB2315678afecb367f032d93F642f64180aa3
nftContractAddress 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Approve marketAddress 0x5FbDB2315678afecb367f032d93F642f64180aa3
==after purchase & Transfer==
id & name: 3 Badge #3
==after delete==
==my list items==
id & name: 1 Badge #1
id & name: 2 Badge #2

==address1 purchased item svg (only one, tokenId =1)==
id & name: 1 Badge #1
<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'><style>.base { fill: white; font-family: serif; font-size: 300px; }</style><rect width='100%' height='100%' fill='brown' /><text x='100' y='260' class='base'>1</text></svg>
✨  Done in 4.42s.
```

### Task 4.6: Scripts to prepare for webapp

We need to prepare data for the webapp:

- 1-6 by Account#0, 1- Account1, 2- Account#2
- 7-9 by Account#1, 7,8 - Account#0
- In market: 3,4,5,9 (6 delist by Account#0)
- Account#0:Buy 7,8, List:1-5( 6 delisted)
- Account#1:Buy 1, List:7-9
- Account#2:Buy 2, List:n/a

``` js
// src/prepare.ts
import { Signer } from "ethers"
import { ethers } from "hardhat"
import { BadgeToken, NFTMarketplace } from  "../typechain"
import { tokenAddress, marketAddress } from "./projectsetting"

const _name='BadgeToken'
const _symbol='BADGE'

async function main() {

  console.log("========   deploy to a **new** localhost ======")

  /* deploy the NFT contract */
  const NFT = await ethers.getContractFactory("BadgeToken")
  const nftContract:BadgeToken = await NFT.deploy(_name,_symbol)
  await nftContract.deployed()

  /* deploy the marketplace */
  const Market = await ethers.getContractFactory("NFTMarketplace")
  const marketContract:NFTMarketplace = await Market.deploy()
  
  console.log("nftContractAddress:",nftContract.address)
  console.log("marketAddress     :",marketContract.address)

  console.log("========   Prepare for webapp dev ======")
  console.log("nftContractAddress:",tokenAddress)
  console.log("marketAddress     :",marketAddress)
  console.log("**should be the same**")

  let owner:Signer,account1:Signer,account2:Signer
  
  [owner, account1,account2] = await ethers.getSigners()
  const address0 = await owner.getAddress()
  const address1 = await account1.getAddress()
  const address2 = await account2.getAddress()

  const market:NFTMarketplace = await ethers.getContractAt("NFTMarketplace", marketAddress)
  const nft:BadgeToken = await ethers.getContractAt("BadgeToken", tokenAddress)

  const listingFee = await market.getListingFee()
  const auctionPrice = ethers.utils.parseUnits('1', 'ether')

  console.log("1. == mint 1-6 to account#0")
  for(let i=1;i<=6;i++){
    await nft.mintTo(address0)
  }

  console.log("2. == list 1-6 to market")
  for(let i=1;i<=6;i++){
    await nft.approve(marketAddress,i)
    await market.createMarketItem(tokenAddress, i, auctionPrice, { value: listingFee })
  }

  console.log("3. == mint 7-9 to account#1")
  for(let i=7;i<=9;i++){
    await nft.connect(account1).mintTo(address1)
  }

  console.log("4. == list 1-6 to market")
  for(let i=7;i<=9;i++){
    await nft.connect(account1).approve(marketAddress,i)
    await market.connect(account1).createMarketItem(tokenAddress, i, auctionPrice, { value: listingFee })
  }

  console.log("5. == account#0 buy 7 & 8")
  await market.createMarketSale(tokenAddress, 7, { value: auctionPrice})
  await market.createMarketSale(tokenAddress, 8, { value: auctionPrice})

  console.log("6. == account#1 buy 1")
  await market.connect(account1).createMarketSale(tokenAddress, 1, { value: auctionPrice})

  console.log("7. == account#2 buy 2")
  await market.connect(account2).createMarketSale(tokenAddress, 2, { value: auctionPrice})

  console.log("8. == account#0 delete 6")
  await market.deleteMarketItem(6)

}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

```

Run a stand-alone local testnet in another terminal:
```
yarn hardhat node
```

Run:
```
yarn hardhat run src/prepare.ts --network localhost
```

Results:
```
========   deploy to a **new** localhost ======
nftContractAddress: 0x5FbDB2315678afecb367f032d93F642f64180aa3
marketAddress     : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
========   Prepare for webapp dev ======
nftContractAddress: 0x5FbDB2315678afecb367f032d93F642f64180aa3
marketAddress     : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
**should be the same**
1. == mint 1-6 to account#0
2. == list 1-6 to market
3. == mint 7-9 to account#1
4. == list 1-6 to market
5. == account#0 buy 7 & 8
6. == account#1 buy 1
7. == account#2 buy 2
8. == account#0 delete 6
✨  Done in 5.81s.
```
