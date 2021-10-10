
import assert from "assert";

//import Web3HttpProvider from "web3-providers-http";

import { ethers } from "ethers";

const bnify = ethers.BigNumber.from;



const allNetworks = [ "default", "homestead", "ropsten", "rinkeby", "kovan", "goerli" ];

// We use separate API keys because otherwise the testcases sometimes
// fail during CI because our default keys are pretty heavily used
const _ApiKeys: Record<string, string> = {
    alchemy: "YrPw6SWb20vJDRFkhWq8aKnTQ8JRNRHM",
    etherscan: "FPFGK6JSW2UHJJ2666FG93KP7WC999MNW7",
    infura: "49a0efa3aaee4fd99797bfa94d8ce2f1",
};

const _ApiKeysPocket: Record<string, string> = {
    homestead: "6004bcd10040261633ade990",
    ropsten: "6004bd4d0040261633ade991",
    rinkeby: "6004bda20040261633ade994",
    goerli: "6004bd860040261633ade992",
};

type ApiKeySet = {
    alchemy: string;
    etherscan: string;
    infura: string;
    pocket: string;
};

function getApiKeys(network: string): ApiKeySet {
    if (network === "default" || network == null) { network = "homestead"; }
    const apiKeys = ethers.utils.shallowCopy(_ApiKeys);
    apiKeys.pocket = _ApiKeysPocket[network];
    return <ApiKeySet>apiKeys;
}



const providerFunctions: Array<ProviderDescription> = [
    {
        name: "getDefaultProvider",
        networks: allNetworks,
        create: (network: string) => {
            if (network == "default") {
                return ethers.getDefaultProvider(null, getApiKeys(network));
            }
            return ethers.getDefaultProvider(network, getApiKeys(network));
        }
    },
    {
        name: "AlchemyProvider",
        networks: allNetworks,
        create: (network: string) => {
            if (network == "default") {
                return new ethers.providers.AlchemyProvider(null, getApiKeys(network).alchemy);
            }
            return new ethers.providers.AlchemyProvider(network, getApiKeys(network).alchemy);
        }
    },
    /*
    {
        name: "CloudflareProvider",
        networks: [ "default", "homestead" ],
        create: (network: string) => {
            return new ethers.providers.CloudflareProvider(network);
        }
    },
    */
    {
        name: "InfuraProvider",
        networks: allNetworks,
        create: (network: string) => {
            if (network == "default") {
                return new ethers.providers.InfuraProvider(null, getApiKeys(network).infura);
            }
            return new ethers.providers.InfuraProvider(network, getApiKeys(network).infura);
        }
    },
    {
        name: "EtherscanProvider",
        networks: allNetworks,
        create: (network: string) => {
            if (network == "default") {
                return new ethers.providers.EtherscanProvider(null, getApiKeys(network).etherscan);
            }
            return new ethers.providers.EtherscanProvider(network, getApiKeys(network).etherscan);
        }
    },
    {
        name: "NodesmithProvider",
        networks: [ ],
        create: (network: string) => {
            throw new Error("not tested");
        }
    },
    {
        name: "PocketProvider",
        // note: sans-kovan
        // @TODO: Pocket is being incredibly unreliable right now; removing it so
        // we can pass the CI
        //networks: [ "default", "homestead", "ropsten", "rinkeby", "goerli" ],
        networks: [ "default", "homestead" ],
        create: (network: string) => {
            if (network == "default") {
                return new ethers.providers.PocketProvider(null, {
                    applicationId: getApiKeys(network).pocket,
                    loadBalancer: true
                });
            }
            return new ethers.providers.PocketProvider(network, {
                applicationId: getApiKeys(network).pocket,
                loadBalancer: true
            });
        }
    },
    {
        name: "Web3Provider",
        networks: [ ],
        create: (network: string) => {
            throw new Error("not tested");
        }
    }
];



    tests.blocks.forEach((test) => {
        addObjectTest(`fetches block (by number) #${ test.number }`, (provider: ethers.providers.Provider) => {
            return provider.getBlock(test.number);
        }, test);
    });

    tests.blocks.forEach((test) => {
        addObjectTest(`fetches block (by hash) ${ test.hash }`, (provider: ethers.providers.Provider) => {
            return provider.getBlock(test.hash);
        }, test, (provider: string, network: string, test: TestDescription) => {
            return (provider === "EtherscanProvider");
        });
    });


    describe("Test WebSocketProvider", function() {
      this.retries(3);

      async function testWebSocketProvider(provider: ethers.providers.WebSocketProvider): Promise<void> {
          await provider.destroy();
      }

      it("InfuraProvider.getWebSocketProvider", async function() {
          const provider = ethers.providers.InfuraProvider.getWebSocketProvider();
          await testWebSocketProvider(provider);
      });
  });

  describe("Test Events", function() {
      this.retries(3);

      async function testBlockEvent(provider: ethers.providers.Provider) {
          return new Promise((resolve, reject) => {
              let firstBlockNumber: number = null;
              const handler = (blockNumber: number) => {
                  if (firstBlockNumber == null) {
                      firstBlockNumber = blockNumber;
                      return;
                  }
                  provider.removeListener("block", handler);
                  if (firstBlockNumber + 1 === blockNumber) {
                      resolve(true);
                  } else {
                      reject(new Error("blockNumber fail"));
                  }
              };
              provider.on("block", handler);
          });
      }

      it("InfuraProvider", async function() {
          this.timeout(60000);
          const provider = new ethers.providers.InfuraProvider("rinkeby");
          await testBlockEvent(provider);
      });
  });
