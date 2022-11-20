import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  addMetamaskListeners,
  connectToMetamask,
  getMetamaskProvider,
  isMetamaskConnected,
} from "../apis/blockchain";

import {
  lotteryContractABI,
  lotteryGoerliContractAddress,
  tokenContractABI,
  tokenGoerliContractAddress,
} from "../constants/addresses";

export const TransactionContext = React.createContext();

export const getEthereumContract = async (contract) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  const signer = provider.getSigner();
  return contract == "lottery"
    ? new ethers.Contract(
        lotteryGoerliContractAddress,
        lotteryContractABI,
        signer
      )
    : new ethers.Contract(tokenGoerliContractAddress, tokenContractABI, signer);
};

export const TransactionProvider = ({ children }) => {
  const [connectedAccount, setConnectedAccount] = useState("");
  const [formData, setFormData] = useState({
    noTickets: "",
  });
  const [formPrice, setFormPrice] = useState({
    price: "",
  });
  const [infoLot, setInfoLot] = useState(new Map());

  const handleChange = (e) => {
    setFormData({ noTickets: e.target.value });
  };

  const handleInputPrice = (e) => {
    setFormPrice({ price: e.target.value });
  };

  const connectWallet = async () => {
    //Store Metamask provider in a state
    let provider = await getMetamaskProvider();
    let isConnected = await isMetamaskConnected(provider);
    if (isConnected) {
      try {
        let accounts = await connectToMetamask(provider);
        setConnectedAccount(accounts[0]);
        addMetamaskListeners(provider, null, null, accountsChangedCallback);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const accountsChangedCallback = async (accs) => {
    setConnectedAccount(accs[0]);
  };

  const createLottery = async () => {
    const txContract = await getEthereumContract("lottery");
    const ret = await txContract.createLottery();
    txContract.on("LotteryCreated", eventLotteryCreatedSol);
    let receipt = await ret.wait().then(function (receipt) {
      console.log(receipt);
    });
  };

  const eventLotteryCreatedSol = (h_id, h_price) => {
    console.log("in event");
    const id = parseInt(h_id._hex, 16);
    const price = parseInt(h_price._hex, 16);

    const lott = {
      id: id,
      prize: 0,
      prevPrize: "undefined",
      winner: "not drawn yet",
      price: price,
      lockedUntil: "never",
    };
    setInfoLot(new Map(infoLot.set(lott.id, lott)));
  };

  //the MOKToken is supposed to call approve. Use OpenZeppelin Method
  const sendTx = async (id, pricePerTicket) => {
    const { noTickets } = formData;
    const tokenTxContract = await getEthereumContract("token");
    const lotteryTxContract = await getEthereumContract("lottery");
    const token_ret = await tokenTxContract.approve(
      lotteryGoerliContractAddress,
      pricePerTicket * noTickets
    );
    tokenTxContract.on("Approval", eventApprovedSol);
    let token_receipt = await token_ret.wait().then(function (receipt) {
      console.log(receipt);
    });

    const lottery_ret = await lotteryTxContract.participate(id, noTickets);
    lotteryTxContract.on("PrizeIncreased", eventPrizeIncreasedSol);
    let lottery_receipt = await lottery_ret.wait().then(function (receipt) {
      console.log(receipt);
    });
  };

  const setPriceTx = async (id) => {
    const { price } = formPrice;
    console.log("in setPriceTx %d", price);
    const lotteryTxContract = await getEthereumContract("lottery");
    const lottery_ret = await lotteryTxContract.changeTicketPrice(id, price);
    lotteryTxContract.on("PriceIncreased", eventPriceIncreasedSol);
    let lottery_receipt = await lottery_ret.wait().then(function (receipt) {
      console.log(receipt);
    });
  };

  const eventPriceIncreasedSol = async (h_id, h_price) => {
    const id = parseInt(h_id._hex, 16);
    const price = parseInt(h_price._hex, 16);
    console.log("id: %d Price: %d", id, price);
    const lott = {
      id: infoLot.get(id).id,
      prize: infoLot.get(id).prize,
      prevPrize: infoLot.get(id).prevPrize,
      winner: infoLot.get(id).winner,
      price: price,
      lockedUntil: infoLot.get(id).lockedUntil,
    };
    setInfoLot(new Map(infoLot.set(id, lott)));
  };

  const eventPrizeIncreasedSol = async (h_id, h_prize) => {
    const id = parseInt(h_id._hex, 16);
    const prize = parseInt(h_prize._hex, 16);
    console.log("id: %d Prize: %d", id, prize);
    const lott = {
      id: id,
      prize: prize,
      prevPrize: "undefined",
      winner: "not drawn yet",
      price: infoLot.get(id).price,
      lockedUntil: "never",
    };
    setInfoLot(new Map(infoLot.set(id, lott)));
  };

  const eventApprovedSol = async (owner, spender, value) => {
    // Use ethersjs
    // BigNumber.from("0x2a")
    console.log("Owner: %d Spender: %d Value %d", owner, spender, value);
  };

  const sendDraw = async (id) => {
    const lotteryTxContract = await getEthereumContract("lottery");
    const token_ret = await lotteryTxContract.declareWinner(id);
    lotteryTxContract.on("WinnerDeclared", eventWinnerDeclaredSol);
    let token_receipt = await token_ret.wait().then(function (receipt) {
      console.log(receipt);
    });
  };

  const eventWinnerDeclaredSol = async (h_id, h_time, h_prize, h_winner) => {
    const id = parseInt(h_id._hex, 16);
    const time = parseInt(h_time._hex, 16);
    const prize = parseInt(h_prize._hex, 16);
    const winner = parseInt(h_winner._hex, 16);
    const lott = {
      id: id,
      prize: 0,
      prevPrize: prize,
      winner: winner,
      price: infoLot.get(id).price,
      lockedUntil: time,
    };
    console.log(lott);

    [...infoLot.keys()].map((k, index) =>
      setInfoLot(
        new Map(
          infoLot.set(k, {
            id: k,
            prize: infoLot.get(k).prize,
            prevPrize: prize,
            winner: winner,
            price: infoLot.get(id).price,
            lockedUntil: time,
          })
        )
      )
    );

    setInfoLot(new Map(infoLot.set(id, lott)));
  };

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        connectedAccount,
        formData,
        formPrice,
        handleChange,
        handleInputPrice,
        sendTx,
        setPriceTx,
        createLottery,
        infoLot,
        setInfoLot,
        sendDraw,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
