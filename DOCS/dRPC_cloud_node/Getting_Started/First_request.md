DRPC_API_KEY=Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj
Sonic Mainnet
Http=https://lb.drpc.org/sonic/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj
wss:wss://lb.drpc.org/sonic/Av0tqtt4908GitCEzvNhURHIfJgThf0R8Id1qhnKxixj 
General Account ID = cf639c4c-d00e-4be6-ac0e-e18971882b44
Team ID= fd2daadb-78f7-4f06-8ad0-84cef3615111

Keys API=eebadb0b81dd773097077db0c29fc4290ed41b467e7ec9c9ac74acc25c90bc16



First request to DRPC
First, get your endpoint.

Authentication
Each endpoint on UI by default contains your authentication key as a URL parameter dkey and network as network.

For example, ethereum network of DRPC will look like this: https://lb.drpc.org/ogrpc?network=ethereum&dkey=YOUR-DRPC-KEY.

Another recommended way for authentication is to use special HTTP header Drpc-Key.

The following are examples of how to make a requests:

POST https://lb.drpc.org/ogrpc?network=ethereum
content-type: application/json
Drpc-Key: YOUR-DRPC-KEY
 
{"method": "eth_blockNumber","params": [], "id": "1", "jsonrpc": "2.0"}
 

DRPC key value is the part of your endpoint by default. Also, you can find it on the Key -> Settings page:Example of the key value on Settings page

Making requests from code
DRPC conforms to standard JSON RPC protocol, that most of the blockchains use today. So, you can use any standard library for you preferred language to make request, for example:

let Web3 = require("web3");
let provider = "https://lb.drpc.org/ogrpc?network=ethereum&dkey=YOUR-DRPC-KEY";
let web3Provider = new Web3.providers.HttpProvider(provider);
let web3 = new Web3(web3Provider);
 
// Get the latest block number
web3.eth.getBlockNumber().then((result) => {
  console.log("Latest Ethereum Block is ", result);
});



The following are examples of how to make a requests:

curl -X POST -H 'Content-Type: application/json' -H 'Drpc-Key: YOUR-DRPC-KEY' \
-d '{"method": "eth_blockNumber","params": [],"id": "1","jsonrpc": "2.0"}' \
'https://lb.drpc.org/ogrpc?network=ethereum'

The following are examples of how to make a requests:

POST https://lb.drpc.org/ogrpc?network=ethereum&dkey=YOUR-DRPC-KEY
content-type: application/json
 
{"method": "eth_blockNumber","params": [], "id": "1", "jsonrpc": "2.0"}
 