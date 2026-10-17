-- Note links may point at tasks, books, and decks, not only at other notes,
-- so the target column cannot carry a foreign key to notes.
ALTER TABLE "note_links" DROP CONSTRAINT "note_links_targetId_fkey";
