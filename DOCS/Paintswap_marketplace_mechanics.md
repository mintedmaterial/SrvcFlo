# Marketplace Mechanics

## Listings for Sale and Offers

### Listing Mechanics

* The seller can choose to put the NFT in a custodial vault (which they own) acting as escrow, temporarily holding the NFT. This is the preferred option in many cases. See [NFT Vaults](../nft-vaults) for details.
* Alternatively, the user can keep holding the NFT on their wallet.
* Buying for the requested price does not require approval
* For non-custodial listings, the NFT could be transferred away, or token approval removed. In this case, the listing is temporarily invalidated, but could become valid again (see next section)
* Listings can be cancelled at any point
* The price of a listing can be changed at any point. However, purchases are protected against front-running by ensuring the value paid is never more than the buyer agreed to initially.

### Offer Mechanics

* **Offers can be done on listings or on assets**. Listing offers are particularly useful for fNFTs and custodial listings in general (see [NFT Vaults](../nft-vaults) for details on that) to ensure the underlying assets are not changed before the offer is accepted.
* Offers are in $wS which stays in your wallet, and the seller can optionally accept it
* Not having enough $wS invalidates an offer. Similarly, removing the $wS approval from the marketplace contract will also temporarily invalidate an offer, but it could become valid again (see next section)
* Offers can only be increased in value
* Offers can be cancelled
* Offers can have a time limit, after which point they are no longer valid

### Validity of Listings and Offers

It is possible to see invalid listings and offers by selecting _Invalidated_ on filters.

{% hint style="warning" %}
**Offer Validity**

It is important to be aware of the concept of validity of an offer. As mentioned above, a lower than necessary $wS balance (or not enough approved $wS) will invalidate an offer. However, that is **not permanent**. That is, if the balance is restored or re-approved, the **offer becomes valid again** and could be accepted. Make sure to cancel any offers you no longer want to be active.
{% endhint %}

{% hint style="warning" %}
**Listing Validity**

Similarly to offers and as mentioned above, a **non-custodial** (i.e. not using a vault) listing can become invalid if the token approval is removed or the NFT is transferred. However, this is **not permanent**. That is, if the token is re-approved or the account receives the NFT again, the **listing becomes valid again**. Make sure to cancel any listings you no longer want to be active.
{% endhint %}

### Special Offers

Offers can be made on any and all assets whether they are listed for sale or not. This can be done via the asset page of each NFT. Moreover, some special offer types exist:

#### Collection Offer

An offer is made such that anyone with an NFT from that collection can accept it for their NFT. This can be useful if you're trying to trade the floor, but can have other uses.

#### Filtered Collection Offer

This is similar to trait filtered collection offers on other marketplaces, but more flexible. Any NFTs in a collection can form a filtered collection offer, and the offer stands as "i want **one** of any of these NFTs". There are some gas optimization techniques that need attention as it can affect editing later:

* Expiry time is shared on all NFTs, so editing any of these will change all others as well.
* When creating them, if they all share the same price they will continue to share the same price when editing as well (a single offer is stored to lower required gas).
* If different prices are used for different NFTs within the same collection, then they will be separate and editing will affect only the specific NFT.
* If more than one collection is used, multiple filtered collection offers will be created.

## Auctions

* Automatically ends and prevents new bids
* The sale must be triggered (by anyone) to complete after the auction is finished. A script is run by Paintswap every hour
* Bids are escrowed by the marketplace contract
* 1% bidding increment minimum
* Auctions can be cancelled in two cases:
  * Within their grace period (see below, depends on type of auction)
  * At any point, if there are no bids
* The reserve price of an auction can be changed if there are no bids

There are two types of auctions on Paintswap

* Flash auctions - minimum auction time 5 mins. Can be cancelled in the first 90 seconds.
* Normal auction - minimum auction time 30 mins. Can be cancelled in the first 10 minutes.

In addition, sellers can enable anti-snipe, which sets remaining time back to X minutes if a bid is made with less than X minutes remaining on the auction. X is 3 minutes for normal auctions and 90 seconds for flash auctions.

## Wrapped Sonic ($wS)

