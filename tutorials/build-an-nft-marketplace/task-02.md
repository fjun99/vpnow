# Task 2: NFT collection smart contract

![task 2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m9mjevootlegapc7p20a.png)

[[toc]] 
 
## Task 2: NFT collection smart contract<a name="task2"></a>

### Task 2.1: write an NFT smart contract

We write an NFT ERC721 smart contract inheriting OpenZeppelin's ERC721 implementation. We add three functionalities here:

- tokenId: auto increment tokenId starting from 1
- function `mintTo(address _to)`: everyone can call it to mint an NFT
- function `tokenURI()` to implement token URI and on-chain SVG images

``` js
// contracts/BadgeToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract BadgeToken is ERC721 {
    uint256 private _currentTokenId = 0; //tokenId will start from 1

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        
    }

    /**
     * @dev Mints a token to an address with a tokenURI.
     * @param _to address of the future owner of the token
     */
    function mintTo(address _to) public {
        uint256 newTokenId = _getNextTokenId();
        _mint(_to, newTokenId);
        _incrementTokenId();
    }

    /**
     * @dev calculates the next token ID based on value of _currentTokenId
     * @return uint256 for the next token ID
     */
    function _getNextTokenId() private view returns (uint256) {
        return _currentTokenId+1;
    }

    /**
     * @dev increments the value of _currentTokenId
     */
    function _incrementTokenId() private {
        _currentTokenId++;
    }

    /**
     * @dev return tokenURI, image SVG data in it.
     */
    function tokenURI(uint256 tokenId) override public pure returns (string memory) {
        string[3] memory parts;

        parts[0] = "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'><style>.base { fill: white; font-family: serif; font-size: 300px; }</style><rect width='100%' height='100%' fill='brown' /><text x='100' y='260' class='base'>";

        parts[1] = Strings.toString(tokenId);

        parts[2] = "</text></svg>";

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            "{\"name\":\"Badge #", 
            Strings.toString(tokenId), 
            "\",\"description\":\"Badge NFT with on-chain SVG image.\",",
            "\"image\": \"data:image/svg+xml;base64,", 
            // Base64.encode(bytes(output)), 
            Base64.encode(bytes(abi.encodePacked(parts[0], parts[1], parts[2]))),     
            "\"}"
            ))));
            
        return string(abi.encodePacked("data:application/json;base64,", json));
    }    
}

```

We also add a deploy script `scripts/deploy_BadgeToken.ts` which will deploy this NFT contract with name:`BadgeToken` and symbol:`BADGE`:

``` js
  const token = await BadgeToken.deploy('BadgeToken','BADGE')
```

### Task 2.2: Understand tokenURI()

Let's explain the implementation of ERC721 function `tokenURI()`  .

`tokenURI()` is a metadata function for ERC721 standard. OpenZeppelin docs :

> tokenURI(uint256 tokenId) → string
> Returns the Uniform Resource Identifier (URI) for tokenId token.

Usually `tokenURI()` returns a URI. You can get the resulting URI for each token by concatenating the baseURI and the tokenId.

In our `tokenURI()`, we return URI as an object with base64 encoded instead: 

First we construct the object. The svg image in the object is also base64 encoded.

``` json
{
"name":"Badge #1",
"description":"Badge NFT with on-chain SVG image."
"image":"data:image/svg+xml;base64,[svg base64 encoded]"
}
```

Then we return the object base64 encoded.
```
data:application/json;base64,(object base64 encoded)
```

Webapp can get URI by calling `tokenURI(tokenId)`, and decode it to get the name, description and SVG image.

The SVG image is adapted from the LOOT project. It is very simple. It displays the tokenId in the image.

``` html
<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'>
<style>.base { fill: white; font-family: serif; font-size: 300px; }</style>
<rect width='100%' height='100%' fill='brown' />
    <text x='100' y='260' class='base'>
    1
    </text>
</svg>
```

### Task 2.3: Unit test for ERC721 contract

Let's write an unit test script for this contract:

