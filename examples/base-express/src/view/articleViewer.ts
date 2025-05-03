import { ArticleDB, TagDB, UserDB } from 'ws-db';
import profileViewer from './profileViewer';

type FullArticle = ArticleDB & {
  tagList: TagDB[];
  author: UserDB & { followedBy: UserDB[] };
  _count: { favoritedBy: number };
};

export default function articleViewer(
  article: FullArticle,
  currentUser?: UserDB & { favorites: ArticleDB[] },
) {
  const favorited = currentUser
    ? currentUser.favorites.some((value) => value.slug === article.slug)
    : false;

  const tagListView = article.tagList.map((tag) => tag.tagName).sort();

  const authorView = profileViewer(article.author, currentUser);

  const articleView = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: tagListView,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: favorited,
    favoritesCount: article._count.favoritedBy,
    author: authorView,
  };
  return articleView;
}
