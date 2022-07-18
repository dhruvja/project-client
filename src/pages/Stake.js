import React, { useState, useEffect } from "react";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import {
  Menu,
  Segment,
  Header,
  List,
  Grid,
  Card,
  Button,
  Dimmer,
  Loader,
  Modal,
  Icon,
  Form,
  Message,
  Dropdown,
  Accordion,
  Label,
} from "semantic-ui-react";
import { Redirect } from "react-router-dom";
import kp from "./keypair.json";
import general from "./idl/general.json";
import project from "./idl/project.json";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import Vaultbar from "./components/Vaultbar";
import * as spl from "@solana/spl-token";
import tokenMint from "./mint.json";
import * as anchor from "@project-serum/anchor";
import data from "./data.json";
// import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const bs58 = require("bs58");

const { SystemProgram } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const generalProgramID = new PublicKey(general.metadata.address);
const projectProgramID = new PublicKey(project.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl("devnet");

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed",
};

const connection = new Connection(network, opts.preflightCommitment);

const options = [
  {
    key: "bob",
    text: "bob",
    value: "7pTRjd48ZshMNevo5XnqrKXRrBLMdhFh36gJFcrvMjKh",
  },
  {
    key: "cas",
    text: "cas",
    value: "5MPpntM4apPSHWJhLX8xaNnWTd8zB8iGBUgzLL8arvvC",
  },
  {
    key: "admin",
    text: "admin",
    value: "GiUWC6Bx55syrpvxeiCZj9fADLyTEvv2e8kVqneuBVBg",
  },
];

const newSigs = [
  {
    key: "wallet 1",
    text: "wallet 1",
    value: "AGdZqUDzmXZYMkmv17d2MevwsNyNYkLjUsbq19eZcawg",
  },
  {
    key: "wallet 2",
    text: "wallet 2",
    value: "E5YMfUvCghB6Ynjx1kAREceoUdGn4SjATp9ohzKwua6J",
  },
  {
    key: "wallet 3",
    text: "wallet 3",
    value: "4nBkhiwMHrgBeeWrEH85rquhBZMUatmTjgcAkmJUcjoK",
  },
];

