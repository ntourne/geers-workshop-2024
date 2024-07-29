import { expect } from "chai";
import { ethers } from "hardhat";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("MyToken", function () {
  // We define a fixture to reuse the same setup in every test.
  let account1: HardhatEthersSigner;
  let account2: HardhatEthersSigner;
  let account3: HardhatEthersSigner;
  const name = "TANDIL";
  const symbol = "TNDL";
  const decimals = 18;
  const initialSupply = ethers.parseUnits("100", 18);
  //   const totalSupply = BigNumber.parseUnits("1000", 18);

  let myToken: MyToken;
  beforeEach(async () => {
    [account1, account2, account3] = await ethers.getSigners();
    const myTokenFactory = await ethers.getContractFactory("MyToken");
    myToken = (await myTokenFactory.deploy(name, symbol, decimals, initialSupply)) as MyToken;
    await myToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have the correct name", async function () {
      expect(await myToken.name()).to.equal(name);
    });
    it("Should have the correct symbol", async function () {
      expect(await myToken.symbol()).to.equal(symbol);
    });
    it("Should have the correct decimals", async function () {
      expect(await myToken.decimals()).to.equal(decimals);
    });

    it("Should have the correct total supply", async function () {
      expect(await myToken.totalSupply()).to.equal(initialSupply);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseUnits("50", 18);
      await myToken.transfer(account2.address, transferAmount);
      expect(await myToken.balanceOf(account1.address)).to.equal(initialSupply - transferAmount);
      expect(await myToken.balanceOf(account2.address)).to.equal(transferAmount);
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await myToken.balanceOf(account1.address);
      const transferAmount = ethers.parseUnits("2000", 18);
      await expect(myToken.transfer(account2.address, transferAmount)).to.be.revertedWith(
        "ERC20: transfer amount exceeds balance",
      );
      expect(await myToken.balanceOf(account1.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      await myToken.transfer(account2.address, transferAmount);
      await myToken.connect(account2).transfer(account3.address, transferAmount);
      expect(await myToken.balanceOf(account1.address)).to.equal(initialSupply - transferAmount);
      expect(await myToken.balanceOf(account2.address)).to.equal(0);
      expect(await myToken.balanceOf(account3.address)).to.equal(transferAmount);
    });
  });

  describe("Approvals", function () {
    it("Should approve tokens for delegated transfer", async function () {
      const approveAmount = ethers.parseUnits("100", 18);
      await myToken.approve(account2.address, approveAmount);
      expect(await myToken.allowance(account1.address, account2.address)).to.equal(approveAmount);
    });

    it("Should transfer tokens via delegate", async function () {
      const transferAmount = ethers.parseUnits("50", 18);
      await myToken.approve(account2.address, transferAmount);
      await myToken.connect(account2).transferFrom(account1.address, account3.address, transferAmount);
      expect(await myToken.balanceOf(account1.address)).to.equal(initialSupply - transferAmount);
      expect(await myToken.balanceOf(account3.address)).to.equal(transferAmount);
    });

    it("Should fail if delegated transfer exceeds allowance", async function () {
      const approveAmount = ethers.parseUnits("50", 18);
      await myToken.approve(account2.address, approveAmount);
      const transferAmount = ethers.parseUnits("60", 18);
      await expect(
        myToken.connect(account2).transferFrom(account1.address, account3.address, transferAmount),
      ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    });
  });

  describe("Mint", function () {
    it("Should mint tokens when 1 ETH is sent", async function () {
      expect(await myToken.balanceOf(account2.address)).to.equal(0);

      const ethAmount = ethers.parseEther("1");

      await myToken.mint(account2.address, {
        value: ethAmount,
      });

      const mintBalance = ethers.parseUnits("1", 18);
      expect(await myToken.totalSupply()).to.equal(initialSupply + mintBalance);
      expect(await myToken.balanceOf(account2.address)).to.equal(mintBalance);
    });

    it("Should fail to mint tokens if no ETH is sent", async function () {
      await expect(myToken.mint(account2.address)).to.be.revertedWith("ERC20: value doesn't match to mintingFee");
    });

    it("Should fail to mint tokens if ETH value doesn't match minting fee", async function () {
      await expect(myToken.mint(account2.address, { value: ethers.parseEther("0.5") })).to.be.revertedWith(
        "ERC20: value doesn't match to mintingFee",
      );
      await expect(myToken.mint(account2.address, { value: ethers.parseEther("2.5") })).to.be.revertedWith(
        "ERC20: value doesn't match to mintingFee",
      );
    });

    it("Should fail to mint tokens to the zero address", async function () {
      await expect(myToken.mint(ZERO_ADDRESS, { value: ethers.parseEther("1") })).to.be.revertedWith(
        "ERC20: mint to the zero address",
      );
    });
  });
});
