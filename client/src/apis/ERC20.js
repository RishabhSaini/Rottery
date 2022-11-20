import { ethers } from "ethers";

//All function calls to MOKToken
export const getAccountSigner = async (web3Provider) => {
  return await web3Provider.getSigner();
};

//Store instance of the MOKToken Contract
export const getERC20Contract = (address, abi, signerOrProvider) => {
  return new ethers.Contract(address, abi, signerOrProvider);
};

//Wait on the approve function instead of listening
export const approveERC20 = async (contract, spenderAddress, price) => {
  const txAwaiting = await contract.approve(spenderAddress, price);
  return await txAwaiting.wait();
};