function Stake(props) {
  const [quizzes, setQuizzes] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [present, setPresent] = useState(false);
  const [initialise, setInitialise] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [index, setIndex] = useState(0);
  const [connected, setConnected] = useState(false);
  const [formValues, setFormValues] = useState({
    mintTokens: "",
    depositTokens: "",
    transferTokens: "",
    reciever: "",
    newThreshold: "",
    newTimeout: "",
  });
  const [totalTokens, setTotalTokens] = useState(0);
  const [initialSignatories, setInitialSignatories] = useState([]);
  const [newSignatories, setNewSignatories] = useState([]);
  const [oldSignatories, setOldSignatories] = useState([]);
  const [threshold, setThreshold] = useState(0);
  const [signatory, setSignatory] = useState(null);
  const [votersPresent, setVoterPresent] = useState(false);
  const [voters, setVoters] = useState([]);
  const [selectedPresent, setSelectedPresent] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [jobError, setJobError] = useState(true);
  const [applicationError, setApplicationError] = useState(true);
  const [allData, setAllData] = useState({});
  const [error, setError] = useState({
    state: false,
    message: "",
  });
  const [success, setSuccess] = useState({
    state: false,
    message: "",
  });

  // const {sendTransaction} = useWallet();

  const getProvider = () => {
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const getBalance = async (wallet) => {
    const tokenMintKey = new anchor.web3.PublicKey(tokenMint);

    let userTokenAccount = await spl.getAssociatedTokenAddress(
      tokenMintKey,
      wallet,
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    try {
      const balance = await spl.getAccount(connection, userTokenAccount);
      console.log(balance.amount.toString());
      setTotalTokens(balance.amount.toString());
    } catch (error) {
      console.log(error);
    }
  };

  const checkSolanaWalletExists = async () => {
    const { solana } = window;

    if (solana && solana.isPhantom) {
      try {
        const response = await solana.connect({ onlyIfTrusted: true });
        console.log(response.publicKey.toString());
        setWallet(response.publicKey);
        setConnected(true);
        getBalance(response.publicKey);
      } catch (error) {
        const response = await solana.connect();
        console.log(response.publicKey.toString());
        setWallet(response.publicKey);
        setConnected(true);
        getBalance(response.publicKey);
      }
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkSolanaWalletExists();
      // await getVoters();
    };
    window.addEventListener("load", onLoad);
    console.log(props.match.params.projectId);
    selectApplication(props.match.params.projectId);

    return () => window.removeEventListener("load", onLoad);
  }, []);

  const getVoters = async (projectId) => {
    const provider = getProvider();
    const program = new Program(project, projectProgramID, provider);

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        program.programId
      );

    const state = await program.account.projectParameter.fetch(projectPDA);

    setVoters(state.signatories);
    setAllData(state);
    setVoterPresent(true);
  };

  const mintTokenToAccount = async () => {
    setLoading(true);

    const tokenMintKey = new anchor.web3.PublicKey(tokenMint);
    let userTokenAccount = await spl.getAssociatedTokenAddress(
      tokenMintKey,
      wallet,
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    await getTokenAccount(userTokenAccount, tokenMintKey);

    let recentBlockhash = await connection.getRecentBlockhash();
    let transaction = new Transaction({
      recentBlockhash: recentBlockhash.blockhash,
      feePayer: wallet,
    });

    transaction.feePayer = wallet;

    transaction.add(
      spl.createMintToInstruction(
        tokenMintKey,
        userTokenAccount,
        baseAccount.publicKey,
        formValues.mintTokens,
        [],
        spl.TOKEN_PROGRAM_ID
      )
    );

    transaction.sign(baseAccount);
    let sign = await window.solana.signTransaction(transaction);
    let signature = await connection.sendRawTransaction(sign.serialize());
    const confirmed = await connection.confirmTransaction(signature);

    await getBalance(wallet);
    setLoading(false);
  };

  const getTokenAccount = async (userTokenAccount, tokenMintKey) => {
    try {
      const tokenAccount = await spl.getAccount(connection, userTokenAccount);
    } catch (error) {
      let recentBlockhash = await connection.getRecentBlockhash();
      let transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: wallet,
      });
      transaction.add(
        spl.createAssociatedTokenAccountInstruction(
          wallet,
          userTokenAccount,
          wallet,
          tokenMintKey,
          spl.TOKEN_PROGRAM_ID,
          spl.ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
      let sign = await window.solana.signTransaction(transaction);
      let signature = await connection.sendRawTransaction(sign.serialize());
      let result = await connection.confirmTransaction(
        signature,
        "This is my transaction"
      );

      console.log(result);
    }
  };

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const initializeGeneral = async () => {
    const provider = getProvider();
    const program = new Program(general, generalProgramID, provider);

    const [generalPDA, generalBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("general1")],
        program.programId
      );

    const USDCMint = new PublicKey(tokenMint);

    try {
      await program.methods
        .initialize()
        .accounts({
          baseAccount: generalPDA,
          authority: wallet,
          tokenMint: USDCMint,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) {
      const state = await program.account.generalParameter.fetch(generalPDA);
      console.log(state.tokenMint, state.authority);
    }
  };

  const createProject = async () => {
    const provider = getProvider();
    const program = new Program(project, projectProgramID, provider);
    const percentTransfer = 2;

    const projectId = selectedProject;

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        program.programId
      );

    const [projectPoolPDA, projectPoolBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("pool"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        program.programId
      );

    const USDCMint = new PublicKey(tokenMint);

    try {
      const tx = await program.methods
        .initialize(projectId, percentTransfer)
        .accounts({
          baseAccount: projectPDA,
          projectPoolAccount: projectPoolPDA,
          tokenMint: USDCMint,
          authority: wallet,
          admin: options[2].value,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      console.log(tx);
      const state = await program.account.projectParameter.fetch(projectPDA);
      console.log(state.authority.toBase58());
      await getDetails(selectedTransfer, selectedProject);
    } catch (error) {
      console.log(error);
    }
  };

  const addInitialSignatories = async () => {
    setLoading(true);
    const provider = getProvider();
    const program = new Program(project, projectProgramID, provider);

    const projectId = selectedProject;

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        program.programId
      );

    const timeLimit = 60 * 60 * 24; // 1 day

    const thresholdInNumber = parseInt(threshold);

    console.log(typeof thresholdInNumber);

    let sigs = initialSignatories;

    // initialSignatories.find((val, index) => {
    //   sigs[index] = new PublicKey(val);
    // })

    for (let i = 0; i < initialSignatories.length; i++) {
      sigs[i] = new PublicKey(initialSignatories[i]);
    }

    console.log(sigs);

    try {
      const tx = await program.methods
        .addInitialSignatories(
          projectBump,
          projectId,
          sigs,
          thresholdInNumber,
          timeLimit
        )
        .accounts({
          baseAccount: projectPDA,
        })
        .rpc();
      console.log(tx);
    } catch (error) {
      console.log(error);
    }

    await getVoters(selectedProject);

    setLoading(false);
  };

  const createAddSignatory = async () => {
    setLoading(true);
    const provider = getProvider();
    const program = new Program(project, projectProgramID, provider);

    const projectId = selectedProject;

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        program.programId
      );

    let sigs = newSignatories;

    for (let i = 0; i < newSignatories.length; i++) {
      sigs[i] = new PublicKey(newSignatories[i]);
    }

    console.log(sigs);

    try {
      const tx = await program.methods
        .addNewSignatoryProposal(projectBump, projectId, sigs)
        .accounts({
          baseAccount: projectPDA,
          authority: wallet,
        })
        .rpc();

      console.log(tx);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const createDeleteSignatory = async () => {
    setLoading(true);
    const provider = getProvider();
    const program = new Program(project, projectProgramID, provider);

    const projectId = selectedProject;

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        program.programId
      );

    let sigs = oldSignatories;

    for (let i = 0; i < oldSignatories.length; i++) {
      sigs[i] = new PublicKey(oldSignatories[i]);
    }

    console.log(sigs);

    try {
      const tx = await program.methods
        .removeSignatoryProposal(projectBump, projectId, sigs)
        .accounts({
          baseAccount: projectPDA,
          authority: wallet,
        })
        .rpc();

      console.log(tx);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const createNewThreshold = async () => {
    setLoading(true);
    const provider = getProvider();
    const program = new Program(project, projectProgramID, provider);

    const projectId = selectedProject;

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        program.programId
      );

    const currentTimestamp = new Date().getTime() / 1000;

    try {
      const tx = await program.methods
        .changeThresholdProposal(
          projectBump,
          projectId,
          formValues.newThreshold,
          currentTimestamp
        )
        .accounts({
          baseAccount: projectPDA,
          authority: wallet,
        })
        .rpc();

      console.log(tx);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const createNewTimeout = async () => {
    setLoading(true);
    const provider = getProvider();
    const program = new Program(project, projectProgramID, provider);

    const projectId = selectedProject;

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        program.programId
      );

    const timeLimit = parseInt(formValues.newTimeout) * 60 * 60 * 24;

    try {
      const tx = await program.methods
        .changeTimeLimitProposal(projectBump, projectId, timeLimit)
        .accounts({
          baseAccount: projectPDA,
          authority: wallet,
        })
        .rpc();

      console.log(tx);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const depositTokens = async () => {
    setLoading(true);
    const provider = getProvider();
    const projectProgram = new Program(project, projectProgramID, provider);
    const generalProgram = new Program(general, generalProgramID, provider);

    const projectId = selectedProject;

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        projectProgram.programId
      );

    const [projectPoolPDA, projectPoolBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("pool"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        projectProgram.programId
      );

    const [generalPDA, generalBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("general1")],
        generalProgram.programId
      );

    const USDCMint = new PublicKey(tokenMint);

    let userTokenAccount = await spl.getAssociatedTokenAddress(
      USDCMint,
      wallet,
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    let adminTokenAccount = await spl.getAssociatedTokenAddress(
      USDCMint,
      new PublicKey(options[2].value),
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    try {
      const tx = await projectProgram.methods
        .depositFunds(
          projectId,
          projectBump,
          projectPoolBump,
          generalBump,
          formValues.depositTokens
        )
        .accounts({
          baseAccount: projectPDA,
          generalAccount: generalPDA,
          projectPoolAccount: projectPoolPDA,
          tokenMint: USDCMint,
          authority: wallet,
          walletToWithdrawFrom: userTokenAccount,
          adminTokenWallet: adminTokenAccount,
          generalProgram: generalProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log(tx);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const createNewTransfer = async () => {
    setLoading(true);
    const provider = getProvider();
    const program = new Program(project, projectProgramID, provider);

    const projectId = selectedProject;

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        program.programId
      );

    const USDCMint = new PublicKey(tokenMint);

    let recieverTokenAccount = await spl.getAssociatedTokenAddress(
      USDCMint,
      new PublicKey(formValues.reciever),
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    try {
      const tx = await program.methods
        .transferAmountProposal(
          projectBump,
          projectId,
          formValues.transferTokens,
          recieverTokenAccount
        )
        .accounts({
          baseAccount: projectPDA,
          authority: wallet,
        })
        .rpc();

      console.log(tx);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const signTransfer = async () => {
    setLoading(true);
    const provider = getProvider();
    const projectProgram = new Program(project, projectProgramID, provider);
    const generalProgram = new Program(general, generalProgramID, provider);

    const projectId = selectedProject;

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        projectProgram.programId
      );

    const [projectPoolPDA, projectPoolBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("pool"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        projectProgram.programId
      );

    const [generalPDA, generalBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("general1")],
        generalProgram.programId
      );

    const USDCMint = new PublicKey(tokenMint);

    let recieverTokenAccount = await spl.getAssociatedTokenAddress(
      USDCMint,
      new PublicKey(formValues.reciever),
      false,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    try {
      const tx = await projectProgram.methods
        .signTransfer(generalBump, projectBump, projectPoolBump, projectId)
        .accounts({
          baseAccount: projectPDA,
          generalAccount: generalPDA,
          projectPoolAccount: projectPoolPDA,
          tokenMint: USDCMint,
          authority: wallet,
          walletToWithdrawFrom: recieverTokenAccount,
          generalProgram: generalProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      setSuccess({
        state: true,
        message: "You have Successfully signed the transfer",
      });

      setError({
        state: false,
        message: "",
      });

      console.log(tx);
    } catch (error) {
      const err = error.errorLogs[0].split("Error Message");

      setSuccess({
        state: false,
        message: "",
      });

      setError({
        state: true,
        message: err[1],
      });

      console.log(error);
    }

    setLoading(false);
  };

  const sign = async (key) => {
    setLoading(true);
    const provider = getProvider();
    const program = new Program(project, projectProgramID, provider);

    const projectId = selectedProject;

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        program.programId
      );

    try {
      const tx = await program.methods
        .signProposal(projectBump, projectId, key)
        .accounts({
          baseAccount: projectPDA,
          authority: wallet,
        })
        .rpc();
      console.log(tx);
      setSuccess({
        state: true,
        message: "You have Successfully signed",
      });

      setError({
        state: false,
        message: "",
      });
    } catch (error) {
      const err = error.errorLogs[0].split("Error Message");

      setSuccess({
        state: false,
        message: "",
      });

      setError({
        state: true,
        message: err[1],
      });
      console.log(Object.keys(error));
      console.log(error.errorLogs[0]);
    }

    await getVoters(selectedProject);

    setLoading(false);
  };

  const getDetails = async (jobId) => {
    const provider = getProvider();
    const projectProgram = new Program(project, projectProgramID, provider);

    const projectId = jobId;

    console.log(projectId);

    const [projectPDA, projectBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          Buffer.from(projectId.substring(0, 18)),
          Buffer.from(projectId.substring(18, 36)),
        ],
        projectProgram.programId
      );

    try {
      const state = await projectProgram.account.projectParameter.fetch(
        projectPDA
      );
      setJobError(true);
    } catch (error) {
      setJobError(false);
      console.log(error);
    }
  };

  const selectApplication = async (jobId) => {
    setSelectedProject(jobId);
    setSelectedPresent(true);
    await getDetails(jobId);
    await getVoters(jobId);

    console.log(jobId);
  };

  return (
    <div>
      <Vaultbar connection={connected} wallet={wallet} />
      <Modal
        basic
        onClose={() => setError({ state: false, message: "" })}
        open={error.state}
        size="small"
      >
        <Header icon>
          <Icon name="close" />
          Error
        </Header>
        <Modal.Content>
          <p>Error {error.message}</p>
        </Modal.Content>
        <Modal.Actions>
          <Button
            color="red"
            inverted
            onClick={() => setError({ state: false, message: "" })}
          >
            <Icon name="checkmark" /> close
          </Button>
        </Modal.Actions>
      </Modal>
      <Modal
        basic
        onClose={() => setSuccess({ state: false, message: "" })}
        open={success.state}
        size="small"
      >
        <Header icon>
          <Icon name="checkmark" />
          Success
        </Header>
        <Modal.Content>
          <p>Success {success.message}</p>
        </Modal.Content>
        <Modal.Actions>
          <Button
            color="green"
            inverted
            onClick={() => setSuccess({ state: false, message: "" })}
          >
            <Icon name="checkmark" /> close
          </Button>
        </Modal.Actions>
      </Modal>
      <Header as="h1">Staking</Header>
      <div className="content">
        <Segment className="content leftAlign">
          <Header as="h2" dividing>
            Project: {props.match.params.projectId}
          </Header>
          <Message color="teal">
            <Message.Header>Total Tokens: {totalTokens} </Message.Header>
          </Message>
          {success.state && (
            <Message success>
              <Message.Header>{success.message}</Message.Header>
            </Message>
          )}
          {error.state && (
            <Message error>
              <Message.Header>Error {error.message}</Message.Header>
            </Message>
          )}
          {votersPresent && (
            <Message color="teal">
              <Message.Header>Total voters: {voters.length} </Message.Header>
              <Message.Header>Threshold: {allData.threshold} </Message.Header>
              <Message.Header>
                Time out: {Math.round(allData.timeLimit / (60 * 60 * 24))} days{" "}
              </Message.Header>
              <Message.Header>
                Staked Amount: {allData.stakedAmount}{" "}
              </Message.Header>
            </Message>
          )}
          {/* {selectedPresent &&
            (!jobError ? (
              <Message color="teal">
                <Message.Header>
                  The project with id: {selectedProject} has not been created
                  yet
                </Message.Header>
              </Message>
            ) : !applicationError ? (
              <Message color="teal">
                <Message.Header>
                  The transfer with id: {selectedTransfer} has not been created
                  yet but the project has been created
                </Message.Header>
              </Message>
            ) : (
              <Message color="teal">
                <Message.Header>
                  Both project and transfer have been created, you can stake now
                </Message.Header>
              </Message>
            ))} */}
          {/* <Header as="h2">Current Project</Header>
          <p>{props.match.params.projectId}</p> */}
          <Header as="h2">Signatories List</Header>
          {votersPresent &&
            voters.map((val, index) => {
              return <p>{val.key.toBase58()}</p>;
            })}

          <br />
          <Button onClick={initializeGeneral}>
            Initialize General Program
          </Button>
          <br /><br />
          <Button onClick={createProject} primary>
            Create Project
          </Button>
          <br />
          <br />
          <Form>
            <Form.Field>
              <label>Enter Threshold</label>
              <input
                placeholder="Enter the threshold"
                type="number"
                name="threshold"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              <label>Add Initial Signatories</label>
              <Dropdown
                placeholder="Skills"
                fluid
                multiple
                selection
                options={options}
                onChange={(e, { value }) => setInitialSignatories(value)}
              />
            </Form.Field>
            {loading ? (
              <Button loading primary>
                Add Initial Signatories
              </Button>
            ) : (
              <Button onClick={addInitialSignatories} primary>
                Add Initial Signatories
              </Button>
            )}
            <br />
            <br />
            <Form.Field>
              <label>Add signatories</label>
              <Dropdown
                placeholder="New Signatories"
                fluid
                multiple
                selection
                options={newSigs}
                onChange={(e, { value }) => setNewSignatories(value)}
              />
            </Form.Field>
            {loading ? (
              <Button loading>Add Signatories</Button>
            ) : (
              <Button onClick={createAddSignatory}>Add Signatories</Button>
            )}
            <Button onClick={() => sign("add")} primary>
              Sign for adding
            </Button>
            <br />
            <br />
            <Form.Field>
              <label>Remove signatories</label>
              <Dropdown
                placeholder="Old Signatories"
                fluid
                multiple
                selection
                options={newSigs}
                onChange={(e, { value }) => setOldSignatories(value)}
              />
            </Form.Field>
            {loading ? (
              <Button loading>Remove Signatories</Button>
            ) : (
              <Button onClick={createDeleteSignatory}>
                Remove Signatories
              </Button>
            )}
            <Button onClick={() => sign("delete")} primary>
              Sign for removing
            </Button>
            <br />
            <br />
            <Form.Field>
              <label>Change Threshold</label>
              <input
                placeholder="change threshold"
                type="number"
                name="newThreshold"
                value={formValues.newThreshold}
                onChange={handleChange}
              />
            </Form.Field>
            {loading ? (
              <Button loading>Create new threshold proposal</Button>
            ) : (
              <Button onClick={createNewThreshold}>
                Create new threshold proposal
              </Button>
            )}
            <Button onClick={() => sign("change threshold")} primary>
              Sign for changing threshold
            </Button>
            <br />
            <br />
            <Form.Field>
              <label>Change Timeout</label>
              <input
                placeholder="change Timeout"
                type="number"
                name="newTimeout"
                value={formValues.newTimeout}
                onChange={handleChange}
              />
            </Form.Field>
            {loading ? (
              <Button loading>Create new Timeout proposal</Button>
            ) : (
              <Button onClick={createNewTimeout}>
                Create new Timeout proposal
              </Button>
            )}
            <Button onClick={() => sign("change time limit")} primary>
              Sign for changing Timeout
            </Button>
            <br />
            <br />
            <Form.Field>
              <label>Enter amount of tokens to mint</label>
              <input
                placeholder="Enter amount of tokens"
                type="number"
                name="mintTokens"
                value={formValues.mintTokens}
                onChange={handleChange}
              />
            </Form.Field>
            {loading ? (
              <Button loading primary>
                Mint Tokens
              </Button>
            ) : (
              <Button onClick={mintTokenToAccount} primary>
                Mint Tokens
              </Button>
            )}
            <br />
            <br />
            <Form.Field>
              <label>Enter amount of tokens to deposit</label>
              <input
                placeholder="Enter amount of tokens"
                type="number"
                name="depositTokens"
                value={formValues.depositTokens}
                onChange={handleChange}
              />
            </Form.Field>
            {loading ? (
              <Button loading primary>
                Deposit Tokens
              </Button>
            ) : (
              <Button onClick={depositTokens} primary>
                Deposit Tokens
              </Button>
            )}
            <br />
            <br />
            <Header as="h2">Make a transfer</Header>
            <Form.Field>
              <label>Enter amount of tokens to Transfer</label>
              <input
                placeholder="Enter amount of tokens"
                type="number"
                name="transferTokens"
                value={formValues.transferTokens}
                onChange={handleChange}
              />
            </Form.Field>
            <Form.Field>
              <label>Enter the account to which it has to be transfered</label>
              <input
                placeholder="Enter the account"
                name="reciever"
                value={formValues.reciever}
                onChange={handleChange}
              />
            </Form.Field>
            {loading ? (
              <Button loading>Create new Transfer proposal</Button>
            ) : (
              <Button onClick={createNewTransfer}>
                Create new Transfer proposal
              </Button>
            )}
            <Button onClick={signTransfer} primary>
              Sign for changing Transfer
            </Button>
            <br />
            <br />
          </Form>
        </Segment>
      </div>
    </div>
  );
}

export default Stake;
