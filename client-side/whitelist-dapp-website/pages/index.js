import Head from "next/head";
import Image from "next/image";
import imageurl from "../public/3dAsset.webp";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // numberOfWhitelisted tracks the number of addresses's whitelisted
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const addAddressToWhitelist = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the addAddressToWhitelist from the contract
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      // get the updated number of addresses in the whitelist
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (err) {
      console.error(err);
    }
  };
  const getNumberOfWhitelisted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // call the numAddressesWhitelisted from the contract
      const _numberOfWhitelisted =
        await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (err) {
      console.error(err);
    }
  };

  const checkIfAddressInWhitelist = async () => {
    try {
      // We will need the signer later to get the user's address
      // Even though it is a read transaction, since Signers are just special kinds of Providers,
      // We can use it in it's place
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      // call the whitelistedAddresses from the contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      );
      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
  };
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);

      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    } catch (err) {
      console.error(err);
    }
  };

  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <button className="mx-auto bg-blue-600 px-5 py-4 rounded-md shadow-md hover:opacity-0.8 cursor-pointer text-white">
            Thanks for Joining the Whitelist
          </button>
        );
      } else if (loading) {
        return (
          <button className="mx-auto bg-blue-600 px-5 py-4 rounded-md shadow-md hover:opacity-0.8 cursor-pointer text-white">
            Loading ...
          </button>
        );
      } else {
        return (
          <button
            onClick={addAddressToWhitelist}
            className="mx-auto bg-blue-600 px-5 py-4 rounded-md shadow-md hover:opacity-0.8 cursor-pointer text-white"
          >
            Join the Whitelist
          </button>
        );
      }
    } else {
      return (
        <button
          onClick={connectWallet}
          className="mx-auto bg-blue-600 px-5 py-4 rounded-md shadow-md hover:opacity-0.8 cursor-pointer text-white"
        >
          Connect your Wallet
        </button>
      );
    }
  };
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Whitelist DApp</title>
        <meta name="description" content="A Whitelist DApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="absolute inset-0 my-8 mx-5 rounded-md flex flex-col justify-around md:flex-row md:content-center">
        <div className="flex justify-center">
          <ul className="flex flex-col py-10 content-between text-left justify-center">
            <li className="font-bold text-center text-xl md:text-3xl md:my-10">
              Welcome to Block Devs!
            </li>
            <li className="px-3 my-3 text-lg md:text-xl md:my-0">
              It is an NFT collection for blockchain developers.
            </li>
            <li className="px-3 my-5 text-lg md:text-xl">
              {numberOfWhitelisted == 1
                ? " 1 has"
                : `${numberOfWhitelisted} have`}{" "}
              already joined the whitelist.
            </li>
            <li className="px-3 flex justify-center md:block">
              {renderButton()}
            </li>
          </ul>
        </div>
        <div className="sm:mx-5 sm:my-5 flex justify-center md:flex-col">
          <Image
            layout="intrinsic"
            width={400}
            height={400}
            src={imageurl}
          ></Image>
        </div>
      </div>
    </div>
  );
}
