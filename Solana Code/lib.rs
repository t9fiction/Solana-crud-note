use anchor_lang::prelude::*;

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("H17VxY33ssugCtupfKJkNSawepVgh4RWsz7fk6CsCiA4");

#[program]
pub mod notes_app {
    use super::*;
    // Notes

    // Create Note
    pub fn create_note(ctx: Context<CreateNote>, title: String, content: String) -> Result<()> {
        let note = &mut ctx.accounts.note;
        let clock = Clock::get()?;

        require!(title.len() <= 100, NotesError::TitleTooLong);
        require!(content.len() <= 1000, NotesError::ContentTooLong);
        require!(!title.trim().is_empty(), NotesError::TitleIsEmpty);
        require!(!content.trim().is_empty(), NotesError::ContentIsEmpty);

        note.author = ctx.accounts.author.key();
        note.title = title.clone();
        note.content = content.clone();
        note.created_at = clock.unix_timestamp;
        note.last_updated = clock.unix_timestamp;

        // Log to show on solana blockchain
        msg!(
            "Note created! Title: {}, Author: {}, Created At: {}",
            note.title,
            note.author,
            note.created_at
        );

        Ok(())
    }

    // Updated Note
    pub fn update_note(ctx: Context<UpdateNote>, content: String) -> Result<()> {
        let note = &mut ctx.accounts.note;
        let clock = Clock::get()?;

        require!(
            note.author == ctx.accounts.author.key(),
            NotesError::Unauthorized
        );

        require!(content.len() <= 1000, NotesError::ContentTooLong);
        require!(!content.trim().is_empty(), NotesError::ContentIsEmpty);

        note.content = content.clone();
        note.last_updated = clock.unix_timestamp;

        msg!("Note {} updated", note.title);

        Ok(())
    }

    // Delete Note
    pub fn delete_note(ctx: Context<DeleteNote>) -> Result<()> {
        let note = &ctx.accounts.note;
        // require!(note.title == title, NotesError::TitleNotFound);
        require!(
            note.author == ctx.accounts.author.key(),
            NotesError::Unauthorized
        );

        msg!("Note {} deleted", note.title);

        Ok(())
    }

}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateNote<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        init,
        payer = author,
        space = 8 + Note::INIT_SPACE,
        seeds = [b"note", author.key().as_ref(), title.as_bytes()],
        bump,
    )]
    pub note: Account<'info, Note>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateNote<'info> {
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(
        mut,
        seeds=[b"note", author.key().as_ref(), note.title.as_bytes()],
        bump,
    )]
    pub note: Account<'info, Note>,
}

#[derive(Accounts)]
pub struct DeleteNote<'info> {
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(
        mut,
        seeds=[b"note", author.key().as_ref(), note.title.as_bytes()],
        bump,
        close = author,
    )]
    pub note: Account<'info, Note>,
}

#[account]
#[derive(InitSpace)]
pub struct Note {
    pub author: Pubkey,
    #[max_len(100)]
    pub title: String,
    #[max_len(1000)]
    pub content: String,
    pub created_at: i64,
    pub last_updated: i64,
}

// Error Codes
#[error_code]
pub enum NotesError {
    #[msg("Title can't be more then 100 chars")]
    TitleTooLong,
    #[msg("Content can't be more then 1000 chars")]
    ContentTooLong,
    #[msg("Title is empty")]
    TitleIsEmpty,
    #[msg("Content is empty")]
    ContentIsEmpty,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Title not found")]
    TitleNotFound,
}