On the NFT marketplace all offers and sales are made in $wS. Required native $S is automatically converted via the contracts when making offers and bids. $wS is then auto converted back to native $S to the seller when the sale is completed.


# Paintswap Contracts

# Contracts

## **Token**

* **BRUSH:** [0xe51ee9868c1f0d6cd968a8b8c8376dc2991bfe44](https://sonicscan.org/token/0xe51ee9868c1f0d6cd968a8b8c8376dc2991bfe44)

## **LP addresses**

* **Shadow BRUSH/S:** [0xb8bda81eccb1a21198899ac8f1f2f73c82bd7695](https://sonicscan.org/address/0xb8bda81eccb1a21198899ac8f1f2f73c82bd7695)
* **Equalizer BRUSH/WS:** [0x38cFA6cB37d074B6E954C52d10a4cf0e4268607b](https://sonicscan.org/address/0x38cFA6cB37d074B6E954C52d10a4cf0e4268607b)
* **Beets BRUSH/scUSD:** [0xc5ab8d98f959453e416b2f15848a02cc99bc695e](https://sonicscan.org/address/0xc5ab8d98f959453e416b2f15848a02cc99bc695e)

## Sonic NFT Marketplace:

* **ExistingNFTContractPayment** : [0x75e9b169ea55d07be503e71da8b5ae66056bea8a](https://sonicscan.org/address/0x75e9b169ea55d07be503e71da8b5ae66056bea8a)&#x20;
* **PaintswapLibrary** : [0xe0cb467a1a46d29682332e0ba8099aee26dee620](https://sonicscan.org/address/0xe0cb467a1a46d29682332e0ba8099aee26dee620)
* **MarketplaceWhitelist** : [0xc1dd8640b3acbc34a228f632ef9bea39dcc7b0ce](https://sonicscan.org/address/0xc1dd8640b3acbc34a228f632ef9bea39dcc7b0ce)&#x20;
* **FeePercentage** : [0x32b38b299fe1c67e8f2196cb34eb43be0ddfbf37](https://sonicscan.org/address/0x32b38b299fe1c67e8f2196cb34eb43be0ddfbf37)&#x20;
* **CollectionRoyalties** : [0xd9d0f181252d9c2a103be3af0d8f86afedb89561](https://sonicscan.org/address/0xd9d0f181252d9c2a103be3af0d8f86afedb89561)&#x20;
* **NFTVault beacon** : [0x09c271b80d35693f1e969c1b1ed0aa2b8176c723](https://sonicscan.org/address/0x09c271b80d35693f1e969c1b1ed0aa2b8176c723)&#x20;
* **NFTVaultRegistry** : [0x63b5e3871d7df6813660360035a21204554be8e0](https://sonicscan.org/address/0x63b5e3871d7df6813660360035a21204554be8e0)&#x20;
* **NFTVaultFactory** : [0x711c1e2a7aeeafa08b63fda68fb4d76b371efe0a](https://sonicscan.org/address/0x711c1e2a7aeeafa08b63fda68fb4d76b371efe0a)&#x20;
* **PaintswapMarketplace** : [0x0c558365eeff4b057fdbed91bc3650e1a00018b4](https://sonicscan.org/address/0x0c558365eeff4b057fdbed91bc3650e1a00018b4)&#x20;
* **CompleteSalesHelper** : [0xCE00C3E03722c99cBf1519946ba31B4A24A7D52e](https://sonicscan.org/address/0xCE00C3E03722c99cBf1519946ba31B4A24A7D52e)&#x20;
* **PaintswapUserNFT beacon** : [0x327b016094C853751e8354F037239eCd5b4cEEd9](https://sonicscan.org/address/0x327b016094C853751e8354F037239eCd5b4cEEd9)&#x20;
* **PaintswapUserNFTERC2981 beacon** : [0xB0679BA295fDBB3d084a7d76fd4d21FA60Ce5b05](https://sonicscan.org/address/0xB0679BA295fDBB3d084a7d76fd4d21FA60Ce5b05)&#x20;
* **PaintswapContractFactory** : [0xEcfCD5D06715B530a431367d0D411827d60Eed97](https://sonicscan.org/address/0xEcfCD5D06715B530a431367d0D411827d60Eed97)
* **RoyaltySplitter** : [0xb20842fe0fb339fa2f57da490e7acd6ab89fa7c5](https://sonicscan.org/address/0xb20842fe0fb339fa2f57da490e7acd6ab89fa7c5)
* **Beardies** : [0xF20bd8B3A20a6d9884121d7a6e37a95a810183E2](https://sonicscan.org/address/0xF20bd8B3A20a6d9884121d7a6e37a95a810183E2)&#x20;
* **ColorfulCoal** : [0xa852dD704D8C91BFbBa450d23D7813a935008421](https://sonicscan.org/address/0xa852dD704D8C91BFbBa450d23D7813a935008421)
* **BeardiesFeeClaiming** : [0xa2be7A4dE66B3f319Ab6E90fDB4aaF1C3A32e51b](https://sonicscan.org/address/0xa2be7A4dE66B3f319Ab6E90fDB4aaF1C3A32e51b)
* **ColorfulCoalFeeClaiming** : [0xd4A60BE89C79c042E6DAa2a68b7a0AfC240E8e66](https://sonicscan.org/address/0xd4A60BE89C79c042E6DAa2a68b7a0AfC240E8e66)
* **FeeSplitter** : [0x7c22aa14C76E461e11eAE56Dd69cB61B8E0e2DAc](https://sonicscan.org/address/0x7c22aa14C76E461e11eAE56Dd69cB61B8E0e2DAc)

## NFT Launchpad:

* **Registry Address :** [0x19604b5249ef54a37739a12f90ad06d143d06ab3](https://sonicscan.org/address/0x19604b5249ef54a37739a12f90ad06d143d06ab3)
*
  **NFT Factory Address :** [0xf4d3e689cb1cc71c635fe0e56f5377c343ec3796](https://sonicscan.org/address/0xf4d3e689cb1cc71c635fe0e56f5377c343ec3796)
*
  **Launchpad Address :** [0x088e5d8fddee0d4fcdda68cfc1a578d1d8aa37e9](https://sonicscan.org/address/0x088e5d8fddee0d4fcdda68cfc1a578d1d8aa37e9)
*
  **ERC721 Beacon :** [0x50d16738f991028bcf9a010da67dc9bbf60920e8](https://sonicscan.org/address/0x50d16738f991028bcf9a010da67dc9bbf60920e8)
*
  **ERC1155 Beacon :** [0xffe7cb448f510525c942734ecccc67e9b597c2bf](https://sonicscan.org/address/0xffe7cb448f510525c942734ecccc67e9b597c2bf)
*
  **ERC404 Beacon :** [0xc2b63ddb645d42a897e1d6fb15b3e5f5f5709be9](https://sonicscan.org/address/0xc2b63ddb645d42a897e1d6fb15b3e5f5f5709be9)

## Estfor Kingdom:

* **Bridge** : [0x551944b340a17f277a97773355f463beefea7901](https://sonicscan.org/address/0x551944b340a17f277a97773355f463beefea7901)
* **World** **Actions** : [0x9e1275dd55e9623dc8f1673fc3c94cf1176a2816](https://sonicscan.org/address/0x9e1275dd55e9623dc8f1673fc3c94cf1176a2816)
* **Randomness** **Beacon** : [0x9b4ba31bf6031d9304c5d4487c3b30d58cef49a3](https://sonicscan.org/address/0x9b4ba31bf6031d9304c5d4487c3b30d58cef49a3)
* **Daily Rewards Scheduler** : [0x56ddffd7126b55883b603c4c5f33c639dfa424bc](https://sonicscan.org/address/0x56ddffd7126b55883b603c4c5f33c639dfa424bc)
* **Treasury** : [0x50b64112cc5af4ff4f8e079143c5b19decddaf03](https://sonicscan.org/address/0x50b64112cc5af4ff4f8e079143c5b19decddaf03)
* **Shop** : [0x80b78e431b6e52027debe297cd8ba614820a2f1b](https://sonicscan.org/address/0x80b78e431b6e52027debe297cd8ba614820a2f1b)
* **Royalty** **Receiver** : [0x6c01e51d7254e5d3a3d844d2d56c35dd8abfa753](https://sonicscan.org/address/0x6c01e51d7254e5d3a3d844d2d56c35dd8abfa753)
* **Admin** **Access** : [0x3977a0e1a9f7564ce20cd88a22ae76d13386087a](https://sonicscan.org/address/0x3977a0e1a9f7564ce20cd88a22ae76d13386087a)
* **Item NFT Library** : [0xe5440a37964fdfb7456c292d31471d80d7f6046b](https://sonicscan.org/address/0xe5440a37964fdfb7456c292d31471d80d7f6046b)
* **Item NFT** : [0x8970c63da309d5359a579c2f53bfd64f72b7b706](https://sonicscan.org/address/0x8970c63da309d5359a579c2f53bfd64f72b7b706)
* **Bazaar** : [0x0d6d3794c858b512716e77e05588d4f1fc264319](https://sonicscan.org/address/0x0d6d3794c858b512716e77e05588d4f1fc264319)
* **Estfor Library** : [0xe3223eaf0e260b54a8ce777ac9f4a972310370c0](https://sonicscan.org/address/0xe3223eaf0e260b54a8ce777ac9f4a972310370c0)
* **Player NFT** : [0x076aeec336f5abbdf64ba8ddf96fc974b0463528](https://sonicscan.org/address/0x076aeec336f5abbdf64ba8ddf96fc974b0463528)
* **Quests** : [0x193ecbc093f3bcf6ae6155c9f1bd7c963af6b8d2](https://sonicscan.org/address/0x193ecbc093f3bcf6ae6155c9f1bd7c963af6b8d2)
* **Clans** : [0xbc6ed9e6cb54661ed9682c5055a6631d92e9e1d0](https://sonicscan.org/address/0xbc6ed9e6cb54661ed9682c5055a6631d92e9e1d0)
* **Wishing Well** : [0x1207d2f1dc47a9228f20e9d0ce5094ff08bcb00b](https://sonicscan.org/address/0x1207d2f1dc47a9228f20e9d0ce5094ff08bcb00b)
* **Bank** : [0x144884e1b42ccc9c648adee9b5dc1479ce1c8fe3](https://sonicscan.org/address/0x144884e1b42ccc9c648adee9b5dc1479ce1c8fe3)
* **Pet NFT Library** : [0xdb24883dee4100a98bfec32ad95b9abf87c1a32f](https://sonicscan.org/address/0xdb24883dee4100a98bfec32ad95b9abf87c1a32f)
* **Pet NFT** : [0xe97f8165d9d8d6835abdf7a814ba55dd09b7b1ed](https://sonicscan.org/address/0xe97f8165d9d8d6835abdf7a814ba55dd09b7b1ed)
* **Players Library** : [0x480c3e2c73173b25caebc50bf188e984743f52c4](https://sonicscan.org/address/0x480c3e2c73173b25caebc50bf188e984743f52c4)
* **Players impl Queue Actions** : [0x80ca34d47090080159db46409ef7868df88f464e](https://sonicscan.org/address/0x80ca34d47090080159db46409ef7868df88f464e)
* **Players impl Process Actions** : [0x129149ff66bc70bb884efa99b0ae31df3c92e0d6](https://sonicscan.org/address/0x129149ff66bc70bb884efa99b0ae31df3c92e0d6)
* **Players impl Rewards** : [0xe83f7057066f165bbf0590efa50d6dbb544b8a91](https://sonicscan.org/address/0xe83f7057066f165bbf0590efa50d6dbb544b8a91)
* **Players impl Misc** : [0xee6fc8e098fdee9ac4275ca3ece9bafe451ae57e](https://sonicscan.org/address/0xee6fc8e098fdee9ac4275ca3ece9bafe451ae57e)
* **Players impl Misc1** : [0xa3686c30a3af31659f3661fffc645bf9354c2aa7](https://sonicscan.org/address/0xa3686c30a3af31659f3661fffc645bf9354c2aa7)
* **Players** : [0xefa670aad6d5921236e9655f346ca13a5c56481b](https://sonicscan.org/address/0xefa670aad6d5921236e9655f346ca13a5c56481b)
* **Promotions Library** : [0x201ffa5be3886d19ef2f18da877ff3b9e34d10c9](https://sonicscan.org/address/0x201ffa5be3886d19ef2f18da877ff3b9e34d10c9)
* **Promotions** : [0xaf48a8a12f29e30b3831392aa2ee6344d07d188b](https://sonicscan.org/address/0xaf48a8a12f29e30b3831392aa2ee6344d07d188b)
* **Passive** **Actions** : [0x72bb8faee4094d5a701faa26f9f442d32dfe53b6](https://sonicscan.org/address/0x72bb8faee4094d5a701faa26f9f442d32dfe53b6)
* **Instant** **Actions** : [0x765f7068c3cd210b52374498f3ce01617667aed0](https://sonicscan.org/address/0x765f7068c3cd210b52374498f3ce01617667aed0)
* **VRF** **Request Info** : [0x4875572c5d0910fdc19a193e38c3eb1113e28218](https://sonicscan.org/address/0x4875572c5d0910fdc19a193e38c3eb1113e28218)
* **Instant** **VRF Actions** : [0x1ea4b1fa7f069b89eb8cceee30bfb24945e4d638](https://sonicscan.org/address/0x1ea4b1fa7f069b89eb8cceee30bfb24945e4d638)
* **Generic Instant VRF Action Strategy** : [0x05cd907e6ad6cad21ab2a39e49c68b110be7189a](https://sonicscan.org/address/0x05cd907e6ad6cad21ab2a39e49c68b110be7189a)
* **Egg Instant VRF Action Strategy** : [0x231363f40693698df92354275e2bcc4cbe48aa56](https://sonicscan.org/address/0x231363f40693698df92354275e2bcc4cbe48aa56)
* **Bank Relay** : [0x0df55b940e993f8d3b06a64212962c3d0fef8cba](https://sonicscan.org/address/0x0df55b940e993f8d3b06a64212962c3d0fef8cba)
* **PVP Battleground** : [0x679193f35e696651e125b2851ee7c4e44bf40a18](https://sonicscan.org/address/0x679193f35e696651e125b2851ee7c4e44bf40a18)
* **Raids** : [0xec57b7988ee3344bcf4ce64e5d11f495df7cd951](https://sonicscan.org/address/0xec57b7988ee3344bcf4ce64e5d11f495df7cd951)
* **Clan Battle Library** : [0x10a540055069172cf74bb7e06133d887a7e3a3d8](https://sonicscan.org/address/0x10a540055069172cf74bb7e06133d887a7e3a3d8)
* **Locked Bank Vaults Library** : [0x10de14eafea8f841689b01fa682c63e52255b148](https://sonicscan.org/address/0x10de14eafea8f841689b01fa682c63e52255b148)
* **Locked Bank Vaults** : [0xfaa31b6ddb7e07cae5ff15475b3966d78d660240](https://sonicscan.org/address/0xfaa31b6ddb7e07cae5ff15475b3966d78d660240)
* **Territories** : [0x5a6d80bb035318d2a24c1fdfd055032a15f11b12](https://sonicscan.org/address/0x5a6d80bb035318d2a24c1fdfd055032a15f11b12)
* **Combatants Helper** : [0xc754d621239b5830264f8c8e302c21ffe48625fc](https://sonicscan.org/address/0xc754d621239b5830264f8c8e302c21ffe48625fc)
* **Territory Treasury** : [0x4b1da5984c89312f852c798154a171a5ddc07d43](https://sonicscan.org/address/0x4b1da5984c89312f852c798154a171a5ddc07d43)
* **Bank** **Registry** : [0xf213febd3889c5bf18086356e7eff79e2a9fe391](https://sonicscan.org/address/0xf213febd3889c5bf18086356e7eff79e2a9fe391)
* **Bank** **Factory** : [0x76af5869f1b902f7a16c128a1daa7734819ec327](https://sonicscan.org/address/0x76af5869f1b902f7a16c128a1daa7734819ec327)