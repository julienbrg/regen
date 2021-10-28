
import WalletConnectProvider from "@walletconnect/web3-provider";
//import Torus from "@toruslabs/torus-embed"
import WalletLink from "walletlink";
import { Alert, Button, Card, Col, Input, List, Menu, Row } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { BrowserRouter, Link, Route, Switch, Redirect } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Address, AddressInput, Contract, Faucet, GasGauge, Header , Ramp, ThemeSwitch, AlegraV3 } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  usePoller,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";

import { useContractConfig } from "./hooks";
import Portis from "@portis/web3";
import Fortmatic from "fortmatic";
import Authereum from "authereum";

// svg
import createSvg from "./components/AlegraV3";
import InputSpeed from "./components/InputSpeed";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

let startApp = true;

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.velas; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet, velas, ...)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = true;

let svgNumForm = 0;
let svgSetSpeed = 0;
let svgSpeed = [0, 0, 0, 0, 0];
let svgSetColorStart = '';
let svgSetColorEnd = '';
//                    FACE TOP ;          FACE BOTTOM ;         BACKGROUND ;            DISK BOTTOM ;         DISK TOP
let svgColor = ['', '', '', '', '', '' , '', '', '', ''];

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544")
  : null;
const poktMainnetProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider(
      "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
    )
  : null;
const mainnetInfura = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
  : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID
// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

