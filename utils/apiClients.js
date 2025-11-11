import axios from 'axios';

// Google Books API
export const googleBooksAPI = {
  searchBooks: async (query) => {
    try {
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${process.env.GOOGLE_BOOKS_KEY}`);
      return response.data;
    } catch (error) {
      console.error('Google Books API error:', error);
      return null;
    }
  },
  getBookById: async (id) => {
    try {
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${id}?key=${process.env.GOOGLE_BOOKS_KEY}`);
      return response.data;
    } catch (error) {
      console.error('Google Books API error:', error);
      return null;
    }
  },
};

// AniList API (for manga/anime)
export const aniListAPI = {
  searchManga: async (query) => {
    const queryQL = `
      query ($search: String) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: MANGA) {
            id
            title {
              romaji
              english
            }
            description
            coverImage {
              large
            }
            chapters
            genres
          }
        }
      }
    `;

    try {
      const response = await axios.post('https://graphql.anilist.co', {
        query: queryQL,
        variables: { search: query },
      });
      return response.data.data.Page.media;
    } catch (error) {
      console.error('AniList API error:', error);
      return [];
    }
  },
  searchLightNovel: async (query) => {
    const queryQL = `
      query ($search: String) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: MANGA, format: NOVEL) {
            id
            title {
              romaji
              english
            }
            description
            coverImage {
              large
            }
            chapters
            genres
          }
        }
      }
    `;

    try {
      const response = await axios.post('https://graphql.anilist.co', {
        query: queryQL,
        variables: { search: query },
      });
      return response.data.data.Page.media;
    } catch (error) {
      console.error('AniList API error:', error);
      return [];
    }
  },
};

// MangaDex API
export const mangaDexAPI = {
  searchManga: async (query) => {
    try {
      const response = await axios.get(`https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=10`);
      return response.data.data;
    } catch (error) {
      console.error('MangaDex API error:', error);
      return [];
    }
  },
};

// ZenQuotes API for quotes (replacement for Quotable)
export const quotableAPI = {
  getRandomQuote: async () => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get('https://zenquotes.io/api/random', {
          timeout: 5000, // 5 second timeout
        });
        // ZenQuotes returns an array, map to expected format
        const data = response.data[0];
        return {
          content: data.q,
          author: data.a,
        };
      } catch (error) {
        console.error(`ZenQuotes API error (attempt ${attempt}/${maxRetries}):`, error.message);
        if (attempt === maxRetries) {
          return null;
        }
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },
  getQuotesByAuthor: async (author) => {
    // ZenQuotes doesn't support author search in free tier, return empty array
    console.warn('getQuotesByAuthor not supported with ZenQuotes API');
    return [];
  },
};

// Webtoon API (placeholder - would need actual API)
export const webtoonAPI = {
  searchWebtoons: async (query) => {
    // Placeholder implementation
    // In reality, you'd integrate with an actual webtoon API
    return [];
  },
};

// Export individual functions for backward compatibility
export const getRandomQuote = quotableAPI.getRandomQuote;
export const getRecommendations = quotableAPI.getQuotesByAuthor; // Assuming this is for recommendations

// Additional exports for book info fetching
export const fetchBookInfo = googleBooksAPI.getBookById;
export const fetchMangaInfo = aniListAPI.searchManga;
export const fetchWebtoonInfo = webtoonAPI.searchWebtoons;
