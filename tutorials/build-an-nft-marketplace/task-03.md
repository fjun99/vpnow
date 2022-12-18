# Task 3: A web page to display NFT item

![task 3](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3pbg2k1mzrmd6rrty4nd.png)
 
[[toc]]

## Task 3: A web page to display NFT item<a name="task3"></a>

### Task 3.1: Setup webapp project using `Web3-React` & `Chakra UI`

We will use web3 connecting framework `Web3-React` to get our job done. The web app stack is:

- React
- Next.js
- Chakra UI
- Web3-React
- Ethers.js
- SWR

The `_app.tsx` is:
``` js
// src/pages/_app.tsx
import { ChakraProvider } from '@chakra-ui/react'
import type { AppProps } from 'next/app'
import { Layout } from 'components/layout'
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider)
  return library
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ChakraProvider>
        <Layout>
        <Component {...pageProps} />
        </Layout>
      </ChakraProvider>
    </Web3ReactProvider>
  )
}

export default MyApp

```

We will use the `ConnectMetamask` component in our previous tutorial: Tutorial: build DApp with Web3-React and SWR[Tutorial: build DApp with Web3-React and SWR](https://dev.to/yakult/tutorial-build-dapp-with-web3-react-and-swr-1fb0). 

### Task 3.2: Write a component to display NFT time

In this component, we also use `SWR` as we do in the previous tutorial. The `SWR` fetcher is in `utils/fetcher.tsx`.

``` js
// components/CardERC721.tsx
import React, { useEffect,useState } from 'react';
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { Box, Text} from '@chakra-ui/react'
import useSWR from 'swr'
import { ERC721ABI as abi} from "abi/ERC721ABI"
import { BigNumber } from 'ethers'
import { fetcher } from 'utils/fetcher'
const base64 = require( "base-64")

interface Props {
    addressContract: string,
    tokenId:BigNumber
}

interface ItemInfo{
  name:string,
  description:string,
  svg:string
}

export default function CardERC721(props:Props){
  const addressContract = props.addressContract
  const {  account, active, library } = useWeb3React<Web3Provider>()

  const [itemInfo, setItemInfo] = useState<ItemInfo>()

  const { data: nftURI } = useSWR([addressContract, 'tokenURI', props.tokenId], {
    fetcher: fetcher(library, abi),
  })

useEffect( () => {
  if(!nftURI) return

  const data = base64.decode(nftURI.slice(29))
  const itemInfo = JSON.parse(data)
  const svg = base64.decode(itemInfo.image.slice(26))
  setItemInfo({
    "name":itemInfo.name,
    "description":itemInfo.description,
    "svg":svg})

},[nftURI])

return (
  <Box my={2} bg='gray.100' borderRadius='md' width={220} height={260} px={3} py={4}>
  {itemInfo
  ?<Box>
    <img src={`data:image/svg+xml;utf8,${itemInfo.svg}`} alt={itemInfo.name} width= '200px' />
    <Text fontSize='xl' px={2} py={2}>{itemInfo.name}</Text>
  </Box>
  :<Box />
  }
  </Box>
)
}
```

Some explanations:

- When connected to MetaMask wallet, this component queries tokenURI(tokenId) to get name, description and svg image of the NFT item.

Let's write a page to display NFT item.

``` js
// src/pages/samplenft.tsx
import type { NextPage } from 'next'
import Head from 'next/head'
import { VStack, Heading } from "@chakra-ui/layout"
import ConnectMetamask from 'components/ConnectMetamask'
import CardERC721 from 'components/CardERC721'
import { BigNumber } from 'ethers'

const nftAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3'
const tokenId = BigNumber.from(1)
const SampleNFTPage: NextPage = () => {

  return (
    <>
      <Head>
        <title>My DAPP</title>
      </Head>

      <Heading as="h3"  my={4}>NFT Marketplace</Heading>

      <ConnectMetamask />

      <VStack>
          <CardERC721 addressContract={nftAddress} tokenId={tokenId} ></CardERC721>
      </VStack>
    </>
  )
}

export default SampleNFTPage
```

### Task 3.3: Run the webapp project

STEP 1: Run a stand-alone local testnet

In another terminal, run in `chain/` directory:
```
yarn hardhat node
```

STEP 2: Deploy BadgeToken (ERC721) to local testnet
```
yarn hardhat run scripts/deploy_BadgeToken.ts --network localhost
```

Result:
```
Deploying BadgeToken ERC721 token...
BadgeToken deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

STEP 3: Mint a BadgeToken (tokenId = 1) in hardhat console

Run hardhat console connect to local testenet
```
yarn hardhat console --network localhost
```

In console:
``` js
nftaddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
nft = await ethers.getContractAt("BadgeToken", nftaddress)

await nft.name()
//'BadgeToken'

await nft.mintTo('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')
// tx response ...

await nft.tokenURI(1)
//'data:application/json;base64,eyJuYW1lIjoiQmFkZ2UgIzEiLCJk...'
```

Now we have the NFT item. We will display it on the web page.

STEP 3: prepare your MetaMask

Make sure your MetaMask has the local testnet wich RPC URL `http://localhost:8545` and  chain id `31337`. 

STEP 4: run webapp

In `webapp/`, run:
```
yarn dev
```

In chrome browser, goto page: `http://localhost:3000/samplenft`.

Connect MetaMask, the NFT item will be displayed on the page. (Please note that the image is lazy loading. Wait for loading to be completed.

![nft item](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mni1krtarity4syi9ya0.png)
 

We can see that the NFT "Badge #1" with tokenId `1` is displayed correctly.