``` ts
// test/BadgeToken.test.ts
import { expect } from "chai"
import { Signer } from "ethers"
import { ethers } from "hardhat"
import { BadgeToken } from  "../typechain"

const base64 = require( "base-64")

const _name='BadgeToken'
const _symbol='BADGE'

describe("BadgeToken", function () {
  let badge:BadgeToken
  let account0:Signer,account1:Signer
  
  beforeEach(async function () {
    [account0, account1] = await ethers.getSigners()
    const BadgeToken = await ethers.getContractFactory("BadgeToken")
    badge = await BadgeToken.deploy(_name,_symbol)
  })

  it("Should have the correct name and symbol ", async function () {
    expect(await badge.name()).to.equal(_name)
    expect(await badge.symbol()).to.equal(_symbol)
  })

  it("Should tokenId start from 1 and auto increment", async function () {
    const address1=await account1.getAddress()
    await badge.mintTo(address1)
    expect(await badge.ownerOf(1)).to.equal(address1)

    await badge.mintTo(address1)
    expect(await badge.ownerOf(2)).to.equal(address1)
    expect(await badge.balanceOf(address1)).to.equal(2)
  })

  it("Should mint a token with event", async function () {
    const address1=await account1.getAddress()
    await expect(badge.mintTo(address1))
      .to.emit(badge, 'Transfer')
      .withArgs(ethers.constants.AddressZero,address1, 1)
  })

  it("Should mint a token with desired tokenURI (log result for inspection)", async function () {
    const address1=await account1.getAddress()
    await badge.mintTo(address1)

    const tokenUri = await badge.tokenURI(1)
    // console.log("tokenURI:")
    // console.log(tokenUri)

    const tokenId = 1
    const data = base64.decode(tokenUri.slice(29))
    const itemInfo = JSON.parse(data)
    expect(itemInfo.name).to.be.equal('Badge #'+String(tokenId))
    expect(itemInfo.description).to.be.equal('Badge NFT with on-chain SVG image.')

    const svg = base64.decode(itemInfo.image.slice(26))
    const idInSVG = svg.slice(256,-13)
    expect(idInSVG).to.be.equal(String(tokenId))
    // console.log("SVG image:")
    // console.log(svg)
  })  

  it("Should mint 10 token with desired tokenURI", async function () {
    const address1=await account1.getAddress()
 
    for(let i=1;i<=10;i++){
      await badge.mintTo(address1)
      const tokenUri = await badge.tokenURI(i)

      const data = base64.decode(tokenUri.slice(29))
      const itemInfo = JSON.parse(data)
      expect(itemInfo.name).to.be.equal('Badge #'+String(i))
      expect(itemInfo.description).to.be.equal('Badge NFT with on-chain SVG image.')

      const svg = base64.decode(itemInfo.image.slice(26))
      const idInSVG = svg.slice(256,-13)
      expect(idInSVG).to.be.equal(String(i))
    }

    expect(await badge.balanceOf(address1)).to.equal(10)
  })  
})
```

Run the unit test:
```
yarn hardhat test test/BadgeToken.test.ts
```

Results:
```
  BadgeToken
    ✓ Should have the correct name and symbol
    ✓ Should tokenId start from 1 and auto increment
    ✓ Should mint a token with event
    ✓ Should mint a token with desired tokenURI (log result for inspection) (62ms)
    ✓ Should mint 10 token with desired tokenURI (346ms)
  5 passing (1s)
```

We can also print the tokenURI we get in the unit test for inspection:
```
tokenURI:
data:application/json;base64,eyJuYW1lIjoiQmFkZ2UgIzEiLCJkZXNjcmlwdGlvbiI6IkJhZGdlIE5GVCB3aXRoIG9uLWNoYWluIFNWRyBpbWFnZS4iLCJpbWFnZSI6ICJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBITjJaeUI0Yld4dWN6MG5hSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY25JSEJ5WlhObGNuWmxRWE53WldOMFVtRjBhVzg5SjNoTmFXNVpUV2x1SUcxbFpYUW5JSFpwWlhkQ2IzZzlKekFnTUNBek5UQWdNelV3Sno0OGMzUjViR1UrTG1KaGMyVWdleUJtYVd4c09pQjNhR2wwWlRzZ1ptOXVkQzFtWVcxcGJIazZJSE5sY21sbU95Qm1iMjUwTFhOcGVtVTZJRE13TUhCNE95QjlQQzl6ZEhsc1pUNDhjbVZqZENCM2FXUjBhRDBuTVRBd0pTY2dhR1ZwWjJoMFBTY3hNREFsSnlCbWFXeHNQU2RpY205M2JpY2dMejQ4ZEdWNGRDQjRQU2N4TURBbklIazlKekkyTUNjZ1kyeGhjM005SjJKaGMyVW5QakU4TDNSbGVIUStQQzl6ZG1jKyJ9
SVG image:
<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'><style>.base { fill: white; font-family: serif; font-size: 300px; }</style><rect width='100%' height='100%' fill='brown' /><text x='100' y='260' class='base'>1</text></svg>
```
