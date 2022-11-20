import React, { useContext, useEffect, useState } from "react";
import { TransactionContext } from "../context/ContractContext";

const Lottery = (props) => {
  const {
    formData,
    formPrice,
    handleChange,
    sendTx,
    setPriceTx,
    sendDraw,
    handleInputPrice,
  } = useContext(TransactionContext);

  const handleSubmit = (e) => {
    const { noTickets } = formData;
    e.preventDefault();
    if (!noTickets) return;
    sendTx(props.index, props.price);
  };

  const setPrice = (e) => {
    const { price } = formPrice;
    e.preventDefault();
    if (!price) return;
    setPriceTx(props.index);
  };

  const handleDraw = (e) => {
    e.preventDefault();
    sendDraw(props.index);
  };

  return (
    <div>
      <div>
        <strong>Welcome to Lottery {props.index}</strong>
      </div>
      <div>Current Jackpot: {props.prize} </div>
      <div>Previous Jackpot: {props.prevPrize}</div>
      <div>Winning Ticket: {props.winner}</div>
      <div>Ticket Price: {props.price} MOK</div>
      <button type="button" onClick={handleDraw}>
        Draw
      </button>
      <div>Locked Until: {props.lockedUntil}</div>

      <div>
        Number of Tickets:
        <input
          name="noTickets"
          type="number"
          min="1"
          onChange={handleChange}
        ></input>
        <button type="button" onClick={handleSubmit}>
          Purchase
        </button>
      </div>

      <div>
        Ticket Price To:
        <input
          name="inputPrice"
          type="number"
          min="1"
          onChange={handleInputPrice}
        ></input>
        <button type="button" onClick={setPrice}>
          Set Price
        </button>
      </div>
    </div>
  );
};

export default Lottery;
