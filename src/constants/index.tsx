import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "H17VxY33ssugCtupfKJkNSawepVgh4RWsz7fk6CsCiA4"
);

export const IDL = {
  version: "0.1.0",
  name: "notes_app",
  instructions: [
    {
      name: "createNote",
      accounts: [
        { name: "author", isMut: true, isSigner: true },
        { name: "note", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "title", type: "string" },
        { name: "content", type: "string" },
      ],
    },
    {
      name: "updateNote",
      accounts: [
        { name: "author", isMut: true, isSigner: true },
        { name: "note", isMut: true, isSigner: false },
      ],
      args: [{ name: "content", type: "string" }],
    },
    {
      name: "deleteNote",
      accounts: [
        { name: "author", isMut: true, isSigner: true },
        { name: "note", isMut: true, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Note",
      type: {
        kind: "struct",
        fields: [
          { name: "author", type: "publicKey" },
          { name: "title", type: "string" },
          { name: "content", type: "string" },
          { name: "createdAt", type: "i64" },
          { name: "lastUpdated", type: "i64" },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "TitleTooLong",
      msg: "Title can't be more then 100 chars",
    },
    {
      code: 6001,
      name: "ContentTooLong",
      msg: "Content can't be more then 1000 chars",
    },
    { code: 6002, name: "TitleIsEmpty", msg: "Title is empty" },
    { code: 6003, name: "ContentIsEmpty", msg: "Content is empty" },
    { code: 6004, name: "Unauthorized", msg: "Unauthorized" },
    { code: 6005, name: "TitleNotFound", msg: "Title not found" },
  ],
};
