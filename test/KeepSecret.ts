import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { KeepSecret, KeepSecret__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const f = (await ethers.getContractFactory("KeepSecret")) as KeepSecret__factory;
  const c = (await f.deploy()) as KeepSecret;
  const addr = await c.getAddress();
  return { c, addr };
}

describe("KeepSecret (mock)", function () {
  let signers: Signers;
  let c: KeepSecret;
  let addr: string;

  before(async function () {
    const [alice, bob] = await ethers.getSigners();
    signers = { alice, bob };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }
    ({ c, addr } = await deployFixture());
  });

  it("store and retrieve metadata and encrypted password handle", async function () {
    await fhevm.initializeCLIApi();
    const title = "hello";
    const data = ethers.randomBytes(32);

    const wallet = ethers.Wallet.createRandom();
    const passwordAddr = wallet.address;

    const enc = await fhevm.createEncryptedInput(addr, signers.alice.address).addAddress(passwordAddr).encrypt();

    const tx = await c.connect(signers.alice).storeSecret(title, data, enc.handles[0], enc.inputProof);
    await tx.wait();

    const ids = await c.getSecretIdsByOwner(signers.alice.address);
    expect(ids.length).to.eq(1);

    const meta = await c.getSecretMeta(ids[0]);
    expect(meta[0]).to.eq(signers.alice.address);
    expect(meta[1]).to.eq(title);

    const encPwd = await c.getEncryptedPassword(ids[0]);
    // In mock environment we only assert handle is non-zero
    expect(encPwd).to.not.eq(ethers.ZeroHash);
  });
});
