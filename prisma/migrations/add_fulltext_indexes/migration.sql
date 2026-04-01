-- Full-text search indexes for PostgreSQL
-- These enable fast text search across notes, tasks, and books

-- Notes: search by title and content
CREATE INDEX IF NOT EXISTS notes_fulltext_idx ON notes USING GIN (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_md, ''))
);

-- Tasks: search by title and description
CREATE INDEX IF NOT EXISTS tasks_fulltext_idx ON tasks USING GIN (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description_md, ''))
);

-- Books: search by title, author, and summary
CREATE INDEX IF NOT EXISTS books_fulltext_idx ON books USING GIN (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(author, '') || ' ' || coalesce(summary_md, ''))
);

-- Flashcards: search by front and back content
CREATE INDEX IF NOT EXISTS flashcards_fulltext_idx ON flashcards USING GIN (
  to_tsvector('english', coalesce(front_md, '') || ' ' || coalesce(back_md, ''))
);
