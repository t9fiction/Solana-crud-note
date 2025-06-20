"use client";
import { IDL, PROGRAM_ID } from "@/constants";
import { AnchorProvider, Program, Idl } from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import React, { useEffect } from "react";
import Swal from "sweetalert2";

// Define Note type with publicKey for unique key
interface Note {
  publicKey: PublicKey;
  author: PublicKey;
  title: string;
  content: string;
  created_at: number;
  last_updated: number;
}

const Hero = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [notes, setNotes] = React.useState<Note[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState<string>("");
  const [content, setContent] = React.useState<string>("");
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [editContent, setEditContent] = React.useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = React.useState<Note | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [view, setView] = React.useState<"notes" | "create">("notes");

  const getProgram = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      Swal.fire({
        icon: "error",
        title: "Wallet Not Connected",
        text: "Please connect your wallet to use this app.",
        confirmButtonColor: "#2563eb",
      });
      return null;
    }
    const provider = new AnchorProvider(
      connection,
      wallet as unknown as AnchorProvider["wallet"],
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
    if (!program) return;

    setLoading(true);
    Swal.fire({
      title: "Loading Notes",
      text: "Please wait while we fetch your notes...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    setNotes([]);
    try {
      const _notes = await program.account.note.all([
        {
          memcmp: {
            offset: 8,
            bytes: wallet.publicKey ? wallet.publicKey.toBase58() : "",
          },
        },
      ]);
      const formattedNotes: Note[] = _notes.map((note) => ({
        publicKey: note.publicKey,
        author: note.account.author,
        title: note.account.title,
        content: note.account.content,
        created_at: note.account.createdAt.toNumber(),
        last_updated: note.account.lastUpdated.toNumber(),
      }));
      setNotes(formattedNotes);
      Swal.close();
    } catch (error) {
      console.error("Error loading notes:", error);
      Swal.close();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      loadNotes();
      setView("notes"); // Ensure notes view is shown on connect
    } else {
      setNotes([]);
      setView("notes"); // Default to notes view when disconnected
    }
  }, [wallet.connected, wallet.publicKey?.toBase58()]);

  // Function to create a note
  const createNote = async () => {
    const program = await getProgram();
    if (!program) return;
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }
    if (!title.trim() || !content.trim()) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "Title and content are required to create a note.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }
    if (title.length > 100) {
      Swal.fire({
        icon: "error",
        title: "Title Too Long",
        text: "Title must be less than 100 characters.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }
    if (content.length > 1000) {
      Swal.fire({
        icon: "error",
        title: "Content Too Long",
        text: "Content must be less than 1000 characters.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    try {
      const noteAddress = await getNoteAddress(title);
      if (!noteAddress) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to get note address.",
          confirmButtonColor: "#2563eb",
        });
        return;
      }
      Swal.fire({
        title: "Creating Note",
        text: "Please wait while your note is being created...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      await program.methods
        .createNote(title, content)
        .accounts({
          author: wallet.publicKey,
          note: noteAddress,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Note created successfully!",
        confirmButtonColor: "#2563eb",
      });
      setTitle("");
      setContent("");
      setView("notes"); // Return to notes view after creation
      await loadNotes();
    } catch (error) {
      console.error("Error creating note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create note. Please try again later.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  // Function to update a note
  const updateNote = async (note: Note, content: string) => {
    const program = await getProgram();
    if (!program) return;
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }
    if (!content.trim()) {
      Swal.fire({
        icon: "error",
        title: "Missing Content",
        text: "Content is required to update a note.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }
    if (content.length > 1000) {
      Swal.fire({
        icon: "error",
        title: "Content Too Long",
        text: "Content must be less than 1000 characters.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setLoading(true);
    Swal.fire({
      title: "Updating Note",
      text: "Please wait while your note is being updated...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const noteAddress = await getNoteAddress(note.title);
      if (!noteAddress) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to get note address.",
          confirmButtonColor: "#2563eb",
        });
        return;
      }
      await program.methods
        .updateNote(content)
        .accounts({
          author: wallet.publicKey,
          note: noteAddress,
        })
        .rpc();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Note updated successfully!",
        confirmButtonColor: "#2563eb",
      });
      setContent("");
      await loadNotes();
    } catch (error) {
      console.error("Error updating note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update note. Please try again later.",
        confirmButtonColor: "#2563eb",
      });
    }
    setLoading(false);
  };

  // Function to delete a note
  const deleteNote = async (note: Note) => {
    const program = await getProgram();
    if (!program) return;
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }

    setLoading(true);
    Swal.fire({
      title: "Deleting Note",
      text: "Please wait while your note is being deleted...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const noteAddress = await getNoteAddress(note.title);
      if (!noteAddress) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to get note address.",
          confirmButtonColor: "#2563eb",
        });
        return;
      }
      await program.methods
        .deleteNote()
        .accounts({
          author: wallet.publicKey,
          note: noteAddress,
        })
        .rpc();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Note deleted successfully!",
        confirmButtonColor: "#2563eb",
      });
      await loadNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete note. Please try again later.",
        confirmButtonColor: "#2563eb",
      });
    }
    setLoading(false);
  };

  // Handle create note submission with loading state
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createNote();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Solana Notes
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Securely manage your notes on the Solana blockchain
          </p>
        </header>

        {/* Wallet Connection Check */}
        {!wallet.connected && (
          <div className="mb-8 !py-2 !px-4 bg-secondary border border-yellow-200 rounded-lg shadow-sm">
            <p className=" text-error">
              Please connect your wallet to use this app.
            </p>
          </div>
        )}

        {/* Notes or Create Form based on view state */}
        {wallet.connected && view === "notes" && (
          <section>
            <div className="flex items-center justify-between !mb-6 !py-2">
              <h2 className="text-2xl font-semibold">Your Notes</h2>
              <button
                onClick={() => setView("create")}
                disabled={isSubmitting}
                className="!px-6 !py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                Create Note
              </button>
            </div>

            {/* Notes Display */}
            <div className="mt-6">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
                  <p className="ml-3 text-gray-600 dark:text-gray-400">
                    Loading notes...
                  </p>
                </div>
              )}
              {!loading && notes.length === 0 && (
                <div className="text-center !py-12 text-gray-600 dark:text-gray-400">
                  <p>No notes found. Click &quot;Create Note&quot; to add your first note!</p>
                </div>
              )}
              {!loading && notes.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {notes.map((note) => (
                    <div
                      key={note.publicKey.toBase58()}
                      className="!p-6 bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <h3 className="text-xl font-semibold !mb-3 line-clamp-1">
                        {note.title}
                      </h3>
                      <p className="!mb-4 text-gray-600 dark:text-gray-400 !line-clamp-3">
                        {note.content}
                      </p>
                      <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                        <p className="text-primary">Author: {note.author.toBase58().slice(0, 8)}...</p>
                        <p>
                          Created: {new Date(note.created_at * 1000).toLocaleString()}
                        </p>
                        <p>
                          Updated: {new Date(note.last_updated * 1000).toLocaleString()}
                        </p>
                      </div>
                      <div className="!mt-4 flex !gap-3">
                        <button
                          onClick={() => {
                            setEditingNote(note);
                            setEditContent(note.content);
                          }}
                          disabled={isSubmitting}
                          className="flex-1 !px-4 !py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(note)}
                          disabled={isSubmitting}
                          className="flex-1 px-4 py-2 bg-error text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Create Note Form */}
        {wallet.connected && view === "create" && (
          <section className="mb-12 bg-white dark:bg-accent/40 mx-auto !py-8 !px-4 !mt-12 !space-y-4 rounded-lg shadow-lg">
            <h2 className="text-2xl !pt-2 font-semibold mb-6">Create New Note</h2>
            <form onSubmit={handleCreateNote} className="space-y-6">
              <div>
                <label
                  htmlFor="create-title"
                  className="block text-3xl text-accent font-medium mb-2"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter note title (max 100 chars)"
                  maxLength={100}
                  className="w-full !px-4 !py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                  disabled={isSubmitting}
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {title.length}/100 characters
                </p>
              </div>
              <div>
                <label
                  htmlFor="create-content"
                  className="block text-3xl text-accent font-medium mb-2"
                >
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="create-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter note content (max 1000 chars)"
                  maxLength={1000}
                  rows={5}
                  className="w-full !px-4 !py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-y transition-all duration-200"
                  disabled={isSubmitting}
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {content.length}/1000 characters
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                  className="flex-1 !px-6 !py-2 !mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? "Creating..." : "Create Note"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle("");
                    setContent("");
                    setView("notes");
                  }}
                  disabled={isSubmitting}
                  className="flex-1 !px-6 !py-2 !mt-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Update Note Modal */}
        {editingNote && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-lg w-full shadow-xl">
              <h3 className="text-2xl font-semibold mb-6">
                Edit Note: {editingNote.title}
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  await updateNote(editingNote, editContent);
                  setIsSubmitting(false);
                  setEditingNote(null);
                  setEditContent("");
                }}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="edit-content"
                    className="block text-sm font-medium mb-2"
                  >
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="edit-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Enter new content (max 1000 chars)"
                    maxLength={1000}
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-y transition-all duration-200"
                    disabled={isSubmitting}
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {editContent.length}/1000 characters
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !editContent.trim()}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isSubmitting ? "Updating..." : "Update Note"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNote(null);
                      setEditContent("");
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 !p-8 rounded-lg max-w-lg w-full shadow-xl">
              <h3 className="text-2xl font-semibold mb-6">
                Delete Note: {deleteConfirm.title}
              </h3>
              <p className="!mb-6 text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this note? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setIsSubmitting(true);
                    await deleteNote(deleteConfirm);
                    setIsSubmitting(false);
                    setDeleteConfirm(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 !px-4 !py-3 bg-error text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 !px-4 !py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Ensure your wallet is connected to the Solana network.
        </footer>
      </div>
    </div>
  );
};

export default Hero;