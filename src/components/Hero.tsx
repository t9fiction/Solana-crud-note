"use client";
import { IDL, PROGRAM_ID } from "@/constants";
import { AnchorProvider, Program, Idl } from "@project-serum/anchor";
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
  const updateNote = async (note: any, content: string) => {
    const program = await getProgram();
    if (!program) return;
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }
    if (!content.trim()) {
      setError("Content is required to update a note.");
      return;
    }
    if (content.length > 1000) {
      setError("Content must be less than 1000 characters.");
      return;
    }

    setLoading(true);

    try {
      const noteAddress = await getNoteAddress(note.account.title);
      if (!noteAddress) {
        setError("Failed to get note address.");
        return;
      }
      const tx = await program.methods.updateNote(content).accounts({
        author: wallet.publicKey,
        note: noteAddress,
      }).rpc();

      setMsg("Note updated successfully!");
      setContent(""); // Clear content input
      setError(null); // Clear any previous error
      await loadNotes(); // Reload notes after update
      console.log("Transaction Signature:", tx);
    } catch (error) {
      console.error("Error updating note:", error);
      setError("Failed to update note. Please try again later.");
    }
    setLoading(false);
  };
  

  // Function to delete a note
  const deleteNote = async (note: any) => {
    const program = await getProgram();
    if (!program) return;
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }
    
    setLoading(true);

    try {
      const noteAddress = await getNoteAddress(note.account.title);
      if (!noteAddress) {
        setError("Failed to get note address.");
        return;
      }
      const tx = await program.methods.deleteNote().accounts({
        author: wallet.publicKey,
        note: noteAddress,
      }).rpc();
      setMsg("Note deleted successfully!");
      setError(null); // Clear any previous error
      await loadNotes(); // Reload notes after deletion

      console.log(tx)
    }catch (error) {
      console.error("Error deleting note:", error);
      setError("Failed to delete note. Please try again later.");
    }
    setLoading(false);
  };

  console.log("Notes", notes);
  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4 text-foreground">
        Welcome to the Solana Notes App
      </h1>
      <p className="text-lg mb-6 text-secondary">
        This app allows you to create, update, and delete notes on the Solana
        blockchain.
      </p>

      {/* Wallet Connection Check */}
      {!wallet.connected && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-800">
          <p>Please connect your wallet to use this app.</p>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-error rounded">
          <p className="text-error">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-error underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {msg && (
        <div className="mb-4 p-4 bg-green-50 border border-success rounded">
          <p className="text-success">{msg}</p>
          <button
            onClick={() => setMsg(null)}
            className="mt-2 text-sm text-success underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Note Form */}
      <div className="mb-8 p-6 border border-secondary rounded-lg shadow-sm bg-gray-50/50">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">
          Create New Note
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-2 text-foreground"
            >
              Title <span className="text-error">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title (max 100 characters)"
              maxLength={100}
              className="w-full px-3 py-2 border border-secondary rounded-md bg-background text-foreground placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
            <p className="text-sm mt-1 text-secondary">
              {title.length}/100 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium mb-2 text-foreground"
            >
              Content <span className="text-error">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter note content (max 1000 characters)"
              maxLength={1000}
              rows={5}
              className="w-full px-3 py-2 border border-secondary rounded-md bg-background text-foreground placeholder-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-colors"
            />
            <p className="text-sm mt-1 text-secondary">
              {content.length}/1000 characters
            </p>
          </div>

          <button
            onClick={createNote}
            disabled={!wallet.connected || !title.trim() || !content.trim()}
            className="px-6 py-2 text-white rounded-md transition-colors disabled:cursor-not-allowed bg-success hover:bg-success/90 disabled:bg-secondary disabled:opacity-50"
          >
            Create Note
          </button>
        </div>
      </div>

      {/* Load Notes Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-2xl font-semibold text-foreground">Your Notes</h2>
          <button
            onClick={loadNotes}
            disabled={!wallet.connected}
            className="px-4 py-2 text-white rounded-md transition-colors disabled:cursor-not-allowed bg-primary hover:bg-primary/90 disabled:bg-secondary disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load Notes"}
          </button>
        </div>

        {/* Notes Display */}
        <div className="mt-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-secondary">Loading notes...</p>
            </div>
          )}

          {!loading && notes.length === 0 && wallet.connected && (
            <div className="text-center py-8 text-secondary">
              <p>No notes found. Create your first note above!</p>
            </div>
          )}

          {!loading && notes.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note, index) => (
                <div
                  key={index}
                  className="p-4 border border-secondary rounded-lg shadow-sm bg-white/5 backdrop-blur-sm hover:shadow-md hover:bg-white/10 transition-all duration-200"
                >
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {note.title}
                  </h3>
                  <p className="mb-3 line-clamp-3 text-foreground">
                    {note.content}
                  </p>
                  <div className="text-sm space-y-1 text-secondary">
                    <p>Author: {note.author.toBase58().slice(0, 8)}...</p>
                    <p>
                      Created:{" "}
                      {new Date(note.created_at * 1000).toLocaleString()}
                    </p>
                    <p>
                      Updated:{" "}
                      {new Date(note.last_updated * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-sm text-center text-secondary">
        Note: Ensure your wallet is connected to the Solana network.
      </p>
    </div>
  );
};

export default Hero;
