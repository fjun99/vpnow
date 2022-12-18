# Optional Task 6: Deploy to Polygon and query using Alchemy NFT API


![Task 1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8wcepjjin74cyva3ld0t.png)

[[toc]]

## Optional Task 6: Deploy to Polygon and query using Alchemy NFT API <a name="task6"></a>

### Task 6.1 Deploy to Polygon

In this optional task, I will deploy the NFT contract and the NFTMarketplace contract to Polygon mainnet as the gas fee is ok. You can also choose to deploy to Ethereum testnet(Goerli), Polygon testnet(Mumbai) or Layer 2 testnet(such as Arbitrum Goerli).

STEP 1. Edit `.env` with Alchemy URL with key, your private key for testing, Polygonscan API key. You may need to add polygon in your `hardhat.config.ts`

```
POLYGONSCAN_API_KEY=ABC123ABC123ABC123ABC123ABC123ABC1
POLYGON_URL=https://polygon-mainnet.g.alchemy.com/v2/<YOUR ALCHEMY KEY>
POLYGON_PRIVATE_KEY=0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1
```

STEP 2. Deploy the NFT contract and verify on [polygonscan.com](polygonscan.com). Run:

```bash
yarn hardhat run scripts/deploy_BadgeToken.ts --network polygon
// BadgeToken deployed to: 0x1FC8b9DC757FD50Bfec8bbE103256F176435faEE

yarn hardhat verify --network polygon 0x1FC8b9DC757FD50Bfec8bbE103256F176435faEE 'BadgeToken' 'BADGE'
// Successfully verified contract BadgeToken on Etherscan.
// https://polygonscan.com/address/0x1FC8b9DC757FD50Bfec8bbE103256F176435faEE#code
```

STEP 3. Deploy the NFTMarketplace and verify

```bash
yarn hardhat run scripts/deploy_Marketplace.ts --network polygon
// NFTMarketplace deployed to: 0x2B7302B1ABCD30Cd475d78688312529027d57bEf

yarn hardhat verify --network polygon 0x2B7302B1ABCD30Cd475d78688312529027d57bEf
// Successfully verified contract NFTMarketplace on Etherscan.
// https://polygonscan.com/address/0x2B7302B1ABCD30Cd475d78688312529027d57bEf#code
```

---

### Task 6.2 Mint NFT and list on marketplace

STEP 4. Mint one NFT (tokenId=1) to your testing account on https://polygonscan.com/

You can view the NFT "Badge #1" on opensea:  https://opensea.io/assets/matic/0x1fc8b9dc757fd50bfec8bbe103256f176435faee/1

STEP 5. List your NFT item "Badge #1" to NFTMarketpalce contract on https://polygonscan.com/

First you need to approve the NFT item "Badge #1" to the NFTMarketpalce.

Then you call `CreateMarketItem()`.

STEP 6. Run the webapp. After connecting the wallet, you can see the item in the market.

Note: remember to edit the NFT contract and NFTMarketpalce contract address in `webapp/src/projectsetting.ts`.


![deploy and mint](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6ml1wbztdwkjl7lz71t5.png)

---

### Task 6.3 Query NFT using Alchemy NFT APIs <a name="alchemynft"></a>

Now, we can switch to using Alchemy NFT APIs([docs link](https://docs.alchemy.com/reference/nft-api-quickstart)) to query NFT data and display it in our webapp.

Let's try it. We will use `Alchemy SDK` here for demonstration.

```bash
yarn add alchemy-sdk
```

The code snippet is adapted from Alchemy NFT APIs docs([link](https://docs.alchemy.com/reference/nft-api-quickstart#demo-script)). You will need an Alchemy API Key to run it.

```js
// This script demonstrates access to the NFT API via the Alchemy SDK.
import { Network, Alchemy } from "alchemy-sdk";
import  base64  from  "base-64"

const settings = {
    apiKey: "Your Alchemy API Key",
    network: Network.MATIC_MAINNET,
};

const alchemy = new Alchemy(settings);

const addressNFTContract = "0x1FC8b9DC757FD50Bfec8bbE103256F176435faEE"
const owner = await alchemy.nft.getOwnersForNft(addressNFTContract, "1")

console.log("Badge #1 owner:", owner )

// Print NFT metadata returned in the response:
const metadata = await alchemy.nft.getNftMetadata(
    addressNFTContract,
    "1"
  )

console.log("tokenURI:", metadata.tokenUri)
const media = metadata.media[0].raw
console.log("media:", media)

const svg = base64.decode(media.slice(26))
console.log(svg)
```

Results:
```
Badge #1 owner: { owners: [ '0x08e2af90ff53a3d3952eaa881bf9b3c05e893462' ] }
tokenURI: {
  raw: 'data:application/json;base64,eyJuYW...',
  gateway: ''
}
media: data:image/svg+xml;base64,PHN2...

<svg xmlns='http://www.w3.org/2000/svg' 
preserveAspectRatio='xMinYMin meet' 
viewBox='0 0 350 350'>
<style>.base { fill: white; font-family: serif; font-size: 300px; }</style>
<rect width='100%' height='100%' fill='brown' />
<text x='100' y='260' class='base'>1</text>
</svg>
```

---


That is it. We have developed a super simplified version of Opensea including contract and webapp. There is a lot of work to be done. Take one for example:

- Your first version of NFTMarketpalce works well. Several weeks later, you find that you need to add new functionality to NFTMarketplace. 

- A smart contract is immutable. Deploying a new version of NFTMarketplace and asking users to list their NFT to the new contract is not a good idea. 

- Now you need upgradeable smart contract (proxy contract pattern). You can learn how to develop proxy contract in my another tutorial: [Tutorial: write upgradeable smart contract (proxy) using OpenZeppelin](https://dev.to/yakult/tutorial-write-upgradeable-smart-contract-proxy-contract-with-openzeppelin-1916).

---

### More Tutorial List

- 1. A Concise Hardhat Tutorial(3 parts) 
https://dev.to/yakult/a-concise-hardhat-tutorial-part-1-7eo

- 2. Understanding Blockchain with `Ethers.js`(5 parts)
https://dev.to/yakult/01-understanding-blockchain-with-ethersjs-4-tasks-of-basics-and-transfer-5d17

- 3. Tutorial : build your first DAPP with Remix and Etherscan (7 Tasks)
https://dev.to/yakult/tutorial-build-your-first-dapp-with-remix-and-etherscan-52kf

- 4. Tutorial: build DApp with Hardhat, React and Ethers.js (6 Tasks)
https://dev.to/yakult/a-tutorial-build-dapp-with-hardhat-react-and-ethersjs-1gmi

- 5. Tutorial: build DAPP with Web3-React and SWR(5 Tasks)
https://dev.to/yakult/tutorial-build-dapp-with-web3-react-and-swr-1fb0

- 6. Tutorial: write upgradeable smart contract (proxy) using OpenZeppelin(7 Tasks)
https://dev.to/yakult/tutorial-write-upgradeable-smart-contract-proxy-contract-with-openzeppelin-1916

- 7. Tutorial: Build an NFT marketplace DApp like Opensea(5 Tasks)
https://dev.to/yakult/tutorial-build-a-nft-marketplace-dapp-like-opensea-3ng9

---

If you find this tutorial helpful, follow me at Twitter [@fjun99](https://twitter.com/fjun99)