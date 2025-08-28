---
title: Use IPFS gateway · Cloudflare Web3 docs
description: Once you have an IPFS gateway — meaning that you create a new
  gateway with a target of IPFS — you can get data from the IPFS network by
  using a URL.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/web3/how-to/use-ipfs-gateway/
  md: https://developers.cloudflare.com/web3/how-to/use-ipfs-gateway/index.md
---

Once you have an IPFS gateway — meaning that you [create a new gateway](https://developers.cloudflare.com/web3/how-to/manage-gateways/#create-a-gateway) with a `target` of **IPFS** — you can get data from the IPFS network by using a URL.

## Read from the network

Every time you access a piece of content through Cloudflare's IPFS Gateway, you need a URL with two parts: the gateway hostname and the request path.

### Gateway hostname

Your gateway hostname will be the **Hostname** value you supplied when you [created the gateway](https://developers.cloudflare.com/web3/how-to/manage-gateways/#create-a-gateway).

### Request path

The request path will vary based on the type of content you are serving.

If a request path is `/ipfs/<CID_HASH>`, that tells the gateway that you want the content with the Content Identifier (CID) that immediately follows. Because the content is addressed by CID, the gateway's response is immutable and will never change. An example would be `https://cloudflare-ipfs.com/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/wiki/`, which is a mirror of Wikipedia and an immutable `/ipfs/` link.

If a request path is `/ipns/<DOMAIN>`, that tells the gateway that you want it to lookup the CID associated with a given domain in DNS and then serve whatever content corresponds to the CID it happens to find. Because DNS can change over time, so will the gateway's response. An example would be `https://cloudflare-ipfs.com/ipns/ipfs.tech/`, which is IPFS's marketing site and can be changed at any time by modifying the [DNSLink record](https://developers.cloudflare.com/web3/ipfs-gateway/concepts/dnslink/) associated with the `ipfs.tech` domain.

## Write to the network

Cloudflare's IPFS Gateway is currently limited to read-only access.


---
title: Customize Cloudflare settings · Cloudflare Web3 docs
description: Once your gateway becomes active, you can customize the Cloudflare
  settings associated with your hostname.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/web3/how-to/customize-cloudflare-settings/
  md: https://developers.cloudflare.com/web3/how-to/customize-cloudflare-settings/index.md
---

Once your gateway becomes [active](https://developers.cloudflare.com/web3/reference/gateway-status/), you can customize the Cloudflare settings associated with your hostname.

Since your traffic is automatically proxied through Cloudflare, you customize your website settings to take advantage of various [security, performance, and reliability](https://developers.cloudflare.com/fundamentals/concepts/how-cloudflare-works/#cloudflare-as-a-reverse-proxy) benefits.



---
title: Interplanetary File System (IPFS) · Cloudflare Web3 docs
description: The Interplanetary File System (IPFS) is a distributed file storage
  protocol that allows computers all over the globe to store and serve files as
  part of a giant peer-to-peer network.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/web3/ipfs-gateway/concepts/ipfs/
  md: https://developers.cloudflare.com/web3/ipfs-gateway/concepts/ipfs/index.md
---

The Interplanetary File System (IPFS) is a distributed file storage protocol that allows computers all over the globe to store and serve files as part of a giant peer-to-peer network.

Any computer, anywhere in the world, can download the IPFS software and start hosting and serving files.

If someone runs IPFS on their computer and uploads a file to the IPFS network, that file can be viewed and downloaded by anyone else in the world who is also running IPFS.

## Content Identifiers

Every file added to IPFS is given a unique address derived from a hash of the file's content. This address is called a Content Identifier (CID) and it combines the hash of the file and a unique identifier for the hash algorithm used into a single string.

IPFS currently uses [SHA-256](https://en.wikipedia.org/wiki/SHA-2) by default, which produces a 256 bit (32 byte) output, and that output is encoded with [Base58](https://en.wikipedia.org/wiki/Base58). Base58 is a binary-to-text encoding scheme originally developed for Bitcoin and has the advantage that letters that might be mistaken for each other in certain fonts (like zero and the capital letter O) are not included.

A CID will typically look something like `QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`.

However, the same hash could be encoded with [Base32](https://en.wikipedia.org/wiki/Base32) or other supported hash algorithms including [SHA-3](https://en.wikipedia.org/wiki/SHA-3) and [BLAKE2](https://en.wikipedia.org/wiki/BLAKE_\(hash_function\)).

## Uploading to IPFS

IPFS is fundamentally a [Distributed Hash Table (DHT)](https://en.wikipedia.org/wiki/Distributed_hash_table) which maps from CIDs to people who have the content addressed by that CID. The hash table is distributed because no single node in the network holds the entire table. Instead, each node stores a subset of the hash table, as well as information about which nodes are storing other relevant sections.

When someone talks about 'uploading' content to IPFS, what they really mean (usually) is that they are announcing to the network that they have some content by adding an entry to the DHT that maps from CID to their IP address. Somebody else who wants to download their data would look up the CID in the DHT, find the person's IP address, and download the data directly from them.

The speed and reliability advantages of IPFS come from the fact that many people can upload the same data, and then downloads will be spread between all of them. If any one of them goes offline or decides to stop hosting the data, the others can pick up the slack.

## Directories

You can upload more than just individual files. For example, consider a folder called `example`, which has exactly one file, `example_text.txt`, containing the string `I'm trying out IPFS`.

If that folder were uploaded with the command `ipfs add -r ./example`, both the folder and the file it contains would have their own CID. In this case, the folder would have the CID `QmdbaSQbGU6Wo9i5LyWWVLuU8g6WrYpWh2K4Li4QuuE8Fr` while the file would have the CID `QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy`.

You could then access the file in two ways:

* Requesting the file directly:\
  `https://cloudflare-ipfs.com/ipfs/QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy`
* Requesting the file by name, from the directory:\
  `https://cloudflare-ipfs.com/ipfs/QmdbaSQbGU6Wo9i5LyWWVLuU8g6WrYpWh2K4Li4QuuE8Fr/example_text.txt`

While the CID of a file will only change if the file itself changes, the CID of a directory changes any time **any** of the files in it change, or if any files are added/removed.

Directories make it possible to address an entire static website with a single CID and access different pages of the website by requesting different files in the directory.

## Related resources

For help with additional concepts, refer to the [IPFS](https://docs.ipfs.tech/concepts/) documentation.


---
title: DNSLink gateways · Cloudflare Web3 docs
description: When you set up a gateway with a DNSLink record, that gateway is
  restricted to a particular piece of content (either a specific Content
  Identifier (CID) or an Interplanetary Name Service (IPNS) hostname).
lastUpdated: 2025-02-10T11:11:23.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/web3/ipfs-gateway/concepts/dnslink/
  md: https://developers.cloudflare.com/web3/ipfs-gateway/concepts/dnslink/index.md
---

When you set up a gateway with a DNSLink record, that gateway is restricted to a particular piece of content (either a specific Content Identifier (CID) or an Interplanetary Name Service (IPNS) hostname).

A gateway with a DNSLink - otherwise known as a *restricted gateway* - differs from a [universal gateway](https://developers.cloudflare.com/web3/ipfs-gateway/concepts/universal-gateway/), which allows users to access any content hosted on the IPFS network.

## What is it?

When you import anything to the [IPFS](https://developers.cloudflare.com/web3/ipfs-gateway/concepts/ipfs/), that item gets a unique content identifier ([CID](https://docs.ipfs.io/concepts/glossary/#cid)) similar to `bafybeiaysi4s6lnjev27ln5icwm6tueaw2vdykrtjkwiphwekaywqhcjze`.

Such a long CID can cause issues when you want others to be able to access a website hosted on IPFS (`https://cf-ipfs.com/ipfs/bafybeiaysi4s6lnjev27ln5icwm6tueaw2vdykrtjkwiphwekaywqhcjze`). It is a similar problem to websites in general, where end users would have difficulty remembering an IP address (`192.0.2.1`) instead of a domain name (`google.com`).

The problem is solved the same way, via a DNS record. To make a website hosted on IPFS more accessible, you can put your entire website inside of a directory and create a **DNSLink** record for that CID. End users can then make requests to a Universal Gateway URL like `https://cf-ipfs.com/ipns/en.wikipedia-on-ipfs.org/` and have their requests translated to the correct CID in the background.

DNSLink records also help with content maintenance. When a new version of your website is ready to be published, you can update your DNSLink DNS record to point to the new CID and the gateway will start serving the new version automatically.

Note

For additional details, refer to the official [IPFS documentation](https://docs.ipfs.tech/concepts/dnslink/).

## How is it used with Cloudflare?

You have the option to specify the DNSLink when you [create an IPFS gateway](https://developers.cloudflare.com/web3/how-to/manage-gateways/#create-a-gateway), which serves as a custom hostname that directs users to a website already hosted on IPFS.

By default, your DNSLink path is `/ipns/onboarding.ipfs.cloudflare.com`. If you choose to put your website in a different content folder hosted at your own IPFS node or with a pinning service, you will need to specify that value.

For example, the default DNSLink record for `www.example.com` would look like this:

| Record type | Name | Content |
| - | - | - |
| TXT | `_dnslink.www.example.com` | `dnslink=/ipns/onboarding.ipfs.cloudflare.com` |

For more details about the DNS records created by the IPFS gateway, refer to [Gateway DNS records](https://developers.cloudflare.com/web3/reference/gateway-dns-records/).


---
title: DNSLink gateways · Cloudflare Web3 docs
description: When you set up a gateway with a DNSLink record, that gateway is
  restricted to a particular piece of content (either a specific Content
  Identifier (CID) or an Interplanetary Name Service (IPNS) hostname).
lastUpdated: 2025-02-10T11:11:23.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/web3/ipfs-gateway/concepts/dnslink/
  md: https://developers.cloudflare.com/web3/ipfs-gateway/concepts/dnslink/index.md
---

When you set up a gateway with a DNSLink record, that gateway is restricted to a particular piece of content (either a specific Content Identifier (CID) or an Interplanetary Name Service (IPNS) hostname).

A gateway with a DNSLink - otherwise known as a *restricted gateway* - differs from a [universal gateway](https://developers.cloudflare.com/web3/ipfs-gateway/concepts/universal-gateway/), which allows users to access any content hosted on the IPFS network.

## What is it?

When you import anything to the [IPFS](https://developers.cloudflare.com/web3/ipfs-gateway/concepts/ipfs/), that item gets a unique content identifier ([CID](https://docs.ipfs.io/concepts/glossary/#cid)) similar to `bafybeiaysi4s6lnjev27ln5icwm6tueaw2vdykrtjkwiphwekaywqhcjze`.

Such a long CID can cause issues when you want others to be able to access a website hosted on IPFS (`https://cf-ipfs.com/ipfs/bafybeiaysi4s6lnjev27ln5icwm6tueaw2vdykrtjkwiphwekaywqhcjze`). It is a similar problem to websites in general, where end users would have difficulty remembering an IP address (`192.0.2.1`) instead of a domain name (`google.com`).

The problem is solved the same way, via a DNS record. To make a website hosted on IPFS more accessible, you can put your entire website inside of a directory and create a **DNSLink** record for that CID. End users can then make requests to a Universal Gateway URL like `https://cf-ipfs.com/ipns/en.wikipedia-on-ipfs.org/` and have their requests translated to the correct CID in the background.

DNSLink records also help with content maintenance. When a new version of your website is ready to be published, you can update your DNSLink DNS record to point to the new CID and the gateway will start serving the new version automatically.

Note

For additional details, refer to the official [IPFS documentation](https://docs.ipfs.tech/concepts/dnslink/).

## How is it used with Cloudflare?

You have the option to specify the DNSLink when you [create an IPFS gateway](https://developers.cloudflare.com/web3/how-to/manage-gateways/#create-a-gateway), which serves as a custom hostname that directs users to a website already hosted on IPFS.

By default, your DNSLink path is `/ipns/onboarding.ipfs.cloudflare.com`. If you choose to put your website in a different content folder hosted at your own IPFS node or with a pinning service, you will need to specify that value.

For example, the default DNSLink record for `www.example.com` would look like this:

| Record type | Name | Content |
| - | - | - |
| TXT | `_dnslink.www.example.com` | `dnslink=/ipns/onboarding.ipfs.cloudflare.com` |

For more details about the DNS records created by the IPFS gateway, refer to [Gateway DNS records](https://developers.cloudflare.com/web3/reference/gateway-dns-records/).


---
title: Troubleshooting · Cloudflare Web3 docs
description: If you get a no link named "ipfs" under <<CID>> error message when
  trying to access content through Cloudflare's IPFS gateway, that means you
  have created a gateway without a value for the DNSLink.
lastUpdated: 2024-08-13T19:56:56.000Z
chatbotDeprioritize: false
source_url:
  html: https://developers.cloudflare.com/web3/ipfs-gateway/troubleshooting/
  md: https://developers.cloudflare.com/web3/ipfs-gateway/troubleshooting/index.md
---

## Cloudflare-specific

### No link named "ipfs"

If you get a `no link named "ipfs" under <<CID>>` error message when trying to access content through Cloudflare's IPFS gateway, that means you have created a gateway without a value for the [DNSLink](https://developers.cloudflare.com/web3/ipfs-gateway/concepts/dnslink).

Since Cloudflare currently only supports restricted gateways - and not [universal gateways](https://developers.cloudflare.com/web3/ipfs-gateway/concepts/universal-gateway/) - these requests will continue to fail until you specify a DNSLink value.

### Check Cloudflare's status

It is worth checking for recent incidents on Cloudflare's [status dashboard](https://www.cloudflarestatus.com/) that may have affected our gateway, but the best place to get up-to-date information about issues facing IPFS is the [IPFS Discussion Forum](https://discuss.ipfs.io/).

## Generic IPFS

IPFS is still a developing protocol and content is often unavailable or slow to load for reasons outside of Cloudflare's control. Usually, this happens for one of the following reasons.

### The content was uploaded to a free/anonymous pinning service.

Free and anonymous pinning services can often be used to get content on IPFS in a pinch, but they'll often stop pinning content soon after it's uploaded. Running your own server or using a pinning service are the recommended alternatives, and will keep your content online more reliably.

### No node with the requested content is online.

Content will only stay on the IPFS network as long as there's at least one node that's serving it. If all of the nodes that were serving a given piece of content go offline, the content will be inaccessible until one of them comes back online.

### The nodes with the requested content are not publicly addressable.

It's common for people who run an IPFS node on their home Wi-Fi to have very long wait times or a high rate of request failure. This is because the rest of the nodes in the IPFS network have difficulty connecting to them through their NAT (Internet router). This can be solved by setting up Port Forwarding on the router, to direct external connections to port 4001 to the host with the IPFS node, or by moving the node to a hosted server/VM.

### The nodes with the requested content are not pinning it.

If several minutes have passed since files were uploaded to an IPFS node and they're still not discoverable by other gateways, it's possible the node is having trouble announcing the files to the rest of the network. You can make sure the node with the content has pinned it by running:

```txt
ipfs pin -r <content id>
```

And you can force the actual announcement by running:

```txt
ipfs dht provide -rv <content id>
```

The second command will run indefinitely and has quite complicated output, so you may want to run it in the background and omit the `-v` flag.

### The nodes with the requested content are too old.

IPFS issues mandatory updates from time to time that introduce breaking protocol changes. Cloudflare tries to say ahead of these updates and may, as a result, lose connectivity with older nodes.
