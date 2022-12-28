const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Faucet", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy({
      value: ethers.utils.parseEther("10"),
    });

    const [owner, user] = await ethers.getSigners();

    const withdrawAmount = ethers.utils.parseEther("1");

    return { faucet, owner, user, withdrawAmount };
  }

  it("should deploy and set the owner correctly", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    expect(await faucet.owner()).to.equal(owner.address);
  });

  it("should not allow withdrawals above .1 ETH at a time", async function () {
    const { faucet, withdrawAmount } = await loadFixture(
      deployContractAndSetVariables
    );
    await expect(faucet.withdraw(withdrawAmount)).to.be.reverted;
  });

  it("should allow only the owner to withdrawAll", async function () {
    const { faucet, user, owner } = await loadFixture(
      deployContractAndSetVariables
    );

    // const initialBalance = await ethers.provider.getBalance(faucet.address);
    await expect(faucet.connect(user).withdrawAll()).to.be.reverted;
    await expect(faucet.connect(owner).withdrawAll());
  });

  it("should withdraw all when invoking withdrawAll", async function () {
    const { faucet, user, owner } = await loadFixture(
      deployContractAndSetVariables
    );

    await expect(faucet.connect(owner).withdrawAll());
    const balance = await ethers.provider.getBalance(faucet.address);
    await assert.equal(balance.toString(), "0");
  });

  it("should let only the owner to destroy the contract", async function () {
    const { faucet, user, owner } = await loadFixture(
      deployContractAndSetVariables
    );

    await expect(faucet.connect(user).destroyFaucet()).to.be.reverted;
    // const codeUser = await ethers.provider.getCode(faucet.address);
    // await assert.notEqual(codeUser.toString(), "0x");

    await faucet.connect(owner).destroyFaucet();
    const code = await ethers.provider.getCode(faucet.address);
    await assert.equal(code.toString(), "0x");
  });
});
