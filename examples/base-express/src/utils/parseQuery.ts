import { ParsedQs } from 'qs';
import {
  ArticleQuery,
  ArticleFeedQuery,
} from 'ws-common/domain/article.domain';

export function parseArticleQuery(query: ParsedQs): ArticleQuery {
  const { tag, author, favorited, limit, offset } = query;

  return {
    tag: tag ? String(tag) : undefined,
    author: author ? String(author) : undefined,
    favorited: favorited ? String(favorited) : undefined,
    limit: limit ? parseInt(String(limit)) : undefined,
    offset: offset ? parseInt(String(offset)) : undefined,
  };
}

export function parseArticleFeedQuery(query: ParsedQs): ArticleFeedQuery {
  const { limit, offset } = query;

  return {
    limit: limit ? parseInt(String(limit)) : undefined,
    offset: offset ? parseInt(String(offset)) : undefined,
  };
}
