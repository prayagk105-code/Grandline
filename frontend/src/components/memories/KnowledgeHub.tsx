import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { knowledgeService } from '../../services/knowledgeService';
import type { BookDto, IdeaItemDto, PersonalNoteDto, SavedQuoteDto } from '../../types/api';

type Tab = 'books' | 'notes' | 'ideas' | 'quotes';

interface KnowledgeHubProps {
  initialTab?: Tab;
}

export const KnowledgeHub: React.FC<KnowledgeHubProps> = ({ initialTab = 'books' }) => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [books, setBooks] = useState<BookDto[]>([]);
  const [notes, setNotes] = useState<PersonalNoteDto[]>([]);
  const [ideas, setIdeas] = useState<IdeaItemDto[]>([]);
  const [quotes, setQuotes] = useState<SavedQuoteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [bookModal, setBookModal] = useState(false);
  const [bTitle, setBTitle] = useState('');
  const [bAuthor, setBAuthor] = useState('');
  const [bTotalPages, setBTotalPages] = useState(300);
  const [bCurrentPage, setBCurrentPage] = useState(0);
  const [bStatus, setBStatus] = useState('Reading');
  const [bRating, setBRating] = useState(5);
  const [bNotes, setBNotes] = useState('');

  const [noteModal, setNoteModal] = useState(false);
  const [nTitle, setNTitle] = useState('');
  const [nContent, setNContent] = useState('');
  const [nTags, setNTags] = useState('');
  const [nCategory, setNCategory] = useState('General');

  const [ideaModal, setIdeaModal] = useState(false);
  const [iTitle, setITitle] = useState('');
  const [iDescription, setIDescription] = useState('');
  const [iStatus, setIStatus] = useState('Raw');
  const [iCategory, setICategory] = useState('General');

  const [quoteModal, setQuoteModal] = useState(false);
  const [qText, setQText] = useState('');
  const [qAuthor, setQAuthor] = useState('');
  const [qTags, setQTags] = useState('Wisdom');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bData, nData, iData, qData] = await Promise.all([
        knowledgeService.getBooks(),
        knowledgeService.getNotes(),
        knowledgeService.getIdeas(),
        knowledgeService.getQuotes()
      ]);
      setBooks(bData);
      setNotes(nData);
      setIdeas(iData);
      setQuotes(qData);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load knowledge hub.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Book handlers
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim()) return;
    try {
      await knowledgeService.createBook({
        title: bTitle.trim(),
        author: bAuthor.trim(),
        totalPages: bTotalPages,
        currentPage: bCurrentPage,
        status: bStatus,
        rating: bRating,
        keyLessons: bNotes.trim() || undefined
      });
      showToast('Book added to library');
      setBookModal(false);
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleUpdateBookProgress = async (book: BookDto, newPage: number) => {
    const page = Math.max(0, Math.min(book.totalPages, newPage));
    const isCompleted = page >= book.totalPages;
    try {
      await knowledgeService.updateBookProgress(book.id, {
        currentPage: page,
        status: isCompleted ? 'Completed' : 'Reading'
      });
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  // Note handler
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nTitle.trim() || !nContent.trim()) return;
    try {
      await knowledgeService.createNote({
        title: nTitle.trim(),
        content: nContent.trim(),
        tags: nTags.trim() || undefined,
        category: nCategory,
        isFavorite: false
      });
      showToast('Note captured');
      setNoteModal(false);
      setNTitle('');
      setNContent('');
      setNTags('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  // Idea handler
  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iTitle.trim()) return;
    try {
      await knowledgeService.createIdea({
        title: iTitle.trim(),
        description: iDescription.trim() || undefined,
        status: iStatus,
        category: iCategory
      });
      showToast('Idea recorded');
      setIdeaModal(false);
      setITitle('');
      setIDescription('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  // Quote handler
  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;
    try {
      await knowledgeService.createQuote({
        quoteText: qText.trim(),
        author: qAuthor.trim() || 'Unknown',
        tags: qTags.trim() || undefined,
        isFavorite: false
      });
      showToast('Quote cataloged');
      setQuoteModal(false);
      setQText('');
      setQAuthor('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  if (loading && books.length === 0) return <LoadingSkeleton lines={5} />;
  if (error && books.length === 0) return <ErrorState message={error} onRetry={load} />;

  const qLower = searchQuery.toLowerCase();
  const filteredBooks = books.filter((b) => b.title.toLowerCase().includes(qLower) || b.author?.toLowerCase().includes(qLower));
  const filteredNotes = notes.filter((n) => n.title.toLowerCase().includes(qLower) || n.content.toLowerCase().includes(qLower) || n.tags?.toLowerCase().includes(qLower));
  const filteredIdeas = ideas.filter((i) => i.title.toLowerCase().includes(qLower) || i.description?.toLowerCase().includes(qLower));
  const filteredQuotes = quotes.filter((q) => q.quoteText.toLowerCase().includes(qLower) || q.author?.toLowerCase().includes(qLower));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Search & Sub-nav */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="chips" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`chip ${tab === 'books' ? 'on' : ''}`}
            onClick={() => setTab('books')}
          >
            Books ({books.length})
          </button>
          <button
            type="button"
            className={`chip ${tab === 'notes' ? 'on' : ''}`}
            onClick={() => setTab('notes')}
          >
            Notes ({notes.length})
          </button>
          <button
            type="button"
            className={`chip ${tab === 'ideas' ? 'on' : ''}`}
            onClick={() => setTab('ideas')}
          >
            Ideas ({ideas.length})
          </button>
          <button
            type="button"
            className={`chip ${tab === 'quotes' ? 'on' : ''}`}
            onClick={() => setTab('quotes')}
          >
            Quotes ({quotes.length})
          </button>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <input
            type="text"
            className="inp"
            placeholder="Search across all knowledge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 220, fontSize: 13, padding: '5px 10px' }}
          />

          {tab === 'books' && (
            <button
              type="button"
              className="btn pri"
              onClick={() => {
                setBTitle('');
                setBAuthor('');
                setBTotalPages(300);
                setBCurrentPage(0);
                setBStatus('Reading');
                setBookModal(true);
              }}
            >
              + Add Book
            </button>
          )}
          {tab === 'notes' && (
            <button type="button" className="btn pri" onClick={() => setNoteModal(true)}>
              + New Note
            </button>
          )}
          {tab === 'ideas' && (
            <button type="button" className="btn pri" onClick={() => setIdeaModal(true)}>
              + Capture Idea
            </button>
          )}
          {tab === 'quotes' && (
            <button type="button" className="btn pri" onClick={() => setQuoteModal(true)}>
              + Save Quote
            </button>
          )}
        </div>
      </div>

      {/* BOOKS VIEW */}
      {tab === 'books' && (
        <div>
          {filteredBooks.length === 0 ? (
            <EmptyState
              title="No Books in Library"
              description="Track what you read, log page numbers, and capture lasting wisdom."
              action={
                <button type="button" className="btn pri" onClick={() => setBookModal(true)}>
                  Add First Book
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {filteredBooks.map((b) => {
                const pct = b.totalPages > 0 ? Math.min(100, Math.round((b.currentPage / b.totalPages) * 100)) : 0;
                return (
                  <div key={b.id} className="cd" style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>{b.status}</span>
                        {b.rating && <span style={{ fontSize: 12 }}>{'⭐'.repeat(b.rating)}</span>}
                      </div>
                      <h4 style={{ margin: '0 0 2px', fontSize: 16 }}>{b.title}</h4>
                      {b.author && <p className="mut" style={{ margin: '0 0 12px', fontSize: 12 }}>by {b.author}</p>}

                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: 6, background: 'var(--bd)', borderRadius: 3, overflow: 'hidden', margin: '10px 0 6px' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--ac)' }} />
                      </div>
                      <div className="row mut" style={{ justifyContent: 'space-between', fontSize: 11 }}>
                        <span>{b.currentPage} / {b.totalPages} pages</span>
                        <span>{pct}% done</span>
                      </div>

                      {b.keyLessons && (
                        <p style={{ margin: '10px 0 0', fontSize: 12, background: 'var(--sf)', padding: '6px 10px', borderRadius: 6 }}>
                          {b.keyLessons}
                        </p>
                      )}
                    </div>

                    <div className="row" style={{ gap: 6, marginTop: 14, alignItems: 'center' }}>
                      <input
                        type="number"
                        min={0}
                        max={b.totalPages}
                        className="inp"
                        style={{ width: 70, padding: '3px 6px', fontSize: 12 }}
                        value={b.currentPage}
                        onChange={(e) => handleUpdateBookProgress(b, parseInt(e.target.value) || 0)}
                      />
                      <span className="mut" style={{ fontSize: 11 }}>page</span>
                      <div style={{ flex: 1 }} />
                      <button
                        type="button"
                        className="ib"
                        onClick={async () => {
                          if (window.confirm('Delete this book?')) {
                            await knowledgeService.removeBook(b.id);
                            load();
                          }
                        }}
                      >
                        <DayformIcon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* NOTES VIEW */}
      {tab === 'notes' && (
        <div>
          {filteredNotes.length === 0 ? (
            <EmptyState
              title="No Personal Notes"
              description="Build a second brain of timeless insights, mental models, and observations."
              action={
                <button type="button" className="btn pri" onClick={() => setNoteModal(true)}>
                  Create Note
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {filteredNotes.map((n) => (
                <div key={n.id} className="cd" style={{ padding: 18 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>{n.category}</span>
                    <button
                      type="button"
                      className="ib"
                      onClick={async () => {
                        if (window.confirm('Delete note?')) {
                          await knowledgeService.removeNote(n.id);
                          load();
                        }
                      }}
                    >
                      <DayformIcon name="trash" size={13} />
                    </button>
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: 15 }}>{n.title}</h4>
                  <p style={{ margin: '0 0 10px', fontSize: 13, whiteSpace: 'pre-line', color: 'var(--ink)' }}>{n.content}</p>
                  {n.tags && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {n.tags.split(',').map((t, idx) => (
                        <span key={idx} className="mut" style={{ fontSize: 11, background: 'var(--sf)', padding: '2px 6px', borderRadius: 4 }}>
                          #{t.trim().replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* IDEAS VIEW */}
      {tab === 'ideas' && (
        <div>
          {filteredIdeas.length === 0 ? (
            <EmptyState
              title="No Ideas Captured"
              description="Record sudden flashes of inspiration before they slip away."
              action={
                <button type="button" className="btn pri" onClick={() => setIdeaModal(true)}>
                  Capture Idea
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {filteredIdeas.map((i) => (
                <div key={i.id} className="cd" style={{ padding: 16 }}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="chip on" style={{ fontSize: 10, padding: '1px 6px' }}>{i.status}</span>
                    <button
                      type="button"
                      className="ib"
                      onClick={async () => {
                        if (window.confirm('Delete idea?')) {
                          await knowledgeService.removeIdea(i.id);
                          load();
                        }
                      }}
                    >
                      <DayformIcon name="trash" size={13} />
                    </button>
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{i.title}</h4>
                  {i.description && <p className="mut" style={{ margin: 0, fontSize: 13 }}>{i.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUOTES VIEW */}
      {tab === 'quotes' && (
        <div>
          {filteredQuotes.length === 0 ? (
            <EmptyState
              title="No Quotes Saved"
              description="Collect unforgettable words and philosophical anchors."
              action={
                <button type="button" className="btn pri" onClick={() => setQuoteModal(true)}>
                  Save Quote
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {filteredQuotes.map((q) => (
                <div key={q.id} className="cd" style={{ padding: 18, borderLeft: q.isFavorite ? '4px solid var(--ac)' : undefined }}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>{q.tags || 'Quote'}</span>
                    <button
                      type="button"
                      className="ib"
                      onClick={async () => {
                        if (window.confirm('Delete quote?')) {
                          await knowledgeService.removeQuote(q.id);
                          load();
                        }
                      }}
                    >
                      <DayformIcon name="trash" size={13} />
                    </button>
                  </div>
                  <p style={{ margin: '0 0 8px', fontStyle: 'italic', fontSize: 14 }}>"{q.quoteText}"</p>
                  {q.author && <p className="mut" style={{ margin: 0, fontSize: 12, textAlign: 'right' }}>— {q.author}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Book Modal */}
      {bookModal && (
        <div className="sheet-backdrop" onClick={() => setBookModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Add Book</h3>
            <form onSubmit={handleSaveBook} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="lbl">Book Title</label>
                <input type="text" className="inp" value={bTitle} onChange={(e) => setBTitle(e.target.value)} required />
              </div>
              <div>
                <label className="lbl">Author</label>
                <input type="text" className="inp" value={bAuthor} onChange={(e) => setBAuthor(e.target.value)} required />
              </div>
              <div className="df-grid-2">
                <div>
                  <label className="lbl">Total Pages</label>
                  <input type="number" min={1} className="inp" value={bTotalPages} onChange={(e) => setBTotalPages(parseInt(e.target.value) || 1)} required />
                </div>
                <div>
                  <label className="lbl">Current Page</label>
                  <input type="number" min={0} className="inp" value={bCurrentPage} onChange={(e) => setBCurrentPage(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="df-grid-2">
                <div>
                  <label className="lbl">Status</label>
                  <select className="inp" value={bStatus} onChange={(e) => setBStatus(e.target.value)}>
                    <option value="WantToRead">Want to Read</option>
                    <option value="Reading">Currently Reading</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Rating (1-5)</label>
                  <input type="number" min={1} max={5} className="inp" value={bRating} onChange={(e) => setBRating(parseInt(e.target.value) || 5)} />
                </div>
              </div>
              <div>
                <label className="lbl">Key Lessons / Notes</label>
                <textarea className="inp" rows={2} value={bNotes} onChange={(e) => setBNotes(e.target.value)} />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setBookModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div className="sheet-backdrop" onClick={() => setNoteModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>New Note</h3>
            <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="lbl">Title</label>
                <input type="text" className="inp" value={nTitle} onChange={(e) => setNTitle(e.target.value)} required />
              </div>
              <div>
                <label className="lbl">Category</label>
                <input type="text" className="inp" placeholder="e.g. Philosophy, Code, Strategy" value={nCategory} onChange={(e) => setNCategory(e.target.value)} />
              </div>
              <div>
                <label className="lbl">Tags (comma-separated)</label>
                <input type="text" className="inp" placeholder="stoicism, habits, mental-model" value={nTags} onChange={(e) => setNTags(e.target.value)} />
              </div>
              <div>
                <label className="lbl">Content</label>
                <textarea className="inp" rows={5} value={nContent} onChange={(e) => setNContent(e.target.value)} required />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setNoteModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Idea Modal */}
      {ideaModal && (
        <div className="sheet-backdrop" onClick={() => setIdeaModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Capture Idea</h3>
            <form onSubmit={handleSaveIdea} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="lbl">Idea Title</label>
                <input type="text" className="inp" value={iTitle} onChange={(e) => setITitle(e.target.value)} required />
              </div>
              <div className="df-grid-2">
                <div>
                  <label className="lbl">Status</label>
                  <select className="inp" value={iStatus} onChange={(e) => setIStatus(e.target.value)}>
                    <option value="Raw">Raw Thought</option>
                    <option value="Developing">Developing</option>
                    <option value="Implemented">Implemented</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Category</label>
                  <input type="text" className="inp" placeholder="e.g. Work, Creative" value={iCategory} onChange={(e) => setICategory(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="lbl">Details / Next Steps</label>
                <textarea className="inp" rows={3} value={iDescription} onChange={(e) => setIDescription(e.target.value)} />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setIdeaModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Save Idea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {quoteModal && (
        <div className="sheet-backdrop" onClick={() => setQuoteModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Save Quote</h3>
            <form onSubmit={handleSaveQuote} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="lbl">Quote Text</label>
                <textarea className="inp" rows={3} value={qText} onChange={(e) => setQText(e.target.value)} required />
              </div>
              <div>
                <label className="lbl">Author / Source</label>
                <input type="text" className="inp" placeholder="e.g. Marcus Aurelius" value={qAuthor} onChange={(e) => setQAuthor(e.target.value)} />
              </div>
              <div>
                <label className="lbl">Category / Tag</label>
                <input type="text" className="inp" value={qTags} onChange={(e) => setQTags(e.target.value)} />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setQuoteModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Catalog Quote</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
