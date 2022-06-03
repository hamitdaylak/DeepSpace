import React, { Component } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./bootstrap/css/bootstrap.css";
import "./App.css";
import Web3 from "web3";
import Marketplace from "../abis/Marketplace.json";

import FormAndPreview from "../components/FormAndPreview/FormAndPreview";
import Explore from "./Explore/Explore";
import Home from "./Home/Home";
import ContractNotDeployed from "./ContractNotDeployed/ContractNotDeployed";
import ConnectToMetamask from "./ConnectMetamask/ConnectToMetamask";
import Loading from "./Loading/Loading";
import Navbar from "./Navbar/Navbar";
import MyNFTs from "./MyNFTs/MyNFTs";
import Queries from "./Queries/Queries";
import Profile from "./Profile/Profile";
import Settings from "./Profile/profile-setting";
import NoPage from "./pages/NoPage/NoPage";
import NFTDetails from "./NFTDetails/NFTDetail";

const ipfsClient = require("ipfs-http-client");
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accountAddress: "",
      accountBalance: "",
      NFTContract: null,
      NFTCount: 0,
      NFTs: [],
      loading: true,
      metamaskConnected: false,
      contractDetected: false,
      totalTokensMinted: 0,
      totalTokensOwnedByAccount: 0,
      nameIsUsed: false,
      imageIsUsed: false,
      imageHash: "",
      lastMintTime: null,
    };
  }

  componentWillMount = async () => {
    await this.loadWeb3();
    await this.loadBlockchainData();
    await this.setMetaData();
    await this.setMintBtnTimer();
  };

  setMintBtnTimer = () => {
    const mintBtn = document.getElementById("mintBtn");
    if (mintBtn !== undefined && mintBtn !== null) {
      this.setState({
        lastMintTime: localStorage.getItem(this.state.accountAddress),
      });
      this.state.lastMintTime === undefined || this.state.lastMintTime === null
        ? (mintBtn.innerHTML = "Mint NFT")
        : this.checkIfCanMint(parseInt(this.state.lastMintTime));
    }
  };

  checkIfCanMint = (lastMintTime) => {
    const mintBtn = document.getElementById("mintBtn");
    const timeGap = 30000; //5min in milliseconds
    const countDownTime = lastMintTime + timeGap;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = countDownTime - now;
      if (diff < 0) {
        mintBtn.removeAttribute("disabled");
        mintBtn.innerHTML = "Mint NFT";
        localStorage.removeItem(this.state.accountAddress);
        clearInterval(interval);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        mintBtn.setAttribute("disabled", true);
        mintBtn.innerHTML = `Next mint in ${minutes}m ${seconds}s`;
      }
    }, 1000);
  };

  loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  };

  loadBlockchainData = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      this.setState({ metamaskConnected: false });
    } else {
      this.setState({ metamaskConnected: true });
      this.setState({ loading: true });
      this.setState({ accountAddress: accounts[0] });
      let accountBalance = await web3.eth.getBalance(accounts[0]);
      accountBalance = web3.utils.fromWei(accountBalance, "Ether");
      this.setState({ accountBalance });
      this.setState({ loading: false });
      const networkId = await web3.eth.net.getId();
      const networkData = Marketplace.networks[networkId];
      if (networkData) {
        this.setState({ loading: true });
        const NFTContract = web3.eth.Contract(
          Marketplace.abi,
          networkData.address
        );
        this.setState({ NFTContract });
        this.setState({ contractDetected: true });
        const NFTCount = await NFTContract.methods.NFTCounter().call();
        this.setState({ NFTCount });
        for (var i = 1; i <= NFTCount; i++) {
          const nft = await NFTContract.methods.allNFTs(i).call();
          this.setState({
            NFTs: [...this.state.NFTs, nft],
          });
        }
        let totalTokensMinted = await NFTContract.methods
          .getNumberOfTokensMinted()
          .call();
        totalTokensMinted = totalTokensMinted.toNumber();
        this.setState({ totalTokensMinted });
        let totalTokensOwnedByAccount = await NFTContract.methods
          .getTotalNumberOfTokensOwnedByAnAddress(this.state.accountAddress)
          .call();
        totalTokensOwnedByAccount = totalTokensOwnedByAccount.toNumber();
        this.setState({ totalTokensOwnedByAccount });
        this.setState({ loading: false });
      } else {
        this.setState({ contractDetected: false });
      }
    }
  };

  connectToMetamask = async () => {
    await window.ethereum.enable();
    this.setState({ metamaskConnected: true });
    window.location.reload();
  };

  setMetaData = async () => {
    if (this.state.NFTs.length !== 0) {
      this.state.NFTs.map(async (nft) => {
        const result = await fetch(nft.tokenURI);
        const metaData = await result.json();
        this.setState({
          NFTs: this.state.NFTs.map((nft) =>
            nft.tokenId.toNumber() === Number(metaData.tokenId)
              ? {
                  ...nft,
                  metaData,
                }
              : nft
          ),
        });
      });
    }
  };

  mintMyNFT = async (fileUrl, name, tokenPrice) => {
    this.setState({ loading: true });

    console.log(fileUrl);
    const nameIsUsed = await this.state.NFTContract.methods
      .tokenNameExists(name)
      .call();

    const imageIsUsed = await this.state.NFTContract.methods
      .tokenImageExists(fileUrl)
      .call();

    if (!nameIsUsed && !imageIsUsed) {
      let previousTokenId;
      previousTokenId = await this.state.NFTContract.methods
        .NFTCounter()
        .call();
      previousTokenId = previousTokenId.toNumber();
      const tokenId = previousTokenId + 1;
      const tokenObject = {
        tokenName: "BugEaters",
        tokenSymbol: "NFT",
        tokenId: `${tokenId}`,
        name: name,
        imageUrl: fileUrl,
      };
      const cid = await ipfs.add(JSON.stringify(tokenObject));
      let tokenURI = `https://ipfs.infura.io/ipfs/${cid.path}`;
      const price = window.web3.utils.toWei(tokenPrice.toString(), "ether");
      this.state.NFTContract.methods
        .mintNFT(name, tokenURI, price, fileUrl)
        .send({ from: this.state.accountAddress })
        .on("confirmation", () => {
          localStorage.setItem(this.state.accountAddress, new Date().getTime());
          this.setState({ loading: false });
          window.location.reload();
        });
    } else {
      if (nameIsUsed) {
        this.setState({ nameIsUsed: true });
        this.setState({ loading: false });
      } else if (imageIsUsed) {
        this.setState({ imageIsUsed: true });
        this.setState({ loading: false });
      }
    }
  };

  toggleForSale = (tokenId) => {
    this.setState({ loading: true });
    this.state.NFTContract.methods
      .toggleForSale(tokenId)
      .send({ from: this.state.accountAddress })
      .on("confirmation", () => {
        this.setState({ loading: false });
        window.location.reload();
      });
  };

  changeTokenPrice = (tokenId, newPrice) => {
    this.setState({ loading: true });
    const newTokenPrice = window.web3.utils.toWei(newPrice, "Ether");
    this.state.NFTContract.methods
      .changeTokenPrice(tokenId, newTokenPrice)
      .send({ from: this.state.accountAddress })
      .on("confirmation", () => {
        this.setState({ loading: false });
        window.location.reload();
      });
  };

  buyNFT = (tokenId, price) => {
    this.setState({ loading: true });
    this.state.NFTContract.methods
      .buyToken(tokenId)
      .send({ from: this.state.accountAddress, value: price })
      .on("confirmation", () => {
        this.setState({ loading: false });
        window.location.reload();
      });
  };

  render() {
    return (
      <>
        {!this.state.metamaskConnected ? (
          <ConnectToMetamask connectToMetamask={this.connectToMetamask} />
        ) : !this.state.contractDetected ? (
          <ContractNotDeployed />
        ) : this.state.loading ? (
          <Loading />
        ) : (
          <>
            <BrowserRouter>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Navbar
                      accountAddress={this.state.accountAddress}
                      accountBalance={this.state.accountBalance}
                    />
                  }
                >
                  <Route index element={<Home />} />
                  <Route
                    path="marketplace"
                    element={
                      <Explore
                        accountAddress={this.state.accountAddress}
                        AllNFT={this.state.NFTs}
                        totalTokensMinted={this.state.totalTokensMinted}
                      />
                    }
                  />
                  <Route
                    path="queries"
                    element={<Queries NFTsContract={this.state.NFTContract} />}
                  />
                  <Route
                    path="mint"
                    element={
                      <FormAndPreview
                        mintMyNFT={this.mintMyNFT}
                        nameIsUsed={this.state.nameIsUsed}
                        imageIsUsed={this.state.imageIsUsed}
                        setMintBtnTimer={this.setMintBtnTimer}
                      />
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <Profile
                      // accountAddress={this.state.accountAddress}
                      // NFTs={this.state.NFTs}
                      // totalTokensOwnedByAccount={
                      //   this.state.totalTokensOwnedByAccount
                      // }
                      />
                    }
                  />
                  <Route
                    path="profile/settings"
                    element={
                      <Settings
                      // accountAddress={this.state.accountAddress}
                      // NFTs={this.state.NFTs}
                      // totalTokensOwnedByAccount={
                      //   this.state.totalTokensOwnedByAccount
                      // }
                      />
                    }
                  />
                  <Route
                    path="assets/details/:id"
                    element={
                      <NFTDetails
                        accountAddress={this.state.accountAddress}
                        AllNFT={this.state.NFTs}
                        changeTokenPrice={this.changeTokenPrice}
                        toggleForSale={this.toggleForSale}
                        buyNFT={this.buyNFT}
                      />
                    }
                  />
                  <Route path="*" element={<NoPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </>
        )}
      </>
    );
  }
}

export default App;