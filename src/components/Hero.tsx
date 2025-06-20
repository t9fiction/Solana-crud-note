"use client";
import { IDL, PROGRAM_ID } from "@/constants";
import { AnchorProvider, Program, Idl } from "@project-serum/anchor";
import { set } from "@project-serum/anchor/dist/cjs/utils/features";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import React from "react";

const Hero = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [notes, setNotes] = React.useState<Note[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState<string>("");
  const [content, setContent] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const getProgram = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }
    const provider = new AnchorProvider(
      connection,
      wallet as unknown as AnchorProvider["wallet"],
      //   AnchorProvider.defaultOptions()
      {}
    );
    return new Program(IDL as Idl, PROGRAM_ID, provider);
  };

  const getNoteAddress = async (title: string) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }
    const [noteAddress] = await PublicKey.findProgramAddressSync(
      [Buffer.from("note"), wallet.publicKey.toBuffer(), Buffer.from(title)],
      PROGRAM_ID
    );
    return noteAddress;
  };

  // Function to Load Notes
  const loadNotes = async () => {
    const program = await getProgram();
    console.log(program, "Program");
    if (!program) return;

    setLoading(true);
    setNotes([]); // Clear previous notes
    try {
      /**
       * Following will fetch all notes
       * const notes = await program.account.note.all();
       */

      // Fetch and Filter notes by the user's public key
      const _notes = await program.account.note.all([
        {
          memcmp: {
            offset: 8, // Skip the discriminator
            bytes: wallet.publicKey ? wallet.publicKey.toBase58() : "", // Filter by the user's public key
          },
        },
      ]);
      // Map the notes to match the Note type
      const formattedNotes: Note[] = _notes.map((note) => ({
        author: note.account.author,
        title: note.account.title,
        content: note.account.content,
        created_at: note.account.createdAt.toNumber(),
        last_updated: note.account.lastUpdated.toNumber(),
      }));
      setNotes(formattedNotes);
      console.log("Notes:", formattedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      setError("Failed to load notes. Please try again later.");
    }
    setLoading(false);
  };

  // Function to create a note
  const createNote = async () => {
    const program = await getProgram();
    if (!program) return;
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }
    if (!title.trim() || !content.trim()) {
      // Check if title and content are provided
      setError("Title and content are required to create a note.");
      return;
    }
    if (title.length > 100) {
      // Check if title exceeds 100 characters
      setError("Title must be less than 100 characters.");
      return;
    }
    if (content.length > 1000) {
      // Check if content exceeds 1000 characters
      setError("Content must be less than 1000 characters.");
      return;
    }

    try {
      const noteAddress = await getNoteAddress(title);
      if (!noteAddress) {
        setError("Failed to get note address.");
        return;
      }
      const tx = await program.methods
        .createNote(title, content)
        .accounts({
          author: wallet.publicKey,
          note: noteAddress,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setMsg("Note created successfully!");
      console.log("Transaction Signature:", tx);
      setTitle(""); // Clear title input
      setContent(""); // Clear content input
      setError(null); // Clear any previous error
      await loadNotes(); // Reload notes after creation
    } catch (error) {
      console.error("Error creating note:", error);
      setError("Failed to create note. Please try again later.");
    }
  };

  // Function to update a note
  // Function to delete a note

  console.log("Notes", notes);
  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">
        Welcome to the Solana Notes App
      </h1>
      <p className="text-lg mb-6">
        This app allows you to create, update, and delete notes on the Solana
        blockchain.
      </p>
      <button
        onClick={loadNotes}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Load Notes
      </button>
      <div className="mt-6">
        {loading && <p className="text-gray-500">Loading notes...</p>}
        {!loading && notes.length === 0 && (
          <p className="text-gray-500">No notes found.</p>
        )}
        {!loading && notes.length > 0 && (
          <div className="space-y-4">
            {notes.map((note, index) => (
              <div
                key={index} // Use author PublicKey as key
                className="p-4 border rounded shadow-sm"
              >
                <h2 className="text-xl font-semibold">{note.title}</h2>
                <p className="text-gray-700">{note.content}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Author: {note.author.toBase58().slice(0, 8)}...
                </p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(note.created_at * 1000).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Last Updated:{" "}
                  {new Date(note.last_updated * 1000).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Note: Ensure your wallet is connected to the Solana network.
      </p>
    </div>
  );
};

export default Hero;
