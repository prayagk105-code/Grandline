import { apiClient } from './api/apiClient';
import type { ApiResponse, BookDto, IdeaItemDto, PersonalNoteDto, SavedQuoteDto } from '../types/api';

export interface CreateBookPayload {
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: string;
  rating: number;
  coverImageUrl?: string;
  startedDate?: string;
  finishedDate?: string;
  keyLessons?: string;
}

export interface UpdateBookProgressPayload {
  currentPage: number;
  keyLessons?: string;
  status?: string;
}

export interface CreatePersonalNotePayload {
  bookId?: string | null;
  title: string;
  content: string;
  category: string;
  tags?: string;
  isFavorite: boolean;
}

export interface CreateIdeaPayload {
  title: string;
  description?: string;
  category: string;
  status: string;
}

export interface CreateQuotePayload {
  bookId?: string | null;
  quoteText: string;
  author: string;
  source?: string;
  isFavorite: boolean;
  tags?: string;
}

export const knowledgeService = {
  async getBooks(status?: string): Promise<BookDto[]> {
    const res = await apiClient.get<ApiResponse<BookDto[]>>('/knowledge/books', { params: { status } });
    return res.data.data;
  },

  async getBookById(id: string): Promise<BookDto> {
    const res = await apiClient.get<ApiResponse<BookDto>>(`/knowledge/books/${id}`);
    return res.data.data;
  },

  async createBook(payload: CreateBookPayload): Promise<BookDto> {
    const res = await apiClient.post<ApiResponse<BookDto>>('/knowledge/books', payload);
    return res.data.data;
  },

  async updateBookProgress(id: string, payload: UpdateBookProgressPayload): Promise<BookDto> {
    const res = await apiClient.put<ApiResponse<BookDto>>(`/knowledge/books/${id}/progress`, payload);
    return res.data.data;
  },

  async removeBook(id: string): Promise<void> {
    await apiClient.delete(`/knowledge/books/${id}`);
  },

  async getNotes(category?: string, bookId?: string, search?: string): Promise<PersonalNoteDto[]> {
    const res = await apiClient.get<ApiResponse<PersonalNoteDto[]>>('/knowledge/notes', {
      params: { category, bookId, search }
    });
    return res.data.data;
  },

  async createNote(payload: CreatePersonalNotePayload): Promise<PersonalNoteDto> {
    const res = await apiClient.post<ApiResponse<PersonalNoteDto>>('/knowledge/notes', payload);
    return res.data.data;
  },

  async removeNote(id: string): Promise<void> {
    await apiClient.delete(`/knowledge/notes/${id}`);
  },

  async getIdeas(status?: string): Promise<IdeaItemDto[]> {
    const res = await apiClient.get<ApiResponse<IdeaItemDto[]>>('/knowledge/ideas', { params: { status } });
    return res.data.data;
  },

  async createIdea(payload: CreateIdeaPayload): Promise<IdeaItemDto> {
    const res = await apiClient.post<ApiResponse<IdeaItemDto>>('/knowledge/ideas', payload);
    return res.data.data;
  },

  async updateIdeaStatus(id: string, status: string): Promise<IdeaItemDto> {
    const res = await apiClient.put<ApiResponse<IdeaItemDto>>(`/knowledge/ideas/${id}/status`, null, { params: { status } });
    return res.data.data;
  },

  async removeIdea(id: string): Promise<void> {
    await apiClient.delete(`/knowledge/ideas/${id}`);
  },

  async getQuotes(): Promise<SavedQuoteDto[]> {
    const res = await apiClient.get<ApiResponse<SavedQuoteDto[]>>('/knowledge/quotes');
    return res.data.data;
  },

  async createQuote(payload: CreateQuotePayload): Promise<SavedQuoteDto> {
    const res = await apiClient.post<ApiResponse<SavedQuoteDto>>('/knowledge/quotes', payload);
    return res.data.data;
  },

  async removeQuote(id: string): Promise<void> {
    await apiClient.delete(`/knowledge/quotes/${id}`);
  }
};

