# Widget

Step-by-step guide for embedding the [OpenOcean ](https://app.openocean.finance/)Swap widget in your web3 decentralized application (dApp)

With OpenOcean swap widget, your users can swap any token at the best rates through OpenOcean protocol without leaving your dApp!

The widget will only take you less than 5 minutes for integration. See following examples of user case:

* **Making swaps a revenue source** by adding your own platform fee to the transaction.
* **Converting to the required currency** for an NFT purchase or any other in-app usage (e.g. WETH). Building a custom frontend for the Uniswap Protocol.
* Swapping assets in a DeFi application for **providing liquidity, farming & staking**
* Acquiring a token to participate in your web3 community (DAO or any other activities)



{% content-ref url="widget/getting-started" %}
[getting-started](widget/getting-started)
{% endcontent-ref %}

{% content-ref url="widget/customize-theme" %}
[customize-theme](widget/customize-theme)
{% endcontent-ref %}

{% content-ref url="widget/other-reference" %}
[other-reference](widget/other-reference)
{% endcontent-ref %}



# Getting Started

{% embed url="https://github.com/openocean-finance/Widget" %}

### Quick Install

There are three ways you can embed OpenOcean swap widget into your protocols/Apps.

**Method #1 - Use \<iframe> to inject the OpenOcean widget into your program.**

* Input \<iframe> to your front-end code.
* Change the iframe src to "[https://widget.openocean.finance](https://widget.openocean.finance)"
* Refresh the page and check whether the component is installed.

```
<iframe src="https://widget.openocean.finance"></iframe>
```

{% hint style="info" %}
We highly recommend using the custom mode to integrate wallets to make sure it works properly. [More Details](other-reference)
{% endhint %}

**Method #2 - Install the widget by using the OpenOcean SDK module.**

You can check the detail in the SDK section.

**Method #3 -  Install the widget by using the OpenOcean API.**

[You can check the detail in the API section.](broken-reference)



### Referral Fee

**Method #1** - add 'referral' which is fee charger address as query param in \<iframe> request link

For example:

```
https://widget.openocean.finance?referral=0x3487ef9f9b36547e43268b8f0e2349a226c70b53#/BSC/BNB/BUSD
```

The default referrer fee is 0%. You could set up the referrer fee via the link [**here**](https://widget.openocean.finance/theme). The default fee share for OpenOcean is 20% from the set referrer fee. You may [<mark style="color:blue;">**contact us**</mark>](https://t.me/OpenOceanAPI) for any adjustments for the fee share %.

**Method #2** - contact us

Feel free to reach out to our team on [Telegram](https://t.me/OpenOceanAPI) or [Discord ](https://discord.gg/openocean)regarding the fee rate that you want to customize. In this method, the address from the above referral link will not be included.





# Getting Started

{% embed url="https://github.com/openocean-finance/Widget" %}

### Quick Install

There are three ways you can embed OpenOcean swap widget into your protocols/Apps.

**Method #1 - Use \<iframe> to inject the OpenOcean widget into your program.**

* Input \<iframe> to your front-end code.
* Change the iframe src to "[https://widget.openocean.finance](https://widget.openocean.finance)"
* Refresh the page and check whether the component is installed.

```
<iframe src="https://widget.openocean.finance"></iframe>
```

{% hint style="info" %}
We highly recommend using the custom mode to integrate wallets to make sure it works properly. [More Details](other-reference)
{% endhint %}

**Method #2 - Install the widget by using the OpenOcean SDK module.**

You can check the detail in the SDK section.

**Method #3 -  Install the widget by using the OpenOcean API.**

[You can check the detail in the API section.](broken-reference)



### Referral Fee

**Method #1** - add 'referral' which is fee charger address as query param in \<iframe> request link

For example:

```
https://widget.openocean.finance?referral=0x3487ef9f9b36547e43268b8f0e2349a226c70b53#/BSC/BNB/BUSD
```

The default referrer fee is 0%. You could set up the referrer fee via the link [**here**](https://widget.openocean.finance/theme). The default fee share for OpenOcean is 20% from the set referrer fee. You may [<mark style="color:blue;">**contact us**</mark>](https://t.me/OpenOceanAPI) for any adjustments for the fee share %.

**Method #2** - contact us

Feel free to reach out to our team on [Telegram](https://t.me/OpenOceanAPI) or [Discord ](https://discord.gg/openocean)regarding the fee rate that you want to customize. In this method, the address from the above referral link will not be included.





# Other Reference

## Custom Mode

If you choose to integrate an iframe from https://widget.openocean.finance, some wallets might not work properly.

To address this issue, you can configure your server nginx like below, and the frontend iframe config should be the same as the OpenOcean widget.&#x20;

#### Step 1 - Config nginx

```nginx
server {
  listen 80;
  server_name app.openocean.net;

  proxy_ssl_server_name on;
  proxy_ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host "widget.openocean.finance";
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Real-PORT $remote_port;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  client_max_body_size 20m;
  location / {
    proxy_pass https://widget.openocean.finance;
  }
}
```

#### Step 2 - Config Front-end （for example: openocean.net）

```html
<script>
  document.domain = "openocean.net";
</script>
<iframe src="https://app.openocean.net?domain=openocean.net"></iframe>
```

# Widget V2

The **OpenOcean Widget V2** is the upgraded version of our plug-and-play swap & bridge component, now supporting **both same-chain and cross-chain** transactions in one unified interface.

This powerful widget is built for seamless integration, allowing any app or platform to easily offer **secure, multi-chain token swaps and bridging** directly to users - without redirecting them elsewhere.

With full customization options, the widget can be styled to match your app’s UI, helping you **enhance your multi-chain strategy and retain users** across EVM ecosystems.

#### ⚙️ Key Features:

* Unified cross-chain & same-chain swaps
* Supports 35+ chains and 1,000+ tokens
* Customizable UI to match your branding
* Built-in OpenOcean swap routing for best price execution\


🚀 **Example Use Cases:**

* dApps: Allow users to swap on chain and bring assets cross-chain to your protocol
* DeFAI: Boost your AI agent’s execution capabilities with optimized routing
* DeFi tools: Add a seamless token entry point with best-rate execution
* GameFi/Meme/Launchpad: Enable users fund wallets across chains without leaving your site
-