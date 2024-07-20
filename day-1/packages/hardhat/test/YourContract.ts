import { expect } from "chai";
import { ethers } from "hardhat";
import { YourContract } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("YourContract", function () {
  // We define a fixture to reuse the same setup in every test.
  let account1: HardhatEthersSigner;
  let account2: HardhatEthersSigner;
  let account3: HardhatEthersSigner;

  let yourContract: YourContract;
  beforeEach(async () => {
    [account1, account2, account3] = await ethers.getSigners();
    const yourContractFactory = await ethers.getContractFactory("YourContract");
    yourContract = (await yourContractFactory.deploy(account1.address)) as YourContract;
    await yourContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have the right message on deploy", async function () {
      expect(await yourContract.greeting()).to.equal("Building Unstoppable Apps!!!");
    });
  });

  describe("Change owner", function () {
    it("Should allow owner to change ownership", async function () {
      await yourContract.setOwner(account2.address);
      expect(await yourContract.owner()).to.equal(account2.address);
    });

    it("Should emit OwnerChange event", async function () {
      await expect(yourContract.setOwner(account2.address))
        .to.emit(yourContract, "OwnerChange")
        .withArgs(account1.address, account2.address);
    });

    it("Should prevent non-owners from changing ownership", async function () {
      await expect(yourContract.connect(account2).setOwner(account3.address)).to.be.revertedWith("Not the Owner");
    });
  });

  describe("Set greeting", function () {
    it("Should allow setting a new message", async function () {
      const newGreeting = "Learn Scaffold-ETH 2! :)";

      const ethAmount = ethers.parseEther("1");
      await yourContract.setGreeting(newGreeting, {
        value: ethAmount,
      });
      expect(await yourContract.greeting()).to.equal(newGreeting);
    });

    it("Should allow prevent to change message if value is less than 1 ETH", async function () {
      const newGreeting = "Learn Scaffold-ETH 2! :)";

      const ethAmount = ethers.parseEther("0.5");
      await expect(
        yourContract.setGreeting(newGreeting, {
          value: ethAmount,
        }),
      ).to.be.revertedWith("Invalid paid amount");
    });
  });
});