// Coinbase walletLink init
const walletLink = new WalletLink({
  appName: "coinbase",
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${INFURA_ID}`, 1);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "tesnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          4: `https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`,
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai,
          111: "https://evmexplorer.testnet.velas.com/rpc",
        },
      },
    },
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
      },
    },
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_5A7C91B2FC585A17", // required
      },
    },
    // torus: {
    //   package: Torus,
    //   options: {
    //     networkParams: {
    //       host: "https://localhost:8545", // optional
    //       chainId: 1337, // optional
    //       networkId: 1337 // optional
    //     },
    //     config: {
    //       buildEnv: "development" // optional
    //     },
    //   },
    // },
    "custom-walletlink": {
      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet (not Coinbase App)",
      },
      package: walletLinkProvider,
      connector: async (provider, _options) => {
        await provider.enable();
        return provider;
      },
    },
    authereum: {
      package: Authereum, // required
    },
  },
});

function App(props) {
  const mainnetProvider =
    poktMainnetProvider && poktMainnetProvider._isProvider
      ? poktMainnetProvider
      : scaffoldEthProvider && scaffoldEthProvider._network
      ? scaffoldEthProvider
      : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  const contractConfig = useContractConfig();

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // call every 1500 seconds.
/*   usePoller(() => {
    updateLoogieTanks();
  }, 1500000); */

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  // keep track of a variable from the contract in the local React state:
  const loogieBalance = useContractReader(readContracts, "Loogies", "balanceOf", [address]);
  if (DEBUG) console.log("🤗 loogie balance:", loogieBalance);

/*   const loogieTankBalance = useContractReader(readContracts, "LoogieTank", "balanceOf", [address]);
  console.log("🤗 loogie tank balance:", loogieTankBalance); */

  // 📟 Listen for broadcast events
  const loogieTransferEvents = useEventListener(readContracts, "Loogies", "Transfer", localProvider, 1);
  if (DEBUG) console.log("📟 Loogie Transfer events:", loogieTransferEvents);

/*   const loogieTankTransferEvents = useEventListener(readContracts, "LoogieTank", "Transfer", localProvider, 1);
  console.log("📟 Loogie Tank Transfer events:", loogieTankTransferEvents); */

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  const yourLoogieBalance = loogieBalance && loogieBalance.toNumber && loogieBalance.toNumber();
  const [yourLoogies, setYourLoogies] = useState();

  /* const yourLoogieTankBalance = loogieTankBalance && loogieTankBalance.toNumber && loogieTankBalance.toNumber();
  const [yourLoogieTanks, setYourLoogieTanks] = useState();

  async function updateLoogieTanks() {
    const loogieTankUpdate = [];
    for (let tokenIndex = 0; tokenIndex < yourLoogieTankBalance; tokenIndex++) {
      try {
        console.log("Getting token index", tokenIndex);
        const tokenId = await readContracts.LoogieTank.tokenOfOwnerByIndex(address, tokenIndex);
        console.log("tokenId", tokenId);
        const tokenURI = await readContracts.LoogieTank.tokenURI(tokenId);
        console.log("tokenURI", tokenURI);
        const jsonManifestString = atob(tokenURI.substring(29));
        console.log("jsonManifestString", jsonManifestString);

        try {
          const jsonManifest = JSON.parse(jsonManifestString);
          console.log("jsonManifest", jsonManifest);
          loogieTankUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
        } catch (e) {
          console.log(e);
        }
      } catch (e) {
        console.log(e);
      }
    }
    setYourLoogieTanks(loogieTankUpdate.reverse());
  } */

  useEffect(() => {
    const updateYourCollectibles = async () => {
      const loogieUpdate = [];
      for (let tokenIndex = 0; tokenIndex < yourLoogieBalance; tokenIndex++) {
        try {
          if (DEBUG) console.log("Getting token index", tokenIndex);
          const tokenId = await readContracts.Loogies.tokenOfOwnerByIndex(address, tokenIndex);
          if (DEBUG) console.log("tokenId", tokenId);
          const tokenURI = await readContracts.Loogies.tokenURI(tokenId);
          if (DEBUG) console.log("tokenURI", tokenURI);
          const jsonManifestString = atob(tokenURI.substring(29));
          if (DEBUG) console.log("jsonManifestString", jsonManifestString);
        /*
          const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
          console.log("ipfsHash", ipfsHash);
          const jsonManifestBuffer = await getFromIPFS(ipfsHash);
        */
          try {
            const jsonManifest = JSON.parse(jsonManifestString);
            if (DEBUG) console.log("jsonManifest", jsonManifest);
            loogieUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setYourLoogies(loogieUpdate.reverse());
/*       updateLoogieTanks(); */
    };
    updateYourCollectibles();
/*   }, [address, yourLoogieBalance, yourLoogieTankBalance]); */
}, [address, yourLoogieBalance]);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    if (DEBUG) console.log("data", data);

                    let switchTx;
                    // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
                    try {
                      switchTx = await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: data[0].chainId }],
                      });
                    } catch (switchError) {
                      // not checking specific error code, because maybe we're not using MetaMask
                      try {
                        switchTx = await ethereum.request({
                          method: "wallet_addEthereumChain",
                          params: data,
                        });
                      } catch (addError) {
                        // handle "add" error
                      }
                    }

                    if (switchTx) {
                      if (DEBUG) console.log(switchTx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } /*else {
    networkDisplay = (
      <div style={{ right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }*/

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      if (DEBUG) console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      if (DEBUG) console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      if (DEBUG) console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;
  /* let faucetHint = "";

  const [faucetClicked, setFaucetClicked] = useState(false);
  if (
    !faucetClicked &&
    localProvider &&
    localProvider._network &&
    localProvider._network.chainId === 31337 &&
    yourLocalBalance &&
    ethers.utils.formatEther(yourLocalBalance) <= 0
  ) {
    faucetHint = (
      <div style={{ padding: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            faucetTx({
              to: address,
              value: ethers.utils.parseEther("0.01"),
            });
            setFaucetClicked(true);
          }}
        >
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    );
  }*/

  function mintItem() {
    //const tataSVG = 'PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBjbGFzcz0icm90YXRlIj48ZyBpZD0iZXllMSI+PGVsbGlwc2Ugc3Ryb2tlLXdpZHRoPSIzIiByeT0iMjkuNSIgcng9IjI5LjUiIGlkPSJzdmdfMSIgY3k9IjE1NC41IiBjeD0iMTgxLjUiIHN0cm9rZT0iIzAwMCIgZmlsbD0iI2ZmZiIvPjxlbGxpcHNlIHJ5PSIzLjUiIHJ4PSIyLjUiIGlkPSJzdmdfMyIgY3k9IjE1NC41IiBjeD0iMTczLjUiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlPSIjMDAwIiBmaWxsPSIjMDAwMDAwIi8+PC9nPjxnIGlkPSJoZWFkIj48ZWxsaXBzZSBmaWxsPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjMiIGN4PSIyMDQuNSIgY3k9IjIxMS44MDA2NSIgaWQ9InN2Z181IiByeD0iODAiIHJ5PSI1MS44MDA2NSIgc3Ryb2tlPSIjMDAwIi8+PC9nPjxnIGlkPSJleWUyIj48ZWxsaXBzZSBzdHJva2Utd2lkdGg9IjMiIHJ5PSIyOS41IiByeD0iMjkuNSIgaWQ9InN2Z18yIiBjeT0iMTY4LjUiIGN4PSIyMDkuNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSIjZmZmIi8+PGVsbGlwc2Ugcnk9IjMuNSIgcng9IjMiIGlkPSJzdmdfNCIgY3k9IjE2OS41IiBjeD0iMjA4IiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9IiMwMDAwMDAiIHN0cm9rZT0iIzAwMCIvPjwvZz48L2c+PC9zdmc+';
    const tataSVG = 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQoNCjxzdmcNCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyINCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIg0KICAgdmlld0JveD0iMCAwIDE2MCAyMTAiDQogICB2ZXJzaW9uPSIxLjEiDQogICBpbmtzY2FwZTp2ZXJzaW9uPSIwLjkyLjIgNWMzZTgwZCwgMjAxNy0wOC0wNiINCiAgIGlua3NjYXBlOmV4cG9ydC1maWxlbmFtZT0iUmVnZW4uc3ZnIj4NCiAgPGRlZnMNCiAgICAgaWQ9ImRlZnMxMDI0OSI+DQogICAgPGlua3NjYXBlOnBhdGgtZWZmZWN0DQogICAgICAgZWZmZWN0PSJza2VsZXRhbCINCiAgICAgICBpc192aXNpYmxlPSJ0cnVlIg0KICAgICAgIHBhdHRlcm49Ik0gMCw1IEMgMCwyLjI0IDIuMjQsMCA1LDAgNy43NiwwIDEwLDIuMjQgMTAsNSAxMCw3Ljc2IDcuNzYsMTAgNSwxMCAyLjI0LDEwIDAsNy43NiAwLDUgWiINCiAgICAgICBjb3B5dHlwZT0ic2luZ2xlX3N0cmV0Y2hlZCINCiAgICAgICBwcm9wX3NjYWxlPSIwLjI2NDU4MzM0Ig0KICAgICAgIHNjYWxlX3lfcmVsPSJmYWxzZSINCiAgICAgICBzcGFjaW5nPSIwIg0KICAgICAgIG5vcm1hbF9vZmZzZXQ9IjAiDQogICAgICAgdGFuZ19vZmZzZXQ9IjAiDQogICAgICAgcHJvcF91bml0cz0iZmFsc2UiDQogICAgICAgdmVydGljYWxfcGF0dGVybj0iZmFsc2UiDQogICAgICAgZnVzZV90b2xlcmFuY2U9IjAiIC8+DQogIDwvZGVmcz4NCiAgPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCiAgICAuYWxsZm9ybXMge2ZpbGwtb3BhY2l0eToxO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxfQ0KICAgIC5iYWNrQ29sb3Ige2FuaW1hdGlvbjogY29sb3JCYWNrIDVzIGxpbmVhciBpbmZpbml0ZTt9DQoJICBAa2V5ZnJhbWVzIGNvbG9yQmFjayB7IDAlIHtmaWxsOiAjMDQwMDZDO30gNTAlIHtmaWxsOiAjMjgzMEZGO30gMTAwJSB7ZmlsbDogIzA0MDA2Qzt9IH0NCiAgICAuRmFjZUJvdHRvbSB7YW5pbWF0aW9uOiBGYWNlQm90dG9tQ29sb3IgNXMgbGluZWFyIGluZmluaXRlO30NCgkgIEBrZXlmcmFtZXMgRmFjZUJvdHRvbUNvbG9yIHsgMCUge2ZpbGw6ICMwNDAwNkM7fSA1MCUge2ZpbGw6ICMwMEZGRTg7fSAxMDAlIHtmaWxsOiAjMDQwMDZDO30gfQ0KICAgIC5GYWNlVG9wIHthbmltYXRpb246IEZhY2VUb3BDb2xvciA1cyBsaW5lYXIgaW5maW5pdGU7fQ0KCSAgQGtleWZyYW1lcyBGYWNlVG9wQ29sb3IgeyAwJSB7ZmlsbDogIzA0MDA2Qzt9IDUwJSB7ZmlsbDogI0VFMEMwRTt9IDEwMCUge2ZpbGw6ICMwNDAwNkM7fSB9DQogICAgIC5EaXNrVG9wIHthbmltYXRpb246IERpc2tUb3BDb2xvciA1cyBsaW5lYXIgaW5maW5pdGU7fQ0KICAgICBAa2V5ZnJhbWVzIERpc2tUb3BDb2xvciB7IDAlIHtmaWxsOiAjMDQwMDZDO30gNTAlIHtmaWxsOiAjQ0ZGMEVCO30gMTAwJSB7ZmlsbDogIzA0MDA2Qzt9IH0NCiAgICAgLkRpc2tCb3R0b20ge2FuaW1hdGlvbjogRGlza0JvdHRvbUNvbG9yIDVzIGxpbmVhciBpbmZpbml0ZTt9DQogICAgIEBrZXlmcmFtZXMgRGlza0JvdHRvbUNvbG9yIHsgMCUge2ZpbGw6ICMwNDAwNkM7fSA1MCUge2ZpbGw6ICNGQUVCRjA7fSAxMDAlIHtmaWxsOiAjMDQwMDZDO30gfQ0KIDwvc3R5bGU+DQogIDxnPg0KICAgIDxyZWN0IGNsYXNzPSJiYWNrQ29sb3IiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz4NCiAgPC9nPg0KICA8Zw0KICAgICBpbmtzY2FwZTpsYWJlbD0iQ2FscXVlIDEiDQogICAgIGlua3NjYXBlOmdyb3VwbW9kZT0ibGF5ZXIiDQogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTg3KSI+DQogICAgPHBhdGgNCgkgICBjbGFzcz0iYWxsZm9ybXMgRmFjZUJvdHRvbSINCiAgICAgICBzdHlsZT0ic3Ryb2tlOiMwNzAwMDA7c3Ryb2tlLXdpZHRoOjQiDQogICAgICAgZD0iTSAyODYuNjA1NDcgMzMuMTgzNTk0IEMgMjM5LjkxNjI1IDMzLjA3MzEyOSAyMDEuMzkwNjIgMzQuMzE0NDUzIDIwMS4zOTA2MiAzNC4zMTQ0NTMgQyAxOTQuNjE2MjUgMzQuMDcwNzQ5IDE4OC4xMjkwNSAzNC4wMDk3NjYgMTgxLjg3MTA5IDM0LjAwOTc2NiBDIDU1LjczMzUyNCAzNC4xOTI2NTcgNDEuNzgxNzIgMjkuODQ2OTU3IDQxLjY2OTkyMiA3NS40MTk5MjIgQyA0MS4zMjUyMjkgMjE1LjgyNzAzIDQzLjk2MzI3NyAzNzcuMDg1MTIgNDQuOTM5NDUzIDU1Ny42OTkyMiBDIDczLjcwMzUxIDUyNS45MDE4MyAxMTQuNDA5OTMgNTA3Ljc1MDIzIDE1Ny4wNjgzNiA1MDcuNjg5NDUgQyAyNDEuMTIxODggNTA3LjY4OTQ1IDMwOS4yNzE0OCA1NzYuNDYxODkgMzA5LjI3MTQ4IDY2MS4yNTU4NiBDIDMwOS4yNzE0OCA2OTcuNjgzNDQgMjk2LjQxMDIgNzMyLjk1MzE3IDI3My4wNDI5NyA3NjAuNjY5OTIgQyAzODUuMzQ0MTUgNzY1Ljk2OTQ2IDQ5Ny41MjkzIDc1My43ODcxMSA0OTcuNTI5MyA3NTMuNzg3MTEgQyA0OTcuNTI5MyA3NTMuNzg3MTEgNDU3Ljc5OSA2MTUuMzg2OTcgNDQ1LjE2Nzk3IDU2My43MzA0NyBDIDQ0MS4wOTE1MiA1NzguMjI4MjggNDQyLjUyNzQ0IDcwOS44MDY5NCA0MzQuODMzOTggNjkwLjk4NDM4IEMgNDI3LjcxNDkgNjM0LjAyODMzIDQyOC40MDQ5MSA2MjYuMjkwNzggNDE4LjkzMTY0IDU2NS4zMTQ0NSBDIDQxMi41MDExMSA1NTUuODExMjggMzkxLjYwMTM1IDU2Ny42OTA0MiAzODYuODM1OTQgNTU3LjIxMjg5IEMgMzY4LjI5MTY5IDUwNC4wMzM0NiAzODkuNDc4NTIgNDg0LjQxNzk3IDM4OS40Nzg1MiA0ODQuNDE3OTcgQyAzNTIuMzMxNSA1MDEuNzc4ODUgMjk5LjY4MzIyIDQ4NS41MTQ5MSAyODQuMTgxNjQgNDc3LjUzNTE2IEMgMjc4LjE1MzMzIDQ3NC40MjgzOCAzNzYuODQ2NTEgNDc4LjUxMDU0IDM2OC4yMzQzOCA0NzYuODA0NjkgQyAzMjguNzMzNyA0NjguOTQ2NTYgMjgzLjU0ODgzIDQ2MC43MjI2NiAyODMuNTQ4ODMgNDYwLjcyMjY2IEMgMjg1LjYxNTMyIDQ0OC44NDQyNCAzNjguMjM0NjcgNDc2LjgwNDk0IDM4OS43MDcwMyA0NTkuNjI2OTUgQyAzODkuNzA3MDMgNDU5LjYyNjk1IDM0My4yMDE3MiA0MjkuNDcyMjggMzQ3LjUwNzgxIDQzMC4yNjM2NyBDIDM3My44NjA2MSA0MzQuOTU0NzEgMzkwLjc0MDYzIDQ0NC4yMTUxMyAzOTMuNDk2MDkgNDQzLjExOTE0IEMgNDAxLjc2NCA0MzkuODI5NTIgMzg5Ljc2NTE0IDQ0Mi42OTE0IDQwMi4xMDkzOCA0MjguMTMyODEgQyA0MDcuMTYxNTQgNDIyLjE2Mjk0IDQwOC40ODA1NyA0MTIuOTAzODQgNDE0LjU2NjQxIDQxMS42MjUgQyA0MTguMjk4MDggNDEwLjgzMjY2IDQyMi40OTAyMyA0MTEuODY5MTQgNDIyLjQ5MDIzIDQxMS44NjkxNCBDIDQyMi40OTAyMyA0MTEuODY5MTQgNDcwLjcxNzk5IDQyNC4xNzQwNCA0ODEuNTExNzIgNDE1LjE1ODIgQyA1MDQuOTM2NDQgMzk1LjU0MzI1IDQ4Ny43Njg4NiAzOTIuMDcwMTUgNTAzLjkwMjM0IDM4My43MjQ2MSBDIDUxNi41MzI5MiAzNzcuMjA3MDggNTI3LjU1NzggMzgyLjgxMjEyIDUyOC4zNjEzMyAzNzAuMzI0MjIgQyA1MjguOTkyNzcgMzYwLjI3MzMyIDUwNi42NTg2OSAzNjUuNDUxNjEgNTA2LjMxNDQ1IDM1My44MTY0MSBDIDUwNC45MzY1MSAzMDguMDY4OTcgNTM5LjcyOTIxIDMwNS45OTczNiA1NDIuNzE0ODQgMjk5LjI5Njg4IEMgNTQ1LjcwMDQ4IDI5Mi41MzUxNSA1MzAuMDgzODkgMjgyLjg0ODUyIDUzMi44Mzk4NCAyNzkuNDk4MDUgQyA1MzUuNjUyODcgMjc2LjE0NzYxIDU1NC41OTk2MSAyNjAuNDMxNjQgNTU0LjU5OTYxIDI2MC40MzE2NCBDIDU1NC41OTk2MSAyNjAuNDMxNjQgNTU4LjYxODEgMjUzLjAwMDg3IDU0OS43MTg3NSAyNDIuODg4NjcgQyA1MjQuOTE2MDUgMjE0LjgwNzA1IDUyMy40MjM4MyAxNTguNTIxNDggNTIzLjQyMzgzIDE1OC41MjE0OCBMIDUzMy45ODgyOCAxNTguMDkzNzUgQyA1MzMuOTg4MjggMTU4LjA5Mzc1IDU0MS4yMjE4MiAxNTIuNDkwNzIgNTM0LjYxOTE0IDE0OC41MzEyNSBDIDUyOC4wMTY5MSAxNDQuNTExIDUyMS44NzQxNSAxNDUuMDU5MyA1MjEuOTMxNjQgMTM3LjIwMTE3IEMgNTIxLjk4OTA5IDEyOS4yODIyMyA1MTMuODM0OTcgNzEuMDQ1MTY4IDQ0Mi42NDI1OCA0NS44MjYxNzIgQyA0MjAuMTU3ODMgMzUuNzAwOTU5IDM0Ni42MzQ0NyAzMy4zMjU2MiAyODYuNjA1NDcgMzMuMTgzNTk0IHogTSA5OC45NjQ4NDQgMTc0LjkxOTkyIEwgMTYxLjA4NTk0IDE3NS4zNDU3IEMgMTYxLjQ4Nzc0IDE3NS4zNDU3IDE2MS44OTExNyAxNzUuNDA3OSAxNjIuMjkyOTcgMTc1LjQ2ODc1IEwgMjg5LjUyMTQ4IDE3Ni4zODI4MSBDIDMwMi4yNjcxMSAxNzYuNDQzMTMgMzEyLjQ4NTYxIDE4OS40NzkyMyAzMTIuMzcxMDkgMjA1LjUgTCAzMTIuMzcxMDkgMjA3LjkzNTU1IEMgMzEyLjMxMzUzIDIyMy45NTYzMiAzMDEuOTIxNDEgMjM2LjgxMDg1IDI4OS4xNzU3OCAyMzYuNzUgTCAxNjAuNzQyMTkgMjM2LjMyMjI3IEwgOTguNjIxMDk0IDIzNS44OTY0OCBDIDkzLjEwOTYzNSAyMzUuODM1NzEgODguNzQ1Mjg2IDIzMC4yOTE1NSA4OC44MDI3MzQgMjIzLjQwODIgQyA4OC44MDI3MzQgMjE2LjU4NTY2IDkzLjI4MTk0MSAyMTEuMDQyNjcgOTguNzM2MzI4IDIxMS4xMDM1MiBMIDI0Ni4yODkwNiAyMTIuOTkyMTkgQyAyNTEuOTE1NjEgMjEzLjA1MyAyNTYuNDUwMzYgMjEzLjk2NjYzIDI1Ni41MDc4MSAyMDYuOTAwMzkgTCAyNTYuNTA3ODEgMjA1LjgwNDY5IEMgMjU2LjUwNzgxIDE5OC43Mzg5NCAyNTEuOTcyMjEgMTk5LjY1MDY5IDI0Ni4zNDU3IDE5OS41ODk4NCBMIDk4Ljg0OTYwOSAxOTkuODMzOTggQyA5My4zMzgxNTEgMTk5Ljc3MjY4IDg4Ljk3NTc1NCAxOTQuMjI5MDUgODkuMDMzMjAzIDE4Ny4zNDU3IEMgODkuMDkwMjY3IDE4MC41ODQ3NyA5My4zOTU0ODkgMTc1LjEwMzg0IDk4LjczNDM3NSAxNzQuOTgwNDcgQyA5OC44NDgwMSAxNzQuOTgwNDcgOTguOTA3ODA0IDE3NC45ODAzNCA5OC45NjQ4NDQgMTc0LjkxOTkyIHogTSA5Ny43NjU2MjUgMjYzLjE1ODIgQyA5Ny44MTU5NCAyNjMuMTczNDIgOTcuODc0MzgxIDI2My4yMDM5NSA5Ny45MzE2NDEgMjYzLjIzNDM4IEwgMTYwLjA1MjczIDI2My42NjAxNiBDIDE2MC40NTQ1NCAyNjMuNjYwMTYgMTYwLjg1NjAxIDI2My43MjE5NyAxNjEuMjU3ODEgMjYzLjc4MzIgTCAyODguNDI5NjkgMjY0LjU3NDIyIEMgMzAxLjE3NTczIDI2NC42MzUwMyAzMTEuMzk1NzcgMjc3LjY3MDYzIDMxMS4yODEyNSAyOTMuNjkxNDEgTCAzMTEuMjgxMjUgMjk2LjEyODkxIEMgMzExLjIyMzc2IDMxMi4xNDk2OCAzMDAuODMyMDIgMzI1LjAwMjI2IDI4OC4wODU5NCAzMjQuOTQxNDEgTCAxNTkuNjUwMzkgMzI0LjUxNTYyIEwgOTcuNTI5Mjk3IDMyNC4wODc4OSBDIDkyLjAxNzM4NSAzMjQuMDI3MDggODcuNjUzODY3IDMxOC40ODQ5MSA4Ny43MTA5MzggMzExLjYwMTU2IEMgODcuNzEwOTM4IDMwNC43NzkwMiA5Mi4xOTAxMDYgMjk5LjIzNjAyIDk3LjY0NDUzMSAyOTkuMjk2ODggTCAyNDUuMTk3MjcgMzAxLjE4NTU1IEMgMjUwLjgyMzc3IDMwMS4yNDY4MSAyNTUuMzU4NTcgMzAyLjE1OTk5IDI1NS40MTYwMiAyOTUuMDkzNzUgTCAyNTUuNDE2MDIgMjkzLjk5NjA5IEMgMjU1LjQxNjAyIDI4Ni45MzAzIDI1MC44ODA0NSAyODcuODQ0MDUgMjQ1LjI1MzkxIDI4Ny43ODMyIEwgOTcuNzU5NzY2IDI4OC4wMjczNCBDIDkyLjI0Nzg1NCAyODcuOTY2NTcgODcuODgzOTU3IDI4Mi40MjI0MSA4Ny45NDE0MDYgMjc1LjUzOTA2IEMgODcuOTk4ODkzIDI2OC43NzczIDkyLjMwNTE5MyAyNjMuMjk1OTEgOTcuNjQ0NTMxIDI2My4xNzM4MyBDIDk3LjY3MzI1NiAyNjMuMTQzNCA5Ny43MTUzMSAyNjMuMTQyOTkgOTcuNzY1NjI1IDI2My4xNTgyIHogIg0KICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuMjY0NTgzMzMsMCwwLDAuMjY0NTgzMzMsMCw4NykiIC8+DQogIDwvZz4NCiAgPGcNCiAgICAgaW5rc2NhcGU6bGFiZWw9IkNhbHF1ZSAyIg0KICAgICBpbmtzY2FwZTpncm91cG1vZGU9ImxheWVyIg0KICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC04NykiPg0KICAgIDxwYXRoDQoJICAgY2xhc3M9ImFsbGZvcm1zIEZhY2VUb3AiDQogICAgICAgZD0ibSA4My45MzM5LDEyNy43NDczNyBjIDEwLjE3MTg3LDEuNTY2ODEgNy43MDk3Myw0OS42NDA2OSAwLjIxMTQsNTEuODY2NTUgLTIuNDQ0NTc0LDIuNTk3NzYgLTY3Ljc0MzY3NywtMy4zMTM1IC02Ny43ODI4NjIsMi41NjAwOCBsIC0wLjI4MzU3OCw0Mi41MDY4NSBjIDEwLjEzNDU2LC0xNy43ODIxIDQ2LjI5MjU4NCwtMTAuOTQ1MTcgNTQuMjYzNDQ0LDEuMTA0MzcgLTEwLjM1ODM5LC0yMy4yMTYyMSA5LjMxMzk3LC0zNC44Njc4NCAyMi4zMjA4OSwtMzQuODY3ODQgNS44ODE3OCwwLjAxMjUgMTEuMTI3NzI2LDEuOTQ5NDMgMTUuNDY3NTY2LDYuMjUyMDkgMC45MjgyOCwtMS44MTgyNiAyLjg5MDY0LC0wLjE3OTE5IDEuNTExMjQsLTIuOTM2OTIgLTMuMjQwMiwtMi43ODgxOSAtMTEuOTE3NzM2LC0yMC4zMzg3NCAtNS4xNTMxLC00My43OTEyNCA0LjE0MTAxLC0xMC45MzA0IDIyLjU2OTU5LC0yNC44ODI1MSAzMi4wNDUxLC0yMS41ODcyMiBsIDEuMTA2NzIsLTAuMDI0OSBoIDMuNjQzNDggYyAwLDAgMS44OTAxMiwtMS40OTIyMSAwLjE0OTIyLC0yLjU0OTE5IC0xLjc0MDkxLC0xLjA0NDU0IC0zLjM0NTA0LC0wLjg5NTMyIC0zLjM0NTA0LC0yLjk5Njg0IDAsLTIuMTAxNTIgLTIuMjM4MywtMTcuNTQ1ODUgLTIwLjk1MzA0LC0yNC4xMjM5OSAtMTAuNDIwNTcsLTMuNjU1OTIgLTQyLjM0Mzg5MSwtMy4yNDA1MTQgLTQyLjM0Mzg5MSwtMy4yNDA1MTQgLTIyLjUzNDc3LDAuMjkzMTQ4IC0zMC43NDA1NDMsMC4wMzk4OSAtNTQuMjg0NDk1LDAuNDAzNDc0IC04Ljg5MTAxLDAuOTMxMzIgLTUuMjU1OTgsMTAuODk2NzggLTAuOTg0MDMsMTAuNjQ3NDIgbCA2My43NTM1MiwtMC4zODMyOSBjIDYuMTQ2MjcsMC4yNzYxOCA1Ljc2ODY2LDEwLjIxMDc2IDEuMzQxMjgsOS43MjA4MyAwLDAgLTQzLjY3ODgzLC0wLjQyOTc2IC02NC4xMDI2NCwwLjE5ODk2IC04LjI2NzQzLDAuMjU0NDIgLTUuMjYxMDEsMTAuNzc0ODMgLTAuMjIzODMsMTAuODU1NzkgMjEuMjExODIsMC4zNDA3MiA2My42NDI1NCwwLjM4NTQ4IDYzLjY0MjU0LDAuMzg1NDggeiINCiAgICAgICBzdHlsZT0ic3Ryb2tlOiMwNzAwMDA7c3Ryb2tlLXdpZHRoOjEiDQogICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIgLz4NCiAgPC9nPg0KICA8Zw0KICAgICBpbmtzY2FwZTpsYWJlbD0iQ2FscXVlIDMiDQogICAgIGlua3NjYXBlOmdyb3VwbW9kZT0ibGF5ZXIiPg0KICAgIDxlbGxpcHNlDQogICAgICAgY2xhc3M9ImFsbGZvcm1zIERpc2tUb3AiDQogICAgICAgcnk9IjM0LjA2NDk0OSINCiAgICAgICByeD0iMzMuNzk5OTk5Ig0KICAgICAgIGN5PSIxNzMuNzE0MjkiDQogICAgICAgY3g9IjQyLjMzMzMzMiINCiAgICAgICBzdHlsZT0ic3Ryb2tlOiMwMDAwMDA7c3Ryb2tlLXdpZHRoOjEiDQoJICAgLz4NCiAgPC9nPg0KICA8Zw0KICAgICBpbmtzY2FwZTpsYWJlbD0iQ2FscXVlIDQiDQogICAgIGlua3NjYXBlOmdyb3VwbW9kZT0ibGF5ZXIiPg0KICAgIDxlbGxpcHNlDQogICAgICAgY2xhc3M9ImFsbGZvcm1zIERpc2tCb3R0b20iDQogICAgICAgc3R5bGU9InN0cm9rZTojMDAwMDAwO3N0cm9rZS13aWR0aDowLjA4ODYyNjY1Ig0KICAgICAgIGN4PSI0Mi4zMzMzMzIiDQogICAgICAgY3k9IjE3My43MTQyOSINCiAgICAgICByeD0iMjIuNzI4NjU5Ig0KICAgICAgIHJ5PSIyMi45MDY4MjIiDQoJICAgLz4NCiAgPC9nPg0KPC9zdmc+DQo=';
    tx(writeContracts.Loogies.mintItem(tataSVG));
  }
  
  const [clicked, setClicked] = useState('PopupColor NoPopupColor');

  let affColorPopup = false;
  //let svgNumForm = 0;
  //let svgSpeed = [3, 7, 10, 11, 13];
  //                    FACE TOP ;          FACE BOTTOM ;         BACKGROUND ;            DISK BOTTOM ;         DISK TOP
  //let svgColor = ['#04006C', '#EE0C0E', '#04006C', '#00FFE8', '#04006C', '#2830FF' , '#04006C', '#FAEBF0', '#04006C', '#CFF0EB'];
  // FACE TOP : #04006C #640C98 #9C005E #E1005E #D3162E #EE0C0E
  // FACE BOTTOM : #04006C #0419D1 #00C4FF #00E6FF #00F8FF #00FFE8
  // BACKGROUND : #04006C #2000A2 #371BA4 #1114BF #0C0E80 #2830FF
  // DISK BOTTOM : #04006C #5647B2 #9991D1 #BBB6E0 #DDDAF0 #FAEBF0 
  // DISK TOP : #04006C #04466C #04909A #40C2AE #6FD1C2 #CFF0EB
  const colorsTabs = [
    ['#04006C', '#640C98', '#9C005E', '#E1005E', '#D3162E', '#EE0C0E'],
    ['#04006C', '#0419D1', '#00C4FF', '#00E6FF', '#00F8FF', '#00FFE8'],
    ['#04006C', '#2000A2', '#371BA4', '#1114BF', '#0C0E80', '#2830FF'],
    ['#04006C', '#5647B2', '#9991D1', '#BBB6E0', '#DDDAF0', '#FAEBF0'],
    ['#04006C', '#04466C', '#04909A', '#40C2AE', '#6FD1C2', '#CFF0EB']
  ];

  //let svgSetColorStart = '';
  //let svgSetColorEnd = '';
  const [validChange, setValidChange] = useState();

  const handleChange = (svgData, e) => {
    if (e.target.name == "speed"){
      svgSetSpeed = e.target.value;
      console.log("svgSetSpeed handleChange: ", svgSetSpeed);
    }
    if (e.target.name == "colorStart"){
      svgSetColorStart = e.target.value;
      console.log("svgSetColorStart handleChange: ", svgSetColorStart);
    }
    if (e.target.name == "colorEnd"){
      svgSetColorEnd = e.target.value;
      console.log("svgSetColorEnd handleChange: ", svgSetColorEnd);
    }

    //setValidChange(svgSetColorStart);

    /* if (svgData == 0) {
      console.log("e: ", e);
      svgSetSpeed = e.target.value;
    }
    if (svgData == 1) {
      svgSetColorStart = e.target.value;
    }
    if (svgData == 2) {
      svgSetColorEnd = e.target.value;
    } */
  }

 /*  useEffect(() => {
    // Logs `HTMLInputElement` 
    setValidChange(svgSetColorStart);
    console.log('ValidChange: ', validChange);
    //inputRef.current.focus();
  }, [onChange]); */

  const inputSpeed = useRef();

  const setColor = (numForm) => {
    //alert("Clic on setColor");
    setClicked('PopupColor');
    svgNumForm = numForm;
    console.log("numForm setColor: " + numForm);

    //console.log("inputSpeed defaultValue: " + inputSpeed.current.defaultValue);
    //inputSpeed.current.defaultValue = svgSpeed[numForm];
    //inputSpeed.current.defaultValue = numForm;
    //console.log("svgSpeed setColor: " + svgSpeed);
    //useForceRender();
    //render();

    //defaultValue

    //affColorPopup = true;
    //colorPopup();
    //setState({});
/*
    popupColor = (
      <div style={{ position: "absolute", right: 100, top: 100 }} className="PopupColor">
        <span>Popup Color</span>
      </div>
    );
*/
  }

  const validColor = () => {
    setClicked('PopupColor NoPopupColor');
    svgSpeed[svgNumForm] = svgSetSpeed;
    console.log("svgSpeed valid: ", svgSpeed);
    svgColor[(svgNumForm * 2)] = svgSetColorStart;
    console.log("svgColor valid: ", svgColor);
    svgColor[(svgNumForm * 2) + 1] = svgSetColorEnd;
    console.log("svgColor valid: ", svgColor);
  }

  // modif svg pour setColorToForm
  //console.log(this.myRef.current.getValue());


  //colorPopup
  function colorPopup() {
    if (!affColorPopup) return(''); 
    alert("colorPopup");
      return (
      <div style={{ position: "absolute", right: 100, top: 100, backgroundColor: '#ff0000' }} className="PopupColor">
        <span>Popup Color</span>
      </div>
      );
    affColorPopup = false;
  }


  const [transferToAddresses, setTransferToAddresses] = useState({});
/*   const [transferToTankId, setTransferToTankId] = useState({}); */

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header 
          address={address}
          localProvider={localProvider}
          userSigner={userSigner}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
          faucetTx={faucetTx}
          targetNetworkName={targetNetwork.name}
          targetNetworkColor={targetNetwork.color}
          gasPrice={gasPrice}/>
      {networkDisplay}

      <BrowserRouter>
        {/*
        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              Loogies
            </Link>
          </Menu.Item>
          <Menu.Item key="/loogietank">
            <Link
              onClick={() => {
                setRoute("/loogietank");
              }}
              to="/loogietank"
            >
              Loogie Tank
            </Link>
          </Menu.Item>
          <Menu.Item key="/mintloogies">
            <Link
              onClick={() => {
                setRoute("/mintloogies");
              }}
              to="/mintloogies"
            >
              Mint Loogies
            </Link>
          </Menu.Item>
          <Menu.Item key="/mintloogietank">
            <Link
              onClick={() => {
                setRoute("/mintloogietank");
              }}
              to="/mintloogietank"
            >
              Mint Loogie Tank
            </Link>
          </Menu.Item>
        </Menu> */}

        <Switch>
          <Route exact path="/">
            {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

            <Contract
              name="Loogies"
              customContract={writeContracts && writeContracts.Loogies}
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
            <Redirect from="/" to="mintloogies"/>
          </Route>
          {/* <Route exact path="/loogietank">
            <Contract
              name="LoogieTank"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </Route> data:image/svg+xml;base64,*/}
         <Route exact path="/mintloogies">

            <div style={{ maxWidth: 400, margin: "auto", paddingBottom: 10 }}>
              <div className="ListImage" style={{minHeight: 100}}>
                <img src={createSvg()} />
              </div>
            </div>

            {/*svgNumForm*/}
            <div style={{ maxWidth: 400, margin: "auto", paddingBottom: 10 }}  className={clicked} >
              <div style={{ paddingTop: 10, paddingBottom: 10 }}><h4>Animate Color</h4></div>
              <div className="row" style={{marginBottom: 10}}>
                <div className="col-6 justify-content-end" style={{ paddingRight: 10 }} ><label>Speed:</label></div>
                <div className="col-6 justify-content-start">
                  {/* <input ref={inputSpeed} style={{ color: '#000', width: '50%' }} type="number" min="0" max="30" defaultValue="8" onChange={(e) => { handleChange(0, e); }} /> */}
                  <InputSpeed svgSpeed = {svgSpeed[svgNumForm]}/>
                  {/* <input style={{ color: '#000', width: '50%' }} type="number" name="speed" min="0" max="30" defaultValue={svgSpeed[svgNumForm]} onChange={(e) => { handleChange(0, e); }} /> */}
                </div>
              </div>

              <div className="row style={{marginBottom: 5}}">
                <div className="col-6 justify-content-end"><label style={{ paddingRight: 10 }} >Color Start:</label></div>
                <div className="col-3 justify-content-start">
                  <select style={{ color: '#000', width: '90%' }} name="colorStart" defaultValue="0" onChange={(e) => { handleChange(1, e); setValidChange(0); }} >
                    {colorsTabs[svgNumForm].map(i => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                    {/* <option value={0} key={0}>
                      {'years'}
                    </option> */}

                  </select>
                  </div>
                  <div className="col-3 justify-content-start" style={{ backgroundColor: {svgSetColorStart}, minWith: 50, maxWidth: 70, border: 'solid', borderWidth: '1px', borderColor: 'white' }}>&nbsp;</div>
              </div>

              <div className="row style={{marginBottom: 5}}">
                <div className="col-6 justify-content-end"><label style={{ paddingRight: 10 }} >Color End:</label></div>
                <div className="col-3 justify-content-start">
                  <select style={{ color: '#000', width: '90%' }} name="colorEnd" defaultValue="0" onChange={(e) => { handleChange(2, e); }} >
                    {colorsTabs[svgNumForm].map(i => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                  </div>
                  <div className="col-3 justify-content-start" style={{ backgroundColor: {svgSetColorEnd}, minWith: 50, maxWidth: 70, border: 'solid', borderWidth: '1px', borderColor: 'white' }}>&nbsp;</div>
              </div>
              
              <div className="row" style={{marginBottom: 20}} >
              <div className="col-6 justify-content-end">
              <Button style={{ marginTop: 20, marginRight: 20 }} type={"primary"} onClick={() => {
                setClicked('PopupColor NoPopupColor')
              }}>Cancel</Button>
              </div>
              <div className="col-6 justify-content-start">
              <Button style={{ marginTop: 20, marginLeft: 20 }} type={"primary"} onClick={() => {
                validColor()
              }}>Valid</Button>
              </div>
              </div>

            </div>
            <div>
            {/*colorPopup()*/}
            </div>

{/*
            <div style={{ maxWidth: 400, margin: "auto", paddingBottom: 10 }}>
              <div className="ListImage" style={{minHeight: 100}}>
                <img src={createSvg()} />
              </div>
            </div>
*/}

            <div style={{ maxWidth: 800, margin: "auto" }}>
              <Button style={{ marginTop: 10 }} type={"primary"} onClick={() => {
                setColor(2)
              }}>Background Color</Button>
              <Button style={{ marginLeft: 10, marginTop: 10 }} type={"primary"} onClick={() => {
                setColor(0)
              }}>Face Top Color</Button>
              <Button style={{ marginLeft: 10, marginTop: 10 }} type={"primary"} onClick={() => {
                setColor(1)
              }}>Face Bottom Color</Button>
              <Button style={{ marginLeft: 10, marginTop: 10 }} type={"primary"} onClick={() => {
                setColor(4)
              }}>Disk Top Color</Button>
              <Button style={{ marginLeft: 10, marginTop: 10 }} type={"primary"} onClick={() => {
                setColor(3)
              }}>Disk Bottom Color</Button>
            </div>


            <div style={{ maxWidth: 400, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <Button type={"primary"} onClick={() => {
                mintItem()
                //tx(writeContracts.Loogies.mintItem())
              }}>MINT</Button>
            </div>
            {/* */}
            <div style={{ maxWidth: 400, margin: "auto", paddingBottom: 256 }}>
              <List
                /*bordered*/
                dataSource={yourLoogies}
                renderItem={item => {
                  const id = item.id.toNumber();

                  if (DEBUG) console.log("IMAGE",item.image);

                  return (
                    <div className="ListImage">
                    <List.Item key={id + "_" + item.uri + "_" + item.owner} className="justify-content-center">
                      <div>
                        <div>
                          <span style={{ fontSize: 18, marginRight: 8 }}>{item.name}</span>
                        </div>
                        <img src={item.image} />
                        <div>{item.description}</div>
                      </div>

                      {/* <div>
                        owner:{" "}
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <AddressInput
                          ensProvider={mainnetProvider}
                          placeholder="transfer to address"
                          value={transferToAddresses[id]}
                          onChange={newValue => {
                            const update = {};
                            update[id] = newValue;
                            setTransferToAddresses({ ...transferToAddresses, ...update });
                          }}
                        />
                        <Button
                          onClick={() => {
                            console.log("writeContracts", writeContracts);
                            tx(writeContracts.Loogies.transferFrom(address, transferToAddresses[id], id));
                          }}
                        >
                          Transfer
                        </Button>
                        <br/><br/>
                        Transfer to Loogie Tank:{" "}
                        <Address
                          address={readContracts.LoogieTank.address}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <Input
                          placeholder="Tank ID"
                          // value={transferToTankId[id]}
                          onChange={newValue => {
                            console.log("newValue", newValue.target.value);
                            const update = {};
                            update[id] = newValue.target.value;
                            setTransferToTankId({ ...transferToTankId, ...update});
                          }}
                        />
                        <Button
                          onClick={() => {
                            console.log("writeContracts", writeContracts);
                            console.log("transferToTankId[id]", transferToTankId[id]);
                            console.log(parseInt(transferToTankId[id]));

                            const tankIdInBytes = "0x" + parseInt(transferToTankId[id]).toString(16).padStart(64,'0');
                            console.log(tankIdInBytes);

                            tx(writeContracts.Loogies["safeTransferFrom(address,address,uint256,bytes)"](address, readContracts.LoogieTank.address, id, tankIdInBytes));
                          }}>
                          Transfer
                        </Button>
                      </div> */}
                    </List.Item>
                    </div>
                  );
                }}
              />
            </div>
            {/* */}

            
          </Route>
           {/* <Route exact path="/mintloogietank"> */}
            {/*<div style={{ maxWidth: 820, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <Button type={"primary"} onClick={() => {
                tx(writeContracts.LoogieTank.mintItem())
              }}>MINT</Button>
              <Button onClick={() => updateLoogieTanks()}>Refresh</Button>
            </div>

             <div style={{ width: 820, margin: "auto", paddingBottom: 256 }}>
              <List
                bordered
                dataSource={yourLoogieTanks}
                renderItem={item => {
                  const id = item.id.toNumber();

                  console.log("IMAGE",item.image);

                  return (
                    <List.Item key={id + "_" + item.uri + "_" + item.owner}>
                      <Card
                        title={
                          <div>
                            <span style={{ fontSize: 18, marginRight: 8 }}>{item.name}</span>
                          </div>
                        }
                      >
                        <img src={item.image} />
                        <div>{item.description}</div>
                      </Card>

                      <div>
                        owner:{" "}
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <AddressInput
                          ensProvider={mainnetProvider}
                          placeholder="transfer to address"
                          value={transferToAddresses[id]}
                          onChange={newValue => {
                            const update = {};
                            update[id] = newValue;
                            setTransferToAddresses({ ...transferToAddresses, ...update });
                          }}
                        />
                        <Button
                          onClick={() => {
                            console.log("writeContracts", writeContracts);
                            tx(writeContracts.Loogies.transferFrom(address, transferToAddresses[id], id));
                          }}
                        >
                          Transfer
                        </Button>
                        <br/><br/>
                        <Button
                          onClick={() => {
                            tx(writeContracts.LoogieTank.returnAllLoogies(id))
                          }}>
                          Eject Loogies
                        </Button>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div> */}
         {/*  </Route> */}
        </Switch>
      </BrowserRouter>

      <ThemeSwitch />

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      {/* <div style={{position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userSigner={userSigner}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
        {faucetHint}
      </div> */}

    </div>
  );
}

export default App;